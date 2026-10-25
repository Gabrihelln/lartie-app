// Etapa 2 nos emuladores: geração do plano, convite do parceiro e foto do casal.
import { Timestamp } from 'firebase-admin/firestore';
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

/** Conta nova + casal (como no T03) e um token que já traz o claim casal_id. */
async function contaComCasal(email: string, nome: string) {
  const u = await auth.createUser({ email, password: 'senha-forte-123' });
  const t0 = await entrar(email);
  const { casal_id } = (
    await app.inject({ method: 'POST', url: '/v1/conta/inicializar', headers: { authorization: `Bearer ${t0}` }, payload: { nome } })
  ).json();
  return { uid: u.uid, casalId: casal_id as string, token: await entrar(email) };
}

const post = (url: string, token: string | null, payload?: object) =>
  app.inject({ method: 'POST', url, headers: token ? { authorization: `Bearer ${token}` } : {}, payload });

async function prepararCasal(casalId: string, campos: Record<string, unknown>, imovel?: Record<string, unknown>) {
  await db.doc(`casais/${casalId}`).update(campos);
  if (imovel) await db.doc(`casais/${casalId}/imovel/principal`).set(imovel);
}

const IMOVEL = { tipo: 'apartamento', quartos: 2, banheiros: 1, posse: 'alugado', mobiliado: 'nao', data_mudanca: null, tem_pets: true, moradores: 2 };
const CASAMENTO = {
  nome_2: 'Pedro',
  data_casamento: '2027-12-18',
  cidade: 'Curitiba',
  uf: 'PR',
  estilo: 'civil_religioso',
  num_convidados_previsto: 140,
  orcamento_total: 6_000_000,
};

beforeEach(limpar);
afterAll(() => app.close());

describe('POST /v1/plano/gerar', () => {
  it('modo os_dois: checklist, enxoval, categorias dos dois e o endereço público', async () => {
    const { casalId, token } = await contaComCasal('ana@ex.com', 'Ana');
    await prepararCasal(casalId, { ...CASAMENTO, modo_app: 'os_dois', onboarding_respostas: { ja_mora_sozinho: true, ja_temos: ['Geladeira'] } }, IMOVEL);
    const r = await post('/v1/plano/gerar', token);
    expect(r.statusCode).toBe(200);
    const resumo = r.json();
    expect(resumo.slug).toBe('ana-e-pedro');
    expect(resumo.casamento.tarefas).toBeGreaterThan(40);
    expect(resumo.casamento.fases).toBe(5);
    expect(resumo.casa).toMatchObject({ comodos: 8, pets: true, clima: 'frio' });
    expect(resumo.casa.ja_marcados).toBe(1);

    expect((await db.collection(`casais/${casalId}/tarefas`).get()).size).toBe(resumo.casamento.tarefas);
    expect((await db.collection(`casais/${casalId}/itens`).get()).size).toBe(resumo.casa.itens);
    expect((await db.collection(`casais/${casalId}/categorias_orcamento`).get()).size).toBe(12);
    const geladeira = (await db.doc(`casais/${casalId}/itens/cozinha_I001`).get()).data()!;
    expect(geladeira).toMatchObject({ estado: 'ja_tenho', origem: 'ja_era_nosso', gerado_pelo_plano: true });
    const casal = (await db.doc(`casais/${casalId}`).get()).data()!;
    expect(casal.modulos_gerados).toEqual({ casamento: true, casa: true });
    expect((await db.doc('slugs/ana-e-pedro').get()).get('casal_id')).toBe(casalId);
  });

  it('modo casamento: só checklist e orçamento do casamento', async () => {
    const { casalId, token } = await contaComCasal('bia@ex.com', 'Bia');
    await prepararCasal(casalId, { ...CASAMENTO, nome_2: 'Caio', modo_app: 'casamento' });
    const resumo = (await post('/v1/plano/gerar', token)).json();
    expect(resumo.casa).toBeNull();
    expect((await db.collection(`casais/${casalId}/itens`).get()).size).toBe(0);
    expect((await db.collection(`casais/${casalId}/categorias_orcamento`).get()).size).toBe(8);
    expect((await db.doc(`casais/${casalId}`).get()).get('modulos_gerados')).toEqual({ casamento: true, casa: false });
  });

  it('modo casa: só enxoval e categorias da casa', async () => {
    const { casalId, token } = await contaComCasal('carla@ex.com', 'Carla');
    await prepararCasal(casalId, { nome_2: 'Davi', cidade: 'Fortaleza', uf: 'CE', modo_app: 'casa' }, { ...IMOVEL, tem_pets: false });
    const resumo = (await post('/v1/plano/gerar', token)).json();
    expect(resumo.casamento).toBeNull();
    expect(resumo.casa.clima).toBe('quente');
    expect((await db.collection(`casais/${casalId}/tarefas`).get()).size).toBe(0);
    expect((await db.collection(`casais/${casalId}/categorias_orcamento`).get()).size).toBe(4);
  });

  it('gerar de novo não duplica e não apaga o que o casal mudou', async () => {
    const { casalId, token } = await contaComCasal('duda@ex.com', 'Duda');
    await prepararCasal(casalId, { ...CASAMENTO, nome_2: 'Edu', modo_app: 'os_dois' }, IMOVEL);
    const primeiro = (await post('/v1/plano/gerar', token)).json();
    await db.doc(`casais/${casalId}/tarefas/T001`).update({ status: 'concluida' });
    const segundo = (await post('/v1/plano/gerar', token)).json();
    expect(segundo.casamento.tarefas).toBe(primeiro.casamento.tarefas);
    expect((await db.collection(`casais/${casalId}/tarefas`).get()).size).toBe(primeiro.casamento.tarefas);
    expect((await db.doc(`casais/${casalId}/tarefas/T001`).get()).get('status')).toBe('concluida');
  });

  it('endereço já usado por outro casal ganha sufixo', async () => {
    const a = await contaComCasal('ana1@ex.com', 'Ana');
    const b = await contaComCasal('ana2@ex.com', 'Ana');
    for (const c of [a, b]) await prepararCasal(c.casalId, { ...CASAMENTO, modo_app: 'casamento' });
    expect((await post('/v1/plano/gerar', a.token)).json().slug).toBe('ana-e-pedro');
    expect((await post('/v1/plano/gerar', b.token)).json().slug).toBe('ana-e-pedro-2');
  });

  it('recusa sem os dados do T07 e sem casal', async () => {
    const { casalId, token } = await contaComCasal('eva@ex.com', 'Eva');
    await prepararCasal(casalId, { modo_app: 'casamento' });
    expect((await post('/v1/plano/gerar', token)).statusCode).toBe(400);
    await auth.createUser({ email: 'sem@ex.com', password: 'senha-forte-123' });
    expect((await post('/v1/plano/gerar', await entrar('sem@ex.com'))).statusCode).toBe(403);
  });
});

