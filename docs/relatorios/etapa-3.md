# Relatório · Etapa 3 · Início por modo e Casamento

## Resumo

A Etapa 3 entrega:
- **Início:** as quatro telas iniciais, uma por modo do app (T12, T12b, T12c e T12d).
- **Casamento:** checklist (T13), tarefa (T14), orçamento (T15), fornecedores (T16) e fornecedor (T17).
- **Perfil e modo:** Perfil (T33) e Modo do app (T33b), com a troca completa da Seção 13.9.

Trocar de modo nunca apaga nada. Ativar um módulo pela primeira vez pede só os dados que faltam e gera o módulo. O parceiro recebe um aviso.

A API ganhou as rotas do que o app não pode gravar sozinho: troca de modo, remover parceiro, excluir conta e contrato do fornecedor.

## Como testar

- **Builds** (já instaladas hoje, 26/10):
  - **iOS:** simulador iPhone 17 Pro (`LARTIE_AMBIENTE=dev npm run ios`);
  - **Android:** moto g31 (`npm run android:reverse` antes de abrir).
- **Serviços no Mac:**
  - API no dev: `npm run dev:dev -w @lartie/api`;
  - Metro: `cd mobile && npm start`.
- **Contas de teste:**
  - qualquer conta do `lartie-dev`;
  - o casal "Aa & Bb" já aparece com o parceiro conectado;
  - para ver os quatro modos, troque em Perfil › Modo do app.
- **Roteiro:**
  1. **Fluxo 3 (concluir tarefa):**
     - Início → "Ver todas" → marcar uma tarefa: aparece "Tarefa concluída" com "Desfazer";
     - ao completar uma fase, aparece o T56 (uma vez por fase). "Ver próxima fase" rola até a fase seguinte.
  2. **T13:**
     - filtros: Todas, A fazer, Atrasadas, Concluídas;
     - tocar no nome da fase recolhe ou abre a fase;
     - segurar uma tarefa e arrastar reordena dentro da fase;
     - arrastar para a esquerda mostra "Ocultar" e "Excluir" (o T34 pede confirmação);
     - "Mostrar ocultas" fica no fim da lista.
  3. **T14:**
     - "+" → nova tarefa, com a fase já escolhida pela data do casamento;
     - mudar algo e voltar abre o T36;
     - menu "…": Ocultar, Duplicar, Excluir;
     - "Vincular fornecedor", com busca e "Novo fornecedor".
  4. **Fluxo 4 (fechar fornecedor):**
     - Fornec. → "+" → criar um fornecedor;
     - abrir → "Gerar parcelas" → "Marcar como fechado" → T37;
     - no Orçamento, o valor aparece na categoria e as parcelas em "Próximas parcelas";
     - a tarefa vinculada fica concluída.
  5. **T15:**
     - "+" → Novo gasto;
     - tocar numa categoria: valor planejado e lançamentos;
     - "Editar orçamento" distribui o total pelos percentuais;
     - tocar no valor de uma parcela: "Marcar como paga?".
  6. **Fluxo 14 (trocar de modo):**
     - Perfil › Modo do app › "Só a casa nova" → folha de confirmação → "Mudar modo": o menu muda;
     - voltar para "Casamento e casa nova": as tarefas estão como antes.
  7. **Fluxo 15 (ativar um módulo pela primeira vez):**
     - casal só com casamento → Início › "Vão montar a casa nova também?" → T33b → mudar;
     - o app pede T08 e T09 e mostra o T10 resumido;
     - termina no T12 com os dois progressos.
  8. **Fluxo 16 (parceiro vê a troca):**
     - com o parceiro numa tarefa aberta, troque para "Só a casa nova" no outro aparelho;
     - o parceiro volta ao Início e vê "{nome} mudou o modo do app.".
  9. **T12d (decidir depois):** "Começar pelo casamento", "Começar pela casa nova" e "Quero os dois".
  10. **Perfil:**
      - Casal (nomes e foto);
      - Dados do casamento (mudar a data recalcula os prazos);
      - Dados da casa nova;
      - Parceiro(a) (T43);
      - Meus dados e senha;
      - lembretes e horário de silêncio;
      - Sair (T41);
      - Excluir conta (T42, digitando EXCLUIR). **Use uma conta descartável:** apaga de verdade no `lartie-dev`.

## Telas

