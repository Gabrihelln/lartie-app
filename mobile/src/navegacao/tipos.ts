import type { NavigatorScreenParams } from '@react-navigation/native';
import type { FaseItem, FaseTarefa, ModoApp } from '@lartie/modelo';
import type { ModuloAtivavel } from '@lartie/regras';
import type { OrigemModo } from '../servicos/analytics';

export type SecaoCasamento = 'checklist' | 'orcamento' | 'fornecedores' | 'convidados';

export type ParamsAbas = {
  /** `ativar`: link para um módulo oculto abre o Início com a folha "Ativar {módulo}?" (13.9 regra 6). */
  inicio: { ativar?: ModuloAtivavel } | undefined;
  casamento: { secao?: SecaoCasamento; fase?: FaseTarefa } | undefined;
  convidados: undefined;
  casa: { fase?: FaseItem } | undefined;
  presentes: undefined;
  perfil: undefined;
};

export type ParamsRaiz = {
  Abas: NavigatorScreenParams<ParamsAbas> | undefined;
  /** Acesso (Etapa 1): T01 a T05. */
  Abertura: undefined;
  BoasVindas: undefined;
  CriarConta: undefined;
  Entrar: { email?: string } | undefined;
  EsqueciSenha: { email?: string } | undefined;
  /** Logado, mas o servidor ainda não criou o casal (claim casal_id). */
  PreparandoConta: undefined;
  /** Onboarding (T06 a T11, T57). */
  Onboarding: undefined;
  /** Deep link do convite do parceiro (T66 na Etapa 2). */
  Convite: { codigo: string };
  /** Etapa 3. T14: sem id = nova tarefa. */
  Tarefa: { id?: string; fase?: FaseTarefa } | undefined;
  /** Etapa 4. T19 · Cômodo. */
  Comodo: { id: string };
  /** T20: sem id = novo item (no cômodo indicado ou perguntando o cômodo). */
  Item: { id?: string; comodoId?: string } | undefined;
  /** T21 · Medidas do cômodo. */
  Medidas: { comodoId: string };
  /** Etapa 5. T24 · Lista: itens e reservas. `compartilhar`: abre o T65 (depois de publicar). */
  Lista: { id: string; compartilhar?: boolean };
  /** T24 "+ Adicionar itens do enxoval". */
  AdicionarItens: { listaId: string };
  /** T27 · Agradecimentos. */
  Agradecimentos: undefined;
  /** T17: sem id = novo fornecedor; `tarefaId` vincula o novo fornecedor à tarefa (T14). */
  Fornecedor: { id?: string; categoria?: string; tarefaId?: string } | undefined;
  /** T15 no modo "casa": acessado pela Casa (T18 › "Orçamento da casa"). */
  OrcamentoCasa: undefined;
  /** T33b. `preSelecionado`: cartões "Vão montar a casa nova também?" / "Vão casar também?". */
  ConfigModo: { preSelecionado?: ModoApp; origem?: OrigemModo } | undefined;
  /** Dados que faltam para ativar um módulo nunca gerado (T07 e/ou T08 + T09) e o T10 resumido. */
  AtivarModulo: { modo: ModoApp; origem: OrigemModo };
  /** T33 › itens. */
  EditarCasal: undefined;
  DadosCasamento: undefined;
  DadosCasa: undefined;
  MeusDados: undefined;
  /** T11 fora do onboarding (T12d "Convidar {parceiro}", T33 Parceiro(a) não conectado). */
  Convidar: undefined;
  /** Telas de etapas futuras abertas por atalhos desta etapa (T18, T22, T23, T28, T31, T32…). */
  Provisoria: { titulo: string; id: string; etapa: number };
  /** Catálogo interno de componentes (só em desenvolvimento). */
  Catalogo: undefined;
  CatalogoEstado: { estado: EstadoCatalogo };
  CatalogoFormulario: undefined;
};

export type EstadoCatalogo =
  | 'semConexao'
  | 'permNotificacoes'
  | 'permCamera'
  | 'permContatos'
  | 'vazioPresentes'
  | 'vazioConvidados'
  | 'vazioFornecedores'
  | 'vazioNotificacoes'
  | 'atualizacao'
  | 'esqueleto';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends ParamsRaiz {}
  }
}
