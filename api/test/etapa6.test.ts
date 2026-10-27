// Etapa 6 nos emuladores: tokens do RSVP, página pública (T30), respostas e prazo (13.6).
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { auth, db } from '../src/firebase';
import { criarServidor } from '../src/servidor';

const app = criarServidor();
const AUTH = process.env.FIREBASE_AUTH_EMULATOR_HOST!;

async function limpar() {
  await fetch(`http://${AUTH}/emulator/v1/projects/demo-lartie/accounts`, { method: 'DELETE' });
  await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/demo-lartie/databases/(default)/documents`, {
    method: 'DELETE',
  });
}

async function entrar(email: string, senha = 'senha-forte-123') {
  const r = await fetch(`http://${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=x`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: senha, returnSecureToken: true }),
  });
  return ((await r.json()) as { idToken: string }).idToken;
}

async function contaComCasal(email: string, nome: string) {
  const u = await auth.createUser({ email, password: 'senha-forte-123' });
  const t0 = await entrar(email);
  const { casal_id } = (
    await app.inject({ method: 'POST', url: '/v1/conta/inicializar', headers: { authorization: `Bearer ${t0}` }, payload: { nome } })
  ).json();
  return { uid: u.uid, casalId: casal_id as string, token: await entrar(email) };
}

const chamar = (method: 'POST' | 'DELETE', url: string, token: string | null, payload?: object) =>
  app.inject({ method, url, headers: token ? { authorization: `Bearer ${token}` } : {}, payload });

async function casalComGrupo() {
  const ana = await contaComCasal('ana@ex.com', 'Ana');
  await db.doc(`casais/${ana.casalId}`).update({ nome_2: 'Pedro', slug: 'ana-e-pedro', data_casamento: '2027-04-18', horario_casamento: '17:00', local_casamento: 'Espaço Jardim', cidade: 'Curitiba', uf: 'PR', rsvp_prazo: '2027-02-18' });
  await db.doc(`casais/${ana.casalId}/grupos/g1`).set({ nome: 'Família Souza', lado: 'noivo_1', tipo: 'familia', whatsapp: '41998123344', recado: null, respondido_em: null });
  for (const [id, nome] of [['c1', 'Marta Souza'], ['c2', 'Paulo Souza'], ['c3', 'Lucas Souza']]) {
    await db.doc(`casais/${ana.casalId}/convidados/${id}`).set({ grupo_id: 'g1', nome, faixa: id === 'c3' ? 'crianca' : 'adulto', presenca: 'sem_resposta', restricao_alimentar: 'nenhuma', restricao_outra: null });
  }
  const { tokens } = (await chamar('POST', '/v1/grupos/tokens', ana.token, { ids: ['g1', 'nao-existe'] })).json();
  return { ana, token: tokens.g1 as string, tokens };
}

beforeEach(limpar);
afterAll(() => app.close());

describe('RSVP (T29, T30, 13.6)', () => {
  it('o token é criado uma vez por grupo e só para grupos que existem', async () => {
    const { ana, token, tokens } = await casalComGrupo();
    expect(Object.keys(tokens)).toEqual(['g1']);
    expect((await chamar('POST', '/v1/grupos/tokens', ana.token, { ids: ['g1'] })).json().tokens.g1).toBe(token);
    expect((await chamar('POST', '/v1/grupos/tokens', null, { ids: ['g1'] })).statusCode).toBe(401);
  });

  it('a página mostra o casal, o grupo, o prazo e as pessoas; exige todas as respostas', async () => {
    const { ana, token } = await casalComGrupo();
    const pagina = (await app.inject({ method: 'GET', url: `/v1/publico/rsvp/${token}` })).json();
    expect(pagina).toMatchObject({ casal: { nome_1: 'Ana', nome_2: 'Pedro' }, horario: '17:00', local: 'Espaço Jardim', grupo: 'Família Souza', prazo: '2027-02-18', encerrado: false });
    expect(pagina.pessoas.map((p: { nome: string }) => p.nome)).toEqual(['Lucas Souza', 'Marta Souza', 'Paulo Souza']);

    const incompleta = await app.inject({ method: 'POST', url: `/v1/publico/rsvp/${token}`, payload: { respostas: [{ id: 'c1', presenca: 'vai' }] } });
    expect(incompleta.json()).toEqual({ erro: 'respostas_incompletas' });

    const ok = await app.inject({
      method: 'POST',
      url: `/v1/publico/rsvp/${token}`,
      payload: {
        respostas: [
          { id: 'c1', presenca: 'vai', restricao: 'vegano' },
          { id: 'c2', presenca: 'nao_vai', restricao: 'vegano' },
          { id: 'c3', presenca: 'vai', restricao: 'outra', restricao_outra: 'Amendoim' },
        ],
        recado: 'Felicidades!',
      },
    });
    expect(ok.json()).toEqual({ vao: 2, total: 3 });
    const c = (id: string) => db.doc(`casais/${ana.casalId}/convidados/${id}`).get().then((d) => d.data()!);
    expect(await c('c1')).toMatchObject({ presenca: 'vai', restricao_alimentar: 'vegano' });
    expect(await c('c2')).toMatchObject({ presenca: 'nao_vai', restricao_alimentar: 'nenhuma' });
    expect(await c('c3')).toMatchObject({ restricao_alimentar: 'outra', restricao_outra: 'Amendoim' });
    expect((await db.doc(`casais/${ana.casalId}/grupos/g1`).get()).get('recado')).toBe('Felicidades!');
    const aviso = (await db.collection(`casais/${ana.casalId}/notificacoes`).where('tipo', '==', 'rsvp_respondido').get()).docs[0]!.data();
    expect(aviso.texto).toBe('Família Souza confirmou presença: 2 de 3 pessoas.');
  });

  it('depois do prazo, só leitura', async () => {
    const { ana, token } = await casalComGrupo();
    await db.doc(`casais/${ana.casalId}`).update({ rsvp_prazo: '2020-01-01' });
    expect((await app.inject({ method: 'GET', url: `/v1/publico/rsvp/${token}` })).json().encerrado).toBe(true);
    const r = await app.inject({ method: 'POST', url: `/v1/publico/rsvp/${token}`, payload: { respostas: ['c1', 'c2', 'c3'].map((id) => ({ id, presenca: 'vai' })) } });
    expect(r.json()).toEqual({ erro: 'prazo_encerrado' });
  });

  it('token inválido', async () => {
    expect((await app.inject({ method: 'GET', url: '/v1/publico/rsvp/nao-existe-esse-token' })).statusCode).toBe(404);
  });
});
