// Testes das regras do Firestore. Rodam no emulador: npm run test:regras-firestore (precisa de Java).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Firestore,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

let env: RulesTestEnvironment;

const CASAL = 'casal-ana-pedro';
const OUTRO_CASAL = 'casal-outro';

const ana = () => env.authenticatedContext('ana', { casal_id: CASAL }).firestore() as unknown as Firestore;
const pedro = () => env.authenticatedContext('pedro', { casal_id: CASAL }).firestore() as unknown as Firestore;
const intruso = () => env.authenticatedContext('bia', { casal_id: OUTRO_CASAL }).firestore() as unknown as Firestore;
const semCasal = () => env.authenticatedContext('novo').firestore() as unknown as Firestore;
const anonimo = () => env.unauthenticatedContext().firestore() as unknown as Firestore;

const criacao = (uid: string) => ({
  criado_por: uid,
  criado_em: serverTimestamp(),
  atualizado_por: uid,
  atualizado_em: serverTimestamp(),
});
const atualizacao = (uid: string) => ({ atualizado_por: uid, atualizado_em: serverTimestamp() });

const itemValido = (uid: string) => ({
  comodo_id: 'cozinha',
  nome: 'Jogo de panelas',
  fase: 'primeira_noite',
  quantidade: 1,
  estado: 'falta',
  origem: null,
  quem_deu: null,
  preco_estimado: 45000,
  link_loja: null,
  medidas: null,
  parede_destino: null,
  observacao: null,
  foto: null,
  gerado_pelo_plano: false,
  ...criacao(uid),
});

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-lartie',
    firestore: { rules: readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8') },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const agora = new Date();
    await setDoc(doc(db, 'casais', CASAL), {
      nome_1: 'Ana',
      nome_2: 'Pedro',
      modo_app: 'os_dois',
      slug: 'ana-e-pedro',
      modulos_gerados: { casamento: true, casa: true },
      criado_por: 'ana',
      criado_em: agora,
      atualizado_por: 'ana',
      atualizado_em: agora,
    });
    await setDoc(doc(db, 'usuarios', 'ana'), { nome: 'Ana', casal_id: CASAL, papel: 'noivo_1', atualizado_em: agora });
    await setDoc(doc(db, `casais/${CASAL}/reservas/r1`), { status: 'ativa', quantidade: 1, atualizado_em: agora });
    await setDoc(doc(db, `casais/${CASAL}/notificacoes/n-ana`), { usuario_id: 'ana', lida: false });
    await setDoc(doc(db, `casais/${CASAL}/notificacoes/n-pedro`), { usuario_id: 'pedro', lida: false });
    await setDoc(doc(db, `casais/${CASAL}/notificacoes/n-todos`), { usuario_id: null, lida: false });
  });
});

describe('acesso por casal', () => {
  it('os dois do casal leem o casal; outro casal, sem casal e anônimo não', async () => {
    await assertSucceeds(getDoc(doc(ana(), 'casais', CASAL)));
    await assertSucceeds(getDoc(doc(pedro(), 'casais', CASAL)));
    await assertFails(getDoc(doc(intruso(), 'casais', CASAL)));
    await assertFails(getDoc(doc(semCasal(), 'casais', CASAL)));
    await assertFails(getDoc(doc(anonimo(), 'casais', CASAL)));
  });

  it('o parceiro vê o item criado pelo outro', async () => {
    await assertSucceeds(setDoc(doc(ana(), `casais/${CASAL}/itens/panelas`), itemValido('ana')));
    await assertSucceeds(getDoc(doc(pedro(), `casais/${CASAL}/itens/panelas`)));
    await assertFails(getDoc(doc(intruso(), `casais/${CASAL}/itens/panelas`)));
  });

  it('ninguém grava nos dados de outro casal', async () => {
    await assertFails(setDoc(doc(intruso(), `casais/${CASAL}/itens/x`), itemValido('bia')));
  });
});

