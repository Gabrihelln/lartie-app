import React, { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Appearance, Platform, useColorScheme, type ViewStyle } from 'react-native';
import {
  alvoToque,
  coresDoTema,
  margemLateral,
  sombraDoTema,
  type Cores,
  type NomeSombra,
  type Plataforma,
  type Tema,
} from '@lartie/tokens';
import { armazenamento } from '../servicos/armazenamento';

/** Perfil › Aparência: seguir o celular (padrão, 2.4) ou fixar claro/escuro. Fica neste aparelho. */
export type Aparencia = 'sistema' | 'claro' | 'escuro';
const CHAVE_APARENCIA = 'tema.aparencia';

function aparenciaSalva(): Aparencia {
  const v = armazenamento.getString(CHAVE_APARENCIA);
  return v === 'claro' || v === 'escuro' ? v : 'sistema';
}

/** O sistema também troca: teclado, seletores de data, alertas e barra de status nativos. */
function aplicarNoSistema(a: Aparencia) {
  Appearance.setColorScheme(a === 'sistema' ? 'unspecified' : a === 'escuro' ? 'dark' : 'light');
}
aplicarNoSistema(aparenciaSalva());

interface ValorTema {
  tema: Tema;
  cores: Cores;
  plataforma: Plataforma;
  margem: number;
  alvoToque: number;
  /** Sombra do token (boxShadow). No tema escuro, cartões não têm sombra. */
  sombra: (nome: NomeSombra) => ViewStyle;
  /** Só no catálogo de desenvolvimento: força claro ou escuro para conferir as telas. */
  forcarTema: (tema: Tema | null) => void;
  temaForcado: Tema | null;
  aparencia: Aparencia;
  mudarAparencia: (aparencia: Aparencia) => void;
}

const ContextoTema = createContext<ValorTema | null>(null);

export function TemaProvider({ children }: { children: ReactNode }) {
  const esquema = useColorScheme();
  const [temaForcado, forcarTema] = useState<Tema | null>(null);
  const [aparencia, setAparencia] = useState<Aparencia>(aparenciaSalva);
  const mudarAparencia = useCallback((a: Aparencia) => {
    armazenamento.set(CHAVE_APARENCIA, a);
    aplicarNoSistema(a);
    setAparencia(a);
  }, []);
  const doSistema: Tema = esquema === 'dark' ? 'escuro' : 'claro';
  const tema: Tema = temaForcado ?? (aparencia === 'sistema' ? doSistema : aparencia);
  const plataforma: Plataforma = Platform.OS === 'ios' ? 'ios' : 'android';

  const valor = useMemo<ValorTema>(
    () => ({
      tema,
      cores: coresDoTema(tema),
      plataforma,
      margem: margemLateral(plataforma),
      alvoToque: alvoToque(plataforma),
      sombra: (nome) => {
        const css = sombraDoTema(tema, nome);
        return css ? { boxShadow: css } : {};
      },
      forcarTema,
      temaForcado,
      aparencia,
      mudarAparencia,
    }),
    [tema, plataforma, temaForcado, aparencia, mudarAparencia],
  );

  return <ContextoTema.Provider value={valor}>{children}</ContextoTema.Provider>;
}

export function useTema(): ValorTema {
  const v = useContext(ContextoTema);
  if (!v) throw new Error('useTema precisa estar dentro de TemaProvider');
  return v;
}
