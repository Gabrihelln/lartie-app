import React, { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { getIdTokenResult, onIdTokenChanged, type User } from '@react-native-firebase/auth';
import { CLAIM_CASAL, caminhos, type Casal, type ModoApp } from '@lartie/modelo';
import { consumirSaidaVoluntaria } from '../servicos/acesso';
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
  /** A sessão terminou sem a pessoa pedir: o T04 mostra "Sua sessão expirou. Entre de novo." */
  sessaoExpirada: boolean;
  limparAvisoSessao: () => void;
}

const ContextoSessao = createContext<ValorSessao | null>(null);

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [casalId, setCasalId] = useState<string | null>(null);
  const [carregandoAuth, setCarregandoAuth] = useState(true);
  const [sessaoExpirada, setSessaoExpirada] = useState(false);
  const tinhaUsuario = useRef(false);

  useEffect(
    () =>
      onIdTokenChanged(auth(), async (u) => {
        if (!u) {
          const voluntaria = consumirSaidaVoluntaria();
          if (tinhaUsuario.current && !voluntaria) setSessaoExpirada(true);
          tinhaUsuario.current = false;
          setUsuario(null);
          setCasalId(null);
        } else {
          tinhaUsuario.current = true;
          setSessaoExpirada(false);
          try {
            const token = await getIdTokenResult(u);
            const claim = token.claims[CLAIM_CASAL];
            setCasalId(typeof claim === 'string' ? claim : null);
          } catch {
            // Sem conexão na abertura: o claim vem do token em cache; se não der, a tela de preparo tenta de novo.
            setCasalId(null);
          }
          setUsuario(u);
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
    sessaoExpirada,
    limparAvisoSessao: () => setSessaoExpirada(false),
  };

  return <ContextoSessao.Provider value={valor}>{children}</ContextoSessao.Provider>;
}

export function useSessao(): ValorSessao {
  const v = useContext(ContextoSessao);
  if (!v) throw new Error('useSessao precisa estar dentro de SessaoProvider');
  return v;
}
