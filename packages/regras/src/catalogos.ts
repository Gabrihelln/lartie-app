// Formato dos catálogos de dados/ (carga inicial do plano). As regras recebem os catálogos como
// parâmetro: assim a API lê os arquivos e os testes usam os mesmos dados.
import type { EstiloCasamento, FaseItem, FaseTarefa, Responsavel } from '@lartie/modelo';

export interface TarefaCatalogo {
  id: string;
  titulo: string;
  fase: FaseTarefa;
  dias_antes_do_casamento: number;
  responsavel_sugerido: Responsavel;
  estilos: EstiloCasamento[];
  exige_religioso: boolean;
  categoria_orcamento: string | null;
}

export interface CatalogoTarefas {
  versao: number;
  tarefas: TarefaCatalogo[];
}

export type Clima = 'frio' | 'temperado' | 'quente';

export interface ItemCatalogo {
  id: string;
  nome: string;
  comodo: string;
  fase: FaseItem;
  quantidade_base: number;
  escala: 'fixa' | 'por_morador' | 'por_banheiro';
  clima: 'todos' | 'frio' | 'quente';
  movel_grande: boolean;
  preco_referencia: number | null;
  bom_para_presente: boolean;
}

export interface CatalogoEnxoval {
  versao: number;
  itens: ItemCatalogo[];
  opcoes_ja_temos: Record<string, string[]>;
}

export interface CatalogoClima {
  padrao_por_uf: Record<string, Clima>;
  excecoes_por_cidade: { cidade: string; uf: string; clima: Clima }[];
}

export interface CategoriaCatalogo {
  id: string;
  nome: string;
  percentual_sugerido?: number;
}

export interface CatalogoCategorias {
  orcamento_casamento: CategoriaCatalogo[];
  orcamento_casa: CategoriaCatalogo[];
}
