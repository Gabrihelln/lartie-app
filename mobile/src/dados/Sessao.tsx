import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getIdTokenResult, onIdTokenChanged, type User } from '@react-native-firebase/auth';
import { CLAIM_CASAL, caminhos, type Casal, type ModoApp } from '@lartie/modelo';
import { auth } from '../servicos/firebase';
import { useDocumento } from './leitura';

// Sessão do app: quem está logado, de qual casal (claim casal_id gravado pelo servidor) e o
// documento do casal em tempo real. O modo do app vem daqui e muda as abas na hora, inclusive
// quando o parceiro troca o modo no outro aparelho (fluxo 16).

interface ValorSessao {
  usuario: User | null;
  casalId: string | null;
  casal: (Casal & { id: string }) | null;
  /** indefinido enquanto não há casal carregado. */
  modo: ModoApp;
  carregando: boolean;
}

const ContextoSessao = createContext<ValorSessao | null>(null);

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [casalId, setCasalId] = useState<string | null>(null);
  const [carregandoAuth, setCarregandoAuth] = useState(true);

  useEffect(
    () =>
      onIdTokenChanged(auth(), async (u) => {
        setUsuario(u);
        if (!u) {
          setCasalId(null);
        } else {
          const token = await getIdTokenResult(u);
          const claim = token.claims[CLAIM_CASAL];
          setCasalId(typeof claim === 'string' ? claim : null);
        }
        setCarregandoAuth(false);
      }),
    [],
  );

  const casal = useDocumento<Casal>(casalId ? caminhos.casal(casalId) : null);

  const valor: ValorSessao = {
    usuario,
    casalId,
    casal: casal.dados,
    modo: casal.dados?.modo_app ?? 'indefinido',
    carregando: carregandoAuth || casal.carregando,
  };

  return <ContextoSessao.Provider value={valor}>{children}</ContextoSessao.Provider>;
}

export function useSessao(): ValorSessao {
  const v = useContext(ContextoSessao);
  if (!v) throw new Error('useSessao precisa estar dentro de SessaoProvider');
  return v;
}
