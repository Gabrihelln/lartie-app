// Endereço público do casal: lartie.app/{slug} (ex.: "ana-e-pedro"). A unicidade é garantida pelo
// servidor (coleção slugs/): se já existir, ele tenta "ana-e-pedro-2", "-3"…

export function normalizarSlug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' e ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
}

export function slugDoCasal(nome1: string, nome2: string | null): string {
  const primeiro = (n: string) => n.trim().split(/\s+/)[0] ?? '';
  const base = nome2 ? `${primeiro(nome1)} e ${primeiro(nome2)}` : primeiro(nome1);
  return normalizarSlug(base) || 'casal';
}

export function slugComSufixo(base: string, tentativa: number): string {
  return tentativa <= 1 ? base : `${base}-${tentativa}`;
}
