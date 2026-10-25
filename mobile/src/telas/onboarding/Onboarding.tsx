import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { PassoOnboarding } from '@lartie/regras';
import { useSessao } from '../../dados/Sessao';
import { ExplicacaoPermissao } from '../../feedback/ExplicacaoPermissao';
import { pedirPermissaoNotificacoes } from '../../servicos/notificacoes';
import { useOnboarding, type ParamsOnboarding } from './comum';
import { T06OCasal } from './T06OCasal';
import { T06bModo } from './T06bModo';
import { T07Casamento } from './T07Casamento';
import { T08Casa } from './T08Casa';
import { T09JaTemos } from './T09JaTemos';
import { T10PlanoPronto } from './T10PlanoPronto';
import { T11Convidar } from './T11Convidar';

// Onboarding (T06 a T11 e T57). Abre no passo salvo (casal.onboarding_passo). Depois de o app ter
// fechado, "Voltar" abre o passo anterior do modo (useOnboarding().voltar).

const Pilha = createNativeStackNavigator<ParamsOnboarding>();

function PermNotificacoes() {
  const { concluir } = useOnboarding();
  return (
    <ExplicacaoPermissao
      tipo="notificacoes"
      onPermitir={async () => {
        await pedirPermissaoNotificacoes();
        concluir();
      }}
      onAgoraNao={() => concluir()}
    />
  );
}

export function Onboarding() {
  const { casal } = useSessao();
  const passo: PassoOnboarding = casal?.onboarding_passo ?? 'T06';

  return (
    <Pilha.Navigator screenOptions={{ headerShown: false }} initialRouteName={passo}>
      <Pilha.Screen name="T06" component={T06OCasal} />
      <Pilha.Screen name="T06b" component={T06bModo} />
      <Pilha.Screen name="T07" component={T07Casamento} />
      <Pilha.Screen name="T08" component={T08Casa} />
      <Pilha.Screen name="T09" component={T09JaTemos} />
      <Pilha.Screen name="T10" component={T10PlanoPronto} options={{ gestureEnabled: false }} />
      <Pilha.Screen name="T11" component={T11Convidar} />
      <Pilha.Screen name="PermNotificacoes" component={PermNotificacoes} />
    </Pilha.Navigator>
  );
}
