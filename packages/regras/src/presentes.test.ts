import { describe, expect, it } from 'vitest';
import {
  conferirReserva,
  disponivel,
  esconderNome,
  linkDaLista,
  linkDaReserva,
  mensagemCompartilhar,
  mensagemConfirmacaoReserva,
  mensagemReservaCancelada,
  modeloAgradecimentoPadrao,
  ocasioesDoModo,
  preencherAgradecimento,
  resumoPresentes,
  sugerirSlugLista,
  textoNovaReserva,
  validarSlugLista,
} from './presentes';

describe('13.9 regra 4: ocasiões por modo', () => {
  it('casamento, casa, os dois e indefinido', () => {
    expect(ocasioesDoModo('casamento')).toEqual(['cha_panela', 'cha_bar', 'casamento']);
    expect(ocasioesDoModo('casa')).toEqual(['cha_panela', 'cha_cozinha', 'cha_bar']);
    expect(ocasioesDoModo('os_dois')).toHaveLength(4);
    expect(ocasioesDoModo('indefinido')).toHaveLength(4);
  });
});

describe('endereço da lista (T23)', () => {
  it('sugere e valida, único no casal', () => {
    expect(sugerirSlugLista('cha_panela', [])).toBe('cha-de-panela');
    expect(sugerirSlugLista('cha_panela', ['cha-de-panela'])).toBe('cha-de-panela-2');
    expect(validarSlugLista('cha-de-panela', [])).toBeNull();
    expect(validarSlugLista('Chá', [])).toBe('Use de 3 a 40 letras minúsculas, números e hífens.');
    expect(validarSlugLista('a--b', [])).not.toBeNull();
    expect(validarSlugLista('casamento', ['casamento'])).toBe('Vocês já têm uma lista com este endereço.');
    expect(validarSlugLista('reserva', [])).toBe('Este endereço é usado pelo Lartiê. Escolham outro.');
  });
});

describe('13.5 reservas', () => {
  const reservas = [
    { quantidade: 2, status: 'ativa' as const },
    { quantidade: 1, status: 'recebida' as const },
    { quantidade: 3, status: 'expirada' as const },
    { quantidade: 1, status: 'cancelada' as const },
  ];
  it('disponível = quantidade − ativas − recebidas', () => {
    expect(disponivel(6, reservas)).toBe(3);
    expect(disponivel(2, reservas)).toBe(0);
  });
  it('recusa pedir mais do que o disponível e quantidades inválidas', () => {
    expect(conferirReserva(1, 1)).toBe('ok');
    expect(conferirReserva(2, 1)).toBe('indisponivel');
    expect(conferirReserva(1, 0)).toBe('indisponivel');
    expect(conferirReserva(0, 3)).toBe('quantidade_invalida');
    expect(conferirReserva(1.5, 3)).toBe('quantidade_invalida');
  });
  it('resumo do T23', () => {
    expect(resumoPresentes([{ quantidade_na_lista: 6 }, { quantidade_na_lista: 4 }], reservas)).toEqual({ reservados: 2, recebidos: 1, faltam: 7, total: 10 });
  });
  it('modo surpresa esconde o nome até o dia do evento', () => {
    expect(esconderNome(false, null, '2026-10-27')).toBe(false);
    expect(esconderNome(true, null, '2026-10-27')).toBe(true);
    expect(esconderNome(true, '2026-11-12', '2026-10-27')).toBe(true);
    expect(esconderNome(true, '2026-11-12', '2026-11-12')).toBe(false);
  });
});

describe('mensagens (textos-e-mensagens.md, seção 3)', () => {
  it('compartilhar, confirmação, cancelamento e notificação', () => {
    const link = linkDaLista('ana-e-pedro', 'cha-de-panela');
    expect(link).toBe('lartie.app/ana-e-pedro/cha-de-panela');
    expect(linkDaReserva('ana-e-pedro', 'tk')).toBe('lartie.app/ana-e-pedro/reserva/tk');
    expect(mensagemCompartilhar('cha_panela', link)).toBe(
      'Oi! Fizemos nossa lista de presentes do chá de panela. Escolha um presente e reserve aqui: lartie.app/ana-e-pedro/cha-de-panela',
    );
    expect(
      mensagemConfirmacaoReserva({ convidado: 'Bia', quantidade: 2, item: 'Pratos rasos', casal: 'Ana & Pedro', expiraEm: '11/11/2026', entrega: null, link: 'x' }),
    ).toBe('Oi, Bia! Sua reserva de 2 Pratos rasos para Ana & Pedro está confirmada. Ela vale até 11/11/2026.\nSe mudar de ideia, desfaça aqui: x');
    expect(mensagemReservaCancelada({ convidado: 'Bia', casal: 'Ana & Pedro', item: 'Air fryer', link: 'y' })).toBe(
      'Oi, Bia! Ana & Pedro tiraram Air fryer da lista, então a sua reserva foi cancelada. Veja outros presentes: y',
    );
    expect(textoNovaReserva('Bia', 'Air fryer', 'cha_panela', false)).toBe('Bia reservou Air fryer no chá de panela.');
    expect(textoNovaReserva('Bia', 'Air fryer', 'cha_panela', true)).toBe('Alguém reservou Air fryer.');
  });
  it('agradecimento com [nome] e [presente]', () => {
    const m = modeloAgradecimentoPadrao('Ana', 'Pedro');
    expect(preencherAgradecimento(m, 'Tia Bia', 'jogo de panelas')).toBe(
      'Oi, Tia Bia! Muito obrigado pelo jogo de panelas. Ele já tem lugar especial na nossa casa nova. Com carinho, Ana e Pedro.',
    );
  });
});
