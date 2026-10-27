import { randomBytes } from 'node:crypto';
import { FieldValue, Timestamp, type DocumentReference } from 'firebase-admin/firestore';
import { caminhos, type Casal, type Item, type ListaItem, type ListaPresentes, type Reserva } from '@lartie/modelo';
import {
  conferirReserva,
  DIAS_AVISO_EXPIRACAO,
  DIAS_RESERVA,
  formatarData,
  linkDaLista,
  linkDaReserva,
  mensagemConfirmacaoReserva,
  mensagemReservaCancelada,
  NOME_OCASIAO,
  nomesDoCasal,
  textoNovaReserva,
  validarSlugLista,
} from '@lartie/regras';
import { ErroValidacao, type DadosToken } from './conta';
import { db } from './firebase';

// Lista de presentes e reservas (Etapa 5, 13.5). O que é do servidor:
// - publicar a lista (o link fica público);
// - a página do convidado e a reserva, sem login;
// - a reserva atômica: a quantidade reservada fica no próprio item da lista e só muda dentro da
//   transação, então duas reservas da última unidade nunca passam juntas;
// - cancelar reservas (pelo convidado, pelo casal, ao tirar da lista ou excluir a lista);
// - expirar as reservas depois de 15 dias e avisar o casal 2 dias antes.

export class ErroPresentes extends Error {
  constructor(readonly codigo: 'nao_encontrado' | 'link_inativo' | 'indisponivel' | 'quantidade_invalida' | 'reserva_encerrada' | 'slug_em_uso') {
    super(codigo);
  }
}

const reservas = (casalId: string) => db.collection(caminhos.subcolecao(casalId, 'reservas'));
const refListaItem = (casalId: string, id: string) => db.doc(caminhos.documento(casalId, 'lista_itens', id));

/** Nome e foto do presente: item do enxoval ou item avulso. */
async function descricaoDoItem(casalId: string, li: ListaItem) {
  if (li.avulso || !li.item_id) return { nome: li.avulso?.nome ?? 'Presente', foto: null, comodo: null, preco: li.avulso?.preco_estimado ?? null, link: li.avulso?.link_loja ?? null };
  const item = (await db.doc(caminhos.documento(casalId, 'itens', li.item_id)).get()).data() as Item | undefined;
  const comodo = item ? ((await db.doc(caminhos.documento(casalId, 'comodos', item.comodo_id)).get()).get('nome') as string | undefined) : undefined;
  return { nome: item?.nome ?? 'Presente', foto: item?.foto ?? null, comodo: comodo ?? null, preco: item?.preco_estimado ?? null, link: item?.link_loja ?? null };
}

function nomesDe(casal: Casal) {
  return nomesDoCasal(casal.nome_1, casal.parceiro?.nome ?? casal.nome_2);
}

// Casal ------------------------------------------------------------------------------------

/** T39 "Publicar a lista do {ocasião}?": confere o endereço e publica. */
export async function publicarLista(token: DadosToken, casalId: string, listaId: string) {
  const ref = db.doc(caminhos.documento(casalId, 'listas_presentes', listaId));
  const lista = (await ref.get()).data() as ListaPresentes | undefined;
  if (!lista) throw new ErroPresentes('nao_encontrado');
  const outras = (await db.collection(caminhos.subcolecao(casalId, 'listas_presentes')).get()).docs.filter((d) => d.id !== listaId).map((d) => d.get('slug_lista') as string);
  const erro = validarSlugLista(lista.slug_lista, outras);
  if (erro) throw new ErroPresentes('slug_em_uso');
  const casal = (await db.doc(caminhos.casal(casalId)).get()).data() as Casal;
  if (!casal.slug) throw new ErroValidacao('O casal ainda não tem endereço público.');
  await ref.update({ status: 'publicada', atualizado_por: token.uid, atualizado_em: FieldValue.serverTimestamp() });
  return { link: linkDaLista(casal.slug, lista.slug_lista) };
}

export interface AvisoConvidado {
  nome: string;
  whatsapp: string | null;
  item: string;
  mensagem: string;
}

