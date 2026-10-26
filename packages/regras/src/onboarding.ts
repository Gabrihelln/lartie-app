// Passos do onboarding por modo do app (especificação Seção 5).
import type { ModoApp } from '@lartie/modelo';

export type PassoOnboarding = 'T06' | 'T06b' | 'T07' | 'T08' | 'T09' | 'T10' | 'T11';

const PASSOS: Record<ModoApp, readonly PassoOnboarding[]> = {
  os_dois: ['T06', 'T06b', 'T07', 'T08', 'T09', 'T10', 'T11'],
  casamento: ['T06', 'T06b', 'T07', 'T10', 'T11'],
  casa: ['T06', 'T06b', 'T08', 'T09', 'T10', 'T11'],
  // "Decidir depois": sai do onboarding depois do T06b, direto para o T12d.
  indefinido: ['T06', 'T06b'],
};

export function passosDoModo(modo: ModoApp): readonly PassoOnboarding[] {
  return PASSOS[modo];
}

/**
 * Contador da barra de progresso ("1 de 5"). Conta só os passos com formulário: T10 (plano pronto)
 * e T11 (convite) não aparecem no contador. Até a escolha no T06b, o total é 5.
 * Devolve null nos passos sem contador.
 */
export function contadorDoPasso(passo: PassoOnboarding, modo: ModoApp | null): { atual: number; total: number } | null {
  if (passo === 'T10' || passo === 'T11') return null;
  if (passo === 'T06') return { atual: 1, total: 5 };
  if (passo === 'T06b') return { atual: 2, total: modo && modo !== 'indefinido' ? totalDoModo(modo) : 5 };
  if (!modo || modo === 'indefinido') return null;
  const comFormulario = PASSOS[modo].filter((p) => p !== 'T10' && p !== 'T11');
  const i = comFormulario.indexOf(passo);
  return i < 0 ? null : { atual: i + 1, total: comFormulario.length };
}

function totalDoModo(modo: Exclude<ModoApp, 'indefinido'>): number {
  return PASSOS[modo].filter((p) => p !== 'T10' && p !== 'T11').length;
}

/** Próximo passo depois de `passo` no modo escolhido; null = fim do onboarding. */
export function proximoPasso(passo: PassoOnboarding, modo: ModoApp): PassoOnboarding | null {
  const lista = PASSOS[modo];
  const i = lista.indexOf(passo);
  return i >= 0 && i < lista.length - 1 ? lista[i + 1]! : null;
}

/** Passo anterior (Voltar). No T06 volta para fora do onboarding (null). */
export function passoAnterior(passo: PassoOnboarding, modo: ModoApp): PassoOnboarding | null {
  const lista = PASSOS[modo];
  const i = lista.indexOf(passo);
  return i > 0 ? lista[i - 1]! : null;
}

/** Módulos que o plano gera no modo (13.9 regra 2): casamento = checklist + orçamento; casa = enxoval. */
export function modulosDoModo(modo: ModoApp): { casamento: boolean; casa: boolean } {
  return { casamento: modo === 'casamento' || modo === 'os_dois', casa: modo === 'casa' || modo === 'os_dois' };
}
