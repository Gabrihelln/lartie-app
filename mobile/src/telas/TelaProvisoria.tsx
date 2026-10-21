import React, { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { raios } from '@lartie/tokens';
import { Texto } from '../componentes/Texto';
import { espacos, useTema } from '../tema';

// Tela provisória: ocupa o lugar de uma tela que ainda será construída na etapa indicada.
// Existe para a navegação e as abas por modo funcionarem desde a Etapa 0.
interface Props {
  titulo: string;
  id: string;
  etapa: number;
  children?: ReactNode;
}

export function TelaProvisoria({ titulo, id, etapa, children }: Props) {
  const { cores, margem } = useTema();
  const inset = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ backgroundColor: cores.background }}
      contentContainerStyle={[estilos.conteudo, { paddingTop: inset.top + espacos.space4, paddingHorizontal: margem }]}
    >
      <Texto papel="tituloAba" accessibilityRole="header">
        {titulo}
      </Texto>
      <View style={[estilos.aviso, { backgroundColor: cores.surfaceVariant }]}>
        <Texto papel="metadado" cor="onSurfaceVariant">
          {id} · tela provisória. Será construída na Etapa {etapa}.
        </Texto>
      </View>
      {children}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  conteudo: { gap: espacos.space4, paddingBottom: espacos.space10 },
  aviso: { borderRadius: raios.radiusMd, padding: espacos.space4 },
});
