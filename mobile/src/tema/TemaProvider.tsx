import React, { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { Platform, useColorScheme, type ViewStyle } from 'react-native';
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
}

const ContextoTema = createContext<ValorTema | null>(null);

export function TemaProvider({ children }: { children: ReactNode }) {
  const esquema = useColorScheme();
  const [temaForcado, forcarTema] = useState<Tema | null>(null);
  const tema: Tema = temaForcado ?? (esquema === 'dark' ? 'escuro' : 'claro');
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
    }),
    [tema, plataforma, temaForcado],
  );

  return <ContextoTema.Provider value={valor}>{children}</ContextoTema.Provider>;
}

export function useTema(): ValorTema {
  const v = useContext(ContextoTema);
  if (!v) throw new Error('useTema precisa estar dentro de TemaProvider');
  return v;
}
