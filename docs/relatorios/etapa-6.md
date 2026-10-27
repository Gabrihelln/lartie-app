# Relatório · Etapa 6 · Convidados e RSVP

## Resumo

Convidados e RSVP estão completos:
- **No app:**
  - Convidados (T28): painel, estimativa do buffet, filtros, "Importar contatos" (T59 + agenda) e "Lembrar pendentes" (T38);
  - Grupo (T29): pessoas, adulto ou criança, "Salvar e enviar convite";
  - aba própria no modo "Só casamento".
- **Na web, sem login:** confirmação de presença (T30) por grupo, com restrição alimentar, recado, "Alterar resposta" e modo leitura depois do prazo.
- **Notificação:** cada resposta avisa o casal ("{grupo} confirmou presença: x de y pessoas.").
- **Orçamento:** mostra a estimativa do buffet.

Como decidido (P10), convites e lembretes abrem o WhatsApp grupo a grupo, com a mensagem pronta.

## Como testar

- **Serviços no Mac:** API (`npm run dev:dev -w @lartie/api`), Metro (`cd mobile && npm start`) e web (`npm run web`). Todos já estão ligados.
- **Builds novas, já instaladas:** a biblioteca de contatos é nativa.
  - **iOS:** simulador iPhone 17 Pro;
  - **Android:** moto g31 (`npm run android:reverse` se o cabo sair).
- **Roteiro:**
  1. **Lista vazia (T61):** Casamento › Convidados (ou a aba Convidados no modo "Só casamento") mostra "Importar da agenda" e "Adicionar grupo".
  2. **Novo grupo (T29):**
     - preencher nome, lado, tipo e WhatsApp;
     - "+ Adicionar pessoa", e tocar em "Adulto" para virar "Criança";
     - arrastar uma pessoa para a esquerda remove, com "Desfazer";
     - sem nenhuma pessoa com nome, não salva;
     - mudar algo e voltar sem salvar abre o T36.
  3. **Fluxo 10:**
     - "Salvar e enviar convite" abre o WhatsApp com "Oi, {grupo}! … Confirme a presença de vocês até …: lartie.app/…/rsvp/…";
     - para testar a página, troque `https://lartie.app` por `http://localhost:3000` no link;
     - na página: "Vou" ou "Não vou" para cada pessoa, restrição para quem vai, recado → "Enviar confirmação" → "Presença confirmada", com "Alterar resposta";
     - no app, os números, o selo do grupo e a estimativa do buffet se atualizam nos dois aparelhos.
  4. **Painel:** total, adultos e crianças, barra, confirmados, não vão, sem resposta. Tocar no buffet para informar o valor por pessoa; a estimativa aparece também no Orçamento.
  5. **Filtros:** Todos, Confirmados (inclui os parciais), Sem resposta, Não vão.
  6. **"Lembrar {n} pendentes" (T38):**
     - confirmação → folha "Enviar lembretes", com o WhatsApp de cada grupo;
     - os grupos sem WhatsApp aparecem com "Copiar";
     - o mesmo grupo só volta a aparecer depois de 3 dias.
  7. **"Importar contatos":**
     - T59 na primeira vez → permissão → busca e seleção → "Importar {n}" → "Agrupar por sobrenome" ou "Um grupo por contato";
     - negar a permissão abre "Sem acesso aos contatos", com "Abrir Ajustes".
  8. **Menu "…" do painel:**
     - "Prazo, horário e local": aparecem no cabeçalho da página do convidado;
     - "Exportar lista": CSV pelo compartilhamento do sistema.
  9. **Depois do prazo:** com um prazo no passado, a página mostra as respostas só para leitura, com "O prazo terminou. Fale direto com os noivos.".
  10. **Excluir grupo:** "Excluir {grupo} e {n} pessoas?".

## Telas

| ID | Tela | Status | Observação |
| --- | --- | --- | --- |
| T28 | Convidados | pronta | No seletor do Casamento e na aba própria (modo "casamento") |
| T29 | Grupo | pronta | Mostra o recado do grupo, quando houver |
| T30 | Confirmação de presença (web) | pronta | Roda no Mac até o domínio |
| T59 | Permissão de contatos | ligada | |
| T61 | Vazio de convidados | ligado | |
| Importar contatos | tela nova | pronta | Seletor com busca e seleção múltipla |

