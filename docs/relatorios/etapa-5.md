# Relatório · Etapa 5 · Lista de presentes e reservas

## Resumo

A lista de presentes está completa no app e na web do convidado:
- **No app:**
  - Presentes (T23): listas, resumo, "Nova lista" e publicar (T39);
  - Lista (T24): itens, reservas, "Recebido", modo surpresa, editar, despublicar e excluir;
  - Compartilhar (T65), com QR code;
  - Agradecimentos (T27).
- **Na web, sem login (Next.js):**
  - página da lista (T25);
  - reservar (T26), com "Alguém reservou antes" (T51) e "Desfazer reserva" (T40);
  - gerenciar a reserva pelo link;
  - "Este link não está mais ativo" (T52).
- **Reserva atômica (13.5):** dois convidados nunca levam a última unidade. A reserva expira em 15 dias, e o casal é avisado 2 dias antes.

Sem o domínio (P13, que fica para o fim do projeto), a página do convidado roda no Mac.

## Como testar

- **Serviços no Mac (os quatro ligados):**
  - API: `npm run dev:dev -w @lartie/api`;
  - Metro: `cd mobile && npm start`;
  - **web do convidado:** `npm run web`, que abre em http://localhost:3000.
- **Builds:** a única biblioteca nova é o `qrcode`, só JavaScript. Basta recarregar o app (`r` no Metro).
- **Android:** `npm run android:reverse` agora liga também a porta 3000, para "Ver como convidado" abrir no celular.
- **Roteiro:**
  1. **Fluxo 7 (criar e publicar):**
     - Presentes → "Criar primeira lista" → ocasião, data e endereço → "Criar e escolher itens";
     - marcar itens (com quantidade) ou um "Item avulso" → "Adicionar {n} itens";
     - na Lista: "Publicar link" → T39 → abre o Compartilhar (T65).
  2. **T65:** Copiar, WhatsApp (mensagem pronta), E-mail, QR code, Mais, "Ver como convidado".
  3. **Fluxo 8 (convidado reserva):**
     - "Ver como convidado" abre a página no navegador;
     - escolher um presente → "Reservar" → nome, WhatsApp, quantidade → "Reservar presente";
     - aparece "Reservado!", com a entrega, "Guardar no meu WhatsApp" e "Desfazer reserva".
  4. **No app:**
     - a Lista mostra "Reservado por {nome}";
     - "Recebido" passa o item do enxoval para "Já tenho" (ganhado, com quem deu) e cria o agradecimento, com "Desfazer";
     - Agradecimentos → "Agradecer" (WhatsApp com o modelo preenchido).
  5. **Modo surpresa:** ligado, a Lista mostra só "Reservado" até o dia do evento.
  6. **Tirar da lista ou excluir:**
     - segurar uma reserva → "Cancelar reserva";
     - arrastar um item disponível para a esquerda → "Tirar da lista";
     - "…" → Excluir lista;
     - com reserva, o app oferece avisar cada convidado pelo WhatsApp.
  7. **Despublicar:** "…" → Despublicar. O link passa a mostrar T52.
  8. **Fluxo 9 (concorrência):** é coberto por teste automático, com 8 reservas ao mesmo tempo na última unidade: só 1 passa. Para ver à mão, abra a mesma página em duas abas e reserve a última unidade nas duas.

## Telas

| ID | Tela | Status | Observação |
| --- | --- | --- | --- |
| T23 | Presentes | pronta | Ocasiões por modo (13.9 regra 4) |
| T24 | Lista | pronta | Cancelar reserva: segurar a reserva. Tirar da lista: arrastar |
| T65 | Compartilhar | pronta | Instagram usa o compartilhamento do sistema (ver Divergências) |
| T27 | Agradecimentos | pronta | Modelo editável; "+" para presente recebido fora da lista |
| T25 | Página da lista (web) | pronta | Roda no Mac até o domínio |
| T26 | Reservar (web) | pronta | |
| T40, T51, T52 | Desfazer, esgotou, link inativo (web) | prontas | |
| T60 | Vazio de presentes | ligado | |

## Confirmações, erros e avisos ligados nesta etapa

| ID | Onde aparece | Teste automatizado |
| --- | --- | --- |
| T39 Publicar lista | T23, T24 | API: publicar |
| Despublicar, excluir lista | T24 | API: excluir lista devolve os itens para "Falta" |
| Cancelar reserva pelo casal | T24 (segurar a reserva) | API |
| Tirar da lista item com reserva | T24, T19 | API |
| T35 com reserva | T20 | API (o mesmo caminho) |
| T40 Desfazer reserva | web | API |
| T51 Alguém reservou antes | web | API: concorrência |
| T52 Link inativo | web | API: rascunho e despublicada não abrem |
| T54 "Recebido" com "Desfazer" | T24 | — |
| T60 | T23 | — |