/** Cancela reservas ativas dentro de uma transação e devolve os avisos aos convidados. */
async function cancelarAtivas(casalId: string, listaItemIds: string[], motivo: 'casal' | 'removido'): Promise<AvisoConvidado[]> {
  const casal = (await db.doc(caminhos.casal(casalId)).get()).data() as Casal;
  const avisos: AvisoConvidado[] = [];
  for (const id of listaItemIds) {
    const refLi = refListaItem(casalId, id);
    const li = (await refLi.get()).data() as ListaItem | undefined;
    if (!li) continue;
    const lista = (await db.doc(caminhos.documento(casalId, 'listas_presentes', li.lista_id)).get()).data() as ListaPresentes | undefined;
    const item = await descricaoDoItem(casalId, li);
    const canceladas = await db.runTransaction(async (tx) => {
      const ativas = await tx.get(reservas(casalId).where('lista_item_id', '==', id).where('status', '==', 'ativa'));
      const liAtual = await tx.get(refLi);
      let total = 0;
      for (const r of ativas.docs) {
        total += r.get('quantidade') as number;
        tx.update(r.ref, { status: 'cancelada', atualizado_em: FieldValue.serverTimestamp(), cancelada_por: motivo });
      }
      if (liAtual.exists && total) tx.update(refLi, { quantidade_reservada: FieldValue.increment(-total) });
      return ativas.docs.map((r) => r.data() as Reserva);
    });
    for (const r of canceladas) {
      avisos.push({
        nome: r.nome_convidado,
        whatsapp: r.whatsapp,
        item: item.nome,
        mensagem: mensagemReservaCancelada({
          convidado: r.nome_convidado,
          casal: nomesDe(casal),
          item: item.nome,
          link: casal.slug && lista ? linkDaLista(casal.slug, lista.slug_lista) : '',
        }),
      });
    }
  }
  return avisos;
}

/** Casal cancela uma reserva no detalhe do item (13.5). */
export async function cancelarReservaPeloCasal(casalId: string, reservaId: string) {
  const r = (await reservas(casalId).doc(reservaId).get()).data() as Reserva | undefined;
  if (!r) throw new ErroPresentes('nao_encontrado');
  if (r.status !== 'ativa') throw new ErroPresentes('reserva_encerrada');
  const casal = (await db.doc(caminhos.casal(casalId)).get()).data() as Casal;
  await db.runTransaction(async (tx) => {
    const atual = await tx.get(reservas(casalId).doc(reservaId));
    if (atual.get('status') !== 'ativa') throw new ErroPresentes('reserva_encerrada');
    tx.update(atual.ref, { status: 'cancelada', atualizado_em: FieldValue.serverTimestamp(), cancelada_por: 'casal' });
    tx.update(refListaItem(casalId, r.lista_item_id), { quantidade_reservada: FieldValue.increment(-r.quantidade) });
  });
  const li = (await refListaItem(casalId, r.lista_item_id).get()).data() as ListaItem;
  const lista = (await db.doc(caminhos.documento(casalId, 'listas_presentes', r.lista_id)).get()).data() as ListaPresentes | undefined;
  const item = await descricaoDoItem(casalId, li);
  return {
    aviso: {
      nome: r.nome_convidado,
      whatsapp: r.whatsapp,
      item: item.nome,
      mensagem: mensagemReservaCancelada({ convidado: r.nome_convidado, casal: nomesDe(casal), item: item.nome, link: casal.slug && lista ? linkDaLista(casal.slug, lista.slug_lista) : '' }),
    } satisfies AvisoConvidado,
  };
}

/** Tirar um item da lista (T24) ou excluir o item (T35): cancela as reservas ativas e remove. */
export async function removerDaLista(casalId: string, listaItemIds: string[]) {
  const avisos = await cancelarAtivas(casalId, listaItemIds, 'removido');
  const lote = db.batch();
  for (const id of listaItemIds) lote.delete(refListaItem(casalId, id));
  await lote.commit();
  return { avisos };
}

