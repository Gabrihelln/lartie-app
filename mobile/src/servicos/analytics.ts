import { getApp } from '@react-native-firebase/app';
import { getAnalytics, logEvent, logScreenView } from '@react-native-firebase/analytics';
import { getCrashlytics, log, recordError } from '@react-native-firebase/crashlytics';

// Eventos de analytics e registro de erros. Cada etapa registra os eventos das suas telas.
// Nomes em snake_case, sem dados pessoais (nada de nomes, e-mails ou telefones).

export type EventoAnalytics =
  | { nome: 'modo_escolhido'; params: { modo: string } }
  | { nome: 'modo_alterado'; params: { de: string; para: string; origem: 'perfil' | 'cartao' | 'assistente' } }
  | { nome: 'acao_desfeita'; params: { acao: string } };

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
