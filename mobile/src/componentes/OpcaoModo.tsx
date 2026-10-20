import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { raios, type NomeCor } from '@lartie/tokens';
import { espacos, useTema } from '../tema';
import { Icone, type NomeIcone } from './Icone';
import { Texto } from './Texto';

// design-system/componentes/OpcaoModo: cartão de escolha única (T06b e T33b).
// O grupo que contém as opções deve ter accessibilityRole="radiogroup" e o rótulo "Modo do app".
interface Props {
  titulo: string;
  descricao: string;
  icone: NomeIcone;
  /** Fundo do círculo do ícone: área do casamento ou da casa. */
  fundoIcone: NomeCor;
  corIcone: NomeCor;
  selecionado: boolean;
  onPress: () => void;
  selo?: string;
  compacto?: boolean;
}

export function OpcaoModo({ titulo, descricao, icone, fundoIcone, corIcone, selecionado, onPress, selo, compacto }: Props) {
  const { cores, sombra } = useTema();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selecionado }}
      accessibilityLabel={`${titulo}. ${descricao}`}
      style={[
        estilos.cartao,
        compacto ? estilos.compacto : estilos.normal,
        { backgroundColor: cores.surface, borderColor: selecionado ? cores.primary : cores.outlineVariant },
        selecionado ? sombra('shadowCard') : null,
      ]}
    >
      <View style={[estilos.circulo, { backgroundColor: cores[fundoIcone] }]}>
        <Icone nome={icone} cor={cores[corIcone]} />
      </View>
      <View style={estilos.textos}>
        <View style={estilos.linhaTitulo}>
          <Texto papel="nomeItem" style={estilos.titulo}>
            {titulo}
          </Texto>
          {selo ? (
            <View style={[estilos.selo, { backgroundColor: cores.primaryContainer }]}>
              <Texto papel="selo" peso="600" cor="onPrimaryContainer">
                {selo}
              </Texto>
            </View>
          ) : null}
        </View>
        <Texto papel="ajuda" cor="onSurfaceVariant">
          {descricao}
        </Texto>
      </View>
      <View style={[estilos.radio, { borderColor: selecionado ? cores.primary : cores.outline }]}>
        {selecionado ? (
          <View style={[estilos.radioCheio, { backgroundColor: cores.primary }]}>
            <View style={[estilos.radioPonto, { backgroundColor: cores.onPrimary }]} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.space3,
    borderWidth: 2,
    borderRadius: raios.radiusLg + 2,
  },
  normal: { paddingVertical: 14, paddingHorizontal: espacos.space4 },
  compacto: { paddingVertical: espacos.space3, paddingHorizontal: 14 },
  circulo: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  textos: { flex: 1, gap: 2 },
  linhaTitulo: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: espacos.space2 },
  titulo: { flexShrink: 1 },
  selo: { borderRadius: raios.radiusFull, paddingHorizontal: espacos.space2, paddingVertical: 2 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioCheio: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  radioPonto: { width: 8, height: 8, borderRadius: 4 },
});
