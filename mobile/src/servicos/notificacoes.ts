import { PermissionsAndroid, Platform } from 'react-native';
import { getApp } from '@react-native-firebase/app';
import { getMessaging, requestPermission } from '@react-native-firebase/messaging';
import { armazenamento } from './armazenamento';
import { registrarErro } from './analytics';

// Permissão de notificações (T57, especificação 2.5): o app explica antes do pedido do sistema e
// só pede uma vez por aparelho. O envio dos lembretes (push) entra na Etapa 9.

const CHAVE_PEDIU = 'permissao.notificacoes.pedida';

export function jaPediuNotificacoes(): boolean {
  return armazenamento.getBoolean(CHAVE_PEDIU) ?? false;
}

/** Pedido nativo (iOS: Firebase Messaging; Android 13+: POST_NOTIFICATIONS). */
export async function pedirPermissaoNotificacoes(): Promise<void> {
  armazenamento.set(CHAVE_PEDIU, true);
  try {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      return;
    }
    await requestPermission(getMessaging(getApp()));
  } catch (erro) {
    registrarErro(erro, 'permissão de notificações');
  }
}
