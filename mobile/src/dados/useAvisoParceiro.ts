import { useEffect } from 'react';
import { collection, doc, onSnapshot, query, updateDoc, where } from '@react-native-firebase/firestore';
import { caminhos } from '@lartie/modelo';
import { useAvisos } from '../feedback/Avisos';
import { db } from '../servicos/firebase';
import { useSessao } from './Sessao';

// "Parceiro entrou" (Seção 12): a API cria a notificação quando o convite é aceito. Até o push e a
// tela de notificações (Etapa 9), o app mostra um aviso rápido e marca como lida.
export function useAvisoParceiro() {
  const { usuario, casalId } = useSessao();
  const avisos = useAvisos();

  useEffect(() => {
    if (!usuario || !casalId) return;
    const consulta = query(
      collection(db(), caminhos.subcolecao(casalId, 'notificacoes')),
      where('usuario_id', '==', usuario.uid),
      where('tipo', '==', 'parceiro_entrou'),
      where('lida', '==', false),
    );
    return onSnapshot(
      consulta,
      (snap) => {
        snap.docs.forEach((d) => {
          avisos.mostrar({ texto: String(d.get('texto') ?? 'Seu par entrou no plano de vocês.'), tipo: 'sucesso' });
          updateDoc(doc(db(), caminhos.documento(casalId, 'notificacoes', d.id)), { lida: true }).catch(() => {});
        });
      },
      () => {},
    );
  }, [usuario, casalId, avisos]);
}
