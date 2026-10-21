import React from 'react';
import { StyleSheet, View } from 'react-native';
import { raios, type NomeCor } from '@lartie/tokens';
import Simbolo from '../../../design-system/logos/svg/simbolo-creme.svg';
import SimboloSimplificado from '../../../design-system/logos/svg/simbolo-simplificado.svg';
import { espacos, estiloMarca, estiloSlogan, useTema } from '../tema';
import { Degrade } from './Degrade';
import { Texto } from './Texto';

// design-system/componentes/Logo. Os desenhos vêm dos arquivos oficiais em design-system/logos/svg;
// só a cor muda (rosé sobre claro, creme sobre rosé/vinho). Proporção do símbolo: 52 × 84.

const PROPORCAO = 52 / 84;

interface SimboloProps {
  altura: number;
  cor: NomeCor;
}

/** Símbolo solto. Abaixo de 24 de altura, usa a versão simplificada (regra do guia). */
export function SimboloLartie({ altura, cor }: SimboloProps) {
  const { cores } = useTema();
  const Componente = altura < 24 ? SimboloSimplificado : Simbolo;
  return <Componente width={altura * PROPORCAO} height={altura} fill={cores[cor]} />;
}

/** Ícone do app em bloco (telas de acesso, T12d): símbolo creme sobre gradient-icon, raio radius-icon. */
export function IconeApp({ tamanho }: { tamanho: number }) {
  const { sombra } = useTema();
  return (
    <View
      style={[
        { width: tamanho, height: tamanho, borderRadius: tamanho * raios.radiusIcon },
        tamanho >= 96 ? sombra('shadowIconTile') : null,
      ]}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Lartiê"
    >
      <Degrade nome="gradientIcon" style={[estilos.bloco, { borderRadius: tamanho * raios.radiusIcon }]}>
        {/* O símbolo ocupa cerca de 78% do lado (desenho de 100 em 187 de 240). */}
        <SimboloLartie altura={tamanho * 0.7} cor="brandCream" />
      </Degrade>
    </View>
  );
}

interface MarcaProps {
  /** Tamanho do nome "Lartiê" em Fraunces. */
  tamanhoNome?: number;
  sobre?: 'claro' | 'marca';
  slogan?: boolean;
}

/** Montagem horizontal: símbolo + "Lartiê" (Fraunces 500, SOFT 100) e o slogan em minúsculas. */
export function MarcaLartie({ tamanhoNome = 26, sobre = 'claro', slogan = false }: MarcaProps) {
  const { cores } = useTema();
  const corSimbolo: NomeCor = sobre === 'claro' ? 'primary' : 'brandCream';
  const corNome: NomeCor = sobre === 'claro' ? 'onPrimaryContainer' : 'brandCream';
  return (
    <View style={estilos.linha} accessible accessibilityRole="header" accessibilityLabel="Lartiê, casamento e casa nova">
      <SimboloLartie altura={tamanhoNome * 1.55} cor={corSimbolo} />
      <View>
        <Texto style={[estiloMarca(tamanhoNome), { color: cores[corNome] }]}>Lartiê</Texto>
        {slogan ? <Texto style={[estiloSlogan(), { color: cores[corNome] }]}>casamento e casa nova</Texto> : null}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  bloco: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espacos.space2 },
});
