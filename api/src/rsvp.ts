import { randomBytes } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { caminhos, PRESENCAS, RESTRICOES, type Casal, type Convidado, type Grupo, type ListaPresentes } from '@lartie/modelo';
import { hojeLocal, prazoEncerrado, textoRsvpRespondido, validarRespostas } from '@lartie/regras';
import { ErroValidacao } from './conta';
import { db } from './firebase';

// Convidados e RSVP (Etapa 6, 13.6). O servidor guarda o token de cada grupo (tokens_rsvp/{token},
// fora do alcance do app e dos convidados) e grava as respostas da página pública (T30), que não
// tem login. Cada resposta avisa o casal (Seção 12, "RSVP respondido").

export class ErroRsvp extends Error {
  constructor(readonly codigo: 'nao_encontrado' | 'prazo_encerrado' | 'respostas_incompletas') {
    super(codigo);
  }
}

/** Token do link de RSVP de cada grupo (cria na primeira vez). Usado no T29 e no T38. */
export async function tokensDosGrupos(casalId: string, ids: string[]) {
  const resultado: Record<string, string> = {};
  for (const id of ids.slice(0, 200)) {
    const grupo = await db.doc(caminhos.documento(casalId, 'grupos', id)).get();
    if (!grupo.exists) continue;
    const existente = await db.collection('tokens_rsvp').where('casal_id', '==', casalId).where('grupo_id', '==', id).limit(1).get();
    if (existente.docs[0]) {
      resultado[id] = existente.docs[0].id;
      continue;
    }
    const token = randomBytes(15).toString('base64url');
    await db.doc(`tokens_rsvp/${token}`).set({ casal_id: casalId, grupo_id: id, criado_em: FieldValue.serverTimestamp() });
    resultado[id] = token;
  }
  return { tokens: resultado };
}

async function abrir(token: string) {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) throw new ErroRsvp('nao_encontrado');
  const t = (await db.doc(`tokens_rsvp/${token}`).get()).data();
  if (!t) throw new ErroRsvp('nao_encontrado');
  const casalId = t.casal_id as string;
  const grupoId = t.grupo_id as string;
  const [casal, grupo] = await Promise.all([db.doc(caminhos.casal(casalId)).get(), db.doc(caminhos.documento(casalId, 'grupos', grupoId)).get()]);
  if (!casal.exists || !grupo.exists) throw new ErroRsvp('nao_encontrado');
  const pessoas = await db.collection(caminhos.subcolecao(casalId, 'convidados')).where('grupo_id', '==', grupoId).get();
  return { casalId, grupoId, casal: casal.data() as Casal, grupo: grupo.data() as Grupo, pessoas: pessoas.docs };
}

/** T30: o que a página de confirmação mostra. Depois do prazo, só leitura. */
export async function paginaRsvp(token: string, hoje = hojeLocal()) {
  const { casalId, casal, grupo, pessoas } = await abrir(token);
  const listaCasamento = await db
    .collection(caminhos.subcolecao(casalId, 'listas_presentes'))
    .where('ocasiao', '==', 'casamento')
    .where('status', '==', 'publicada')
    .limit(1)
    .get();
  const lista = listaCasamento.docs[0]?.data() as ListaPresentes | undefined;
  return {
    casal: { nome_1: casal.nome_1, nome_2: casal.parceiro?.nome ?? casal.nome_2 },
    data: casal.data_casamento,
    horario: casal.horario_casamento ?? null,
    local: casal.local_casamento ?? null,
    cidade: casal.cidade,
    uf: casal.uf,
    prazo: casal.rsvp_prazo,
    encerrado: prazoEncerrado(casal.rsvp_prazo, hoje),
    grupo: grupo.nome,
    recado: grupo.recado ?? null,
    respondido: !!grupo.respondido_em,
    pessoas: pessoas
      .map((d) => {
        const c = d.data() as Convidado;
        return { id: d.id, nome: c.nome, faixa: c.faixa, presenca: c.presenca, restricao: c.restricao_alimentar, restricao_outra: c.restricao_outra };
      })
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    lista: lista && casal.slug ? { slug: casal.slug, slug_lista: lista.slug_lista } : null,
  };
}

export interface RespostaRsvp {
  respostas: { id: string; presenca: string; restricao?: string; restricao_outra?: string | null }[];
  recado?: string | null;
}

/** T30 "Enviar confirmação": grava as respostas de todas as pessoas do grupo e avisa o casal. */
export async function responderRsvp(token: string, r: RespostaRsvp, hoje = hojeLocal()) {
  const { casalId, grupoId, casal, grupo, pessoas } = await abrir(token);
  if (prazoEncerrado(casal.rsvp_prazo, hoje)) throw new ErroRsvp('prazo_encerrado');
  const porId = new Map(r.respostas.map((x) => [x.id, x]));
  const respostas = pessoas.map((d) => porId.get(d.id));
  if (validarRespostas(respostas.map((x) => ({ presenca: (x?.presenca ?? 'sem_resposta') as Convidado['presenca'] })), pessoas.length)) {
    throw new ErroRsvp('respostas_incompletas');
  }
  for (const x of respostas) {
    if (!x || !(PRESENCAS as readonly string[]).includes(x.presenca)) throw new ErroValidacao('Resposta inválida.');
    if (x.restricao && !(RESTRICOES as readonly string[]).includes(x.restricao)) throw new ErroValidacao('Restrição inválida.');
  }
  const agora = FieldValue.serverTimestamp();
  const lote = db.batch();
  for (const d of pessoas) {
    const x = porId.get(d.id)!;
    const vai = x.presenca === 'vai';
    lote.update(d.ref, {
      presenca: x.presenca,
      restricao_alimentar: vai ? x.restricao ?? 'nenhuma' : 'nenhuma',
      restricao_outra: vai && x.restricao === 'outra' ? (x.restricao_outra ?? '').trim().slice(0, 80) || null : null,
      atualizado_por: 'convidado',
      atualizado_em: agora,
    });
  }
  const recado = r.recado?.trim().slice(0, 500) || null;
  lote.update(db.doc(caminhos.documento(casalId, 'grupos', grupoId)), { recado, respondido_em: agora, atualizado_por: 'convidado', atualizado_em: agora });
  const vao = respostas.filter((x) => x!.presenca === 'vai').length;
  lote.set(db.collection(caminhos.subcolecao(casalId, 'notificacoes')).doc(), {
    usuario_id: null,
    tipo: 'rsvp_respondido',
    texto: textoRsvpRespondido(grupo.nome, vao, pessoas.length),
    destino: 'convidados',
    lida: false,
    criada_em: agora,
  });
  await lote.commit();
  return { vao, total: pessoas.length };
}
