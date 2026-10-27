# Relatório · Etapa 4 · Casa nova

## Resumo

A Casa nova está pronta:
- **Telas:** Casa (T18), Cômodo (T19), Item (T20) e Medidas do cômodo (T21).
- **Itens:** mudam de estado com as regras do T19 e "Desfazer". "Já tenho" pergunta "Como chegou?".
- **Orçamento:** itens comprados com preço entram no orçamento da casa, na categoria escolhida no item.
- **Medidas:** mostram se os móveis cabem na parede livre e o cômodo em escala.
- **Celebração:** cômodo completo (T55).

Também entraram:
- **"Sair do plano":** pedido seu, para quem entrou pelo convite.
- **Cômodos novos pelo Perfil:** ao mudar os dados da casa nova (ficou da Etapa 3), o app sugere os cômodos que faltam.

O cadastro por foto com IA (T22) continua fora, como decidido (P14).

## Como testar

- **Builds:** não há biblioteca nativa nova. Basta recarregar o app (`r` no Metro) no simulador e no moto g31 (`npm run android:reverse` antes).
- **Serviços no Mac:**
  - API no dev: `npm run dev:dev -w @lartie/api`;
  - Metro: `cd mobile && npm start`.
- **Conta:** qualquer casal do `lartie-dev` com a casa ativa (modo "Casamento e casa" ou "Só a casa nova").
- **Roteiro:**
  1. **Casa (aba):**
     - filtros por fase, com a descrição;
     - cartões dos cômodos, com o selo "Completo" na fase filtrada;
     - "+ Novo cômodo", com sugestões;
     - "+" para um novo item, escolhendo o cômodo.
  2. **Fluxo 5 (montar a casa):**
     - Casa → Cozinha → tocar em "Falta" → "Como chegou?" (Comprado, com a categoria no orçamento; Ganhado + quem deu; Já era nosso; ou "Pular");
     - aparece o aviso com "Desfazer";
     - ao completar o cômodo, aparece o T55.
  3. **Tocar em "Já tenho":** vai para "Na lista". Sem lista criada, o app oferece "Criar lista", que abre a aba Presentes, ainda provisória (Etapa 5).
  4. **Item:**
     - foto pela câmera ou galeria;
     - estado, "como chegou", quem deu, categoria;
     - link da loja: cole um link de produto e saia do campo; o preço e a foto podem aparecer;
     - medidas, "Onde vai ficar" e o aviso de que cabe ou não cabe;
     - mudar algo e voltar sem salvar abre o T36;
     - "Excluir" abre o T35.
  5. **Medidas:**
     - largura e comprimento: salvam ao sair do campo e o desenho aparece em escala;
     - paredes livres: "+ Adicionar", tocar para editar, arrastar para a esquerda para excluir;
     - um móvel mais largo que a parede fica vermelho, com o alerta.
  6. **Cômodo › "…":**
     - renomear;
     - excluir: com itens, pergunta se move para outro cômodo ou exclui junto.
  7. **Orçamento › Casa nova:** os itens comprados com preço aparecem na categoria escolhida.
  8. **Perfil › Dados da casa nova:** aumente os quartos ou ligue "Temos pets" → "Adicionar Quarto 3?".
  9. **Sair do plano:** com a conta convidada (`noivo_2`), Perfil › Parceiro(a) → "Sair do plano de {nome}?":
     - a conta começa um plano novo;
     - quem criou o plano recebe o aviso "{nome} saiu do plano de vocês.".
  10. **Início só casa (T12c):** fases, cômodos, "Medidas dos cômodos" e "Faltam para…" agora abrem as telas de verdade.

## Telas

| ID | Tela | Status | Observação |
| --- | --- | --- | --- |
| T18 | Casa nova | pronta | Botão de câmera escondido (IA, P14). No modo "casa", tem "Orçamento da casa" |
| T19 | Cômodo | pronta | |
| T20 | Item | pronta | Foto simples (câmera/galeria). Prévia do link pela API |
| T21 | Medidas | pronta | "Foto da planta" escondida (IA). Móveis arrumados em fileiras (sem posição no modelo) |
| T22 | Cadastro por foto | fora do escopo | IA (P14) |
| T55 | Cômodo completo | pronta | |
| T12c | Início só casa | atualizada | Abre as telas reais |
| T33 | Perfil | ajuste | "Sair do plano" e sugestão de cômodos |

## Confirmações, erros e avisos ligados nesta etapa

