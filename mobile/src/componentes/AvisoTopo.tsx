import React from 'react';
import { StyleSheet, View } from 'react-native';
import { raios } from '@lartie/tokens';
import { espacos, useTema } from '../tema';
import { Icone } from './Icone';
import { Texto } from './Texto';

// Aviso no topo de um formulário (T44 "E-mail ou senha incorretos…", sessão expirada, bloqueio).
export function AvisoTopo({ texto, tom = 'erro' }: { texto: string; tom?: 'erro' | 'aviso' }) {
  const { cores } = useTema();
  const erro = tom === 'erro';
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={[estilos.caixa, { backgroundColor: erro ? cores.errorContainer : cores.warningContainer }]}
    >
      <Icone nome={erro ? 'erro' : 'aviso'} cor={erro ? cores.error : cores.warning} tamanho={20} />
      <Texto papel="metadado" cor="onSurface" style={estilos.texto}>
        {texto}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espacos.space2,
    padding: espacos.space3,
    borderRadius: raios.radiusMd,
  },
  texto: { flex: 1 },
});
