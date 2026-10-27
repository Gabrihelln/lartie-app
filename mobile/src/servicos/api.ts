import { getIdToken } from '@react-native-firebase/auth';
import type { ModoApp } from '@lartie/modelo';
import { ambienteAtual, HOST_EMULADOR } from './ambiente';
import { auth } from './firebase';

// Chamadas à API do Lartiê (VPS). Em demo e dev a API roda no Mac (npm run api / dev:dev);
// em prod, no endereço público da VPS, que depende do domínio (P13).
const URL_API = {
  demo: `http://${HOST_EMULADOR}:8100`,
  dev: `http://${HOST_EMULADOR}:8100`,
  prod: 'https://api.lartie.app',
} as const;

export const urlApi = () => URL_API[ambienteAtual()];

// Página do convidado (web, Next.js). Em demo e dev roda no Mac (npm run dev -w @lartie/web);
// em prod, lartie.app, que depende do domínio (P13).
const URL_WEB = {
  demo: `http://${HOST_EMULADOR}:3000`,
  dev: `http://${HOST_EMULADOR}:3000`,
  prod: 'https://lartie.app',
} as const;

/** Endereço que abre de verdade neste ambiente ("Ver como convidado"). */
export const urlWeb = (caminho: string) => `${URL_WEB[ambienteAtual()]}/${caminho.replace(/^\//, '')}`;

export class ErroSemConexao extends Error {}
export class ErroApi extends Error {
  constructor(
    readonly status: number,
    readonly codigo: string,
  ) {
    super(`API ${status} ${codigo}`);
  }
}

interface Opcoes {
  metodo?: 'GET' | 'POST' | 'DELETE';
  corpo?: unknown;
  /** Envio de arquivo (multipart). */
  formulario?: FormData;
  /** Rotas públicas (ex.: consulta do convite no T66) não mandam token. */
  semLogin?: boolean;
  tempoMs?: number;
}

export async function tokenAtual(): Promise<string> {
  const usuario = auth().currentUser;
  if (!usuario) throw new ErroApi(401, 'sem_usuario');
  return getIdToken(usuario);
}

