import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation } from '@react-navigation/native';
import { serverTimestamp } from '@react-native-firebase/firestore';
import { raios } from '@lartie/tokens';
import {
  estimativaBuffet,
  exportarCsv,
  formatarData,
  passaNoFiltro,
  podeLembrar,
  resumoConvidados,
  ROTULO_LADO,
  ROTULO_TIPO,
  rotuloStatusGrupo,
  statusDoGrupo,
  type FiltroConvidados,
  type StatusGrupo,
} from '@lartie/regras';
import { Botao } from '../../componentes/Botao';
import { CampoData } from '../../componentes/CampoData';
import { CampoTexto } from '../../componentes/CampoTexto';
import { CampoMoeda, formatarReais } from '../../componentes/CamposMascarados';
import { Chip } from '../../componentes/Chip';
import { Cartao } from '../../componentes/Estrutura';
import { FolhaInferior } from '../../componentes/FolhaInferior';
import { Icone } from '../../componentes/Icone';
import { Selo, type TomSelo } from '../../componentes/Selo';
import { Texto } from '../../componentes/Texto';
import { atualizar } from '../../dados/gravacao';
import { useConvidados, useGrupos, useNomes } from '../../dados/plano';
import { useSessao } from '../../dados/Sessao';
import { useAvisos } from '../../feedback/Avisos';
import { useDialogo } from '../../feedback/Dialogo';
import { EsqueletoLista } from '../../feedback/Esqueleto';
import { EstadoVazio } from '../../feedback/EstadoVazio';
import { registrarEvento } from '../../servicos/analytics';
import { useConexao } from '../../servicos/conexao';
import { espacos, useTema } from '../../tema';
import { abrirWhatsApp, useMensagensRsvp, type GrupoComId } from './comum';
import { useImportarContatos } from './ImportarContatos';
import * as C from '../../feedback/confirmacoes';

// T28 · Convidados e RSVP (Convidados.dc.html): painel, estimativa do buffet, importar contatos (T59),
// lembrar pendentes (T38, 13.6), filtros e grupos. Menu: prazo, horário e local do convite; exportar
// a lista em CSV para o buffet. Vazio: T61. Mostrado no seletor do Casamento e, no modo "casamento",
// na aba própria.

const TOM: Record<StatusGrupo['tipo'], TomSelo | null> = { confirmado: 'success', parcial: 'warning', nao_vao: 'error', sem_resposta: null };

const FILTROS: { valor: FiltroConvidados; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'confirmados', rotulo: 'Confirmados' },
  { valor: 'sem_resposta', rotulo: 'Sem resposta' },
  { valor: 'nao_vao', rotulo: 'Não vão' },
];

type Envio = { grupo: GrupoComId; texto: string };

