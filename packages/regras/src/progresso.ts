// 13.3 Progresso, "Atrasada" (3.7) e as listas do Início e do checklist (T12, T12b, T13).
import type { EstadoItem, FaseItem, FaseTarefa, StatusTarefa } from '@lartie/modelo';
import { FASES_ITEM, FASES_TAREFA } from '@lartie/modelo';
import { adicionarDias, diferencaEmDias } from './datas';

/** O mínimo de uma tarefa que as regras usam (o documento do Firestore tem mais campos). */
export interface TarefaBase {
  id: string;
  status: StatusTarefa;
  prazo: string | null;
  fase: FaseTarefa;
  oculta: boolean;
  ordem: number;
}

export interface ItemBase {
  estado: EstadoItem;
  fase: FaseItem;
}

/** Nome e período de cada fase do checklist (13.1), como no protótipo do T13. */
export const FASES_CHECKLIST: Record<FaseTarefa, { nome: string; periodo: string }> = {
  decisoes_iniciais: { nome: 'Decisões iniciais', periodo: '12 meses antes' },
  fornecedores_principais: { nome: 'Fornecedores principais', periodo: '10 a 8 meses antes' },
  detalhes: { nome: 'Detalhes', periodo: '7 a 4 meses antes' },
  documentos_reta_final: { nome: 'Documentos e reta final', periodo: '3 a 1 mês antes' },
  semana_casamento: { nome: 'Semana do casamento', periodo: 'Últimos 7 dias' },
};

export const FASES_ENXOVAL: Record<FaseItem, string> = {
  primeira_noite: 'Primeira noite',
  primeiro_mes: 'Primeiro mês',
  com_calma: 'Com calma',
};

export interface Contagem {
  feitos: number;
  total: number;
}

export function percentual({ feitos, total }: Contagem): number {
  return total > 0 ? Math.round((Math.min(feitos, total) / total) * 100) : 0;
}

/** Atrasada = status ≠ concluída e prazo < hoje (3.7). Calculado, nunca gravado. */
export function tarefaAtrasada(t: Pick<TarefaBase, 'status' | 'prazo'>, hoje: string): boolean {
  return t.status !== 'concluida' && !!t.prazo && t.prazo < hoje;
}

/** T14 "Atrasada {n} dias". 0 quando não está atrasada. */
export function diasDeAtraso(t: Pick<TarefaBase, 'status' | 'prazo'>, hoje: string): number {
  return tarefaAtrasada(t, hoje) ? diferencaEmDias(t.prazo!, hoje) : 0;
}

/** Casamento: tarefas concluídas / tarefas não ocultas (13.3). */
export function progressoCasamento(tarefas: readonly TarefaBase[]): Contagem {
  const visiveis = tarefas.filter((t) => !t.oculta);
  return { feitos: visiveis.filter((t) => t.status === 'concluida').length, total: visiveis.length };
}

export function progressoPorFase(tarefas: readonly TarefaBase[]): Record<FaseTarefa, Contagem> {
  const r = Object.fromEntries(FASES_TAREFA.map((f) => [f, { feitos: 0, total: 0 }])) as Record<FaseTarefa, Contagem>;
  for (const t of tarefas) {
    if (t.oculta) continue;
    r[t.fase].total++;
    if (t.status === 'concluida') r[t.fase].feitos++;
  }
  return r;
}

/** Fase atual do checklist: a primeira com tarefas ainda por fazer (selo "Fase: …" do T12b). */
export function faseAtualChecklist(tarefas: readonly TarefaBase[]): FaseTarefa | null {
  const porFase = progressoPorFase(tarefas);
  return FASES_TAREFA.find((f) => porFase[f].total > 0 && porFase[f].feitos < porFase[f].total) ?? null;
}

/**
 * T56: a fase da tarefa `id` ficou completa com esta marcação? Devolve a fase concluída e a
 * próxima fase com tarefas (para "Ver próxima fase"), ou null.
 */
export function faseConcluidaAoMarcar(
  tarefas: readonly TarefaBase[],
  id: string,
): { fase: FaseTarefa; proxima: FaseTarefa | null } | null {
  const marcada = tarefas.find((t) => t.id === id);
  if (!marcada || marcada.oculta || marcada.status !== 'concluida') return null;
  const porFase = progressoPorFase(tarefas);
  const c = porFase[marcada.fase];
  if (c.total === 0 || c.feitos < c.total) return null;
  const depois = FASES_TAREFA.slice(FASES_TAREFA.indexOf(marcada.fase) + 1);
  return { fase: marcada.fase, proxima: depois.find((f) => porFase[f].total > 0) ?? null };
}

/** Ordem do checklist: pela ordem da fase, depois pelo campo `ordem`. */
export function ordenarTarefas<T extends TarefaBase>(tarefas: readonly T[]): T[] {
  return [...tarefas].sort((a, b) => FASES_TAREFA.indexOf(a.fase) - FASES_TAREFA.indexOf(b.fase) || a.ordem - b.ordem);
}

/**
 * "Próximas tarefas" do Início (até 3): só as não concluídas e não ocultas; atrasadas primeiro,
 * depois por prazo. Sem prazo (casamento sem data) vão por último, na ordem do checklist.
 */
