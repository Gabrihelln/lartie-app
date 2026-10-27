# Progresso do desenvolvimento

| Etapa | Nome | Status | Aprovação | Relatório |
| --- | --- | --- | --- | --- |
| 0 | Fundação | Aprovada | 20/10/2026 (stack e etapa) | [proposta de stack](relatorios/etapa-0-proposta-stack.md) · [relatório](relatorios/etapa-0.md) |
| 1 | Acesso e login | Aprovada | 25/10/2026 | [relatório](relatorios/etapa-1.md) |
| 2 | Onboarding (com modo do app) | Aprovada | 26/10/2026 | [relatório](relatorios/etapa-2.md) |
| 3 | Início por modo e Casamento | Aprovada | 26/10/2026 | [relatório](relatorios/etapa-3.md) |
| 4 | Casa nova | Aprovada | 27/10/2026 | [relatório](relatorios/etapa-4.md) |
| 5 | Lista de presentes e reservas | Não iniciada | | |
| 6 | Convidados e RSVP | Não iniciada | | |
| 7 | Modais de confirmação (auditoria) | Não iniciada | | |
| 8 | Erros, avisos e estados (auditoria) | Não iniciada | | |
| 9 | Notificações (Assistente Lu fora do escopo atual, P14) | Não iniciada | | |
| 10 | Preparação para as lojas | Não iniciada | | |

**Etapa atual:** 5 · Lista de presentes e reservas · não iniciada (Etapa 4 aprovada e unida à `main`).

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
