import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme, type LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSessao } from '../dados/Sessao';
import { Catalogo, CatalogoEstado, CatalogoFormulario } from '../dev/Catalogo';
import { Abertura } from '../telas/acesso/Abertura';
import { BoasVindas } from '../telas/acesso/BoasVindas';
import { CriarConta } from '../telas/acesso/CriarConta';
import { Entrar } from '../telas/acesso/Entrar';
import { EsqueciSenha } from '../telas/acesso/EsqueciSenha';
import { PreparandoConta } from '../telas/acesso/PreparandoConta';
import { OnboardingProvisorio } from '../telas/OnboardingProvisorio';
import { TelaProvisoria } from '../telas/TelaProvisoria';
import { registrarTela } from '../servicos/analytics';
import { armazenamento, CHAVES } from '../servicos/armazenamento';
import { useTema } from '../tema';
import { Abas } from './Abas';
import type { ParamsRaiz } from './tipos';

const Pilha = createNativeStackNavigator<ParamsRaiz>();

// Deep links (plano 2.2 item 7). O domínio lartie.app ainda será comprado (P13): até lá vale o
// esquema lartie://. As páginas públicas do convidado (lartie.app/{slug}/…) são da web, não do app.
const linking: LinkingOptions<ParamsRaiz> = {
  prefixes: ['lartie://', 'https://lartie.app'],
  config: {
    screens: {
      Convite: 'convite/:codigo',
      Entrar: 'entrar',
      Abas: {
        screens: {
          inicio: 'inicio',
          casamento: 'casamento',
          convidados: 'convidados',
          casa: 'casa',
          presentes: 'presentes',
          perfil: 'perfil',
        },
      },
    },
  },
};

function Convite({ route }: { route: { params: { codigo: string } } }) {
  return <TelaProvisoria titulo="Convite" id={`T66 · código ${route.params.codigo}`} etapa={2} />;
}

/** T01 na primeira abertura sem sessão: "Começar" → T02, "Já tenho conta" → T04. */
function AberturaComBotoes({ navigation }: { navigation: { replace: (r: 'BoasVindas') => void; navigate: (r: 'Entrar', p: object) => void } }) {
  const marcar = () => armazenamento.set(CHAVES.jaAbriu, true);
  return (
    <Abertura
      onComecar={() => {
        marcar();
        navigation.replace('BoasVindas');
      }}
      onJaTenhoConta={() => {
        marcar();
        navigation.navigate('Entrar', {});
      }}
    />
  );
}

/**
 * Regra de roteamento do T01 (especificação Seção 4):
 * - sem sessão → T01 com "Começar" (primeira abertura) ou T02; sessão expirada → T04 com o aviso;
 * - sessão sem casal → preparar a conta (API);
 * - onboarding incompleto → onboarding (provisório até a Etapa 2);
 * - onboarding completo → tela inicial do modo (abas).
 * A versão mínima (T67) é conferida antes, no App.
 */
export function Raiz() {
  const { usuario, casalId, casal, carregando, sessaoExpirada } = useSessao();
  const { tema, cores } = useTema();
  const base = tema === 'escuro' ? DarkTheme : DefaultTheme;
  const temaNavegacao = {
    ...base,
    colors: { ...base.colors, primary: cores.primary, background: cores.background, card: cores.surface, text: cores.onSurface, border: cores.outlineVariant },
  };

  if (carregando) return <Abertura carregando />;

  const jaAbriu = armazenamento.getBoolean(CHAVES.jaAbriu) ?? false;
  const inicialSemSessao: keyof ParamsRaiz = sessaoExpirada ? 'Entrar' : jaAbriu ? 'BoasVindas' : 'Abertura';

  return (
    <NavigationContainer
      linking={linking}
      theme={temaNavegacao}
      onStateChange={(estado) => {
        const rota = estado?.routes[estado.index ?? 0];
        if (rota) registrarTela(rota.name);
      }}
    >
      <Pilha.Navigator screenOptions={{ headerShown: false }} initialRouteName={usuario ? undefined : inicialSemSessao}>
        {!usuario ? (
          <Pilha.Group>
            {!jaAbriu ? <Pilha.Screen name="Abertura" component={AberturaComBotoes} options={{ animation: 'fade' }} /> : null}
            <Pilha.Screen name="BoasVindas" component={BoasVindas} />
            <Pilha.Screen name="CriarConta" component={CriarConta} />
            <Pilha.Screen name="Entrar" component={Entrar} />
            <Pilha.Screen name="EsqueciSenha" component={EsqueciSenha} />
          </Pilha.Group>
        ) : !casalId ? (
          <Pilha.Screen name="PreparandoConta" component={PreparandoConta} options={{ animation: 'fade' }} />
        ) : casal && !casal.onboarding_concluido ? (
          <Pilha.Screen name="OnboardingProvisorio" component={OnboardingProvisorio} options={{ animation: 'fade' }} />
        ) : (
          <Pilha.Screen name="Abas" component={Abas} options={{ animation: 'fade' }} />
        )}
        <Pilha.Screen name="Convite" component={Convite} />
        {__DEV__ ? (
          <Pilha.Group screenOptions={{ headerShown: true, headerBackTitle: 'Voltar' }}>
            <Pilha.Screen name="Catalogo" component={Catalogo} options={{ title: 'Catálogo' }} />
            <Pilha.Screen name="CatalogoEstado" component={CatalogoEstado} options={{ title: 'Estado' }} />
            <Pilha.Screen name="CatalogoFormulario" component={CatalogoFormulario} options={{ title: 'Formulário de teste' }} />
          </Pilha.Group>
        ) : null}
      </Pilha.Navigator>
    </NavigationContainer>
  );
}
