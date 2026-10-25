import React, { useCallback, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { serverTimestamp } from '@react-native-firebase/firestore';
import type { ModoApp } from '@lartie/modelo';
import { contadorDoPasso, passoAnterior, proximoPasso, type PassoOnboarding } from '@lartie/regras';
import { BarraPassos } from '../../componentes/BarraPassos';
import { Texto } from '../../componentes/Texto';
import { atualizar } from '../../dados/gravacao';
import { useSessao } from '../../dados/Sessao';
import { useDialogo } from '../../feedback/Dialogo';
import { espacos } from '../../tema';
import { FundoAcesso } from '../acesso/FundoAcesso';

// Peças comuns do onboarding (especificação Seção 5): fundo gradient-onboarding com os anéis,
// barra de passos do modo escolhido e o avanço que salva o passo (retoma daí se o app fechar).

export type ParamsOnboarding = { [P in PassoOnboarding]: undefined } & { PermNotificacoes: undefined };
type Navegacao = NativeStackNavigationProp<ParamsOnboarding>;

/** Navegar, avançar e voltar no onboarding. Toda gravação funciona offline (fila do Firestore). */
export function useOnboarding() {
  const navigation = useNavigation<Navegacao>();
  const { casal, casalId } = useSessao();
  const { erroAoSalvar } = useDialogo();
  const modo: ModoApp = casal?.modo_app ?? 'os_dois';

  const aoFalhar = useCallback(() => {
    erroAoSalvar();
  }, [erroAoSalvar]);

  /** Grava os campos do passo e vai para o próximo do modo (o modo pode ter acabado de mudar no T06b). */
  const avancar = useCallback(
    (passo: PassoOnboarding, campos: Record<string, unknown> = {}, modoNovo?: ModoApp) => {
      if (!casalId) return;
      const m = modoNovo ?? modo;
      const proximo = proximoPasso(passo, m);
      atualizar(casalId, null, null, { ...campos, onboarding_passo: proximo ?? passo }, aoFalhar);
      if (proximo) navigation.navigate(proximo);
    },
    [casalId, modo, navigation, aoFalhar],
  );

  const voltar = useCallback(
    (passo: PassoOnboarding) => {
      if (navigation.canGoBack()) return navigation.goBack();
      const anterior = passoAnterior(passo, modo);
      if (anterior) navigation.replace(anterior);
    },
    [navigation, modo],
  );

  /** Fim do onboarding (T11 ou "Decidir depois"): a sessão leva para a tela inicial do modo. */
  const concluir = useCallback(
    (campos: Record<string, unknown> = {}) => {
      if (!casalId) return;
      atualizar(casalId, null, null, { ...campos, onboarding_concluido: true, onboarding_passo: null }, aoFalhar);
    },
    [casalId, aoFalhar],
  );

  return { navigation, casal, casalId, modo, avancar, voltar, concluir, aoFalhar };
}

/** Campos para gravar a troca do modo (as regras exigem quem e quando). */
export function camposModo(modo: ModoApp, uid: string) {
  return { modo_app: modo, modo_alterado_por: uid, modo_alterado_em: serverTimestamp() };
}

interface PropsTela {
  passo: PassoOnboarding;
  /** Modo para o contador (no T06b, o que está selecionado). */
  modo?: ModoApp | null;
  titulo: string;
  subtitulo?: string;
  semVoltar?: boolean;
  onVoltar?: () => void;
  rodape: ReactNode;
  children: ReactNode;
}

export function TelaOnboarding({ passo, modo, titulo, subtitulo, semVoltar, onVoltar, rodape, children }: PropsTela) {
  const { voltar, modo: modoCasal } = useOnboarding();
  const contador = contadorDoPasso(passo, modo === undefined ? modoCasal : modo);
  return (
    <FundoAcesso aneis rodape={rodape}>
      {contador ? (
        <BarraPassos atual={contador.atual} total={contador.total} onVoltar={semVoltar ? undefined : onVoltar ?? (() => voltar(passo))} />
      ) : null}
      <View style={estilos.cabecalho}>
        <Texto papel="tituloDestaque" accessibilityRole="header">
          {titulo}
        </Texto>
        {subtitulo ? (
          <Texto papel="corpo" cor="onSurfaceVariant">
            {subtitulo}
          </Texto>
        ) : null}
      </View>
      {children}
    </FundoAcesso>
  );
}

const estilos = StyleSheet.create({
  cabecalho: { gap: espacos.space2, marginTop: espacos.space6, marginBottom: espacos.space2 },
});
