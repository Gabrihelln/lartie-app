import React, { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { raios, type NomeCor } from '@lartie/tokens';
import { Botao } from '../componentes/Botao';
import { Icone, type NomeIcone } from '../componentes/Icone';
import { Texto } from '../componentes/Texto';
import { espacos, useTema } from '../tema';

// Molde comum dos protótipos T47, T57 a T63 e T67: círculo de 96 com ícone, título, texto e
// até dois botões no rodapé (principal + texto).
export interface AcaoEstado {
  rotulo: string;
  onPress: () => void | Promise<unknown>;
}

interface Props {
  icone: NomeIcone;
  fundoIcone: NomeCor;
  corIcone: NomeCor;
  titulo: string;
  texto: string;
  principal?: AcaoEstado;
  secundaria?: AcaoEstado;
  /** Dentro de uma aba (estado vazio de lista), sem ocupar a área segura inferior. */
  embutido?: boolean;
  /** Conteúdo extra abaixo do texto (ex.: avatares do casal no T66). */
  children?: ReactNode;
}

export function TelaEstado({ icone, fundoIcone, corIcone, titulo, texto, principal, secundaria, embutido, children }: Props) {
  const { cores } = useTema();
  const inset = useSafeAreaInsets();
  return (
    <View style={[estilos.raiz, { backgroundColor: cores.background }]}>
      <View style={estilos.centro}>
        <View style={[estilos.circulo, { backgroundColor: cores[fundoIcone] }]}>
          <Icone nome={icone} cor={cores[corIcone]} tamanho={44} />
        </View>
        <Texto papel="tituloTela" peso="700" alinhamento="center" accessibilityRole="header" style={estilos.titulo}>
          {titulo}
        </Texto>
        <Texto papel="corpo" cor="onSurfaceVariant" alinhamento="center" style={estilos.texto}>
          {texto}
        </Texto>
        {children}
      </View>
      {principal || secundaria ? (
        <View style={[estilos.acoes, { paddingBottom: (embutido ? 0 : inset.bottom) + espacos.space10 }]}>
          {principal ? <Botao rotulo={principal.rotulo} onPress={principal.onPress} larguraTotal compacto /> : null}
          {secundaria ? (
            <Botao rotulo={secundaria.rotulo} onPress={secundaria.onPress} variante="texto" larguraTotal compacto />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: espacos.space8 },
  circulo: { width: 96, height: 96, borderRadius: raios.radiusFull, alignItems: 'center', justifyContent: 'center' },
  titulo: { marginTop: espacos.space2 },
  texto: { maxWidth: 300 },
  acoes: { paddingHorizontal: espacos.space6, gap: espacos.space2 },
});
