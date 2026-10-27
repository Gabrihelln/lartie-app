import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { raios } from '@lartie/tokens';
import { TelaPilha } from '../componentes/Estrutura';
import { Icone } from '../componentes/Icone';
import { Texto } from '../componentes/Texto';
import type { ParamsRaiz } from '../navegacao/tipos';
import { espacos, useTema } from '../tema';
import { Orcamento } from './casamento/Orcamento';

/** Telas de etapas futuras abertas por atalhos da Etapa 3 (T19 a T22, T31, T32…). */
export function ProvisoriaPilha() {
  const { cores } = useTema();
  const { params } = useRoute<RouteProp<ParamsRaiz, 'Provisoria'>>();
  return (
    <TelaPilha titulo={params.titulo}>
      <View style={[estilos.aviso, { backgroundColor: cores.surfaceVariant }]}>
        <Texto papel="metadado" cor="onSurfaceVariant">
          {params.id} · tela provisória. Será construída na Etapa {params.etapa}.
        </Texto>
      </View>
    </TelaPilha>
  );
}

/** T15 no modo "casa": só as categorias da casa, aberto pela Casa (13.9). */
export function OrcamentoCasa() {
  const { cores, alvoToque } = useTema();
  const [novoGasto, setNovoGasto] = useState(false);
  return (
    <TelaPilha
      titulo="Orçamento da casa"
      direita={
        <Pressable onPress={() => setNovoGasto(true)} accessibilityRole="button" accessibilityLabel="Novo gasto" style={{ minHeight: alvoToque, justifyContent: 'center' }}>
          <Icone nome="adicionar" cor={cores.primary} />
        </Pressable>
      }
    >
      <Orcamento escopoFixo="casa" novoGasto={novoGasto} onFecharNovoGasto={() => setNovoGasto(false)} />
    </TelaPilha>
  );
}

const estilos = StyleSheet.create({
  aviso: { padding: espacos.space4, borderRadius: raios.radiusMd },
});
