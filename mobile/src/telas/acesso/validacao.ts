// Validação dos campos de acesso (T03, T04, T05). Devolve a mensagem que diz como corrigir, ou null.
// Textos da especificação: "Use pelo menos 8 caracteres." (T45). Os demais são do app e estão
// listados no relatório da Etapa 1 para aprovação.

export const TEXTOS_VALIDACAO = {
  nome: 'Informe seu nome, com 2 a 40 letras.',
  emailVazio: 'Informe seu e-mail.',
  emailInvalido: 'Confira o e-mail. Ele precisa ter o formato nome@exemplo.com.',
  senhaVazia: 'Informe sua senha.',
  senhaCurta: 'Use pelo menos 8 caracteres.',
  termos: 'Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.',
} as const;

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validarNome(nome: string): string | null {
  const n = nome.trim().length;
  return n >= 2 && n <= 40 ? null : TEXTOS_VALIDACAO.nome;
}

export function validarEmail(email: string): string | null {
  const e = email.trim();
  if (!e) return TEXTOS_VALIDACAO.emailVazio;
  return FORMATO_EMAIL.test(e) ? null : TEXTOS_VALIDACAO.emailInvalido;
}

/** T03: mínimo de 8 caracteres. */
export function validarSenhaNova(senha: string): string | null {
  if (!senha) return TEXTOS_VALIDACAO.senhaVazia;
  return senha.length >= 8 ? null : TEXTOS_VALIDACAO.senhaCurta;
}

/** T04: só obrigatória (contas antigas podem ter outra regra). */
export function validarSenhaLogin(senha: string): string | null {
  return senha ? null : TEXTOS_VALIDACAO.senhaVazia;
}
