import type { Ambiente } from './ambiente';

// Identificadores públicos do login com Google (não são segredos: vão dentro do app).
// O "cliente web" do Firebase de cada projeto é o que o Android usa para pedir o ID token.
// No iOS, o Google Sign-In lê o CLIENT_ID do GoogleService-Info.plist do ambiente.
// O prod ganha o seu quando o Google for ativado no projeto lartie (Etapa 10).
export const GOOGLE_WEB_CLIENT_ID: Record<Ambiente, string | null> = {
  demo: null,
  dev: '755325057625-fhr0viute2cu7vmkl71gun2585th3inn.apps.googleusercontent.com',
  prod: null,
};
