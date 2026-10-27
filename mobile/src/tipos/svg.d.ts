declare module '*.svg' {
  import type { FC } from 'react';
  import type { SvgProps } from 'react-native-svg';
  const Componente: FC<SvgProps>;
  export default Componente;
}

/** Núcleo do gerador de QR code (sem os renderizadores de PNG do Node). */
declare module 'qrcode/lib/core/qrcode' {
  export function create(texto: string, opcoes?: { errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H' }): {
    modules: { size: number; get(linha: number, coluna: number): boolean | number };
  };
}
