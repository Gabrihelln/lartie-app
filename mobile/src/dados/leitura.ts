import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  type DocumentSnapshot,
  type QueryConstraint,
  type QuerySnapshot,
} from '@react-native-firebase/firestore';
import { registrarErro } from '../servicos/analytics';
import { db } from '../servicos/firebase';

// Leituras em tempo real. O Firestore entrega primeiro o que está no cache (offline) e depois as
// mudanças do servidor, inclusive as feitas pelo parceiro em outro aparelho.
// `carregando` só é true na primeira carga sem cache: é quando a tela mostra o esqueleto (T64).
// `pendente` indica gravações locais ainda não confirmadas pelo servidor (ex.: offline).

export interface Leitura<T> {
  dados: T;
  carregando: boolean;
  pendente: boolean;
  doCache: boolean;
  erro: Error | null;
}

export function useDocumento<T>(caminho: string | null): Leitura<(T & { id: string }) | null> {
  const [estado, setEstado] = useState<Leitura<(T & { id: string }) | null>>({
    dados: null,
    carregando: !!caminho,
    pendente: false,
    doCache: false,
    erro: null,
  });

  useEffect(() => {
    if (!caminho) {
      setEstado({ dados: null, carregando: false, pendente: false, doCache: false, erro: null });
      return;
    }
    setEstado((e) => ({ ...e, carregando: true }));
    return onSnapshot(
      doc(db(), caminho),
      { includeMetadataChanges: true },
      (snap: DocumentSnapshot) => {
        setEstado({
          dados: snap.exists() ? ({ id: snap.id, ...(snap.data() as T) } as T & { id: string }) : null,
          carregando: false,
          pendente: snap.metadata.hasPendingWrites,
          doCache: snap.metadata.fromCache,
          erro: null,
        });
      },
      (erro: Error) => {
        registrarErro(erro, `ler ${caminho}`);
        setEstado((e) => ({ ...e, carregando: false, erro }));
      },
    );
  }, [caminho]);

  return estado;
}

export function useColecao<T>(
  caminho: string | null,
  ...restricoes: QueryConstraint[]
): Leitura<(T & { id: string })[]> {
  const [estado, setEstado] = useState<Leitura<(T & { id: string })[]>>({
    dados: [],
    carregando: !!caminho,
    pendente: false,
    doCache: false,
    erro: null,
  });

  // As restrições (where, orderBy) são recriadas a cada render; a chave textual evita reinscrever à toa.
  const chave = `${caminho}|${restricoes.map((r) => JSON.stringify(r)).join('|')}`;

  useEffect(() => {
    if (!caminho) {
      setEstado({ dados: [], carregando: false, pendente: false, doCache: false, erro: null });
      return;
    }
    return onSnapshot(
      query(collection(db(), caminho), ...restricoes),
      { includeMetadataChanges: true },
      (snap: QuerySnapshot) => {
        setEstado({
          dados: snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) })),
          carregando: false,
          pendente: snap.metadata.hasPendingWrites,
          doCache: snap.metadata.fromCache,
          erro: null,
        });
      },
      (erro: Error) => {
        registrarErro(erro, `ler ${caminho}`);
        setEstado((e) => ({ ...e, carregando: false, erro }));
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  return estado;
}