describe('convite do parceiro', () => {
  it('cria, reaproveita o pendente, consulta sem login e o parceiro entra como noivo_2', async () => {
    const ana = await contaComCasal('ana@ex.com', 'Ana');
    await db.doc(`casais/${ana.casalId}`).update({ nome_2: 'Pedro' });
    const c1 = (await post('/v1/convites', ana.token)).json();
    expect(c1.codigo).toMatch(/^[A-Z2-9]{6}$/);
    expect((await post('/v1/convites', ana.token)).json().codigo).toBe(c1.codigo);

    const consulta = (await app.inject({ method: 'GET', url: `/v1/convites/${c1.codigo}` })).json();
    expect(consulta).toEqual({ situacao: 'valido', nome_1: 'Ana', nome_2: 'Pedro' });

    const pedro = await auth.createUser({ email: 'pedro@ex.com', password: 'senha-forte-123', displayName: 'Pedro' });
    const r = await post(`/v1/convites/${c1.codigo.toLowerCase()}/aceitar`, await entrar('pedro@ex.com'));
    expect(r.statusCode).toBe(200);
    expect(r.json()).toEqual({ casal_id: ana.casalId });
    expect((await auth.getUser(pedro.uid)).customClaims).toEqual({ casal_id: ana.casalId });
    expect((await db.doc(`usuarios/${pedro.uid}`).get()).data()).toMatchObject({ casal_id: ana.casalId, papel: 'noivo_2', nome: 'Pedro' });

    const avisos = await db.collection(`casais/${ana.casalId}/notificacoes`).get();
    expect(avisos.docs.map((d) => d.data())).toEqual([
      expect.objectContaining({ usuario_id: ana.uid, tipo: 'parceiro_entrou', texto: 'Pedro entrou no plano de vocês.', lida: false }),
    ]);
    expect((await app.inject({ method: 'GET', url: `/v1/convites/${c1.codigo}` })).json().situacao).toBe('usado');
  });

  it('convite usado, expirado, do próprio casal ou de casal completo é recusado (T53)', async () => {
    const ana = await contaComCasal('ana@ex.com', 'Ana');
    const { codigo } = (await post('/v1/convites', ana.token)).json();
    expect((await post(`/v1/convites/${codigo}/aceitar`, ana.token)).json().erro).toBe('proprio_casal');

    await auth.createUser({ email: 'pedro@ex.com', password: 'senha-forte-123' });
    await auth.createUser({ email: 'outro@ex.com', password: 'senha-forte-123' });
    expect((await post(`/v1/convites/${codigo}/aceitar`, await entrar('pedro@ex.com'))).statusCode).toBe(200);
    const usado = await post(`/v1/convites/${codigo}/aceitar`, await entrar('outro@ex.com'));
    expect([usado.statusCode, usado.json().erro]).toEqual([410, 'usado']);
    // Com o parceiro dentro, não dá para criar outro convite.
    expect((await post('/v1/convites', ana.token)).json().erro).toBe('casal_completo');

    const bia = await contaComCasal('bia@ex.com', 'Bia');
    await db.doc('convites_parceiro/VELHO2').set({
      casal_id: bia.casalId,
      codigo: 'VELHO2',
      email: null,
      criado_por: bia.uid,
      aceito_por: null,
      criado_em: Timestamp.now(),
      expira_em: Timestamp.fromMillis(Date.now() - 1000),
      status: 'pendente',
    });
    const expirado = await post('/v1/convites/VELHO2/aceitar', await entrar('outro@ex.com'));
    expect([expirado.statusCode, expirado.json().erro]).toEqual([410, 'expirado']);
    expect((await app.inject({ method: 'GET', url: '/v1/convites/NAOEXISTE' })).statusCode).toBe(404);
  });
});