async function chamar<T>(caminho: string, { metodo = 'POST', corpo, formulario, semLogin = false, tempoMs = 20000 }: Opcoes = {}): Promise<T> {
  const cabecalhos: Record<string, string> = {};
  if (!semLogin) cabecalhos.authorization = `Bearer ${await tokenAtual()}`;
  if (!formulario && metodo !== 'GET' && metodo !== 'DELETE') cabecalhos['content-type'] = 'application/json';
  const controle = new AbortController();
  const tempo = setTimeout(() => controle.abort(), tempoMs);
  let resposta: Response;
  try {
    resposta = await fetch(`${urlApi()}${caminho}`, {
      method: metodo,
      headers: cabecalhos,
      body: formulario ?? (metodo === 'POST' ? JSON.stringify(corpo ?? {}) : undefined),
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

/** Etapa 1: cria o casal e o usuário noivo_1 (ou devolve os existentes) e grava o claim casal_id. */
export function inicializarConta(nome?: string) {
  return chamar<{ casal_id: string; criado: boolean }>('/v1/conta/inicializar', { corpo: nome ? { nome } : {} });
}

export interface ResumoPlano {
  casamento: { tarefas: number; fases: number; data_casamento: string | null } | null;
  casa: { comodos: number; itens: number; ja_marcados: number; moradores: number; pets: boolean; clima: string } | null;
  slug: string;
}

/** T10: gera checklist, enxoval e categorias dos módulos ativos (idempotente). */
export function gerarPlano() {
  return chamar<ResumoPlano>('/v1/plano/gerar', { tempoMs: 60000 });
}

/** T11: convite do parceiro (cria ou devolve o pendente). */
export function criarConvite() {
  return chamar<{ codigo: string; expira_em: string }>('/v1/convites');
}

export type SituacaoConvite = 'valido' | 'expirado' | 'usado';

/** T66: quem convidou e se o convite vale (sem login). */
export function consultarConvite(codigo: string) {
  return chamar<{ situacao: SituacaoConvite; nome_1: string; nome_2: string | null }>(`/v1/convites/${encodeURIComponent(codigo)}`, {
    metodo: 'GET',
    semLogin: true,
  });
}

/** T66 → T03/T04: entra no casal como noivo_2. */
export function aceitarConvite(codigo: string, nome?: string) {
  return chamar<{ casal_id: string }>(`/v1/convites/${encodeURIComponent(codigo)}/aceitar`, { corpo: nome ? { nome } : {} });
}

/** T66 "Recusar convite": sem login; cancela o convite e avisa quem convidou. */
export function recusarConvite(codigo: string) {
  return chamar<{ ok: boolean }>(`/v1/convites/${encodeURIComponent(codigo)}/recusar`, { semLogin: true });
}

/** T11 "Cancelar este convite e gerar outro": cancela os pendentes do casal. */
export function cancelarConvites() {
  return chamar<{ cancelados: number }>('/v1/convites', { metodo: 'DELETE' });
}

/** T06: envia a foto do casal (arquivo local escolhido na câmera ou na galeria). */
export function enviarFotoCasal(arquivo: { uri: string; tipo: string; nome: string }) {
  const formulario = new FormData();
  formulario.append('foto', { uri: arquivo.uri, type: arquivo.tipo, name: arquivo.nome } as unknown as Blob);
  return chamar<{ foto: string }>('/v1/casal/foto', { formulario, tempoMs: 60000 });
}

export function removerFotoCasal() {
  return chamar<{ ok: boolean }>('/v1/casal/foto', { metodo: 'DELETE' });
}

// Etapa 3 ---------------------------------------------------------------------------------------

/** T33b "Mudar modo": gera os módulos nunca gerados, grava o modo e avisa o parceiro (13.9). */
export function trocarModo(modo: ModoApp, origem: string) {
  return chamar<{ modo: ModoApp; resumo: ResumoPlano }>('/v1/casal/modo', { corpo: { modo, origem }, tempoMs: 60000 });
}

/** T43: remove o parceiro do plano (só quem criou o plano). */
export function removerParceiro() {
  return chamar<{ removido: boolean }>('/v1/casal/parceiro', { metodo: 'DELETE' });
}

/** T42: exclui a conta e todos os dados do casal. */
export function excluirConta() {
  return chamar<{ ok: boolean }>('/v1/conta', { metodo: 'DELETE', tempoMs: 60000 });
}

/** T17: anexa o contrato (PDF ou foto) ao fornecedor. */
export function enviarContrato(fornecedorId: string, arquivo: { uri: string; tipo: string; nome: string }) {
  const formulario = new FormData();
  formulario.append('contrato', { uri: arquivo.uri, type: arquivo.tipo, name: arquivo.nome } as unknown as Blob);
  return chamar<{ contrato: string }>(`/v1/fornecedores/${encodeURIComponent(fornecedorId)}/contrato`, { formulario, tempoMs: 60000 });
}

export function removerContrato(fornecedorId: string) {
  return chamar<{ ok: boolean }>(`/v1/fornecedores/${encodeURIComponent(fornecedorId)}/contrato`, { metodo: 'DELETE' });
}

/** Link de 10 minutos para abrir um arquivo do casal no navegador do sistema. */
export async function linkDoArquivo(caminho: string) {
  const { link } = await chamar<{ link: string }>('/v1/arquivos/link', { corpo: { caminho } });
  return `${urlApi()}${link}`;
}

// Etapa 4 ---------------------------------------------------------------------------------------

/** Pedido do dono do produto: quem entrou pelo convite sai do plano (os dados ficam). */
export function sairDoPlano() {
  return chamar<{ ok: boolean }>('/v1/casal/sair');
}

/** T20: foto do item. */
export function enviarFotoItem(itemId: string, arquivo: { uri: string; tipo: string; nome: string }) {
  const formulario = new FormData();
  formulario.append('foto', { uri: arquivo.uri, type: arquivo.tipo, name: arquivo.nome } as unknown as Blob);
  return chamar<{ foto: string }>(`/v1/itens/${encodeURIComponent(itemId)}/foto`, { formulario, tempoMs: 60000 });
}

export function removerFotoItem(itemId: string) {
  return chamar<{ ok: boolean }>(`/v1/itens/${encodeURIComponent(itemId)}/foto`, { metodo: 'DELETE' });
}

/** T20 "Link da loja": nome, foto e preço da página (pode falhar). */
export function previaDoLink(url: string) {
  return chamar<{ titulo: string | null; preco: number | null; imagem: string | null }>('/v1/link/previa', { corpo: { url }, tempoMs: 12000 });
}

/** T20: usa a foto da página da loja como foto do item. */
export function fotoDoLink(itemId: string, url: string) {
  return chamar<{ foto: string }>(`/v1/itens/${encodeURIComponent(itemId)}/foto-do-link`, { corpo: { url }, tempoMs: 20000 });
}

// Etapa 5 ---------------------------------------------------------------------------------------

/** Mensagem para avisar um convidado cuja reserva foi cancelada pelo casal. */
export interface AvisoConvidado {
  nome: string;
  whatsapp: string | null;
  item: string;
  mensagem: string;
}

/** T39: publica a lista (o servidor confere o endereço). */
export function publicarLista(listaId: string) {
  return chamar<{ link: string }>(`/v1/listas/${encodeURIComponent(listaId)}/publicar`);
}

/** T24 "Excluir lista": cancela as reservas ativas e devolve os avisos aos convidados. */
export function excluirLista(listaId: string) {
  return chamar<{ avisos: AvisoConvidado[] }>(`/v1/listas/${encodeURIComponent(listaId)}/excluir`);
}

/** Tirar da lista item com reserva (T19, T24, T35): cancela as reservas e remove. */
export function removerDaLista(ids: string[]) {
  return chamar<{ avisos: AvisoConvidado[] }>('/v1/lista-itens/remover', { corpo: { ids } });
}

/** Cancelar uma reserva pelo casal (13.5). */
export function cancelarReserva(reservaId: string) {
  return chamar<{ aviso: AvisoConvidado }>(`/v1/reservas/${encodeURIComponent(reservaId)}/cancelar`);
}
