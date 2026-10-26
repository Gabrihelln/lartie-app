import React, { useCallback, useEffect, useState } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { getIdToken } from '@react-native-firebase/auth';
import { useSessao } from '../../dados/Sessao';
import { useDialogo } from '../../feedback/Dialogo';
import { TelaEstado } from '../../feedback/TelaEstado';
import { TelaSemConexao } from '../../feedback/TelaSemConexao';
import type { ParamsRaiz } from '../../navegacao/tipos';
import { aceitarConvite, consultarConvite, ErroApi, ErroSemConexao, recusarConvite, type SituacaoConvite } from '../../servicos/api';
import { useAvisos } from '../../feedback/Avisos';
import { armazenamento } from '../../servicos/armazenamento';
import { auth } from '../../servicos/firebase';
import { Abertura } from '../acesso/Abertura';
import { AvatarDuplo } from '../../componentes/AvatarDuplo';
import { StyleSheet, View } from 'react-native';
import { espacos } from '../../tema';

// T66 · Aceitar convite (AceitarConvite.dc.html) e T53 · Convite expirado (ErroConvite.dc.html).
// Aberto pelo link do convite (lartie://convite/{codigo}; lartie.app/convite/{codigo} quando houver
// domínio). Sem conta: guarda o código e segue para T03/T04; a tela "Preparando a conta" aceita o
// convite em vez de criar um casal novo. Já logado: aceita direto.

export const CHAVE_CONVITE_PENDENTE = 'convite.pendente';
/** O convite guardado só vale para o cadastro logo em seguida (correção da Etapa 2). */
export const VALIDADE_CONVITE_PENDENTE_MS = 30 * 60 * 1000;

interface ConviteGuardado {
  codigo: string;
  nome_1: string;
  guardado_em: number;
}

export function guardarConvitePendente(codigo: string, nome1: string) {
  const c: ConviteGuardado = { codigo: codigo.toUpperCase(), nome_1: nome1, guardado_em: Date.now() };
  armazenamento.set(CHAVE_CONVITE_PENDENTE, JSON.stringify(c));
}

/** Convite guardado no T66 e ainda dentro da validade; o vencido é descartado. */
export function conviteGuardado(agora = Date.now()): ConviteGuardado | null {
  const bruto = armazenamento.getString(CHAVE_CONVITE_PENDENTE);
  if (!bruto) return null;
  try {
    const c = JSON.parse(bruto) as ConviteGuardado;
    if (c.codigo && agora - c.guardado_em < VALIDADE_CONVITE_PENDENTE_MS) return c;
  } catch {
    // formato antigo (só o código): descarta
  }
  armazenamento.remove(CHAVE_CONVITE_PENDENTE);
  return null;
}

export function convitePendente(): string | null {
  return conviteGuardado()?.codigo ?? null;
}

export function esquecerConvitePendente() {
  armazenamento.remove(CHAVE_CONVITE_PENDENTE);
}

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'sem_conexao' }
  | { tipo: 'valido'; nome_1: string; nome_2: string | null }
  | { tipo: 'invalido'; nome_1: string | null; situacao: SituacaoConvite | 'nao_encontrado' };

/** T53: "Este convite expirou". Também para convite já usado ou inexistente. */
export function TelaConviteExpirado({ nome1, onEntendi }: { nome1: string | null; onEntendi: () => void }) {
  return (
    <TelaEstado
      icone="aviso"
      fundoIcone="warningContainer"
      corIcone="warning"
      titulo="Este convite expirou"
      texto={`Convites para planejar juntos valem por 7 dias. Peça para ${nome1 ?? 'quem convidou'} enviar um novo pelo app.`}
      principal={{ rotulo: 'Entendi', onPress: onEntendi }}
    />
  );
}