/** "Excluir lista" (T24): cancela as reservas ativas, remove os itens da lista e a lista. */
export async function excluirLista(token: DadosToken, casalId: string, listaId: string) {
  const itens = await db.collection(caminhos.subcolecao(casalId, 'lista_itens')).where('lista_id', '==', listaId).get();
  const avisos = await cancelarAtivas(casalId, itens.docs.map((d) => d.id), 'removido');
  // Itens do enxoval que estavam "Na lista" só por esta lista voltam para "Falta".
  const outras = await db.collection(caminhos.subcolecao(casalId, 'lista_itens')).where('lista_id', '!=', listaId).get();
  const emOutras = new Set(outras.docs.map((d) => d.get('item_id') as string));
  const refs: DocumentReference[] = [];
  const lote = db.batch();
  for (const d of itens.docs) {
    lote.delete(d.ref);
    const itemId = d.get('item_id') as string;
    if (itemId && !emOutras.has(itemId)) refs.push(db.doc(caminhos.documento(casalId, 'itens', itemId)));
  }
  for (const ref of refs) {
    const item = await ref.get();
    if (item.exists && item.get('estado') === 'na_lista') {
      lote.update(ref, { estado: 'falta', atualizado_por: token.uid, atualizado_em: FieldValue.serverTimestamp() });
    }
  }
  lote.delete(db.doc(caminhos.documento(casalId, 'listas_presentes', listaId)));
  await lote.commit();
  return { avisos };
}

// Convidado (sem login) -------------------------------------------------------------------

async function abrirLista(slug: string, slugLista: string) {
  const s = await db.doc(`slugs/${slug}`).get();
  const casalId = s.get('casal_id') as string | undefined;
  if (!casalId) throw new ErroPresentes('link_inativo');
  const q = await db.collection(caminhos.subcolecao(casalId, 'listas_presentes')).where('slug_lista', '==', slugLista).where('status', '==', 'publicada').limit(1).get();
  const doc = q.docs[0];
  if (!doc) throw new ErroPresentes('link_inativo');
  const casal = (await db.doc(caminhos.casal(casalId)).get()).data() as Casal | undefined;
  if (!casal) throw new ErroPresentes('link_inativo');
  return { casalId, casal, listaId: doc.id, lista: doc.data() as ListaPresentes };
}

/** T25: o que a página pública mostra. Itens totalmente reservados ou recebidos não aparecem. */
export async function paginaDaLista(slug: string, slugLista: string) {
  const { casalId, casal, listaId, lista } = await abrirLista(slug, slugLista);
  const itens = await db.collection(caminhos.subcolecao(casalId, 'lista_itens')).where('lista_id', '==', listaId).get();
  const presentes = [];
  for (const d of itens.docs) {
    const li = d.data() as ListaItem;
    const faltam = li.quantidade_na_lista - (li.quantidade_reservada ?? 0);
    if (faltam <= 0) continue;
    const item = await descricaoDoItem(casalId, li);
    presentes.push({ id: d.id, nome: item.nome, comodo: item.comodo, faltam, preco: item.preco, link: item.link, foto: !!item.foto });
  }
  presentes.sort((a, b) => (a.comodo ?? '~').localeCompare(b.comodo ?? '~', 'pt-BR') || a.nome.localeCompare(b.nome, 'pt-BR'));
  return {
    casal: { nome_1: casal.nome_1, nome_2: casal.parceiro?.nome ?? casal.nome_2 },
    ocasiao: lista.ocasiao,
    nome_ocasiao: NOME_OCASIAO[lista.ocasiao],
    data_evento: lista.data_evento,
    mensagem: lista.mensagem,
    presentes,
  };
}

/** Foto de um presente de lista publicada (o arquivo do casal só sai para itens da lista). */
export async function fotoDoPresente(slug: string, slugLista: string, listaItemId: string) {
  const { casalId, listaId } = await abrirLista(slug, slugLista);
  const li = (await refListaItem(casalId, listaItemId).get()).data() as ListaItem | undefined;
  if (!li || li.lista_id !== listaId || !li.item_id) throw new ErroPresentes('nao_encontrado');
  const foto = (await db.doc(caminhos.documento(casalId, 'itens', li.item_id)).get()).get('foto') as string | null;
  if (!foto) throw new ErroPresentes('nao_encontrado');
  return { casalId, arquivo: foto.split('/').pop()! };
}

