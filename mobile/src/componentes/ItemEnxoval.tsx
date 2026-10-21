import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { raios, type NomeCor } from '@lartie/tokens';
import type { EstadoItem } from '@lartie/modelo';
import { espacos, useTema } from '../tema';
import { Texto } from './Texto';

// design-system/componentes/ItemEnxoval. Tocar no nome abre o detalhe; tocar no estado alterna para o próximo.
const ESTADOS: Record<EstadoItem, { rotulo: string; fundo: NomeCor; texto: NomeCor }> = {
  falta: { rotulo: 'Falta', fundo: 'errorContainer', texto: 'error' },
  ja_tenho: { rotulo: 'Já tenho', fundo: 'home', texto: 'onPrimary' },
  na_lista: { rotulo: 'Na lista', fundo: 'infoContainer', texto: 'info' },
};

const PROXIMO: Record<EstadoItem, EstadoItem> = { falta: 'ja_tenho', ja_tenho: 'na_lista', na_lista: 'falta' };

interface Props {
  nome: string;
  detalhes: string;
  estado: EstadoItem;
  onAbrir: () => void;
  onMudarEstado: (novo: EstadoItem) => void;
}

export function ItemEnxoval({ nome, detalhes, estado, onAbrir, onMudarEstado }: Props) {
  const { cores, alvoToque } = useTema();
  const e = ESTADOS[estado];
  return (
    <View style={[estilos.linha, { backgroundColor: cores.surface, borderColor: cores.outlineVariant }]}>
      <Pressable style={estilos.textos} onPress={onAbrir} accessibilityRole="button" accessibilityHint="Abre o item">
        <Texto papel="nomeItem">{nome}</Texto>
        <Texto papel="metadado" cor="onSurfaceVariant">
          {detalhes}
        </Texto>
      </Pressable>
      <Pressable
        onPress={() => onMudarEstado(PROXIMO[estado])}
        accessibilityRole="button"
        accessibilityLabel={`${nome}: ${e.rotulo}`}
        accessibilityHint={`Toque para mudar para ${ESTADOS[PROXIMO[estado]].rotulo}`}
        style={[estilos.estado, { backgroundColor: cores[e.fundo], minHeight: alvoToque }]}
      >
        <Texto papel="metadado" peso="600" cor={e.texto}>
          {e.rotulo}
        </Texto>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: {
    minHeight: 64,
    borderRadius: raios.radiusLg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: espacos.space3,
    paddingLeft: espacos.space4,
    paddingRight: espacos.space3,
    gap: espacos.space3,
  },
  textos: { flex: 1, gap: 2 },
  estado: {
    minWidth: 92,
    borderRadius: raios.radiusFull,
    paddingHorizontal: espacos.space3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
