import { randomInt } from 'node:crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { CLAIM_CASAL, PREFERENCIAS_PADRAO, caminhos, type ConviteParceiro } from '@lartie/modelo';
import type { DadosToken } from './conta';
import { auth, db } from './firebase';

// Convite do parceiro(a) (T11, T66, T53 e 13.7): código de uso único, válido por 7 dias, um parceiro
// por casal. Quem aceita entra no casal como noivo_2 e pula o onboarding; o noivo_1 recebe o aviso.

export const VALIDADE_CONVITE_DIAS = 7;
/** Sem 0/O, 1/I/L: fácil de ler e digitar. 31^6 ≈ 887 milhões de combinações. */
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const TAMANHO_CODIGO = 6;

export class ErroConvite extends Error {
  constructor(
    readonly codigo: 'nao_encontrado' | 'expirado' | 'usado' | 'proprio_casal' | 'casal_completo' | 'sem_permissao',
  ) {
    super(codigo);
  }
}

export function gerarCodigo(): string {
  return Array.from({ length: TAMANHO_CODIGO }, () => ALFABETO[randomInt(ALFABETO.length)]).join('');
}

const refConvite = (codigo: string) => db.doc(`convites_parceiro/${codigo.toUpperCase()}`);

function situacao(c: ConviteParceiro, agora = Date.now()): 'valido' | 'expirado' | 'usado' {
  if (c.status === 'aceito' || c.status === 'cancelado') return 'usado';
  if (c.status === 'expirado' || c.expira_em.toDate().getTime() <= agora) return 'expirado';
  return 'valido';
}

async function existeParceiro(casalId: string) {
  const r = await db.collection('usuarios').where('casal_id', '==', casalId).where('papel', '==', 'noivo_2').limit(1).get();
  return !r.empty;
}

/** T11: cria o convite do casal, ou devolve o pendente ainda válido. */
export async function criarConvite(token: DadosToken, casalId: string) {
  const usuario = (await db.doc(caminhos.usuario(token.uid)).get()).data();
  if (usuario?.casal_id !== casalId || usuario?.papel !== 'noivo_1') throw new ErroConvite('sem_permissao');
  if (await existeParceiro(casalId)) throw new ErroConvite('casal_completo');

  const pendentes = await db
    .collection('convites_parceiro')
    .where('casal_id', '==', casalId)
    .where('status', '==', 'pendente')
    .get();
  const valido = pendentes.docs.find((d) => situacao(d.data() as ConviteParceiro) === 'valido');
  if (valido) {
    const c = valido.data() as ConviteParceiro;
    return { codigo: valido.id, expira_em: c.expira_em.toDate().toISOString() };
  }

  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const codigo = gerarCodigo();
    const expira = Timestamp.fromMillis(Date.now() + VALIDADE_CONVITE_DIAS * 86_400_000);
    try {
      await refConvite(codigo).create({
        casal_id: casalId,
        codigo,
        email: null,
        criado_por: token.uid,
        aceito_por: null,
        criado_em: FieldValue.serverTimestamp(),
        expira_em: expira,
        status: 'pendente',
      });
      return { codigo, expira_em: expira.toDate().toISOString() };
    } catch {
      // Código já usado por outro convite: tenta outro.
    }
  }
  throw new Error('Não foi possível criar o convite');
}

/** T66 (sem login): quem convidou e se o convite ainda vale. */
export async function consultarConvite(codigo: string) {
  const doc = await refConvite(codigo).get();
  if (!doc.exists) throw new ErroConvite('nao_encontrado');
  const c = doc.data() as ConviteParceiro;
  const casal = (await db.doc(caminhos.casal(c.casal_id)).get()).data();
  return { situacao: situacao(c), nome_1: (casal?.nome_1 as string) ?? '', nome_2: (casal?.nome_2 as string | null) ?? null };
}

/** T66 → T03/T04: entra no casal como noivo_2. */
export async function aceitarConvite(token: DadosToken, codigo: string, nomeDigitado?: string) {
  const ref = refConvite(codigo);
  const resultado = await db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    if (!doc.exists) throw new ErroConvite('nao_encontrado');
    const c = doc.data() as ConviteParceiro;
    const s = situacao(c);
    if (s === 'usado') {
      if (c.aceito_por === token.uid) return { casal_id: c.casal_id, nome: '', noivo1: c.criado_por, repetido: true };
      throw new ErroConvite('usado');
    }
    if (s === 'expirado') throw new ErroConvite('expirado');
    if (c.criado_por === token.uid) throw new ErroConvite('proprio_casal');

    const parceiros = await tx.get(
      db.collection('usuarios').where('casal_id', '==', c.casal_id).where('papel', '==', 'noivo_2').limit(1),
    );
    if (!parceiros.empty) throw new ErroConvite('casal_completo');

    const refUsuario = db.doc(caminhos.usuario(token.uid));
    const existente = await tx.get(refUsuario);
    const nome = (nomeDigitado?.trim() || token.name?.trim() || token.email?.split('@')[0] || 'Parceiro(a)').slice(0, 40);
    const agora = FieldValue.serverTimestamp();
    tx.set(
      refUsuario,
      {
        casal_id: c.casal_id,
        nome,
        email: token.email ?? '',
        provedor_login: ({ password: 'email', 'google.com': 'google', 'apple.com': 'apple' } as Record<string, string>)[token.provedor] ?? 'email',
        papel: 'noivo_2',
        preferencias_notificacao: existente.get('preferencias_notificacao') ?? PREFERENCIAS_PADRAO,
        tokens_push: existente.get('tokens_push') ?? [],
        ...(existente.exists ? {} : { criado_em: agora }),
        atualizado_em: agora,
      },
      { merge: true },
    );
    tx.update(ref, { status: 'aceito', aceito_por: token.uid });
    // Aviso para quem convidou (Seção 12, "Parceiro entrou"; o push vem na Etapa 9).
    tx.set(db.collection(caminhos.subcolecao(c.casal_id, 'notificacoes')).doc(), {
      usuario_id: c.criado_por,
      tipo: 'parceiro_entrou',
      texto: `${nome} entrou no plano de vocês.`,
      destino: 'inicio',
      lida: false,
      criada_em: agora,
    });
    return { casal_id: c.casal_id, nome, noivo1: c.criado_por, repetido: false };
  });

  const atual = (await auth.getUser(token.uid)).customClaims ?? {};
  if (atual[CLAIM_CASAL] !== resultado.casal_id) {
    await auth.setCustomUserClaims(token.uid, { ...atual, [CLAIM_CASAL]: resultado.casal_id });
  }
  return { casal_id: resultado.casal_id };
}
