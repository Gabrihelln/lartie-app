// Presentes (Etapa 5): listas, reservas e agradecimentos (T23 a T27, T65, 13.5, 13.9 regra 4).
import type { ModoApp, Ocasiao, StatusReserva } from '@lartie/modelo';
import { normalizarSlug } from './slug';

export const NOME_OCASIAO: Record<Ocasiao, string> = {
  cha_panela: 'Chá de panela',
  cha_cozinha: 'Chá de cozinha',
  cha_bar: 'Chá bar',
  casamento: 'Casamento',
};

/** Como a ocasião entra numa frase: "do chá de panela", "do casamento". */
export function daOcasiao(o: Ocasiao): string {
  return `do ${NOME_OCASIAO[o].toLocaleLowerCase('pt-BR')}`;
}

/** "Esconde quem reservou até o dia do chá" / "do casamento" (T24). */
export function diaDaOcasiao(o: Ocasiao): string {
  return o === 'casamento' ? 'do casamento' : 'do chá';
}

/** 13.9 regra 4: ocasiões disponíveis ao criar uma lista, conforme o modo do app. */
export function ocasioesDoModo(modo: ModoApp): Ocasiao[] {
  switch (modo) {
    case 'casamento':
      return ['cha_panela', 'cha_bar', 'casamento'];
    case 'casa':
      return ['cha_panela', 'cha_cozinha', 'cha_bar'];
    default:
      return ['cha_panela', 'cha_cozinha', 'cha_bar', 'casamento'];
  }
}

/** Endereço sugerido da lista: "cha-de-panela"; se já existir, "cha-de-panela-2"… */
export function sugerirSlugLista(o: Ocasiao, existentes: readonly string[]): string {
  const base = normalizarSlug(NOME_OCASIAO[o]);
  if (!existentes.includes(base)) return base;
  for (let n = 2; ; n++) if (!existentes.includes(`${base}-${n}`)) return `${base}-${n}`;
}

/** Endereço do link: letras minúsculas, números e hífens, 3 a 40 caracteres, único no casal. */
export function validarSlugLista(slug: string, existentes: readonly string[]): string | null {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length < 3 || slug.length > 40) {
    return 'Use de 3 a 40 letras minúsculas, números e hífens.';
  }
  if (existentes.includes(slug)) return 'Vocês já têm uma lista com este endereço.';
  return null;
}

export const DIAS_RESERVA = 15;
export const DIAS_AVISO_EXPIRACAO = 2;

/** Reservas que ocupam unidades: ativas e recebidas (13.5). */
export const ocupa = (s: StatusReserva) => s === 'ativa' || s === 'recebida';

/** Disponível = quantidade na lista − reservas ativas e recebidas. */
export function disponivel(quantidadeNaLista: number, reservas: readonly { quantidade: number; status: StatusReserva }[]): number {
  return Math.max(0, quantidadeNaLista - reservas.filter((r) => ocupa(r.status)).reduce((s, r) => s + r.quantidade, 0));
}

/** Decide uma reserva (o servidor chama dentro da transação). */
export function conferirReserva(pedido: number, disponiveis: number): 'ok' | 'indisponivel' | 'quantidade_invalida' {
  if (!Number.isInteger(pedido) || pedido < 1) return 'quantidade_invalida';
  return pedido > disponiveis ? 'indisponivel' : 'ok';
}

/** Resumo do T23 (somando todas as listas): reservados, recebidos, ainda faltam. */
export function resumoPresentes(
  itens: readonly { quantidade_na_lista: number }[],
  reservas: readonly { quantidade: number; status: StatusReserva }[],
) {
  const reservados = reservas.filter((r) => r.status === 'ativa').reduce((s, r) => s + r.quantidade, 0);
  const recebidos = reservas.filter((r) => r.status === 'recebida').reduce((s, r) => s + r.quantidade, 0);
  const total = itens.reduce((s, i) => s + i.quantidade_na_lista, 0);
  return { reservados, recebidos, faltam: Math.max(0, total - reservados - recebidos), total };
}

/** Modo surpresa: o casal vê "Reservado", sem o nome, até o dia do evento. Sem data, sempre esconde. */
export function esconderNome(modoSurpresa: boolean, dataEvento: string | null, hoje: string): boolean {
  if (!modoSurpresa) return false;
  return !dataEvento || hoje < dataEvento;
}

// Mensagens (docs/textos-e-mensagens.md, seção 3) --------------------------------------------

export const DOMINIO = 'lartie.app';

export function linkDaLista(slug: string, slugLista: string): string {
  return `${DOMINIO}/${slug}/${slugLista}`;
}

export function linkDaReserva(slug: string, token: string): string {
  return `${DOMINIO}/${slug}/reserva/${token}`;
}

/** T65 · WhatsApp. */
export function mensagemCompartilhar(o: Ocasiao, link: string): string {
  return `Oi! Fizemos nossa lista de presentes ${daOcasiao(o)}. Escolha um presente e reserve aqui: ${link}`;
}

export function nomesDoCasal(nome1: string, nome2: string | null): string {
  return nome2 ? `${nome1} & ${nome2}` : nome1;
}

/** Confirmação de reserva (T26). */
export function mensagemConfirmacaoReserva(d: {
  convidado: string;
  quantidade: number;
  item: string;
  casal: string;
  expiraEm: string;
  entrega: string | null;
  link: string;
}): string {
  return [
    `Oi, ${d.convidado}! Sua reserva de ${d.quantidade} ${d.item} para ${d.casal} está confirmada. Ela vale até ${d.expiraEm}.`,
    d.entrega ? `Entrega: ${d.entrega}` : null,
    `Se mudar de ideia, desfaça aqui: ${d.link}`,
  ]
    .filter(Boolean)
    .join('\n');
}

/** Reserva cancelada pelo casal (item removido ou lista excluída). */
export function mensagemReservaCancelada(d: { convidado: string; casal: string; item: string; link: string }): string {
  return `Oi, ${d.convidado}! ${d.casal} tiraram ${d.item} da lista, então a sua reserva foi cancelada. Veja outros presentes: ${d.link}`;
}

/** Notificação "Nova reserva" (Seção 12). */
export function textoNovaReserva(nome: string, item: string, o: Ocasiao, surpresa: boolean): string {
  return surpresa ? `Alguém reservou ${item}.` : `${nome} reservou ${item} no ${NOME_OCASIAO[o].toLocaleLowerCase('pt-BR')}.`;
}

// Agradecimentos (T27) ------------------------------------------------------------------------

export function modeloAgradecimentoPadrao(nome1: string, nome2: string | null): string {
  return `Oi, [nome]! Muito obrigado pelo [presente]. Ele já tem lugar especial na nossa casa nova. Com carinho, ${nome2 ? `${nome1} e ${nome2}` : nome1}.`;
}

export function preencherAgradecimento(modelo: string, nome: string, presente: string): string {
  return modelo.replaceAll('[nome]', nome).replaceAll('[presente]', presente);
}
