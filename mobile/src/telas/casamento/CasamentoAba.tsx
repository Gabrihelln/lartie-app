import React, { useEffect, useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { FaseTarefa } from '@lartie/modelo';
import { ControleSegmentado } from '../../componentes/ControleSegmentado';
import { TelaAba } from '../../componentes/Estrutura';
import { FabAssistente } from '../../componentes/FabAssistente';
import type { ParamsAbas, SecaoCasamento } from '../../navegacao/tipos';
import { Convidados } from '../convidados/Convidados';
import { Checklist } from './Checklist';
import { Fornecedores } from './Fornecedores';
import { Orcamento } from './Orcamento';

// Aba Casamento: título, "+" e o seletor interno Checklist · Orçamento · Fornecedores · Convidados
// (especificação 1.3). A aba fica ativa nas quatro.

const SEGMENTOS = [
  { valor: 'checklist', rotulo: 'Checklist' },
  { valor: 'orcamento', rotulo: 'Orçamento' },
  { valor: 'fornecedores', rotulo: 'Fornec.', rotuloAcessivel: 'Fornecedores' },
  { valor: 'convidados', rotulo: 'Convidados' },
] as const;

export function CasamentoAba() {
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<ParamsAbas, 'casamento'>>();
  const [secao, setSecao] = useState<SecaoCasamento>(params?.secao ?? 'checklist');
  const [fase, setFase] = useState<FaseTarefa | undefined>(params?.fase);
  const [novoGasto, setNovoGasto] = useState(false);
  const [travada, setTravada] = useState(false);
  const rolagem = useRef<ScrollView>(null);

  // Atalhos do Início e "Ver próxima fase" (T56) chegam com secao/fase.
  useEffect(() => {
    if (params?.secao) setSecao(params.secao);
    if (params?.fase) setFase(params.fase);
  }, [params?.secao, params?.fase]);

  const mais = {
    checklist: { rotulo: 'Nova tarefa', onPress: () => navigation.navigate('Tarefa', {}) },
    orcamento: { rotulo: 'Novo gasto', onPress: () => setNovoGasto(true) },
    fornecedores: { rotulo: 'Novo fornecedor', onPress: () => navigation.navigate('Fornecedor', {}) },
    convidados: { rotulo: 'Novo grupo', onPress: () => navigation.navigate('Grupo', {}) },
  }[secao];

  return (
    <TelaAba
      titulo="Casamento"
      acao={mais ? { icone: 'adicionar', ...mais } : undefined}
      rolagem={rolagem}
      rolagemTravada={travada}
      onAtualizar={() => {}}
      sobreposto={<FabAssistente tela="T13" onPress={() => navigation.navigate('Provisoria', { titulo: 'Assistente', id: 'T31', etapa: 9 })} />}
    >
      <ControleSegmentado
        rotulo="Seções do casamento"
        segmentos={SEGMENTOS}
        selecionado={secao}
        onMudar={(s) => {
          setSecao(s);
          setFase(undefined);
          rolagem.current?.scrollTo({ y: 0, animated: false });
        }}
      />
      {secao === 'checklist' ? <Checklist fase={fase} onTravarRolagem={setTravada} rolagem={rolagem} /> : null}
      {secao === 'orcamento' ? <Orcamento novoGasto={novoGasto} onFecharNovoGasto={() => setNovoGasto(false)} /> : null}
      {secao === 'fornecedores' ? <Fornecedores /> : null}
      {secao === 'convidados' ? <Convidados /> : null}
    </TelaAba>
  );
}