export function Convidados() {
  const { cores, alvoToque } = useTema();
  const navigation = useNavigation();
  const { casal, casalId } = useSessao();
  const { nome1, nome2 } = useNomes();
  const { online } = useConexao();
  const { confirmar, erroAoSalvar } = useDialogo();
  const avisos = useAvisos();
  const grupos = useGrupos();
  const pessoas = useConvidados().dados;
  const mensagens = useMensagensRsvp();
  const importar = useImportarContatos();
  const [filtro, setFiltro] = useState<FiltroConvidados>('todos');
  const [buffet, setBuffet] = useState(false);
  const [menu, setMenu] = useState(false);
  const [convite, setConvite] = useState(false);
  const [envios, setEnvios] = useState<{ comWhats: Envio[]; semWhats: Envio[] } | null>(null);
  const aoFalhar = () => erroAoSalvar();

  if (grupos.carregando) return <EsqueletoLista />;
  if (grupos.dados.length === 0) {
    return (
      <>
        <EstadoVazio tipo="convidados" onPrincipal={importar.comecar} onSecundaria={() => navigation.navigate('Grupo', {})} />
        {importar.elementos}
      </>
    );
  }

  const r = resumoConvidados(pessoas);
  const comStatus = grupos.dados
    .map((g) => ({ g, status: statusDoGrupo(pessoas.filter((p) => p.grupo_id === g.id)), n: pessoas.filter((p) => p.grupo_id === g.id).length }))
    .sort((a, b) => a.g.nome.localeCompare(b.g.nome, 'pt-BR'));
  const agora = Date.now();
  const elegiveis = comStatus.filter((x) => podeLembrar({ whatsapp: x.g.whatsapp, ultimoLembrete: x.g.ultimo_lembrete_em?.toDate?.().getTime() ?? null, status: x.status }, agora));
  const semWhatsApp = comStatus.filter((x) => x.status.tipo === 'sem_resposta' && !x.g.whatsapp);
  const pendentes = elegiveis.reduce((s, x) => s + x.n, 0);
  const valorBuffet = casal?.buffet_valor_por_pessoa ?? null;
  const totalBuffet = estimativaBuffet(valorBuffet, r.confirmados);

  // T38 · "Lembrar {n} pessoas?" → WhatsApp grupo a grupo (P10).
  const lembrar = async () => {
    if (elegiveis.length === 0 && semWhatsApp.length === 0) {
      avisos.mostrar({ texto: 'Ninguém para lembrar agora. O lembrete vale 1 vez a cada 3 dias por grupo.' });
      return;
    }
    const ok = await confirmar(C.lembrarPendentes(pendentes, elegiveis.length, casal?.rsvp_prazo ? formatarData(casal.rsvp_prazo) : null, semWhatsApp.length));
    if (!ok) return;
    if (!online) return avisos.mostrar({ texto: 'Enviar lembretes precisa de internet.', tipo: 'erro' });
    try {
      const comWhats = await mensagens(elegiveis.map((x) => x.g), 'lembrete');
      const semWhats = semWhatsApp.length ? await mensagens(semWhatsApp.map((x) => x.g), 'lembrete') : [];
      setEnvios({ comWhats, semWhats });
      registrarEvento({ nome: 'lembrete_rsvp_enviado', params: { grupos: comWhats.length } });
    } catch {
      avisos.mostrar({ texto: 'Não foi possível preparar os lembretes.', tipo: 'erro' });
    }
  };

  const exportar = () => {
    setMenu(false);
    const csv = exportarCsv(grupos.dados, pessoas);
    registrarEvento({ nome: 'lista_convidados_exportada', params: { pessoas: pessoas.length } });
    Share.share({ title: 'Convidados.csv', message: csv });
  };

  const fatia = (n: number) => (r.total ? n / r.total : 0);

  return (
    <View style={estilos.conteudo}>
      <Cartao style={estilos.painel}>
        <View style={estilos.linhaCentro}>
          <Texto papel="numeroDestaque" peso="700">
            {r.total}
          </Texto>
          <Texto papel="metadado" cor="onSurfaceVariant" style={estilos.flex}>
            convidados · {r.adultos} adultos, {r.criancas} {r.criancas === 1 ? 'criança' : 'crianças'}
          </Texto>
          <Pressable onPress={() => setMenu(true)} accessibilityRole="button" accessibilityLabel="Mais opções dos convidados" style={{ minHeight: alvoToque, justifyContent: 'center' }}>
            <Icone nome="mais" cor={cores.onSurfaceVariant} />
          </Pressable>
        </View>
        <View style={[estilos.barra, { backgroundColor: cores.surfaceVariant }]} accessible accessibilityLabel={`${r.confirmados} confirmados, ${r.naoVao} não vão, ${r.semResposta} sem resposta`}>
          <View style={{ flex: fatia(r.confirmados), backgroundColor: cores.primary }} />
          <View style={{ flex: fatia(r.naoVao), backgroundColor: cores.home }} />
          <View style={{ flex: fatia(r.semResposta) }} />
        </View>
        <View style={estilos.linha}>
          {(
            [
              [r.confirmados, 'confirmados', 'primary'],
              [r.naoVao, 'não vão', 'error'],
              [r.semResposta, 'sem resposta', 'onSurface'],
            ] as const
          ).map(([n, rotulo, cor]) => (
            <View key={rotulo} style={estilos.flex}>
              <Texto papel="tituloSecao" peso="700" cor={cor}>
                {n}
              </Texto>
              <Texto papel="metadado" cor="onSurfaceVariant">
                {rotulo}
              </Texto>
            </View>
          ))}
        </View>
        <Pressable onPress={() => setBuffet(true)} accessibilityRole="button" style={[estilos.buffet, { backgroundColor: cores.primaryContainer }]}>
          <Texto papel="metadado" cor="onPrimaryContainer">
            {totalBuffet !== null ? (
              <>
                Buffet estimado: {formatarReais(valorBuffet)} × {r.confirmados} confirmados ={' '}
                <Texto papel="metadado" peso="700" cor="onPrimaryContainer">
                  {formatarReais(totalBuffet)}
                </Texto>
              </>
            ) : (
              'Informem o valor do buffet por pessoa para ver a estimativa.'
            )}
          </Texto>
        </Pressable>
      </Cartao>

      <View style={estilos.linha}>
        <View style={estilos.flex}>
          <Botao rotulo="Importar contatos" variante="contornado" larguraTotal onPress={importar.comecar} />
        </View>
        <View style={estilos.flex}>
          <Botao rotulo={`Lembrar ${pendentes} pendentes`} variante="whatsapp" larguraTotal onPress={lembrar} />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.chips}>
        {FILTROS.map((f) => (
          <Chip key={f.valor} rotulo={f.rotulo} selecionado={filtro === f.valor} onPress={() => setFiltro(f.valor)} />
        ))}
      </ScrollView>

      {comStatus
        .filter((x) => passaNoFiltro(x.status, filtro))
        .map(({ g, status, n }) => {
          const tom = TOM[status.tipo];
          return (
            <Cartao key={g.id} onPress={() => navigation.navigate('Grupo', { id: g.id })} rotuloAcessivel={`${g.nome}, ${n} pessoas, ${rotuloStatusGrupo(status)}`} style={estilos.grupo}>
              <View style={estilos.flex}>
                <Texto papel="nomeItem" peso="700">
                  {g.nome}
                </Texto>
                <Texto papel="metadado" cor="onSurfaceVariant">
                  {n} {n === 1 ? 'pessoa' : 'pessoas'} · {ROTULO_LADO(g.lado, nome1, nome2)} · {ROTULO_TIPO[g.tipo]}
                </Texto>
              </View>
              {tom ? (
                <Selo texto={rotuloStatusGrupo(status)} tom={tom} />
              ) : (
                <View style={[estilos.seloNeutro, { backgroundColor: cores.surfaceVariant }]}>
                  <Texto papel="selo" peso="700" cor="onSurfaceVariant">
                    {rotuloStatusGrupo(status)}
                  </Texto>
                </View>
              )}
            </Cartao>
          );
        })}

      {importar.elementos}

      <FolhaBuffet
        visivel={buffet}
        valor={valorBuffet}
        onFechar={() => setBuffet(false)}
        onSalvar={(v) => {
          if (casalId) atualizar(casalId, null, null, { buffet_valor_por_pessoa: v }, aoFalhar);
          setBuffet(false);
        }}
      />
      <FolhaInferior visivel={menu} onFechar={() => setMenu(false)}>
        <Botao
          rotulo="Prazo, horário e local"
          variante="tonal"
          icone="evento"
          larguraTotal
          onPress={() => {
            setMenu(false);
            setConvite(true);
          }}
        />
        <Botao rotulo="Exportar lista" variante="tonal" icone="documento" larguraTotal onPress={exportar} />
      </FolhaInferior>
      <FolhaConvite visivel={convite} onFechar={() => setConvite(false)} />
      <FolhaEnvios envios={envios} onFechar={() => setEnvios(null)} campo="ultimo_lembrete_em" />
    </View>
  );
}

