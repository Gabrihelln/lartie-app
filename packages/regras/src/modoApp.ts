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

// Troca de modo (T33b, cartões do T12b/T12c, "Começar pelo…" do T12d e folha "Ativar {módulo}?") --

/** Valor mostrado na linha "Modo do app" do T33. */
export const ROTULO_MODO: Record<ModoApp, string> = {
  os_dois: 'Casamento e casa',
  casamento: 'Só casamento',
  casa: 'Só casa nova',
  indefinido: 'A definir',
};

/** Títulos das opções (iguais ao T06b). */
export const NOME_MODO: Record<ModoApp, string> = {
  casamento: 'Só o casamento',
  casa: 'Só a casa nova',
  os_dois: 'Casamento e casa nova',
  indefinido: 'Decidir depois',
};

/** "Início, Casa, Presentes e Perfil" */
export function listarAbas(modo: ModoApp): string {
  const nomes = abasDoModo(modo).map((a) => ROTULOS_ABAS[a]);
  return nomes.length > 1 ? `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}` : nomes.join('');
}

/** Folha de confirmação do T33b: título, abas e o que fica guardado. */
export function textoConfirmacaoModo(de: ModoApp, para: ModoApp) {
  const antes = { casamento: de === 'casamento' || de === 'os_dois', casa: de === 'casa' || de === 'os_dois' };
  const depois = { casamento: para === 'casamento' || para === 'os_dois', casa: para === 'casa' || para === 'os_dois' };
  const guardados: string[] = [];
  if (antes.casamento && !depois.casamento) guardados.push('O checklist, o orçamento e os convidados ficam guardados.');
  if (antes.casa && !depois.casa) guardados.push('O enxoval, os cômodos e as medidas ficam guardados.');
  return {
    titulo: `Mudar para “${NOME_MODO[para]}”?`,
    abas: listarAbas(para),
    guardado: guardados.join(' ') || null,
  };
}

/**
 * 13.9 regra 2: dados a pedir antes de ativar o modo. Só para módulos nunca gerados
 * (casamento: T07; casa: T08 + T09). Lista vazia = só reexibe.
 */
export function passosParaAtivar(
  alvo: ModoApp,
  gerados: { casamento: boolean; casa: boolean },
): ('T07' | 'T08' | 'T09')[] {
  const passos: ('T07' | 'T08' | 'T09')[] = [];
  if ((alvo === 'casamento' || alvo === 'os_dois') && !gerados.casamento) passos.push('T07');
  if ((alvo === 'casa' || alvo === 'os_dois') && !gerados.casa) passos.push('T08', 'T09');
  return passos;
}

export type ModuloAtivavel = 'casamento' | 'casa';

/** Modo resultante de ativar um módulo a partir do modo atual (folha "Ativar {módulo}?"). */
export function modoAoAtivar(atual: ModoApp, modulo: ModuloAtivavel): ModoApp {
  if (atual === 'os_dois') return 'os_dois';
  if (atual === 'indefinido') return modulo;
  return atual === modulo ? atual : 'os_dois';
}

export const NOME_MODULO: Record<ModuloAtivavel, string> = { casamento: 'O casamento', casa: 'A casa nova' };

/** Folha "Ativar {módulo}?" (13.9 regra 6). */
export function textoAtivarModulo(modulo: ModuloAtivavel) {
  const nome = modulo === 'casamento' ? 'Casamento' : 'Casa nova';
  return { titulo: `Ativar ${nome}?`, texto: `${nome} está desativado no momento. Querem ativar?` };
}

/** Texto da notificação "Modo alterado" (Seção 12). */
export function textoModoAlterado(nome: string, modo: ModoApp): string {
  return `${nome} mudou o app para “${NOME_MODO[modo]}”.`;
}
