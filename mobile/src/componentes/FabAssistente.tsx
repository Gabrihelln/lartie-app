import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { raios, tamanhos } from '@lartie/tokens';
import { mostrarFabAssistente } from '@lartie/regras';
import { espacos, useTema } from '../tema';
import { useConfiguracaoRemota } from '../servicos/configuracaoRemota';
import { Icone } from './Icone';

// Botão flutuante da assistente (fab, 56), acima da barra, à direita, com shadow-fab.
// Escondido enquanto a IA estiver fora do escopo (P14): a chave ia_ativa vem do Remote Config.
interface Props {
  tela: string;
  onPress: () => void;
}

export function FabAssistente({ tela, onPress }: Props) {
  const { cores, sombra } = useTema();
  const { iaAtiva } = useConfiguracaoRemota();
  if (!mostrarFabAssistente(tela, iaAtiva)) return null;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Falar com a Lu, a assistente"
      style={[estilos.fab, { backgroundColor: cores.primary }, sombra('shadowFab')]}
    >
      <Icone nome="assistente" cor={cores.onPrimary} />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: espacos.space4,
    bottom: espacos.space4,
    width: tamanhos.fab,
    height: tamanhos.fab,
    borderRadius: raios.radiusFull,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
