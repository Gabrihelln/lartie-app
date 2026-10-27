// Modelo de dados da Seção 3 da especificação funcional, no formato gravado no Firestore.
// Convenções:
// - Nomes de campos iguais aos da especificação (snake_case).
// - `dinheiro` em centavos (inteiro). `data` como texto "aaaa-mm-dd"; `mês/ano` como "aaaa-mm".
// - Data e hora como Timestamp do Firestore (cada SDK tem a sua classe; aqui só importa `toDate`).
// - O id de cada documento é o id do Firestore; `casal_id` não é repetido nas subcoleções
//   (o caminho casais/{casal_id}/… já diz de quem é).

export interface Instante {
  toDate(): Date;
}

/** Centavos de real. R$ 1.300,00 = 130000. */
export type Dinheiro = number;
/** "aaaa-mm-dd" */
export type DataCalendario = string;
/** "aaaa-mm" */
export type MesAno = string;
/** URL de um arquivo guardado na VPS (Seção 3 da proposta de stack). */
export type Arquivo = string;

export interface Auditoria {
  criado_por: string;
  criado_em: Instante;
  atualizado_por: string;
  atualizado_em: Instante;
}

// 3.1 Casal ------------------------------------------------------------------

export const MODOS_APP = ['casamento', 'casa', 'os_dois', 'indefinido'] as const;
export type ModoApp = (typeof MODOS_APP)[number];

export const ESTILOS_CASAMENTO = ['so_civil', 'civil_religioso', 'mini_wedding', 'festa_grande', 'destination'] as const;
export type EstiloCasamento = (typeof ESTILOS_CASAMENTO)[number];

export interface Casal extends Auditoria {
  nome_1: string;
  nome_2: string | null;
  foto: Arquivo | null;
  data_casamento: DataCalendario | null;
  cidade: string | null;
  uf: string | null;
  estilo: EstiloCasamento | null;
  num_convidados_previsto: number | null;
  orcamento_total: Dinheiro | null;
  /** Usado nos links públicos lartie.app/{slug}. Gravado só pelo servidor. */
  slug: string | null;
  modo_app: ModoApp;
  modo_alterado_em: Instante | null;
  modo_alterado_por: string | null;
  /** Gravado só pelo servidor, ao gerar checklist e enxoval. Trocar de modo nunca apaga nada. */
  modulos_gerados: { casamento: boolean; casa: boolean };
  onboarding_concluido: boolean;
  /** Passo do onboarding em que o casal parou (retoma daí se o app fechar). */
  onboarding_passo: 'T06' | 'T06b' | 'T07' | 'T08' | 'T09' | 'T10' | 'T11' | null;
  /** Respostas do onboarding que não viram campos próprios (T09). */
  onboarding_respostas: {
    ja_mora_sozinho: boolean | null;
    /** Quem já mora sozinho (decisão de 26/10/2026): os itens marcados ficam como "já era de" essa pessoa. */
    quem_mora_sozinho: 'noivo_1' | 'noivo_2' | 'os_dois' | null;
    ja_temos: string[];
  } | null;
  /** P05: "Terá cerimônia religiosa?" (T07) para estilos sem "religioso" no nome. */
  cerimonia_religiosa: boolean | null;
  /** 3.16: configuração do RSVP. */
  rsvp_prazo: DataCalendario | null;
  /** Etapa 6: horário ("17:00") e local da cerimônia, no cabeçalho da confirmação de presença (T30). */
  horario_casamento: string | null;
  local_casamento: string | null;
  buffet_valor_por_pessoa: Dinheiro | null;
  /** Gravado só pelo servidor: o noivo_2 que entrou pelo convite (null = parceiro ainda não entrou). */
  parceiro: { uid: string; nome: string } | null;
  /** T56 aparece uma vez por fase do checklist (13.3). */
  fases_celebradas: FaseTarefa[];
  /** T27: modelo da mensagem de agradecimento, com [nome] e [presente]. Null = modelo padrão. */
  modelo_agradecimento: string | null;
}

// 3.2 Usuário -----------------------------------------------------------------

export const PROVEDORES_LOGIN = ['email', 'google', 'apple'] as const;
export type ProvedorLogin = (typeof PROVEDORES_LOGIN)[number];

export const PAPEIS = ['noivo_1', 'noivo_2'] as const;
export type Papel = (typeof PAPEIS)[number];

export interface PreferenciasNotificacao {
  tarefas: boolean;
  parcelas: boolean;
  reservas: boolean;
  rsvp: boolean;
  /** "hh:mm" */
  silencio_inicio: string;
  silencio_fim: string;
}

