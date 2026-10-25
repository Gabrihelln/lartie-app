import React, { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { getIdToken, getIdTokenResult, onIdTokenChanged, type User } from '@react-native-firebase/auth';
import { CLAIM_CASAL, caminhos, type Casal, type ModoApp, type Papel, type Usuario } from '@lartie/modelo';
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
  /** Papel no casal (usuarios/{uid}). Só o noivo_1 faz o onboarding; o noivo_2 entra pelo convite. */
  papel: Papel | null;
  /** indefinido enquanto não há casal carregado. */
  modo: ModoApp;
  carregando: boolean;
  /** A sessão terminou sem a pessoa pedir: o T04 mostra "Sua sessão expirou. Entre de novo." */
  sessaoExpirada: boolean;
  limparAvisoSessao: () => void;
  /** Lê o casal de novo (depois de a API confirmar o casal e o token ser renovado). */
  recarregarCasal: () => void;
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

  // Logo depois de a API gravar o claim, a primeira leitura do casal pode sair com o token antigo
  // e ser recusada pelas regras. Nesse caso, renova o token e lê de novo (até 5 vezes).
  const [tentativa, setTentativa] = useState(0);
  const casal = useDocumento<Casal>(casalId ? caminhos.casal(casalId) : null, tentativa);
  useEffect(() => setTentativa(0), [casalId]);
  const recarregarCasal = useCallback(() => setTentativa((n) => (n >= 5 ? 0 : n + 1)), []);
  const limparAvisoSessao = useCallback(() => setSessaoExpirada(false), []);
  useEffect(() => {
    if (!casal.erro || !usuario || tentativa >= 5) return;
    const t = setTimeout(() => {
      getIdToken(usuario, true)
        .catch(() => {})
        .finally(() => setTentativa((n) => n + 1));
    }, 500 * (tentativa + 1));
    return () => clearTimeout(t);
  }, [casal.erro, usuario, tentativa]);

  const perfil = useDocumento<Usuario>(usuario && casalId ? caminhos.usuario(usuario.uid) : null, tentativa);

  const valor: ValorSessao = {
    usuario,
    casalId,
    casal: casal.dados,
    papel: perfil.dados?.papel ?? null,
    modo: casal.dados?.modo_app ?? 'indefinido',
    // Com casal mas sem o documento ainda (primeira leitura ou nova tentativa), ainda está carregando.
    carregando: carregandoAuth || casal.carregando || perfil.carregando || (!!casalId && !casal.dados && !(casal.erro && tentativa >= 5)),
    sessaoExpirada,
    limparAvisoSessao,
    recarregarCasal,
  };

  return <ContextoSessao.Provider value={valor}>{children}</ContextoSessao.Provider>;
}

export function useSessao(): ValorSessao {
  const v = useContext(ContextoSessao);
  if (!v) throw new Error('useSessao precisa estar dentro de SessaoProvider');
  return v;
}