function FolhaBuffet({ visivel, valor, onFechar, onSalvar }: { visivel: boolean; valor: number | null; onFechar: () => void; onSalvar: (v: number | null) => void }) {
  const [v, setV] = useState<number | null>(valor);
  useEffect(() => {
    if (visivel) setV(valor);
  }, [visivel, valor]);
  return (
    <FolhaInferior visivel={visivel} titulo="Buffet por pessoa" onFechar={onFechar}>
      <CampoMoeda rotulo="Valor por pessoa" valor={v} onMudar={setV} />
      <Texto papel="metadado" cor="onSurfaceVariant">
        A estimativa usa os confirmados e aparece também no Orçamento.
      </Texto>
      <Botao rotulo="Salvar" larguraTotal onPress={() => onSalvar(v)} />
    </FolhaInferior>
  );
}

/** Prazo do RSVP (3.16) e, no cabeçalho da confirmação (T30), o horário e o local da cerimônia. */
function FolhaConvite({ visivel, onFechar }: { visivel: boolean; onFechar: () => void }) {
  const { casal, casalId } = useSessao();
  const { erroAoSalvar } = useDialogo();
  const avisos = useAvisos();
  const [prazo, setPrazo] = useState<string | null>(null);
  const [horario, setHorario] = useState('');
  const [local, setLocal] = useState('');
  useEffect(() => {
    if (!visivel) return;
    setPrazo(casal?.rsvp_prazo ?? null);
    setHorario(casal?.horario_casamento ?? '');
    setLocal(casal?.local_casamento ?? '');
  }, [visivel, casal?.rsvp_prazo, casal?.horario_casamento, casal?.local_casamento]);
  const horarioOk = !horario || /^([01]\d|2[0-3]):[0-5]\d$/.test(horario);
  return (
    <FolhaInferior visivel={visivel} titulo="Convite" onFechar={onFechar}>
      <CampoData rotulo="Prazo para confirmar presença" valor={prazo} onMudar={setPrazo} />
      <View style={estilos.linha}>
        <View style={estilos.flex}>
          <CampoTexto
            rotulo="Horário"
            value={horario}
            onChangeText={(t) => {
              const d = t.replace(/\D/g, '').slice(0, 4);
              setHorario(d.length > 2 ? `${d.slice(0, 2)}:${d.slice(2)}` : d);
            }}
            placeholder="17:00"
            keyboardType="number-pad"
            erro={horarioOk ? null : 'Use o formato 17:00.'}
          />
        </View>
        <View style={estilos.flex2}>
          <CampoTexto rotulo="Local" value={local} onChangeText={setLocal} placeholder="Espaço Jardim" maxLength={60} />
        </View>
      </View>
      <Botao
        rotulo="Salvar"
        larguraTotal
        desativado={!horarioOk}
        onPress={() => {
          if (casalId) atualizar(casalId, null, null, { rsvp_prazo: prazo, horario_casamento: horario || null, local_casamento: local.trim() || null }, () => erroAoSalvar());
          avisos.mostrar({ texto: 'Convite salvo', tipo: 'sucesso' });
          onFechar();
        }}
      />
    </FolhaInferior>
  );
}

