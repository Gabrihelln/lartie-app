// P04 (decidido em 27/10/2026): tarefas da mudança na tela Casa (seção "Mudança").
// Prazo relativo à data da mudança (mês/ano, contado a partir do dia 1 do mês).
import type { CatalogoTarefas } from './catalogos';
import { adicionarDias, formatarData } from './datas';

export interface TarefaMudancaGerada {
  id: string;
  titulo: string;
  dias_antes: number;
  ordem: number;
}

/** Tarefas do catálogo que valem para o imóvel (ex.: vistoria só se for alugado). */
export function gerarTarefasMudanca(catalogo: CatalogoTarefas, imovel: { posse: 'alugado' | 'proprio' }): TarefaMudancaGerada[] {
  return (catalogo.tarefas_mudanca?.itens ?? [])
    .filter((t) => !t.condicao.posse || t.condicao.posse === imovel.posse)
    .sort((a, b) => b.dias_antes_da_mudanca - a.dias_antes_da_mudanca)
    .map((t, i) => ({ id: t.id, titulo: t.titulo, dias_antes: t.dias_antes_da_mudanca, ordem: i + 1 }));
}

/** "até 15/04/2027" com data da mudança; sem data, "30 dias antes da mudança" / "no dia da mudança". */
export function prazoDaMudanca(diasAntes: number | null, dataMudanca: string | null): string | null {
  if (diasAntes === null) return null;
  if (!dataMudanca) return diasAntes === 0 ? 'no dia da mudança' : `${diasAntes} dias antes da mudança`;
  return `até ${formatarData(adicionarDias(`${dataMudanca}-01`, -diasAntes)).slice(0, 5)}`;
}
