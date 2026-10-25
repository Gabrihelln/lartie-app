import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { EstiloCasamento } from '@lartie/modelo';
import { adicionarDias, hojeLocal } from '@lartie/regras';
import { Botao } from '../../componentes/Botao';
import { CaixaSelecao } from '../../componentes/CaixaSelecao';
import { CampoCidade, type Cidade } from '../../componentes/CampoCidade';
import { CampoData } from '../../componentes/CampoData';
import { CampoMoeda } from '../../componentes/CamposMascarados';
import { Chip } from '../../componentes/Chip';
import { Contador } from '../../componentes/Contador';
import { EscolhaUnica } from '../../componentes/EscolhaUnica';
import { Texto } from '../../componentes/Texto';
import { espacos } from '../../tema';
import { TelaOnboarding, useOnboarding } from './comum';

// T07 · Sobre o casamento (Ob2Casamento.dc.html). Erros T46 com os textos da especificação.
// P05 (decisão de 25/10/2026): estilos sem "religioso" no nome perguntam "Terá cerimônia religiosa?".

const ESTILOS: { valor: EstiloCasamento; rotulo: string }[] = [
  { valor: 'so_civil', rotulo: 'Só civil' },
  { valor: 'civil_religioso', rotulo: 'Civil + religioso' },
  { valor: 'mini_wedding', rotulo: 'Mini wedding' },
  { valor: 'festa_grande', rotulo: 'Festa grande' },
  { valor: 'destination', rotulo: 'Destination' },
];

const PERGUNTA_RELIGIOSO: EstiloCasamento[] = ['mini_wedding', 'festa_grande', 'destination'];

export const TEXTOS_T07 = {
  dataPassada: 'Escolha uma data depois de hoje.',
  dataVazia: 'Escolha a data ou marque "Ainda não definimos a data".',
  cidade: 'Informe a cidade para ajustarmos o clima.',
} as const;

export function T07Casamento() {
  const { casal, avancar } = useOnboarding();
  const amanha = adicionarDias(hojeLocal(), 1);
  const [data, setData] = useState<string | null>(casal?.data_casamento ?? null);
  // Já passou pelo T07 sem data (estilo gravado, data vazia): volta com a caixa marcada.
  const [semData, setSemData] = useState(!!casal?.estilo && casal.data_casamento === null);
  const [cidade, setCidade] = useState<Cidade | null>(casal?.cidade && casal.uf ? { cidade: casal.cidade, uf: casal.uf } : null);
  const [estilo, setEstilo] = useState<EstiloCasamento>(casal?.estilo ?? 'civil_religioso');
  const [religioso, setReligioso] = useState<'sim' | 'nao'>(casal?.cerimonia_religiosa ? 'sim' : 'nao');
  const [convidados, setConvidados] = useState(casal?.num_convidados_previsto ?? 100);
  const [orcamento, setOrcamento] = useState<number | null>(casal?.orcamento_total ?? null);
  const [tentou, setTentou] = useState(false);
  const [tocouCidade, setTocouCidade] = useState(false);

  const erroData = semData ? null : !data ? TEXTOS_T07.dataVazia : data < amanha ? TEXTOS_T07.dataPassada : null;
  const erroCidade = cidade ? null : TEXTOS_T07.cidade;
  const perguntaReligioso = PERGUNTA_RELIGIOSO.includes(estilo);

  const continuar = () => {
    setTentou(true);
    if (erroData || erroCidade) return;
    avancar('T07', {
      data_casamento: semData ? null : data,
      cidade: cidade!.cidade,
      uf: cidade!.uf,
      estilo,
      cerimonia_religiosa: estilo === 'civil_religioso' ? true : estilo === 'so_civil' ? false : religioso === 'sim',
      num_convidados_previsto: convidados,
      orcamento_total: orcamento,
      // P05 e 3.16: prazo padrão do RSVP = casamento − 60 dias.
      rsvp_prazo: !semData && data ? adicionarDias(data, -60) : null,
    });
  };

  return (
    <TelaOnboarding
      passo="T07"
      titulo="Sobre o casamento"
      subtitulo="Usamos isso para calcular os prazos do checklist."
      rodape={<Botao rotulo="Continuar" larguraTotal onPress={continuar} />}
    >
      <View style={estilos.linha}>
        <CampoData
          rotulo="Data"
          valor={semData ? null : data}
          onMudar={setData}
          desativado={semData}
          minimo={amanha}
          erro={tentou ? erroData : null}
        />
        <CampoCidade valor={cidade} onMudar={setCidade} onBlur={() => setTocouCidade(true)} erro={tentou || tocouCidade ? erroCidade : null} />
      </View>
      <CaixaSelecao marcada={semData} onMudar={setSemData} rotuloAcessivel="Ainda não definimos a data">
        <Texto papel="corpo" cor="onSurfaceVariant">
          Ainda não definimos a data
        </Texto>
      </CaixaSelecao>

      <View style={estilos.grupo}>
        <Texto papel="rotuloCampo">Estilo</Texto>
        <View style={estilos.chips} accessibilityRole="radiogroup" accessibilityLabel="Estilo">
          {ESTILOS.map((e) => (
            <Chip key={e.valor} rotulo={e.rotulo} selecionado={estilo === e.valor} onPress={() => setEstilo(e.valor)} />
          ))}
        </View>
      </View>

      {perguntaReligioso ? (
        <EscolhaUnica
          rotulo="Terá cerimônia religiosa?"
          opcoes={[
            { valor: 'sim', rotulo: 'Sim' },
            { valor: 'nao', rotulo: 'Não' },
          ]}
          selecionado={religioso}
          onMudar={setReligioso}
        />
      ) : null}

      <Contador rotulo="Número de convidados" valor={convidados} onMudar={setConvidados} minimo={10} passo={10} />
      <CampoMoeda rotulo="Orçamento total (opcional)" valor={orcamento} onMudar={setOrcamento} />
    </TelaOnboarding>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', gap: espacos.space3, alignItems: 'flex-start' },
  grupo: { gap: espacos.space2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacos.space2 },
});
