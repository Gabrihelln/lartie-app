import React, { useMemo } from 'react';
import { StackActions, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { doc, getDocFromCache } from '@react-native-firebase/firestore';
import { caminhos, type Comodo, type EstiloCasamento, type Imovel, type Tarefa } from '@lartie/modelo';
import {
  classificarClima,
  hojeLocal,
  passosParaAtivar,
  recalcularPrazos,
  sugerirNovosComodos,
  type CatalogoClima,
  type CatalogoEnxoval,
  type CatalogoTarefas,
  type PassoOnboarding,
} from '@lartie/regras';
import catalogoEnxoval from '../../../../dados/catalogo-enxoval.json';
import catalogoTarefas from '../../../../dados/catalogo-tarefas.json';
import climaPorCidade from '../../../../dados/clima-por-cidade.json';
import { atualizar, emLote } from '../../dados/gravacao';
import { useColecao } from '../../dados/leitura';
import { useSessao } from '../../dados/Sessao';
import { useAvisos } from '../../feedback/Avisos';
import { useDialogo } from '../../feedback/Dialogo';
import type { ParamsRaiz } from '../../navegacao/tipos';
import { registrarEvento } from '../../servicos/analytics';
import { db } from '../../servicos/firebase';
import { ProvedorFluxo, type Fluxo, type ParamsOnboarding } from '../onboarding/comum';
import { T06OCasal } from '../onboarding/T06OCasal';
import { T07Casamento } from '../onboarding/T07Casamento';
import { T08Casa } from '../onboarding/T08Casa';
import { T09JaTemos } from '../onboarding/T09JaTemos';
import { T10PlanoPronto } from '../onboarding/T10PlanoPronto';
import { T11Convidar } from '../onboarding/T11Convidar';

// Etapa 3: as telas do onboarding fora dele.
// - Perfil › Casal (T06), Dados do casamento (T07) e Dados da casa nova (T08): o mesmo formulário,
//   com Voltar (T36 se houver alterações) e "Salvar". Mudar a data do casamento recalcula os prazos
//   sugeridos das tarefas do plano que não tiveram o prazo editado à mão (T33).
// - Ativar um módulo nunca gerado (13.9 regra 2): só os passos que faltam e o T10 resumido.

const CATALOGO_TAREFAS = catalogoTarefas as unknown as CatalogoTarefas;
const CATALOGO_ENXOVAL = catalogoEnxoval as unknown as CatalogoEnxoval;
const CATALOGO_CLIMA = climaPorCidade as unknown as CatalogoClima;

function useEdicao(titulo: string, extra?: (passo: PassoOnboarding, campos: Record<string, unknown>) => void): Fluxo {
  const navigation = useNavigation();
  const { casalId } = useSessao();
  const avisos = useAvisos();
  const { erroAoSalvar } = useDialogo();
  return {
    tipo: 'edicao',
    titulo,
    aoSalvar: (passo, campos) => {
      if (!casalId) return;
      if (Object.keys(campos).length) atualizar(casalId, null, null, campos, () => erroAoSalvar());
      extra?.(passo, campos);
      navigation.goBack();
      avisos.mostrar({ texto: 'Dados salvos', tipo: 'sucesso' });
    },
  };
}

export function EditarCasal() {
  return (
    <ProvedorFluxo value={useEdicao('Casal')}>
      <T06OCasal />
    </ProvedorFluxo>
  );
}

export function DadosCasamento() {
  const { casal, casalId } = useSessao();
  const tarefas = useColecao<Tarefa>(casalId ? caminhos.subcolecao(casalId, 'tarefas') : null).dados;
  const fluxo = useEdicao('Dados do casamento', (_passo, campos) => {
    if (!casalId || !casal || campos.data_casamento === casal.data_casamento) return;
    const mudancas = recalcularPrazos(
      tarefas,
      {
        data_casamento: (campos.data_casamento as string | null) ?? null,
        estilo: (campos.estilo as EstiloCasamento | undefined) ?? casal.estilo ?? 'civil_religioso',
        cerimonia_religiosa: (campos.cerimonia_religiosa as boolean | null) ?? casal.cerimonia_religiosa,
        hoje: hojeLocal(),
      },
      CATALOGO_TAREFAS,
    );
    if (mudancas.length) {
      emLote(
        casalId,
        mudancas.map((m) => ({ tipo: 'atualizar' as const, sub: 'tarefas' as const, id: m.id, dados: { prazo: m.prazo } })),
        'recalcular prazos',
      );
    }
  });
  return (
    <ProvedorFluxo value={fluxo}>
      <T07Casamento />
    </ProvedorFluxo>
  );
}

/**
 * Mudar os dados da casa nunca apaga itens. Se o imóvel novo pede cômodos que ainda não existem
 * (mais quartos ou banheiros, pets), pergunta antes de criar, com os itens do catálogo (T33).
 */
export function DadosCasa() {
  const { casal, casalId } = useSessao();
  const { confirmar, erroAoSalvar } = useDialogo();
  const avisos = useAvisos();
  const comodos = useColecao<Comodo>(casalId ? caminhos.subcolecao(casalId, 'comodos') : null).dados;
  const fluxo = useEdicao('Dados da casa nova', () => {
    if (!casalId || !casal?.modulos_gerados?.casa) return;
    // O T08 acabou de gravar o imóvel: no cache já está o valor novo.
    getDocFromCache(doc(db(), caminhos.imovel(casalId)))
      .then(async (snap) => {
        const imovel = snap.data() as Imovel | undefined;
        if (!imovel || !casal.cidade || !casal.uf) return;
        const s = sugerirNovosComodos(
          {
            quartos: imovel.quartos,
            banheiros: imovel.banheiros,
            mobiliado: imovel.mobiliado,
            tem_pets: imovel.tem_pets,
            moradores: imovel.moradores,
            clima: classificarClima(casal.cidade, casal.uf, CATALOGO_CLIMA),
            ja_temos: [],
            quem_mora_sozinho: null,
          },
          { comodos: comodos.map((c) => c.id) },
          CATALOGO_ENXOVAL,
        );
        if (s.comodos.length === 0) return;
        const nomes = s.comodos.map((c) => c.nome);
        const lista = nomes.length > 1 ? `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}` : nomes[0]!;
        const ok = await confirmar({
          icone: 'inicio',
          titulo: `Adicionar ${lista}?`,
          texto: `Com os dados novos, sugerimos ${s.comodos.length === 1 ? 'este cômodo' : 'estes cômodos'} com ${s.itens.length} itens do enxoval. Nada do que vocês já têm muda.`,
          cancelar: 'Agora não',
          confirmar: 'Adicionar',
        });
        if (!ok) return;
        const ordem = Math.max(0, ...comodos.map((c) => c.ordem));
        emLote(
          casalId,
          [
            ...s.comodos.map((c, i) => ({
              tipo: 'criar' as const,
              sub: 'comodos' as const,
              id: c.id,
              dados: { nome: c.nome, ordem: ordem + i + 1, largura_m: null, comprimento_m: null, pe_direito_m: null, paredes_livres: [], celebrado: false },
            })),
            ...s.itens.map((i) => ({
              tipo: 'criar' as const,
              sub: 'itens' as const,
              id: i.id,
              dados: {
                comodo_id: i.comodo_id,
                nome: i.nome,
                fase: i.fase,
                quantidade: i.quantidade,
                estado: 'falta',
                origem: null,
                quem_deu: null,
                era_de: null,
                preco_estimado: i.preco_estimado,
                link_loja: null,
                medidas: null,
                parede_destino: null,
                observacao: null,
                foto: null,
                gerado_pelo_plano: true,
                catalogo_id: i.catalogo_id,
                bom_para_presente: i.bom_para_presente,
                categoria_orcamento: null,
              },
            })),
          ],
          'sugerir cômodos',
          () => erroAoSalvar(),
        );
        registrarEvento({ nome: 'comodos_sugeridos', params: { comodos: s.comodos.length, itens: s.itens.length } });
        avisos.mostrar({ texto: `${lista} ${s.comodos.length === 1 ? 'entrou' : 'entraram'} no enxoval`, tipo: 'sucesso' });
      })
      .catch(() => {});
  });
  return (
    <ProvedorFluxo value={fluxo}>
      <T08Casa />
    </ProvedorFluxo>
  );
}

const PilhaAtivar = createNativeStackNavigator<ParamsOnboarding>();

export function AtivarModulo() {
  const { params } = useRoute<RouteProp<ParamsRaiz, 'AtivarModulo'>>();
  const navigation = useNavigation();
  const { casal } = useSessao();
  // Os passos ficam fixos ao abrir: a geração muda modulos_gerados no meio do caminho.
  const passos = useMemo(
    () => passosParaAtivar(params.modo, casal?.modulos_gerados ?? { casamento: false, casa: false }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params.modo],
  );
  const fluxo: Fluxo = {
    tipo: 'ativacao',
    modo: params.modo,
    passos,
    origem: params.origem,
    // Fim: volta para o Início (que já é o do modo novo).
    sair: () => navigation.dispatch(StackActions.popToTop()),
  };
  return (
    <ProvedorFluxo value={fluxo}>
      <PilhaAtivar.Navigator screenOptions={{ headerShown: false }} initialRouteName={passos[0] ?? 'T10'}>
        <PilhaAtivar.Screen name="T07" component={T07Casamento} />
        <PilhaAtivar.Screen name="T08" component={T08Casa} />
        <PilhaAtivar.Screen name="T09" component={T09JaTemos} />
        <PilhaAtivar.Screen name="T10" component={T10PlanoPronto} options={{ gestureEnabled: false }} />
      </PilhaAtivar.Navigator>
    </ProvedorFluxo>
  );
}

/** T11 fora do onboarding: T12d "Convidar {parceiro}" e Perfil › Parceiro(a) não conectado. */
export function Convidar() {
  return (
    <ProvedorFluxo value={{ tipo: 'edicao', titulo: 'Convidar', aoSalvar: () => {} }}>
      <T11Convidar />
    </ProvedorFluxo>
  );
}
