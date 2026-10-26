import React, { useEffect } from 'react';
import { createNavigationContainerRef, NavigationContainer, DefaultTheme, DarkTheme, type LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSessao } from '../dados/Sessao';
import { Catalogo, CatalogoEstado, CatalogoFormulario } from '../dev/Catalogo';
import { Abertura } from '../telas/acesso/Abertura';
import { BoasVindas } from '../telas/acesso/BoasVindas';
import { CriarConta } from '../telas/acesso/CriarConta';
import { Entrar } from '../telas/acesso/Entrar';
import { EsqueciSenha } from '../telas/acesso/EsqueciSenha';
import { PreparandoConta } from '../telas/acesso/PreparandoConta';
import { Convite, conviteGuardado } from '../telas/convite/Convite';
import { Onboarding } from '../telas/onboarding/Onboarding';
import { registrarTela } from '../servicos/analytics';
import { armazenamento, CHAVES } from '../servicos/armazenamento';
import { useTema } from '../tema';
import { Abas } from './Abas';
import type { ParamsRaiz } from './tipos';

const Pilha = createNativeStackNavigator<ParamsRaiz>();
const navegacao = createNavigationContainerRef<ParamsRaiz>();

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
 * - sessão sem casal (ou casal que não carregou) → preparar a conta (API);
 * - onboarding incompleto → onboarding (só o noivo_1; o noivo_2 entra pelo convite e vai direto ao início);
 * - onboarding completo → tela inicial do modo (abas).
 * A versão mínima (T67) é conferida antes, no App.
 */
export function Raiz() {
  const { usuario, casalId, casal, papel, carregando, sessaoExpirada } = useSessao();
  const { tema, cores } = useTema();
  const base = tema === 'escuro' ? DarkTheme : DefaultTheme;
  const temaNavegacao = {
    ...base,
    colors: { ...base.colors, primary: cores.primary, background: cores.background, card: cores.surface, text: cores.onSurface, border: cores.outlineVariant },
  };

  // "Já tenho conta" no T66 com uma conta que já tem plano: depois do login, reabre o convite para a
  // pessoa confirmar a troca (contas novas aceitam na tela "Preparando a conta").
  const pronto = !carregando && !!usuario && !!casal;
  useEffect(() => {
    if (!pronto) return;
    const c = conviteGuardado();
    if (!c) return;
    const abrir = () => navegacao.isReady() && navegacao.navigate('Convite', { codigo: c.codigo });
    const t = setTimeout(abrir, 300);
    return () => clearTimeout(t);
  }, [pronto]);

  if (carregando) return <Abertura carregando />;

  const jaAbriu = armazenamento.getBoolean(CHAVES.jaAbriu) ?? false;
  const inicialSemSessao: keyof ParamsRaiz = sessaoExpirada ? 'Entrar' : jaAbriu ? 'BoasVindas' : 'Abertura';

  return (
    <NavigationContainer
      ref={navegacao}
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
        ) : !casalId || !casal ? (
          <Pilha.Screen name="PreparandoConta" component={PreparandoConta} options={{ animation: 'fade' }} />
        ) : !casal.onboarding_concluido && papel !== 'noivo_2' ? (
          <Pilha.Screen name="Onboarding" component={Onboarding} options={{ animation: 'fade' }} />
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