export interface PedidoReserva {
  presente: string;
  quantidade: number;
  nome: string;
  whatsapp?: string | null;
  mensagem?: string | null;
}

/** T26 · Reservar presente: atômico (13.5). Esgotou no meio do caminho → T51. */
export async function reservar(slug: string, slugLista: string, p: PedidoReserva) {
  const nome = p.nome?.trim();
  if (!nome || nome.length > 60) throw new ErroValidacao('Informe o seu nome.');
  const mensagem = p.mensagem?.trim().slice(0, 300) || null;
  const whatsapp = p.whatsapp?.replace(/\D/g, '').slice(0, 13) || null;
  const { casalId, casal, listaId, lista } = await abrirLista(slug, slugLista);
  const refLi = refListaItem(casalId, p.presente);
  const refReserva = reservas(casalId).doc();
  const tokenGerenciar = randomBytes(18).toString('base64url');
  const agora = Date.now();
  const expira = Timestamp.fromMillis(agora + DIAS_RESERVA * 86_400_000);

  const li = await db.runTransaction(async (tx) => {
    const atual = await tx.get(refLi);
    const dados = atual.data() as ListaItem | undefined;
    if (!dados || dados.lista_id !== listaId) throw new ErroPresentes('nao_encontrado');
    const faltam = dados.quantidade_na_lista - (dados.quantidade_reservada ?? 0);
    const decisao = conferirReserva(p.quantidade, faltam);
    if (decisao !== 'ok') throw new ErroPresentes(decisao);
    tx.update(refLi, { quantidade_reservada: (dados.quantidade_reservada ?? 0) + p.quantidade });
    tx.set(refReserva, {
      lista_item_id: p.presente,
      lista_id: listaId,
      quantidade: p.quantidade,
      nome_convidado: nome,
      whatsapp,
      mensagem,
      status: 'ativa',
      criada_em: FieldValue.serverTimestamp(),
      expira_em: expira,
      atualizado_em: FieldValue.serverTimestamp(),
      aviso_expiracao: false,
    });
    tx.set(db.doc(`tokens_reserva/${tokenGerenciar}`), { casal_id: casalId, reserva_id: refReserva.id, slug, criado_em: FieldValue.serverTimestamp() });
    return dados;
  });

  const item = await descricaoDoItem(casalId, li);
  // Aviso ao casal (Seção 12, "Nova reserva"); no modo surpresa, sem o nome. O push vem na Etapa 9.
  await db.collection(caminhos.subcolecao(casalId, 'notificacoes')).add({
    usuario_id: null,
    tipo: 'nova_reserva',
    texto: textoNovaReserva(nome, item.nome, lista.ocasiao, lista.modo_surpresa),
    destino: `lista/${listaId}`,
    lida: false,
    criada_em: FieldValue.serverTimestamp(),
  });

  const expiraEm = formatarData(new Date(expira.toMillis()).toISOString().slice(0, 10));
  const linkGerenciar = linkDaReserva(slug, tokenGerenciar);
  return {
    token: tokenGerenciar,
    quantidade: p.quantidade,
    item: item.nome,
    expira_em: expiraEm,
    entrega: lista.endereco_entrega,
    casal: nomesDe(casal),
    // Sem serviço de mensagens (depende do domínio), a página oferece enviar ao próprio WhatsApp.
    mensagem_confirmacao: mensagemConfirmacaoReserva({ convidado: nome, quantidade: p.quantidade, item: item.nome, casal: nomesDe(casal), expiraEm, entrega: lista.endereco_entrega, link: linkGerenciar }),
    whatsapp,
  };
}

async function abrirReserva(token: string) {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) throw new ErroPresentes('nao_encontrado');
  const t = (await db.doc(`tokens_reserva/${token}`).get()).data();
  if (!t) throw new ErroPresentes('nao_encontrado');
  const ref = reservas(t.casal_id as string).doc(t.reserva_id as string);
  const r = (await ref.get()).data() as Reserva | undefined;
  if (!r) throw new ErroPresentes('nao_encontrado');
  return { casalId: t.casal_id as string, slug: t.slug as string, ref, reserva: r };
}

