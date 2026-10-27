import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  checarEncaixe,
  comodoCompleto,
  formatarMetros,
  lerMetros,
  percentualOcupado,
  proximoEstado,
  sugerirNovosComodos,
  textoCelebracaoComodo,
  validarMedidaComodo,
} from './casa';
import type { CatalogoCategorias, CatalogoEnxoval } from './catalogos';
import { gerarComodos } from './enxoval';
import { gerarCategorias, resumoOrcamento } from './orcamento';

const dados = (arquivo: string) => JSON.parse(readFileSync(resolve(__dirname, '../../../dados', arquivo), 'utf8'));
const enxoval: CatalogoEnxoval = dados('catalogo-enxoval.json');
const categorias: CatalogoCategorias = dados('categorias.json');

describe('T19: botão de estado', () => {
  it('Falta → Já tenho → Na lista → Falta', () => {
    expect(proximoEstado('falta')).toBe('ja_tenho');
    expect(proximoEstado('ja_tenho')).toBe('na_lista');
    expect(proximoEstado('na_lista')).toBe('falta');
  });
});

describe('13.3 cômodo completo e T55', () => {
  it('completo só com todos os itens "Já tenho" (na fase filtrada)', () => {
    const itens = [
      { estado: 'ja_tenho' as const, fase: 'primeira_noite' as const },
      { estado: 'falta' as const, fase: 'com_calma' as const },
    ];
    expect(comodoCompleto(itens)).toBe(false);
    expect(comodoCompleto(itens, 'primeira_noite')).toBe(true);
    expect(comodoCompleto([])).toBe(false);
  });

  it('texto da celebração', () => {
    expect(textoCelebracaoComodo('Quarto', 30, 4)).toEqual({
      titulo: 'Quarto completo!',
      texto: 'Todos os 30 itens do quarto estão prontos. Faltam 4 cômodos para a casa ficar completa.',
    });
    expect(textoCelebracaoComodo('Cozinha', 52, 1).texto).toBe('Todos os 52 itens da cozinha estão prontos. Falta 1 cômodo para a casa ficar completa.');
    expect(textoCelebracaoComodo('Pets', 1, 0).texto).toBe('O único item dos pets está pronto. A casa nova está completa.');
  });
});

describe('T20 e T21: medidas e encaixe', () => {
  it('metros com vírgula, de 0,5 a 30', () => {
    expect(lerMetros('4,20')).toBe(4.2);
    expect(lerMetros('3.6')).toBe(3.6);
    expect(lerMetros('')).toBeNull();
    expect(lerMetros('abc')).toBeNull();
    expect(formatarMetros(4.2)).toBe('4,20');
    expect(validarMedidaComodo(0.4)).toBe('Use um valor entre 0,5 e 30 m.');
    expect(validarMedidaComodo(30)).toBeNull();
    expect(validarMedidaComodo(null)).toBeNull();
  });

  it('cabe ou não cabe pela largura livre da parede', () => {
    expect(checarEncaixe({ nome: 'Geladeira', largura_cm: 70 }, { nome: 'Espaço da geladeira', largura_m: 0.75 })).toEqual({
      cabe: true,
      livresCm: 75,
      texto: 'Cabe no espaço da geladeira (75 cm livres)',
      alerta: null,
    });
    const sofa = checarEncaixe({ nome: 'Sofá', largura_cm: 240 }, { nome: 'Parede do sofá', largura_m: 2.2 })!;
    expect(sofa.cabe).toBe(false);
    expect(sofa.texto).toBe('Não cabe: Sofá tem 240 cm e Parede do sofá tem 220 cm livres');
    expect(sofa.alerta).toBe('Sofá de 2,40 m não cabe na parede do sofá, que tem 2,20 m livres.');
    expect(checarEncaixe({ nome: 'X', largura_cm: null }, { nome: 'P', largura_m: 1 })).toBeNull();
    expect(checarEncaixe({ nome: 'X', largura_cm: 10 }, null)).toBeNull();
  });

  it('% ocupado = área dos móveis / área do cômodo', () => {
    const itens = [
      { medidas: { largura_cm: 240, profundidade_cm: 90 }, quantidade: 1 },
      { medidas: { largura_cm: 50, profundidade_cm: 50 }, quantidade: 2 },
      { medidas: null, quantidade: 1 },
    ];
    expect(percentualOcupado({ largura_m: 4.2, comprimento_m: 3.6 }, itens)).toBe(Math.round(((21600 + 5000) / 151200) * 100));
    expect(percentualOcupado({ largura_m: null, comprimento_m: 3 }, itens)).toBeNull();
  });
});

describe('Perfil › Dados da casa nova: sugere só o que falta', () => {
  it('mais um quarto e pets: novos cômodos com os itens do catálogo; nada existente é repetido', () => {
    const base = { quartos: 2, banheiros: 1, mobiliado: 'nao' as const, tem_pets: false, moradores: 2, clima: 'temperado' as const, ja_temos: [], quem_mora_sozinho: null };
    const existentes = gerarComodos(base).map((c) => c.id);
    const s = sugerirNovosComodos({ ...base, quartos: 3, tem_pets: true }, { comodos: existentes }, enxoval);
    expect(s.comodos.map((c) => c.nome).sort()).toEqual(['Pets', 'Quarto 3']);
    expect(s.itens.length).toBeGreaterThan(0);
    expect(s.itens.every((i) => s.comodos.some((c) => c.id === i.comodo_id))).toBe(true);
    expect(sugerirNovosComodos(base, { comodos: existentes }, enxoval).comodos).toEqual([]);
  });
});

describe('13.4 itens comprados na categoria escolhida', () => {
  it('cada item conta na categoria da casa dele; sem escolha, Enxoval', () => {
    const r = resumoOrcamento(
      {
        categorias: gerarCategorias('casa', categorias, null),
        fornecedores: [],
        gastos: [],
        itens: [
          { id: 'a', nome: 'Sofá', estado: 'ja_tenho', origem: 'comprado', preco_estimado: 300_000, quantidade: 1, categoria_orcamento: 'casa_moveis' },
          { id: 'b', nome: 'Toalha', estado: 'ja_tenho', origem: 'comprado', preco_estimado: 5_000, quantidade: 2, categoria_orcamento: null },
          { id: 'c', nome: 'Fogão', estado: 'ja_tenho', origem: 'ganhado', preco_estimado: 150_000, quantidade: 1, categoria_orcamento: 'casa_eletrodomesticos' },
        ],
      },
      'casa',
    );
    expect(r.linhas.find((l) => l.id === 'casa_moveis')!.gasto).toBe(300_000);
    expect(r.linhas.find((l) => l.id === 'casa_enxoval')!.gasto).toBe(10_000);
    expect(r.linhas.find((l) => l.id === 'casa_eletrodomesticos')!.gasto).toBe(0);
  });
});
