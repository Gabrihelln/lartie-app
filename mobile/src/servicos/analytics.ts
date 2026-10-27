import { getApp } from '@react-native-firebase/app';
import { getAnalytics, logEvent, logScreenView } from '@react-native-firebase/analytics';
import { getCrashlytics, log, recordError } from '@react-native-firebase/crashlytics';

// Eventos de analytics e registro de erros. Cada etapa registra os eventos das suas telas.
// Nomes em snake_case, sem dados pessoais (nada de nomes, e-mails ou telefones).

export type EventoAnalytics =
  | { nome: 'modo_escolhido'; params: { modo: string } }
  | { nome: 'modo_alterado'; params: { de: string; para: string; origem: OrigemModo } }
  | { nome: 'acao_desfeita'; params: { acao: string } }
  // Etapa 3
  | { nome: 'tarefa_concluida'; params: { origem: 'checklist' | 'inicio' | 'tarefa' } }
  | { nome: 'tarefa_criada'; params: { fase: string } }
  | { nome: 'tarefa_excluida'; params: Record<string, never> }
  | { nome: 'fase_concluida'; params: { fase: string } }
  | { nome: 'fornecedor_criado'; params: { categoria: string } }
  | { nome: 'fornecedor_fechado'; params: { categoria: string; parcelas: number } }
  | { nome: 'fornecedores_comparados'; params: { categoria: string } }
  | { nome: 'gasto_criado'; params: { escopo: string } }
  | { nome: 'parcela_paga'; params: Record<string, never> }
  | { nome: 'orcamento_definido'; params: { distribuido: number } }
  | { nome: 'parceiro_removido'; params: Record<string, never> }
  | { nome: 'conta_excluida'; params: Record<string, never> }
  // Etapa 4
  | { nome: 'item_estado_alterado'; params: { estado: string; origem: string } }
  | { nome: 'item_criado'; params: { fase: string } }
  | { nome: 'item_excluido'; params: Record<string, never> }
  | { nome: 'comodo_criado'; params: Record<string, never> }
  | { nome: 'comodo_completo'; params: Record<string, never> }
  | { nome: 'medidas_salvas'; params: Record<string, never> }
  | { nome: 'parceiro_saiu'; params: Record<string, never> }
  | { nome: 'comodos_sugeridos'; params: { comodos: number; itens: number } };

/** De onde veio a troca de modo (13.9 regra 9). */
export type OrigemModo = 'perfil' | 'cartao' | 'assistente' | 'inicio_depois' | 'folha_ativar';

export function registrarEvento(evento: EventoAnalytics) {
  try {
    logEvent(getAnalytics(getApp()), evento.nome, evento.params);
  } catch (erro) {
    if (__DEV__) console.warn('analytics', erro);
  }
}

export function registrarTela(tela: string) {
  logScreenView(getAnalytics(getApp()), { screen_name: tela, screen_class: tela }).catch(() => {});
}

export function registrarErro(erro: unknown, contexto?: string) {
  const c = getCrashlytics(getApp());
  if (contexto) log(c, contexto);
  recordError(c, erro instanceof Error ? erro : new Error(String(erro)));
  if (__DEV__) console.warn(contexto ?? 'Erro', erro);
}
