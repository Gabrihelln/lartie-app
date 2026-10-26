import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { raios, tamanhos } from '@lartie/tokens';
import { espacos, useTema } from '../tema';
import { Texto } from './Texto';

// Contador − / + (T07 convidados; T08 quartos e banheiros). Botões redondos em primary-container.
interface Props {
  rotulo: string;
  valor: number;
  onMudar: (valor: number) => void;
  minimo: number;
  maximo?: number;
  passo?: number;
}

export function Contador({ rotulo, valor, onMudar, minimo, maximo = Number.MAX_SAFE_INTEGER, passo = 1 }: Props) {
  const { cores, alvoToque } = useTema();
  const podeMenos = valor - passo >= minimo;
  const podeMais = valor + passo <= maximo;
  const botao = (sinal: '−' | '+', ativo: boolean, acao: () => void, descricao: string) => (
    <Pressable
      onPress={acao}
      disabled={!ativo}
      accessibilityRole="button"
      accessibilityLabel={descricao}
      accessibilityState={{ disabled: !ativo }}
      style={[estilos.botao, { width: alvoToque, height: alvoToque, backgroundColor: cores.primaryContainer, opacity: ativo ? 1 : 0.38 }]}
    >
      <Texto papel="tituloSecao" cor="primary" peso="600">
        {sinal}
      </Texto>
    </Pressable>
  );
  return (
    <View style={estilos.grupo}>
      <Texto papel="rotuloCampo">{rotulo}</Texto>
      <View
        style={[estilos.caixa, { backgroundColor: cores.surface, borderColor: cores.outlineSoft }]}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={rotulo}
        accessibilityValue={{ text: String(valor) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'increment' && podeMais) onMudar(valor + passo);
          if (e.nativeEvent.actionName === 'decrement' && podeMenos) onMudar(valor - passo);
        }}
      >
        {botao('−', podeMenos, () => onMudar(valor - passo), `Diminuir ${rotulo.toLowerCase()}`)}
        <Texto papel="tituloSecao" peso="700">
          {valor}
        </Texto>
        {botao('+', podeMais, () => onMudar(valor + passo), `Aumentar ${rotulo.toLowerCase()}`)}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: espacos.space1 + 2, flex: 1 },
  caixa: {
    minHeight: tamanhos.fieldHeight,
    borderRadius: raios.radiusMd,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: espacos.space1,
    paddingVertical: espacos.space1,
  },
  botao: { borderRadius: raios.radiusFull, alignItems: 'center', justifyContent: 'center' },
});
