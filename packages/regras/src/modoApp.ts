// Modo do app: especificação 1.3 (navegação) e 13.9 (o que cada modo mostra).
import type { ModoApp } from '@lartie/modelo';

export type Aba = 'inicio' | 'casamento' | 'convidados' | 'casa' | 'presentes' | 'perfil';

/** Ordem fixa das abas (1.3): ao mudar de modo, as abas entram e saem sem reordenar. */
export const ORDEM_ABAS: readonly Aba[] = ['inicio', 'casamento', 'convidados', 'casa', 'presentes', 'perfil'];

const ABAS_POR_MODO: Record<ModoApp, readonly Aba[]> = {
  os_dois: ['inicio', 'casamento', 'casa', 'presentes', 'perfil'],
  casamento: ['inicio', 'casamento', 'convidados', 'presentes', 'perfil'],
  casa: ['inicio', 'casa', 'presentes', 'perfil'],
  indefinido: ['inicio', 'presentes', 'perfil'],
};

export const ROTULOS_ABAS: Record<Aba, string> = {
  inicio: 'Início',
  casamento: 'Casamento',
  convidados: 'Convidados',
  casa: 'Casa',
  presentes: 'Presentes',
  perfil: 'Perfil',
};

export function abasDoModo(modo: ModoApp): readonly Aba[] {
  return ABAS_POR_MODO[modo];
}

export type TelaInicial = 'T12' | 'T12b' | 'T12c' | 'T12d';

export function telaInicial(modo: ModoApp): TelaInicial {
  switch (modo) {
    case 'os_dois':
      return 'T12';
    case 'casamento':
      return 'T12b';
    case 'casa':
      return 'T12c';
    case 'indefinido':
      return 'T12d';
  }
}

export type Modulo = 'checklist' | 'orcamento' | 'fornecedores' | 'convidados' | 'casa' | 'presentes' | 'assistente';

/** Tabela "O que cada modo mostra" (13.9). Presentes, perfil e notificações existem em todos os modos. */
export function moduloVisivel(modo: ModoApp, modulo: Modulo): boolean {
  const casamento = modo === 'casamento' || modo === 'os_dois';
  const casa = modo === 'casa' || modo === 'os_dois';
  switch (modulo) {
    case 'checklist':
    case 'fornecedores':
    case 'convidados':
      return casamento;
    case 'orcamento':
      // No modo casa, o orçamento existe só com as categorias da casa (acessado por T18).
      return modo !== 'indefinido';
    case 'casa':
      return casa;
    case 'presentes':
    case 'assistente':
      return true;
  }
}

/** Escopos de categoria de orçamento visíveis no modo (13.9 regra 5). */
export function escoposOrcamento(modo: ModoApp): readonly ('casamento' | 'casa')[] {
  switch (modo) {
    case 'os_dois':
      return ['casamento', 'casa'];
    case 'casamento':
      return ['casamento'];
    case 'casa':
      return ['casa'];
    case 'indefinido':
      return [];
  }
}

/** Telas onde o botão flutuante da assistente aparece (1.3). Nunca em T12d. */
const TELAS_COM_FAB = new Set(['T12', 'T12b', 'T12c', 'T13', 'T18']);

/**
 * O botão flutuante da assistente aparece nesta tela?
 * `iaAtiva` vem do Remote Config: a IA está fora do escopo atual (pendência P14) e fica escondida.
 */
export function mostrarFabAssistente(tela: string, iaAtiva: boolean): boolean {
  return iaAtiva && TELAS_COM_FAB.has(tela);
}
