import React, { forwardRef, useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { raios, tamanhos } from '@lartie/tokens';
import { espacos, estiloTexto, useTema } from '../tema';
import { Icone } from './Icone';
import { Texto } from './Texto';

// design-system/componentes/CampoTexto + erro por campo (T44 a T46).
interface Props extends Omit<TextInputProps, 'style'> {
  rotulo: string;
  /** Mensagem que diz como corrigir. Com erro: borda error, ícone e mensagem abaixo. */
  erro?: string | null;
  ajuda?: string;
}

export const CampoTexto = forwardRef<TextInput, Props>(function CampoTexto(
  { rotulo, erro, ajuda, onFocus, onBlur, ...props },
  ref,
) {
  const { cores } = useTema();
  const [foco, setFoco] = useState(false);
  const temErro = !!erro;
  const corBorda = temErro ? cores.error : foco ? cores.primary : cores.outline;

  return (
    <View style={estilos.grupo}>
      <Texto papel="rotuloCampo">{rotulo}</Texto>
      <TextInput
        ref={ref}
        {...props}
        accessibilityLabel={rotulo}
        accessibilityHint={erro ?? ajuda}
        onFocus={(e) => {
          setFoco(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFoco(false);
          onBlur?.(e);
        }}
        placeholderTextColor={cores.onSurfaceVariant}
        selectionColor={cores.primary}
        maxFontSizeMultiplier={2}
        style={[
          estiloTexto('corpo'),
          estilos.campo,
          {
            color: cores.onSurface,
            backgroundColor: cores.surface,
            borderColor: corBorda,
            borderWidth: foco || temErro ? 2 : 1.5,
          },
        ]}
      />
      {temErro ? <ErroCampo mensagem={erro} /> : ajuda ? <Texto papel="ajuda" cor="onSurfaceVariant">{ajuda}</Texto> : null}
    </View>
  );
});

/** Mensagem de erro abaixo de um campo (T44 a T46). O estado nunca depende só da cor: tem ícone e texto. */
export function ErroCampo({ mensagem }: { mensagem: string }) {
  const { cores } = useTema();
  return (
    <View style={estilos.erro} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Icone nome="erro" cor={cores.error} tamanho={16} />
      <Texto papel="ajuda" cor="error" style={estilos.textoErro}>
        {mensagem}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: espacos.space1 + 2 },
  campo: {
    minHeight: tamanhos.fieldHeight,
    borderRadius: raios.radiusMd,
    paddingHorizontal: espacos.space4 - 2,
    paddingVertical: espacos.space3,
  },
  erro: { flexDirection: 'row', alignItems: 'center', gap: espacos.space1 },
  textoErro: { flex: 1 },
});
