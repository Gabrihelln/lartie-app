// Categorias de orçamento criadas com o plano (13.4).
import type { EscopoOrcamento } from '@lartie/modelo';
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
