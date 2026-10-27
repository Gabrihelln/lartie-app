# Relatório · Etapa 7 · Modais de confirmação (auditoria) + P04

## Resumo

Conferi todas as confirmações do app e da web contra a Seção 15 da especificação:
- **Catálogo:** os textos agora ficam em um só lugar (`mobile/src/feedback/confirmacoes.ts`), usado pelas telas e coberto por testes.
- **Quatro problemas corrigidos:**
  - "Tirar da lista?" com reserva não estava em vermelho;
  - a escolha "Como criar os grupos?" virava uma opção ao tocar fora;
  - faltava o aviso depois de excluir uma parede livre ou uma parcela;
  - na web, o "Desfazer a reserva?" não fechava ao tocar fora nem com Esc.

Também entrou a **P04 (seção "Mudança" na tela Casa)**, pedida para esta etapa.

## Como testar

- **Builds:** não há biblioteca nativa nova. Basta recarregar o app (`r` no Metro). A web recarrega sozinha.
- **Roteiro:**
  1. **Padrão (vale para qualquer confirmação da tabela abaixo):**
     - tocar fora ou usar o botão voltar do Android cancela;
     - o botão da direita confirma;
     - o botão destrutivo fica em vermelho;
     - depois de excluir, aparece um aviso.
  2. **Correções:**
     - Lista ou Cômodo → tirar da lista um item com reserva: o botão "Tirar da lista" agora fica em vermelho;
     - Convidados → Importar contatos → "Importar n": a escolha abre em folha, e tocar fora cancela;
     - Medidas → excluir parede: aparece "{parede} excluída";
     - Fornecedor → parcela → "Excluir parcela": aparece "Parcela excluída";
     - na web, "Desfazer reserva" → tocar fora do diálogo ou apertar Esc cancela.
  3. **P04, seção "Mudança":**
     - Casa → abaixo dos cômodos;
     - num casal que já tinha a casa, as tarefas do catálogo aparecem na primeira abertura;
     - imóvel alugado inclui a vistoria de entrada e o contrato de locação;
     - prazo: "até dd/mm" (com data da mudança) ou "{n} dias antes da mudança";
     - marcar a tarefa tem "Desfazer";
     - "+ Tarefa" cria uma tarefa nova;
     - tocar no nome edita, e "Excluir tarefa" pede confirmação.

## Tabela de rastreio

**Seção 15: confirmações com protótipo**

| ID | Confirmação | Onde abre | Tom | Aviso depois | Teste automatizado |
| --- | --- | --- | --- | --- | --- |
| T34 | Excluir esta tarefa? | T14 "Excluir tarefa", T13 (gesto) | destrutivo | "Tarefa excluída" | `confirmacoes.test.ts` › T34 |
| T35 | Excluir "{item}"? | T20 "Excluir" | destrutivo | "Item excluído" (e avisar convidados, se houver reserva) | `confirmacoes.test.ts` › T35; API: tirar da lista cancela a reserva |
| T36 | Descartar as alterações? | T14, T17, T20, T29, T33b, formulários do Perfil, Meus dados | destrutivo | — | `confirmacoes.test.ts` › T36; `descartar.test.ts` |
| T37 | Marcar {fornecedor} como fechado? | T17 status "Fechado" ou botão | padrão | "Fornecedor fechado" | `confirmacoes.test.ts` › T37; regras: `tarefasConcluidasAoFechar` |
| T38 | Lembrar {n} pessoas? | T28 "Lembrar pendentes" | WhatsApp | folha "Enviar lembretes" | `confirmacoes.test.ts` › T38; regras: `podeLembrar` |
| T39 | Publicar a lista do {ocasião}? | T23 "Publicar link", T24 | padrão | "Lista publicada" → T65 | `confirmacoes.test.ts` › T39; API: publicar |
| T40 | Desfazer a reserva? | web T26 e página da reserva | — (web) | "Reserva desfeita" | API: desfazer; teste de ponta a ponta da web (Etapa 5) |
| T41 | Sair da conta? | T33 | padrão | volta ao T02 | `confirmacoes.test.ts` › T41 |
| T42 | Excluir a conta e todos os dados? (digitar EXCLUIR) | T33 | destrutivo | volta ao T02 | `confirmacoes.test.ts` › T42; API: exclusão (Etapa 3) |
| T43 | Remover {nome} do plano? | T33 › Parceiro(a) (só quem criou o plano) | destrutivo | "{nome} saiu do plano" | `confirmacoes.test.ts` › T43; API: remover parceiro |

**Seção 15: confirmações menores, sem protótipo**

