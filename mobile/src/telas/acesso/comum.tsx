import { useCallback } from 'react';
import { useAvisos } from '../../feedback/Avisos';
import { useDialogo } from '../../feedback/Dialogo';
import { ErroAcesso } from '../../servicos/acesso';

// Peças comuns das telas de acesso.

/** Termos de Uso e Política de Privacidade: ainda não existem (P09). Até lá, um aviso. */
export function useAbrirDocumentoLegal() {
  const { confirmar } = useDialogo();
  return useCallback(
    (qual: 'termos' | 'privacidade') =>
      confirmar({
        icone: 'info',
        titulo: qual === 'termos' ? 'Termos de Uso' : 'Política de Privacidade',
        texto: '[a definir] O texto será publicado em lartie.app antes do lançamento (pendência P09).',
        cancelar: null,
        confirmar: 'Entendi',
      }),
    [confirmar],
  );
}

/** Erros do login com Google ou Apple (T03 e T04). Cancelar não mostra nada. */
export function useTratarErroSocial() {
  const avisos = useAvisos();
  const { confirmar } = useDialogo();
  return useCallback(
    async (erro: unknown) => {
      const codigo = erro instanceof ErroAcesso ? erro.codigo : 'desconhecido';
      if (codigo === 'cancelado') return;
      if (codigo === 'sem_conexao') {
        avisos.mostrar({ texto: 'Sem conexão com a internet. Confira e tente de novo.', tipo: 'erro' });
        return;
      }
      await confirmar({
        icone: 'erro',
        titulo: codigo === 'outro_provedor' ? 'Este e-mail já tem uma conta' : 'Não foi possível entrar',
        texto:
          codigo === 'outro_provedor'
            ? 'Entre do mesmo jeito que vocês usaram para criar a conta, com e-mail e senha ou com o outro botão.'
            : 'Algo deu errado. Tente de novo em instantes.',
        cancelar: null,
        confirmar: 'Entendi',
      });
    },
    [avisos, confirmar],
  );
}
