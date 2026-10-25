import { sugerirCidades } from '../src/componentes/CampoCidade';
import { formatarMesAno, formatarReais, lerMesAno, lerReais, mascararMesAno } from '../src/componentes/CamposMascarados';

jest.mock('../src/componentes/CampoTexto', () => ({ CampoTexto: () => null, ErroCampo: () => null }));
jest.mock('../src/tema', () => ({ espacos: {}, useTema: () => ({}) }));
jest.mock('@lartie/tokens', () => ({ raios: {} }));

describe('cidade com sugestões (T07, T08)', () => {
  it('sugere por começo do nome, sem acento e com UF', () => {
    expect(sugerirCidades('curit')[0]).toEqual({ cidade: 'Curitiba', uf: 'PR' });
    expect(sugerirCidades('sao paulo').map((c) => `${c.cidade}, ${c.uf}`)).toContain('São Paulo, SP');
    expect(sugerirCidades('campos do jordao')).toEqual([{ cidade: 'Campos do Jordão', uf: 'SP' }]);
  });

  it('filtra pela UF depois da vírgula e precisa de 2 letras', () => {
    expect(sugerirCidades('Bom Jesus, PI').every((c) => c.uf === 'PI')).toBe(true);
    expect(sugerirCidades('c')).toEqual([]);
  });

  it('mostra no máximo 6 sugestões', () => {
    expect(sugerirCidades('sa').length).toBe(6);
  });
});

describe('campos com máscara', () => {
  it('valor em reais guardado em centavos', () => {
    expect(lerReais('R$ 60.000')).toBe(6_000_000);
    expect(lerReais('')).toBeNull();
    expect(formatarReais(6_000_000)).toBe('R$ 60.000');
    expect(formatarReais(null)).toBe('');
  });

  it('mês/ano da mudança', () => {
    expect(mascararMesAno('052027')).toBe('05/2027');
    expect(mascararMesAno('05')).toBe('05');
    expect(lerMesAno('05/2027')).toBe('2027-05');
    expect(lerMesAno('13/2027')).toBeNull();
    expect(lerMesAno('5/2027')).toBeNull();
    expect(formatarMesAno('2027-05')).toBe('05/2027');
  });
});