## Confirmações, erros e avisos ligados nesta etapa

| ID | Onde aparece | Teste automatizado |
| --- | --- | --- |
| T38 Lembrar pendentes | T28 | regras: `podeLembrar` (1 a cada 3 dias, só sem resposta e com WhatsApp) |
| Excluir grupo | T29 | — |
| T36 Descartar | T29 | — |
| T59 / "Sem acesso aos contatos" | Importar contatos | — |
| T61 | T28 | — |
| T30 "Respondam por todas as pessoas" | web | API e regras |
| T30 depois do prazo (só leitura) | web | API: `prazo_encerrado` |
| T52 Link inativo | web (token inválido) | API |
| T54 "Desfazer" ao remover pessoa | T29 | — |

**Testes:** 179 automatizados, todos passando. Mais o teste de ponta a ponta do RSVP nos emuladores (página, enviar, "Presença confirmada", link inválido).

| Conjunto | Testes |
| --- | --- |
| Regras | 90 (8 novos de 13.6: status, filtros, lembretes, prazo, mensagens, sobrenome, CSV) |
| API | 45 (4 novos: tokens, página, respostas, prazo) |
| Regras do Firestore | 21 |
| App | 23 |

## Definição de pronto (Seção 0.4)

- [x] Só tokens (app e web).
- [x] Destinos da especificação.
- [x] Estados: vazio (T61), carregando, erro, sem conexão e sucesso.
- [x] Tema claro e escuro.
- [x] Acessibilidade:
  - "Adulto/Criança" e "Vou/Não vou" com rótulo e estado;
  - remover pessoa também pela ação do leitor de tela.
- [x] Modo do app: Convidados só com o casamento ativo; aba própria no modo "casamento".
- [x] Offline:
  - grupos e pessoas gravam pela fila;
  - enviar convite ou lembrete precisa de internet (o link vem do servidor); sem internet, o grupo fica salvo e o app avisa.
- [x] Testes de 13.6.
- [x] Analytics: `grupo_criado`, `convite_rsvp_enviado`, `lembrete_rsvp_enviado`, `contatos_importados`, `lista_convidados_exportada`.

## Divergências da especificação ou do protótipo

1. **Horário e local da cerimônia:** a T30 mostra "18 de abril de 2027, 17h · Espaço Jardim", mas o modelo não tinha esses campos. Entraram `casal.horario_casamento` e `casal.local_casamento`, opcionais. Junto com o prazo do RSVP, ficam no menu do T28 ("Prazo, horário e local").
2. **Envio do WhatsApp (P10):** o app abre o WhatsApp grupo a grupo, com a mensagem pronta, e marca o envio. O envio automático fica pendente, junto com o domínio.
3. **Exportar lista:** o CSV sai como texto pelo compartilhamento do sistema, sem arquivo anexo. Separador ";", que abre direto no Excel em português.
4. **Lado do grupo:** "lado de Ana", e não "lado da Ana", para não supor o gênero.
5. **Importar contatos:** os grupos importados entram com lado "Os dois" e tipo "Família". Depois de importar, o app sugere conferir.
6. **Novos campos no modelo:** `grupo.recado` e `grupo.respondido_em` (gravados pelo servidor).
7. **Página "Resposta enviada":** quando ninguém do grupo vai, o título é "Resposta enviada", e não "Presença confirmada".

## Pendências e riscos

- **Envio automático de convites e lembretes (P10):** depende do domínio (P13) e de um serviço de mensagens.
- **Domínio:** até lá, o link do RSVP enviado pelo WhatsApp só abre no Mac. Para testar, troque `https://lartie.app` por `http://localhost:3000`.
- **Push das respostas ao casal:** Etapa 9. A notificação já é gravada.

## Perguntas para o dono do produto

Nenhuma nova.

---
Aguardando: `APROVADO ETAPA 6` ou `AJUSTES ETAPA 6: …`
