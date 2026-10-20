import { Platform, type TextStyle } from 'react-native';
import { tokens, type EstiloTexto } from '@lartie/tokens';

// Papéis de texto do app e o estilo de cada plataforma (design-system/README.md › Tipografia, tabela
// "Equivalência entre plataformas"). As telas usam o papel, nunca o tamanho.
export type PapelTexto =
  | 'tituloAba'
  | 'tituloTela'
  | 'tituloSecao'
  | 'tituloDestaque'
  | 'numeroDestaque'
  | 'nomeItem'
  | 'corpo'
  | 'metadado'
  | 'ajuda'
  | 'botao'
  | 'rotuloNavegacao'
  | 'selo'
  | 'rotuloCampo';

const ios = tokens.tipografia.ios;
const android = tokens.tipografia.android;

const MAPA: Record<PapelTexto, { ios: EstiloTexto; android: EstiloTexto; peso?: { ios?: string; android?: string } }> = {
  tituloAba: { ios: ios.largeTitle, android: android.headlineMedium },
  tituloTela: { ios: ios.title2, android: android.titleLarge },
  tituloSecao: { ios: ios.title3, android: android.titleSmall },
  tituloDestaque: { ios: ios.title1, android: android.headlineSmall },
  numeroDestaque: { ios: ios.title1, android: android.displaySmall },
  nomeItem: { ios: ios.headline, android: android.titleMedium },
  corpo: { ios: ios.body, android: android.bodyLarge },
  metadado: { ios: ios.subheadline, android: android.bodyMedium },
  ajuda: { ios: ios.footnote, android: android.bodySmall },
  botao: { ios: ios.headline, android: android.labelLarge },
  rotuloNavegacao: { ios: ios.caption2, android: android.labelMedium },
  selo: { ios: ios.caption1, android: android.labelSmall },
  // CampoTexto: rótulo em ios-footnote Semibold / md-body-small Medium.
  rotuloCampo: { ios: ios.footnote, android: android.bodySmall, peso: { ios: '600', android: '500' } },
};

const ehIos = Platform.OS === 'ios';

export function estiloTexto(papel: PapelTexto): TextStyle {
  const m = MAPA[papel];
  const base = ehIos ? m.ios : m.android;
  const peso = (ehIos ? m.peso?.ios : m.peso?.android) ?? base.fontWeight;
  return {
    fontSize: base.fontSize,
    lineHeight: base.lineHeight,
    letterSpacing: base.letterSpacing,
    fontWeight: peso as TextStyle['fontWeight'],
    // Fonte do sistema: SF Pro no iOS e Roboto no Android.
    fontFamily: ehIos ? undefined : 'Roboto',
  };
}

/** Fraunces 500, eixo SOFT 100: só no nome "Lartiê" (logo-wordmark). */
export function estiloMarca(tamanho?: number): TextStyle {
  const w = tokens.tipografia.marca.logoWordmark;
  const escala = tamanho ? tamanho / w.fontSize : 1;
  return {
    fontFamily: 'Fraunces-Soft-Medium',
    fontSize: w.fontSize * escala,
    lineHeight: w.lineHeight * escala,
    letterSpacing: w.letterSpacing * escala,
  };
}

export function estiloSlogan(): TextStyle {
  const t = tokens.tipografia.marca.logoTagline;
  return {
    fontSize: t.fontSize,
    lineHeight: t.lineHeight,
    letterSpacing: t.letterSpacing,
    fontWeight: t.fontWeight as TextStyle['fontWeight'],
  };
}