export const PREFERENCIAS_PADRAO: PreferenciasNotificacao = {
  tarefas: true,
  parcelas: true,
  reservas: true,
  rsvp: true,
  silencio_inicio: '22:00',
  silencio_fim: '08:00',
};

/** usuarios/{uid}. O id é o uid do Firebase Auth. */
export interface Usuario {
  casal_id: string | null;
  nome: string;
  email: string;
  provedor_login: ProvedorLogin;
  papel: Papel | null;
  preferencias_notificacao: PreferenciasNotificacao;
  /** Tokens de push (FCM) dos aparelhos do usuário. */
  tokens_push: string[];
  /** T43: gravado pelo servidor quando a pessoa é removida do plano; o app avisa uma vez. */
  removido_do_plano: { nome: string; em: Instante } | null;
  criado_em: Instante;
  atualizado_em: Instante;
}

// 3.3 Convite de parceiro ---------------------------------------------------------

export const STATUS_CONVITE = ['pendente', 'aceito', 'expirado', 'cancelado'] as const;
export type StatusConvite = (typeof STATUS_CONVITE)[number];

/** convites_parceiro/{codigo}. Gravado só pelo servidor. */
export interface ConviteParceiro {
  casal_id: string;
  criado_por: string;
  aceito_por: string | null;
  codigo: string;
  email: string | null;
  criado_em: Instante;
  expira_em: Instante;
  status: StatusConvite;
}

// 3.4 Imóvel --------------------------------------------------------------------

export interface Imovel extends Auditoria {
  tipo: 'apartamento' | 'casa';
  quartos: number;
  banheiros: number;
  posse: 'alugado' | 'proprio';
  mobiliado: 'sim' | 'em_parte' | 'nao';
  data_mudanca: MesAno | null;
  tem_pets: boolean;
  moradores: number;
}

// 3.5 Cômodo --------------------------------------------------------------------

export interface ParedeLivre {
  id: string;
  nome: string;
  largura_m: number;
}

export interface Comodo extends Auditoria {
  nome: string;
  ordem: number;
  largura_m: number | null;
  comprimento_m: number | null;
  pe_direito_m: number | null;
  paredes_livres: ParedeLivre[];
  /** T55 já apareceu para este cômodo; volta a false quando ele deixa de estar completo (13.3). */
  celebrado: boolean;
}

// 3.6 Item do enxoval -------------------------------------------------------------

export const FASES_ITEM = ['primeira_noite', 'primeiro_mes', 'com_calma'] as const;
export type FaseItem = (typeof FASES_ITEM)[number];

export const ESTADOS_ITEM = ['falta', 'ja_tenho', 'na_lista'] as const;
export type EstadoItem = (typeof ESTADOS_ITEM)[number];

export const ORIGENS_ITEM = ['comprado', 'ganhado', 'ja_era_nosso'] as const;
export type OrigemItem = (typeof ORIGENS_ITEM)[number];

export interface Item extends Auditoria {
  comodo_id: string;
  nome: string;
  fase: FaseItem;
  quantidade: number;
  estado: EstadoItem;
  /** Só quando estado = ja_tenho. */
  origem: OrigemItem | null;
  /** Só quando origem = ganhado. */
  quem_deu: string | null;
  /** Só quando origem = ja_era_nosso e o item já era de uma das duas pessoas (T09). */
  era_de: 'noivo_1' | 'noivo_2' | null;
  preco_estimado: Dinheiro | null;
  link_loja: string | null;
  medidas: { largura_cm: number | null; profundidade_cm: number | null; altura_cm: number | null } | null;
  /** Id de uma parede livre do cômodo (ParedeLivre.id). */
  parede_destino: string | null;
  observacao: string | null;
  foto: Arquivo | null;
  gerado_pelo_plano: boolean;
  /** Id no catálogo de dados/ (itens gerados pelo plano). */
  catalogo_id: string | null;
  /** Sugestão do catálogo para a lista de presentes. */
  bom_para_presente: boolean;
  /**
   * Categoria do orçamento da casa (categorias_orcamento/{id}) para o gasto quando o item é
   * comprado com preço (13.4). Escolhida no item; null = "Enxoval".
   */
  categoria_orcamento: string | null;
}

// 3.7 Tarefa --------------------------------------------------------------------

export const FASES_TAREFA = [
  'decisoes_iniciais',
  'fornecedores_principais',
  'detalhes',
  'documentos_reta_final',
  'semana_casamento',
] as const;
export type FaseTarefa = (typeof FASES_TAREFA)[number];

