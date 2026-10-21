import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme, type LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSessao } from '../dados/Sessao';
import { Catalogo, CatalogoEstado, CatalogoFormulario } from '../dev/Catalogo';
import { Esqueleto } from '../feedback/Esqueleto';
import { AcessoProvisorio } from '../telas/AcessoProvisorio';
import { TelaProvisoria } from '../telas/TelaProvisoria';
import { registrarTela } from '../servicos/analytics';
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

export function Raiz() {
  const { usuario, carregando } = useSessao();
  const { tema, cores } = useTema();
  const base = tema === 'escuro' ? DarkTheme : DefaultTheme;
  const temaNavegacao = {
    ...base,
    colors: { ...base.colors, primary: cores.primary, background: cores.background, card: cores.surface, text: cores.onSurface, border: cores.outlineVariant },
  };

  if (carregando) return <Esqueleto />;

  return (
    <NavigationContainer
      linking={linking}
      theme={temaNavegacao}
      onStateChange={(estado) => {
        const rota = estado?.routes[estado.index ?? 0];
        if (rota) registrarTela(rota.name);
      }}
    >
      <Pilha.Navigator screenOptions={{ headerShown: false }}>
        {usuario ? (
          <Pilha.Screen name="Abas" component={Abas} />
        ) : (
          <Pilha.Screen name="AcessoProvisorio" component={AcessoProvisorio} />
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
