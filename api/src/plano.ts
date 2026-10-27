import { FieldValue, type DocumentReference, type Firestore } from 'firebase-admin/firestore';
import { caminhos, type Casal, type Imovel, type ModoApp } from '@lartie/modelo';
import {
  classificarClima,
  gerarCategorias,
  gerarChecklist,
  gerarEnxoval,
  modulosDoModo,
  slugComSufixo,
  slugDoCasal,
} from '@lartie/regras';
import { catalogos } from './catalogos';
import { ErroValidacao } from './conta';
import { db } from './firebase';

// Geração do plano (T10, especificação 13.1, 13.2 e 13.9 regra 2). Gera só os módulos ativos no
// modo do casal e ainda não gerados (modulos_gerados); gravar de novo usa os mesmos ids, então
// uma segunda chamada não duplica nada. Também reserva o endereço público (slug) do casal.

export interface ResumoPlano {
  casamento: { tarefas: number; fases: number; data_casamento: string | null } | null;
  casa: { comodos: number; itens: number; ja_marcados: number; moradores: number; pets: boolean; clima: string } | null;
  slug: string;
}

type Dados = Record<string, unknown>;

function auditoria(uid: string) {
  const agora = FieldValue.serverTimestamp();
  return { criado_por: uid, criado_em: agora, atualizado_por: uid, atualizado_em: agora };
}

/** Grava em lotes (o Firestore aceita até 500 operações por lote). */
async function gravarEmLotes(banco: Firestore, escritas: [DocumentReference, Dados][]) {
  for (let i = 0; i < escritas.length; i += 400) {
    const lote = banco.batch();
    for (const [ref, dados] of escritas.slice(i, i + 400)) lote.set(ref, dados);
    await lote.commit();
  }
}

/** Reserva slugs/{slug} para o casal: "ana-e-pedro", senão "ana-e-pedro-2"… */
async function reservarSlug(casalId: string, casal: Casal): Promise<string> {
  if (casal.slug) return casal.slug;
  const base = slugDoCasal(casal.nome_1, casal.nome_2);
  for (let n = 1; n < 100; n++) {
    const candidato = slugComSufixo(base, n);
    const ref = db.doc(`slugs/${candidato}`);
    const reservado = await db.runTransaction(async (tx) => {
      const atual = await tx.get(ref);
      if (atual.exists && atual.get('casal_id') !== casalId) return false;
      tx.set(ref, { casal_id: casalId, criado_em: FieldValue.serverTimestamp() });
      return true;
    });
    if (reservado) return candidato;
  }
  throw new Error('Não foi possível reservar um endereço para o casal');
}

