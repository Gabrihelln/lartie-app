import React from 'react';
import { StyleSheet, View } from 'react-native';
import { raios } from '@lartie/tokens';
import { espacos, useTema } from '../tema';
import { Selo } from './Selo';
import { Texto } from './Texto';

// design-system/componentes/CartaoProgresso.
interface Props {
  area: 'casamento' | 'casa';
  rotulo: string;
  feitos: number;
  total: number;
  /** Ex.: "tarefas", "itens". Vira "15 de 64 tarefas". */
  unidade: string;
}

export function CartaoProgresso({ area, rotulo, feitos, total, unidade }: Props) {
  const { cores, sombra } = useTema();
  const fracao = total > 0 ? Math.min(1, feitos / total) : 0;
  const percentual = Math.round(fracao * 100);
  const completo = total > 0 && feitos >= total;
  const trilho = area === 'casamento' ? cores.primaryContainer : cores.homeContainer;
  const preenchimento = area === 'casamento' ? cores.primary : cores.home;

  return (
    <View
      style={[estilos.cartao, { backgroundColor: cores.surface }, sombra('shadowCard')]}
      accessible
      accessibilityLabel={`${rotulo}: ${percentual}%, ${feitos} de ${total} ${unidade}`}
    >
      <Texto papel="metadado" cor="onSurfaceVariant">
        {rotulo}
      </Texto>
      <Texto papel="tituloDestaque">{percentual}%</Texto>
      <View style={[estilos.barra, { backgroundColor: trilho }]}>
        <View style={[estilos.barra, { width: `${percentual}%`, backgroundColor: preenchimento }]} />
      </View>
      {completo ? (
        <Selo texto="Completo" tom="success" />
      ) : (
        <Texto papel="metadado" cor="onSurfaceVariant">
          {feitos} de {total} {unidade}
        </Texto>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  cartao: { borderRadius: raios.radiusLg, padding: espacos.space4, gap: espacos.space2 },
  barra: { height: 8, borderRadius: raios.radiusFull, overflow: 'hidden' },
});
