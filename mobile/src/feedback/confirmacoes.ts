// Catálogo das confirmações (especificação Seção 15). Cada tela pede o texto aqui, e os testes
// (__tests__/confirmacoes.test.ts) conferem títulos, botões e tom contra a especificação.
// Padrão: botão da esquerda cancela; destrutivas em `error`; tocar fora ou voltar = cancelar.
// Sem dependências do React Native: as telas passam o resultado para useDialogo().confirmar.

export interface Confirmacao {
  titulo: string;
  texto?: string;
  icone?: 'excluir' | 'aviso' | 'perfil' | 'presentes' | 'assistente' | 'contatos';
  tom?: 'padrao' | 'destrutivo' | 'whatsapp';
  cancelar: string;
  confirmar: string;
  textoExigido?: string;
  rotuloCampo?: string;
}

// T34 a T43 ------------------------------------------------------------------------------

/** T34 · T14 "Excluir tarefa" e T13 (gesto). */
export const excluirTarefa = (titulo: string): Confirmacao => ({
  icone: 'excluir',
  tom: 'destrutivo',
  titulo: 'Excluir esta tarefa?',
  texto: `“${titulo}” sai do checklist de vocês dois. Não dá para desfazer.`,
  cancelar: 'Cancelar',
  confirmar: 'Excluir',
});

/** T35 · T20 "Excluir". `doComodo`: "da cozinha". */
export const excluirItem = (nome: string, doComodo: string | null): Confirmacao => ({
  icone: 'excluir',
  tom: 'destrutivo',
  titulo: `Excluir “${nome}”?`,
  texto: `O item sai do enxoval${doComodo ? ` ${doComodo}` : ''} e da lista de presentes. Se alguém já reservou, o convidado será avisado.`,
  cancelar: 'Cancelar',
  confirmar: 'Excluir',
});

/** T36 · voltar com alterações (T14, T17, T20, T29, formulários do Perfil). */
export const descartarAlteracoes = (oQue = 'este item'): Confirmacao => ({
  tom: 'destrutivo',
  titulo: 'Descartar as alterações?',
  texto: `Vocês mudaram ${oQue} e ainda não salvaram.`,
  cancelar: 'Continuar editando',
  confirmar: 'Descartar',
});

/** T37 · T17 status "Fechado" ou botão. `partes`: o que acontece, já em frases curtas. */
export const fecharFornecedor = (nome: string, partes: string[]): Confirmacao => ({
  titulo: `Marcar ${nome || 'este fornecedor'} como fechado?`,
  texto: partes.length > 1 ? `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}.` : `${partes[0] ?? ''}.`,
  cancelar: 'Cancelar',
  confirmar: 'Confirmar',
});

/** T38 · T28 "Lembrar pendentes". */
export const lembrarPendentes = (pessoas: number, grupos: number, prazo: string | null, semWhatsApp: number): Confirmacao => ({
  tom: 'whatsapp',
  icone: 'assistente',
  titulo: `Lembrar ${pessoas} ${pessoas === 1 ? 'pessoa' : 'pessoas'}?`,
  texto: `Cada um dos ${grupos} grupos recebe pelo WhatsApp o link para confirmar presença${prazo ? ` até ${prazo}` : ''}.${semWhatsApp ? ` ${semWhatsApp} sem WhatsApp ficam para enviar à mão.` : ''}`,
  cancelar: 'Cancelar',
  confirmar: 'Enviar',
});

/** T39 · T23/T24 "Publicar link". `daOcasiao`: "do chá de panela". */
export const publicarLista = (daOcasiao: string): Confirmacao => ({
  icone: 'presentes',
  titulo: `Publicar a lista ${daOcasiao}?`,
  texto: 'Quem tiver o link vê os presentes e pode reservar. Dá para despublicar quando quiserem.',
  cancelar: 'Cancelar',
  confirmar: 'Publicar',
});

/** T41 · T33 "Sair da conta". */
export const sairDaConta = (): Confirmacao => ({
  titulo: 'Sair da conta?',
  texto: 'O plano de vocês continua salvo. Para voltar, é só entrar com o mesmo e-mail.',
  cancelar: 'Cancelar',
  confirmar: 'Sair',
});

/** T42 · T33 "Excluir conta e dados": só ativa com "EXCLUIR" digitado. */
export const excluirConta = (parceiro: string | null): Confirmacao => ({
  icone: 'excluir',
  tom: 'destrutivo',
  titulo: 'Excluir a conta e todos os dados?',
  texto: `Vamos apagar o checklist, o enxoval, as listas de presentes, os convidados e as fotos.${parceiro ? ` ${parceiro} também perde o acesso.` : ''} Isso não pode ser desfeito.`,
  textoExigido: 'EXCLUIR',
  rotuloCampo: 'Digite EXCLUIR para confirmar',
  cancelar: 'Cancelar',
  confirmar: 'Excluir tudo',
});

/** T43 · T33 Parceiro(a). Texto neutro em gênero (decisão de 26/10/2026). */
export const removerParceiro = (nome: string): Confirmacao => ({
  icone: 'perfil',
  tom: 'destrutivo',
  titulo: `Remover ${nome} do plano?`,
  texto: `${nome} deixa de ver e editar o casamento e a casa nova. Vocês podem enviar um novo convite depois.`,
  cancelar: 'Cancelar',
  confirmar: 'Remover',
});

