// Etapa 3 nos emuladores: troca de modo (13.9), remover parceiro (T43), excluir conta (T42) e
// contrato do fornecedor (T17).
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

const IMOVEL = { tipo: 'apartamento', quartos: 2, banheiros: 1, posse: 'alugado', mobiliado: 'nao', data_mudanca: null, tem_pets: false, moradores: 2 };
const CASAMENTO = {
  nome_2: 'Pedro',
  data_casamento: '2027-12-18',
  cidade: 'Curitiba',
  uf: 'PR',
  estilo: 'civil_religioso',
  num_convidados_previsto: 140,
  orcamento_total: 6_000_000,
};

/** Ana (noivo_1) com o plano só do casamento gerado e Pedro conectado pelo convite. */
async function casalComParceiro() {
  const ana = await contaComCasal('ana@ex.com', 'Ana');
  await db.doc(`casais/${ana.casalId}`).update({ ...CASAMENTO, modo_app: 'casamento' });
  expect((await chamar('POST', '/v1/plano/gerar', ana.token)).statusCode).toBe(200);
  const { codigo } = (await chamar('POST', '/v1/convites', ana.token)).json();
  const pedro = await auth.createUser({ email: 'pedro@ex.com', password: 'senha-forte-123', displayName: 'Pedro' });
  expect((await chamar('POST', `/v1/convites/${codigo}/aceitar`, await entrar('pedro@ex.com'))).statusCode).toBe(200);
  return { ana, pedro: { uid: pedro.uid, token: await entrar('pedro@ex.com') } };
}

beforeEach(limpar);
afterAll(() => app.close());

describe('aceitar o convite grava o parceiro no casal', () => {
  it('casal.parceiro mostra quem entrou', async () => {
    const { ana, pedro } = await casalComParceiro();
    expect((await db.doc(`casais/${ana.casalId}`).get()).get('parceiro')).toEqual({ uid: pedro.uid, nome: 'Pedro' });
  });
});

describe('POST /v1/casal/modo (13.9)', () => {
  it('ativar a casa pela primeira vez gera o enxoval, troca o modo e avisa o parceiro', async () => {
    const { ana, pedro } = await casalComParceiro();
    await db.doc(`casais/${ana.casalId}/imovel/principal`).set(IMOVEL);
    const tarefasAntes = (await db.collection(`casais/${ana.casalId}/tarefas`).get()).size;

    const r = await chamar('POST', '/v1/casal/modo', ana.token, { modo: 'os_dois', origem: 'cartao' });
    expect(r.statusCode).toBe(200);
    expect(r.json().resumo.casa.comodos).toBeGreaterThan(0);

    const casal = (await db.doc(`casais/${ana.casalId}`).get()).data()!;
    expect(casal.modo_app).toBe('os_dois');
    expect(casal.modo_alterado_por).toBe(ana.uid);
    expect(casal.modulos_gerados).toEqual({ casamento: true, casa: true });
    // Regra 1: nada do casamento foi apagado ou duplicado.
    expect((await db.collection(`casais/${ana.casalId}/tarefas`).get()).size).toBe(tarefasAntes);

    const avisos = (await db.collection(`casais/${ana.casalId}/notificacoes`).where('tipo', '==', 'modo_alterado').get()).docs.map((d) => d.data());
    expect(avisos).toEqual([
      expect.objectContaining({ usuario_id: pedro.uid, texto: 'Ana mudou o app para “Casamento e casa nova”.', destino: 'T12', lida: false }),
    ]);
  });

  it('esconder e reexibir não apaga nada (fluxo 14)', async () => {
    const { ana } = await casalComParceiro();
    await db.doc(`casais/${ana.casalId}/tarefas/T001`).update({ status: 'concluida' });
    await db.doc(`casais/${ana.casalId}/imovel/principal`).set(IMOVEL);
    expect((await chamar('POST', '/v1/casal/modo', ana.token, { modo: 'casa' })).statusCode).toBe(200);
    expect((await chamar('POST', '/v1/casal/modo', ana.token, { modo: 'os_dois' })).statusCode).toBe(200);
    expect((await db.doc(`casais/${ana.casalId}/tarefas/T001`).get()).get('status')).toBe('concluida');
    expect((await db.doc(`casais/${ana.casalId}`).get()).get('modo_app')).toBe('os_dois');
  });

  it('sem os dados do módulo novo, não troca o modo', async () => {
    const { ana } = await casalComParceiro();
    const r = await chamar('POST', '/v1/casal/modo', ana.token, { modo: 'os_dois' });
    expect(r.statusCode).toBe(400);
    expect((await db.doc(`casais/${ana.casalId}`).get()).get('modo_app')).toBe('casamento');
  });

  it('recusa modo inválido e quem não tem casal', async () => {
    const { ana } = await casalComParceiro();
    expect((await chamar('POST', '/v1/casal/modo', ana.token, { modo: 'festa' })).statusCode).toBe(400);
    await auth.createUser({ email: 'sem@ex.com', password: 'senha-forte-123' });
    expect((await chamar('POST', '/v1/casal/modo', await entrar('sem@ex.com'), { modo: 'casa' })).statusCode).toBe(403);
  });
});

