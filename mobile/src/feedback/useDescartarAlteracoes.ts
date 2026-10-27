import { useEffect, type RefObject } from 'react';
import { useNavigation } from '@react-navigation/native';
import { descartarAlteracoes } from './confirmacoes';
import { useDialogo } from './Dialogo';

// Guarda de "Descartar alterações" (T36) para qualquer formulário: ao voltar (seta, gesto ou
// botão voltar do Android) com alterações não salvas, pergunta antes de sair.
// Ao salvar com sucesso, passe `temAlteracoes = false` antes de navegar.

interface Opcoes {
  temAlteracoes: boolean;
  /** Completa a frase "Vocês mudaram ___ e ainda não salvaram." Padrão: "este item". */
  oQue?: string;
  /**
   * Marque como true logo antes de navegar depois de salvar ou excluir: a saída não pergunta,
   * mesmo antes de a tela renderizar de novo.
   */
  liberado?: RefObject<boolean>;
}

/** T36. O texto fica no catálogo de confirmações (Seção 15). */
export const textoDescartar = descartarAlteracoes;

export function useDescartarAlteracoes({ temAlteracoes, oQue, liberado }: Opcoes) {
  const navigation = useNavigation();
  const { confirmar } = useDialogo();

  useEffect(() => {
    if (!temAlteracoes) return;
    return navigation.addListener('beforeRemove', (evento) => {
      if (liberado?.current) return;
      evento.preventDefault();
      confirmar(descartarAlteracoes(oQue)).then((descartar) => {
        if (descartar) navigation.dispatch(evento.data.action);
      });
    });
  }, [navigation, confirmar, temAlteracoes, oQue, liberado]);
}
