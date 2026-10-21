import React, { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { raios, tamanhos } from '@lartie/tokens';
import { espacos, estiloTexto, useTema } from '../tema';
import { Icone } from './Icone';
import { Texto } from './Texto';

// design-system/componentes/CampoTexto + erro por campo (T44 a T46).
interface Props extends Omit<TextInputProps, 'style' | 'secureTextEntry'> {
  rotulo: string;
  /** Mensagem que diz como corrigir. Com erro: borda error, ícone e mensagem abaixo. */
  erro?: string | null;
  ajuda?: string;
  /** Campo de senha, com o botão de mostrar/ocultar (T03). */
  senha?: boolean;
}

export const CampoTexto = forwardRef<TextInput, Props>(function CampoTexto(
  { rotulo, erro, ajuda, senha = false, onFocus, onBlur, ...props },
  ref,
) {
  const { cores, alvoToque } = useTema();
  const [foco, setFoco] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const temErro = !!erro;
  const corBorda = temErro ? cores.error : foco ? cores.primary : cores.outlineSoft;

  return (
    <View style={estilos.grupo}>
      <Texto papel="rotuloCampo">{rotulo}</Texto>
      <View
        style={[
          estilos.caixa,
          { backgroundColor: cores.surface, borderColor: corBorda, borderWidth: foco || temErro ? 2 : 1.5 },
        ]}
      >
        <TextInput
          ref={ref}
          {...props}
          secureTextEntry={senha && !mostrarSenha}
          autoCorrect={senha ? false : props.autoCorrect}
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
          style={[estiloTexto('corpo'), estilos.campo, { color: cores.onSurface }]}
        />
        {senha ? (
          <Pressable
            onPress={() => setMostrarSenha((m) => !m)}
            accessibilityRole="button"
            accessibilityLabel={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
            style={[estilos.olho, { minWidth: alvoToque, minHeight: alvoToque }]}
          >
            <Icone nome={mostrarSenha ? 'ocultar' : 'mostrar'} cor={cores.onSurfaceVariant} tamanho={22} />
          </Pressable>
        ) : null}
      </View>
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
  caixa: {
    minHeight: tamanhos.fieldHeight,
    borderRadius: raios.radiusMd,
    flexDirection: 'row',
    alignItems: 'center',
  },
  campo: {
    flex: 1,
    minHeight: tamanhos.fieldHeight - 4,
    paddingHorizontal: espacos.space4 - 2,
    paddingVertical: espacos.space3,
  },
  olho: { alignItems: 'center', justifyContent: 'center', marginRight: espacos.space1 },
  erro: { flexDirection: 'row', alignItems: 'center', gap: espacos.space1 },
  textoErro: { flex: 1 },
});