describe('DELETE /v1/casal/parceiro (T43)', () => {
  it('revoga o acesso do parceiro sem apagar dados', async () => {
    const { ana, pedro } = await casalComParceiro();
    const tarefas = (await db.collection(`casais/${ana.casalId}/tarefas`).get()).size;
    expect((await chamar('DELETE', '/v1/casal/parceiro', pedro.token)).statusCode).toBe(403);

    const r = await chamar('DELETE', '/v1/casal/parceiro', ana.token);
    expect(r.json()).toEqual({ removido: true });
    expect((await auth.getUser(pedro.uid)).customClaims ?? {}).toEqual({});
    expect((await db.doc(`usuarios/${pedro.uid}`).get()).data()).toMatchObject({ casal_id: null, papel: null, removido_do_plano: { nome: 'Ana' } });
    expect((await db.doc(`casais/${ana.casalId}`).get()).get('parceiro')).toBeNull();
    expect((await db.collection(`casais/${ana.casalId}/tarefas`).get()).size).toBe(tarefas);

    // Depois de removido, um novo convite pode ser criado.
    expect((await chamar('POST', '/v1/convites', ana.token)).statusCode).toBe(200);
  });
});

describe('DELETE /v1/conta (T42)', () => {
  it('apaga o casal, o endereço, a conta de quem pediu e encerra a sessão do parceiro', async () => {
    const { ana, pedro } = await casalComParceiro();
    const slug = (await db.doc(`casais/${ana.casalId}`).get()).get('slug');
    expect(slug).toBeTruthy();

    expect((await chamar('DELETE', '/v1/conta', ana.token)).statusCode).toBe(200);
    expect((await db.doc(`casais/${ana.casalId}`).get()).exists).toBe(false);
    expect((await db.collection(`casais/${ana.casalId}/tarefas`).get()).size).toBe(0);
    expect((await db.doc(`slugs/${slug}`).get()).exists).toBe(false);
    expect((await db.doc(`usuarios/${ana.uid}`).get()).exists).toBe(false);
    expect((await db.doc(`usuarios/${pedro.uid}`).get()).exists).toBe(false);
    await expect(auth.getUser(ana.uid)).rejects.toThrow();
    const p = await auth.getUser(pedro.uid);
    expect(p.customClaims ?? {}).toEqual({});
    expect(p.tokensValidAfterTime).toBeTruthy();
  });
});

describe('contrato do fornecedor (T17)', () => {
  const PDF = Buffer.from('%PDF-1.4\n%lartie\n');

  function multipart(conteudo: Buffer, tipo: string) {
    const fronteira = '----lartie';
    const corpo = Buffer.concat([
      Buffer.from(`--${fronteira}\r\nContent-Disposition: form-data; name="contrato"; filename="contrato.pdf"\r\nContent-Type: ${tipo}\r\n\r\n`),
      conteudo,
      Buffer.from(`\r\n--${fronteira}--\r\n`),
    ]);
    return { corpo, tipo: `multipart/form-data; boundary=${fronteira}` };
  }

  it('anexa um PDF, abre por link assinado e remove', async () => {
    const ana = await contaComCasal('ana@ex.com', 'Ana');
    await db.doc(`casais/${ana.casalId}/fornecedores/f1`).set({ nome: 'Studio Luz', categoria: 'casamento_foto_video', status: 'negociando', valor: 780_000, contrato: null });
    const m = multipart(PDF, 'application/pdf');
    const envio = await app.inject({
      method: 'POST',
      url: '/v1/fornecedores/f1/contrato',
      headers: { authorization: `Bearer ${ana.token}`, 'content-type': m.tipo },
      payload: m.corpo,
    });
    expect(envio.statusCode).toBe(200);
    const { contrato } = envio.json();
    expect(contrato).toMatch(/\.pdf$/);

    expect((await app.inject({ method: 'GET', url: contrato })).statusCode).toBe(401);
    const { link } = (await chamar('POST', '/v1/arquivos/link', ana.token, { caminho: contrato })).json();
    const aberto = await app.inject({ method: 'GET', url: link });
    expect(aberto.statusCode).toBe(200);
    expect(aberto.headers['content-type']).toContain('application/pdf');
    expect((await app.inject({ method: 'GET', url: link.replace(/assinatura=./, 'assinatura=0') })).statusCode).toBe(401);

    // Link para arquivo de outro casal: recusado.
    expect((await chamar('POST', '/v1/arquivos/link', ana.token, { caminho: '/v1/arquivos/outro/x.pdf' })).statusCode).toBe(404);

    expect((await chamar('DELETE', '/v1/fornecedores/f1/contrato', ana.token)).statusCode).toBe(200);
    expect((await db.doc(`casais/${ana.casalId}/fornecedores/f1`).get()).get('contrato')).toBeNull();
  });

  it('recusa tipo inválido', async () => {
    const ana = await contaComCasal('ana@ex.com', 'Ana');
    await db.doc(`casais/${ana.casalId}/fornecedores/f1`).set({ nome: 'X', categoria: 'c', status: 'pesquisando', valor: null, contrato: null });
    const m = multipart(Buffer.from('oi'), 'text/plain');
    const r = await app.inject({
      method: 'POST',
      url: '/v1/fornecedores/f1/contrato',
      headers: { authorization: `Bearer ${ana.token}`, 'content-type': m.tipo },
      payload: m.corpo,
    });
    expect(r.json().erro).toBe('tipo_invalido');
  });
});
