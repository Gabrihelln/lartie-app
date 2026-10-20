import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { raios } from '@lartie/tokens';
import { espacos, useTema } from '../tema';
import { Icone } from './Icone';
import { Texto } from './Texto';

// design-system/componentes/Chip: altura 40, alvo de toque 44/48 garantido pelo hitSlop.
interface Props {
  rotulo: string;
  selecionado: boolean;
  onPress: () => void;
}

const ALTURA = 40;

export function Chip({ rotulo, selecionado, onPress }: Props) {
  const { cores, plataforma, alvoToque } = useTema();
  const corTexto = selecionado ? cores.onPrimary : cores.onSurface;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: selecionado }}
      accessibilityLabel={rotulo}
      hitSlop={(alvoToque - ALTURA) / 2}
      style={[
        estilos.chip,
        {
          backgroundColor: selecionado ? cores.primary : cores.surface,
          borderColor: selecionado ? cores.primary : cores.outlineVariant,
        },
      ]}
    >
      {selecionado && plataforma === 'android' ? <Icone nome="check" cor={corTexto} tamanho={18} /> : null}
      <Texto
        papel={plataforma === 'ios' ? 'metadado' : 'botao'}
        peso={plataforma === 'ios' ? '600' : undefined}
        style={{ color: corTexto }}
      >
        {rotulo}
      </Texto>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  chip: {
    minHeight: ALTURA,
    borderRadius: raios.radiusFull,
    paddingHorizontal: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.space1 + 2,
  },
});