**Testes:** 167 automatizados, todos passando. Mais o teste de ponta a ponta da web nos emuladores (lista → reservar → gerenciar → desfazer → esgotado).

| Conjunto | Testes |
| --- | --- |
| Regras | 82 (8 novos de presentes) |
| API | 41 (7 novos, incluindo a concorrência e a expiração) |
| Regras do Firestore | 21 (2 novos: só o servidor mexe na quantidade reservada; agradecimento fora da lista) |
| App | 23 |

## Definição de pronto (Seção 0.4)

- [x] Só tokens: no app e na web (a web usa `design-system/tokens.css`, claro e escuro).
- [x] Destinos da especificação.
- [x] Estados: vazio (T60, "Nenhum presente nesta lista ainda."), carregando, erro, sem conexão e sucesso.
- [x] Tema claro e escuro: app e web.
- [x] Acessibilidade:
  - rótulos no app;
  - na web, alvos de 44 a 48 px e diálogos como `alertdialog`;
  - ações de leitor de tela para "Tirar da lista".
- [x] Modo do app: ocasiões por modo; listas antigas continuam válidas.
- [x] Offline:
  - criar, editar, adicionar itens, "Recebido" e modo surpresa funcionam pela fila;
  - publicar, cancelar e excluir com reserva precisam de internet e avisam.
- [x] Testes de 13.5, com o de concorrência.
- [x] Analytics:
  - `lista_criada`, `lista_publicada`, `lista_compartilhada` (com o canal);
  - `itens_adicionados_lista`, `presente_recebido`;
  - `reserva_cancelada_casal`, `agradecimento_enviado`.

## Divergências da especificação ou do protótipo

1. **Mensagens ao convidado sem envio automático:** confirmação, lembrete e cancelamento dependem de um serviço de mensagens e do domínio. Por enquanto:
   - **na confirmação**, a página oferece "Guardar no meu WhatsApp", em que o convidado manda a mensagem para si mesmo, com o link de desfazer;
   - **nos cancelamentos**, o app abre o WhatsApp com a mensagem pronta para cada convidado;
   - **o lembrete de 2 dias** vai só para o casal, como notificação.
2. **Instagram (T65):** os stories com imagem gerada (nomes, ocasião, data, QR) ficam para depois. O botão abre o compartilhamento do sistema, que inclui o Instagram. "Salvar imagem" do QR também fica para depois.
3. **Lista com várias reservas do mesmo item:** cada reserva aparece numa linha ("Reservado por …", com "Recebido"). O que ainda está disponível aparece numa linha "{x} de {q} reservados".
4. **Cancelar reserva pelo casal:** segurando a linha da reserva (a especificação não define o gesto).
5. **"Entrega e mensagem":** opção nova no menu da Lista. O endereço de entrega aparece só depois da reserva. A mensagem é o texto do cabeçalho da página (T25); sem mensagem, usa o texto do protótipo.
6. **Novos campos no modelo:**
   - `lista_presentes.mensagem`;
   - `lista_itens.avulso`;
   - `lista_itens.quantidade_reservada`, mantido só pelo servidor: é o que garante a reserva atômica;
   - `agradecimentos.whatsapp` e `.ocasiao`;
   - `casal.modelo_agradecimento`;
   - `reservas.aviso_expiracao`.
7. **Endereços reservados:** a lista não pode se chamar "reserva", "rsvp", "convite" ou "api", que são caminhos da página do convidado.
8. **Notificação nova `reserva_expirada`:** "A reserva de {nome} expirou e o presente voltou para a lista." A Seção 12 só tinha o aviso de 2 dias antes.
9. **Next.js 16.4.3:** ao iniciar, a 16.4.0 avisou de falhas críticas de segurança (confirmadas com `npm audit`), corrigidas na 16.4.3, publicada em 23/10.

## Pendências e riscos

- **Domínio (P13), no fim do projeto:** até lá, o link compartilhado (`lartie.app/…`) não abre para convidados de verdade. Para mostrar a alguém de fora antes disso: túnel gratuito (Cloudflare Tunnel).
- **Fotos dos presentes na web:** passam pela API do Mac. Na VPS, entra o cache do nginx.
- **Push das notificações** (nova reserva, expirando, expirada): Etapa 9. Os registros já são gravados.
- **Limite de tentativas por IP na reserva:** simples, em memória (20 a cada 10 minutos). Vale rever na VPS.

## Perguntas para o dono do produto

1. Para o MVP, vale ficar com o Instagram pelo compartilhamento do sistema (Divergência 2), ou quer os stories com imagem gerada? Isso exige uma biblioteca nativa a mais.

---
Aguardando: `APROVADO ETAPA 5` ou `AJUSTES ETAPA 5: …`
