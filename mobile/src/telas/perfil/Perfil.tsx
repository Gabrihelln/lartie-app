import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Switch, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import DeviceInfo from 'react-native-device-info';
import { raios } from '@lartie/tokens';
import { caminhos, PREFERENCIAS_PADRAO, type PreferenciasNotificacao, type Usuario } from '@lartie/modelo';
import { formatarData, moduloVisivel, ROTULO_MODO } from '@lartie/regras';
import { AvatarDuplo } from '../../componentes/AvatarDuplo';
import { Botao } from '../../componentes/Botao';
import { Cartao, Divisoria, LinhaNavegavel, RotuloGrupo, TelaAba } from '../../componentes/Estrutura';
import { FolhaInferior } from '../../componentes/FolhaInferior';
import { Texto } from '../../componentes/Texto';
import { atualizarPreferencias } from '../../dados/gravacao';
import { useDocumento } from '../../dados/leitura';
import { useImovel, useNomes } from '../../dados/plano';
import { useSessao } from '../../dados/Sessao';
import { useAvisos } from '../../feedback/Avisos';
import { useDialogo } from '../../feedback/Dialogo';
import { excluirConta, ErroSemConexao, removerParceiro } from '../../servicos/api';
import { sair } from '../../servicos/acesso';
import { registrarErro, registrarEvento } from '../../servicos/analytics';
import { useConexao } from '../../servicos/conexao';
import { espacos, useTema } from '../../tema';
import { resumoImovel } from '../inicio/InicioCasa';

// T33 · Perfil (Perfil.dc.html). "Dados do casamento" só com o módulo casamento ativo; "Dados da
// casa nova" só com o módulo casa. Sair (T41), excluir conta (T42) e remover parceiro (T43).
// Lembretes e horário de silêncio são por usuário (3.2).

const TEXTO_A_DEFINIR = '[a definir] Esta página entra quando o domínio lartie.app existir (P13).';

function horaParaDate(hora: string) {
  const [h, m] = hora.split(':').map(Number);
  const d = new Date();
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d;
}
const dateParaHora = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

function CampoHora({ rotulo, valor, onMudar }: { rotulo: string; valor: string; onMudar: (hora: string) => void }) {
  const { cores, tema, alvoToque } = useTema();
  const [aberto, setAberto] = useState(false);
  const [rascunho, setRascunho] = useState(horaParaDate(valor));
  const abrir = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: horaParaDate(valor),
        mode: 'time',
        is24Hour: true,
        onChange: (e, d) => e.type === 'set' && d && onMudar(dateParaHora(d)),
      });
    } else {
      setRascunho(horaParaDate(valor));
      setAberto(true);
    }
  };
  return (
    <>
      <Pressable onPress={abrir} accessibilityRole="button" accessibilityLabel={`${rotulo}: ${valor}`} style={[estilos.hora, { minHeight: alvoToque, borderColor: cores.outlineSoft }]}>
        <Texto papel="metadado" cor="onSurfaceVariant">
          {rotulo}
        </Texto>
        <Texto papel="nomeItem" peso="700">
          {valor}
        </Texto>
      </Pressable>
      {Platform.OS === 'ios' ? (
        <FolhaInferior visivel={aberto} titulo={rotulo} onFechar={() => setAberto(false)}>
          <DateTimePicker
            value={rascunho}
            mode="time"
            display="spinner"
            locale="pt-BR"
            themeVariant={tema === 'escuro' ? 'dark' : 'light'}
            onChange={(_, d) => d && setRascunho(d)}
          />
          <Botao
            rotulo="Confirmar"
            larguraTotal
            onPress={() => {
              onMudar(dateParaHora(rascunho));
              setAberto(false);
            }}
          />
        </FolhaInferior>
      ) : null}
    </>
  );
}

function LinhaInterruptor({ titulo, valor, onMudar }: { titulo: string; valor: boolean; onMudar: (v: boolean) => void }) {
  const { cores, alvoToque } = useTema();
  return (
    <View style={[estilos.interruptor, { minHeight: alvoToque + espacos.space4 }]}>
      <Texto papel="nomeItem" style={estilos.flex}>
        {titulo}
      </Texto>
      <Switch
        value={valor}
        onValueChange={onMudar}
        accessibilityLabel={titulo}
        trackColor={{ true: cores.primary, false: cores.outlineSoft }}
        thumbColor={cores.surface}
        ios_backgroundColor={cores.outlineSoft}
      />
    </View>
  );
}

