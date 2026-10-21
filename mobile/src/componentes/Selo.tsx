import React from 'react';
import { StyleSheet, View } from 'react-native';
import { raios, type NomeCor } from '@lartie/tokens';
import { espacos, useTema } from '../tema';
import { Texto } from './Texto';

// Selos de status ("Atrasada", "Completo", "Recebido"): sempre com texto, nunca só cor.
export type TomSelo = 'success' | 'warning' | 'error' | 'info' | 'primary' | 'home';

const TONS: Record<TomSelo, { fundo: NomeCor; texto: NomeCor }> = {
  success: { fundo: 'successContainer', texto: 'success' },
  warning: { fundo: 'warningContainer', texto: 'warning' },
  error: { fundo: 'errorContainer', texto: 'error' },
  info: { fundo: 'infoContainer', texto: 'info' },
  primary: { fundo: 'primaryContainer', texto: 'onPrimaryContainer' },
  home: { fundo: 'homeContainer', texto: 'onHomeContainer' },
};

export function Selo({ texto, tom }: { texto: string; tom: TomSelo }) {
  const { cores } = useTema();
  const t = TONS[tom];
  return (
    <View style={[estilos.selo, { backgroundColor: cores[t.fundo] }]}>
      <Texto papel="selo" cor={t.texto} peso="600">
        {texto}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  selo: {
    alignSelf: 'flex-start',
    borderRadius: raios.radiusSm,
    paddingHorizontal: espacos.space2,
    paddingVertical: 2,
  },
});
