import React, { type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { raios } from '@lartie/tokens';
import { espacos, useTema } from '../tema';
import { Texto } from './Texto';

// Folha inferior (ex.: T65 Compartilhar, "Nova lista", "Ativar {módulo}?"). Fundo background,
// raio radius-xl no topo, alça de 40 × 5, véu scrim. Tocar fora ou voltar fecha.
interface Props {
  visivel: boolean;
  titulo?: string;
  onFechar: () => void;
  children: ReactNode;
}

export function FolhaInferior({ visivel, titulo, onFechar, children }: Props) {
  const { cores, margem, sombra } = useTema();
  const inset = useSafeAreaInsets();
  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={onFechar} statusBarTranslucent>
      <KeyboardAvoidingView style={estilos.raiz} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: cores.scrim }]}
          onPress={onFechar}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
        />
        <View
          accessibilityViewIsModal
          style={[
            estilos.folha,
            {
              backgroundColor: cores.background,
              paddingHorizontal: margem,
              paddingBottom: Math.max(inset.bottom, espacos.space6) + espacos.space2,
            },
            sombra('shadowFab'),
          ]}
        >
          <View style={[estilos.alca, { backgroundColor: cores.outlineSoft }]} />
          {titulo ? (
            <Texto papel="tituloSecao" peso="700" accessibilityRole="header">
              {titulo}
            </Texto>
          ) : null}
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, justifyContent: 'flex-end' },
  folha: {
    borderTopLeftRadius: raios.radiusXl,
    borderTopRightRadius: raios.radiusXl,
    paddingTop: espacos.space3,
    gap: 14,
  },
  alca: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center' },
});