export function Perfil() {
  const navigation = useNavigation();
  const { casal, usuario, papel, modo } = useSessao();
  const { nome1, nome2, saudacao } = useNomes();
  const { online } = useConexao();
  const { confirmar, erroAoSalvar } = useDialogo();
  const avisos = useAvisos();
  const imovel = useImovel().dados;
  const perfil = useDocumento<Usuario>(usuario ? caminhos.usuario(usuario.uid) : null).dados;
  const prefs: PreferenciasNotificacao = perfil?.preferencias_notificacao ?? PREFERENCIAS_PADRAO;
  const conectado = !!casal?.parceiro;
  const outro = papel === 'noivo_2' ? nome1 : nome2;

  const mudarPreferencia = (campos: Partial<PreferenciasNotificacao>) => atualizarPreferencias({ ...prefs, ...campos }, () => erroAoSalvar());

  const semConexao = () =>
    confirmar({
      icone: 'semConexao',
      titulo: 'Sem conexão com a internet',
      texto: 'Esta ação precisa de internet. Confiram a conexão e tentem de novo.',
      cancelar: null,
      confirmar: 'Entendi',
    });

  // T41
  const sairDaConta = async () => {
    const ok = await confirmar({
      titulo: 'Sair da conta?',
      texto: 'O plano de vocês continua salvo. Para voltar, é só entrar com o mesmo e-mail.',
      cancelar: 'Cancelar',
      confirmar: 'Sair',
    });
    if (ok) await sair();
  };

  // T42
  const excluirTudo = async () => {
    const ok = await confirmar({
      icone: 'excluir',
      tom: 'destrutivo',
      titulo: 'Excluir a conta e todos os dados?',
      texto: `Vamos apagar o checklist, o enxoval, as listas de presentes, os convidados e as fotos.${conectado ? ` ${outro} também perde o acesso.` : ''} Isso não pode ser desfeito.`,
      textoExigido: 'EXCLUIR',
      rotuloCampo: 'Digite EXCLUIR para confirmar',
      cancelar: 'Cancelar',
      confirmar: 'Excluir tudo',
    });
    if (!ok) return;
    if (!online) return semConexao();
    try {
      await excluirConta();
      registrarEvento({ nome: 'conta_excluida', params: {} });
      await sair();
    } catch (erro) {
      if (erro instanceof ErroSemConexao) return semConexao();
      registrarErro(erro, 'excluir conta');
      await confirmar({ icone: 'erro', titulo: 'Não foi possível excluir', texto: 'Algo deu errado. Tente de novo em instantes.', cancelar: null, confirmar: 'Entendi' });
    }
  };

  // T43 (só quem criou o plano remove o parceiro)
  const parceiro = async () => {
    if (!conectado) return navigation.navigate('Convidar');
    if (papel !== 'noivo_1') return;
    const ok = await confirmar({
      icone: 'perfil',
      tom: 'destrutivo',
      titulo: `Remover ${nome2} do plano?`,
      texto: `${nome2} deixa de ver e editar o casamento e a casa nova. Vocês podem enviar um novo convite depois.`,
      cancelar: 'Cancelar',
      confirmar: 'Remover',
    });
    if (!ok) return;
    if (!online) return semConexao();
    try {
      await removerParceiro();
      registrarEvento({ nome: 'parceiro_removido', params: {} });
      avisos.mostrar({ texto: `${nome2} saiu do plano` });
    } catch (erro) {
      if (erro instanceof ErroSemConexao) return semConexao();
      registrarErro(erro, 'remover parceiro');
      avisos.mostrar({ texto: 'Não foi possível remover. Tente de novo.', tipo: 'erro' });
    }
  };

  const aDefinir = (titulo: string) => confirmar({ titulo, texto: TEXTO_A_DEFINIR, cancelar: null, confirmar: 'Entendi' });

  return (
    <TelaAba titulo="Perfil">
      <Cartao onPress={() => navigation.navigate('EditarCasal')} rotuloAcessivel={`${saudacao}. Editar nomes e foto`}>
        <View style={estilos.linhaCentro}>
          <AvatarDuplo pessoa1={{ nome: nome1 }} pessoa2={conectado || casal?.nome_2 ? { nome: nome2 } : null} tamanho={64} />
          <View style={estilos.flex}>
            <Texto papel="tituloSecao" peso="700">
              {casal?.nome_2 || conectado ? `${nome1} & ${nome2}` : nome1}
            </Texto>
            <Texto papel="metadado" cor="onSurfaceVariant">
              {conectado ? `${outro} está no plano · editam juntos` : `Convidem ${nome2} para editar junto`}
            </Texto>
          </View>
        </View>
      </Cartao>

      <RotuloGrupo texto="Nosso plano" />
      <Cartao semPadding>
        <LinhaNavegavel titulo="Modo do app" valor={ROTULO_MODO[modo]} onPress={() => navigation.navigate('ConfigModo', { origem: 'perfil' })} />
        {moduloVisivel(modo, 'checklist') ? (
          <>
            <Divisoria />
            <LinhaNavegavel
              titulo="Dados do casamento"
              valor={casal?.data_casamento ? formatarData(casal.data_casamento) : 'Data a definir'}
              onPress={() => navigation.navigate('DadosCasamento')}
            />
          </>
        ) : null}
        {moduloVisivel(modo, 'casa') ? (
          <>
            <Divisoria />
            <LinhaNavegavel
              titulo="Dados da casa nova"
              valor={imovel ? resumoImovel(imovel.tipo, imovel.quartos).replace(' de ', ', ') : null}
              onPress={() => navigation.navigate('DadosCasa')}
            />
          </>
        ) : null}
        <Divisoria />
        <LinhaNavegavel
          titulo="Parceiro(a)"
          valor={conectado ? outro : 'Convidar'}
          onPress={parceiro}
          semSeta={conectado && papel !== 'noivo_1'}
        />
      </Cartao>

      <RotuloGrupo texto="Conta" />
      <Cartao semPadding>
        <LinhaNavegavel titulo="Meus dados e senha" valor={usuario?.email ?? null} onPress={() => navigation.navigate('MeusDados')} />
        <Divisoria />
        <LinhaNavegavel titulo="Assinatura" valor="[a definir]" onPress={() => aDefinir('Assinatura')} />
      </Cartao>

      <RotuloGrupo texto="Ajuda" />
      <Cartao semPadding>
        <LinhaNavegavel titulo="Central de ajuda" onPress={() => aDefinir('Central de ajuda')} />
        <Divisoria />
        <LinhaNavegavel titulo="Termos e privacidade" onPress={() => aDefinir('Termos e privacidade')} />
      </Cartao>

      <RotuloGrupo texto="Lembretes" />
      <Cartao semPadding>
        <LinhaInterruptor titulo="Tarefas perto do prazo" valor={prefs.tarefas} onMudar={(v) => mudarPreferencia({ tarefas: v })} />
        <Divisoria />
        <LinhaInterruptor titulo="Parcelas a vencer" valor={prefs.parcelas} onMudar={(v) => mudarPreferencia({ parcelas: v })} />
        <Divisoria />
        <LinhaInterruptor titulo="Novas reservas de presentes" valor={prefs.reservas} onMudar={(v) => mudarPreferencia({ reservas: v })} />
        <Divisoria />
        <LinhaInterruptor titulo="Respostas de RSVP" valor={prefs.rsvp} onMudar={(v) => mudarPreferencia({ rsvp: v })} />
        <Divisoria />
        <View style={estilos.silencio}>
          <Texto papel="nomeItem">Horário de silêncio</Texto>
          <View style={estilos.linha}>
            <CampoHora rotulo="Início" valor={prefs.silencio_inicio} onMudar={(h) => mudarPreferencia({ silencio_inicio: h })} />
            <CampoHora rotulo="Fim" valor={prefs.silencio_fim} onMudar={(h) => mudarPreferencia({ silencio_fim: h })} />
          </View>
        </View>
      </Cartao>

      <Botao rotulo="Sair da conta" variante="contornado" larguraTotal onPress={sairDaConta} />
      <Botao rotulo="Excluir conta e dados" variante="destrutivo" larguraTotal onPress={excluirTudo} />
      <Texto papel="metadado" cor="onSurfaceVariant" alinhamento="center">
        Lartiê · versão {DeviceInfo.getVersion()}
      </Texto>
    </TelaAba>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  linha: { flexDirection: 'row', gap: espacos.space3 },
  linhaCentro: { flexDirection: 'row', alignItems: 'center', gap: espacos.space4 },
  interruptor: { flexDirection: 'row', alignItems: 'center', gap: espacos.space3, paddingHorizontal: espacos.space4 },
  silencio: { padding: espacos.space4, gap: espacos.space3 },
  hora: { flex: 1, borderWidth: 1, borderRadius: raios.radiusMd, paddingHorizontal: espacos.space3, paddingVertical: espacos.space2, gap: 2 },
});