describe('auditoria (quem e quando)', () => {
  it('exige criado_por do próprio usuário e horário do servidor', async () => {
    await assertFails(setDoc(doc(ana(), `casais/${CASAL}/itens/a`), { ...itemValido('ana'), criado_por: 'pedro' }));
    await assertFails(
      setDoc(doc(ana(), `casais/${CASAL}/itens/b`), { ...itemValido('ana'), criado_em: new Date('2020-01-01') }),
    );
  });

  it('a atualização registra quem alterou e não muda a criação', async () => {
    await setDoc(doc(ana(), `casais/${CASAL}/itens/panelas`), itemValido('ana'));
    await assertSucceeds(
      updateDoc(doc(pedro(), `casais/${CASAL}/itens/panelas`), { estado: 'ja_tenho', ...atualizacao('pedro') }),
    );
    await assertFails(
      updateDoc(doc(pedro(), `casais/${CASAL}/itens/panelas`), { estado: 'falta', ...atualizacao('ana') }),
    );
    await assertFails(
      updateDoc(doc(pedro(), `casais/${CASAL}/itens/panelas`), { criado_por: 'pedro', ...atualizacao('pedro') }),
    );
  });
});

describe('validação dos dados', () => {
  it('recusa estado de item fora da lista', async () => {
    await assertFails(setDoc(doc(ana(), `casais/${CASAL}/itens/x`), { ...itemValido('ana'), estado: 'perdido' }));
  });

  it('recusa quantidade menor que 1 e item sem nome', async () => {
    await assertFails(setDoc(doc(ana(), `casais/${CASAL}/itens/x`), { ...itemValido('ana'), quantidade: 0 }));
    await assertFails(setDoc(doc(ana(), `casais/${CASAL}/itens/y`), { ...itemValido('ana'), nome: '  ' }));
  });

  it('aceita tarefa válida e recusa status inválido', async () => {
    const tarefa = {
      titulo: 'Fechar fotógrafo',
      fase: 'fornecedores_principais',
      prazo: '2027-03-10',
      responsavel: 'os_dois',
      status: 'a_fazer',
      fornecedor_id: null,
      notas: null,
      lembrete_ativo: true,
      oculta: false,
      ordem: 1,
      gerada_pelo_plano: false,
      ...criacao('ana'),
    };
    await assertSucceeds(setDoc(doc(ana(), `casais/${CASAL}/tarefas/t1`), tarefa));
    await assertFails(setDoc(doc(ana(), `casais/${CASAL}/tarefas/t2`), { ...tarefa, status: 'feita' }));
  });

  it('subcoleção desconhecida é recusada', async () => {
    await assertFails(setDoc(doc(ana(), `casais/${CASAL}/qualquer/x`), { ...criacao('ana') }));
  });
});

describe('modo do app (13.9)', () => {
  it('qualquer um dos dois troca o modo, registrando quem e quando', async () => {
    await assertSucceeds(
      updateDoc(doc(pedro(), 'casais', CASAL), {
        modo_app: 'casa',
        modo_alterado_por: 'pedro',
        modo_alterado_em: serverTimestamp(),
        ...atualizacao('pedro'),
      }),
    );
  });

  it('recusa modo inválido e troca sem registrar quem mudou', async () => {
    await assertFails(updateDoc(doc(ana(), 'casais', CASAL), { modo_app: 'festa', ...atualizacao('ana') }));
    await assertFails(updateDoc(doc(ana(), 'casais', CASAL), { modo_app: 'casa', ...atualizacao('ana') }));
  });

  it('o app não altera slug, modulos_gerados nem parceiro (só o servidor)', async () => {
    await assertFails(updateDoc(doc(ana(), 'casais', CASAL), { slug: 'outro', ...atualizacao('ana') }));
    await assertFails(updateDoc(doc(ana(), 'casais', CASAL), { parceiro: { uid: 'x', nome: 'X' }, ...atualizacao('ana') }));
    await assertFails(
      updateDoc(doc(ana(), 'casais', CASAL), {
        modulos_gerados: { casamento: false, casa: false },
        ...atualizacao('ana'),
      }),
    );
  });

  it('o app não cria nem exclui casais', async () => {
    await assertFails(setDoc(doc(semCasal(), 'casais', 'novo'), { nome_1: 'X', modo_app: 'casa' }));
    await assertFails(deleteDoc(doc(ana(), 'casais', CASAL)));
  });
});

