import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icone } from '../componentes/Icone';
import { Texto } from '../componentes/Texto';
import { useConexao } from '../servicos/conexao';
import { espacos, useTema } from '../tema';

// Aviso discreto no topo quando a conexão cai (especificação 2.2).
export function AvisoSemConexao() {
  const { online } = useConexao();
  const { cores, margem } = useTema();
  const inset = useSafeAreaInsets();
  if (online) return null;
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        estilos.faixa,
        { paddingTop: inset.top + espacos.space1, paddingHorizontal: margem, backgroundColor: cores.warningContainer },
      ]}
    >
      <Icone nome="semConexao" cor={cores.warning} tamanho={18} />
      <Texto papel="ajuda" cor="onSurface" style={estilos.texto}>
        Sem conexão. Suas alterações serão enviadas depois.
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  faixa: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.space2,
    paddingBottom: espacos.space2,
  },
  texto: { flex: 1 },
});
