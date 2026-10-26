import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { raios, tamanhos } from '@lartie/tokens';
import { espacos, useTema } from '../tema';
import { Texto } from './Texto';

// Escolha única em botões lado a lado (T08: Apartamento · Casa; Alugado · Próprio; T09: Sim · Não).
// Selecionado em primary/on-primary; os outros em surface com borda outline-soft.
export interface OpcaoEscolha<T extends string> {
  valor: T;
  rotulo: string;
}

interface Props<T extends string> {
  rotulo: string;
  opcoes: readonly OpcaoEscolha<T>[];
  selecionado: T | null;
  onMudar: (valor: T) => void;
}

export function EscolhaUnica<T extends string>({ rotulo, opcoes, selecionado, onMudar }: Props<T>) {
  const { cores, alvoToque } = useTema();
  return (
    <View style={estilos.grupo}>
      <Texto papel="rotuloCampo">{rotulo}</Texto>
      <View style={estilos.linha} accessibilityRole="radiogroup" accessibilityLabel={rotulo}>
        {opcoes.map((o) => {
          const ativo = o.valor === selecionado;
          return (
            <Pressable
              key={o.valor}
              onPress={() => onMudar(o.valor)}
              accessibilityRole="radio"
              accessibilityState={{ checked: ativo }}
              accessibilityLabel={o.rotulo}
              style={[
                estilos.opcao,
                {
                  minHeight: Math.max(tamanhos.fieldHeight - 4, alvoToque),
                  backgroundColor: ativo ? cores.primary : cores.surface,
                  borderColor: ativo ? cores.primary : cores.outlineSoft,
                },
              ]}
            >
              <Texto papel="nomeItem" style={{ color: ativo ? cores.onPrimary : cores.onSurface }} alinhamento="center">
                {o.rotulo}
              </Texto>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: espacos.space2 },
  linha: { flexDirection: 'row', gap: espacos.space3 },
  opcao: {
    flex: 1,
    borderRadius: raios.radiusLg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espacos.space2,
  },
});
