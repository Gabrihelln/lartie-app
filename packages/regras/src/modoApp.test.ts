import { MODOS_APP } from '@lartie/modelo';
import { describe, expect, it } from 'vitest';
import {
  ORDEM_ABAS,
  abasDoModo,
  escoposOrcamento,
  moduloVisivel,
  mostrarFabAssistente,
  telaInicial,
} from './modoApp';

describe('abas por modo (especificação 1.3)', () => {
  it.each([
    ['os_dois', ['inicio', 'casamento', 'casa', 'presentes', 'perfil']],
    ['casamento', ['inicio', 'casamento', 'convidados', 'presentes', 'perfil']],
    ['casa', ['inicio', 'casa', 'presentes', 'perfil']],
    ['indefinido', ['inicio', 'presentes', 'perfil']],
  ] as const)('%s', (modo, abas) => {
    expect(abasDoModo(modo)).toEqual(abas);
  });

  it('mantêm a ordem fixa em todos os modos', () => {
    for (const modo of MODOS_APP) {
      const abas = abasDoModo(modo);
      const indices = abas.map((a) => ORDEM_ABAS.indexOf(a));
      expect(indices).toEqual([...indices].sort((a, b) => a - b));
    }
  });

  it('sempre começam por Início e terminam em Perfil', () => {
    for (const modo of MODOS_APP) {
      expect(abasDoModo(modo)[0]).toBe('inicio');
      expect(abasDoModo(modo).at(-1)).toBe('perfil');
    }
  });
});

describe('tela inicial por modo', () => {
  it('segue a tabela da 13.9', () => {
    expect(telaInicial('os_dois')).toBe('T12');
    expect(telaInicial('casamento')).toBe('T12b');
    expect(telaInicial('casa')).toBe('T12c');
    expect(telaInicial('indefinido')).toBe('T12d');
  });
});

describe('módulos visíveis (13.9)', () => {
  it('casamento esconde a casa', () => {
    expect(moduloVisivel('casamento', 'checklist')).toBe(true);
    expect(moduloVisivel('casamento', 'convidados')).toBe(true);
    expect(moduloVisivel('casamento', 'casa')).toBe(false);
  });

  it('casa esconde checklist, fornecedores e convidados, mas tem orçamento da casa', () => {
    expect(moduloVisivel('casa', 'checklist')).toBe(false);
    expect(moduloVisivel('casa', 'fornecedores')).toBe(false);
    expect(moduloVisivel('casa', 'convidados')).toBe(false);
    expect(moduloVisivel('casa', 'casa')).toBe(true);
    expect(moduloVisivel('casa', 'orcamento')).toBe(true);
    expect(escoposOrcamento('casa')).toEqual(['casa']);
  });

  it('indefinido só tem presentes (e assistente)', () => {
    for (const m of ['checklist', 'orcamento', 'fornecedores', 'convidados', 'casa'] as const) {
      expect(moduloVisivel('indefinido', m)).toBe(false);
    }
    expect(moduloVisivel('indefinido', 'presentes')).toBe(true);
    expect(escoposOrcamento('indefinido')).toEqual([]);
  });

  it('presentes existe em todos os modos', () => {
    for (const modo of MODOS_APP) expect(moduloVisivel(modo, 'presentes')).toBe(true);
  });

  it('os dois mostram orçamento do casamento e da casa', () => {
    expect(escoposOrcamento('os_dois')).toEqual(['casamento', 'casa']);
    expect(escoposOrcamento('casamento')).toEqual(['casamento']);
  });
});

describe('botão flutuante da assistente', () => {
  it('fica escondido enquanto a IA estiver desligada (P14)', () => {
    for (const tela of ['T12', 'T12b', 'T12c', 'T13', 'T18']) expect(mostrarFabAssistente(tela, false)).toBe(false);
  });

  it('com a IA ligada, aparece só nas telas da especificação 1.3', () => {
    expect(mostrarFabAssistente('T12', true)).toBe(true);
    expect(mostrarFabAssistente('T18', true)).toBe(true);
    expect(mostrarFabAssistente('T12d', true)).toBe(false);
    expect(mostrarFabAssistente('T33', true)).toBe(false);
  });
});
