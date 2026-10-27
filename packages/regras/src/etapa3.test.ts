import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { CatalogoCategorias, CatalogoTarefas } from './catalogos';
import { gerarChecklist, recalcularPrazos } from './checklist';
import {
  adicionarMeses,
  chipsFornecedores,
  diferencaParcelas,
  fornecedoresFechados,
  gerarParcelas,
  iniciais,
  proximasParcelas,
  resumoFornecedores,
  rotuloParcela,
  tarefasConcluidasAoFechar,
  validarFornecedor,
} from './fornecedores';
import {
  listarAbas,
  modoAoAtivar,
  passosParaAtivar,
  textoConfirmacaoModo,
  textoModoAlterado,
} from './modoApp';
import {
  distribuirOrcamento,
  estimativaBuffet,
  gerarCategorias,
  percentualUsadoNosEscopos,
  resumoOrcamento,
  type EntradaOrcamento,
} from './orcamento';
import {
  diasDeAtraso,
  faseAtualChecklist,
  faseAtualEnxoval,
  faseConcluidaAoMarcar,
  faseSugeridaPelaData,
  filtrarChecklist,
  percentual,
  prazoSugeridoDaFase,
  progressoCasa,
  progressoCasamento,
  proximaOrdem,
  proximasTarefas,
  reordenarNaFase,
  tarefaAtrasada,
  type TarefaBase,
} from './progresso';

const dados = (arquivo: string) => JSON.parse(readFileSync(resolve(__dirname, '../../../dados', arquivo), 'utf8'));
const catalogoTarefas: CatalogoTarefas = dados('catalogo-tarefas.json');
const categorias: CatalogoCategorias = dados('categorias.json');

const HOJE = '2026-10-26';

function tarefa(id: string, extra: Partial<TarefaBase> = {}): TarefaBase {
  return { id, status: 'a_fazer', prazo: null, fase: 'decisoes_iniciais', oculta: false, ordem: Number(id.replace(/\D/g, '')) || 1, ...extra };
}

describe('13.3 progresso do casamento', () => {
  it('conta concluídas sobre não ocultas', () => {
    const lista = [
      tarefa('t1', { status: 'concluida' }),
      tarefa('t2'),
      tarefa('t3', { oculta: true, status: 'concluida' }),
      tarefa('t4', { status: 'em_andamento' }),
    ];
    expect(progressoCasamento(lista)).toEqual({ feitos: 1, total: 3 });
    expect(percentual(progressoCasamento(lista))).toBe(33);
    expect(percentual({ feitos: 0, total: 0 })).toBe(0);
  });

  it('atrasada = não concluída e prazo antes de hoje (calculado)', () => {
    expect(tarefaAtrasada({ status: 'a_fazer', prazo: '2026-10-25' }, HOJE)).toBe(true);
    expect(tarefaAtrasada({ status: 'a_fazer', prazo: HOJE }, HOJE)).toBe(false);
    expect(tarefaAtrasada({ status: 'concluida', prazo: '2026-01-01' }, HOJE)).toBe(false);
    expect(tarefaAtrasada({ status: 'em_andamento', prazo: null }, HOJE)).toBe(false);
    expect(diasDeAtraso({ status: 'a_fazer', prazo: '2026-10-14' }, HOJE)).toBe(12);
  });

  it('fase atual é a primeira com tarefas abertas', () => {
    const lista = [
      tarefa('t1', { status: 'concluida' }),
      tarefa('t2', { fase: 'fornecedores_principais' }),
      tarefa('t3', { fase: 'detalhes' }),
    ];
    expect(faseAtualChecklist(lista)).toBe('fornecedores_principais');
    expect(faseAtualChecklist([tarefa('t1', { status: 'concluida' })])).toBeNull();
  });

  it('T56: avisa quando a tarefa marcada completa a fase, com a próxima fase com tarefas', () => {
    const lista = [
      tarefa('t1', { status: 'concluida' }),
      tarefa('t2', { status: 'concluida' }),
      tarefa('t3', { oculta: true }),
      tarefa('t4', { fase: 'detalhes' }),
    ];
    expect(faseConcluidaAoMarcar(lista, 't2')).toEqual({ fase: 'decisoes_iniciais', proxima: 'detalhes' });
    expect(faseConcluidaAoMarcar([tarefa('t1', { status: 'concluida' }), tarefa('t2')], 't1')).toBeNull();
    expect(faseConcluidaAoMarcar([tarefa('t1')], 't1')).toBeNull();
  });
});

