import React, { useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import type { NomeCor } from '@lartie/tokens';
import { espacos, useTema } from '../tema';
import { Texto } from './Texto';

// Linha com os gestos do T13:
// - arrastar para a esquerda mostra as ações rápidas ("Ocultar", "Excluir");
// - segurar (pressão longa) e arrastar na vertical reordena dentro da fase.
// Leitores de tela têm as mesmas ações em accessibilityActions (mover para cima/baixo, ocultar, excluir).

const LARGURA_ACAO = 88;

export interface AcaoRapida {
  rotulo: string;
  fundo: NomeCor;
  texto: NomeCor;
  onPress: () => void;
}

interface Props {
  /** Recebe a função que começa o arraste: ligue no onLongPress do elemento tocável da linha. */
  children: (iniciarArraste: () => void) => ReactNode;
  acoes: AcaoRapida[];
  /** Reordenar: chamado ao soltar, com o deslocamento vertical em pixels. */
  onSoltarArraste?: (dy: number) => void;
  /** Avisa a lista para travar a rolagem enquanto arrasta. */
  onArrastando?: (arrastando: boolean) => void;
  onLayout?: (e: LayoutChangeEvent) => void;
  acoesAcessiveis?: { nome: string; rotulo: string; onAcao: () => void }[];
}

export function LinhaComGestos({ children, acoes, onSoltarArraste, onArrastando, onLayout, acoesAcessiveis = [] }: Props) {
  const { cores, sombra } = useTema();
  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;
  const aberta = useRef(false);
  const arrastando = useRef(false);
  const [elevada, setElevada] = useState(false);
  const larguraAcoes = acoes.length * LARGURA_ACAO;

  const fechar = () => {
    aberta.current = false;
    Animated.spring(x, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
  };

  const pararArraste = (dy: number) => {
    arrastando.current = false;
    setElevada(false);
    onArrastando?.(false);
    Animated.spring(y, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
    onSoltarArraste?.(dy);
  };

  const gestos = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_e, g) => arrastando.current || (Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5),
        onPanResponderTerminationRequest: () => !arrastando.current,
        onPanResponderMove: (_e, g) => {
          if (arrastando.current) {
            y.setValue(g.dy);
            return;
          }
          const base = aberta.current ? -larguraAcoes : 0;
          x.setValue(Math.max(-larguraAcoes, Math.min(0, base + g.dx)));
        },
        onPanResponderRelease: (_e, g) => {
          if (arrastando.current) return pararArraste(g.dy);
          const base = aberta.current ? -larguraAcoes : 0;
          const abrir = base + g.dx < -larguraAcoes / 2;
          aberta.current = abrir;
          Animated.spring(x, { toValue: abrir ? -larguraAcoes : 0, useNativeDriver: true, bounciness: 0 }).start();
        },
        onPanResponderTerminate: (_e, g) => {
          if (arrastando.current) pararArraste(g.dy);
          else fechar();
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [larguraAcoes],
  );

  const iniciarArraste = () => {
    if (!onSoltarArraste) return;
    fechar();
    arrastando.current = true;
    setElevada(true);
    onArrastando?.(true);
  };

  return (
    <View
      onLayout={onLayout}
      style={[estilos.raiz, elevada ? [estilos.elevada, sombra('shadowFab')] : null]}
      accessibilityActions={acoesAcessiveis.map((a) => ({ name: a.nome, label: a.rotulo }))}
      onAccessibilityAction={(e) => acoesAcessiveis.find((a) => a.nome === e.nativeEvent.actionName)?.onAcao()}
    >
      <View style={[StyleSheet.absoluteFill, estilos.acoes]}>
        {acoes.map((a) => (
          <Pressable
            key={a.rotulo}
            onPress={() => {
              fechar();
              a.onPress();
            }}
            accessibilityRole="button"
            style={[estilos.acao, { backgroundColor: cores[a.fundo] }]}
          >
            <Texto papel="metadado" peso="700" cor={a.texto}>
              {a.rotulo}
            </Texto>
          </Pressable>
        ))}
      </View>
      <Animated.View
        {...gestos.panHandlers}
        style={[{ backgroundColor: cores.surface, transform: [{ translateX: x }, { translateY: y }] }]}
      >
        {children(iniciarArraste)}
      </Animated.View>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { overflow: 'hidden' },
  elevada: { zIndex: 10, overflow: 'visible' },
  acoes: { flexDirection: 'row', justifyContent: 'flex-end' },
  acao: { width: LARGURA_ACAO, alignItems: 'center', justifyContent: 'center', paddingHorizontal: espacos.space1 },
});