export function proximasTarefas<T extends TarefaBase>(tarefas: readonly T[], hoje: string, limite = 3): T[] {
  const abertas = ordenarTarefas(tarefas.filter((t) => !t.oculta && t.status !== 'concluida'));
  return abertas
    .map((t, i) => ({ t, i }))
    .sort((a, b) => {
      const atrA = tarefaAtrasada(a.t, hoje) ? 0 : 1;
      const atrB = tarefaAtrasada(b.t, hoje) ? 0 : 1;
      if (atrA !== atrB) return atrA - atrB;
      if (a.t.prazo && b.t.prazo && a.t.prazo !== b.t.prazo) return a.t.prazo < b.t.prazo ? -1 : 1;
      if (!!a.t.prazo !== !!b.t.prazo) return a.t.prazo ? -1 : 1;
      return a.i - b.i;
    })
    .slice(0, limite)
    .map(({ t }) => t);
}

export type FiltroChecklist = 'todas' | 'a_fazer' | 'atrasadas' | 'concluidas';

/** Filtros do T13. "A fazer" inclui "Em andamento" (tudo que não está concluído). */
export function filtrarChecklist<T extends TarefaBase>(
  tarefas: readonly T[],
  filtro: FiltroChecklist,
  hoje: string,
  mostrarOcultas = false,
): T[] {
  return ordenarTarefas(tarefas).filter((t) => {
    if (t.oculta && !mostrarOcultas) return false;
    switch (filtro) {
      case 'todas':
        return true;
      case 'a_fazer':
        return t.status !== 'concluida';
      case 'atrasadas':
        return tarefaAtrasada(t, hoje);
      case 'concluidas':
        return t.status === 'concluida';
    }
  });
}

/**
 * Arrastar para reordenar dentro da fase (T13): move `id` para a posição `para` da lista da fase
 * e devolve as novas ordens só das tarefas que mudaram.
 */
export function reordenarNaFase<T extends TarefaBase>(tarefasDaFase: readonly T[], id: string, para: number): { id: string; ordem: number }[] {
  const lista = [...tarefasDaFase].sort((a, b) => a.ordem - b.ordem);
  const de = lista.findIndex((t) => t.id === id);
  if (de < 0) return [];
  const destino = Math.max(0, Math.min(lista.length - 1, para));
  if (destino === de) return [];
  const ordens = lista.map((t) => t.ordem);
  const [movida] = lista.splice(de, 1);
  lista.splice(destino, 0, movida!);
  // Reaproveita as ordens existentes (ordenadas): as outras fases não mudam.
  return lista.map((t, i) => ({ id: t.id, ordem: ordens[i]! })).filter((n, i) => lista[i]!.ordem !== n.ordem);
}

/** Ordem para uma tarefa nova: depois da última da fase. */
export function proximaOrdem(tarefas: readonly TarefaBase[], fase: FaseTarefa): number {
  const daFase = tarefas.filter((t) => t.fase === fase).map((t) => t.ordem);
  const todas = tarefas.map((t) => t.ordem);
  return (daFase.length ? Math.max(...daFase) : todas.length ? Math.max(...todas) : 0) + 1;
}

// Fase e prazo sugeridos para tarefas novas (T14) -------------------------------------------

/**
 * Fim da janela de cada fase, em dias antes do casamento (13.1: 12 · 10 a 8 · 7 a 4 · 3 a 1 meses ·
 * últimos 7 dias). É o prazo sugerido de uma tarefa nova sem prazo ("usa a data sugerida da fase").
 */
const FIM_DA_FASE_DIAS: Record<FaseTarefa, number> = {
  decisoes_iniciais: 330,
  fornecedores_principais: 240,
  detalhes: 120,
  documentos_reta_final: 30,
  semana_casamento: 1,
};

/** T14 "nova tarefa": fase pré-selecionada pela data (quanto falta para o casamento). */
export function faseSugeridaPelaData(dataCasamento: string | null, hoje: string): FaseTarefa {
  if (!dataCasamento) return 'decisoes_iniciais';
  const dias = diferencaEmDias(hoje, dataCasamento);
  if (dias <= 7) return 'semana_casamento';
  if (dias <= 105) return 'documentos_reta_final';
  if (dias <= 225) return 'detalhes';
  if (dias <= 315) return 'fornecedores_principais';
  return 'decisoes_iniciais';
}

/** Prazo sugerido da fase; null sem data de casamento. Nunca antes de hoje. */
export function prazoSugeridoDaFase(fase: FaseTarefa, dataCasamento: string | null, hoje: string): string | null {
  if (!dataCasamento) return null;
  const prazo = adicionarDias(dataCasamento, -FIM_DA_FASE_DIAS[fase]);
  return prazo < hoje ? hoje : prazo;
}

// Casa (13.3) — usado pelo T12 e T12c nesta etapa; as telas da Casa são da Etapa 4 --------------

/** Casa: itens "Já tenho" / itens totais, respeitando o filtro de fase quando houver. */
export function progressoCasa(itens: readonly ItemBase[], fase?: FaseItem): Contagem {
  const lista = fase ? itens.filter((i) => i.fase === fase) : itens;
  return { feitos: lista.filter((i) => i.estado === 'ja_tenho').length, total: lista.length };
}

/** Fase atual do enxoval: a primeira não concluída (destacada no T12c). */
export function faseAtualEnxoval(itens: readonly ItemBase[]): FaseItem | null {
  return FASES_ITEM.find((f) => {
    const c = progressoCasa(itens, f);
    return c.total > 0 && c.feitos < c.total;
  }) ?? null;
}