| ID | Tela | Status | Observação |
| --- | --- | --- | --- |
| T12 | Início · os dois | pronta | Atalhos de reservas e convidados mostram 0 até as Etapas 5 e 6 |
| T12b | Início · só casamento | pronta | Igual |
| T12c | Início · só casa | pronta | Com dados reais do enxoval. Os toques abrem T18 a T21 provisórias (Etapa 4) |
| T12d | Início · decidir depois | pronta | |
| T13 | Checklist | pronta | |
| T14 | Tarefa | pronta | |
| T15 | Orçamento | pronta | Foto da nota fiscal escondida (IA, P14) |
| T16 | Fornecedores | pronta | Comparar: segurar um cartão e tocar em outro da mesma categoria |
| T17 | Fornecedor | pronta | Contrato em PDF ou foto, guardado na API do Mac |
| T33 | Perfil | pronta | Assinatura, Central de ajuda e Termos mostram `[a definir]` (dependem do domínio) |
| T33b | Modo do app | pronta | |
| T56 | Celebração de fase | pronta | |
| T18, T23, T28 | Casa, Presentes, Convidados | provisórias | Etapas 4, 5 e 6. No modo "casa", a T18 provisória tem "Orçamento da casa" |
| T31, T32 | Assistente, Notificações | provisórias | Etapa 9. O sino já mostra o ponto vermelho |

## Confirmações, erros e avisos ligados nesta etapa

| ID | Onde aparece | Teste automatizado |
| --- | --- | --- |
| T34 Excluir tarefa | T13 (gesto) e T14 | — (tela) |
| T36 Descartar | T14, T17, T33b, Casal, Dados do casamento, Dados da casa nova, Meus dados | — |
| T37 Fornecedor fechado | T17 (status "Fechado" ou botão) | regras: `tarefasConcluidasAoFechar`, `validarFornecedor` |
| T41 Sair | T33 | — |
| T42 Excluir conta | T33 (digitar EXCLUIR) | API: apaga o casal, o endereço e as contas |
| T43 Remover parceiro | T33 › Parceiro(a) | API: revoga o acesso sem apagar dados |
| Excluir fornecedor, parcela e gasto avulso; marcar parcela paga | T17, T15 | — |
| T47 Sem conexão | troca de modo, contrato, T42, T43, e-mail e senha | — |
| T48 Erro ao salvar | todas as gravações | — |
| T50 / T58 Câmera | foto do contrato no T17 | — |
| T54 com "Desfazer" | marcar tarefa, ocultar tarefa | — |
| T56 | fase concluída, uma vez por fase | regras: `faseConcluidaAoMarcar` |
| T62 Vazio de fornecedores | T16 | — |
| T64 Esqueleto | Início, T13, T15, T16 | — |
| Folha "Ativar {módulo}?" | links para tarefa ou fornecedor com o módulo oculto | regras: `modoAoAtivar`, `passosParaAtivar` |

**Testes:** 132 automatizados, todos passando.

| Conjunto | Testes |
| --- | --- |
| Regras | 65 (29 novos: 13.3, 13.4, parcelas, fornecedores, 13.9, recálculo de prazos) |
| API | 29 (9 novos: modo, parceiro, conta, contrato) |
| Regras do Firestore | 19 |
| App | 19 |

## Definição de pronto (Seção 0.4)

- [x] Só tokens do design system. Exceções: tamanhos de ícones e avatares, como nas etapas anteriores.
- [x] Botões com os destinos da especificação. Os que levam a etapas futuras abrem telas provisórias.
- [x] Estados de carregando, vazio, erro, sem conexão e sucesso.
- [x] Confirmações, erros e avisos (tabela acima).
- [x] Tema claro e escuro, iOS e Android, nas builds de hoje. **Ainda não passei tela por tela no escuro e no Android:** peço atenção no seu teste.
- [x] Acessibilidade:
  - rótulos em todos os toques;
  - ações de leitor de tela no T13 (mover para cima ou para baixo, ocultar, excluir), no lugar dos gestos.
- [x] Respeita o modo: abas, atalhos, Perfil e links para módulos ocultos.
- [x] Offline: tudo grava pela fila do Firestore. As ações que precisam de servidor avisam.
- [x] Testes das regras de negócio (13.3, 13.4, 13.9).
- [x] Analytics:
  - `tarefa_concluida`, `tarefa_criada`, `tarefa_excluida`, `fase_concluida`;
  - `fornecedor_criado`, `fornecedor_fechado`, `fornecedores_comparados`;
  - `gasto_criado`, `parcela_paga`, `orcamento_definido`;
  - `modo_alterado` (com origem), `parceiro_removido`, `conta_excluida`.

