import { useEffect } from 'react';
import { collection, doc, onSnapshot, query, updateDoc, where } from '@react-native-firebase/firestore';
import { caminhos } from '@lartie/modelo';
import { useAvisos } from '../feedback/Avisos';
import { db } from '../servicos/firebase';
import { useSessao } from './Sessao';

// Avisos do convite para quem convidou: "Parceiro entrou" (Seção 12) e "convite recusado" (ajuste da
// Etapa 2). A API cria a notificação; até o push e a tela de notificações (Etapa 9), o app mostra um
// aviso rápido e marca como lida.
export function useAvisoParceiro() {
  const { usuario, casalId } = useSessao();
  const avisos = useAvisos();

  useEffect(() => {
    if (!usuario || !casalId) return;
    const consulta = query(
      collection(db(), caminhos.subcolecao(casalId, 'notificacoes')),
      where('usuario_id', '==', usuario.uid),
      where('tipo', 'in', ['parceiro_entrou', 'convite_recusado', 'parceiro_saiu']),
      where('lida', '==', false),
    );
    return onSnapshot(
      consulta,
      (snap) => {
        snap.docs.forEach((d) => {
          const recusado = d.get('tipo') !== 'parceiro_entrou';
          avisos.mostrar({ texto: String(d.get('texto') ?? ''), tipo: recusado ? 'neutro' : 'sucesso' });
          updateDoc(doc(db(), caminhos.documento(casalId, 'notificacoes', d.id)), { lida: true }).catch(() => {});
        });
      },
      () => {},
    );
  }, [usuario, casalId, avisos]);
}
