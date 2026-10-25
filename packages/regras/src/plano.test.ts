import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { CatalogoCategorias, CatalogoClima, CatalogoEnxoval, CatalogoTarefas } from './catalogos';
import { gerarChecklist, incluiReligioso } from './checklist';
import { adicionarDias, diferencaEmDias, formatarData, lerData } from './datas';
import { classificarClima, gerarComodos, gerarEnxoval } from './enxoval';
import { contadorDoPasso, modulosDoModo, passoAnterior, passosDoModo, proximoPasso } from './onboarding';
import { gerarCategorias } from './orcamento';
import { slugComSufixo, slugDoCasal } from './slug';

const dados = (arquivo: string) => JSON.parse(readFileSync(resolve(__dirname, '../../../dados', arquivo), 'utf8'));
const tarefas: CatalogoTarefas = dados('catalogo-tarefas.json');
const enxoval: CatalogoEnxoval = dados('catalogo-enxoval.json');
const clima: CatalogoClima = dados('clima-por-cidade.json');
const categorias: CatalogoCategorias = dados('categorias.json');

const HOJE = '2026-10-25';

describe('onboarding: passos e contador (Seção 5)', () => {
  it('cada modo tem os seus passos', () => {
    expect(passosDoModo('os_dois')).toEqual(['T06', 'T06b', 'T07', 'T08', 'T09', 'T10', 'T11']);
    expect(passosDoModo('casamento')).toEqual(['T06', 'T06b', 'T07', 'T10', 'T11']);
    expect(passosDoModo('casa')).toEqual(['T06', 'T06b', 'T08', 'T09', 'T10', 'T11']);
    expect(passosDoModo('indefinido')).toEqual(['T06', 'T06b']);
  });

  it('o contador usa 5 até a escolha e depois é recalculado', () => {
    expect(contadorDoPasso('T06', null)).toEqual({ atual: 1, total: 5 });
    expect(contadorDoPasso('T06b', null)).toEqual({ atual: 2, total: 5 });
    expect(contadorDoPasso('T09', 'os_dois')).toEqual({ atual: 5, total: 5 });
    expect(contadorDoPasso('T07', 'casamento')).toEqual({ atual: 3, total: 3 });
    expect(contadorDoPasso('T08', 'casa')).toEqual({ atual: 3, total: 4 });
    expect(contadorDoPasso('T09', 'casa')).toEqual({ atual: 4, total: 4 });
    expect(contadorDoPasso('T10', 'os_dois')).toBeNull();
  });

  it('próximo e anterior seguem o caminho do modo', () => {
    expect(proximoPasso('T06b', 'casa')).toBe('T08');
    expect(proximoPasso('T07', 'casamento')).toBe('T10');
    expect(proximoPasso('T07', 'os_dois')).toBe('T08');
    expect(proximoPasso('T11', 'os_dois')).toBeNull();
    expect(passoAnterior('T08', 'casa')).toBe('T06b');
    expect(passoAnterior('T08', 'os_dois')).toBe('T07');
  });

  it('gera só os módulos do modo (13.9 regra 2)', () => {
    expect(modulosDoModo('casamento')).toEqual({ casamento: true, casa: false });
    expect(modulosDoModo('casa')).toEqual({ casamento: false, casa: true });
    expect(modulosDoModo('indefinido')).toEqual({ casamento: false, casa: false });
  });
});

