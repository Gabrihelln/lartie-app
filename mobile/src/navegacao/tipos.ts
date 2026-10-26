import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Aba } from '@lartie/regras';

export type ParamsAbas = { [K in Aba]: undefined };

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
