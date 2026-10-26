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
// Decisão de 26/10/2026: com "Sim" em "Algum de vocês já mora sozinho?", o app pergunta quem; os itens
// marcados ficam como "já era de" essa pessoa.

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
  const [quem, setQuem] = useState<'noivo_1' | 'noivo_2' | 'os_dois' | null>(respostas?.quem_mora_sozinho ?? null);
  const [marcados, setMarcados] = useState<string[]>(respostas?.ja_temos ?? []);
  const nome1 = casal?.nome_1 ?? 'Você';
  const nome2 = casal?.nome_2 ?? 'Seu amor';
  const quemTem = sozinho === 'sim' && quem === 'noivo_1' ? nome1 : sozinho === 'sim' && quem === 'noivo_2' ? nome2 : null;

  const alternar = (opcao: string, marcar: boolean) =>
    setMarcados((atual) => (marcar ? [...atual, opcao] : atual.filter((o) => o !== opcao)));

  const montar = (jaTemos: string[]) =>
    avancar('T09', {
      onboarding_respostas: {
        ja_mora_sozinho: sozinho === null ? null : sozinho === 'sim',
        quem_mora_sozinho: sozinho === 'sim' ? quem : null,
        ja_temos: jaTemos,
      },
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
      {sozinho === 'sim' ? (
        <EscolhaUnica
          rotulo="Quem?"
          opcoes={[
            { valor: 'noivo_1', rotulo: nome1 },
            { valor: 'noivo_2', rotulo: nome2 },
            { valor: 'os_dois', rotulo: 'Os dois' },
          ]}
          selecionado={quem}
          onMudar={setQuem}
        />
      ) : null}
      <View style={estilos.grupo}>
        <Texto papel="rotuloCampo">{quemTem ? `Marque o que ${quemTem} já tem` : 'Marque o que já têm'}</Texto>
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