describe('Início: próximas tarefas (T12)', () => {
  it('atrasadas primeiro, depois por prazo; sem prazo por último; até 3', () => {
    const lista = [
      tarefa('t1', { prazo: '2026-11-05' }),
      tarefa('t2', { prazo: '2026-10-22' }),
      tarefa('t3', { prazo: '2026-10-01', status: 'concluida' }),
      tarefa('t4', { prazo: null }),
      tarefa('t5', { prazo: '2026-10-30' }),
      tarefa('t6', { prazo: '2026-10-02', oculta: true }),
    ];
    expect(proximasTarefas(lista, HOJE).map((t) => t.id)).toEqual(['t2', 't5', 't1']);
    expect(proximasTarefas(lista, HOJE, 10).map((t) => t.id)).toEqual(['t2', 't5', 't1', 't4']);
  });
});

describe('T13: filtros, reordenar e nova tarefa', () => {
  const lista = [
    tarefa('t1', { status: 'concluida' }),
    tarefa('t2', { prazo: '2026-10-01' }),
    tarefa('t3', { status: 'em_andamento' }),
    tarefa('t4', { oculta: true }),
  ];

  it('filtros', () => {
    expect(filtrarChecklist(lista, 'todas', HOJE).map((t) => t.id)).toEqual(['t1', 't2', 't3']);
    expect(filtrarChecklist(lista, 'a_fazer', HOJE).map((t) => t.id)).toEqual(['t2', 't3']);
    expect(filtrarChecklist(lista, 'atrasadas', HOJE).map((t) => t.id)).toEqual(['t2']);
    expect(filtrarChecklist(lista, 'concluidas', HOJE).map((t) => t.id)).toEqual(['t1']);
    expect(filtrarChecklist(lista, 'todas', HOJE, true).map((t) => t.id)).toEqual(['t1', 't2', 't3', 't4']);
  });

  it('reordenar dentro da fase devolve só o que mudou', () => {
    const fase = [tarefa('t1', { ordem: 10 }), tarefa('t2', { ordem: 11 }), tarefa('t3', { ordem: 12 })];
    expect(reordenarNaFase(fase, 't3', 0)).toEqual([
      { id: 't3', ordem: 10 },
      { id: 't1', ordem: 11 },
      { id: 't2', ordem: 12 },
    ]);
    expect(reordenarNaFase(fase, 't1', 1)).toEqual([
      { id: 't2', ordem: 10 },
      { id: 't1', ordem: 11 },
    ]);
    expect(reordenarNaFase(fase, 't2', 1)).toEqual([]);
  });

  it('nova tarefa entra no fim da fase', () => {
    expect(proximaOrdem([tarefa('t1', { ordem: 3 }), tarefa('t2', { ordem: 9, fase: 'detalhes' })], 'decisoes_iniciais')).toBe(4);
    expect(proximaOrdem([tarefa('t1', { ordem: 3 })], 'detalhes')).toBe(4);
    expect(proximaOrdem([], 'detalhes')).toBe(1);
  });

  it('fase pré-selecionada e prazo sugerido pela data do casamento', () => {
    expect(faseSugeridaPelaData(null, HOJE)).toBe('decisoes_iniciais');
    expect(faseSugeridaPelaData('2027-10-26', HOJE)).toBe('decisoes_iniciais');
    expect(faseSugeridaPelaData('2027-07-26', HOJE)).toBe('fornecedores_principais');
    expect(faseSugeridaPelaData('2027-03-26', HOJE)).toBe('detalhes');
    expect(faseSugeridaPelaData('2026-12-26', HOJE)).toBe('documentos_reta_final');
    expect(faseSugeridaPelaData('2026-10-30', HOJE)).toBe('semana_casamento');
    expect(prazoSugeridoDaFase('documentos_reta_final', '2027-04-18', HOJE)).toBe('2027-03-19');
    expect(prazoSugeridoDaFase('decisoes_iniciais', '2027-01-01', HOJE)).toBe(HOJE);
    expect(prazoSugeridoDaFase('detalhes', null, HOJE)).toBeNull();
  });
});

