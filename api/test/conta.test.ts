// Roda nos emuladores: npm run test:emulador -w @lartie/api
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { auth, db } from '../src/firebase';
import { escolherNome, ErroValidacao } from '../src/conta';
import { criarServidor } from '../src/servidor';

const app = criarServidor();
const AUTH = process.env.FIREBASE_AUTH_EMULATOR_HOST!;

async function limparEmuladores() {
  await fetch(`http://${AUTH}/emulator/v1/projects/demo-lartie/accounts`, { method: 'DELETE' });
  await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/demo-lartie/databases/(default)/documents`, {
    method: 'DELETE',
  });
}

/** Cria a conta no emulador e devolve um ID token, como o app faria depois de createUserWithEmailAndPassword. */
async function contaComToken(email: string, senha = 'senha-forte-123') {
  const r = await fetch(`http://${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=qualquer`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: senha, returnSecureToken: true }),
  });
  const corpo = (await r.json()) as { idToken: string; localId: string };
  return { uid: corpo.localId, idToken: corpo.idToken };
}

const inicializar = (idToken: string | null, body?: unknown) =>
  app.inject({
    method: 'POST',
    url: '/v1/conta/inicializar',
    headers: idToken ? { authorization: `Bearer ${idToken}` } : {},
    payload: body as object,
  });

beforeEach(limparEmuladores);
afterAll(() => app.close());

describe('POST /v1/conta/inicializar', () => {
  it('cria o casal vazio e o usuário noivo_1, e grava o claim casal_id', async () => {
    const { uid, idToken } = await contaComToken('ana@exemplo.com');
    const r = await inicializar(idToken, { nome: '  Ana  ' });
    expect(r.statusCode).toBe(200);
    const { casal_id, criado } = r.json();
    expect(criado).toBe(true);

    const casal = (await db.doc(`casais/${casal_id}`).get()).data()!;
    expect(casal).toMatchObject({
      nome_1: 'Ana',
      nome_2: null,
      modo_app: 'os_dois',
      onboarding_concluido: false,
      modulos_gerados: { casamento: false, casa: false },
      criado_por: uid,
    });
    const usuario = (await db.doc(`usuarios/${uid}`).get()).data()!;
    expect(usuario).toMatchObject({ casal_id, nome: 'Ana', papel: 'noivo_1', provedor_login: 'email', email: 'ana@exemplo.com' });
    expect((await auth.getUser(uid)).customClaims).toEqual({ casal_id });
  });

  it('é idempotente: chamar de novo devolve o mesmo casal, sem criar outro', async () => {
    const { idToken } = await contaComToken('pedro@exemplo.com');
    const primeiro = (await inicializar(idToken, { nome: 'Pedro' })).json();
    const segundo = (await inicializar(idToken, { nome: 'Pedro' })).json();
    expect(segundo).toEqual({ casal_id: primeiro.casal_id, criado: false });
    expect((await db.collection('casais').get()).size).toBe(1);
  });

  it('chamadas simultâneas não criam dois casais', async () => {
    const { idToken } = await contaComToken('bia@exemplo.com');
    const respostas = await Promise.all([inicializar(idToken, { nome: 'Bia' }), inicializar(idToken, { nome: 'Bia' })]);
    const ids = new Set(respostas.map((r) => r.json().casal_id));
    expect(ids.size).toBe(1);
    expect((await db.collection('casais').get()).size).toBe(1);
  });

  it('sem nome (login social), usa o início do e-mail', async () => {
    const { uid, idToken } = await contaComToken('carla.souza@exemplo.com');
    expect((await inicializar(idToken)).statusCode).toBe(200);
    expect((await db.doc(`usuarios/${uid}`).get()).get('nome')).toBe('carla.souza');
  });

  it('recusa nome fora de 2 a 40 caracteres', async () => {
    const { idToken } = await contaComToken('x@exemplo.com');
    expect((await inicializar(idToken, { nome: 'A' })).statusCode).toBe(400);
    expect((await inicializar(idToken, { nome: 'A'.repeat(41) })).statusCode).toBe(400);
  });

  it('exige um ID token válido', async () => {
    expect((await inicializar(null)).statusCode).toBe(401);
    expect((await inicializar('token-falso')).statusCode).toBe(401);
  });
});

describe('escolherNome', () => {
  const token = { uid: 'u', email: 'ana@exemplo.com', provedor: 'google.com' };
  it('prefere o nome digitado, depois o do provedor, depois o e-mail', () => {
    expect(escolherNome('Ana', token)).toBe('Ana');
    expect(escolherNome(undefined, { ...token, name: 'Ana Souza' })).toBe('Ana Souza');
    expect(escolherNome(undefined, token)).toBe('ana');
  });
  it('valida o tamanho do nome digitado', () => {
    expect(() => escolherNome(' ', token)).toThrow(ErroValidacao);
  });
});
