import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { raios } from '@lartie/tokens';
import { useTema } from '../tema';
import { Texto } from './Texto';

// Avatar do casal (T12): dois círculos de 40 sobrepostos em 10, borda de 2 na cor do fundo.
// Primeiro em primary/on-primary; segundo em home-container/on-home-container.
interface Pessoa {
  nome: string;
  foto?: string | null;
}

interface Props {
  pessoa1: Pessoa;
  pessoa2?: Pessoa | null;
  tamanho?: number;
}

const inicial = (nome: string) => nome.trim().charAt(0).toLocaleUpperCase('pt-BR') || '?';

export function AvatarDuplo({ pessoa1, pessoa2, tamanho = 40 }: Props) {
  const { cores } = useTema();
  const rotulo = pessoa2 ? `${pessoa1.nome} e ${pessoa2.nome}` : pessoa1.nome;
  const circulo = { width: tamanho, height: tamanho, borderRadius: raios.radiusFull, borderColor: cores.background };

  const desenhar = (p: Pessoa, fundo: string, texto: 'onPrimary' | 'onHomeContainer', deslocado: boolean) => (
    <View style={[estilos.circulo, circulo, { backgroundColor: fundo }, deslocado ? { marginLeft: -tamanho / 4 } : null]}>
      {p.foto ? (
        <Image source={{ uri: p.foto }} style={{ width: tamanho - 4, height: tamanho - 4, borderRadius: raios.radiusFull }} />
      ) : (
        <Texto papel="corpo" peso="600" cor={texto}>
          {inicial(p.nome)}
        </Texto>
      )}
    </View>
  );

  return (
    <View style={estilos.linha} accessible accessibilityRole="image" accessibilityLabel={rotulo}>
      {desenhar(pessoa1, cores.primary, 'onPrimary', false)}
      {pessoa2 ? desenhar(pessoa2, cores.homeContainer, 'onHomeContainer', true) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row' },
  circulo: { borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
