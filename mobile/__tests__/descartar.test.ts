import { textoDescartar } from '../src/feedback/useDescartarAlteracoes';

jest.mock('@react-navigation/native', () => ({ useNavigation: jest.fn() }));
jest.mock('../src/feedback/Dialogo', () => ({ useDialogo: jest.fn() }));

describe('Descartar alterações (T36)', () => {
  it('usa os textos do protótipo', () => {
    expect(textoDescartar()).toEqual({
      titulo: 'Descartar as alterações?',
      texto: 'Vocês mudaram este item e ainda não salvaram.',
      cancelar: 'Continuar editando',
      confirmar: 'Descartar',
    });
  });

  it('adapta o objeto da frase', () => {
    expect(textoDescartar('esta tarefa').texto).toBe('Vocês mudaram esta tarefa e ainda não salvaram.');
  });
});
