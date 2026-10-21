import { getApp } from '@react-native-firebase/app';

// Ambiente do app: "demo" (emuladores locais, projeto demo-lartie), "dev" (lartie-dev) ou "prod" (lartie).
// O arquivo de configuração do Firebase de cada ambiente é escolhido no build
// (iOS: scripts/ambiente.sh; Android: flavors demo/dev/prod). Aqui só lemos o projeto ativo.
export type Ambiente = 'demo' | 'dev' | 'prod';

export const PROJETOS: Record<Ambiente, string> = {
  demo: 'demo-lartie',
  dev: 'lartie-dev',
  prod: 'lartie',
};

export function ambienteAtual(): Ambiente {
  const projeto = getApp().options.projectId ?? '';
  if (projeto === PROJETOS.prod) return 'prod';
  if (projeto === PROJETOS.dev) return 'dev';
  return 'demo';
}

/** Endereço dos emuladores: no simulador do iOS é localhost; no emulador do Android, 10.0.2.2. */
export { HOST_EMULADOR } from './hostEmulador';
