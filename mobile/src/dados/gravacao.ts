import {
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from '@react-native-firebase/firestore';
import { caminhos, type Imovel, type ModoApp, type PreferenciasNotificacao, type Subcolecao } from '@lartie/modelo';
import { registrarErro } from '../servicos/analytics';
import { auth, db } from '../servicos/firebase';

// Gravações do app no Firestore.
// - Sempre com auditoria (criado_por/em, atualizado_por/em) pelo horário do servidor; as regras exigem.
// - Offline: o Firestore aplica na hora no cache local (a tela já mostra) e envia quando a conexão volta.
//   Por isso as funções não esperam a confirmação do servidor para seguir: a promessa devolvida só
//   termina quando o servidor confirmar, e a falha (ex.: regra recusou) vai para `aoFalhar`.

type Dados = Record<string, unknown>;

function uid(): string {
  const u = auth().currentUser;
  if (!u) throw new Error('Sem usuário logado');
  return u.uid;
}

function acompanhar(promessa: Promise<unknown>, contexto: string, aoFalhar?: (erro: unknown) => void) {
  promessa.catch((erro) => {
    registrarErro(erro, contexto);
    aoFalhar?.(erro);
  });
}

/** Cria um documento numa subcoleção do casal e devolve o id (gerado no aparelho, funciona offline). */
export function criar(casalId: string, sub: Subcolecao, dados: Dados, aoFalhar?: (erro: unknown) => void): string {
  const quem = uid();
  const ref = doc(collection(db(), caminhos.subcolecao(casalId, sub)));
  acompanhar(
    setDoc(ref, {
      ...dados,
      criado_por: quem,
      criado_em: serverTimestamp(),
      atualizado_por: quem,
      atualizado_em: serverTimestamp(),
    }),
    `criar ${sub}`,
    aoFalhar,
  );
  return ref.id;
}

/** Atualiza campos de um documento do casal (ou o próprio casal, com sub = null). */
export function atualizar(
  casalId: string,
  sub: Subcolecao | null,
  id: string | null,
  campos: Dados,
  aoFalhar?: (erro: unknown) => void,
) {
  const caminho = sub && id ? caminhos.documento(casalId, sub, id) : caminhos.casal(casalId);
  acompanhar(
    updateDoc(doc(db(), caminho), { ...campos, atualizado_por: uid(), atualizado_em: serverTimestamp() }),
    `atualizar ${sub ?? 'casal'}`,
    aoFalhar,
  );
}

/**
 * Troca o modo do app do casal (13.9). Quem chama confere antes que há conexão (regra 8).
 * A geração de módulos nunca gerados fica com o servidor (Etapa 3).
 */
export function trocarModoApp(casalId: string, novo: ModoApp, aoFalhar?: (erro: unknown) => void) {
  atualizar(casalId, null, null, { modo_app: novo, modo_alterado_por: uid(), modo_alterado_em: serverTimestamp() }, aoFalhar);
}

type DadosImovel = Omit<Imovel, 'criado_por' | 'criado_em' | 'atualizado_por' | 'atualizado_em'>;

/** T08: imóvel do casal (casais/{casal}/imovel/principal). Cria na primeira vez; depois, atualiza. */
export function gravarImovel(casalId: string, dados: DadosImovel, jaExiste: boolean, aoFalhar?: (erro: unknown) => void) {
  const ref = doc(db(), caminhos.imovel(casalId));
  const quem = uid();
  const gravacao = jaExiste
    ? updateDoc(ref, { ...dados, atualizado_por: quem, atualizado_em: serverTimestamp() })
    : setDoc(ref, { ...dados, criado_por: quem, criado_em: serverTimestamp(), atualizado_por: quem, atualizado_em: serverTimestamp() });
  acompanhar(gravacao, 'gravar imovel', aoFalhar);
}

/** T11 "Ativar lembretes" e, depois, as preferências do Perfil. */
export function atualizarPreferencias(preferencias: PreferenciasNotificacao, aoFalhar?: (erro: unknown) => void) {
  acompanhar(
    updateDoc(doc(db(), caminhos.usuario(uid())), { preferencias_notificacao: preferencias, atualizado_em: serverTimestamp() }),
    'preferencias',
    aoFalhar,
  );
}

/** Exclusão definitiva (13.8). Quem chama já pediu confirmação ao usuário. */
export function excluir(casalId: string, sub: Subcolecao, id: string, aoFalhar?: (erro: unknown) => void) {
  acompanhar(deleteDoc(doc(db(), caminhos.documento(casalId, sub, id))), `excluir ${sub}`, aoFalhar);
}

export type OperacaoLote =
  | { tipo: 'criar'; sub: Subcolecao; dados: Dados }
  | { tipo: 'atualizar'; sub: Subcolecao; id: string; dados: Dados }
  | { tipo: 'atualizarCasal'; dados: Dados }
  | { tipo: 'excluir'; sub: Subcolecao; id: string };

/**
 * Várias gravações que precisam acontecer juntas (ex.: T37 fecha o fornecedor, conclui a tarefa e
 * cria as parcelas; reordenar tarefas). Tudo ou nada, e funciona offline. Devolve os ids criados.
 */
export function emLote(casalId: string, operacoes: OperacaoLote[], contexto: string, aoFalhar?: (erro: unknown) => void): string[] {
  const quem = uid();
  const lote = writeBatch(db());
  const criados: string[] = [];
  for (const op of operacoes) {
    if (op.tipo === 'criar') {
      const ref = doc(collection(db(), caminhos.subcolecao(casalId, op.sub)));
      criados.push(ref.id);
      lote.set(ref, {
        ...op.dados,
        criado_por: quem,
        criado_em: serverTimestamp(),
        atualizado_por: quem,
        atualizado_em: serverTimestamp(),
      });
    } else if (op.tipo === 'atualizar') {
      lote.update(doc(db(), caminhos.documento(casalId, op.sub, op.id)), { ...op.dados, atualizado_por: quem, atualizado_em: serverTimestamp() });
    } else if (op.tipo === 'atualizarCasal') {
      lote.update(doc(db(), caminhos.casal(casalId)), { ...op.dados, atualizado_por: quem, atualizado_em: serverTimestamp() });
    } else {
      lote.delete(doc(db(), caminhos.documento(casalId, op.sub, op.id)));
    }
  }
  acompanhar(lote.commit(), contexto, aoFalhar);
  return criados;
}

/** Id novo para um documento (criado no aparelho, para já navegar até ele antes de o servidor confirmar). */
export function novoId(casalId: string, sub: Subcolecao): string {
  return doc(collection(db(), caminhos.subcolecao(casalId, sub))).id;
}

/** Cria um documento com id escolhido (ex.: id gerado antes por novoId). */
export function criarComId(casalId: string, sub: Subcolecao, id: string, dados: Dados, aoFalhar?: (erro: unknown) => void) {
  const quem = uid();
  acompanhar(
    setDoc(doc(db(), caminhos.documento(casalId, sub, id)), {
      ...dados,
      criado_por: quem,
      criado_em: serverTimestamp(),
      atualizado_por: quem,
      atualizado_em: serverTimestamp(),
    }),
    `criar ${sub}`,
    aoFalhar,
  );
}
