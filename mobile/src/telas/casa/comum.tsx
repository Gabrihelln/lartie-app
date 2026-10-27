import React, { useCallback, useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  getDocs,
  query,
  collection,
  where,
} from '@react-native-firebase/firestore';
import { raios } from '@lartie/tokens';
import {
  caminhos,
  type Comodo,
  type EstadoItem,
  type Item,
  type ListaItem,
  type ListaPresentes,
  type OrigemItem,
  type Reserva,
} from '@lartie/modelo';
import {
  comodoCompleto,
  ROTULO_ESTADO,
  textoCelebracaoComodo,
} from '@lartie/regras';
import { Botao } from '../../componentes/Botao';
import { CampoTexto } from '../../componentes/CampoTexto';
import { Chip } from '../../componentes/Chip';
import { FolhaInferior } from '../../componentes/FolhaInferior';
import { Icone } from '../../componentes/Icone';
import { Texto } from '../../componentes/Texto';
import { atualizar, emLote, type OperacaoLote } from '../../dados/gravacao';
import { useCategorias, useComodos, useItens } from '../../dados/plano';
import { useSessao } from '../../dados/Sessao';
import { useAvisos } from '../../feedback/Avisos';
import { useDialogo } from '../../feedback/Dialogo';
import { registrarEvento } from '../../servicos/analytics';
import { db } from '../../servicos/firebase';
import { espacos, useTema } from '../../tema';

// Peças da Casa nova (T18 a T21): botão de estado do item, "Como chegou?", a lista de presentes
// do botão "Na lista" e a celebração do cômodo completo (T55).

export type ItemComId = Item & { id: string };
export type ComodoComId = Comodo & { id: string };

const VISUAL_ESTADO: Record<
  EstadoItem,
  {
    fundo: 'errorContainer' | 'home' | 'infoContainer';
    texto: 'error' | 'onPrimary' | 'info';
  }
> = {
  falta: { fundo: 'errorContainer', texto: 'error' },
  ja_tenho: { fundo: 'home', texto: 'onPrimary' },
  na_lista: { fundo: 'infoContainer', texto: 'info' },
};