## Divergências da especificação ou do protótipo

1. **Textos neutros em gênero:**
   - T43: o protótipo diz "Ele deixa de ver… convidá-lo". Ficou "{nome} deixa de ver e editar o casamento e a casa nova. Vocês podem enviar um novo convite depois.";
   - T33: "Pedro conectado" virou "{nome} está no plano · editam juntos".
2. **"Editar orçamento"** ficou como link ao lado de "Por categoria". A aba Casamento já tem o "+" no topo, e não há menu "…".
3. **T56 nas outras fases:** o protótipo só mostra a primeira fase. Para as outras, usei o mesmo modelo ("Vocês terminaram a {segunda} fase… Próxima: …"). Na última fase: "Vocês terminaram todas as fases do checklist." e "Continuar".
4. **Prazo sugerido da fase** (nova tarefa sem prazo): é o fim da janela da fase, em dias antes do casamento:
   - Decisões: 330;
   - Fornecedores: 240;
   - Detalhes: 120;
   - Documentos: 30;
   - Semana: 1.
5. **Itens comprados no orçamento da casa:** o item ainda não tem categoria no modelo. Até a Etapa 4, todo item comprado com preço entra em "Enxoval", com o valor = preço × quantidade.
6. **Remover parceiro:** só quem criou o plano (`noivo_1`) remove. O `noivo_2` vê o nome, sem a ação. A pessoa removida recebe "{nome} removeu você do plano" e começa um plano novo.
7. **Fornecedor existente:** valor, "o que inclui", pagamento e notas são salvos ao sair do campo; o status muda na hora. "Editar" serve para nome, categoria, contatos e data do orçamento.
8. **Dados da casa nova:** salva o imóvel. A sugestão de novos cômodos e itens ao mudar (por exemplo, mais um quarto) fica para a Etapa 4, junto com a Casa.
9. **Atalho "confirmados de {total}":** sem convidados cadastrados, o total é o número previsto no T07.
10. **"Cadastrar por foto"** (T12c) e a foto da nota fiscal (T15) ficam escondidos enquanto a IA estiver fora (P14).
11. **Novos campos no modelo:**
    - `casal.parceiro`: gravado pelo servidor quando o convite é aceito;
    - `casal.fases_celebradas`;
    - `tarefa.prazo_manual`;
    - `usuario.removido_do_plano`;
    - `fornecedor.categoria` passou a guardar o id da categoria do orçamento.

## Pendências e riscos

- **Acesso do parceiro removido (T43):** o acesso cai assim que o app dele percebe e renova o token, que é o normal. Se o aparelho estiver offline, um token antigo ainda vale por até 1 hora.
- **Excluir conta:** apaga na hora, o que cabe nos "até 30 dias" da especificação. Para a App Store (Etapa 10), quem entrou com Apple também precisa ter o acesso revogado na Apple. Vai entrar nessa etapa.
- **Sair (T41):** encerra a sessão e volta ao T02. O cache offline do Firestore no aparelho **ainda não é limpo** (a especificação pede "limpa cache"). As regras impedem outra conta de ler esses dados do servidor, mas o cache fica no aparelho. Fica para a auditoria da Etapa 8.
- **Lembretes (3 dias antes, parcelas):** os interruptores já gravam a escolha. O envio é da Etapa 9.
- **Gestos do T13:** arrastar e deslizar foram feitos sem biblioteca extra. Precisam do seu teste no aparelho.
- **Contratos:** ficam na API do Mac e vão para a VPS com o domínio (P13).
- **Biblioteca nova:** `@react-native-documents/picker` 12.0.2, para escolher o PDF do contrato.

## Perguntas para o dono do produto

1. Está de acordo com os textos neutros do T43 e do Perfil (Divergência 1)?
2. Só quem criou o plano pode remover o parceiro (Divergência 6). Está bom assim?
3. Itens comprados entram em "Enxoval" até a Etapa 4 (Divergência 5). Na Etapa 4, quer escolher a categoria de cada item, ou usar uma regra por cômodo (por exemplo, eletrodomésticos e móveis)?

---
Aguardando: `APROVADO ETAPA 3` ou `AJUSTES ETAPA 3: …`
