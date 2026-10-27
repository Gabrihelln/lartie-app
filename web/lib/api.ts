import type { Ocasiao, StatusReserva } from '@lartie/modelo';

// Chamadas à API do Lartiê feitas pelo servidor da web. Em desenvolvimento a API roda no Mac
// (porta 8100); na VPS, em 127.0.0.1 atrás do nginx. O navegador nunca fala direto com a API.
export const API_URL = process.env.API_URL ?? 'http://127.0.0.1:8100';

export interface Presente {
  id: string;
  nome: string;
  comodo: string | null;
  faltam: number;
  preco: number | null;
  link: string | null;
  foto: boolean;
}

export interface PaginaLista {
  casal: { nome_1: string; nome_2: string | null };
  ocasiao: Ocasiao;
  nome_ocasiao: string;
  data_evento: string | null;
  mensagem: string | null;
  presentes: Presente[];
}

export interface ReservaConsultada {
  status: StatusReserva;
  quantidade: number;
  item: string;
  nome: string;
  expira_em: string;
  entrega: string | null;
  casal: string;
  lista: { slug: string; slug_lista: string; nome: string } | null;
}

/** GET na API; devolve null em 404 (lista despublicada, excluída ou inexistente → T52). */
export async function buscar<T>(caminho: string): Promise<T | null> {
  const r = await fetch(`${API_URL}${caminho}`, { cache: 'no-store' });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`API ${r.status}`);
  return (await r.json()) as T;
}

const seguro = (s: string) => encodeURIComponent(s);
export const caminhoLista = (slug: string, lista: string) => `/v1/publico/${seguro(slug)}/${seguro(lista)}`;
export const caminhoReserva = (token: string) => `/v1/publico/reservas/${seguro(token)}`;

/** "R$ 25" (valores inteiros em reais, como no app). */
export function reais(centavos: number | null): string {
  if (centavos === null) return '';
  return `R$ ${Math.round(centavos / 100).toLocaleString('pt-BR')}`;
}
