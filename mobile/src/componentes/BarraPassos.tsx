import React from 'react';
import { StyleSheet, View } from 'react-native';
import { raios } from '@lartie/tokens';
import { espacos, useTema } from '../tema';
import { BotaoVoltar } from './BotaoVoltar';
import { Texto } from './Texto';

// Topo das telas do onboarding (protótipos T06 a T09): voltar, segmentos da barra de progresso
// (ativos em primary, inativos em primary-track) e o contador "n de N".
interface Props {
  atual: number;
  total: number;
  onVoltar?: () => void;
}

export function BarraPassos({ atual, total, onVoltar }: Props) {
  const { cores } = useTema();
  return (
    <View style={estilos.linha}>
      {onVoltar ? <BotaoVoltar onPress={onVoltar} /> : <View style={estilos.semVoltar} />}
      <View
        style={estilos.segmentos}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={`Passo ${atual} de ${total}`}
        accessibilityValue={{ min: 0, max: total, now: atual }}
      >
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[estilos.segmento, { backgroundColor: i < atual ? cores.primary : cores.primaryTrack }]} />
        ))}
      </View>
      <Texto papel="metadado" peso="600" cor="onSurfaceVariant" accessibilityElementsHidden importantForAccessibility="no">
        {atual} de {total}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: espacos.space3 },
  semVoltar: { width: 44 },
  segmentos: { flex: 1, flexDirection: 'row', gap: 6 },
  segmento: { flex: 1, height: 6, borderRadius: raios.radiusFull },
});
