import React, { useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { degrades, type NomeDegrade } from '@lartie/tokens';
import { useTema } from '../tema';

// Os três degradês da marca (design-system/componentes/Degrades), desenhados com os mesmos
// ângulos e paradas do CSS do guia. Só em: ícone, splash e topo das telas de boas-vindas/onboarding.

interface Props {
  nome: NomeDegrade;
  style?: StyleProp<ViewStyle>;
  /** gradient-onboarding: os dois anéis brancos decorativos (35% e 25%) no canto superior direito. */
  aneis?: boolean;
  children?: ReactNode;
}

/** Converte o ângulo do CSS (0deg = para cima, sentido horário) nas pontas da linha do degradê. */
function pontas(angulo: number, w: number, h: number) {
  const rad = (angulo * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  const meio = (Math.abs(w * dx) + Math.abs(h * dy)) / 2;
  return { x1: w / 2 - dx * meio, y1: h / 2 - dy * meio, x2: w / 2 + dx * meio, y2: h / 2 + dy * meio };
}

export function Degrade({ nome, style, aneis = false, children }: Props) {
  const { cores } = useTema();
  const [tamanho, setTamanho] = useState({ w: 0, h: 0 });
  const d = degrades[nome];
  const { w, h } = tamanho;

  const medir = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== w || height !== h) setTamanho({ w: width, h: height });
  };

  const p = pontas(d.angulo, w, h);
  const brilho = d.brilho;
  // radial-gradient(circle at X Y): o raio vai até o canto mais distante do centro.
  const cx = brilho ? brilho.centroX * w : 0;
  const cy = brilho ? brilho.centroY * h : 0;
  const raioBrilho = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy));

  return (
    <View style={[estilos.raiz, style]} onLayout={medir}>
      {w > 0 && h > 0 ? (
        <Svg width={w} height={h} style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Defs>
            <LinearGradient id="linear" gradientUnits="userSpaceOnUse" x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2}>
              {d.paradas.map((parada) => (
                <Stop key={parada.cor} offset={parada.posicao} stopColor={cores[parada.cor]} />
              ))}
            </LinearGradient>
            {brilho ? (
              <RadialGradient id="brilho" gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={raioBrilho} fx={cx} fy={cy}>
                <Stop offset={0} stopColor={brilho.corInicio} />
                <Stop offset={brilho.raio} stopColor={brilho.corFim} />
              </RadialGradient>
            ) : null}
          </Defs>
          <Rect x={0} y={0} width={w} height={h} fill="url(#linear)" />
          {brilho ? <Rect x={0} y={0} width={w} height={h} fill="url(#brilho)" /> : null}
          {aneis ? <Aneis largura={w} cor={cores.surface} /> : null}
        </Svg>
      ) : null}
      {children}
    </View>
  );
}

/** Anéis do protótipo de boas-vindas: SVG de 420 posicionado a -150 da direita e -120 do topo. */
function Aneis({ largura, cor }: { largura: number; cor: string }) {
  const x = largura + 150 - 420;
  const y = -120;
  return (
    <>
      <Circle cx={x + 170} cy={y + 210} r={140} stroke={cor} strokeOpacity={0.35} strokeWidth={18} fill="none" />
      <Circle cx={x + 250} cy={y + 210} r={140} stroke={cor} strokeOpacity={0.25} strokeWidth={18} fill="none" />
    </>
  );
}

const estilos = StyleSheet.create({
  raiz: { overflow: 'hidden' },
});
