// Convidados e RSVP (Etapa 6): T28, T29, T30, T38 e 13.6.
import type { Lado, Presenca, RestricaoAlimentar, TipoGrupo } from '@lartie/modelo';
import { DOMINIO } from './presentes';

export interface ConvidadoBase {
  grupo_id: string;
  nome: string;
  faixa: 'adulto' | 'crianca';
  presenca: Presenca;
  restricao_alimentar: RestricaoAlimentar;
}

export type StatusGrupo =
  | { tipo: 'confirmado' }
  | { tipo: 'nao_vao' }
  | { tipo: 'parcial'; vao: number; total: number }
  | { tipo: 'sem_resposta' };

/**
 * 13.6: todos "vai" = Confirmado; todos "não vai" = Não vão; misto = Parcial x/y; nenhuma resposta =
 * Sem resposta. Respostas incompletas (alguém ainda sem resposta) contam como parcial pelo que já veio.
 */
export function statusDoGrupo(pessoas: readonly Pick<ConvidadoBase, 'presenca'>[]): StatusGrupo {
  if (pessoas.length === 0 || pessoas.every((p) => p.presenca === 'sem_resposta')) return { tipo: 'sem_resposta' };
  if (pessoas.every((p) => p.presenca === 'vai')) return { tipo: 'confirmado' };
  if (pessoas.every((p) => p.presenca === 'nao_vai')) return { tipo: 'nao_vao' };
  return { tipo: 'parcial', vao: pessoas.filter((p) => p.presenca === 'vai').length, total: pessoas.length };
}

export function rotuloStatusGrupo(s: StatusGrupo): string {
  switch (s.tipo) {
    case 'confirmado':
      return 'Confirmado';
    case 'nao_vao':
      return 'Não vão';
    case 'parcial':
      return `Parcial ${s.vao}/${s.total}`;
    case 'sem_resposta':
      return 'Sem resposta';
  }
}

/** Painel do T28: total (adultos/crianças), confirmados, não vão, sem resposta. */
export function resumoConvidados(pessoas: readonly Pick<ConvidadoBase, 'presenca' | 'faixa'>[]) {
  return {
    total: pessoas.length,
    adultos: pessoas.filter((p) => p.faixa === 'adulto').length,
    criancas: pessoas.filter((p) => p.faixa === 'crianca').length,
    confirmados: pessoas.filter((p) => p.presenca === 'vai').length,
    naoVao: pessoas.filter((p) => p.presenca === 'nao_vai').length,
    semResposta: pessoas.filter((p) => p.presenca === 'sem_resposta').length,
  };
}

export type FiltroConvidados = 'todos' | 'confirmados' | 'sem_resposta' | 'nao_vao';

/** Filtros do T28: "Confirmados" inclui os parciais. */
export function passaNoFiltro(s: StatusGrupo, filtro: FiltroConvidados): boolean {
  switch (filtro) {
    case 'todos':
      return true;
    case 'confirmados':
      return s.tipo === 'confirmado' || s.tipo === 'parcial';
    case 'sem_resposta':
      return s.tipo === 'sem_resposta';
    case 'nao_vao':
      return s.tipo === 'nao_vao';
  }
}

export const DIAS_ENTRE_LEMBRETES = 3;

/**
 * 13.6: o lembrete em lote (T38) vai só para grupos "Sem resposta" com WhatsApp, no máximo 1 a
 * cada 3 dias. `ultimoLembrete` e `agora` em milissegundos.
 */
export function podeLembrar(g: { whatsapp: string | null; ultimoLembrete: number | null; status: StatusGrupo }, agora: number): boolean {
  if (g.status.tipo !== 'sem_resposta' || !g.whatsapp) return false;
  return g.ultimoLembrete === null || agora - g.ultimoLembrete >= DIAS_ENTRE_LEMBRETES * 86_400_000;
}

/** Depois do prazo, o link do RSVP fica só para leitura (T30). O dia do prazo ainda vale. */
export function prazoEncerrado(prazo: string | null, hoje: string): boolean {
  return !!prazo && hoje > prazo;
}

/** T30 "Enviar confirmação": exige resposta para todas as pessoas. */
export function validarRespostas(respostas: readonly { presenca: Presenca }[], esperadas: number): string | null {
  if (respostas.length !== esperadas || respostas.some((r) => r.presenca === 'sem_resposta')) return 'Respondam por todas as pessoas do grupo.';
  return null;
}