describe('foto do casal', () => {
  const PNG = Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010806000000', 'hex');

  function multipart(conteudo: Buffer, tipo: string) {
    const fronteira = '----lartie';
    const corpo = Buffer.concat([
      Buffer.from(`--${fronteira}\r\nContent-Disposition: form-data; name="foto"; filename="foto.png"\r\nContent-Type: ${tipo}\r\n\r\n`),
      conteudo,
      Buffer.from(`\r\n--${fronteira}--\r\n`),
    ]);
    return { corpo, tipo: `multipart/form-data; boundary=${fronteira}` };
  }

  it('envia, o casal lê, outro casal não lê, e remove', async () => {
    const ana = await contaComCasal('ana@ex.com', 'Ana');
    const bia = await contaComCasal('bia@ex.com', 'Bia');
    const m = multipart(PNG, 'image/png');
    const envio = await app.inject({
      method: 'POST',
      url: '/v1/casal/foto',
      headers: { authorization: `Bearer ${ana.token}`, 'content-type': m.tipo },
      payload: m.corpo,
    });
    expect(envio.statusCode).toBe(200);
    const { foto } = envio.json();
    expect(foto).toMatch(new RegExp(`^/v1/arquivos/${ana.casalId}/[0-9a-f-]{36}\\.png$`));
    expect((await db.doc(`casais/${ana.casalId}`).get()).get('foto')).toBe(foto);

    const leitura = await app.inject({ method: 'GET', url: foto, headers: { authorization: `Bearer ${ana.token}` } });
    expect(leitura.statusCode).toBe(200);
    expect(leitura.rawPayload.equals(PNG)).toBe(true);
    expect((await app.inject({ method: 'GET', url: foto, headers: { authorization: `Bearer ${bia.token}` } })).statusCode).toBe(404);
    expect((await app.inject({ method: 'GET', url: foto })).statusCode).toBe(401);

    expect((await app.inject({ method: 'DELETE', url: '/v1/casal/foto', headers: { authorization: `Bearer ${ana.token}` } })).statusCode).toBe(200);
    expect((await db.doc(`casais/${ana.casalId}`).get()).get('foto')).toBeNull();
    expect((await app.inject({ method: 'GET', url: foto, headers: { authorization: `Bearer ${ana.token}` } })).statusCode).toBe(404);
  });

  it('recusa arquivo que não é imagem', async () => {
    const ana = await contaComCasal('ana@ex.com', 'Ana');
    const m = multipart(Buffer.from('oi'), 'text/plain');
    const r = await app.inject({
      method: 'POST',
      url: '/v1/casal/foto',
      headers: { authorization: `Bearer ${ana.token}`, 'content-type': m.tipo },
      payload: m.corpo,
    });
    expect([r.statusCode, r.json().erro]).toEqual([400, 'tipo_invalido']);
  });
});
