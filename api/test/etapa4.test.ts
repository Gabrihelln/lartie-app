// Etapa 4 nos emuladores: sair do plano (pedido do dono do produto), foto do item e link da loja (T20).
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

import { enderecoInterno, extrairPrevia, lerPreco } from '../src/link';

beforeEach(limpar);
afterAll(() => app.close());

describe('POST /v1/casal/sair', () => {
  it('quem entrou pelo convite sai; os dados ficam e quem criou o plano é avisado', async () => {
    const { ana, pedro } = await casalComParceiro();
    const tarefas = (await db.collection(`casais/${ana.casalId}/tarefas`).get()).size;
    expect((await chamar('POST', '/v1/casal/sair', ana.token)).statusCode).toBe(403);
    expect((await chamar('POST', '/v1/casal/sair', pedro.token)).json()).toEqual({ ok: true });
    expect((await auth.getUser(pedro.uid)).customClaims ?? {}).toEqual({});
    expect((await db.doc(`usuarios/${pedro.uid}`).get()).data()).toMatchObject({ casal_id: null, papel: null, removido_do_plano: null });
    expect((await db.doc(`casais/${ana.casalId}`).get()).get('parceiro')).toBeNull();
    expect((await db.collection(`casais/${ana.casalId}/tarefas`).get()).size).toBe(tarefas);
    const avisos = (await db.collection(`casais/${ana.casalId}/notificacoes`).where('tipo', '==', 'parceiro_saiu').get()).docs.map((d) => d.data());
    expect(avisos).toEqual([expect.objectContaining({ usuario_id: ana.uid, texto: 'Pedro saiu do plano de vocês.' })]);
  });
});

describe('foto do item (T20)', () => {
  const PNG = Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010806000000', 'hex');
  it('envia, aponta item.foto e remove', async () => {
    const ana = await contaComCasal('ana@ex.com', 'Ana');
    await db.doc(`casais/${ana.casalId}/itens/i1`).set({ nome: 'Geladeira', foto: null });
    const fronteira = '----lartie';
    const corpo = Buffer.concat([
      Buffer.from(`--${fronteira}\r\nContent-Disposition: form-data; name="foto"; filename="f.png"\r\nContent-Type: image/png\r\n\r\n`),
      PNG,
      Buffer.from(`\r\n--${fronteira}--\r\n`),
    ]);
    const r = await app.inject({
      method: 'POST',
      url: '/v1/itens/i1/foto',
      headers: { authorization: `Bearer ${ana.token}`, 'content-type': `multipart/form-data; boundary=${fronteira}` },
      payload: corpo,
    });
    expect(r.statusCode).toBe(200);
    expect((await db.doc(`casais/${ana.casalId}/itens/i1`).get()).get('foto')).toBe(r.json().foto);
    expect((await chamar('DELETE', '/v1/itens/i1/foto', ana.token)).statusCode).toBe(200);
    expect((await db.doc(`casais/${ana.casalId}/itens/i1`).get()).get('foto')).toBeNull();
  });
});

describe('link da loja (T20)', () => {
  it('lê nome, foto e preço de Open Graph e JSON-LD', () => {
    const html = `<html><head><title>X</title>
      <meta property="og:title" content="Geladeira Frost Free 375L &amp; Inox">
      <meta property="og:image" content="/img/geladeira.jpg">
      <meta property="product:price:amount" content="3199.90"></head></html>`;
    expect(extrairPrevia(html, 'https://loja.com.br/p/1')).toEqual({
      titulo: 'Geladeira Frost Free 375L & Inox',
      imagem: 'https://loja.com.br/img/geladeira.jpg',
      preco: 319990,
    });
    expect(extrairPrevia('<script>{"offers":{"price":"450"}}</script>', 'https://a.com').preco).toBe(45000);
    expect(extrairPrevia('<p>nada</p>', 'https://a.com')).toEqual({ titulo: null, imagem: null, preco: null });
  });

  it('preços em formato brasileiro e americano', () => {
    expect(lerPreco('R$ 3.199,90')).toBe(319990);
    expect(lerPreco('3,199.90')).toBe(319990);
    expect(lerPreco('1.400')).toBe(140000);
    expect(lerPreco('450,5')).toBe(45050);
    expect(lerPreco('')).toBeNull();
  });

  it('nunca acessa endereços internos', async () => {
    expect(['127.0.0.1', '10.1.2.3', '192.168.0.5', '172.20.1.1', '169.254.169.254', '::1', 'fd00::1', '::ffff:127.0.0.1'].every(enderecoInterno)).toBe(true);
    expect(['8.8.8.8', '2804:14c::1'].some(enderecoInterno)).toBe(false);
    const ana = await contaComCasal('ana@ex.com', 'Ana');
    expect((await chamar('POST', '/v1/link/previa', ana.token, { url: 'http://127.0.0.1:8080/' })).json()).toEqual({ erro: 'link_bloqueado' });
    expect((await chamar('POST', '/v1/link/previa', ana.token, { url: 'file:///etc/passwd' })).json()).toEqual({ erro: 'link_invalido' });
    expect((await chamar('POST', '/v1/link/previa', ana.token, { url: 'http://localhost:8100/health' })).json()).toEqual({ erro: 'link_bloqueado' });
  });
});
