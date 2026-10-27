import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { FieldValue } from 'firebase-admin/firestore';
import { CLAIM_CASAL, MODOS_APP, caminhos, type Casal, type ModoApp } from '@lartie/modelo';
import { telaInicial, textoModoAlterado } from '@lartie/regras';
import { ErroValidacao, type DadosToken } from './conta';
import { ErroConvite } from './convites';
import { auth, db } from './firebase';
import { PASTA_ARQUIVOS } from './fotos';
import { gerarPlano, type ResumoPlano } from './plano';

// Ações do Perfil e do modo do app que o app não pode gravar sozinho (Etapa 3):
// - trocar o modo (T33b): gera os módulos nunca gerados e avisa o parceiro (13.9 regras 2 e 3);
// - remover o parceiro (T43): revoga o acesso dele, sem apagar dados (13.7);
// - excluir a conta (T42): apaga os dados do casal e encerra as sessões dos dois (13.8).

export type OrigemModo = 'perfil' | 'cartao' | 'inicio_depois' | 'folha_ativar';

async function membros(casalId: string) {
  return (await db.collection('usuarios').where('casal_id', '==', casalId).get()).docs;
}

async function removerClaimCasal(uid: string) {
  const atual = (await auth.getUser(uid)).customClaims ?? {};
  const { [CLAIM_CASAL]: _removido, ...resto } = atual;
  await auth.setCustomUserClaims(uid, resto);
}

/**
 * T33b "Mudar modo" (e os atalhos que levam a ele). Gera primeiro o que falta e só depois grava o
 * modo: se a geração falhar, o menu não muda para um módulo vazio.
 */
export async function trocarModo(token: DadosToken, casalId: string, modo: string): Promise<{ modo: ModoApp; resumo: ResumoPlano }> {
  if (!(MODOS_APP as readonly string[]).includes(modo)) throw new ErroValidacao('Modo inválido.');
  const novo = modo as ModoApp;
  const refCasal = db.doc(caminhos.casal(casalId));
  const casal = (await refCasal.get()).data() as Casal | undefined;
  if (!casal) throw new ErroValidacao('Casal não encontrado.');

  const resumo = await gerarPlano(token.uid, casalId, novo);
  if (casal.modo_app === novo) return { modo: novo, resumo };

  const agora = FieldValue.serverTimestamp();
  const lote = db.batch();
  lote.update(refCasal, {
    modo_app: novo,
    modo_alterado_por: token.uid,
    modo_alterado_em: agora,
    atualizado_por: token.uid,
    atualizado_em: agora,
  });
  // Aviso ao parceiro (Seção 12, "Modo alterado"). O push vem na Etapa 9.
  const quem = (await db.doc(caminhos.usuario(token.uid)).get()).get('nome') ?? 'Seu par';
  for (const m of await membros(casalId)) {
    if (m.id === token.uid) continue;
    lote.set(db.collection(caminhos.subcolecao(casalId, 'notificacoes')).doc(), {
      usuario_id: m.id,
      tipo: 'modo_alterado',
      texto: textoModoAlterado(quem, novo),
      destino: telaInicial(novo),
      lida: false,
      criada_em: agora,
    });
  }
  await lote.commit();
  return { modo: novo, resumo };
}

/** T43 "Remover {nome} do plano?": só quem criou o plano (noivo_1) remove o parceiro (noivo_2). */
export async function removerParceiro(token: DadosToken, casalId: string) {
  const eu = (await db.doc(caminhos.usuario(token.uid)).get()).data();
  if (eu?.casal_id !== casalId || eu?.papel !== 'noivo_1') throw new ErroConvite('sem_permissao');
  const parceiro = (await membros(casalId)).find((m) => m.get('papel') === 'noivo_2');
  if (!parceiro) return { removido: false };

  const refCasal = db.doc(caminhos.casal(casalId));
  const nomeCasal = ((await refCasal.get()).get('nome_1') as string) ?? '';
  const agora = FieldValue.serverTimestamp();
  const lote = db.batch();
  lote.update(parceiro.ref, {
    casal_id: null,
    papel: null,
    removido_do_plano: { nome: nomeCasal, em: agora },
    atualizado_em: agora,
  });
  lote.update(refCasal, { parceiro: null, atualizado_por: token.uid, atualizado_em: agora });
  await lote.commit();
  // O acesso cai quando o app do parceiro renovar o token (ele percebe pelo próprio documento e
  // renova na hora). Um token antigo ainda vale até 1 hora: risco registrado no relatório.
  await removerClaimCasal(parceiro.id);
  return { removido: true };
}

/**
 * T42 "Excluir a conta e todos os dados?": apaga o casal (com todas as subcoleções), o endereço
 * público, os convites e os arquivos; apaga a conta de quem pediu e encerra a sessão do parceiro,
 * que continua com a conta, sem casal.
 */
export async function excluirConta(token: DadosToken, casalId: string) {
  const eu = (await db.doc(caminhos.usuario(token.uid)).get()).data();
  if (eu?.casal_id !== casalId) throw new ErroConvite('sem_permissao');
  const pessoas = await membros(casalId);

  await db.recursiveDelete(db.doc(caminhos.casal(casalId)));
  const lote = db.batch();
  for (const s of (await db.collection('slugs').where('casal_id', '==', casalId).get()).docs) lote.delete(s.ref);
  for (const c of (await db.collection('convites_parceiro').where('casal_id', '==', casalId).get()).docs) lote.delete(c.ref);
  for (const p of pessoas) lote.delete(p.ref);
  await lote.commit();
  await rm(resolve(PASTA_ARQUIVOS, casalId), { recursive: true, force: true });

  for (const p of pessoas) {
    if (p.id === token.uid) continue;
    await removerClaimCasal(p.id);
    await auth.revokeRefreshTokens(p.id);
  }
  await auth.deleteUser(token.uid);
  return { ok: true };
}