/** Botão de estado do T19 (Falta · Já tenho · Na lista), com rótulo para leitor de tela. */
export function BotaoEstado({
  estado,
  onPress,
}: {
  estado: EstadoItem;
  onPress: () => void;
}) {
  const { cores, alvoToque } = useTema();
  const v = VISUAL_ESTADO[estado];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Estado: ${ROTULO_ESTADO[estado]}. Tocar para mudar`}
      style={[
        estilos.estado,
        { backgroundColor: cores[v.fundo], minHeight: alvoToque },
      ]}
    >
      <Texto papel="metadado" peso="700" cor={v.texto}>
        {ROTULO_ESTADO[estado]}
      </Texto>
    </Pressable>
  );
}

// T55 · Cômodo completo ---------------------------------------------------------------------

type DadosCelebracao = { titulo: string; texto: string };
let mostrarCelebracao: ((d: DadosCelebracao) => void) | null = null;

/** Fica nas abas; mostra a celebração pedida de qualquer tela (o Modal fica por cima de tudo). */
export function CelebracaoComodo() {
  const { cores, sombra } = useTema();
  const [atual, setAtual] = useState<DadosCelebracao | null>(null);
  useEffect(() => {
    mostrarCelebracao = d => {
      setAtual(d);
      AccessibilityInfo.announceForAccessibility(d.titulo);
    };
    return () => {
      mostrarCelebracao = null;
    };
  }, []);
  if (!atual) return null;
  const fechar = () => setAtual(null);
  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={fechar}
      statusBarTranslucent
    >
      <View style={estilos.raiz}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: cores.scrim }]}
          onPress={fechar}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
        />
        <View
          style={[
            estilos.caixa,
            { backgroundColor: cores.surface },
            sombra('shadowFab'),
          ]}
          accessibilityViewIsModal
          accessibilityRole="alert"
        >
          <View
            style={[estilos.icone, { backgroundColor: cores.homeContainer }]}
          >
            <Icone nome="celebracao" cor={cores.home} />
          </View>
          <Texto papel="tituloTela" peso="700">
            {atual.titulo}
          </Texto>
          <Texto papel="corpo" cor="onSurfaceVariant">
            {atual.texto}
          </Texto>
          <Botao
            rotulo="Continuar"
            variante="casa"
            larguraTotal
            onPress={fechar}
          />
        </View>
      </View>
    </Modal>
  );
}

/**
 * Depois de mudar itens de um cômodo: T55 uma vez por cômodo, e "refaz se reabrir" (13.3): quando o
 * cômodo deixa de estar completo, `celebrado` volta a false.
 */
export function useConferirComodo() {
  const { casalId } = useSessao();
  const itens = useItens().dados;
  const comodos = useComodos().dados;
  return useCallback(
    (comodoId: string, mudancas: Record<string, Partial<Item>>) => {
      if (!casalId) return;
      const comodo = comodos.find(c => c.id === comodoId);
      if (!comodo) return;
      const depois = itens.map(i =>
        mudancas[i.id] ? { ...i, ...mudancas[i.id] } : i,
      );
      const doComodo = depois.filter(i => i.comodo_id === comodoId);
      const completo = comodoCompleto(doComodo);
      if (completo && !comodo.celebrado) {
        atualizar(casalId, 'comodos', comodoId, { celebrado: true });
        const faltando = comodos.filter(
          c =>
            c.id !== comodoId &&
            !comodoCompleto(depois.filter(i => i.comodo_id === c.id)) &&
            depois.some(i => i.comodo_id === c.id),
        ).length;
        registrarEvento({ nome: 'comodo_completo', params: {} });
        mostrarCelebracao?.(
          textoCelebracaoComodo(comodo.nome, doComodo.length, faltando),
        );
      } else if (!completo && comodo.celebrado) {
        atualizar(casalId, 'comodos', comodoId, { celebrado: false });
      }
    },
    [casalId, itens, comodos],
  );
}

// Mudar o estado (T19 botão de estado e T20 "Estado") ---------------------------------------

type Pedido =
  | { tipo: 'comoChegou'; item: ItemComId }
  | {
      tipo: 'escolherLista';
      item: ItemComId;
      listas: (ListaPresentes & { id: string })[];
    };

export interface ResultadoChegada {
  origem: OrigemItem | null;
  quem_deu: string | null;
  categoria_orcamento: string | null;
}

/** Listas que aceitam itens (13.9 regra 4 vale na criação; aqui, rascunho ou publicada). */
async function listasAbertas(casalId: string) {
  const snap = await getDocs(
    query(
      collection(db(), caminhos.subcolecao(casalId, 'listas_presentes')),
      where('status', 'in', ['rascunho', 'publicada']),
    ),
  );
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as ListaPresentes) }));
}

async function itensNaLista(casalId: string, itemId: string) {
  const snap = await getDocs(
    query(
      collection(db(), caminhos.subcolecao(casalId, 'lista_itens')),
      where('item_id', '==', itemId),
    ),
  );
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as ListaItem) }));
}

async function reservasAtivas(casalId: string, listaItemIds: string[]) {
  if (listaItemIds.length === 0) return [];
  const snap = await getDocs(
    query(
      collection(db(), caminhos.subcolecao(casalId, 'reservas')),
      where('lista_item_id', 'in', listaItemIds.slice(0, 30)),
      where('status', '==', 'ativa'),
    ),
  );
  return snap.docs.map(d => d.data() as Reserva);
}

/**
 * Regras do botão de estado (T19):
 * - → Já tenho: folha "Como chegou?" (Comprado · Ganhado + quem deu · Já era nosso) com "Pular".
 *   Comprado com preço entra no orçamento da casa, na categoria escolhida. Ganhado com nome cria
 *   o registro em Agradecimentos. Se completar o cômodo → T55.
 * - → Na lista: uma lista aberta → entra nela; várias → pergunta; nenhuma → oferece criar.
 * - Na lista → Falta: com reserva ativa, pergunta antes de tirar da lista.
 * Toda mudança tem "Desfazer".
 */
export function useEstadoItem() {
  const navigation = useNavigation();
  const { casalId } = useSessao();
  const { confirmar, erroAoSalvar } = useDialogo();
  const avisos = useAvisos();
  const conferir = useConferirComodo();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const aoFalhar = () => erroAoSalvar();

  const aplicar = useCallback(
    (
      item: ItemComId,
      novo: EstadoItem,
      extra: Partial<Item>,
      ops: OperacaoLote[],
      desfazerOps: OperacaoLote[],
    ) => {
      if (!casalId) return;
      const antes: Partial<Item> = {
        estado: item.estado,
        origem: item.origem,
        quem_deu: item.quem_deu,
        categoria_orcamento: item.categoria_orcamento ?? null,
      };
      const campos: Partial<Item> = {
        estado: novo,
        ...(novo !== 'ja_tenho' ? { origem: null, quem_deu: null } : {}),
        ...extra,
      };
      emLote(
        casalId,
        [
          { tipo: 'atualizar', sub: 'itens', id: item.id, dados: campos },
          ...ops,
        ],
        'estado do item',
        aoFalhar,
      );
      registrarEvento({
        nome: 'item_estado_alterado',
        params: { estado: novo, origem: String(campos.origem ?? '') },
      });
      conferir(item.comodo_id, { [item.id]: campos });
      avisos.comDesfazer(`${item.nome}: ${ROTULO_ESTADO[novo]}`, () => {
        emLote(
          casalId,
          [
            { tipo: 'atualizar', sub: 'itens', id: item.id, dados: antes },
            ...desfazerOps,
          ],
          'desfazer estado do item',
          aoFalhar,
        );
        conferir(item.comodo_id, { [item.id]: antes });
        registrarEvento({
          nome: 'acao_desfeita',
          params: { acao: 'estado_item' },
        });
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [casalId, conferir, avisos],
  );

  /** "Já tenho" com a resposta de "Como chegou?". Também usado ao salvar o T20. */
  const opsChegada = useCallback(
    (item: ItemComId, r: ResultadoChegada): OperacaoLote[] =>
      r.origem === 'ganhado' && r.quem_deu
        ? [
            {
              tipo: 'criar',
              sub: 'agradecimentos',
              dados: {
                reserva_id: null,
                item_id: item.id,
                nome: r.quem_deu,
                presente_descricao: item.nome,
                agradecido: false,
                agradecido_em: null,
              },
            },
          ]
        : [],
    [],
  );

  const marcarJaTenho = (item: ItemComId, r: ResultadoChegada) => {
    setPedido(null);
    aplicar(
      item,
      'ja_tenho',
      {
        origem: r.origem,
        quem_deu: r.quem_deu,
        categoria_orcamento: r.categoria_orcamento,
      },
      opsChegada(item, r),
      [],
    );
  };

  const colocarNaLista = (item: ItemComId, listaId: string) => {
    setPedido(null);
    aplicar(
      item,
      'na_lista',
      {},
      [
        {
          tipo: 'criar',
          sub: 'lista_itens',
          dados: {
            lista_id: listaId,
            item_id: item.id,
            quantidade_na_lista: item.quantidade,
          },
        },
      ],
      [],
    );
  };

  /** Prepara a entrada na lista. Devolve false se não deu (sem lista ou sem conexão). */
  const irParaLista = async (item: ItemComId) => {
    if (!casalId) return;
    const listas = await listasAbertas(casalId).catch(() => null);
    if (listas === null)
      return avisos.mostrar({
        texto: 'Não foi possível ver as listas agora. Tentem de novo.',
        tipo: 'erro',
      });
    if (listas.length === 0) {
      const criar = await confirmar({
        icone: 'presentes',
        titulo: 'Ainda não há lista de presentes',
        texto: `Criem uma lista para colocar ${item.nome} nela.`,
        cancelar: 'Agora não',
        confirmar: 'Criar lista',
      });
      if (criar) navigation.navigate('Abas', { screen: 'presentes' });
      return;
    }
    if (listas.length === 1) return colocarNaLista(item, listas[0]!.id);
    setPedido({ tipo: 'escolherLista', item, listas });
  };

  const sairDaLista = async (item: ItemComId, novo: EstadoItem) => {
    if (!casalId) return;
    const naLista = await itensNaLista(casalId, item.id).catch(() => []);
    const reservas = await reservasAtivas(
      casalId,
      naLista.map(l => l.id),
    ).catch(() => []);
    if (reservas.length) {
      const ok = await confirmar({
        icone: 'aviso',
        titulo: 'Tirar da lista?',
        texto: `Este item tem reserva de ${
          reservas[0]!.nome_convidado
        }. Tirar da lista mesmo assim?`,
        cancelar: 'Manter',
        confirmar: 'Tirar da lista',
      });
      if (!ok) return;
    }
    aplicar(
      item,
      novo,
      {},
      naLista.map(l => ({
        tipo: 'excluir' as const,
        sub: 'lista_itens' as const,
        id: l.id,
      })),
      naLista.map(l => ({
        tipo: 'criar' as const,
        sub: 'lista_itens' as const,
        dados: {
          lista_id: l.lista_id,
          item_id: l.item_id,
          quantidade_na_lista: l.quantidade_na_lista,
        },
      })),
    );
  };

  /** Botão de estado do T19. */
  const alternar = (item: ItemComId) => {
    if (item.estado === 'falta') return setPedido({ tipo: 'comoChegou', item });
    if (item.estado === 'ja_tenho') return irParaLista(item);
    return sairDaLista(item, 'falta');
  };

  const folhas = (
    <>
      <FolhaComoChegou
        item={pedido?.tipo === 'comoChegou' ? pedido.item : null}
        onFechar={() => setPedido(null)}
        onEscolher={(item, r) => marcarJaTenho(item, r)}
      />
      <FolhaInferior
        visivel={pedido?.tipo === 'escolherLista'}
        titulo="Em qual lista?"
        onFechar={() => setPedido(null)}
      >
        {pedido?.tipo === 'escolherLista'
          ? pedido.listas.map(l => (
              <Botao
                key={l.id}
                rotulo={nomeDaLista(l)}
                variante="tonal"
                icone="presentes"
                larguraTotal
                onPress={() => colocarNaLista(pedido.item, l.id)}
              />
            ))
          : null}
      </FolhaInferior>
    </>
  );

  return { alternar, folhas, opsChegada, sairDaLista, irParaLista };
}

const NOMES_OCASIAO: Record<ListaPresentes['ocasiao'], string> = {
  cha_panela: 'Chá de panela',
  cha_cozinha: 'Chá de cozinha',
  cha_bar: 'Chá bar',
  casamento: 'Casamento',
};
export const nomeDaLista = (l: Pick<ListaPresentes, 'ocasiao'>) =>
  NOMES_OCASIAO[l.ocasiao];

/** Folha rápida "Como chegou?" do T19, com "Pular". */
function FolhaComoChegou({
  item,
  onFechar,
  onEscolher,
}: {
  item: ItemComId | null;
  onFechar: () => void;
  onEscolher: (item: ItemComId, r: ResultadoChegada) => void;
}) {
  const categorias = useCategorias()
    .dados.filter(c => c.escopo === 'casa')
    .sort((a, b) => a.ordem - b.ordem);
  const [origem, setOrigem] = useState<OrigemItem | null>(null);
  const [quemDeu, setQuemDeu] = useState('');
  const [categoria, setCategoria] = useState<string | null>(null);
  useEffect(() => {
    setOrigem(null);
    setQuemDeu('');
    setCategoria(item?.categoria_orcamento ?? null);
  }, [item?.id, item?.categoria_orcamento]);
  if (!item)
    return (
      <FolhaInferior visivel={false} onFechar={onFechar}>
        {null}
      </FolhaInferior>
    );
  const confirmarEscolha = () =>
    onEscolher(item, {
      origem,
      quem_deu: origem === 'ganhado' ? quemDeu.trim() || null : null,
      categoria_orcamento:
        origem === 'comprado' ? categoria : item.categoria_orcamento ?? null,
    });
  return (
    <FolhaInferior visivel titulo="Como chegou?" onFechar={onFechar}>
      <View style={estilos.chips} accessibilityRole="radiogroup">
        <Chip
          rotulo="Comprado"
          selecionado={origem === 'comprado'}
          onPress={() => setOrigem('comprado')}
        />
        <Chip
          rotulo="Ganhado"
          selecionado={origem === 'ganhado'}
          onPress={() => setOrigem('ganhado')}
        />
        <Chip
          rotulo="Já era nosso"
          selecionado={origem === 'ja_era_nosso'}
          onPress={() => setOrigem('ja_era_nosso')}
        />
      </View>
      {origem === 'ganhado' ? (
        <CampoTexto
          rotulo="Quem deu?"
          value={quemDeu}
          onChangeText={setQuemDeu}
          autoCapitalize="words"
          maxLength={60}
        />
      ) : null}
      {origem === 'comprado' && categorias.length ? (
        <View style={estilos.grupo}>
          <Texto papel="rotuloCampo">Categoria no orçamento</Texto>
          <View style={estilos.chips}>
            {categorias.map(c => (
              <Chip
                key={c.id}
                rotulo={c.nome}
                selecionado={(categoria ?? 'casa_enxoval') === c.id}
                onPress={() => setCategoria(c.id)}
              />
            ))}
          </View>
        </View>
      ) : null}
      <Botao
        rotulo="Salvar"
        variante="casa"
        larguraTotal
        desativado={!origem}
        onPress={confirmarEscolha}
      />
      <Botao
        rotulo="Pular"
        variante="texto"
        larguraTotal
        onPress={() =>
          onEscolher(item, {
            origem: null,
            quem_deu: null,
            categoria_orcamento: item.categoria_orcamento ?? null,
          })
        }
      />
    </FolhaInferior>
  );
}

const estilos = StyleSheet.create({
  estado: {
    minWidth: 96,
    borderRadius: raios.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espacos.space3,
  },
  raiz: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: espacos.space6,
  },
  caixa: {
    width: '100%',
    borderRadius: raios.radiusXl,
    padding: espacos.space6,
    gap: espacos.space3,
  },
  icone: {
    width: 48,
    height: 48,
    borderRadius: raios.radiusFull,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacos.space2 },
  grupo: { gap: espacos.space2 },
});