| Confirmação | Onde abre | Tom | Aviso depois | Teste automatizado |
| --- | --- | --- | --- | --- |
| Excluir {fornecedor}? | T17 | destrutivo | "Fornecedor excluído" | `confirmacoes.test.ts` › menores |
| Excluir {grupo} e {n} pessoas? | T29 | destrutivo | "Grupo excluído" | idem |
| Excluir a lista do {ocasião}? | T24 › "…" | destrutivo | "Lista excluída" + avisar convidados | idem; API: excluir lista |
| Despublicar a lista? | T24 › "…" | padrão | "Lista despublicada" | idem |
| Excluir {cômodo}? / mover os itens | T19 › "…" | destrutivo | "{cômodo} excluído" | idem |
| Tirar da lista? (item com reserva) | T19, T24 | destrutivo (**corrigido**) | "{item} saiu da lista" + avisar convidado | idem; API: tirar da lista |
| Cancelar a reserva? | T24 (segurar a reserva) | destrutivo | folha "Avisar o convidado" | idem; API: cancelar pelo casal |
| Excluir "{gasto}"? | T15 › categoria | destrutivo | "Gasto excluído" | idem |
| Marcar como paga? | T15 › próximas parcelas | padrão | "Parcela marcada como paga" | idem |

**Outras confirmações do app, no mesmo padrão**

| Confirmação | Onde abre | Tom | Aviso depois | Teste automatizado |
| --- | --- | --- | --- | --- |
| Excluir "{parcela}"? | T17 › parcela | destrutivo | "Parcela excluída" (**novo**) | `confirmacoes.test.ts` |
| Excluir "{parede}"? | T21 | destrutivo | "{parede} excluída" (**novo**) | idem |
| Remover o contrato? | T17 | destrutivo | "Contrato removido" | idem |
| Sair do plano de {nome}? | T33 (quem entrou pelo convite) | destrutivo | novo plano | idem; API: sair do plano |
| Excluir esta tarefa? (mudança, P04) | T18 › Mudança | destrutivo | "Tarefa excluída" | idem |
| Mudar para "{modo}"? | T33b (folha) | — | "Modo atualizado…" | regras: `textoConfirmacaoModo` |
| Ativar {módulo}? | Início (folha, links para módulo oculto) | — | "Modo atualizado…" | regras: `modoAoAtivar`, `textoAtivarModulo` |
| Trocar de plano? | T66 (conta com plano) | padrão | — | — (Etapa 2) |
| Recusar o convite? | T66 | destrutivo | "Convite recusado" | API (Etapa 2) |
| Como criar os grupos? | Importar contatos | folha (**corrigido**) | "{n} grupos criados" | — |

**Padrão único:**

| Regra | Onde fica | Situação |
| --- | --- | --- |
| Tocar fora ou voltar = cancelar | `Dialogo.tsx` (véu e `onRequestClose`); folhas (`FolhaInferior`); web (`componentes/Dialogo.tsx`, **novo**) | ok |
| Leitor de tela anuncia como alerta | `accessibilityRole="alert"` + `announceForAccessibility`; web `role="alertdialog"` | ok |
| Destrutivo em `error` | `tom: 'destrutivo'` em todas as exclusões | ok (teste "toda exclusão é destrutiva") |
| Aviso depois de excluir | todas as exclusões (tabelas acima) | ok |

**Sem pendências na tabela.**

**Testes:** 207 automatizados, todos passando.

| Conjunto | Testes |
| --- | --- |
| Regras | 92 (2 novos da P04) |
| API | 46 (1 novo: a casa gera as tarefas da mudança) |
| Regras do Firestore | 22 (1 novo: tarefas da mudança) |
| App | 47 (24 novos de confirmações) |

## Definição de pronto (Seção 0.4)

- [x] Confirmações conferidas e no padrão (tabela acima).
- [x] P04: tokens, tema claro e escuro, acessibilidade (caixa com estado), offline (fila do Firestore), modo (só com a casa ativa) e testes.

## Divergências da especificação ou do protótipo

1. **"Como criar os grupos?":** passou de diálogo para folha, com as duas opções como botões. Num diálogo, tocar fora escolhia uma delas.
2. **P04:**
   - a seção "Mudança" fica na tela Casa, abaixo dos cômodos;
   - tarefas sem data de mudança mostram "{n} dias antes da mudança";
   - o mês da mudança conta a partir do dia 1;
   - coleção nova `tarefas_mudanca` e campo `casal.mudanca_gerada`.

## Pendências e riscos

Nenhuma nova.

---
Aguardando: `APROVADO ETAPA 7` ou `AJUSTES ETAPA 7: …`
