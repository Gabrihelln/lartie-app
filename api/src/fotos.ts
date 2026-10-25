import { randomUUID } from 'node:crypto';
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
const TIPOS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/heic': 'heic' };
const NOME_ARQUIVO = /^[0-9a-f-]{36}\.(jpg|png|heic)$/;

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

/** T06: grava a foto do casal e aponta casal.foto para ela. */
export async function salvarFotoCasal(uid: string, casalId: string, conteudo: Buffer, tipo: string) {
  const extensao = TIPOS[tipo];
  if (!extensao) throw new ErroArquivo('tipo_invalido');
  if (conteudo.length > TAMANHO_MAXIMO) throw new ErroArquivo('grande_demais');
  const nome = `${randomUUID()}.${extensao}`;
  await mkdir(resolve(PASTA_ARQUIVOS, casalId), { recursive: true });
  await writeFile(caminhoNoDisco(casalId, nome), conteudo);
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
