import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { raios } from '@lartie/tokens';
import { espacos, useTema } from '../tema';
import { Texto } from './Texto';

// Controle segmentado (seletor interno de Casamento: Checklist · Orçamento · Fornecedores · Convidados).
// Medidas do protótipo T13: trilho surface-variant com 4 de respiro, segmentos de 40 de altura;
// o segmento ativo em surface. Raios do protótipo (14 e 10) derivados de radius-md e radius-sm.
export interface Segmento<T extends string> {
  valor: T;
  rotulo: string;
  /** Rótulo completo para leitores de tela quando o visível é abreviado ("Fornec."). */
  rotuloAcessivel?: string;
}

interface Props<T extends string> {
  segmentos: readonly Segmento<T>[];
  selecionado: T;
  onMudar: (valor: T) => void;
  rotulo: string;
}

export function ControleSegmentado<T extends string>({ segmentos, selecionado, onMudar, rotulo }: Props<T>) {
  const { cores } = useTema();
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={rotulo}
      style={[estilos.trilho, { backgroundColor: cores.surfaceVariant }]}
    >
      {segmentos.map((s) => {
        const ativo = s.valor === selecionado;
        return (
          <Pressable
            key={s.valor}
            onPress={() => onMudar(s.valor)}
            accessibilityRole="tab"
            accessibilityState={{ selected: ativo }}
            accessibilityLabel={s.rotuloAcessivel ?? s.rotulo}
            style={[estilos.segmento, ativo ? { backgroundColor: cores.surface } : null]}
          >
            <Texto papel="ajuda" peso={ativo ? '700' : '600'} cor={ativo ? 'onSurface' : 'onSurfaceVariant'} numberOfLines={1}>
              {s.rotulo}
            </Texto>
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  trilho: {
    flexDirection: 'row',
    gap: espacos.space1,
    padding: espacos.space1,
    borderRadius: raios.radiusMd + 2,
  },
  segmento: {
    flex: 1,
    minHeight: 40,
    borderRadius: raios.radiusSm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espacos.space1,
  },
});
