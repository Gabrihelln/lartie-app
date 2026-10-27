import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { raios } from '@lartie/tokens';
import { caminhos, type ListaItem, type ListaPresentes, type Reserva } from '@lartie/modelo';
import {
  dataPorExtenso,
  diferencaEmDias,
  escoposOrcamento,
  FASES_CHECKLIST,
  faseAtualChecklist,
  fornecedoresFechados,
  hojeLocal,
  percentual,
  percentualUsadoNosEscopos,
  progressoCasa,
  progressoCasamento,
  proximasTarefas,
  tarefaAtrasada,
  telaInicial,
  type ModuloAtivavel,
} from '@lartie/regras';
import { AvatarDuplo } from '../../componentes/AvatarDuplo';
import { CartaoProgresso } from '../../componentes/CartaoProgresso';
import { BarraProgresso, Cartao, Divisoria, TelaAba, TituloSecao } from '../../componentes/Estrutura';
import { FabAssistente } from '../../componentes/FabAssistente';
import { Icone } from '../../componentes/Icone';
import { Selo } from '../../componentes/Selo';
import { Texto } from '../../componentes/Texto';
import { useColecao } from '../../dados/leitura';
import {
  useConvidados,
  useEntradaOrcamento,
  useFornecedores,
  useItens,
  useNomes,
  useTarefas,
  useTemNotificacaoNaoLida,
} from '../../dados/plano';
import { useSessao } from '../../dados/Sessao';
import { Esqueleto } from '../../feedback/Esqueleto';
import type { ParamsAbas, ParamsRaiz } from '../../navegacao/tipos';
import { armazenamento } from '../../servicos/armazenamento';
import { espacos, useTema } from '../../tema';
import { LinhaTarefa, useMarcarTarefa } from '../casamento/comum';
import { FolhaAtivarModulo } from './FolhaAtivarModulo';
import { InicioCasa } from './InicioCasa';
import { InicioDepois } from './InicioDepois';

// Início: uma tela por modo do app (especificação Seção 6). T12 (os dois), T12b (só casamento),
// T12c (só casa, em InicioCasa) e T12d (decidir depois, em InicioDepois). O cabeçalho é o mesmo.

export type NavegacaoInicio = CompositeNavigationProp<
  BottomTabNavigationProp<ParamsAbas, 'inicio'>,
  NativeStackNavigationProp<ParamsRaiz>
>;

/** Última visita à aba Presentes (atalho "reservas novas"). */
export const CHAVE_VISITA_PRESENTES = 'presentes.ultima_visita';

export function CabecalhoInicio() {
  const { cores, alvoToque } = useTema();
  const { casal } = useSessao();
  const { nome1, nome2, saudacao } = useNomes();
  const navigation = useNavigation<NavegacaoInicio>();
  const naoLida = useTemNotificacaoNaoLida();
  return (
    <View style={estilos.cabecalho}>
      <AvatarDuplo pessoa1={{ nome: nome1 }} pessoa2={casal?.parceiro ? { nome: nome2 } : null} tamanho={44} />
      <View style={estilos.flex}>
        <Texto papel="metadado" cor="onSurfaceVariant">
          Olá,
        </Texto>
        <Texto papel="tituloSecao" peso="700" numberOfLines={1} accessibilityRole="header">
          {saudacao}
        </Texto>
      </View>
      <Pressable
        onPress={() => navigation.navigate('Provisoria', { titulo: 'Notificações', id: 'T32', etapa: 9 })}
        accessibilityRole="button"
        accessibilityLabel={naoLida ? 'Notificações, há novidades' : 'Notificações'}
        style={[estilos.sino, { width: alvoToque, height: alvoToque, backgroundColor: cores.surface, borderColor: cores.outlineVariant }]}
      >
        <Icone nome="notificacoes" cor={cores.onSurface} />
        {naoLida ? <View style={[estilos.ponto, { backgroundColor: cores.error, borderColor: cores.surface }]} /> : null}
      </Pressable>
    </View>
  );
}

