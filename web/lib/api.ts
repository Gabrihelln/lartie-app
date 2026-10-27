import type { Ocasiao, Presenca, RestricaoAlimentar, StatusReserva } from '@lartie/modelo';

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

export interface PaginaRsvp {
  casal: { nome_1: string; nome_2: string | null };
  data: string | null;
  horario: string | null;
  local: string | null;
  cidade: string | null;
  uf: string | null;
  prazo: string | null;
  encerrado: boolean;
  grupo: string;
  recado: string | null;
  respondido: boolean;
  pessoas: { id: string; nome: string; faixa: 'adulto' | 'crianca'; presenca: Presenca; restricao: RestricaoAlimentar; restricao_outra: string | null }[];
  lista: { slug: string; slug_lista: string } | null;
}

export const caminhoRsvp = (token: string) => `/v1/publico/rsvp/${encodeURIComponent(token)}`;
