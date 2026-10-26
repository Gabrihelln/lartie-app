import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FieldValue } from 'firebase-admin/firestore';
import { caminhos } from '@lartie/modelo';
import { db } from './firebase';

// Arquivos do casal (foto do casal no T06; fotos de itens e contratos nas próximas etapas), guardados
// em disco pela API: no Mac por enquanto e, depois do domínio, na VPS (/var/lib/lartie/arquivos).
// O app guarda em casal.foto o caminho relativo "/v1/arquivos/{casal}/{arquivo}" e busca com o token.

const aqui = dirname(fileURLToPath(import.meta.url));
export const PASTA_ARQUIVOS = process.env.ARQUIVOS_DIR ?? resolve(aqui, '../dados-locais/arquivos');

export const TAMANHO_MAXIMO = 5 * 1024 * 1024;
/** Contratos (T17) podem ser PDFs maiores que uma foto. */
export const TAMANHO_MAXIMO_CONTRATO = 10 * 1024 * 1024;
const TIPOS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/heic': 'heic', 'application/pdf': 'pdf' };
const TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/heic'];
const NOME_ARQUIVO = /^[0-9a-f-]{36}\.(jpg|png|heic|pdf)$/;

export class ErroArquivo extends Error {
  constructor(readonly codigo: 'tipo_invalido' | 'grande_demais' | 'nao_encontrado') {
    super(codigo);
  }
}

export function caminhoPublico(casalId: string, arquivo: string) {
  return `/v1/arquivos/${casalId}/${arquivo}`;
}

function caminhoNoDisco(casalId: string, arquivo: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(casalId) || !NOME_ARQUIVO.test(arquivo)) throw new ErroArquivo('nao_encontrado');
  return resolve(PASTA_ARQUIVOS, casalId, arquivo);
}

async function removerAnterior(casalId: string, foto: unknown) {
  if (typeof foto !== 'string') return;
  const nome = foto.split('/').pop() ?? '';
  try {
    await unlink(caminhoNoDisco(casalId, nome));
  } catch {
    // já não existia
  }
}

async function gravarNoDisco(casalId: string, conteudo: Buffer, tipo: string) {
  const nome = `${randomUUID()}.${TIPOS[tipo]}`;
  await mkdir(resolve(PASTA_ARQUIVOS, casalId), { recursive: true });
  await writeFile(caminhoNoDisco(casalId, nome), conteudo);
  return nome;
}

/** T06: grava a foto do casal e aponta casal.foto para ela. */
export async function salvarFotoCasal(uid: string, casalId: string, conteudo: Buffer, tipo: string) {
  if (!TIPOS_FOTO.includes(tipo)) throw new ErroArquivo('tipo_invalido');
  if (conteudo.length > TAMANHO_MAXIMO) throw new ErroArquivo('grande_demais');
  const nome = await gravarNoDisco(casalId, conteudo, tipo);
  const ref = db.doc(caminhos.casal(casalId));
  await removerAnterior(casalId, (await ref.get()).get('foto'));
  const foto = caminhoPublico(casalId, nome);
  await ref.update({ foto, atualizado_por: uid, atualizado_em: FieldValue.serverTimestamp() });
  return { foto };
}

export async function removerFotoCasal(uid: string, casalId: string) {
  const ref = db.doc(caminhos.casal(casalId));
  await removerAnterior(casalId, (await ref.get()).get('foto'));
  await ref.update({ foto: null, atualizado_por: uid, atualizado_em: FieldValue.serverTimestamp() });
}

export function abrirArquivo(casalId: string, arquivo: string) {
  const caminho = caminhoNoDisco(casalId, arquivo);
  if (!existsSync(caminho)) throw new ErroArquivo('nao_encontrado');
  const extensao = arquivo.split('.').pop()!;
  const tipo = Object.entries(TIPOS).find(([, e]) => e === extensao)?.[0] ?? 'application/octet-stream';
  return { fluxo: createReadStream(caminho), tipo };
}

/** T17 "Anexar contrato (PDF ou foto)": grava o arquivo e aponta fornecedor.contrato para ele. */
export async function salvarContrato(uid: string, casalId: string, fornecedorId: string, conteudo: Buffer, tipo: string) {
  if (!TIPOS[tipo]) throw new ErroArquivo('tipo_invalido');
  if (conteudo.length > TAMANHO_MAXIMO_CONTRATO) throw new ErroArquivo('grande_demais');
  const ref = db.doc(caminhos.documento(casalId, 'fornecedores', fornecedorId));
  const atual = await ref.get();
  if (!atual.exists) throw new ErroArquivo('nao_encontrado');
  const nome = await gravarNoDisco(casalId, conteudo, tipo);
  await removerAnterior(casalId, atual.get('contrato'));
  const contrato = caminhoPublico(casalId, nome);
  await ref.update({ contrato, atualizado_por: uid, atualizado_em: FieldValue.serverTimestamp() });
  return { contrato };
}

export async function removerContrato(uid: string, casalId: string, fornecedorId: string) {
  const ref = db.doc(caminhos.documento(casalId, 'fornecedores', fornecedorId));
  const atual = await ref.get();
  if (!atual.exists) throw new ErroArquivo('nao_encontrado');
  await removerAnterior(casalId, atual.get('contrato'));
  await ref.update({ contrato: null, atualizado_por: uid, atualizado_em: FieldValue.serverTimestamp() });
}

// Links assinados: o contrato abre no navegador do sistema (que não manda o token do app). O link
// vale por 10 minutos. O segredo vem de ARQUIVOS_SEGREDO; sem ele, um segredo novo a cada início.
const SEGREDO = process.env.ARQUIVOS_SEGREDO || randomBytes(32).toString('hex');
const VALIDADE_LINK_S = 10 * 60;

function assinar(casalId: string, arquivo: string, expira: number) {
  return createHmac('sha256', SEGREDO).update(`${casalId}/${arquivo}/${expira}`).digest('hex');
}

export function linkAssinado(casalId: string, caminho: string, agora = Date.now()) {
  const arquivo = caminho.split('/').pop() ?? '';
  caminhoNoDisco(casalId, arquivo);
  const expira = Math.floor(agora / 1000) + VALIDADE_LINK_S;
  return `${caminhoPublico(casalId, arquivo)}?expira=${expira}&assinatura=${assinar(casalId, arquivo, expira)}`;
}

export function assinaturaValida(casalId: string, arquivo: string, expira: string | undefined, assinatura: string | undefined) {
  const e = Number(expira);
  if (!assinatura || !Number.isInteger(e) || e < Date.now() / 1000) return false;
  const esperada = Buffer.from(assinar(casalId, arquivo, e));
  const recebida = Buffer.from(assinatura);
  return esperada.length === recebida.length && timingSafeEqual(esperada, recebida);
}