/** Cartão de contagem (T12, T12b): "Faltam {n} dias", data e cidade; sem data, "Data a definir". */
function CartaoContagem() {
  const { cores } = useTema();
  const { casal } = useSessao();
  const navigation = useNavigation<NavegacaoInicio>();
  const data = casal?.data_casamento ?? null;
  const dias = data ? Math.max(0, diferencaEmDias(hojeLocal(), data)) : null;
  return (
    <View
      style={[estilos.contagem, { backgroundColor: cores.primary }]}
      accessible={!!data}
      accessibilityLabel={data ? `Faltam ${dias} dias. ${dataPorExtenso(data)}, ${casal?.cidade ?? ''}` : undefined}
    >
      <View style={estilos.flex}>
        {data ? (
          <>
            <Texto papel="corpo" cor="onPrimary">
              Faltam
            </Texto>
            <Texto papel="numeroDestaque" peso="700" cor="onPrimary" style={estilos.numeroGrande}>
              {dias === 1 ? '1 dia' : `${dias} dias`}
            </Texto>
            <Texto papel="corpo" cor="onPrimary">
              {dataPorExtenso(data)}
              {casal?.cidade ? ` · ${casal.cidade}` : ''}
            </Texto>
          </>
        ) : (
          <>
            <Texto papel="tituloDestaque" peso="700" cor="onPrimary">
              Data a definir
            </Texto>
            <Pressable onPress={() => navigation.navigate('DadosCasamento')} accessibilityRole="link" hitSlop={8}>
              <Texto papel="corpo" peso="600" cor="onPrimary" style={estilos.sublinhado}>
                Definir data
              </Texto>
            </Pressable>
          </>
        )}
      </View>
      <Icone nome="casamento" cor={cores.onPrimary} tamanho={48} />
    </View>
  );
}

function Atalho({ numero, texto, onPress }: { numero: string; texto: string; onPress: () => void }) {
  return (
    <Cartao onPress={onPress} rotuloAcessivel={`${numero} ${texto}`} style={estilos.atalho}>
      <Texto papel="tituloDestaque" peso="700">
        {numero}
      </Texto>
      <Texto papel="metadado" cor="onSurfaceVariant">
        {texto}
      </Texto>
    </Cartao>
  );
}

function ProximasTarefas() {
  const navigation = useNavigation<NavegacaoInicio>();
  const tarefas = useTarefas().dados;
  const marcar = useMarcarTarefa('inicio');
  const lista = proximasTarefas(tarefas, hojeLocal());
  return (
    <>
      <TituloSecao titulo="Próximas tarefas" link={{ rotulo: 'Ver todas', onPress: () => navigation.navigate('casamento', { secao: 'checklist' }) }} />
      <Cartao semPadding>
        {lista.length === 0 ? (
          <View style={estilos.vazio}>
            <Texto papel="corpo" cor="onSurfaceVariant">
              Tudo em dia por aqui
            </Texto>
          </View>
        ) : (
          lista.map((t, i) => (
            <View key={t.id}>
              {i > 0 ? <Divisoria /> : null}
              <LinhaTarefa tarefa={t} onMarcar={() => marcar(t)} onAbrir={() => navigation.navigate('Tarefa', { id: t.id })} />
            </View>
          ))
        )}
      </Cartao>
    </>
  );
}

/** Contagens dos atalhos que dependem de Presentes e Convidados (Etapas 5 e 6). */
function useAtalhos() {
  const { casalId, casal, modo } = useSessao();
  const convidados = useConvidados().dados;
  const reservas = useColecao<Reserva>(casalId ? caminhos.subcolecao(casalId, 'reservas') : null).dados;
  const listas = useColecao<ListaPresentes>(casalId ? caminhos.subcolecao(casalId, 'listas_presentes') : null).dados;
  const listaItens = useColecao<ListaItem>(casalId ? caminhos.subcolecao(casalId, 'lista_itens') : null).dados;
  const { entrada } = useEntradaOrcamento();
  const visita = armazenamento.getNumber(CHAVE_VISITA_PRESENTES) ?? 0;
  const reservasNovas = reservas.filter((r) => r.criada_em && r.criada_em.toDate().getTime() > visita).length;
  const confirmados = convidados.filter((c) => c.presenca === 'vai').length;
  const totalConvidados = convidados.length || casal?.num_convidados_previsto || 0;
  const usado = percentualUsadoNosEscopos(entrada, escoposOrcamento(modo));
  const reservados = reservas.filter((r) => r.status === 'ativa' || r.status === 'recebida').reduce((s, r) => s + r.quantidade, 0);
  const naLista = listaItens.reduce((s, i) => s + i.quantidade_na_lista, 0);
  return { reservasNovas, confirmados, totalConvidados, usado, temLista: listas.length > 0, reservados, naLista };
}