| ID | Onde aparece | Teste automatizado |
| --- | --- | --- |
| T35 Excluir item | T20 | — |
| T36 Descartar | T20 | — |
| Excluir cômodo (mover ou excluir) | T19 | — |
| Excluir parede livre | T21 | — |
| "Tirar da lista?" (com reserva) | T19 (Na lista → Falta) | — |
| "Ainda não há lista de presentes" | T19, T20 | — |
| T50 / T58 Câmera | foto do item | — |
| T54 com "Desfazer" | estado do item | — |
| T55 | cômodo completo, uma vez, e de novo se o cômodo for reaberto | regras: `comodoCompleto`, `textoCelebracaoComodo` |
| Sair do plano | T33 (`noivo_2`) | API |
| "Adicionar {cômodos}?" | Perfil › Dados da casa nova | regras: `sugerirNovosComodos` |

**Testes:** 141 automatizados, todos passando.

| Conjunto | Testes |
| --- | --- |
| Regras | 74 (9 novos: estados, cômodo completo, encaixe, medidas, sugestão de cômodos, categoria do item, "no/na cômodo") |
| API | 34 (5 novos: sair do plano, foto do item, link da loja com proteção contra endereços internos) |
| Regras do Firestore | 19 |
| App | 23 |

## Definição de pronto (Seção 0.4)

- [x] Só tokens (exceto os tamanhos de foto e avatar, como antes).
- [x] Destinos da especificação. "Criar lista" abre Presentes, provisória até a Etapa 5.
- [x] Estados: carregando, vazio ("Nenhum item neste cômodo ainda."), erro, sem conexão e sucesso.
- [x] Confirmações, erros e avisos (tabela acima).
- [x] Tema claro e escuro, iOS e Android. **Ainda não passei tela por tela:** peço atenção no seu teste.
- [x] Acessibilidade:
  - botão de estado com rótulo ("Estado: Falta. Tocar para mudar");
  - excluir parede também pela ação do leitor de tela.
- [x] Modo do app: as telas da casa respeitam o modo, e um link com a casa oculta abre "Ativar Casa nova?".
- [x] Offline: estados, itens, cômodos e medidas gravam pela fila. Foto e link da loja precisam de internet; o item é salvo mesmo assim.
- [x] Testes das regras (13.2, 13.3, 13.4).
- [x] Analytics:
  - `item_estado_alterado`, `item_criado`, `item_excluido`;
  - `comodo_criado`, `comodo_completo`, `medidas_salvas`;
  - `comodos_sugeridos`, `parceiro_saiu`.

## Divergências da especificação ou do protótipo

1. **Categoria do item comprado (decisão de 26/10/2026):**
   - campo novo `categoria_orcamento` no item;
   - aparece em "Como chegou?" e no T20 quando o item é "Comprado";
   - sem escolha, o gasto vai para "Enxoval";
   - o valor é preço × quantidade.
2. **T21, vista de cima:** o modelo não guarda onde cada móvel fica. Os móveis com medidas são arrumados em fileiras, em escala, sem a porta do protótipo.
3. **T20, "Onde vai ficar":** escolha nova no formulário. A conferência de encaixe precisa saber a parede de destino (campo `parede_destino` do modelo).
4. **Textos sem protótipo:**
   - "Ainda não há lista de presentes";
   - "Tirar da lista?";
   - "Excluir {cômodo}?", com "Mover para {cômodo}";
   - "Adicionar {cômodos}?";
   - "Sair do plano de {nome}?";
   - T55 com 1 item ("O único item…") ou sem cômodos faltando ("A casa nova está completa.").
5. **T19 "Na lista":** entra na lista de presentes aberta (rascunho ou publicada). As listas são criadas na Etapa 5; até lá o app oferece "Criar lista".
6. **Link da loja:**
   - a API lê nome, foto e preço da página;
   - ela só acessa endereços públicos (bloqueia rede interna, inclusive depois de redirecionar), com tempo e tamanho limitados;
   - se o nome estiver vazio, usa o da página.
7. **Ajuste na Etapa 3, já aprovada (seu pedido):** "Sair do plano" para quem entrou pelo convite. Nova notificação `parceiro_saiu`.

## Pendências e riscos

- **Reservas ao tirar da lista ou excluir:** o app já pergunta quando há reserva ativa. Cancelar a reserva e avisar o convidado é do servidor, na Etapa 5.
- **Cadastro por foto (T22) e foto da planta:** dependem da IA (P14).
- **Fotos dos itens:** ficam na API do Mac e vão para a VPS com o domínio.
- **Gestos:** arrastar para excluir parede, como no T13, precisa do seu teste no aparelho.

## Perguntas para o dono do produto

1. A vista de cima com os móveis em fileiras (Divergência 2) está boa para o MVP, ou quer poder arrastar os móveis na planta? Isso exige guardar a posição de cada um.

---
Aguardando: `APROVADO ETAPA 4` ou `AJUSTES ETAPA 4: …`
