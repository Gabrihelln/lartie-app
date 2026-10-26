// Categorias de orçamento criadas com o plano (13.4).
import type { EscopoOrcamento, EstadoItem, OrigemGasto, OrigemItem, StatusFornecedor } from '@lartie/modelo';
import type { CatalogoCategorias } from './catalogos';

export interface CategoriaGerada {
  id: string;
  escopo: EscopoOrcamento;
  nome: string;
  /** Centavos. Casamento: % sugerido do orçamento total (se informado). Casa: começa vazio. */
  planejado: number | null;
  ordem: number;
}

export function gerarCategorias(
  escopo: EscopoOrcamento,
  catalogo: CatalogoCategorias,
  orcamentoTotal: number | null,
): CategoriaGerada[] {
  const lista = escopo === 'casamento' ? catalogo.orcamento_casamento : catalogo.orcamento_casa;
  return lista.map((c, i) => ({
    id: `${escopo}_${c.id}`,
    escopo,
    nome: c.nome,
    planejado:
      escopo === 'casamento' && orcamentoTotal && c.percentual_sugerido !== undefined
        ? Math.round((orcamentoTotal * c.percentual_sugerido) / 100)
        : null,
    ordem: i + 1,
  }));
}

// Cálculos do T15 (13.4) ----------------------------------------------------------------------

export interface CategoriaBase {
  id: string;
  escopo: EscopoOrcamento;
  nome: string;
  planejado: number | null;
  ordem: number;
}

export interface FornecedorBase {
  id: string;
  nome: string;
  /** Id da categoria de orçamento do casamento (categorias_orcamento/{id}). */
  categoria: string;
  status: StatusFornecedor;
  valor: number | null;
}

export interface GastoBase {
  id: string;
  categoria_id: string;
  descricao: string;
  valor: number;
  data: string;
  origem: OrigemGasto;
}

export interface ItemCompradoBase {
  id: string;
  nome: string;
  estado: EstadoItem;
  origem: OrigemItem | null;
  preco_estimado: number | null;
  quantidade: number;
}

/**
 * Categoria da casa que recebe o gasto de um item comprado. O item ainda não tem categoria no
 * modelo (Seção 3.6); até a Etapa 4 decidir, todo item comprado entra em "Enxoval".
 */
export const CATEGORIA_CASA_DOS_ITENS = 'casa_enxoval';

export type Lancamento =
  | { tipo: 'fornecedor'; id: string; descricao: string; valor: number }
  | { tipo: 'item'; id: string; descricao: string; valor: number }
  | { tipo: 'gasto'; id: string; descricao: string; valor: number; data: string };

export interface EntradaOrcamento {
  categorias: readonly CategoriaBase[];
  fornecedores: readonly FornecedorBase[];
  gastos: readonly GastoBase[];
  itens: readonly ItemCompradoBase[];
}

/** Lançamentos de uma categoria: fornecedores fechados, itens comprados com preço e gastos avulsos. */
export function lancamentosDaCategoria(categoria: CategoriaBase, e: EntradaOrcamento): Lancamento[] {
  const r: Lancamento[] = [];
  if (categoria.escopo === 'casamento') {
    for (const f of e.fornecedores) {
      if (f.status === 'fechado' && f.categoria === categoria.id && f.valor) r.push({ tipo: 'fornecedor', id: f.id, descricao: f.nome, valor: f.valor });
    }
  }
  if (categoria.id === CATEGORIA_CASA_DOS_ITENS) {
    for (const i of e.itens) {
      if (i.estado === 'ja_tenho' && i.origem === 'comprado' && i.preco_estimado) {
        r.push({ tipo: 'item', id: i.id, descricao: i.nome, valor: i.preco_estimado * Math.max(1, i.quantidade) });
      }
    }
  }
  for (const g of e.gastos) {
    if (g.categoria_id === categoria.id) r.push({ tipo: 'gasto', id: g.id, descricao: g.descricao, valor: g.valor, data: g.data });
  }
  return r;
}

export interface LinhaOrcamento extends CategoriaBase {
  gasto: number;
  /** Gasto > planejado (só quando há planejado). */
  estourou: boolean;
  /** Quanto passou do planejado (0 se não estourou). */
  excesso: number;
}

export interface ResumoOrcamento {
  linhas: LinhaOrcamento[];
  gastoTotal: number;
  planejadoTotal: number;
  /** Gasto total / planejado total, em %. null sem planejado. */
  percentualUsado: number | null;
  saldo: number;
  estouros: LinhaOrcamento[];
}

/** Resumo do T15 para um escopo (Casamento ou Casa nova). */
export function resumoOrcamento(e: EntradaOrcamento, escopo: EscopoOrcamento): ResumoOrcamento {
  const linhas = e.categorias
    .filter((c) => c.escopo === escopo)
    .sort((a, b) => a.ordem - b.ordem)
    .map((c) => {
      const gasto = lancamentosDaCategoria(c, e).reduce((s, l) => s + l.valor, 0);
      const estourou = c.planejado !== null && gasto > c.planejado;
      return { ...c, gasto, estourou, excesso: estourou ? gasto - c.planejado! : 0 };
    });
  const gastoTotal = linhas.reduce((s, l) => s + l.gasto, 0);
  const planejadoTotal = linhas.reduce((s, l) => s + (l.planejado ?? 0), 0);
  return {
    linhas,
    gastoTotal,
    planejadoTotal,
    percentualUsado: planejadoTotal > 0 ? Math.round((gastoTotal / planejadoTotal) * 100) : null,
    saldo: planejadoTotal - gastoTotal,
    estouros: linhas.filter((l) => l.estourou),
  };
}

/** Atalho "% do orçamento usado" do Início: só os escopos dos módulos ativos (13.9 regra 5). */
export function percentualUsadoNosEscopos(e: EntradaOrcamento, escopos: readonly EscopoOrcamento[]): number | null {
  let gasto = 0;
  let planejado = 0;
  for (const s of escopos) {
    const r = resumoOrcamento(e, s);
    gasto += r.gastoTotal;
    planejado += r.planejadoTotal;
  }
  return planejado > 0 ? Math.round((gasto / planejado) * 100) : null;
}

/**
 * "Editar orçamento" do T15: distribui o total pelos percentuais sugeridos (13.4). Os centavos que
 * sobram do arredondamento vão para a maior categoria, para a soma bater com o total.
 */
export function distribuirOrcamento(total: number, catalogo: CatalogoCategorias): { id: string; planejado: number }[] {
  const lista = catalogo.orcamento_casamento.map((c) => ({
    id: `casamento_${c.id}`,
    planejado: Math.floor((total * (c.percentual_sugerido ?? 0)) / 100),
    percentual: c.percentual_sugerido ?? 0,
  }));
  const somaPercentuais = lista.reduce((s, c) => s + c.percentual, 0);
  if (somaPercentuais === 100) {
    const sobra = total - lista.reduce((s, c) => s + c.planejado, 0);
    const maior = lista.reduce((a, b) => (b.percentual > a.percentual ? b : a));
    maior.planejado += sobra;
  }
  return lista.map(({ id, planejado }) => ({ id, planejado }));
}

/** Estimativa do buffet = valor por pessoa × convidados confirmados (só exibição, 13.4). */
export function estimativaBuffet(valorPorPessoa: number | null, confirmados: number): number | null {
  return valorPorPessoa ? valorPorPessoa * confirmados : null;
}