/**
 * Envio grupo a grupo (P10): cada "Enviar" abre o WhatsApp do grupo com a mensagem pronta e marca
 * o envio. Sem WhatsApp: copiar a mensagem para mandar à mão.
 */
export function FolhaEnvios({
  envios,
  onFechar,
  campo,
}: {
  envios: { comWhats: Envio[]; semWhats: Envio[] } | null;
  onFechar: () => void;
  campo: 'ultimo_lembrete_em' | 'convite_enviado_em';
}) {
  const { casalId } = useSessao();
  const avisos = useAvisos();
  const [feitos, setFeitos] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (envios) setFeitos(new Set());
  }, [envios]);
  const marcar = (id: string) => {
    if (casalId) atualizar(casalId, 'grupos', id, { [campo]: serverTimestamp() });
    setFeitos((s) => new Set(s).add(id));
  };
  return (
    <FolhaInferior visivel={!!envios} titulo={campo === 'ultimo_lembrete_em' ? 'Enviar lembretes' : 'Enviar convites'} onFechar={onFechar}>
      <ScrollView style={estilos.envios} contentContainerStyle={estilos.listaEnvios}>
        {envios?.comWhats.map(({ grupo, texto }) => (
          <View key={grupo.id} style={estilos.envio}>
            <Texto papel="nomeItem" style={estilos.flex} numberOfLines={1}>
              {grupo.nome}
            </Texto>
            <Botao
              rotulo={feitos.has(grupo.id) ? 'Enviado' : 'Enviar'}
              variante={feitos.has(grupo.id) ? 'texto' : 'whatsapp'}
              compacto
              onPress={() => {
                abrirWhatsApp(grupo.whatsapp!, texto);
                marcar(grupo.id);
              }}
            />
          </View>
        ))}
        {envios?.semWhats.length ? (
          <Texto papel="rotuloCampo" style={estilos.semWhats}>
            Sem WhatsApp: copiem e enviem à mão
          </Texto>
        ) : null}
        {envios?.semWhats.map(({ grupo, texto }) => (
          <View key={grupo.id} style={estilos.envio}>
            <Texto papel="nomeItem" style={estilos.flex} numberOfLines={1}>
              {grupo.nome}
            </Texto>
            <Botao
              rotulo={feitos.has(grupo.id) ? 'Copiado' : 'Copiar'}
              variante={feitos.has(grupo.id) ? 'texto' : 'tonal'}
              compacto
              onPress={() => {
                Clipboard.setString(texto);
                avisos.mostrar({ texto: 'Mensagem copiada' });
                marcar(grupo.id);
              }}
            />
          </View>
        ))}
      </ScrollView>
      <Botao rotulo="Concluir" larguraTotal onPress={onFechar} />
    </FolhaInferior>
  );
}

const estilos = StyleSheet.create({
  conteudo: { gap: espacos.space4 },
  flex: { flex: 1 },
  flex2: { flex: 2 },
  linha: { flexDirection: 'row', gap: espacos.space3, alignItems: 'flex-start' },
  linhaCentro: { flexDirection: 'row', alignItems: 'center', gap: espacos.space3 },
  painel: { gap: espacos.space3 },
  barra: { height: 10, borderRadius: raios.radiusFull, overflow: 'hidden', flexDirection: 'row' },
  buffet: { padding: espacos.space3, borderRadius: raios.radiusLg },
  chips: { gap: espacos.space2 },
  grupo: { flexDirection: 'row', alignItems: 'center', gap: espacos.space3 },
  seloNeutro: { borderRadius: raios.radiusFull, paddingHorizontal: espacos.space3, paddingVertical: espacos.space1 },
  envios: { maxHeight: 360 },
  listaEnvios: { gap: espacos.space3 },
  envio: { flexDirection: 'row', alignItems: 'center', gap: espacos.space3 },
  semWhats: { marginTop: espacos.space2 },
});