describe('Perfil: mudar a data recalcula prazos', () => {
  it('só tarefas do plano, não editadas à mão e não concluídas', () => {
    const base = { estilo: 'civil_religioso' as const, cerimonia_religiosa: true, hoje: HOJE };
    const geradas = gerarChecklist({ ...base, data_casamento: '2027-10-26' }, catalogoTarefas);
    const tarefas = geradas.map((t, i) => ({
      id: t.catalogo_id,
      catalogo_id: t.catalogo_id as string | null,
      prazo: t.prazo,
      prazo_manual: i === 1,
      status: i === 2 ? 'concluida' : 'a_fazer',
    }));
    tarefas.push({ id: 'minha', catalogo_id: null, prazo: '2027-01-01', prazo_manual: false, status: 'a_fazer' });
    const mudancas = recalcularPrazos(tarefas, { ...base, data_casamento: '2027-11-26' }, catalogoTarefas);
    const ids = mudancas.map((m) => m.id);
    expect(ids).not.toContain(tarefas[1]!.id);
    expect(ids).not.toContain(tarefas[2]!.id);
    expect(ids).not.toContain('minha');
    expect(mudancas.length).toBe(tarefas.length - 3);
    expect(mudancas.find((m) => m.id === 'T001')?.prazo).toBe('2026-11-26');
    // Sem data: os prazos ficam nulos.
    expect(recalcularPrazos(tarefas, { ...base, data_casamento: null }, catalogoTarefas).every((m) => m.prazo === null)).toBe(true);
  });
});

describe('13.3 progresso da casa', () => {
  const itens = [
    { estado: 'ja_tenho' as const, fase: 'primeira_noite' as const },
    { estado: 'falta' as const, fase: 'primeira_noite' as const },
    { estado: 'na_lista' as const, fase: 'primeiro_mes' as const },
    { estado: 'ja_tenho' as const, fase: 'com_calma' as const },
  ];
  it('Já tenho / total, com filtro de fase', () => {
    expect(progressoCasa(itens)).toEqual({ feitos: 2, total: 4 });
    expect(progressoCasa(itens, 'primeira_noite')).toEqual({ feitos: 1, total: 2 });
    expect(faseAtualEnxoval(itens)).toBe('primeira_noite');
    expect(faseAtualEnxoval([{ estado: 'ja_tenho', fase: 'primeira_noite' }, { estado: 'falta', fase: 'com_calma' }])).toBe('com_calma');
  });
});

describe('13.4 orçamento', () => {
  const cats = [
    ...gerarCategorias('casamento', categorias, 6_000_000),
    ...gerarCategorias('casa', categorias, null),
  ];
  const entrada: EntradaOrcamento = {
    categorias: cats,
    fornecedores: [
      { id: 'f1', nome: 'Espaço Jardim', categoria: 'casamento_local_buffet', status: 'fechado', valor: 1_800_000 },
      { id: 'f2', nome: 'Studio Luz', categoria: 'casamento_foto_video', status: 'negociando', valor: 780_000 },
      { id: 'f3', nome: 'Ateliê Vera', categoria: 'casamento_roupas_beleza', status: 'fechado', valor: 650_000 },
    ],
    gastos: [
      { id: 'g1', categoria_id: 'casamento_roupas_beleza', descricao: 'Sapatos', valor: 30_000, data: HOJE, origem: 'manual' },
      { id: 'g2', categoria_id: 'casa_moveis', descricao: 'Sofá', valor: 250_000, data: HOJE, origem: 'manual' },
    ],
    itens: [
      { id: 'i1', nome: 'Toalha', estado: 'ja_tenho', origem: 'comprado', preco_estimado: 5_000, quantidade: 4 },
      { id: 'i2', nome: 'Geladeira', estado: 'ja_tenho', origem: 'ganhado', preco_estimado: 320_000, quantidade: 1 },
      { id: 'i3', nome: 'Fogão', estado: 'falta', origem: null, preco_estimado: 150_000, quantidade: 1 },
    ],
  };

  it('gasto = fornecedores fechados + gastos avulsos; estouro por categoria', () => {
    const r = resumoOrcamento(entrada, 'casamento');
    expect(r.planejadoTotal).toBe(6_000_000);
    expect(r.gastoTotal).toBe(1_800_000 + 650_000 + 30_000);
    expect(r.percentualUsado).toBe(41);
    expect(r.saldo).toBe(6_000_000 - 2_480_000);
    expect(r.linhas.find((l) => l.id === 'casamento_foto_video')!.gasto).toBe(0);
    expect(r.estouros.map((l) => l.id)).toEqual(['casamento_roupas_beleza']);
    expect(r.estouros[0]!.excesso).toBe(680_000 - 600_000);
  });

  it('casa: itens comprados com preço entram (Enxoval) e o planejado começa vazio', () => {
    const r = resumoOrcamento(entrada, 'casa');
    expect(r.linhas.find((l) => l.id === 'casa_enxoval')!.gasto).toBe(20_000);
    expect(r.linhas.find((l) => l.id === 'casa_moveis')!.gasto).toBe(250_000);
    expect(r.planejadoTotal).toBe(0);
    expect(r.percentualUsado).toBeNull();
    expect(r.estouros).toEqual([]);
  });

  it('o atalho do Início só conta os escopos ativos', () => {
    expect(percentualUsadoNosEscopos(entrada, ['casamento'])).toBe(41);
    expect(percentualUsadoNosEscopos(entrada, ['casa'])).toBeNull();
    expect(percentualUsadoNosEscopos(entrada, [])).toBeNull();
  });

  it('distribuir o orçamento pelos percentuais soma exatamente o total', () => {
    const d = distribuirOrcamento(3_333_333, categorias);
    expect(d.reduce((s, c) => s + c.planejado, 0)).toBe(3_333_333);
    expect(d.find((c) => c.id === 'casamento_musica')!.planejado).toBe(Math.floor((3_333_333 * 7) / 100));
  });

  it('estimativa do buffet', () => {
    expect(estimativaBuffet(15_000, 48)).toBe(720_000);
    expect(estimativaBuffet(null, 48)).toBeNull();
  });
});

