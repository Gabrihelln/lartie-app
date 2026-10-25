import React from 'react';
import { Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTema } from '../tema';
import { Icone } from './Icone';

// Voltar (seta) no topo esquerdo das telas internas (especificação 1.3). No Android, o botão voltar
// do sistema faz o mesmo.
export function BotaoVoltar({ onPress }: { onPress?: () => void }) {
  const { cores, alvoToque, plataforma } = useTema();
  const navigation = useNavigation();
  return (
    <Pressable
      onPress={onPress ?? (() => navigation.goBack())}
      accessibilityRole="button"
      accessibilityLabel="Voltar"
      hitSlop={8}
      style={{ width: alvoToque, height: alvoToque, justifyContent: 'center' }}
    >
      <Icone nome={plataforma === 'ios' ? 'setaEsquerda' : 'voltar'} cor={cores.onSurface} tamanho={28} />
    </Pressable>
  );
}
