// Etapa 5 nos emuladores: publicar, página pública, reserva atômica (com concorrência), desfazer,
// cancelar pelo casal, tirar da lista, excluir lista e expiração (13.5).
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

import { Timestamp } from 'firebase-admin/firestore';
import { rotinaDeReservas } from '../src/presentes';

/** Casal com casa gerada, uma lista publicada e um item com `quantidade` unidades nela. */
async function listaPublicada(quantidade = 1) {
  const ana = await contaComCasal('ana@ex.com', 'Ana');
  await db.doc(`casais/${ana.casalId}`).update({ nome_2: 'Pedro', modo_app: 'casa', cidade: 'Curitiba', uf: 'PR' });
  await db.doc(`casais/${ana.casalId}/imovel/principal`).set(IMOVEL);
  expect((await chamar('POST', '/v1/plano/gerar', ana.token)).statusCode).toBe(200);
  const itemId = (await db.collection(`casais/${ana.casalId}/itens`).limit(1).get()).docs[0]!.id;
  const slug = (await db.doc(`casais/${ana.casalId}`).get()).get('slug') as string;
  await db.doc(`casais/${ana.casalId}/listas_presentes/l1`).set({
    ocasiao: 'cha_panela', data_evento: null, slug_lista: 'cha-de-panela', status: 'rascunho', modo_surpresa: false, endereco_entrega: 'Rua A, 10', mensagem: null,
  });
  await db.doc(`casais/${ana.casalId}/lista_itens/li1`).set({ lista_id: 'l1', item_id: itemId, quantidade_na_lista: quantidade, avulso: null });
  expect((await chamar('POST', '/v1/listas/l1/publicar', ana.token)).json()).toEqual({ link: `lartie.app/${slug}/cha-de-panela` });
  return { ana, slug, itemId };
}

const reservarComo = (slug: string, nome: string, quantidade = 1) =>
  app.inject({ method: 'POST', url: `/v1/publico/${slug}/cha-de-panela/reservar`, payload: { presente: 'li1', quantidade, nome }, remoteAddress: `10.0.0.${Math.floor(Math.random() * 200)}` });

beforeEach(limpar);
afterAll(() => app.close());

describe('lista pública (T25) e reserva (T26)', () => {
  it('rascunho não abre; publicada mostra os presentes disponíveis', async () => {
    const { ana, slug } = await listaPublicada(2);
    const pagina = (await app.inject({ method: 'GET', url: `/v1/publico/${slug}/cha-de-panela` })).json();
    expect(pagina).toMatchObject({ casal: { nome_1: 'Ana', nome_2: 'Pedro' }, nome_ocasiao: 'Chá de panela' });
    expect(pagina.presentes).toEqual([expect.objectContaining({ id: 'li1', faltam: 2 })]);
    await db.doc(`casais/${ana.casalId}/listas_presentes/l1`).update({ status: 'despublicada' });
    expect((await app.inject({ method: 'GET', url: `/v1/publico/${slug}/cha-de-panela` })).json()).toEqual({ erro: 'link_inativo' });
    expect((await app.inject({ method: 'GET', url: `/v1/publico/outro/cha-de-panela` })).statusCode).toBe(404);
  });

  it('reserva, avisa o casal, some da página quando esgota e o convidado desfaz', async () => {
    const { ana, slug } = await listaPublicada(1);
    const r = await reservarComo(slug, 'Tia Bia');
    expect(r.statusCode).toBe(200);
    const { token, entrega, mensagem_confirmacao } = r.json();
    expect(entrega).toBe('Rua A, 10');
    expect(mensagem_confirmacao).toContain(`lartie.app/${slug}/reserva/${token}`);
    expect((await db.doc(`casais/${ana.casalId}/lista_itens/li1`).get()).get('quantidade_reservada')).toBe(1);
    const aviso = (await db.collection(`casais/${ana.casalId}/notificacoes`).where('tipo', '==', 'nova_reserva').get()).docs[0]!.data();
    expect(aviso.texto).toMatch(/^Tia Bia reservou .+ no chá de panela\.$/);
    expect((await app.inject({ method: 'GET', url: `/v1/publico/${slug}/cha-de-panela` })).json().presentes).toEqual([]);
    expect((await reservarComo(slug, 'Outra')).json()).toEqual({ erro: 'indisponivel' });

    expect((await app.inject({ method: 'GET', url: `/v1/publico/reservas/${token}` })).json()).toMatchObject({ status: 'ativa', nome: 'Tia Bia' });
    expect((await app.inject({ method: 'POST', url: `/v1/publico/reservas/${token}/desfazer` })).statusCode).toBe(200);
    expect((await app.inject({ method: 'POST', url: `/v1/publico/reservas/${token}/desfazer` })).json()).toEqual({ erro: 'reserva_encerrada' });
    expect((await db.doc(`casais/${ana.casalId}/lista_itens/li1`).get()).get('quantidade_reservada')).toBe(0);
    expect((await app.inject({ method: 'GET', url: `/v1/publico/${slug}/cha-de-panela` })).json().presentes).toHaveLength(1);
  });

  it('fluxo 9: muitos convidados ao mesmo tempo na última unidade, só um reserva (T51 para os outros)', async () => {
    const { ana, slug } = await listaPublicada(1);
    const respostas = await Promise.all(Array.from({ length: 8 }, (_, i) => reservarComo(slug, `Convidado ${i}`)));
    const ok = respostas.filter((r) => r.statusCode === 200);
    const esgotado = respostas.filter((r) => r.statusCode === 409 && r.json().erro === 'indisponivel');
    expect(ok).toHaveLength(1);
    expect(esgotado).toHaveLength(7);
    const ativas = await db.collection(`casais/${ana.casalId}/reservas`).where('status', '==', 'ativa').get();
    expect(ativas.size).toBe(1);
    expect((await db.doc(`casais/${ana.casalId}/lista_itens/li1`).get()).get('quantidade_reservada')).toBe(1);
  });

  it('pedido maior que o disponível e quantidade inválida', async () => {
    const { slug } = await listaPublicada(2);
    expect((await reservarComo(slug, 'Bia', 3)).json()).toEqual({ erro: 'indisponivel' });
    expect((await reservarComo(slug, 'Bia', 0)).statusCode).toBe(400);
    expect((await reservarComo(slug, 'Bia', 2)).statusCode).toBe(200);
  });
});