describe('fornecedores e parcelas (T16, T17, T37)', () => {
  it('resumo e atalho de fechados', () => {
    const lista = [{ status: 'fechado' }, { status: 'negociando' }, { status: 'orcamento_pedido' }, { status: 'pesquisando' }, { status: 'descartado' }] as const;
    expect(resumoFornecedores(lista)).toEqual({ fechados: 1, negociando: 2, pesquisando: 1 });
    expect(fornecedoresFechados(lista)).toEqual({ fechados: 1, total: 4 });
  });

  it('chips: fixos e depois os existentes', () => {
    expect(chipsFornecedores([{ categoria: 'casamento_lua_de_mel' }, { categoria: 'casamento_musica' }]).slice(-1)).toEqual(['casamento_lua_de_mel']);
  });

  it('iniciais', () => {
    expect(iniciais('Studio Luz')).toBe('SL');
    expect(iniciais('  dj rafa som ')).toBe('DR');
    expect(iniciais('Buffet')).toBe('BU');
  });

  it('validações: nome e categoria; valor só para fechar', () => {
    expect(validarFornecedor({ nome: ' ', categoria: null, valor: null }, false)).toEqual({
      nome: 'Informe o nome do fornecedor.',
      categoria: 'Escolha a categoria.',
    });
    expect(validarFornecedor({ nome: 'A', categoria: 'c', valor: null }, true)).toEqual({ valor: 'Informe o valor para fechar.' });
    expect(validarFornecedor({ nome: 'A', categoria: 'c', valor: 100 }, true)).toEqual({});
  });

  it('fechar conclui as tarefas ligadas ainda abertas', () => {
    const t = [
      { id: 'a', fornecedor_id: 'f1', status: 'a_fazer' },
      { id: 'b', fornecedor_id: 'f1', status: 'concluida' },
      { id: 'c', fornecedor_id: 'f2', status: 'a_fazer' },
    ];
    expect(tarefasConcluidasAoFechar('f1', t)).toEqual(['a']);
  });

  it('gerar parcelas: entrada + N mensais, soma igual ao valor', () => {
    const p = gerarParcelas(780_000, 5, '2026-10-30');
    expect(p.map((x) => x.descricao)).toEqual(['Entrada', 'Parcela 1', 'Parcela 2', 'Parcela 3', 'Parcela 4', 'Parcela 5']);
    expect(p.map((x) => x.valor)).toEqual([130_000, 130_000, 130_000, 130_000, 130_000, 130_000]);
    expect(p[1]!.vencimento).toBe('2026-11-30');
    expect(p[4]!.vencimento).toBe('2027-02-28');
    const q = gerarParcelas(100_001, 2, '2026-01-31');
    expect(q.reduce((s, x) => s + x.valor, 0)).toBe(100_001);
    expect(adicionarMeses('2028-01-31', 1)).toBe('2028-02-29');
  });

  it('soma das parcelas diferente do valor avisa', () => {
    expect(diferencaParcelas(780_000, [{ valor: 130_000 }])).toBe(-650_000);
    expect(diferencaParcelas(780_000, [])).toBe(0);
  });

  it('rótulo e próximas parcelas (só de fechados, não pagas, por vencimento)', () => {
    const parcelas = [
      { id: 'p0', fornecedor_id: 'f1', numero: 0, descricao: 'Entrada', valor: 1, vencimento: '2026-11-10', paga: true },
      { id: 'p1', fornecedor_id: 'f1', numero: 1, descricao: 'Parcela 1', valor: 1, vencimento: '2026-12-10', paga: false },
      { id: 'p2', fornecedor_id: 'f1', numero: 2, descricao: 'Parcela 2', valor: 1, vencimento: '2027-01-10', paga: false },
      { id: 'x1', fornecedor_id: 'f2', numero: 1, descricao: 'Parcela 1', valor: 1, vencimento: '2026-11-01', paga: false },
      { id: 'y1', fornecedor_id: 'f3', numero: 1, descricao: 'Parcela 1', valor: 1, vencimento: '2026-11-20', paga: false },
    ];
    const fornecedores = [
      { id: 'f1', status: 'fechado' as const },
      { id: 'f2', status: 'negociando' as const },
      { id: 'f3', status: 'fechado' as const },
    ];
    expect(proximasParcelas(parcelas, fornecedores).map((p) => p.id)).toEqual(['y1', 'p1', 'p2']);
    expect(rotuloParcela(parcelas[1]!, parcelas.slice(0, 3))).toBe('Parcela 1 de 2');
    expect(rotuloParcela(parcelas[0]!, parcelas.slice(0, 3))).toBe('Entrada');
  });
});