export const RESPONSAVEIS = ['noivo_1', 'noivo_2', 'os_dois'] as const;
export type Responsavel = (typeof RESPONSAVEIS)[number];

export const STATUS_TAREFA = ['a_fazer', 'em_andamento', 'concluida'] as const;
export type StatusTarefa = (typeof STATUS_TAREFA)[number];

/** "Atrasada" é calculado (status ≠ concluída e prazo < hoje), nunca gravado. */
export interface Tarefa extends Auditoria {
  titulo: string;
  fase: FaseTarefa;
  prazo: DataCalendario | null;
  responsavel: Responsavel;
  status: StatusTarefa;
  fornecedor_id: string | null;
  notas: string | null;
  lembrete_ativo: boolean;
  oculta: boolean;
  ordem: number;
  gerada_pelo_plano: boolean;
  /** Id no catálogo de dados/ (tarefas geradas pelo plano). */
  catalogo_id: string | null;
  /** O prazo foi mudado à mão no T14: mudar a data do casamento não recalcula este prazo. */
  prazo_manual: boolean;
}

// 3.8 Fornecedor ------------------------------------------------------------------

export const STATUS_FORNECEDOR = ['pesquisando', 'orcamento_pedido', 'negociando', 'fechado', 'descartado'] as const;
export type StatusFornecedor = (typeof STATUS_FORNECEDOR)[number];

export interface Fornecedor extends Auditoria {
  nome: string;
  /** Id da categoria de orçamento do casamento (categorias_orcamento/{id}, 13.4). */
  categoria: string;
  contato_whatsapp: string | null;
  contato_instagram: string | null;
  contato_telefone: string | null;
  valor: Dinheiro | null;
  o_que_inclui: string | null;
  status: StatusFornecedor;
  forma_pagamento: string | null;
  contrato: Arquivo | null;
  notas: string | null;
  data_orcamento: DataCalendario | null;
}

// 3.9 Parcela -------------------------------------------------------------------

export interface Parcela extends Auditoria {
  fornecedor_id: string;
  numero: number;
  descricao: string;
  valor: Dinheiro;
  vencimento: DataCalendario;
  paga: boolean;
  paga_em: DataCalendario | null;
}

// 3.10 Categoria de orçamento -------------------------------------------------------

export const ESCOPOS_ORCAMENTO = ['casamento', 'casa'] as const;
export type EscopoOrcamento = (typeof ESCOPOS_ORCAMENTO)[number];

/** "Gasto" é calculado (13.4), nunca gravado. */
export interface CategoriaOrcamento extends Auditoria {
  escopo: EscopoOrcamento;
  nome: string;
  planejado: Dinheiro | null;
  ordem: number;
}

// 3.11 Lançamento avulso ------------------------------------------------------------

export const ORIGENS_GASTO = ['manual', 'nota_fiscal', 'item', 'fornecedor'] as const;
export type OrigemGasto = (typeof ORIGENS_GASTO)[number];

export interface Gasto extends Auditoria {
  categoria_id: string;
  descricao: string;
  valor: Dinheiro;
  data: DataCalendario;
  origem: OrigemGasto;
}

// 3.12 Lista de presentes -----------------------------------------------------------

export const OCASIOES = ['cha_panela', 'cha_cozinha', 'cha_bar', 'casamento'] as const;
export type Ocasiao = (typeof OCASIOES)[number];

export const STATUS_LISTA = ['rascunho', 'publicada', 'despublicada'] as const;
export type StatusLista = (typeof STATUS_LISTA)[number];

export interface ListaPresentes extends Auditoria {
  ocasiao: Ocasiao;
  data_evento: DataCalendario | null;
  /** Único por casal. A publicação (status) é feita pelo servidor, que também valida o slug. */
  slug_lista: string;
  status: StatusLista;
  modo_surpresa: boolean;
  endereco_entrega: string | null;
  /** Texto do cabeçalho da página do convidado (T25), editável em "Editar lista". */
  mensagem: string | null;
}

export interface ListaItem extends Auditoria {
  lista_id: string;
  /** Item do enxoval; vazio para item avulso (T24 "Item avulso"). */
  item_id: string;
  quantidade_na_lista: number;
  /** Item avulso: só existe na lista, fora do enxoval. */
  avulso: { nome: string; preco_estimado: number | null; link_loja: string | null } | null;
  /**
   * Unidades em reservas ativas ou recebidas. Mantido só pelo servidor, dentro da transação da
   * reserva: é o que garante que dois convidados não reservem a última unidade (13.5).
   */
  quantidade_reservada?: number;
}

