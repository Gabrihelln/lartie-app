// T04: após 5 tentativas erradas em 15 minutos, bloquear por 15 minutos (especificação Seção 4).
// O Firebase Auth também limita tentativas no servidor (auth/too-many-requests); este bloqueio é o
// do app, contado por e-mail neste aparelho.

export const MAX_TENTATIVAS = 5;
export const JANELA_MS = 15 * 60 * 1000;
export const BLOQUEIO_MS = 15 * 60 * 1000;

/** Horários (ms) das tentativas erradas e, se houver, até quando o e-mail está bloqueado. */
export interface RegistroTentativas {
  falhas: number[];
  bloqueadoAte: number | null;
}

export type Tentativas = Record<string, RegistroTentativas>;

const chave = (email: string) => email.trim().toLowerCase();

export function situacao(t: Tentativas, email: string, agora: number): { bloqueado: boolean; ate: number | null } {
  const r = t[chave(email)];
  if (r?.bloqueadoAte && r.bloqueadoAte > agora) return { bloqueado: true, ate: r.bloqueadoAte };
  return { bloqueado: false, ate: null };
}

/** Registra uma tentativa errada. Na 5ª dentro da janela, bloqueia por 15 minutos. */
export function registrarFalha(t: Tentativas, email: string, agora: number): Tentativas {
  const k = chave(email);
  const anterior = t[k];
  const falhas = [...(anterior?.falhas ?? []).filter((h) => agora - h < JANELA_MS), agora];
  const bloqueadoAte = falhas.length >= MAX_TENTATIVAS ? agora + BLOQUEIO_MS : null;
  return { ...t, [k]: { falhas: bloqueadoAte ? [] : falhas, bloqueadoAte } };
}

/** Login certo ou fim do bloqueio: zera o contador do e-mail. */
export function limpar(t: Tentativas, email: string): Tentativas {
  const { [chave(email)]: _removido, ...resto } = t;
  return resto;
}

/** Minutos que faltam, arredondados para cima, para a mensagem do bloqueio. */
export function minutosRestantes(ate: number, agora: number): number {
  return Math.max(1, Math.ceil((ate - agora) / 60000));
}
