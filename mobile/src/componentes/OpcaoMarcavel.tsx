import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { raios } from '@lartie/tokens';
import { espacos, useTema } from '../tema';
import { Icone } from './Icone';
import { Texto } from './Texto';

// Cartão de múltipla escolha com caixa de seleção (T09 "Marque o que já têm"). Marcado: borda primary.
interface Props {
  rotulo: string;
  marcada: boolean;
  onMudar: (marcada: boolean) => void;
}

export function OpcaoMarcavel({ rotulo, marcada, onMudar }: Props) {
  const { cores, alvoToque } = useTema();
  return (
    <Pressable
      onPress={() => onMudar(!marcada)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: marcada }}
      accessibilityLabel={rotulo}
      style={[
        estilos.cartao,
        { minHeight: Math.max(64, alvoToque), backgroundColor: cores.surface, borderColor: marcada ? cores.primary : cores.outlineSoft },
      ]}
    >
      <Icone nome={marcada ? 'caixaMarcada' : 'caixaVazia'} cor={marcada ? cores.primary : cores.outline} tamanho={26} />
      <Texto papel="nomeItem" style={estilos.texto}>
        {rotulo}
      </Texto>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.space3,
    borderWidth: 1.5,
    borderRadius: raios.radiusLg,
    paddingHorizontal: espacos.space4,
    paddingVertical: espacos.space2,
  },
  texto: { flex: 1 },
});