export function Convite() {
  const { params } = useRoute<RouteProp<ParamsRaiz, 'Convite'>>();
  const navigation = useNavigation();
  const { usuario, casalId, casal, recarregarCasal } = useSessao();
  const { confirmar } = useDialogo();
  const avisos = useAvisos();
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' });
  const codigo = params.codigo.toUpperCase();

  const consultar = useCallback(async () => {
    setEstado({ tipo: 'carregando' });
    try {
      const r = await consultarConvite(codigo);
      setEstado(r.situacao === 'valido' ? { tipo: 'valido', nome_1: r.nome_1, nome_2: r.nome_2 } : { tipo: 'invalido', nome_1: r.nome_1, situacao: r.situacao });
    } catch (erro) {
      if (erro instanceof ErroSemConexao) setEstado({ tipo: 'sem_conexao' });
      else setEstado({ tipo: 'invalido', nome_1: null, situacao: 'nao_encontrado' });
    }
  }, [codigo]);

  useEffect(() => {
    consultar();
  }, [consultar]);

  const sair = () => {
    // Logado, o convite guardado já foi visto aqui: não volta a abrir sozinho.
    if (usuario) esquecerConvitePendente();
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate(usuario ? 'Abas' : 'BoasVindas');
  };

  if (estado.tipo === 'carregando') return <Abertura carregando />;
  if (estado.tipo === 'sem_conexao') return <TelaSemConexao onTentarDeNovo={consultar} />;
  if (estado.tipo === 'invalido') return <TelaConviteExpirado nome1={estado.nome_1} onEntendi={sair} />;

  const aceitarLogado = async () => {
    // Decisão de 26/10/2026: quem já tem um plano confirma antes de trocar. O plano atual não é apagado.
    if (casalId) {
      const nomesAtuais = casal ? (casal.nome_2 ? `${casal.nome_1} & ${casal.nome_2}` : casal.nome_1) : null;
      const trocar = await confirmar({
        icone: 'aviso',
        titulo: 'Trocar de plano?',
        texto: `Você já faz parte ${nomesAtuais ? `do plano de ${nomesAtuais}` : 'de outro plano'}. Ao aceitar, passa a ver e editar o plano de ${estado.nome_1}. O plano atual fica guardado, mas você deixa de vê-lo.`,
        cancelar: 'Manter o meu',
        confirmar: 'Aceitar e trocar',
      });
      if (!trocar) return;
    }
    try {
      await aceitarConvite(codigo);
      esquecerConvitePendente();
      if (auth().currentUser) await getIdToken(auth().currentUser!, true);
      recarregarCasal();
      sair();
    } catch (erro) {
      const codigoErro = erro instanceof ErroApi ? erro.codigo : '';
      await confirmar({
        icone: 'erro',
        titulo: codigoErro === 'casal_completo' ? 'Este plano já tem duas pessoas' : 'Não foi possível aceitar o convite',
        texto:
          codigoErro === 'proprio_casal'
            ? 'Este convite foi criado pela sua conta. Envie o link para a outra pessoa.'
            : 'Algo deu errado. Tente de novo em instantes.',
        cancelar: null,
        confirmar: 'Entendi',
      });
    }
  };

  // Ajuste da Etapa 2: convite recebido por engano. Confirma, cancela o convite e avisa quem convidou.
  const recusar = async () => {
    const ok = await confirmar({
      tom: 'destrutivo',
      titulo: 'Recusar o convite?',
      texto: `Vamos avisar ${estado.nome_1}, que pode enviar um novo convite se tiver sido engano.`,
      cancelar: 'Voltar',
      confirmar: 'Recusar',
    });
    if (!ok) return;
    try {
      await recusarConvite(codigo);
      esquecerConvitePendente();
      avisos.mostrar({ texto: 'Convite recusado' });
      sair();
    } catch (erro) {
      if (erro instanceof ErroSemConexao) avisos.mostrar({ texto: 'Sem conexão com a internet. Confira e tente de novo.', tipo: 'erro' });
      else consultar();
    }
  };

  return (
    <TelaEstado
      icone="coracao"
      fundoIcone="primaryContainer"
      corIcone="primary"
      titulo={`${estado.nome_1} convidou você para planejar juntos`}
      texto="Vocês vão ver e editar o mesmo checklist do casamento, o enxoval da casa e as listas de presentes."
      principal={
        usuario
          ? { rotulo: 'Aceitar convite', onPress: aceitarLogado }
          : {
              rotulo: 'Aceitar e criar conta',
              onPress: () => {
                guardarConvitePendente(codigo, estado.nome_1);
                navigation.navigate('CriarConta');
              },
            }
      }
      extras={[
        ...(usuario ? [] : [{ rotulo: 'Agora não', onPress: sair }]),
        { rotulo: 'Recusar convite', onPress: recusar, destrutiva: true },
      ]}
      secundaria={
        usuario
          ? { rotulo: 'Agora não', onPress: sair }
          : {
              rotulo: 'Já tenho conta',
              onPress: () => {
                guardarConvitePendente(codigo, estado.nome_1);
                navigation.navigate('Entrar', {});
              },
            }
      }
    >
      <View style={estilos.avatares}>
        <AvatarDuplo pessoa1={{ nome: estado.nome_1 }} pessoa2={estado.nome_2 ? { nome: estado.nome_2 } : null} tamanho={48} />
      </View>
    </TelaEstado>
  );
}

const estilos = StyleSheet.create({
  avatares: { alignItems: 'center', marginTop: espacos.space2 },
});
