// Onde cada entidade da Seção 3 mora no Firestore.
//
// usuarios/{uid}
// casais/{casal_id}
// casais/{casal_id}/imovel/principal
// casais/{casal_id}/{subcoleção}/{id}       (uma por entidade, abaixo)
// convites_parceiro/{id}                     (só servidor)
// slugs/{slug}                               (só servidor: garante slug único)
// tokens_rsvp/{token}, tokens_reserva/{token} (só servidor: links públicos dos convidados)

export const COLECOES_RAIZ = {
  usuarios: 'usuarios',
  casais: 'casais',
  convitesParceiro: 'convites_parceiro',
  slugs: 'slugs',
  tokensRsvp: 'tokens_rsvp',
  tokensReserva: 'tokens_reserva',
} as const;

export const SUBCOLECOES_CASAL = {
  imovel: 'imovel',
  comodos: 'comodos',
  itens: 'itens',
  tarefas: 'tarefas',
  fornecedores: 'fornecedores',
  parcelas: 'parcelas',
  categoriasOrcamento: 'categorias_orcamento',
  gastos: 'gastos',
  listasPresentes: 'listas_presentes',
  listaItens: 'lista_itens',
  reservas: 'reservas',
  agradecimentos: 'agradecimentos',
  grupos: 'grupos',
  convidados: 'convidados',
  notificacoes: 'notificacoes',
  mensagensAssistente: 'mensagens_assistente',
} as const;

export type Subcolecao = (typeof SUBCOLECOES_CASAL)[keyof typeof SUBCOLECOES_CASAL];

export const ID_IMOVEL = 'principal';

export const caminhos = {
  usuario: (uid: string) => `${COLECOES_RAIZ.usuarios}/${uid}`,
  casal: (casalId: string) => `${COLECOES_RAIZ.casais}/${casalId}`,
  subcolecao: (casalId: string, sub: Subcolecao) => `${COLECOES_RAIZ.casais}/${casalId}/${sub}`,
  documento: (casalId: string, sub: Subcolecao, id: string) => `${COLECOES_RAIZ.casais}/${casalId}/${sub}/${id}`,
  imovel: (casalId: string) => `${COLECOES_RAIZ.casais}/${casalId}/${SUBCOLECOES_CASAL.imovel}/${ID_IMOVEL}`,
} as const;

/**
 * Claim do Firebase Auth com o casal do usuário. Gravado pelo servidor quando o casal é criado
 * ou o parceiro entra. As regras do Firestore usam o claim (e não uma leitura extra) para
 * não gastar a cota diária do plano gratuito.
 */
export const CLAIM_CASAL = 'casal_id';