/** T12 · Início: casamento e casa nova. */
function InicioOsDois() {
  const navigation = useNavigation<NavegacaoInicio>();
  const tarefas = useTarefas();
  const itens = useItens();
  const a = useAtalhos();
  if (tarefas.carregando || itens.carregando) return <Esqueleto />;
  const casamento = progressoCasamento(tarefas.dados);
  const casa = progressoCasa(itens.dados);
  return (
    <>
      <CartaoContagem />
      <View style={estilos.linha}>
        <Pressable style={estilos.flex} onPress={() => navigation.navigate('casamento', { secao: 'checklist' })} accessibilityRole="button">
          <CartaoProgresso area="casamento" rotulo="Casamento" feitos={casamento.feitos} total={casamento.total} unidade="tarefas" />
        </Pressable>
        <Pressable style={estilos.flex} onPress={() => navigation.navigate('casa')} accessibilityRole="button">
          <CartaoProgresso area="casa" rotulo="Casa nova" feitos={casa.feitos} total={casa.total} unidade="itens" />
        </Pressable>
      </View>
      <ProximasTarefas />
      <View style={estilos.linha}>
        <Atalho numero={String(a.reservasNovas)} texto="reservas novas" onPress={() => navigation.navigate('presentes')} />
        <Atalho
          numero={String(a.confirmados)}
          texto={`confirmados de ${a.totalConvidados}`}
          onPress={() => navigation.navigate('casamento', { secao: 'convidados' })}
        />
        <Atalho
          numero={a.usado === null ? '—' : `${a.usado}%`}
          texto={a.usado === null ? 'Definir orçamento' : 'do orçamento usado'}
          onPress={() => navigation.navigate('casamento', { secao: 'orcamento' })}
        />
      </View>
    </>
  );
}

/** T12b · Início: só casamento. */
function InicioCasamento() {
  const { cores } = useTema();
  const navigation = useNavigation<NavegacaoInicio>();
  const tarefas = useTarefas();
  const fornecedores = useFornecedores().dados;
  const a = useAtalhos();
  if (tarefas.carregando) return <Esqueleto />;
  const progresso = progressoCasamento(tarefas.dados);
  const fase = faseAtualChecklist(tarefas.dados);
  const hoje = hojeLocal();
  const atrasadas = tarefas.dados.filter((t) => !t.oculta && tarefaAtrasada(t, hoje)).length;
  const f = fornecedoresFechados(fornecedores);
  const pct = percentual(progresso);
  return (
    <>
      <CartaoContagem />
      <Cartao
        onPress={() => navigation.navigate('casamento', { secao: 'checklist' })}
        rotuloAcessivel={`Checklist do casamento: ${progresso.feitos} de ${progresso.total} tarefas, ${pct}%`}
        style={estilos.gap2}
      >
        <View style={estilos.linhaCentro}>
          <View style={estilos.flex}>
            <Texto papel="metadado" cor="onSurfaceVariant">
              Checklist do casamento
            </Texto>
            <Texto papel="nomeItem" peso="700">
              {progresso.feitos} de {progresso.total} tarefas
            </Texto>
          </View>
          <Texto papel="numeroDestaque" peso="700" cor="primary">
            {pct}%
          </Texto>
        </View>
        <BarraProgresso fracao={pct / 100} cor="primary" trilho="primaryTrack" />
        <View style={estilos.selos}>
          {fase ? <Selo texto={`Fase: ${FASES_CHECKLIST[fase].nome}`} tom="primary" /> : null}
          {atrasadas > 0 ? <Selo texto={atrasadas === 1 ? '1 atrasada' : `${atrasadas} atrasadas`} tom="error" /> : null}
        </View>
      </Cartao>
      <ProximasTarefas />
      <View style={estilos.linha}>
        <Atalho numero={String(a.confirmados)} texto={`confirmados de ${a.totalConvidados}`} onPress={() => navigation.navigate('convidados')} />
        <Atalho
          numero={a.usado === null ? '—' : `${a.usado}%`}
          texto={a.usado === null ? 'Definir orçamento' : 'do orçamento usado'}
          onPress={() => navigation.navigate('casamento', { secao: 'orcamento' })}
        />
        <Atalho numero={`${f.fechados} de ${f.total}`} texto="fornecedores fechados" onPress={() => navigation.navigate('casamento', { secao: 'fornecedores' })} />
      </View>
      <Cartao onPress={() => navigation.navigate('presentes')} rotuloAcessivel="Lista de presentes">
        <View style={estilos.linhaCentro}>
          <View style={[estilos.circulo, { backgroundColor: cores.primaryContainer }]}>
            <Icone nome="presentes" cor={cores.primary} />
          </View>
          <View style={estilos.flex}>
            <Texto papel="nomeItem" peso="700">
              Lista de presentes
            </Texto>
            <Texto papel="metadado" cor="onSurfaceVariant">
              {a.temLista ? `${a.reservasNovas} reservas novas · ${a.reservados} de ${a.naLista} reservados` : 'Criem a lista e compartilhem por link'}
            </Texto>
          </View>
          <Icone nome="setaDireita" cor={cores.onSurfaceVariant} />
        </View>
      </Cartao>
      <CartaoConvite
        texto="Vão montar a casa nova também?"
        onPress={() => navigation.navigate('ConfigModo', { preSelecionado: 'os_dois', origem: 'cartao' })}
      />
    </>
  );
}