// Confirmações menores (Seção 15, último parágrafo) -------------------------------------------

export const excluirFornecedor = (nome: string): Confirmacao => ({
  icone: 'excluir',
  tom: 'destrutivo',
  titulo: `Excluir ${nome}?`,
  texto: 'As parcelas também saem e as tarefas ligadas ficam sem fornecedor. Não dá para desfazer.',
  cancelar: 'Cancelar',
  confirmar: 'Excluir',
});

export const excluirGrupo = (nome: string, pessoas: number): Confirmacao => ({
  icone: 'excluir',
  tom: 'destrutivo',
  titulo: `Excluir ${nome || 'este grupo'} e ${pessoas} ${pessoas === 1 ? 'pessoa' : 'pessoas'}?`,
  texto: 'O link de confirmação deste grupo deixa de funcionar. Não dá para desfazer.',
  cancelar: 'Cancelar',
  confirmar: 'Excluir',
});

export const excluirLista = (daOcasiao: string, reservasAtivas: number): Confirmacao => ({
  icone: 'excluir',
  tom: 'destrutivo',
  titulo: `Excluir a lista ${daOcasiao}?`,
  texto: reservasAtivas
    ? `As ${reservasAtivas} reservas ativas serão canceladas e vamos ajudar vocês a avisar os convidados. Não dá para desfazer.`
    : 'Não dá para desfazer.',
  cancelar: 'Cancelar',
  confirmar: 'Excluir lista',
});

export const despublicarLista = (): Confirmacao => ({
  titulo: 'Despublicar a lista?',
  texto: 'O link passa a mostrar "Este link não está mais ativo". As reservas feitas continuam valendo.',
  cancelar: 'Cancelar',
  confirmar: 'Despublicar',
});

export const excluirComodo = (nome: string, itens: number): Confirmacao => ({
  icone: 'excluir',
  tom: 'destrutivo',
  titulo: `Excluir ${nome}?`,
  texto: itens ? `Os ${itens} itens do cômodo também saem. Não dá para desfazer.` : 'Não dá para desfazer.',
  cancelar: 'Cancelar',
  confirmar: 'Excluir',
});

/** Tirar da lista item com reserva (T19, T24): cancela a reserva do convidado. */
export const tirarDaListaComReserva = (convidado: string): Confirmacao => ({
  icone: 'aviso',
  tom: 'destrutivo',
  titulo: 'Tirar da lista?',
  texto: `Este item tem reserva de ${convidado}. Tirar da lista mesmo assim?`,
  cancelar: 'Manter',
  confirmar: 'Tirar da lista',
});

/** Cancelar reserva pelo casal (T24). */
export const cancelarReserva = (item: string, convidado: string): Confirmacao => ({
  tom: 'destrutivo',
  titulo: 'Cancelar a reserva?',
  texto: `${item} volta a ficar disponível na lista. Vamos ajudar vocês a avisar ${convidado}.`,
  cancelar: 'Manter',
  confirmar: 'Cancelar reserva',
});

export const excluirGasto = (descricao: string): Confirmacao => ({
  tom: 'destrutivo',
  titulo: `Excluir “${descricao}”?`,
  texto: 'O valor sai do orçamento.',
  cancelar: 'Cancelar',
  confirmar: 'Excluir',
});

export const marcarParcelaPaga = (descricao: string, valor: string): Confirmacao => ({
  titulo: 'Marcar como paga?',
  texto: `${descricao} de ${valor}.`,
  cancelar: 'Cancelar',
  confirmar: 'Marcar como paga',
});

// Outras exclusões do app (mesmo padrão) -------------------------------------------------------

export const excluirParcela = (descricao: string): Confirmacao => ({
  tom: 'destrutivo',
  titulo: `Excluir “${descricao}”?`,
  texto: 'A parcela sai do calendário de pagamentos.',
  cancelar: 'Cancelar',
  confirmar: 'Excluir',
});

export const excluirParede = (nome: string): Confirmacao => ({
  tom: 'destrutivo',
  titulo: `Excluir “${nome}”?`,
  texto: 'Os itens que iam para esta parede ficam sem destino.',
  cancelar: 'Cancelar',
  confirmar: 'Excluir',
});

export const removerContrato = (): Confirmacao => ({
  tom: 'destrutivo',
  titulo: 'Remover o contrato?',
  texto: 'O arquivo sai do Lartiê.',
  cancelar: 'Cancelar',
  confirmar: 'Remover',
});

export const sairDoPlano = (criador: string): Confirmacao => ({
  icone: 'perfil',
  tom: 'destrutivo',
  titulo: `Sair do plano de ${criador}?`,
  texto: `Você deixa de ver e editar o casamento e a casa nova. Os dados continuam com ${criador}, que pode enviar um novo convite depois.`,
  cancelar: 'Cancelar',
  confirmar: 'Sair do plano',
});

/** P04: excluir uma tarefa da mudança (seção "Mudança" da tela Casa). */
export const excluirTarefaMudanca = (titulo: string): Confirmacao => ({
  icone: 'excluir',
  tom: 'destrutivo',
  titulo: 'Excluir esta tarefa?',
  texto: `“${titulo}” sai das tarefas da mudança de vocês dois. Não dá para desfazer.`,
  cancelar: 'Cancelar',
  confirmar: 'Excluir',
});