export const ROTULO_LADO = (l: Lado, nome1: string, nome2: string) => (l === 'noivo_1' ? `lado ${daPessoa(nome1)}` : l === 'noivo_2' ? `lado ${daPessoa(nome2)}` : 'os dois');
export const ROTULO_TIPO: Record<TipoGrupo, string> = { familia: 'família', amigos: 'amigos', trabalho: 'trabalho' };

/** "da Ana" / "do Pedro": sem saber o gênero, usa "de". */
function daPessoa(nome: string) {
  return `de ${nome}`;
}

export const ROTULO_RESTRICAO: Record<RestricaoAlimentar, string> = {
  nenhuma: 'Sem restrição alimentar',
  vegetariano: 'Vegetariano',
  vegano: 'Vegano',
  sem_gluten: 'Sem glúten',
  sem_lactose: 'Sem lactose',
  outra: 'Outra',
};

export function linkDoRsvp(slug: string, token: string): string {
  return `${DOMINIO}/${slug}/rsvp/${token}`;
}

/** Convite de RSVP (docs/textos-e-mensagens.md, seção 4). */
export function mensagemConviteRsvp(d: { grupo: string; casal: string; data: string | null; cidade: string | null; prazo: string | null; link: string }): string {
  const quando = [d.data ? `em ${d.data}` : null, d.cidade ? `em ${d.cidade}` : null].filter(Boolean).join(', ');
  return `Oi, ${d.grupo}! ${d.casal} vão se casar${quando ? ` ${quando}` : ''}. Confirme a presença de vocês${d.prazo ? ` até ${d.prazo}` : ''}: ${d.link}`;
}

/** Lembrete de RSVP (T38). */
export function mensagemLembreteRsvp(d: { grupo: string; casal: string; link: string }): string {
  return `Oi, ${d.grupo}! Ainda não recebemos a confirmação de vocês para o casamento de ${d.casal}. Leva menos de um minuto: ${d.link}`;
}

/** Notificação "RSVP respondido" (Seção 12). */
export function textoRsvpRespondido(grupo: string, vao: number, total: number): string {
  return `${grupo} confirmou presença: ${vao} de ${total} pessoas.`;
}

// Importar contatos (T28) ---------------------------------------------------------------------

/** "Marta Souza" → "Souza" (último nome; sem sobrenome, o próprio nome). */
export function sobrenome(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  return partes[partes.length - 1] ?? nome;
}

/** "Agrupar por sobrenome": um grupo "Família {sobrenome}" para quem divide o sobrenome. */
export function agruparPorSobrenome<T extends { nome: string }>(contatos: readonly T[]): { nome: string; pessoas: T[] }[] {
  const grupos = new Map<string, T[]>();
  for (const c of contatos) {
    const s = sobrenome(c.nome);
    const chave = s.toLocaleLowerCase('pt-BR');
    grupos.set(chave, [...(grupos.get(chave) ?? []), c]);
  }
  return [...grupos.values()].map((pessoas) => ({
    nome: pessoas.length > 1 ? `Família ${sobrenome(pessoas[0]!.nome)}` : pessoas[0]!.nome,
    pessoas,
  }));
}

// Exportar lista (T28) ------------------------------------------------------------------------

/** Planilha CSV para o buffet: nome, grupo, presença e restrição (separador ";", como no Excel em pt-BR). */
export function exportarCsv(grupos: readonly { id: string; nome: string }[], pessoas: readonly (ConvidadoBase & { restricao_outra?: string | null })[]): string {
  const nomeGrupo = new Map(grupos.map((g) => [g.id, g.nome]));
  const presenca: Record<Presenca, string> = { vai: 'Vai', nao_vai: 'Não vai', sem_resposta: 'Sem resposta' };
  const campo = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const linhas = [
    'Nome;Grupo;Faixa;Presença;Restrição',
    ...pessoas
      .slice()
      .sort((a, b) => (nomeGrupo.get(a.grupo_id) ?? '').localeCompare(nomeGrupo.get(b.grupo_id) ?? '', 'pt-BR') || a.nome.localeCompare(b.nome, 'pt-BR'))
      .map((p) =>
        [
          p.nome,
          nomeGrupo.get(p.grupo_id) ?? '',
          p.faixa === 'adulto' ? 'Adulto' : 'Criança',
          presenca[p.presenca],
          p.restricao_alimentar === 'outra' ? p.restricao_outra || 'Outra' : p.restricao_alimentar === 'nenhuma' ? '' : ROTULO_RESTRICAO[p.restricao_alimentar],
        ]
          .map(campo)
          .join(';'),
      ),
  ];
  return linhas.join('\n');
}
