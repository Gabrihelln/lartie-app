import { FieldValue } from 'firebase-admin/firestore';
import { CLAIM_CASAL, PREFERENCIAS_PADRAO, caminhos, type ProvedorLogin } from '@lartie/modelo';
import { auth, db } from './firebase';

// Inicialização da conta (T03 "Criar conta" e primeiro login social em T03/T04):
// cria o usuário (papel noivo_1) e o casal vazio, e grava o claim casal_id no Firebase Auth.
// Idempotente: se o usuário já tem casal, só garante o claim e devolve o mesmo casal.
// A entrada como noivo_2 pelo convite do parceiro (T66) é da Etapa 2.

export interface DadosToken {
  uid: string;
  email?: string;
  name?: string;
  /** firebase.sign_in_provider do ID token: password, google.com, apple.com. */
  provedor: string;
}

export interface ResultadoConta {
  casal_id: string;
  criado: boolean;
}

export class ErroValidacao extends Error {}

const PROVEDORES: Record<string, ProvedorLogin> = { password: 'email', 'google.com': 'google', 'apple.com': 'apple' };

/** Nome do usuário: o digitado no T03 (2 a 40 caracteres), o do Google/Apple, ou o início do e-mail. */
export function escolherNome(digitado: string | undefined, token: DadosToken): string {
  if (digitado !== undefined) {
    const nome = digitado.trim();
    if (nome.length < 2 || nome.length > 40) throw new ErroValidacao('O nome precisa ter de 2 a 40 caracteres.');
    return nome;
  }
  const doProvedor = token.name?.trim();
  if (doProvedor) return doProvedor.slice(0, 40);
  const doEmail = token.email?.split('@')[0]?.trim();
  return doEmail ? doEmail.slice(0, 40) : 'Você';
}

export async function inicializarConta(token: DadosToken, nomeDigitado?: string): Promise<ResultadoConta> {
  const nome = escolherNome(nomeDigitado, token);
  const refUsuario = db.doc(caminhos.usuario(token.uid));

  const resultado = await db.runTransaction(async (tx) => {
    const usuario = await tx.get(refUsuario);
    const existente = usuario.get('casal_id');
    if (typeof existente === 'string' && existente) return { casal_id: existente, criado: false };

    const refCasal = db.collection('casais').doc();
    const agora = FieldValue.serverTimestamp();
    tx.set(refCasal, {
      nome_1: nome,
      nome_2: null,
      foto: null,
      data_casamento: null,
      cidade: null,
      uf: null,
      estilo: null,
      num_convidados_previsto: null,
      orcamento_total: null,
      slug: null,
      modo_app: 'os_dois',
      modo_alterado_em: null,
      modo_alterado_por: null,
      modulos_gerados: { casamento: false, casa: false },
      onboarding_concluido: false,
      onboarding_passo: 'T06',
      onboarding_respostas: null,
      cerimonia_religiosa: null,
      rsvp_prazo: null,
      buffet_valor_por_pessoa: null,
      criado_por: token.uid,
      criado_em: agora,
      atualizado_por: token.uid,
      atualizado_em: agora,
    });
    tx.set(refUsuario, {
      casal_id: refCasal.id,
      nome,
      email: token.email ?? '',
      provedor_login: PROVEDORES[token.provedor] ?? 'email',
      papel: 'noivo_1',
      preferencias_notificacao: PREFERENCIAS_PADRAO,
      tokens_push: [],
      criado_em: agora,
      atualizado_em: agora,
    });
    return { casal_id: refCasal.id, criado: true };
  });

  // O claim fica fora da transação (é do Auth). Se falhar, a próxima chamada grava de novo.
  const atual = (await auth.getUser(token.uid)).customClaims ?? {};
  if (atual[CLAIM_CASAL] !== resultado.casal_id) {
    await auth.setCustomUserClaims(token.uid, { ...atual, [CLAIM_CASAL]: resultado.casal_id });
  }
  return resultado;
}