/** Cartões tracejados "Vão montar a casa nova também?" (T12b) e "Vão casar também?" (T12c). */
export function CartaoConvite({ texto, onPress }: { texto: string; onPress: () => void }) {
  const { cores } = useTema();
  return (
    <Cartao tracejado fundo="background" onPress={onPress} rotuloAcessivel={texto}>
      <View style={estilos.linhaCentro}>
        <Icone nome="adicionar" cor={cores.primary} />
        <Texto papel="nomeItem" peso="600" cor="primary" style={estilos.flex}>
          {texto}
        </Texto>
        <Icone nome="setaDireita" cor={cores.primary} />
      </View>
    </Cartao>
  );
}

export function Inicio() {
  const { modo } = useSessao();
  const { params } = useRoute<RouteProp<ParamsAbas, 'inicio'>>();
  const navigation = useNavigation<NavegacaoInicio>();
  const [ativar, setAtivar] = useState<ModuloAtivavel | null>(null);
  const id = telaInicial(modo);

  // 13.9 regra 6: link para módulo oculto chega aqui com `ativar`.
  useEffect(() => {
    if (params?.ativar) {
      setAtivar(params.ativar);
      navigation.setParams({ ativar: undefined });
    }
  }, [params?.ativar, navigation]);

  const conteudo = useMemo(() => {
    switch (modo) {
      case 'os_dois':
        return <InicioOsDois />;
      case 'casamento':
        return <InicioCasamento />;
      case 'casa':
        return <InicioCasa />;
      case 'indefinido':
        return <InicioDepois />;
    }
  }, [modo]);

  return (
    <TelaAba
      cabecalho={<CabecalhoInicio />}
      onAtualizar={() => {}}
      sobreposto={
        <>
          <FabAssistente tela={id} onPress={() => navigation.navigate('Provisoria', { titulo: 'Assistente', id: 'T31', etapa: 9 })} />
          <FolhaAtivarModulo modulo={ativar} onFechar={() => setAtivar(null)} />
        </>
      }
    >
      {conteudo}
    </TelaAba>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: espacos.space3 },
  sino: { borderRadius: raios.radiusFull, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  ponto: { position: 'absolute', top: 8, right: 9, width: 10, height: 10, borderRadius: 5, borderWidth: 1.5 },
  contagem: { borderRadius: raios.radiusXl, padding: espacos.space5, flexDirection: 'row', alignItems: 'center', gap: espacos.space3 },
  numeroGrande: { marginVertical: espacos.space1 },
  sublinhado: { textDecorationLine: 'underline', marginTop: espacos.space2 },
  linha: { flexDirection: 'row', gap: espacos.space3 },
  linhaCentro: { flexDirection: 'row', alignItems: 'center', gap: espacos.space3 },
  atalho: { flex: 1, gap: espacos.space1, padding: espacos.space3 },
  vazio: { padding: espacos.space5, alignItems: 'center' },
  gap2: { gap: espacos.space3 },
  selos: { flexDirection: 'row', flexWrap: 'wrap', gap: espacos.space2 },
  circulo: { width: 48, height: 48, borderRadius: raios.radiusFull, alignItems: 'center', justifyContent: 'center' },
});
