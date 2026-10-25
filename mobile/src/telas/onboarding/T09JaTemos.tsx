import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Botao } from '../../componentes/Botao';
import { EscolhaUnica } from '../../componentes/EscolhaUnica';
import { OpcaoMarcavel } from '../../componentes/OpcaoMarcavel';
import { Texto } from '../../componentes/Texto';
import { espacos } from '../../tema';
import { TelaOnboarding, useOnboarding } from './comum';

// T09 · O que vocês já têm (Ob4Partida.dc.html). Cada opção marca um conjunto de itens do catálogo
// como "Já tenho" (origem "já era nosso") quando o plano for gerado no T10.

export const OPCOES_JA_TEMOS = [
  'Cozinha montada',
  'Cama e colchão',
  'Geladeira',
  'Fogão',
  'Máquina de lavar',
  'Sofá',
  'Cama e banho',
  'Micro-ondas',
] as const;

export function T09JaTemos() {
  const { casal, avancar } = useOnboarding();
  const respostas = casal?.onboarding_respostas;
  const [sozinho, setSozinho] = useState<'sim' | 'nao' | null>(
    respostas?.ja_mora_sozinho === true ? 'sim' : respostas?.ja_mora_sozinho === false ? 'nao' : null,
  );
  const [marcados, setMarcados] = useState<string[]>(respostas?.ja_temos ?? []);

  const alternar = (opcao: string, marcar: boolean) =>
    setMarcados((atual) => (marcar ? [...atual, opcao] : atual.filter((o) => o !== opcao)));

  const montar = (jaTemos: string[]) =>
    avancar('T09', {
      onboarding_respostas: { ja_mora_sozinho: sozinho === null ? null : sozinho === 'sim', ja_temos: jaTemos },
    });

  const pares: (typeof OPCOES_JA_TEMOS)[number][][] = [];
  for (let i = 0; i < OPCOES_JA_TEMOS.length; i += 2) pares.push(OPCOES_JA_TEMOS.slice(i, i + 2));

  return (
    <TelaOnboarding
      passo="T09"
      titulo="O que vocês já têm?"
      subtitulo='O que marcar aqui entra no enxoval como "Já tenho".'
      rodape={
        <>
          <Botao rotulo="Montar nosso plano" larguraTotal onPress={() => montar(marcados)} />
          <Botao rotulo="Pular, começamos do zero" variante="texto" larguraTotal onPress={() => montar([])} />
        </>
      }
    >
      <EscolhaUnica
        rotulo="Algum de vocês já mora sozinho?"
        opcoes={[
          { valor: 'sim', rotulo: 'Sim' },
          { valor: 'nao', rotulo: 'Não' },
        ]}
        selecionado={sozinho}
        onMudar={setSozinho}
      />
      <View style={estilos.grupo}>
        <Texto papel="rotuloCampo">Marque o que já têm</Texto>
        {pares.map((par) => (
          <View key={par[0]} style={estilos.linha}>
            {par.map((opcao) => (
              <OpcaoMarcavel key={opcao} rotulo={opcao} marcada={marcados.includes(opcao)} onMudar={(m) => alternar(opcao, m)} />
            ))}
          </View>
        ))}
      </View>
    </TelaOnboarding>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: espacos.space3 },
  linha: { flexDirection: 'row', gap: espacos.space3 },
});
