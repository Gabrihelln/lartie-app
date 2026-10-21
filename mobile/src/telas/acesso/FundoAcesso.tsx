import React, { type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Degrade } from '../../componentes/Degrade';
import { espacos, useTema } from '../../tema';

// Fundo das telas de acesso (T03, T04, T05): gradient-onboarding nos 470 pt do topo, com ou sem os
// anéis, conteúdo rolável que sobe com o teclado e um rodapé fixo para o botão principal.

const ALTURA_DEGRADE = 470;

interface Props {
  aneis?: boolean;
  children: ReactNode;
  rodape?: ReactNode;
}

export function FundoAcesso({ aneis = false, children, rodape }: Props) {
  const { cores, margem } = useTema();
  const inset = useSafeAreaInsets();
  return (
    <View style={[estilos.raiz, { backgroundColor: cores.background }]}>
      <Degrade nome="gradientOnboarding" aneis={aneis} style={estilos.degrade} />
      <KeyboardAvoidingView style={estilos.raiz} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            estilos.conteudo,
            { paddingTop: inset.top + espacos.space2, paddingHorizontal: margem + espacos.space1 },
          ]}
        >
          {children}
        </ScrollView>
        {rodape ? (
          <View
            style={[
              estilos.rodape,
              { paddingHorizontal: margem + espacos.space1, paddingBottom: Math.max(inset.bottom, espacos.space4) + espacos.space2 },
            ]}
          >
            {rodape}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  degrade: { position: 'absolute', top: 0, left: 0, right: 0, height: ALTURA_DEGRADE },
  conteudo: { flexGrow: 1, paddingBottom: espacos.space6, gap: espacos.space4 },
  rodape: { gap: espacos.space3, paddingTop: espacos.space3 },
});
