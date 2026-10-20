// Comparação de versões "maior.menor.correção" para a versão mínima do app (T67).
export function versaoAbaixoDe(atual: string, minima: string): boolean {
  const a = atual.split('.').map((n) => parseInt(n, 10) || 0);
  const m = minima.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(a.length, m.length); i++) {
    const x = a[i] ?? 0;
    const y = m[i] ?? 0;
    if (x !== y) return x < y;
  }
  return false;
}
