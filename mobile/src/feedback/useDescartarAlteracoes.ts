import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useDialogo } from './Dialogo';

// Guarda de "Descartar alterações" (T36) para qualquer formulário: ao voltar (seta, gesto ou
// botão voltar do Android) com alterações não salvas, pergunta antes de sair.
// Ao salvar com sucesso, passe `temAlteracoes = false` antes de navegar.

interface Opcoes {
  temAlteracoes: boolean;
  /** Completa a frase "Vocês mudaram ___ e ainda não salvaram." Padrão: "este item". */
  oQue?: string;
}

export function textoDescartar(oQue = 'este item') {
  return {
    titulo: 'Descartar as alterações?',
    texto: `Vocês mudaram ${oQue} e ainda não salvaram.`,
    cancelar: 'Continuar editando',
    confirmar: 'Descartar',
  };
}

export function useDescartarAlteracoes({ temAlteracoes, oQue }: Opcoes) {
  const navigation = useNavigation();
  const { confirmar } = useDialogo();

  useEffect(() => {
    if (!temAlteracoes) return;
    return navigation.addListener('beforeRemove', (evento) => {
      evento.preventDefault();
      confirmar({ ...textoDescartar(oQue), tom: 'destrutivo' }).then((descartar) => {
        if (descartar) navigation.dispatch(evento.data.action);
      });
    });
  }, [navigation, confirmar, temAlteracoes, oQue]);
}
