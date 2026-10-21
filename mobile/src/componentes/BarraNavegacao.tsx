import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { raios, tamanhos } from '@lartie/tokens';
import { ROTULOS_ABAS, type Aba } from '@lartie/regras';
import { espacos, useTema } from '../tema';
import { Icone, type NomeIcone } from './Icone';
import { Texto } from './Texto';

// design-system/componentes/BarraNavegacao. As abas visíveis vêm do modo do app (packages/regras).
// iOS: tab bar de 49 pt + área segura, aba ativa em primary com ícone preenchido.
// Android: barra do Material 3 de 80 dp, aba ativa com indicador em pílula (64 × 32) em primary-container.

const ICONE_ABA: Record<Aba, NomeIcone> = {
  inicio: 'inicio',
  casamento: 'casamento',
  convidados: 'convidados',
  casa: 'casa',
  presentes: 'presentes',
  perfil: 'perfil',
};

interface PropsBarra {
  abas: readonly Aba[];
  ativa: Aba;
  onTocar: (aba: Aba) => void;
  /** No catálogo, a barra aparece solta, sem a área segura. */
  semAreaSegura?: boolean;
}

export function BarraAbas({ abas, ativa, onTocar, semAreaSegura }: PropsBarra) {
  const { cores, plataforma } = useTema();
  const inset = useSafeAreaInsets();
  const ios = plataforma === 'ios';
  const altura = ios ? tamanhos.tabbarIos : tamanhos.navbarAndroid;
  const baixo = semAreaSegura ? 0 : inset.bottom;

  return (
    <View
      accessibilityRole="tablist"
      style={[
        estilos.barra,
        {
          height: altura + baixo,
          paddingBottom: baixo,
          backgroundColor: cores.surface,
          borderTopColor: cores.outlineVariant,
        },
      ]}
    >
      {abas.map((aba) => {
        const selecionada = aba === ativa;
        const rotulo = ROTULOS_ABAS[aba];
        const corIcone = selecionada ? (ios ? cores.primary : cores.onPrimaryContainer) : cores.onSurfaceVariant;
        const corRotulo = selecionada ? (ios ? cores.primary : cores.onSurface) : cores.onSurfaceVariant;
        return (
          <Pressable
            key={aba}
            onPress={() => onTocar(aba)}
            accessibilityRole="tab"
            accessibilityState={{ selected: selecionada }}
            accessibilityLabel={rotulo}
            style={[estilos.aba, ios ? estilos.abaIos : estilos.abaAndroid]}
          >
            <View style={[ios ? null : estilos.pilula, !ios && selecionada ? { backgroundColor: cores.primaryContainer } : null]}>
              <Icone nome={ICONE_ABA[aba]} cor={corIcone} cheio={selecionada} />
            </View>
            <Texto papel="rotuloNavegacao" numberOfLines={1} peso={!ios && selecionada ? '700' : undefined} style={{ color: corRotulo }}>
              {rotulo}
            </Texto>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Adaptador para o React Navigation (tabBar do Bottom Tabs). */
export function BarraNavegacao({ state, navigation }: BottomTabBarProps) {
  const abas = state.routes.map((r) => r.name as Aba);
  const ativa = abas[state.index] ?? 'inicio';
  return (
    <BarraAbas
      abas={abas}
      ativa={ativa}
      onTocar={(aba) => {
        const rota = state.routes.find((r) => r.name === aba);
        if (!rota) return;
        const evento = navigation.emit({ type: 'tabPress', target: rota.key, canPreventDefault: true });
        if (aba !== ativa && !evento.defaultPrevented) navigation.navigate(rota.name);
      }}
    />
  );
}

const estilos = StyleSheet.create({
  barra: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth },
  aba: { flex: 1, alignItems: 'center' },
  abaIos: { justifyContent: 'center', gap: 2, paddingTop: espacos.space1 },
  abaAndroid: { justifyContent: 'center', gap: espacos.space1 },
  pilula: {
    width: 64,
    height: 32,
    borderRadius: raios.radiusFull,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