describe('dados que só o servidor grava', () => {
  it('reservas: o casal lê e marca como recebida, mas não cria nem cancela', async () => {
    await assertSucceeds(getDoc(doc(pedro(), `casais/${CASAL}/reservas/r1`)));
    await assertFails(setDoc(doc(ana(), `casais/${CASAL}/reservas/r2`), { status: 'ativa', quantidade: 1 }));
    await assertFails(
      updateDoc(doc(ana(), `casais/${CASAL}/reservas/r1`), { status: 'cancelada', atualizado_em: serverTimestamp() }),
    );
    await assertSucceeds(
      updateDoc(doc(ana(), `casais/${CASAL}/reservas/r1`), { status: 'recebida', atualizado_em: serverTimestamp() }),
    );
    await assertFails(deleteDoc(doc(ana(), `casais/${CASAL}/reservas/r1`)));
  });

  it('lista de presentes: o app cria em rascunho, mas não publica', async () => {
    const lista = {
      ocasiao: 'cha_panela',
      data_evento: null,
      slug_lista: 'cha-de-panela',
      status: 'rascunho',
      modo_surpresa: false,
      endereco_entrega: null,
      ...criacao('ana'),
    };
    await assertSucceeds(setDoc(doc(ana(), `casais/${CASAL}/listas_presentes/l1`), lista));
    await assertFails(
      updateDoc(doc(ana(), `casais/${CASAL}/listas_presentes/l1`), { status: 'publicada', ...atualizacao('ana') }),
    );
  });

  it('notificações: cada um vê as suas e as do casal, e só marca como lida', async () => {
    await assertSucceeds(getDoc(doc(ana(), `casais/${CASAL}/notificacoes/n-ana`)));
    await assertSucceeds(getDoc(doc(ana(), `casais/${CASAL}/notificacoes/n-todos`)));
    await assertFails(getDoc(doc(ana(), `casais/${CASAL}/notificacoes/n-pedro`)));
    await assertSucceeds(updateDoc(doc(ana(), `casais/${CASAL}/notificacoes/n-ana`), { lida: true }));
    await assertFails(updateDoc(doc(ana(), `casais/${CASAL}/notificacoes/n-ana`), { texto: 'x' }));
    await assertFails(setDoc(doc(ana(), `casais/${CASAL}/notificacoes/nova`), { usuario_id: null, lida: false }));
  });

  it('convites, slugs e tokens públicos ficam fechados para o app', async () => {
    for (const caminho of ['convites_parceiro/c1', 'slugs/ana-e-pedro', 'tokens_rsvp/t1', 'tokens_reserva/t1']) {
      await assertFails(getDoc(doc(ana(), caminho)));
      await assertFails(setDoc(doc(ana(), caminho), { casal_id: CASAL }));
    }
  });

  it('assistente fica fechada enquanto a IA estiver fora do escopo (P14)', async () => {
    await assertFails(getDoc(doc(ana(), `casais/${CASAL}/mensagens_assistente/m1`)));
  });
});

describe('usuário', () => {
  it('lê e altera só os próprios dados pessoais', async () => {
    await assertSucceeds(getDoc(doc(ana(), 'usuarios', 'ana')));
    await assertFails(getDoc(doc(pedro(), 'usuarios', 'ana')));
    await assertSucceeds(updateDoc(doc(ana(), 'usuarios', 'ana'), { nome: 'Ana Souza', atualizado_em: serverTimestamp() }));
    await assertFails(updateDoc(doc(ana(), 'usuarios', 'ana'), { casal_id: OUTRO_CASAL, atualizado_em: serverTimestamp() }));
    await assertFails(updateDoc(doc(ana(), 'usuarios', 'ana'), { papel: 'noivo_2', atualizado_em: serverTimestamp() }));
  });
});
