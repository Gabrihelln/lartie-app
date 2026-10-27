import { describe, expect, it } from 'vitest';
import {
  agruparPorSobrenome,
  exportarCsv,
  linkDoRsvp,
  mensagemConviteRsvp,
  mensagemLembreteRsvp,
  passaNoFiltro,
  podeLembrar,
  prazoEncerrado,
  resumoConvidados,
  rotuloStatusGrupo,
  statusDoGrupo,
  textoRsvpRespondido,
  validarRespostas,
} from './rsvp';

const p = (presenca: 'vai' | 'nao_vai' | 'sem_resposta', faixa: 'adulto' | 'crianca' = 'adulto') => ({ presenca, faixa });

describe('13.6 status do grupo', () => {
  it('confirmado, não vão, parcial e sem resposta', () => {
    expect(statusDoGrupo([p('vai'), p('vai')])).toEqual({ tipo: 'confirmado' });
    expect(statusDoGrupo([p('nao_vai'), p('nao_vai')])).toEqual({ tipo: 'nao_vao' });
    expect(statusDoGrupo([p('vai'), p('nao_vai'), p('vai')])).toEqual({ tipo: 'parcial', vao: 2, total: 3 });
    expect(statusDoGrupo([p('sem_resposta')])).toEqual({ tipo: 'sem_resposta' });
    expect(statusDoGrupo([])).toEqual({ tipo: 'sem_resposta' });
    expect(rotuloStatusGrupo({ tipo: 'parcial', vao: 3, total: 4 })).toBe('Parcial 3/4');
  });

  it('painel e filtros (Confirmados inclui parciais)', () => {
    expect(resumoConvidados([p('vai'), p('nao_vai', 'crianca'), p('sem_resposta')])).toEqual({ total: 3, adultos: 2, criancas: 1, confirmados: 1, naoVao: 1, semResposta: 1 });
    expect(passaNoFiltro({ tipo: 'parcial', vao: 1, total: 2 }, 'confirmados')).toBe(true);
    expect(passaNoFiltro({ tipo: 'nao_vao' }, 'confirmados')).toBe(false);
    expect(passaNoFiltro({ tipo: 'sem_resposta' }, 'sem_resposta')).toBe(true);
  });
});

describe('13.6 lembrete em lote (T38)', () => {
  const agora = Date.UTC(2026, 9, 27);
  const dia = 86_400_000;
  it('só sem resposta, com WhatsApp, no máximo 1 a cada 3 dias', () => {
    const sr = { tipo: 'sem_resposta' } as const;
    expect(podeLembrar({ whatsapp: '41999', ultimoLembrete: null, status: sr }, agora)).toBe(true);
    expect(podeLembrar({ whatsapp: null, ultimoLembrete: null, status: sr }, agora)).toBe(false);
    expect(podeLembrar({ whatsapp: '41999', ultimoLembrete: agora - 2 * dia, status: sr }, agora)).toBe(false);
    expect(podeLembrar({ whatsapp: '41999', ultimoLembrete: agora - 3 * dia, status: sr }, agora)).toBe(true);
    expect(podeLembrar({ whatsapp: '41999', ultimoLembrete: null, status: { tipo: 'confirmado' } }, agora)).toBe(false);
  });
});

describe('T30: prazo e respostas', () => {
  it('o dia do prazo ainda vale', () => {
    expect(prazoEncerrado('2027-02-18', '2027-02-18')).toBe(false);
    expect(prazoEncerrado('2027-02-18', '2027-02-19')).toBe(true);
    expect(prazoEncerrado(null, '2030-01-01')).toBe(false);
  });
  it('exige resposta para todas as pessoas', () => {
    expect(validarRespostas([{ presenca: 'vai' }, { presenca: 'nao_vai' }], 2)).toBeNull();
    expect(validarRespostas([{ presenca: 'vai' }, { presenca: 'sem_resposta' }], 2)).not.toBeNull();
    expect(validarRespostas([{ presenca: 'vai' }], 2)).not.toBeNull();
  });
});

describe('mensagens (textos-e-mensagens.md, seção 4)', () => {
  it('convite, lembrete e notificação', () => {
    const link = linkDoRsvp('ana-e-pedro', 'tk');
    expect(link).toBe('lartie.app/ana-e-pedro/rsvp/tk');
    expect(mensagemConviteRsvp({ grupo: 'Família Souza', casal: 'Ana & Pedro', data: '18/04/2027', cidade: 'Curitiba', prazo: '18/02/2027', link })).toBe(
      'Oi, Família Souza! Ana & Pedro vão se casar em 18/04/2027, em Curitiba. Confirme a presença de vocês até 18/02/2027: lartie.app/ana-e-pedro/rsvp/tk',
    );
    expect(mensagemLembreteRsvp({ grupo: 'Família Souza', casal: 'Ana & Pedro', link })).toBe(
      'Oi, Família Souza! Ainda não recebemos a confirmação de vocês para o casamento de Ana & Pedro. Leva menos de um minuto: lartie.app/ana-e-pedro/rsvp/tk',
    );
    expect(textoRsvpRespondido('Família Souza', 3, 4)).toBe('Família Souza confirmou presença: 3 de 4 pessoas.');
  });
});

describe('importar e exportar', () => {
  it('agrupa por sobrenome', () => {
    const g = agruparPorSobrenome([{ nome: 'Marta Souza' }, { nome: 'Paulo Souza' }, { nome: 'Carla' }]);
    expect(g.map((x) => [x.nome, x.pessoas.length])).toEqual([
      ['Família Souza', 2],
      ['Carla', 1],
    ]);
  });
  it('CSV com separador ";" e aspas quando precisa', () => {
    const csv = exportarCsv(
      [{ id: 'g1', nome: 'Família Souza' }],
      [
        { grupo_id: 'g1', nome: 'Marta', faixa: 'adulto', presenca: 'vai', restricao_alimentar: 'vegano' },
        { grupo_id: 'g1', nome: 'Lucas; Jr', faixa: 'crianca', presenca: 'sem_resposta', restricao_alimentar: 'outra', restricao_outra: 'Amendoim' },
      ],
    );
    expect(csv.split('\n')).toEqual(['Nome;Grupo;Faixa;Presença;Restrição', '"Lucas; Jr";Família Souza;Criança;Sem resposta;Amendoim', 'Marta;Família Souza;Adulto;Vai;Vegano']);
  });
});
