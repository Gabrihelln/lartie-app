// Datas de calendário ("aaaa-mm-dd"), sem fuso: o prazo de uma tarefa é um dia, não um instante.

export function hojeLocal(agora = new Date()): string {
  const a = agora.getFullYear();
  const m = String(agora.getMonth() + 1).padStart(2, '0');
  const d = String(agora.getDate()).padStart(2, '0');
  return `${a}-${m}-${d}`;
}

function paraUtc(data: string): number {
  const [a, m, d] = data.split('-').map(Number);
  return Date.UTC(a!, m! - 1, d!);
}

export function adicionarDias(data: string, dias: number): string {
  const r = new Date(paraUtc(data) + dias * 86_400_000);
  return `${r.getUTCFullYear()}-${String(r.getUTCMonth() + 1).padStart(2, '0')}-${String(r.getUTCDate()).padStart(2, '0')}`;
}

/** Dias de `de` até `ate` (positivo se `ate` é depois). */
export function diferencaEmDias(de: string, ate: string): number {
  return Math.round((paraUtc(ate) - paraUtc(de)) / 86_400_000);
}

/** "aaaa-mm-dd" → "dd/mm/aaaa" (formato da especificação 2.3). */
export function formatarData(data: string): string {
  const [a, m, d] = data.split('-');
  return `${d}/${m}/${a}`;
}

/** "dd/mm/aaaa" → "aaaa-mm-dd", ou null se não for uma data válida. */
export function lerData(texto: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim());
  if (!m) return null;
  const iso = `${m[3]}-${m[2]}-${m[1]}`;
  return adicionarDias(iso, 0) === iso ? iso : null;
}