describe('checklist (13.1)', () => {
  it('prazo = data do casamento − dias antes', () => {
    const r = gerarChecklist({ data_casamento: '2027-12-18', estilo: 'civil_religioso', cerimonia_religiosa: null, hoje: HOJE }, tarefas);
    const t001 = r.find((t) => t.catalogo_id === 'T001')!;
    expect(t001.prazo).toBe(adicionarDias('2027-12-18', -365));
    expect(r.every((t) => t.prazo! > HOJE)).toBe(true);
  });

  it('casamento próximo: nada nasce atrasado; o que venceria vai para os próximos 7 dias', () => {
    const casamento = adicionarDias(HOJE, 60);
    const r = gerarChecklist({ data_casamento: casamento, estilo: 'festa_grande', cerimonia_religiosa: false, hoje: HOJE }, tarefas);
    expect(r.every((t) => t.prazo! > HOJE)).toBe(true);
    const reagendadas = r.filter((t) => diferencaEmDias(HOJE, t.prazo!) <= 7);
    expect(reagendadas.length).toBeGreaterThan(20);
    expect(r.every((t) => t.prazo! < casamento)).toBe(true);
  });

  it('sem data: prazos nulos, na ordem das fases', () => {
    const r = gerarChecklist({ data_casamento: null, estilo: 'so_civil', cerimonia_religiosa: null, hoje: HOJE }, tarefas);
    expect(r.every((t) => t.prazo === null)).toBe(true);
    expect(r[0]!.fase).toBe('decisoes_iniciais');
    expect(r.at(-1)!.fase).toBe('semana_casamento');
    expect(r.map((t) => t.ordem)).toEqual(r.map((_, i) => i + 1));
  });

  it('estilo filtra tarefas e "Só civil" remove as de igreja', () => {
    const civil = gerarChecklist({ data_casamento: null, estilo: 'so_civil', cerimonia_religiosa: true, hoje: HOJE }, tarefas);
    expect(civil.some((t) => ['T006', 'T034', 'T041'].includes(t.catalogo_id))).toBe(false);
    const religioso = gerarChecklist({ data_casamento: null, estilo: 'civil_religioso', cerimonia_religiosa: null, hoje: HOJE }, tarefas);
    expect(religioso.some((t) => t.catalogo_id === 'T006')).toBe(true);
  });

  it('P05: festa grande só inclui igreja se o casal responder que terá cerimônia religiosa', () => {
    expect(incluiReligioso('festa_grande', true)).toBe(true);
    expect(incluiReligioso('festa_grande', false)).toBe(false);
    expect(incluiReligioso('festa_grande', null)).toBe(false);
    expect(incluiReligioso('so_civil', true)).toBe(false);
    expect(incluiReligioso('civil_religioso', false)).toBe(true);
  });

  it('"Destination" adiciona as tarefas de viagem dos convidados', () => {
    const so = (estilo: 'destination' | 'festa_grande') =>
      gerarChecklist({ data_casamento: null, estilo, cerimonia_religiosa: false, hoje: HOJE }, tarefas).map((t) => t.catalogo_id);
    const exclusivas = tarefas.tarefas.filter((t) => t.estilos.length === 1 && t.estilos[0] === 'destination').map((t) => t.id);
    expect(exclusivas.length).toBeGreaterThan(0);
    for (const id of exclusivas) {
      expect(so('destination')).toContain(id);
      expect(so('festa_grande')).not.toContain(id);
    }
  });
});

describe('enxoval (13.2)', () => {
  it('cômodos padrão com quartos, banheiros e pets', () => {
    expect(gerarComodos({ quartos: 3, banheiros: 2, tem_pets: true }).map((c) => c.nome)).toEqual([
      'Cozinha',
      'Quarto',
      'Quarto 2',
      'Quarto 3',
      'Banheiro',
      'Banheiro 2',
      'Sala',
      'Lavanderia',
      'Limpeza e organização',
      'Pets',
    ]);
  });

  it('clima pela tabela: exceção da cidade antes do padrão da UF', () => {
    expect(classificarClima('Curitiba', 'PR', clima)).toBe('frio');
    expect(classificarClima('Fortaleza', 'CE', clima)).toBe('quente');
    expect(classificarClima('Campos do Jordão', 'SP', clima)).toBe('frio');
  });

  it('perfil 1 · apê de 1 quarto, cidade quente, 2 moradores', () => {
    const { comodos, itens } = gerarEnxoval(
      { quartos: 1, banheiros: 1, mobiliado: 'nao', tem_pets: false, moradores: 2, clima: 'quente', ja_temos: [] },
      enxoval,
    );
    expect(comodos.map((c) => c.nome)).toEqual(['Cozinha', 'Quarto', 'Banheiro', 'Sala', 'Lavanderia', 'Limpeza e organização']);
    const nomes = itens.map((i) => i.nome);
    expect(nomes).toContain('Ventilador');
    expect(nomes).toContain('Ar-condicionado');
    expect(nomes).not.toContain('Edredom de casal');
    expect(nomes).not.toContain('Aquecedor');
    expect(itens.some((i) => i.comodo_id.startsWith('quarto-'))).toBe(false);
    expect(itens.find((i) => i.catalogo_id === 'I006')!.quantidade).toBe(3);
    expect(itens.every((i) => !i.ja_tenho)).toBe(true);
  });

  it('perfil 2 · casa de 3 quartos e 2 banheiros, com pets, cidade fria, 4 moradores', () => {
    const { comodos, itens } = gerarEnxoval(
      { quartos: 3, banheiros: 2, mobiliado: 'nao', tem_pets: true, moradores: 4, clima: 'frio', ja_temos: ['Geladeira', 'Cama e banho'] },
      enxoval,
    );
    expect(comodos).toHaveLength(10);
    const nomes = itens.map((i) => i.nome);
    expect(nomes).toContain('Edredom de casal');
    expect(nomes).toContain('Aquecedor');
    expect(nomes).not.toContain('Ventilador');
    // Itens de "Quarto extra" em cada quarto extra.
    expect(itens.filter((i) => i.catalogo_id === 'I049').map((i) => i.comodo_id)).toEqual(['quarto-2', 'quarto-3']);
    // "Por banheiro" em cada banheiro; os demais só no principal.
    expect(itens.filter((i) => i.catalogo_id === 'I056').map((i) => i.comodo_id)).toEqual(['banheiro', 'banheiro-2']);
    expect(itens.filter((i) => i.catalogo_id === 'I054').map((i) => i.comodo_id)).toEqual(['banheiro']);
    // Por morador: arredondar(base × moradores / 2).
    expect(itens.find((i) => i.catalogo_id === 'I006')!.quantidade).toBe(6);
    expect(itens.find((i) => i.catalogo_id === 'I035')!.quantidade).toBe(4);
    // Pets e "o que já têm".
    expect(itens.some((i) => i.comodo_id === 'pets')).toBe(true);
    expect(itens.find((i) => i.catalogo_id === 'I001')!.ja_tenho).toBe(true);
    expect(itens.filter((i) => i.catalogo_id === 'I056').every((i) => i.ja_tenho)).toBe(true);
    expect(itens.find((i) => i.catalogo_id === 'I002')!.ja_tenho).toBe(false);
  });

  it('mobiliado: "sim" tira os móveis grandes; "em parte" deixa para "com calma"', () => {
    const base = { quartos: 1, banheiros: 1, tem_pets: false, moradores: 2, clima: 'temperado' as const, ja_temos: [] };
    const sim = gerarEnxoval({ ...base, mobiliado: 'sim' }, enxoval).itens;
    expect(sim.some((i) => i.catalogo_id === 'I001')).toBe(false);
    const emParte = gerarEnxoval({ ...base, mobiliado: 'em_parte' }, enxoval).itens;
    expect(emParte.find((i) => i.catalogo_id === 'I001')!.fase).toBe('com_calma');
  });

  it('cidade temperada recebe itens de frio e de calor', () => {
    const { itens } = gerarEnxoval(
      { quartos: 1, banheiros: 1, mobiliado: 'nao', tem_pets: false, moradores: 2, clima: 'temperado', ja_temos: [] },
      enxoval,
    );
    expect(itens.map((i) => i.nome)).toEqual(expect.arrayContaining(['Edredom de casal', 'Ventilador']));
  });

  it('ids estáveis: gerar de novo não duplica', () => {
    const d = { quartos: 2, banheiros: 1, mobiliado: 'nao' as const, tem_pets: false, moradores: 2, clima: 'quente' as const, ja_temos: [] };
    const a = gerarEnxoval(d, enxoval).itens.map((i) => i.id);
    expect(new Set(a).size).toBe(a.length);
    expect(gerarEnxoval(d, enxoval).itens.map((i) => i.id)).toEqual(a);
  });
});

