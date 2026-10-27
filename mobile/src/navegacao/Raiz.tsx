import React, { useEffect, useRef } from 'react';
import { createNavigationContainerRef, NavigationContainer, DefaultTheme, DarkTheme, type LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ModoApp } from '@lartie/modelo';
import { moduloVisivel, type Modulo } from '@lartie/regras';
import { useSessao } from '../dados/Sessao';
import { useAvisos } from '../feedback/Avisos';
import { useDialogo } from '../feedback/Dialogo';
import { Comodo } from '../telas/casa/Comodo';
import { Item } from '../telas/casa/Item';
import { Medidas } from '../telas/casa/Medidas';
import { Fornecedor } from '../telas/casamento/Fornecedor';
import { Tarefa } from '../telas/casamento/Tarefa';
import { ConfigModo } from '../telas/perfil/ConfigModo';
import { AtivarModulo, Convidar, DadosCasa, DadosCasamento, EditarCasal } from '../telas/perfil/Formularios';
import { MeusDados } from '../telas/perfil/MeusDados';
import { OrcamentoCasa, ProvisoriaPilha } from '../telas/Provisorias';
import { AdicionarItens } from '../telas/presentes/AdicionarItens';
import { Agradecimentos } from '../telas/presentes/Agradecimentos';
import { Lista } from '../telas/presentes/Lista';
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
      Tarefa: 'tarefa/:id',
      Fornecedor: 'fornecedor/:id',
      Comodo: 'comodo/:id',
      Item: 'item/:id',
      Lista: 'lista/:id',
      Agradecimentos: 'agradecimentos',
      ConfigModo: 'modo',
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

/** Telas empilhadas de um módulo: se o módulo some (troca de modo), voltam para o Início. */
const MODULO_DA_ROTA: Partial<Record<keyof ParamsRaiz, Modulo>> = {
  Tarefa: 'checklist',
  Fornecedor: 'fornecedores',
  DadosCasamento: 'checklist',
  OrcamentoCasa: 'casa',
  DadosCasa: 'casa',
  Comodo: 'casa',
  Item: 'casa',
  Medidas: 'casa',
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
  const { usuario, casalId, casal, papel, carregando, sessaoExpirada, removidoDoPlano } = useSessao();
  const avisos = useAvisos();
  const { confirmar } = useDialogo();
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

  // Fluxo 16: o parceiro trocou o modo. Aviso "{nome} mudou o modo do app." e, se a tela aberta for
  // de um módulo que ficou oculto, volta para a nova tela inicial.
  const modoAnterior = useRef<ModoApp | null>(null);
  useEffect(() => {
    if (!casal) {
      modoAnterior.current = null;
      return;
    }
    const antes = modoAnterior.current;
    modoAnterior.current = casal.modo_app;
    if (!antes || antes === casal.modo_app || !casal.modo_alterado_por || casal.modo_alterado_por === usuario?.uid) return;
    const nome = casal.parceiro?.uid === casal.modo_alterado_por ? casal.parceiro.nome : casal.nome_1;
    avisos.mostrar({ texto: `${nome} mudou o modo do app.` });
    const rota = navegacao.isReady() ? (navegacao.getCurrentRoute()?.name as keyof ParamsRaiz | undefined) : undefined;
    const modulo = rota ? MODULO_DA_ROTA[rota] : undefined;
    if (modulo && !moduloVisivel(casal.modo_app, modulo)) navegacao.reset({ index: 0, routes: [{ name: 'Abas' }] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [casal?.modo_app]);

  // T43: a pessoa foi removida do plano. Avisa uma vez (a conta segue, com um plano novo).
  const avisouRemocao = useRef<string | null>(null);
  useEffect(() => {
    if (!removidoDoPlano || avisouRemocao.current === removidoDoPlano) return;
    avisouRemocao.current = removidoDoPlano;
    confirmar({
      icone: 'info',
      titulo: `${removidoDoPlano} removeu você do plano`,
      texto: 'Você deixou de ver e editar o plano de vocês. Se foi engano, peça um novo convite.',
      cancelar: null,
      confirmar: 'Entendi',
    });
  }, [removidoDoPlano, confirmar]);

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
          <Pilha.Group>
            <Pilha.Screen name="Abas" component={Abas} options={{ animation: 'fade' }} />
            <Pilha.Screen name="Tarefa" component={Tarefa} />
            <Pilha.Screen name="Fornecedor" component={Fornecedor} />
            <Pilha.Screen name="Comodo" component={Comodo} />
            <Pilha.Screen name="Item" component={Item} />
            <Pilha.Screen name="Medidas" component={Medidas} />
            <Pilha.Screen name="Lista" component={Lista} />
            <Pilha.Screen name="AdicionarItens" component={AdicionarItens} />
            <Pilha.Screen name="Agradecimentos" component={Agradecimentos} />
            <Pilha.Screen name="OrcamentoCasa" component={OrcamentoCasa} />
            <Pilha.Screen name="ConfigModo" component={ConfigModo} />
            <Pilha.Screen name="AtivarModulo" component={AtivarModulo} options={{ gestureEnabled: false }} />
            <Pilha.Screen name="EditarCasal" component={EditarCasal} />
            <Pilha.Screen name="DadosCasamento" component={DadosCasamento} />
            <Pilha.Screen name="DadosCasa" component={DadosCasa} />
            <Pilha.Screen name="MeusDados" component={MeusDados} />
            <Pilha.Screen name="Convidar" component={Convidar} />
            <Pilha.Screen name="Provisoria" component={ProvisoriaPilha} />
          </Pilha.Group>
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
