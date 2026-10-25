import { createMMKV } from 'react-native-mmkv';

// Armazenamento local pequeno e síncrono (MMKV, como no Newzi): preferências do aparelho e estados
// de acesso. Os dados do casal ficam no Firestore, nunca aqui.
export const armazenamento = createMMKV({ id: 'lartie' });

export const CHAVES = {
  /** O T01 mostra "Começar" só na primeira abertura sem sessão. */
  jaAbriu: 'acesso.ja_abriu',
  /** Nome digitado no T03, guardado até a API criar o casal (sobrevive a uma falha de rede). */
  nomePendente: 'acesso.nome_pendente',
  /** Tentativas de login erradas por e-mail (bloqueio do T04). */
  tentativasLogin: 'acesso.tentativas_login',
} as const;
