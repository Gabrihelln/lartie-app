import { tokens } from './gerado';

export { tokens };

export type Tema = 'claro' | 'escuro';
export type Plataforma = 'ios' | 'android';

export type Cores = { readonly [K in keyof typeof tokens.cores.claro]: string };
export type NomeCor = keyof Cores;
export type NomeEspaco = keyof typeof tokens.espacos;
export type NomeRaio = keyof typeof tokens.raios;
export type NomeTamanho = keyof typeof tokens.tamanhos;
export type NomeSombra = keyof typeof tokens.sombras.claro;
export type NomeDegrade = keyof typeof tokens.degrades;
export type EstiloIos = keyof typeof tokens.tipografia.ios;
export type EstiloAndroid = keyof typeof tokens.tipografia.android;

export type EstiloTexto = {
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly fontWeight: string;
  readonly letterSpacing: number;
};

export type Degrade = {
  readonly angulo: number;
  readonly paradas: readonly { readonly cor: NomeCor; readonly posicao: number }[];
  readonly brilho: null | {
    readonly centroX: number;
    readonly centroY: number;
    readonly corInicio: string;
    readonly corFim: string;
    readonly raio: number;
  };
};

export function coresDoTema(tema: Tema): Cores {
  return tema === 'escuro' ? tokens.cores.escuro : tokens.cores.claro;
}

export function sombraDoTema(tema: Tema, nome: NomeSombra): string | null {
  return (tema === 'escuro' ? tokens.sombras.escuro : tokens.sombras.claro)[nome];
}

export const espacos = tokens.espacos;
export const raios = tokens.raios;
export const tamanhos = tokens.tamanhos;
export const degrades: { readonly [K in NomeDegrade]: Degrade } = tokens.degrades;

/** Margem lateral das telas: space-5 (20) no iOS e space-4 (16) no Android. */
export function margemLateral(plataforma: Plataforma): number {
  return plataforma === 'ios' ? espacos.space5 : espacos.space4;
}

/** Alvo mínimo de toque: 44 pt no iOS e 48 dp no Android. */
export function alvoToque(plataforma: Plataforma): number {
  return plataforma === 'ios' ? tamanhos.touchIos : tamanhos.touchAndroid;
}
