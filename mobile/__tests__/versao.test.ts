import { versaoAbaixoDe } from '../src/servicos/versao';

describe('versão mínima do app (T67)', () => {
  it('detecta versão abaixo da mínima', () => {
    expect(versaoAbaixoDe('1.0.0', '1.0.1')).toBe(true);
    expect(versaoAbaixoDe('1.9.9', '2.0.0')).toBe(true);
    expect(versaoAbaixoDe('1.2', '1.2.1')).toBe(true);
  });

  it('aceita versão igual ou acima', () => {
    expect(versaoAbaixoDe('1.0.0', '1.0.0')).toBe(false);
    expect(versaoAbaixoDe('1.10.0', '1.9.0')).toBe(false);
    expect(versaoAbaixoDe('0.1.0', '0.0.0')).toBe(false);
  });
});
