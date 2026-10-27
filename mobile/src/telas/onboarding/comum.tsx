import React, { createContext, useCallback, useContext, useRef, type ReactNode } from 'react';
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
import { TelaPilha } from '../../componentes/Estrutura';
import { useDialogo } from '../../feedback/Dialogo';
import { useDescartarAlteracoes } from '../../feedback/useDescartarAlteracoes';
import type { OrigemModo } from '../../servicos/analytics';
import { espacos } from '../../tema';
import { FundoAcesso } from '../acesso/FundoAcesso';

// Peças comuns do onboarding (especificação Seção 5): fundo gradient-onboarding com os anéis,
// barra de passos do modo escolhido e o avanço que salva o passo (retoma daí se o app fechar).

export type ParamsOnboarding = { [P in PassoOnboarding]: undefined } & { PermNotificacoes: undefined };
type Navegacao = NativeStackNavigationProp<ParamsOnboarding>;

/**
 * As telas do onboarding também servem fora dele (Etapa 3):
 * - `ativacao`: ativar um módulo nunca gerado (T33b, T12d, cartões do Início) pede só os passos que
 *   faltam (T07 e/ou T08 + T09) e termina no T10 resumido, que troca o modo;
 * - `edicao`: Perfil › Casal, Dados do casamento e Dados da casa nova (o mesmo formulário, com Voltar
 *   e "Salvar").
 */
export type Fluxo =
  | { tipo: 'onboarding' }
  | { tipo: 'ativacao'; modo: ModoApp; passos: readonly PassoOnboarding[]; origem: OrigemModo; sair: () => void }
  | { tipo: 'edicao'; titulo: string; aoSalvar: (passo: PassoOnboarding, campos: Record<string, unknown>) => void };

const ContextoFluxo = createContext<Fluxo>({ tipo: 'onboarding' });
export const ProvedorFluxo = ContextoFluxo.Provider;
export const useFluxo = () => useContext(ContextoFluxo);

/** Navegar, avançar e voltar no onboarding. Toda gravação funciona offline (fila do Firestore). */
export function useOnboarding() {
  const navigation = useNavigation<Navegacao>();
  const { casal, casalId } = useSessao();
  const { erroAoSalvar } = useDialogo();
  const fluxo = useFluxo();
  // Na ativação, os passos e o contador seguem o modo que vai ser ativado.
  const modo: ModoApp = fluxo.tipo === 'ativacao' ? fluxo.modo : casal?.modo_app ?? 'os_dois';

  const aoFalhar = useCallback(() => {
    erroAoSalvar();
  }, [erroAoSalvar]);

  /** Grava os campos do passo e vai para o próximo do modo (o modo pode ter acabado de mudar no T06b). */
  const avancar = useCallback(
    (passo: PassoOnboarding, campos: Record<string, unknown> = {}, modoNovo?: ModoApp) => {
      if (!casalId) return;
      if (fluxo.tipo === 'edicao') return fluxo.aoSalvar(passo, campos);
      if (fluxo.tipo === 'ativacao') {
        if (Object.keys(campos).length) atualizar(casalId, null, null, campos, aoFalhar);
        const i = fluxo.passos.indexOf(passo);
        navigation.navigate(i >= 0 && i < fluxo.passos.length - 1 ? fluxo.passos[i + 1]! : 'T10');
        return;
      }
      const m = modoNovo ?? modo;
      const proximo = proximoPasso(passo, m);
      atualizar(casalId, null, null, { ...campos, onboarding_passo: proximo ?? passo }, aoFalhar);
      if (proximo) navigation.navigate(proximo);
    },
    [casalId, modo, navigation, aoFalhar, fluxo],
  );

  const voltar = useCallback(
    (passo: PassoOnboarding) => {
      if (navigation.canGoBack()) return navigation.goBack();
      // Fora do onboarding, Voltar no primeiro passo sai do fluxo (volta ao T33b, T12d ou Perfil).
      if (fluxo.tipo !== 'onboarding') return navigation.getParent()?.goBack();
      const anterior = passoAnterior(passo, modo);
      if (anterior) navigation.replace(anterior);
    },
    [navigation, modo, fluxo],
  );

  /** Fim do onboarding (T11 ou "Decidir depois"): a sessão leva para a tela inicial do modo. */
  const concluir = useCallback(
    (campos: Record<string, unknown> = {}) => {
      if (!casalId) return;
      atualizar(casalId, null, null, { ...campos, onboarding_concluido: true, onboarding_passo: null }, aoFalhar);
    },
    [casalId, aoFalhar],
  );

  const rotuloContinuar = fluxo.tipo === 'edicao' ? 'Salvar' : 'Continuar';
  return { navigation, casal, casalId, modo, avancar, voltar, concluir, aoFalhar, fluxo, rotuloContinuar };
}

/**
 * T36 nos formulários do Perfil: compara os valores com os da primeira renderização. No onboarding
 * não pergunta (os passos já ficam salvos ao avançar).
 */
export function useAlteracoes(valores: unknown[], oQue = 'estes dados', pronto = true) {
  const fluxo = useFluxo();
  const atual = JSON.stringify(valores);
  // `pronto`: os valores iniciais já chegaram (ex.: o imóvel lido do cache preencheu o formulário).
  const inicial = useRef<string | null>(null);
  if (inicial.current === null && pronto) inicial.current = atual;
  const salvando = useRef(false);
  const mudou = inicial.current !== null && atual !== inicial.current;
  useDescartarAlteracoes({ temAlteracoes: fluxo.tipo === 'edicao' && mudou, oQue, liberado: salvando });
  return {
    /** Chame antes de salvar, para o Voltar automático não perguntar. */
    marcarSalvo: () => {
      salvando.current = true;
    },
  };
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
  const { voltar, modo: modoCasal, fluxo } = useOnboarding();
  if (fluxo.tipo === 'edicao') {
    return (
      <TelaPilha titulo={fluxo.titulo} rodape={rodape}>
        {children}
      </TelaPilha>
    );
  }
  const contador =
    fluxo.tipo === 'ativacao'
      ? fluxo.passos.includes(passo)
        ? { atual: fluxo.passos.indexOf(passo) + 1, total: fluxo.passos.length }
        : null
      : contadorDoPasso(passo, modo === undefined ? modoCasal : modo);
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
