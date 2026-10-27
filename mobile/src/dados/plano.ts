import { useMemo } from 'react';
import { where } from '@react-native-firebase/firestore';
import {
  caminhos,
  type CategoriaOrcamento,
  type Comodo,
  type Convidado,
  type Fornecedor,
  type Gasto,
  type Imovel,
  type Item,
  type Notificacao,
  type Parcela,
  type Tarefa,
} from '@lartie/modelo';
import { useColecao, useDocumento, type Leitura } from './leitura';
import { useSessao } from './Sessao';

// Leituras do plano do casal em tempo real (com cache offline). Cada tela usa só o que precisa;
// o Firestore reaproveita a mesma escuta quando duas telas leem a mesma coleção.

type ComId<T> = T & { id: string };

function useSub<T>(sub: Parameters<typeof caminhos.subcolecao>[1]): Leitura<ComId<T>[]> {
  const { casalId } = useSessao();
  return useColecao<T>(casalId ? caminhos.subcolecao(casalId, sub) : null);
}

export const useTarefas = () => useSub<Tarefa>('tarefas');
export const useFornecedores = () => useSub<Fornecedor>('fornecedores');
export const useParcelas = () => useSub<Parcela>('parcelas');
export const useCategorias = () => useSub<CategoriaOrcamento>('categorias_orcamento');
export const useGastos = () => useSub<Gasto>('gastos');
export const useItens = () => useSub<Item>('itens');
export const useComodos = () => useSub<Comodo>('comodos');
export const useConvidados = () => useSub<Convidado>('convidados');

export function useImovel() {
  const { casalId } = useSessao();
  return useDocumento<Imovel>(casalId ? caminhos.imovel(casalId) : null);
}

/** Ponto vermelho do sino: há notificação não lida para mim ou para os dois. */
export function useTemNotificacaoNaoLida(): boolean {
  const { casalId, usuario } = useSessao();
  const caminho = casalId && usuario ? caminhos.subcolecao(casalId, 'notificacoes') : null;
  const minhas = useColecao<Notificacao>(caminho, where('usuario_id', '==', usuario?.uid ?? ''), where('lida', '==', false));
  const dosDois = useColecao<Notificacao>(caminho, where('usuario_id', '==', null), where('lida', '==', false));
  return minhas.dados.length + dosDois.dados.length > 0;
}

/** Tudo o que o orçamento precisa (T15 e atalhos do Início). */
export function useEntradaOrcamento() {
  const categorias = useCategorias();
  const fornecedores = useFornecedores();
  const gastos = useGastos();
  const itens = useItens();
  const entrada = useMemo(
    () => ({ categorias: categorias.dados, fornecedores: fornecedores.dados, gastos: gastos.dados, itens: itens.dados }),
    [categorias.dados, fornecedores.dados, gastos.dados, itens.dados],
  );
  return { entrada, carregando: categorias.carregando || fornecedores.carregando || gastos.carregando };
}

/** Nome de quem é o responsável (T13, T14): nome_1, nome_2 ou "Os dois". */
export function useNomes() {
  const { casal, papel } = useSessao();
  const nome1 = casal?.nome_1 ?? '';
  const nome2 = casal?.parceiro?.nome ?? casal?.nome_2 ?? 'Parceiro(a)';
  return {
    nome1,
    nome2,
    /** "Ana & Pedro" ou só "Ana" se o parceiro ainda não entrou (T12). */
    saudacao: casal?.parceiro ? `${nome1} & ${nome2}` : nome1,
    /** O outro, do ponto de vista de quem está usando. */
    outro: papel === 'noivo_2' ? nome1 : nome2,
    responsavel: (r: 'noivo_1' | 'noivo_2' | 'os_dois') => (r === 'noivo_1' ? nome1 : r === 'noivo_2' ? nome2 : 'Os dois'),
  };
}