describe('o casal cancela, tira da lista e exclui a lista', () => {
  it('cancelar a reserva devolve a unidade e a mensagem para o convidado', async () => {
    const { ana, slug } = await listaPublicada(1);
    await reservarComo(slug, 'Tia Bia');
    const r = (await db.collection(`casais/${ana.casalId}/reservas`).get()).docs[0]!;
    const resposta = (await chamar('POST', `/v1/reservas/${r.id}/cancelar`, ana.token)).json();
    expect(resposta.aviso.mensagem).toMatch(/^Oi, Tia Bia! Ana & Pedro tiraram .+ da lista, então a sua reserva foi cancelada\./);
    expect((await db.doc(`casais/${ana.casalId}/lista_itens/li1`).get()).get('quantidade_reservada')).toBe(0);
  });

  it('tirar da lista cancela as reservas; excluir a lista devolve os itens para "Falta"', async () => {
    const { ana, slug, itemId } = await listaPublicada(2);
    await reservarComo(slug, 'Bia');
    const tirar = (await chamar('POST', '/v1/lista-itens/remover', ana.token, { ids: ['li1'] })).json();
    expect(tirar.avisos).toHaveLength(1);
    expect((await db.doc(`casais/${ana.casalId}/lista_itens/li1`).get()).exists).toBe(false);

    await db.doc(`casais/${ana.casalId}/itens/${itemId}`).update({ estado: 'na_lista' });
    await db.doc(`casais/${ana.casalId}/lista_itens/li2`).set({ lista_id: 'l1', item_id: itemId, quantidade_na_lista: 1, avulso: null });
    expect((await chamar('POST', '/v1/listas/l1/excluir', ana.token)).statusCode).toBe(200);
    expect((await db.doc(`casais/${ana.casalId}/listas_presentes/l1`).get()).exists).toBe(false);
    expect((await db.doc(`casais/${ana.casalId}/itens/${itemId}`).get()).get('estado')).toBe('falta');
  });
});

describe('13.5 expiração', () => {
  it('avisa 2 dias antes e expira depois de 15 dias, devolvendo a unidade', async () => {
    const { ana, slug } = await listaPublicada(1);
    await reservarComo(slug, 'Bia');
    const ref = (await db.collection(`casais/${ana.casalId}/reservas`).get()).docs[0]!.ref;
    const expira = (await ref.get()).get('expira_em') as Timestamp;
    expect(await rotinaDeReservas(expira.toMillis() - 3 * 86_400_000)).toEqual({ expiradas: 0, avisadas: 0 });
    expect(await rotinaDeReservas(expira.toMillis() - 86_400_000)).toEqual({ expiradas: 0, avisadas: 1 });
    expect(await rotinaDeReservas(expira.toMillis() - 86_400_000)).toEqual({ expiradas: 0, avisadas: 0 });
    expect(await rotinaDeReservas(expira.toMillis() + 1)).toEqual({ expiradas: 1, avisadas: 0 });
    expect((await ref.get()).get('status')).toBe('expirada');
    expect((await db.doc(`casais/${ana.casalId}/lista_itens/li1`).get()).get('quantidade_reservada')).toBe(0);
    const tipos = (await db.collection(`casais/${ana.casalId}/notificacoes`).get()).docs.map((d) => d.get('tipo'));
    expect(tipos).toEqual(expect.arrayContaining(['reserva_expirando', 'reserva_expirada']));
  });
});

describe('P04 tarefas da mudança', () => {
  it('gerar a casa cria as tarefas da mudança (alugado inclui a vistoria) e marca mudanca_gerada', async () => {
    const { ana } = await listaPublicada(1);
    const ids = (await db.collection(`casais/${ana.casalId}/tarefas_mudanca`).get()).docs.map((d) => d.id);
    expect(ids).toEqual(expect.arrayContaining(['M001', 'M003', 'M006']));
    expect((await db.doc(`casais/${ana.casalId}`).get()).get('mudanca_gerada')).toBe(true);
  });
});