/** `modoAlvo`: na troca de modo (T33b), gera os módulos do modo novo antes de gravar o modo. */
export async function gerarPlano(uid: string, casalId: string, modoAlvo?: ModoApp): Promise<ResumoPlano> {
  const refCasal = db.doc(caminhos.casal(casalId));
  const casal = (await refCasal.get()).data() as Casal | undefined;
  if (!casal) throw new ErroValidacao('Casal não encontrado.');
  const ativos = modulosDoModo(modoAlvo ?? casal.modo_app);
  const jaGerados = casal.modulos_gerados ?? { casamento: false, casa: false };
  const escritas: [DocumentReference, Dados][] = [];
  const resumo: ResumoPlano = { casamento: null, casa: null, slug: '' };

  if (ativos.casamento) {
    if (!casal.estilo || !casal.cidade || !casal.uf || !casal.num_convidados_previsto) {
      throw new ErroValidacao('Faltam dados do casamento (T07).');
    }
    const tarefas = gerarChecklist(
      { data_casamento: casal.data_casamento, estilo: casal.estilo, cerimonia_religiosa: casal.cerimonia_religiosa ?? null },
      catalogos.tarefas,
    );
    if (!jaGerados.casamento) {
      for (const t of tarefas) {
        escritas.push([
          db.doc(caminhos.documento(casalId, 'tarefas', t.catalogo_id)),
          {
            titulo: t.titulo,
            fase: t.fase,
            prazo: t.prazo,
            responsavel: t.responsavel,
            status: 'a_fazer',
            fornecedor_id: null,
            notas: null,
            lembrete_ativo: true,
            oculta: false,
            ordem: t.ordem,
            gerada_pelo_plano: true,
            catalogo_id: t.catalogo_id,
            prazo_manual: false,
            ...auditoria(uid),
          },
        ]);
      }
      for (const c of gerarCategorias('casamento', catalogos.categorias, casal.orcamento_total)) {
        escritas.push([
          db.doc(caminhos.documento(casalId, 'categorias_orcamento', c.id)),
          { escopo: c.escopo, nome: c.nome, planejado: c.planejado, ordem: c.ordem, ...auditoria(uid) },
        ]);
      }
    }
    resumo.casamento = { tarefas: tarefas.length, fases: new Set(tarefas.map((t) => t.fase)).size, data_casamento: casal.data_casamento };
  }

  if (ativos.casa) {
    const imovel = (await db.doc(caminhos.imovel(casalId)).get()).data() as Imovel | undefined;
    if (!imovel) throw new ErroValidacao('Faltam os dados da casa nova (T08).');
    if (!casal.cidade || !casal.uf) throw new ErroValidacao('Falta a cidade (T08).');
    const clima = classificarClima(casal.cidade, casal.uf, catalogos.clima);
    const { comodos, itens } = gerarEnxoval(
      {
        quartos: imovel.quartos,
        banheiros: imovel.banheiros,
        mobiliado: imovel.mobiliado,
        tem_pets: imovel.tem_pets,
        moradores: imovel.moradores,
        clima,
        ja_temos: casal.onboarding_respostas?.ja_temos ?? [],
        quem_mora_sozinho: casal.onboarding_respostas?.quem_mora_sozinho ?? null,
      },
      catalogos.enxoval,
    );
    if (!jaGerados.casa) {
      for (const c of comodos) {
        escritas.push([
          db.doc(caminhos.documento(casalId, 'comodos', c.id)),
          { nome: c.nome, ordem: c.ordem, largura_m: null, comprimento_m: null, pe_direito_m: null, paredes_livres: [], ...auditoria(uid) },
        ]);
      }
      for (const i of itens) {
        escritas.push([
          db.doc(caminhos.documento(casalId, 'itens', i.id)),
          {
            comodo_id: i.comodo_id,
            nome: i.nome,
            fase: i.fase,
            quantidade: i.quantidade,
            estado: i.ja_tenho ? 'ja_tenho' : 'falta',
            origem: i.ja_tenho ? 'ja_era_nosso' : null,
            quem_deu: null,
            era_de: i.era_de,
            preco_estimado: i.preco_estimado,
            link_loja: null,
            medidas: null,
            parede_destino: null,
            observacao: null,
            foto: null,
            gerado_pelo_plano: true,
            catalogo_id: i.catalogo_id,
            bom_para_presente: i.bom_para_presente,
            ...auditoria(uid),
          },
        ]);
      }
      for (const c of gerarCategorias('casa', catalogos.categorias, null)) {
        escritas.push([
          db.doc(caminhos.documento(casalId, 'categorias_orcamento', c.id)),
          { escopo: c.escopo, nome: c.nome, planejado: c.planejado, ordem: c.ordem, ...auditoria(uid) },
        ]);
      }
    }
    resumo.casa = {
      comodos: comodos.length,
      itens: itens.length,
      ja_marcados: itens.filter((i) => i.ja_tenho).length,
      moradores: imovel.moradores,
      pets: imovel.tem_pets,
      clima,
    };
  }

  await gravarEmLotes(db, escritas);
  resumo.slug = await reservarSlug(casalId, casal);
  await refCasal.update({
    slug: resumo.slug,
    modulos_gerados: {
      casamento: jaGerados.casamento || ativos.casamento,
      casa: jaGerados.casa || ativos.casa,
    },
    atualizado_por: uid,
    atualizado_em: FieldValue.serverTimestamp(),
  });
  return resumo;
}

