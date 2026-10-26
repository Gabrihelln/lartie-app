// 13.1 Geração do checklist do casamento.
import type { EstiloCasamento, FaseTarefa } from '@lartie/modelo';
import type { CatalogoTarefas, TarefaCatalogo } from './catalogos';
import { adicionarDias, diferencaEmDias, hojeLocal } from './datas';

export interface DadosChecklist {
  /** "aaaa-mm-dd" ou null ("Ainda não definimos a data"). */
  data_casamento: string | null;
  estilo: EstiloCasamento;
  /** P05: resposta do T07 para estilos sem "religioso" no nome. "Civil + religioso" sempre inclui; "Só civil", nunca. */
  cerimonia_religiosa: boolean | null;
  /** "aaaa-mm-dd" de hoje (injetado para testar). */
  hoje?: string;
}

export interface TarefaGerada {
  catalogo_id: string;
  titulo: string;
  fase: FaseTarefa;
  prazo: string | null;
  responsavel: TarefaCatalogo['responsavel_sugerido'];
  ordem: number;
}

const ORDEM_FASES: FaseTarefa[] = [
  'decisoes_iniciais',
  'fornecedores_principais',
  'detalhes',
  'documentos_reta_final',
  'semana_casamento',
];

/** Dias para espalhar as tarefas que já estariam vencidas: de amanhã até hoje + 7 (13.1). */
const JANELA_ATRASADAS = 7;

export function incluiReligioso(estilo: EstiloCasamento, cerimonia_religiosa: boolean | null): boolean {
  if (estilo === 'civil_religioso') return true;
  if (estilo === 'so_civil') return false;
  return cerimonia_religiosa === true;
}

export function filtrarTarefas(catalogo: CatalogoTarefas, estilo: EstiloCasamento, cerimonia_religiosa: boolean | null) {
  const religioso = incluiReligioso(estilo, cerimonia_religiosa);
  return catalogo.tarefas.filter((t) => t.estilos.includes(estilo) && (!t.exige_religioso || religioso));
}

export function gerarChecklist(dados: DadosChecklist, catalogo: CatalogoTarefas): TarefaGerada[] {
  const hoje = dados.hoje ?? hojeLocal();
  const selecionadas = filtrarTarefas(catalogo, dados.estilo, dados.cerimonia_religiosa)
    // Ordem: fase, depois a que vence antes (mais dias antes do casamento primeiro).
    .sort(
      (a, b) =>
        ORDEM_FASES.indexOf(a.fase) - ORDEM_FASES.indexOf(b.fase) || b.dias_antes_do_casamento - a.dias_antes_do_casamento,
    );

  const tarefas: TarefaGerada[] = selecionadas.map((t, i) => ({
    catalogo_id: t.id,
    titulo: t.titulo,
    fase: t.fase,
    prazo: dados.data_casamento ? adicionarDias(dados.data_casamento, -t.dias_antes_do_casamento) : null,
    responsavel: t.responsavel_sugerido,
    ordem: i + 1,
  }));

  if (!dados.data_casamento) return tarefas;

  // Casamento com menos tempo que as fases: os prazos que cairiam até hoje vão para os próximos
  // 7 dias, na mesma ordem, sem passar da véspera do casamento. Nada nasce atrasado.
  const vencidas = tarefas.filter((t) => t.prazo! <= hoje);
  if (vencidas.length === 0) return tarefas;
  const ate = Math.max(1, Math.min(JANELA_ATRASADAS, diferencaEmDias(hoje, dados.data_casamento) - 1));
  vencidas.forEach((t, i) => {
    const dia = 1 + Math.floor((i * ate) / vencidas.length);
    t.prazo = adicionarDias(hoje, Math.min(dia, ate));
  });
  return tarefas;
}

/**
 * Perfil › Dados do casamento: mudar a data recalcula os prazos sugeridos das tarefas do plano que
 * não tiveram o prazo editado à mão. Concluídas não mudam. Devolve só o que muda.
 */
export function recalcularPrazos(
  tarefas: readonly { id: string; catalogo_id: string | null; prazo: string | null; prazo_manual?: boolean; status: string }[],
  dados: DadosChecklist,
  catalogo: CatalogoTarefas,
): { id: string; prazo: string | null }[] {
  const novos = new Map(gerarChecklist(dados, catalogo).map((t) => [t.catalogo_id, t.prazo]));
  const mudancas: { id: string; prazo: string | null }[] = [];
  for (const t of tarefas) {
    if (!t.catalogo_id || t.prazo_manual || t.status === 'concluida' || !novos.has(t.catalogo_id)) continue;
    const prazo = novos.get(t.catalogo_id)!;
    if (prazo !== t.prazo) mudancas.push({ id: t.id, prazo });
  }
  return mudancas;
}
