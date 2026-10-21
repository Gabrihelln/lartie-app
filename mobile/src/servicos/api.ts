import { getIdToken } from '@react-native-firebase/auth';
import { ambienteAtual, HOST_EMULADOR } from './ambiente';
import { auth } from './firebase';

// Chamadas à API do Lartiê (VPS). Em demo e dev a API roda no Mac (npm run api / api:dev);
// em prod, no endereço público da VPS, que depende do domínio (P13).
const URL_API = {
  demo: `http://${HOST_EMULADOR}:8100`,
  dev: `http://${HOST_EMULADOR}:8100`,
  prod: 'https://api.lartie.app',
} as const;

export class ErroSemConexao extends Error {}
export class ErroApi extends Error {
  constructor(
    readonly status: number,
    readonly codigo: string,
  ) {
    super(`API ${status} ${codigo}`);
  }
}

async function chamar<T>(caminho: string, corpo: unknown): Promise<T> {
  const usuario = auth().currentUser;
  if (!usuario) throw new ErroApi(401, 'sem_usuario');
  const token = await getIdToken(usuario);
  const controle = new AbortController();
  const tempo = setTimeout(() => controle.abort(), 15000);
  let resposta: Response;
  try {
    resposta = await fetch(`${URL_API[ambienteAtual()]}${caminho}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(corpo ?? {}),
      signal: controle.signal,
    });
  } catch {
    throw new ErroSemConexao();
  } finally {
    clearTimeout(tempo);
  }
  const dados = (await resposta.json().catch(() => ({}))) as T & { erro?: string };
  if (!resposta.ok) throw new ErroApi(resposta.status, dados.erro ?? 'desconhecido');
  return dados;
}

/** Cria o casal e o usuário noivo_1 (ou devolve os existentes) e grava o claim casal_id. */
export function inicializarConta(nome?: string) {
  return chamar<{ casal_id: string; criado: boolean }>('/v1/conta/inicializar', nome ? { nome } : {});
}
