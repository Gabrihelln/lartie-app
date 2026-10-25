// 13.2 Geração do enxoval da casa nova.
import type { FaseItem } from '@lartie/modelo';
import type { CatalogoClima, CatalogoEnxoval, Clima, ItemCatalogo } from './catalogos';

export interface DadosEnxoval {
  quartos: number;
  banheiros: number;
  mobiliado: 'sim' | 'em_parte' | 'nao';
  tem_pets: boolean;
  moradores: number;
  clima: Clima;
  /** Opções marcadas no T09 ("Cozinha montada", "Geladeira"…). */
  ja_temos: string[];
}

export interface ComodoGerado {
  /** Id estável no casal (ex.: "cozinha", "quarto-2"): gerar de novo não duplica. */
  id: string;
  nome: string;
  ordem: number;
}

export interface ItemGerado {
  id: string;
  catalogo_id: string;
  comodo_id: string;
  nome: string;
  fase: FaseItem;
  quantidade: number;
  ja_tenho: boolean;
  /** Preço de referência por unidade, em centavos. */
  preco_estimado: number | null;
  bom_para_presente: boolean;
}

export function classificarClima(cidade: string, uf: string, tabela: CatalogoClima): Clima {
  const normalizar = (s: string) => s.trim().toLocaleLowerCase('pt-BR');
  const excecao = tabela.excecoes_por_cidade.find((e) => normalizar(e.cidade) === normalizar(cidade) && e.uf === uf);
  return excecao?.clima ?? tabela.padrao_por_uf[uf] ?? 'temperado';
}

const slugComodo = (nome: string) =>
  nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Cômodos padrão (13.2): Cozinha, Quarto(s), Banheiro(s), Sala, Lavanderia, Limpeza e organização, Pets. */
export function gerarComodos(dados: Pick<DadosEnxoval, 'quartos' | 'banheiros' | 'tem_pets'>): ComodoGerado[] {
  const nomes = ['Cozinha', 'Quarto'];
  for (let q = 2; q <= dados.quartos; q++) nomes.push(`Quarto ${q}`);
  nomes.push('Banheiro');
  for (let b = 2; b <= dados.banheiros; b++) nomes.push(`Banheiro ${b}`);
  nomes.push('Sala', 'Lavanderia', 'Limpeza e organização');
  if (dados.tem_pets) nomes.push('Pets');
  return nomes.map((nome, i) => ({ id: slugComodo(nome), nome, ordem: i + 1 }));
}

function climaPermite(item: ItemCatalogo, clima: Clima): boolean {
  if (item.clima === 'todos') return true;
  if (clima === 'temperado') return true;
  return item.clima === clima;
}

function quantidade(item: ItemCatalogo, moradores: number): number {
  if (item.escala === 'por_morador') return Math.max(1, Math.round((item.quantidade_base * moradores) / 2));
  return item.quantidade_base;
}

/** Em quais cômodos o item do catálogo entra. */
function comodosDoItem(item: ItemCatalogo, comodos: ComodoGerado[]): ComodoGerado[] {
  const extras = comodos.filter((c) => /^Quarto \d+$/.test(c.nome));
  const banheiros = comodos.filter((c) => /^Banheiro( \d+)?$/.test(c.nome));
  if (item.comodo === 'Quarto extra') return extras;
  // Itens "por banheiro" vão para cada banheiro; os demais itens do banheiro, só para o principal.
  if (item.comodo === 'Banheiro' && item.escala === 'por_banheiro') return banheiros;
  return comodos.filter((c) => c.nome === item.comodo);
}

export function gerarEnxoval(dados: DadosEnxoval, catalogo: CatalogoEnxoval): { comodos: ComodoGerado[]; itens: ItemGerado[] } {
  const comodos = gerarComodos(dados);
  const marcados = new Set(dados.ja_temos.flatMap((opcao) => catalogo.opcoes_ja_temos[opcao] ?? []));
  const itens: ItemGerado[] = [];

  for (const item of catalogo.itens) {
    if (!climaPermite(item, dados.clima)) continue;
    // Mobiliado: "sim" não cria móveis grandes; "em parte" cria com fase "com calma".
    if (item.movel_grande && dados.mobiliado === 'sim') continue;
    const fase: FaseItem = item.movel_grande && dados.mobiliado === 'em_parte' ? 'com_calma' : item.fase;
    for (const comodo of comodosDoItem(item, comodos)) {
      itens.push({
        id: `${comodo.id}_${item.id}`,
        catalogo_id: item.id,
        comodo_id: comodo.id,
        nome: item.nome,
        fase,
        quantidade: quantidade(item, dados.moradores),
        ja_tenho: marcados.has(item.id),
        preco_estimado: item.preco_referencia === null ? null : Math.round(item.preco_referencia * 100),
        bom_para_presente: item.bom_para_presente,
      });
    }
  }
  return { comodos, itens };
}
