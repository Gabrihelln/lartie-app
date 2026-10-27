import { mascararTelefone } from '../src/componentes/mascaras';

describe('máscara de telefone (T17 WhatsApp e Telefone)', () => {
  it('celular com DDD: (41) 99999-0000', () => {
    expect(mascararTelefone('41999990000')).toBe('(41) 99999-0000');
  });
  it('fixo com DDD: (41) 3333-0000', () => {
    expect(mascararTelefone('4133330000')).toBe('(41) 3333-0000');
  });
  it('não passa de 11 dígitos, mesmo colando um número longo', () => {
    expect(mascararTelefone('(41) 99999-00001234')).toBe('(41) 99999-0000');
  });
  it('enquanto digita', () => {
    expect(mascararTelefone('4')).toBe('(4');
    expect(mascararTelefone('419')).toBe('(41) 9');
    expect(mascararTelefone('')).toBe('');
  });
});