// 3.13 Reserva -------------------------------------------------------------------

export const STATUS_RESERVA = ['ativa', 'recebida', 'expirada', 'cancelada'] as const;
export type StatusReserva = (typeof STATUS_RESERVA)[number];

/** Criada só pelo servidor, de forma atômica (13.5). O token do convidado não fica neste documento. */
export interface Reserva {
  lista_item_id: string;
  lista_id: string;
  quantidade: number;
  nome_convidado: string;
  whatsapp: string | null;
  mensagem: string | null;
  status: StatusReserva;
  criada_em: Instante;
  expira_em: Instante;
  atualizado_em: Instante;
  /** O aviso "expira em 2 dias" já foi para o casal. */
  aviso_expiracao: boolean;
}

// 3.14 Agradecimento ---------------------------------------------------------------

export interface Agradecimento extends Auditoria {
  reserva_id: string | null;
  item_id: string | null;
  nome: string;
  presente_descricao: string;
  /** WhatsApp do convidado (da reserva), para o "Agradecer" (T27). */
  whatsapp: string | null;
  /** Ocasião da lista, para "{presente} · {ocasião}". Null para presentes fora da lista. */
  ocasiao: Ocasiao | null;
  agradecido: boolean;
  agradecido_em: Instante | null;
}

// 3.15 Grupo de convidados -----------------------------------------------------------

export const LADOS = ['noivo_1', 'noivo_2', 'os_dois'] as const;
export type Lado = (typeof LADOS)[number];

export const TIPOS_GRUPO = ['familia', 'amigos', 'trabalho'] as const;
export type TipoGrupo = (typeof TIPOS_GRUPO)[number];

/** O token do link de RSVP fica só no servidor (tokens_rsvp/{token}). */
export interface Grupo extends Auditoria {
  nome: string;
  lado: Lado;
  tipo: TipoGrupo;
  whatsapp: string | null;
  convite_enviado_em: Instante | null;
  ultimo_lembrete_em: Instante | null;
  /** T30: recado do grupo para os noivos e quando respondeu (gravados pelo servidor). */
  recado: string | null;
  respondido_em: Instante | null;
}

// 3.16 Convidado ------------------------------------------------------------------

export const PRESENCAS = ['sem_resposta', 'vai', 'nao_vai'] as const;
export type Presenca = (typeof PRESENCAS)[number];

export const RESTRICOES = ['nenhuma', 'vegetariano', 'vegano', 'sem_gluten', 'sem_lactose', 'outra'] as const;
export type RestricaoAlimentar = (typeof RESTRICOES)[number];

export interface Convidado extends Auditoria {
  grupo_id: string;
  nome: string;
  faixa: 'adulto' | 'crianca';
  presenca: Presenca;
  restricao_alimentar: RestricaoAlimentar;
  restricao_outra: string | null;
}

// 3.17 Notificação ------------------------------------------------------------------

export const TIPOS_NOTIFICACAO = [
  'tarefa_perto_prazo',
  'tarefa_atrasada',
  'parcela_a_vencer',
  'nova_reserva',
  'reserva_expirando',
  /** 13.5: a reserva expirou e o item voltou a ficar disponível. */
  'reserva_expirada',
  'rsvp_respondido',
  'alteracao_parceiro',
  'comodo_completo',
  'orcamento_estourado',
  'parceiro_entrou',
  /** Ajuste da Etapa 2: o convite foi recusado por quem recebeu o link. */
  'convite_recusado',
  /** Etapa 4 (pedido do dono do produto): quem entrou pelo convite saiu do plano. */
  'parceiro_saiu',
  'modo_alterado',
  'escolher_por_onde_comecar',
] as const;
export type TipoNotificacao = (typeof TIPOS_NOTIFICACAO)[number];

/** Criada só pelo servidor. O casal só pode marcar como lida. */
export interface Notificacao {
  /** null = para os dois. */
  usuario_id: string | null;
  tipo: TipoNotificacao;
  texto: string;
  destino: string;
  lida: boolean;
  criada_em: Instante;
}

// 3.18 Conversa da assistente (IA fora do escopo atual, P14; o modelo fica reservado) ----------

export interface MensagemAssistente {
  autor: string;
  texto: string;
  anexos: Arquivo[];
  acao_proposta: Record<string, unknown> | null;
  status_acao: 'pendente' | 'confirmada' | 'cancelada' | null;
  criada_em: Instante;
}
