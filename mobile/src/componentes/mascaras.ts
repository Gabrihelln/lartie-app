// Máscaras puras (sem React), testadas em __tests__/mascaras.test.ts.
/**
 * Telefone brasileiro com DDD: "(41) 99999-0000" (celular, 11 dígitos) ou "(41) 3333-0000" (fixo,
 * 10 dígitos). Para de aceitar números depois do 11º.
 */
export function mascararTelefone(texto: string): string {
  const d = texto.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  const ddd = d.slice(0, 2);
  const resto = d.slice(2);
  const meio = resto.length > 8 ? 5 : 4;
  return resto.length <= meio ? `(${ddd}) ${resto}` : `(${ddd}) ${resto.slice(0, meio)}-${resto.slice(meio)}`;
}
