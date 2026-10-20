import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Aba } from '@lartie/regras';

export type ParamsAbas = { [K in Aba]: undefined };

export type ParamsRaiz = {
  Abas: NavigatorScreenParams<ParamsAbas> | undefined;
  /** Provisória até a Etapa 1 (acesso e login). Só existe em desenvolvimento. */
  AcessoProvisorio: undefined;
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
