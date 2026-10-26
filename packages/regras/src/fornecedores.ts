// Fornecedores e parcelas (T16, T17, T37 e "Próximas parcelas" do T15).
import type { StatusFornecedor } from '@lartie/modelo';
import type { FornecedorBase } from './orcamento';

export const STATUS_FORNECEDOR_ROTULO: Record<StatusFornecedor, string> = {
  pesquisando: 'Pesquisando',
  orcamento_pedido: 'Orçamento pedido',
  negociando: 'Negociando',
  fechado: 'Fechado',
  descartado: 'Descartado',
};

/** Nome curto da categoria nos chips e cartões do T16 (como no protótipo). */
const ROTULO_CURTO: Record<string, string> = {
  casamento_local_buffet: 'Local e buffet',
  casamento_foto_video: 'Fotografia',
  casamento_decoracao_flores: 'Decoração',
  casamento_musica: 'Música',
  casamento_roupas_beleza: 'Roupas',
  casamento_convites_papelaria: 'Convites',
  casamento_lua_de_mel: 'Lua de mel',
  casamento_imprevistos: 'Outros',
};

export function rotuloCategoriaFornecedor(categoriaId: string, nomeCategoria?: string): string {
  return ROTULO_CURTO[categoriaId] ?? nomeCategoria ?? categoriaId;
}

/** Chips fixos do T16, na ordem do protótipo; as demais categorias entram se tiverem fornecedor. */
export const CHIPS_FIXOS_FORNECEDORES = [
  'casamento_foto_video',
  'casamento_local_buffet',
  'casamento_decoracao_flores',
  'casamento_musica',
  'casamento_roupas_beleza',
] as const;

export function chipsFornecedores(fornecedores: readonly Pick<FornecedorBase, 'categoria'>[]): string[] {
  const fixos: string[] = [...CHIPS_FIXOS_FORNECEDORES];
  const extras = [...new Set(fornecedores.map((f) => f.categoria))].filter((c) => !fixos.includes(c));
  return [...fixos, ...extras];
}

/** Resumo do T16: Fechados · Negociando (inclui orçamento pedido) · Pesquisando. */
export function resumoFornecedores(fornecedores: readonly Pick<FornecedorBase, 'status'>[]) {
  return {
    fechados: fornecedores.filter((f) => f.status === 'fechado').length,
    negociando: fornecedores.filter((f) => f.status === 'negociando' || f.status === 'orcamento_pedido').length,
    pesquisando: fornecedores.filter((f) => f.status === 'pesquisando').length,
  };
}

/** Atalho do T12b: "{x} de {y} fornecedores fechados" (descartados não contam). */
export function fornecedoresFechados(fornecedores: readonly Pick<FornecedorBase, 'status'>[]) {
  const ativos = fornecedores.filter((f) => f.status !== 'descartado');
  return { fechados: ativos.filter((f) => f.status === 'fechado').length, total: ativos.length };
}

/** Iniciais do avatar ("Studio Luz" → "SL"). */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0]!.slice(0, 2).toUpperCase();
  return (partes[0]![0]! + partes[1]![0]!).toUpperCase();
}

export interface ErrosFornecedor {
  nome?: string;
  categoria?: string;
  valor?: string;
}

/** Validações do T17: nome e categoria obrigatórios; valor obrigatório para fechar. */
export function validarFornecedor(d: { nome: string; categoria: string | null; valor: number | null }, fechando: boolean): ErrosFornecedor {
  const erros: ErrosFornecedor = {};
  if (!d.nome.trim()) erros.nome = 'Informe o nome do fornecedor.';
  if (!d.categoria) erros.categoria = 'Escolha a categoria.';
  if (fechando && !d.valor) erros.valor = 'Informe o valor para fechar.';
  return erros;
}

/** T37: fechar um fornecedor conclui as tarefas ligadas a ele que ainda não estão concluídas. */
export function tarefasConcluidasAoFechar<T extends { id: string; fornecedor_id: string | null; status: string }>(
  fornecedorId: string,
  tarefas: readonly T[],
): string[] {
  return tarefas.filter((t) => t.fornecedor_id === fornecedorId && t.status !== 'concluida').map((t) => t.id);
}

// Parcelas -----------------------------------------------------------------------------------

export interface ParcelaBase {
  id: string;
  fornecedor_id: string;
  numero: number;
  descricao: string;
  valor: number;
  vencimento: string;
  paga: boolean;
}

/** Soma meses a uma data, mantendo o dia (ou o último dia do mês, se não existir). */
export function adicionarMeses(data: string, meses: number): string {
  const [a, m, d] = data.split('-').map(Number) as [number, number, number];
  const total = a * 12 + (m - 1) + meses;
  const ano = Math.floor(total / 12);
  const mes = (total % 12) + 1;
  const ultimo = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return `${ano}-${String(mes).padStart(2, '0')}-${String(Math.min(d, ultimo)).padStart(2, '0')}`;
}

/**
 * "Gerar parcelas" do T17: entrada + N parcelas mensais a partir do valor, em partes iguais.
 * A entrada vence na data informada; a parcela k vence k meses depois. Os centavos que sobram da
 * divisão vão para a entrada, para a soma bater com o valor.
 */
export function gerarParcelas(valor: number, parcelas: number, primeiroVencimento: string) {
  const partes = parcelas + 1;
  const base = Math.floor(valor / partes);
  const sobra = valor - base * partes;
  return Array.from({ length: partes }, (_, k) => ({
    numero: k,
    descricao: k === 0 ? 'Entrada' : `Parcela ${k}`,
    valor: k === 0 ? base + sobra : base,
    vencimento: adicionarMeses(primeiroVencimento, k),
    paga: false,
  }));
}

/** Diferença entre a soma das parcelas e o valor (0 = bate). O T17 avisa, mas não bloqueia. */
export function diferencaParcelas(valor: number | null, parcelas: readonly Pick<ParcelaBase, 'valor'>[]): number {
  if (!valor || parcelas.length === 0) return 0;
  return parcelas.reduce((s, p) => s + p.valor, 0) - valor;
}

/** "Parcela n de m" (a entrada aparece pelo nome). */
export function rotuloParcela(p: Pick<ParcelaBase, 'numero' | 'descricao'>, doFornecedor: readonly Pick<ParcelaBase, 'numero'>[]): string {
  if (p.numero === 0) return p.descricao;
  const m = doFornecedor.filter((x) => x.numero > 0).length;
  return `Parcela ${p.numero} de ${m}`;
}

/**
 * "Próximas parcelas" do T15: não pagas, de fornecedores fechados, por vencimento.
 * As de fornecedores não fechados ainda não entram no calendário.
 */
export function proximasParcelas<P extends ParcelaBase>(
  parcelas: readonly P[],
  fornecedores: readonly Pick<FornecedorBase, 'id' | 'status'>[],
  limite = 5,
): P[] {
  const fechados = new Set(fornecedores.filter((f) => f.status === 'fechado').map((f) => f.id));
  return parcelas
    .filter((p) => !p.paga && fechados.has(p.fornecedor_id))
    .sort((a, b) => (a.vencimento < b.vencimento ? -1 : a.vencimento > b.vencimento ? 1 : a.numero - b.numero))
    .slice(0, limite);
}
