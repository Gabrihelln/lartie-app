import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View, type DimensionValue } from 'react-native';
import { raios } from '@lartie/tokens';
import { espacos, useTema } from '../tema';

// Esqueleto da primeira carga (T64): blocos em divider, raio radius-md, pulsando de leve.
// Respeita "Reduzir movimento": sem animação.

export function BlocoEsqueleto({ altura, largura = '100%', redondo = false }: { altura: number; largura?: DimensionValue; redondo?: boolean }) {
  const { cores } = useTema();
  const opacidade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let animacao: Animated.CompositeAnimation | null = null;
    let ativo = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reduzir) => {
      if (reduzir || !ativo) return;
      animacao = Animated.loop(
        Animated.sequence([
          Animated.timing(opacidade, { toValue: 0.55, duration: 700, useNativeDriver: true }),
          Animated.timing(opacidade, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]),
      );
      animacao.start();
    });
    return () => {
      ativo = false;
      animacao?.stop();
    };
  }, [opacidade]);

  return (
    <Animated.View
      style={{
        height: altura,
        width: redondo ? altura : largura,
        borderRadius: redondo ? raios.radiusFull : raios.radiusMd,
        backgroundColor: cores.divider,
        opacity: opacidade,
      }}
    />
  );
}

/** Esqueleto padrão de uma tela principal (layout do protótipo T64). */
export function Esqueleto() {
  const { margem } = useTema();
  return (
    <View
      style={[estilos.raiz, { paddingHorizontal: margem }]}
      accessible
      accessibilityLabel="Carregando"
      accessibilityState={{ busy: true }}
    >
      <View style={estilos.linha}>
        <BlocoEsqueleto altura={44} redondo />
        <BlocoEsqueleto altura={18} largura="50%" />
      </View>
      <BlocoEsqueleto altura={124} />
      <View style={estilos.linha}>
        <View style={estilos.metade}>
          <BlocoEsqueleto altura={110} />
        </View>
        <View style={estilos.metade}>
          <BlocoEsqueleto altura={110} />
        </View>
      </View>
      <BlocoEsqueleto altura={20} largura="40%" />
      <BlocoEsqueleto altura={64} />
      <BlocoEsqueleto altura={64} />
      <BlocoEsqueleto altura={64} />
    </View>
  );
}

/** Esqueleto de lista: n linhas de 64. */
export function EsqueletoLista({ linhas = 5 }: { linhas?: number }) {
  return (
    <View style={estilos.lista} accessible accessibilityLabel="Carregando" accessibilityState={{ busy: true }}>
      {Array.from({ length: linhas }, (_, i) => (
        <BlocoEsqueleto key={i} altura={64} />
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { paddingVertical: espacos.space6, gap: 14 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espacos.space3 },
  metade: { flex: 1 },
  lista: { gap: espacos.space3 },
});
