# Lartiê — Pendências do dono do produto

Decisões e itens que **não** estão definidos nos documentos. O Claude Code não deve inventar respostas para estes pontos: ao chegar neles, pergunta no relatório da etapa e usa um marcador visível (`[a definir]`) até a resposta.

| ID | Pendência | Precisa até | Observação |
| --- | --- | --- | --- |
| P01 | Tecnologia do app e do backend | Etapa 0 (`APROVADO STACK`) | O Claude Code propõe; você aprova |
| P02 | Contas e acessos: Apple Developer, Google Play Console, domínio `lartie.app` / `lartie.com.br`, backend, chave de IA, e-mail transacional | Etapa 0 (backend) e Etapa 1 (login Apple/Google) | Só você pode criar e pagar |
| P03 | Revisar os catálogos de `dados/` (tarefas, enxoval, clima, preços de referência) | Etapa 2 | São rascunhos; os números do protótipo (64 tarefas, 182 itens) são ilustrativos. **25/10/2026:** seguir com o rascunho e revisar depois (observações no relatório da Etapa 2). **26/10/2026:** fica como está no MVP |
| P04 | Onde aparecem as tarefas da mudança (`tarefas_mudanca` em `dados/catalogo-tarefas.json`), especialmente no modo "Só casa nova", que não tem checklist | Etapa 4 | Sugestão: seção "Mudança" na tela Casa |
| P05 | Estilos sem "religioso" no nome podem ter cerimônia religiosa? (ex.: festa grande com igreja) | Etapa 2 | **Decidido em 25/10/2026:** perguntar "Terá cerimônia religiosa?" no T07 |
| P06 | Aprovar os textos de `docs/textos-e-mensagens.md` | Etapas 2, 5 e 6 | |
| P07 | Preço, plano e assinatura (item "Assinatura" do perfil) | Etapa 10 | No MVP fica como espaço reservado |
| P08 | E-mail de contato, razão social e CNPJ | Etapa 10 | Aparecem nas lojas, nos termos e no rodapé da web |
| P09 | Termos de uso e política de privacidade (LGPD, dados de convidados, fotos) | Etapa 10 | Recomendado revisar com advogado; exigidos pelas duas lojas |
| P10 | Serviço de envio de WhatsApp em lote (T38) ou só abrir o WhatsApp grupo a grupo | Etapa 6 | A especificação aceita os dois caminhos. **27/10/2026:** no MVP, abrir o WhatsApp grupo a grupo com a mensagem pronta. O envio automático (serviço de mensagens) continua pendente e depende do domínio (P13) |
| P11 | Limites de uso da IA (fotos por mês, mensagens da Lu) e custo por casal | Etapa 4 e 9 | |
| P12 | Fonte Fraunces: licença OFL (Google Fonts), uso livre no app; confirmar inclusão no pacote do app | Etapa 0 | |
| P13 | Comprar o domínio `lartie.app` | Antes da primeira publicação da web do convidado (Etapa 5) e dos universal links | Decidido em 20/10/2026: ainda será comprado. Até lá, endereço provisório. **27/10/2026:** o domínio fica para o fim do projeto; a página do convidado, a API e os envios por e-mail e WhatsApp automáticos são testados no Mac até lá |
| P14 | IA (assistente Lu T31, cadastro por foto T22, erro T49) fora do escopo atual | Quando o dono do produto decidir ligar | Decidido em 20/10/2026: esconder atrás de chave no Remote Config, sem remover da especificação |
| P15 | **Ideia (fora do MVP atual):** um menu onde as pessoas (convidados) tiram fotos e salvam no app, para os noivos verem depois | A detalhar | Registrada em 27/10/2026 pelo dono do produto, só como lembrete: **não é para construir agora**. Falta decidir quem envia (convidado pela web ou pelo app), quando (no evento, depois), moderação, limite e onde as fotos ficam |
