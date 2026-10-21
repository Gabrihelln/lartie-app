import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { espacos, useTema } from '../tema';
import { Icone } from './Icone';

// Caixa de seleção com o texto ao lado (ex.: aceite dos termos no T03). A linha inteira é o alvo.
interface Props {
  marcada: boolean;
  onMudar: (marcada: boolean) => void;
  rotuloAcessivel: string;
  children: ReactNode;
}

export function CaixaSelecao({ marcada, onMudar, rotuloAcessivel, children }: Props) {
  const { cores, alvoToque } = useTema();
  return (
    <Pressable
      onPress={() => onMudar(!marcada)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: marcada }}
      accessibilityLabel={rotuloAcessivel}
      style={[estilos.linha, { minHeight: alvoToque }]}
    >
      <Icone nome={marcada ? 'caixaMarcada' : 'caixaVazia'} cor={marcada ? cores.primary : cores.outline} tamanho={26} />
      <View style={estilos.texto}>{children}</View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'flex-start', gap: espacos.space3 },
  texto: { flex: 1, paddingTop: 2 },
});
