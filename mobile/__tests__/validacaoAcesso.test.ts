import { TEXTOS_VALIDACAO, validarEmail, validarNome, validarSenhaLogin, validarSenhaNova } from '../src/telas/acesso/validacao';

describe('validação dos campos de acesso', () => {
  it('nome: obrigatório, 2 a 40 caracteres (T03)', () => {
    expect(validarNome('Ana')).toBeNull();
    expect(validarNome(' A ')).toBe(TEXTOS_VALIDACAO.nome);
    expect(validarNome('A'.repeat(40))).toBeNull();
    expect(validarNome('A'.repeat(41))).toBe(TEXTOS_VALIDACAO.nome);
  });

  it('e-mail: obrigatório e com formato válido', () => {
    expect(validarEmail('ana@email.com')).toBeNull();
    expect(validarEmail(' ana@email.com.br ')).toBeNull();
    expect(validarEmail('')).toBe(TEXTOS_VALIDACAO.emailVazio);
    expect(validarEmail('ana@email')).toBe(TEXTOS_VALIDACAO.emailInvalido);
    expect(validarEmail('ana email@x.com')).toBe(TEXTOS_VALIDACAO.emailInvalido);
  });

  it('senha nova: mínimo de 8 caracteres, com o texto do T45', () => {
    expect(validarSenhaNova('12345678')).toBeNull();
    expect(validarSenhaNova('1234567')).toBe('Use pelo menos 8 caracteres.');
    expect(validarSenhaNova('')).toBe(TEXTOS_VALIDACAO.senhaVazia);
  });

  it('senha de login: só obrigatória', () => {
    expect(validarSenhaLogin('x')).toBeNull();
    expect(validarSenhaLogin('')).toBe(TEXTOS_VALIDACAO.senhaVazia);
  });
});
