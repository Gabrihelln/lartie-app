import React from 'react';
import { Text, type TextProps } from 'react-native';
import type { NomeCor } from '@lartie/tokens';
import { estiloTexto, useTema, type PapelTexto } from '../tema';

interface Props extends TextProps {
  papel?: PapelTexto;
  cor?: NomeCor;
  /** Peso opcional quando o protótipo destaca um trecho (ex.: "Ana & Pedro" em negrito). */
  peso?: '400' | '500' | '600' | '700';
  alinhamento?: 'left' | 'center' | 'right';
}

/** Texto do app: sempre um papel tipográfico e uma cor do tema. Respeita o tamanho de fonte do sistema. */
export function Texto({ papel = 'corpo', cor = 'onSurface', peso, alinhamento, style, ...props }: Props) {
  const { cores } = useTema();
  return (
    <Text
      {...props}
      maxFontSizeMultiplier={2}
      style={[
        estiloTexto(papel),
        { color: cores[cor] },
        peso ? { fontWeight: peso } : null,
        alinhamento ? { textAlign: alinhamento } : null,
        style,
      ]}
    />
  );
}
