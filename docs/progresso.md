# Progresso do desenvolvimento

| Etapa | Nome | Status | Aprovação | Relatório |
| --- | --- | --- | --- | --- |
| 0 | Fundação | Aprovada | 20/10/2026 (stack e etapa) | [proposta de stack](relatorios/etapa-0-proposta-stack.md) · [relatório](relatorios/etapa-0.md) |
| 1 | Acesso e login | Aprovada | 25/10/2026 | [relatório](relatorios/etapa-1.md) |
| 2 | Onboarding (com modo do app) | Aprovada | 26/10/2026 | [relatório](relatorios/etapa-2.md) |
| 3 | Início por modo e Casamento | Aprovada | 26/10/2026 | [relatório](relatorios/etapa-3.md) |
| 4 | Casa nova | Aprovada | 27/10/2026 | [relatório](relatorios/etapa-4.md) |
| 5 | Lista de presentes e reservas | Aprovada | 27/10/2026 | [relatório](relatorios/etapa-5.md) |
| 6 | Convidados e RSVP | Aprovada | 27/10/2026 | [relatório](relatorios/etapa-6.md) |
| 7 | Modais de confirmação (auditoria) | Aprovada | 27/10/2026 | [relatório](relatorios/etapa-7.md) |
| 8 | Erros, avisos e estados (auditoria) | Não iniciada | | |
| 9 | Notificações (Assistente Lu fora do escopo atual, P14) | Não iniciada | | |
| 10 | Preparação para as lojas | Não iniciada | | |

**Etapa atual:** 8 · Erros, avisos e estados (auditoria) · não iniciada (Etapa 7 aprovada e unida à `main`).

## Registro

- **20/10/2026:** stack aprovada pelo dono do produto ("então começa o desenvolvimento de acordo com o projeto do app"), após a proposta v3: React Native CLI + Firebase (plano Spark) + VPS Hostinger KVM 1 (compartilhada com o Newzi). IA escondida (P14). Domínio a comprar (P13). Pacote movido para a raiz do repositório.
- **20/10/2026:** Firebase `lartie-dev` e `lartie` criados pelo dono do produto; regras do Firestore publicadas nos dois. Repositório no GitHub (`Gabrihelln/lartie-app`). Decisão: validar só no iOS por enquanto; Android depois. Sincronização entre dois simuladores testada e aprovada pelo dono do produto. Relatório da Etapa 0 entregue.
- **20/10/2026:** Etapa 0 aprovada pelo dono do produto ("aprovado a etapa 0"). Respostas: já tem conta Apple Developer (login com Apple e Google na Etapa 1); Android ligado antes da Etapa 5; domínio comprado antes da Etapa 5.
- **25/10/2026:** Android ligado em paralelo ao iOS (decisão do dono do produto), testado no moto g31. Firebase `lartie-dev` com Google e Apple; logins sociais testados pelo dono do produto nos dois sistemas. Relatório da Etapa 1 entregue.
- **25/10/2026:** Etapa 1 aprovada (`APROVADO ETAPA 1`). Sincronização Android ↔ iOS testada. API fica no Mac até o domínio; VPS, nova senha no app e e-mail próprio de recuperação depois do domínio; TestFlight mais para frente.
- **25/10/2026:** Etapa 2 entregue. Decisões: P05 (perguntar cerimônia religiosa no T07), P03 (usar catálogos de rascunho e revisar depois), convite por e-mail depois do domínio, foto do casal em arquivo na API. Onboarding, convite e conexão iOS ↔ Android testados pelo dono do produto.
- **26/10/2026:** ajustes da Etapa 2: recusar e cancelar convite, link com o app aberto no iOS, aviso e validade de 30 min para o convite guardado, "Quem?" no T09 (`era_de`), confirmação "Trocar de plano?". Moradores ficam 2 no MVP; catálogos ficam como estão.
- **26/10/2026:** Etapa 2 aprovada (`APROVADO ETAPA 2`). Branch `etapa-2-onboarding` unida à `main`.
- **26/10/2026:** Etapa 3 entregue: telas iniciais por modo, checklist, tarefa, orçamento, fornecedores, perfil e modo do app. Regras do Firestore publicadas no `lartie-dev` (campo `parceiro` só pelo servidor).
- **26/10/2026:** ajustes da Etapa 3: máscara de telefone no T17, campos das folhas (Novo gasto, parcelas, T14), escolha de tema no Perfil (Automático, Claro, Escuro).
- **26/10/2026:** Etapa 3 aprovada (`APROVADO ETAPA 3`). Branch `etapa-3-inicio-casamento` unida à `main`. As três perguntas do relatório (textos neutros, só o `noivo_1` remove o parceiro, categoria dos itens comprados) seguem em aberto para a Etapa 4.
- **26/10/2026:** decisões para a Etapa 4: categoria escolhida em cada item comprado; textos neutros do Perfil ficam; só quem criou o plano remove o parceiro, e quem foi convidado pode sair do plano (ajuste pedido).
- **26/10/2026:** Etapa 4 entregue: Casa, Cômodo, Item, Medidas, T55, sair do plano e sugestão de cômodos no Perfil.
- **27/10/2026:** ícone do app corrigido (PNGs do design system estavam em branco; gerados de novo dos SVGs com `npm run icones -w @lartie/tokens`).
- **27/10/2026:** Etapa 4 aprovada (`APROVADO ETAPA 4`). Branch `etapa-4-casa-nova` unida à `main`. Em aberto: vista de cima com móveis arrastáveis ou em fileiras.
- **27/10/2026:** domínio (P13) fica para o fim do projeto; testes da web do convidado no Mac.
- **27/10/2026:** Etapa 5 entregue: listas, reservas atômicas, web do convidado (Next.js 16.4.3), agradecimentos. Regras e índice publicados no `lartie-dev`.
- **27/10/2026:** Etapa 5 aprovada (`APROVADO ETAPA 5`), testada pelo dono do produto. Branch `etapa-5-presentes` unida à `main`. Em aberto: stories do Instagram com imagem gerada (por ora, compartilhamento do sistema). Ideia registrada: fotos dos convidados (P15, fora do MVP).
- **27/10/2026:** P10 decidido: convites e lembretes abrem o WhatsApp grupo a grupo; envio automático fica pendente (depende do domínio).
- **27/10/2026:** Etapa 6 entregue: Convidados, Grupo, importar contatos, lembretes, RSVP na web, estimativa do buffet.
- **27/10/2026:** Etapa 6 aprovada (`APROVADO ETAPA 6`). Branch `etapa-6-convidados` unida à `main`. Pendências P16 (stories do Instagram) e P17 (vista de cima arrastável) registradas; P04 (tarefas da mudança) segue em aberto.
- **27/10/2026:** P04 decidido: seção "Mudança" na tela Casa, entregue junto com a Etapa 7.
- **27/10/2026:** Etapa 7 entregue: auditoria das confirmações (catálogo único e tabela de rastreio), 4 correções e a P04.
- **27/10/2026:** Etapa 7 aprovada (`APROVADO ETAPA 7`). Branch `etapa-7-confirmacoes` unida à `main`.
