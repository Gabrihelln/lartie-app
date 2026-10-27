import * as C from '../src/feedback/confirmacoes';

// Etapa 7: cada confirmação da Seção 15 da especificação, com título, botões e tom. A tabela de
// rastreio do relatório aponta para estes testes.

describe('T34 a T43 (Seção 15)', () => {
  it('T34 excluir tarefa', () => {
    expect(C.excluirTarefa('Fechar fotógrafo')).toMatchObject({
      titulo: 'Excluir esta tarefa?',
      texto: '“Fechar fotógrafo” sai do checklist de vocês dois. Não dá para desfazer.',
      cancelar: 'Cancelar',
      confirmar: 'Excluir',
      tom: 'destrutivo',
    });
  });

  it('T35 excluir item (avisa que a reserva é cancelada)', () => {
    expect(C.excluirItem('Geladeira frost free', 'da cozinha')).toMatchObject({
      titulo: 'Excluir “Geladeira frost free”?',
      texto: 'O item sai do enxoval da cozinha e da lista de presentes. Se alguém já reservou, o convidado será avisado.',
      cancelar: 'Cancelar',
      confirmar: 'Excluir',
      tom: 'destrutivo',
    });
  });

  it('T36 descartar alterações', () => {
    expect(C.descartarAlteracoes('este grupo')).toMatchObject({ titulo: 'Descartar as alterações?', cancelar: 'Continuar editando', confirmar: 'Descartar', tom: 'destrutivo' });
  });

  it('T37 fornecedor fechado', () => {
    expect(
      C.fecharFornecedor('Studio Luz', ['R$ 7.800 entram no orçamento de Fotografia', 'as 6 parcelas vão para o calendário', 'a tarefa “Fechar fotógrafo” será concluída']),
    ).toEqual({
      titulo: 'Marcar Studio Luz como fechado?',
      texto: 'R$ 7.800 entram no orçamento de Fotografia, as 6 parcelas vão para o calendário e a tarefa “Fechar fotógrafo” será concluída.',
      cancelar: 'Cancelar',
      confirmar: 'Confirmar',
    });
  });

  it('T38 lembrar pendentes (WhatsApp)', () => {
    expect(C.lembrarPendentes(86, 21, '18/02/2027', 0)).toMatchObject({
      titulo: 'Lembrar 86 pessoas?',
      texto: 'Cada um dos 21 grupos recebe pelo WhatsApp o link para confirmar presença até 18/02/2027.',
      cancelar: 'Cancelar',
      confirmar: 'Enviar',
      tom: 'whatsapp',
    });
    expect(C.lembrarPendentes(1, 1, null, 2).titulo).toBe('Lembrar 1 pessoa?');
  });

  it('T39 publicar lista', () => {
    expect(C.publicarLista('do chá de panela')).toMatchObject({ titulo: 'Publicar a lista do chá de panela?', cancelar: 'Cancelar', confirmar: 'Publicar' });
  });

  it('T41 sair', () => {
    expect(C.sairDaConta()).toEqual({
      titulo: 'Sair da conta?',
      texto: 'O plano de vocês continua salvo. Para voltar, é só entrar com o mesmo e-mail.',
      cancelar: 'Cancelar',
      confirmar: 'Sair',
    });
  });

  it('T42 excluir conta exige "EXCLUIR"', () => {
    const c = C.excluirConta('Pedro');
    expect(c).toMatchObject({ titulo: 'Excluir a conta e todos os dados?', textoExigido: 'EXCLUIR', rotuloCampo: 'Digite EXCLUIR para confirmar', cancelar: 'Cancelar', confirmar: 'Excluir tudo', tom: 'destrutivo' });
    expect(c.texto).toContain('Pedro também perde o acesso.');
    expect(C.excluirConta(null).texto).not.toContain('perde o acesso');
  });

  it('T43 remover parceiro (texto neutro)', () => {
    expect(C.removerParceiro('Pedro')).toMatchObject({
      titulo: 'Remover Pedro do plano?',
      texto: 'Pedro deixa de ver e editar o casamento e a casa nova. Vocês podem enviar um novo convite depois.',
      cancelar: 'Cancelar',
      confirmar: 'Remover',
      tom: 'destrutivo',
    });
  });
});

describe('confirmações menores (Seção 15, último parágrafo)', () => {
  it.each([
    ['excluir fornecedor', C.excluirFornecedor('Studio Luz'), 'Excluir Studio Luz?', 'Excluir', 'destrutivo'],
    ['excluir grupo', C.excluirGrupo('Família Souza', 4), 'Excluir Família Souza e 4 pessoas?', 'Excluir', 'destrutivo'],
    ['excluir lista', C.excluirLista('do casamento', 2), 'Excluir a lista do casamento?', 'Excluir lista', 'destrutivo'],
    ['despublicar lista', C.despublicarLista(), 'Despublicar a lista?', 'Despublicar', undefined],
    ['excluir cômodo', C.excluirComodo('Varanda', 3), 'Excluir Varanda?', 'Excluir', 'destrutivo'],
    ['tirar da lista item com reserva', C.tirarDaListaComReserva('Tia Bia'), 'Tirar da lista?', 'Tirar da lista', 'destrutivo'],
    ['cancelar reserva pelo casal', C.cancelarReserva('Air fryer', 'Tia Bia'), 'Cancelar a reserva?', 'Cancelar reserva', 'destrutivo'],
    ['excluir gasto avulso', C.excluirGasto('Sapatos'), 'Excluir “Sapatos”?', 'Excluir', 'destrutivo'],
    ['marcar parcela paga', C.marcarParcelaPaga('Entrada', 'R$ 1.300'), 'Marcar como paga?', 'Marcar como paga', undefined],
    ['excluir parcela', C.excluirParcela('Parcela 2'), 'Excluir “Parcela 2”?', 'Excluir', 'destrutivo'],
    ['excluir parede livre', C.excluirParede('Parede da TV'), 'Excluir “Parede da TV”?', 'Excluir', 'destrutivo'],
    ['remover contrato', C.removerContrato(), 'Remover o contrato?', 'Remover', 'destrutivo'],
    ['sair do plano', C.sairDoPlano('Ana'), 'Sair do plano de Ana?', 'Sair do plano', 'destrutivo'],
    ['excluir tarefa da mudança (P04)', C.excluirTarefaMudanca('Contratar internet'), 'Excluir esta tarefa?', 'Excluir', 'destrutivo'],
  ])('%s', (_nome, c, titulo, confirmar, tom) => {
    expect(c.titulo).toBe(titulo);
    expect(c.confirmar).toBe(confirmar);
    expect(c.tom).toBe(tom);
    // Toda confirmação tem um botão de cancelar (a da esquerda).
    expect(c.cancelar).toBeTruthy();
  });

  it('toda exclusão é destrutiva', () => {
    const exclusoes = [C.excluirTarefa('x'), C.excluirItem('x', null), C.excluirFornecedor('x'), C.excluirGrupo('x', 1), C.excluirLista('do x', 0), C.excluirComodo('x', 0), C.excluirGasto('x'), C.excluirParcela('x'), C.excluirParede('x'), C.excluirConta(null)];
    expect(exclusoes.every((c) => c.tom === 'destrutivo')).toBe(true);
  });
});
