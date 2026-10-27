import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { raios, tamanhos } from '@lartie/tokens';
import { espacos, useTema } from '../tema';
import { ErroCampo } from './CampoTexto';
import { FolhaInferior } from './FolhaInferior';
import { Icone } from './Icone';
import { Texto } from './Texto';

// Campo de seleção (T14 "Fase", T17 "Categoria", folha "Novo gasto"): parece um campo e abre uma
// folha com as opções. Mesma altura dos campos de texto (field-height).

export interface OpcaoSelecao<T extends string> {
  valor: T;
  rotulo: string;
}

interface Props<T extends string> {
  rotulo: string;
  opcoes: readonly OpcaoSelecao<T>[];
  valor: T | null;
  onMudar: (valor: T) => void;
  placeholder?: string;
  erro?: string | null;
}

export function CampoSelecao<T extends string>({ rotulo, opcoes, valor, onMudar, placeholder = 'Escolher', erro }: Props<T>) {
  const { cores, alvoToque } = useTema();
  const [aberto, setAberto] = useState(false);
  const atual = opcoes.find((o) => o.valor === valor);
  return (
    <View style={estilos.grupo}>
      <Texto papel="rotuloCampo">{rotulo}</Texto>
      <Pressable
        onPress={() => setAberto(true)}
        accessibilityRole="button"
        accessibilityLabel={`${rotulo}: ${atual?.rotulo ?? placeholder}`}
        style={[
          estilos.caixa,
          { backgroundColor: cores.surface, borderColor: erro ? cores.error : cores.outlineSoft, minHeight: Math.max(alvoToque, tamanhos.fieldHeight) },
        ]}
      >
        <Texto papel="corpo" cor={atual ? 'onSurface' : 'onSurfaceVariant'} style={estilos.flex} numberOfLines={1}>
          {atual?.rotulo ?? placeholder}
        </Texto>
        <Icone nome="setaBaixo" cor={cores.onSurfaceVariant} />
      </Pressable>
      {erro ? <ErroCampo mensagem={erro} /> : null}
      <FolhaInferior visivel={aberto} titulo={rotulo} onFechar={() => setAberto(false)}>
        {opcoes.map((o) => (
          <Pressable
            key={o.valor}
            onPress={() => {
              onMudar(o.valor);
              setAberto(false);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: o.valor === valor }}
            style={[estilos.opcao, { minHeight: alvoToque + espacos.space2, borderColor: cores.divider }]}
          >
            <Texto papel="corpo" peso={o.valor === valor ? '700' : '400'} style={estilos.flex}>
              {o.rotulo}
            </Texto>
            {o.valor === valor ? <Icone nome="check" cor={cores.primary} /> : null}
          </Pressable>
        ))}
      </FolhaInferior>
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: espacos.space1 + 2 },
  caixa: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: raios.radiusMd, paddingHorizontal: espacos.space4, gap: espacos.space2 },
  flex: { flex: 1 },
  opcao: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
});