describe('perfil 3 · só civil sem data', () => {
  it('gera o checklist sem prazos e sem tarefas de igreja, e as categorias sem valor planejado', () => {
    const r = gerarChecklist({ data_casamento: null, estilo: 'so_civil', cerimonia_religiosa: null, hoje: HOJE }, tarefas);
    expect(r.length).toBeGreaterThan(30);
    expect(r.every((t) => t.prazo === null)).toBe(true);
    const cats = gerarCategorias('casamento', categorias, null);
    expect(cats).toHaveLength(8);
    expect(cats.every((c) => c.planejado === null)).toBe(true);
  });
});

describe('orçamento (13.4)', () => {
  it('casamento: % sugerido do total; casa: sem planejado', () => {
    const cats = gerarCategorias('casamento', categorias, 6_000_000);
    expect(cats.find((c) => c.id === 'casamento_local_buffet')!.planejado).toBe(2_700_000);
    expect(cats.reduce((s, c) => s + (c.planejado ?? 0), 0)).toBe(6_000_000);
    const casa = gerarCategorias('casa', categorias, 6_000_000);
    expect(casa.map((c) => c.nome)).toEqual(['Móveis', 'Eletrodomésticos', 'Enxoval', 'Decoração']);
    expect(casa.every((c) => c.planejado === null)).toBe(true);
  });
});

describe('slug do casal e datas', () => {
  it('nomes viram o endereço público sem acentos', () => {
    expect(slugDoCasal('Ana', 'Pedro')).toBe('ana-e-pedro');
    expect(slugDoCasal('Ana Luíza Souza', 'João')).toBe('ana-e-joao');
    expect(slugDoCasal('Bia', null)).toBe('bia');
    expect(slugComSufixo('ana-e-pedro', 1)).toBe('ana-e-pedro');
    expect(slugComSufixo('ana-e-pedro', 3)).toBe('ana-e-pedro-3');
  });

  it('formata e lê datas no formato dd/mm/aaaa', () => {
    expect(formatarData('2027-04-18')).toBe('18/04/2027');
    expect(lerData('18/04/2027')).toBe('2027-04-18');
    expect(lerData('31/02/2027')).toBeNull();
  });
});