/** Página "gerenciar reserva" (link do WhatsApp de confirmação). */
export async function consultarReserva(token: string) {
  const { casalId, slug, reserva } = await abrirReserva(token);
  const casal = (await db.doc(caminhos.casal(casalId)).get()).data() as Casal;
  const lista = (await db.doc(caminhos.documento(casalId, 'listas_presentes', reserva.lista_id)).get()).data() as ListaPresentes | undefined;
  const li = (await refListaItem(casalId, reserva.lista_item_id).get()).data() as ListaItem | undefined;
  const item = li ? await descricaoDoItem(casalId, li) : { nome: 'Presente' };
  return {
    status: reserva.status,
    quantidade: reserva.quantidade,
    item: item.nome,
    nome: reserva.nome_convidado,
    expira_em: formatarData(reserva.expira_em.toDate().toISOString().slice(0, 10)),
    entrega: reserva.status === 'ativa' ? lista?.endereco_entrega ?? null : null,
    casal: nomesDe(casal),
    lista: lista && lista.status === 'publicada' ? { slug, slug_lista: lista.slug_lista, nome: NOME_OCASIAO[lista.ocasiao] } : null,
  };
}

/** T40 · "Desfazer a reserva?" pelo convidado. */
export async function desfazerReserva(token: string) {
  const { casalId, ref, reserva } = await abrirReserva(token);
  await db.runTransaction(async (tx) => {
    const atual = await tx.get(ref);
    if (atual.get('status') !== 'ativa') throw new ErroPresentes('reserva_encerrada');
    tx.update(ref, { status: 'cancelada', cancelada_por: 'convidado', atualizado_em: FieldValue.serverTimestamp() });
    tx.update(refListaItem(casalId, reserva.lista_item_id), { quantidade_reservada: FieldValue.increment(-reserva.quantidade) });
  });
  return { ok: true };
}

// Agendamentos ----------------------------------------------------------------------------

/**
 * 13.5: reserva ativa há 15 dias sem "Recebido" expira, a unidade volta a ficar disponível e o
 * casal é avisado. Dois dias antes, o casal recebe "A reserva de {nome} expira em 2 dias.".
 * Roda a cada 10 minutos na API (index.ts).
 */
export async function rotinaDeReservas(agora = Date.now()) {
  const ativas = await db.collectionGroup('reservas').where('status', '==', 'ativa').get();
  let expiradas = 0;
  let avisadas = 0;
  for (const d of ativas.docs) {
    const r = d.data() as Reserva;
    const casalId = d.ref.parent.parent!.id;
    const quando = r.expira_em.toDate().getTime();
    if (quando <= agora) {
      const ok = await db.runTransaction(async (tx) => {
        const atual = await tx.get(d.ref);
        if (atual.get('status') !== 'ativa') return false;
        tx.update(d.ref, { status: 'expirada', atualizado_em: FieldValue.serverTimestamp() });
        tx.update(refListaItem(casalId, r.lista_item_id), { quantidade_reservada: FieldValue.increment(-r.quantidade) });
        return true;
      });
      if (ok) {
        expiradas++;
        await db.collection(caminhos.subcolecao(casalId, 'notificacoes')).add({
          usuario_id: null,
          tipo: 'reserva_expirada',
          texto: `A reserva de ${r.nome_convidado} expirou e o presente voltou para a lista.`,
          destino: `lista/${r.lista_id}`,
          lida: false,
          criada_em: FieldValue.serverTimestamp(),
        });
      }
    } else if (!r.aviso_expiracao && quando - agora <= DIAS_AVISO_EXPIRACAO * 86_400_000) {
      await d.ref.update({ aviso_expiracao: true });
      avisadas++;
      await db.collection(caminhos.subcolecao(casalId, 'notificacoes')).add({
        usuario_id: null,
        tipo: 'reserva_expirando',
        texto: `A reserva de ${r.nome_convidado} expira em 2 dias.`,
        destino: `lista/${r.lista_id}`,
        lida: false,
        criada_em: FieldValue.serverTimestamp(),
      });
    }
  }
  return { expiradas, avisadas };
}