describe('13.9 troca de modo', () => {
  it('folha de confirmação: abas e o que fica guardado', () => {
    expect(textoConfirmacaoModo('os_dois', 'casa')).toEqual({
      titulo: 'Mudar para “Só a casa nova”?',
      abas: 'Início, Casa, Presentes e Perfil',
      guardado: 'O checklist, o orçamento e os convidados ficam guardados.',
    });
    expect(textoConfirmacaoModo('os_dois', 'casamento').guardado).toBe('O enxoval, os cômodos e as medidas ficam guardados.');
    expect(textoConfirmacaoModo('casa', 'os_dois').guardado).toBeNull();
    expect(listarAbas('indefinido')).toBe('Início, Presentes e Perfil');
  });

  it('regra 2: só pede os dados dos módulos nunca gerados', () => {
    expect(passosParaAtivar('os_dois', { casamento: false, casa: true })).toEqual(['T07']);
    expect(passosParaAtivar('os_dois', { casamento: true, casa: false })).toEqual(['T08', 'T09']);
    expect(passosParaAtivar('os_dois', { casamento: false, casa: false })).toEqual(['T07', 'T08', 'T09']);
    expect(passosParaAtivar('casa', { casamento: true, casa: true })).toEqual([]);
    expect(passosParaAtivar('casamento', { casamento: true, casa: false })).toEqual([]);
  });

  it('ativar um módulo a partir do modo atual', () => {
    expect(modoAoAtivar('casa', 'casamento')).toBe('os_dois');
    expect(modoAoAtivar('casamento', 'casa')).toBe('os_dois');
    expect(modoAoAtivar('indefinido', 'casa')).toBe('casa');
    expect(modoAoAtivar('os_dois', 'casa')).toBe('os_dois');
  });

  it('texto da notificação ao parceiro', () => {
    expect(textoModoAlterado('Ana', 'casa')).toBe('Ana mudou o app para “Só a casa nova”.');
  });
});

import { dataCurta, dataPorExtenso, mesAnoPorExtenso, mesesAte } from './datas';

describe('datas por extenso', () => {
  it('formatos do Início', () => {
    expect(dataPorExtenso('2027-04-18')).toBe('18 de abril de 2027');
    expect(dataCurta('2026-10-22')).toBe('22 out');
    expect(dataCurta('2026-03-05')).toBe('05 mar');
    expect(mesAnoPorExtenso('2027-05')).toBe('Maio de 2027');
    expect(mesesAte('2026-10-26', '2027-05')).toBe(7);
  });
});
