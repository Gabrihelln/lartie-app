# Relatório · Etapa 2 · Onboarding (com modo do app)

## Resumo

O onboarding está pronto no iOS e no Android, nos quatro caminhos do modo do app:
- **os dois:** T06 → T06b → T07 → T08 → T09 → T10 → T11;
- **só casamento:** T06 → T06b → T07 → T10 → T11;
- **só casa:** T06 → T06b → T08 → T09 → T10 → T11;
- **decidir depois:** T06 → T06b → T12d.

A API gera o plano a partir dos catálogos de `dados/`, só com os módulos ativos: checklist, enxoval, categorias de orçamento e o endereço público do casal. Ela também cria e aceita o convite do parceiro, que entra como `noivo_2`, pula o onboarding, e o `noivo_1` recebe o aviso. O progresso fica salvo a cada passo, e o app retoma de onde parou.

## Como testar

- **Builds:**
  - **iOS:** `LARTIE_AMBIENTE=dev npm run ios` (simulador);
  - **Android:** `LARTIE_AMBIENTE=dev npm run android` (moto g31 no cabo, com `adb start-server` e `npm run android:reverse` antes).
- **Serviços no Mac:**
  - API no dev: `npm run dev:dev -w @lartie/api`;
  - Metro: `cd mobile && npm start`.
- **Contas de teste:** contas novas no `lartie-dev`, por e-mail, Google ou Apple. Cada conta nova cai no T06.
- **Roteiro:**
  1. Os quatro caminhos, com uma conta nova em cada.
  2. T07:
     - data passada: "Escolha uma data depois de hoje.";
     - sem cidade: "Informe a cidade para ajustarmos o clima.";
     - "Festa grande", "Mini wedding" ou "Destination": aparece "Terá cerimônia religiosa?".
  3. Fechar o app no meio e abrir de novo: ele volta ao mesmo passo.
  4. T10: "Montando o plano de vocês…" e depois os cartões do modo. No console do Firebase dá para ver as tarefas, os cômodos e os itens.
  5. Convite:
     - no T11, copiar o código;
     - no outro aparelho, abrir `lartie://convite/CODIGO` (no Android: `adb shell am start -a android.intent.action.VIEW -d "lartie://convite/CODIGO" com.lartie.app`);
     - "Aceitar e criar conta": entra direto no Início do mesmo casal;
     - o primeiro aparelho recebe o aviso.
  6. O mesmo convite depois de usado: T53.

**Resultado do teste do dono do produto (25/10/2026):** conexão entre o iPhone e o Android, onboarding e convite funcionando.

## Telas

| ID | Tela | Status | Observação |
| --- | --- | --- | --- |
| T06 | O casal | pronta | Foto (câmera com T58, galeria e remover; T50 se a câmera for negada) e nomes |
| T06b | O que vão organizar | pronta | Três modos; "Casamento e casa nova" marcada por padrão; "Decidir depois" vai ao T12d |
| T07 | Sobre o casamento | pronta | Data nativa, cidade com sugestões (IBGE), estilo, cerimônia religiosa (P05), convidados, orçamento |
| T08 | Casa nova | pronta | Cidade só no modo "casa" |
| T09 | O que vocês já têm | pronta | "Montar nosso plano" e "Pular, começamos do zero" |
| T10 | Plano pronto | pronta | Carregamento de pelo menos 2 s, cartões por modo, T47 e T48 |
| T11 | Convidar parceiro(a) | pronta | WhatsApp, link e Copiar, lembretes; e-mail [a definir] |
| T57 | Permissão de notificações | pronta | Depois do T11 se os lembretes estão ligados, uma vez por aparelho |
| T66 | Aceitar convite | pronta | Sem conta (criar ou entrar) e já logado |
| T53 | Convite expirado | pronta | Também para convite já usado ou inexistente |
| T12, T12b, T12c, T12d | Início | provisória | Etapa 3; já mostra qual tela inicial o modo usa |

## Confirmações, erros e avisos ligados nesta etapa

| ID | Onde aparece | Teste automatizado |
| --- | --- | --- |
| T46 | T07 (data e cidade), T08 (cidade e mês/ano), T06 (nomes) | Manual; validação de nome em `validacaoAcesso.test.ts` |
| T47 | T10 (gerar o plano), T11 (convite), T66 e "Preparando a conta" | Manual |
| T48 | T10 "Tentar de novo"; falha ao gravar qualquer passo | Manual |
| T50 | T06, câmera negada | Manual |
| T53 | T66 e "Preparando a conta" com convite inválido | `api/test/onboarding.test.ts` (expirado, usado, próprio casal, casal completo) |
| T57, T58 | Depois do T11; antes da primeira câmera | Manual |
| Avisos | "Link copiado"; "{nome} entrou no plano de vocês." | Manual (o aviso vem da notificação criada pela API, que tem teste) |

Testes automatizados novos:
- **Regras de geração** (`packages/regras/src/plano.test.ts`, 21 testes):
  - passos e contador por modo;
  - prazos do checklist, casamento próximo sem atrasos, sem data;
  - estilo e cerimônia religiosa;
  - cômodos, por morador, por banheiro, quarto extra, clima, mobiliado, "o que já têm";
  - categorias e endereço;
  - **os três perfis do aceite:**
    - apartamento de 1 quarto em cidade quente;
    - casa de 3 quartos com pets em cidade fria;
    - só civil sem data.
- **API** (`api/test/onboarding.test.ts`, 10 testes):
  - geração nos modos os dois, casamento e casa;
  - gerar de novo não duplica nem apaga o que o casal mudou;
  - endereço já usado ganha sufixo;
  - convite completo: criar, reaproveitar, consultar e aceitar, com o aviso;
  - convites recusados;
  - foto enviada, lida só pelo casal e removida.
- **App** (`mobile/__tests__/onboarding.test.ts`, 5 testes): cidades sugeridas e campos com máscara.

Total: **98 testes, todos passando**:
- 35 de regras de negócio;
- 7 de tokens;
- 19 do app;
- 19 de regras do Firestore;
- 18 da API.

## Definição de pronto (Seção 0.4)

- [x] Igual aos protótipos e só com tokens (exceções na lista de divergências).
- [x] Botões levam aos destinos da especificação.
- [x] Estados de carregando, erro, sem conexão e sucesso.
- [x] Erros e avisos da etapa ligados.
- [x] Tema claro e escuro.
- [x] iOS e Android.
- [x] Acessibilidade:
  - contador ajustável pelo leitor de tela;
  - grupo "Modo do app" anunciado como grupo de opções;
  - barra de passos com o valor "Passo n de N".
- [x] Respeita o modo do app (passos, contador e módulos gerados).
- [x] Offline:
  - os passos T06 a T09 gravam offline;
  - T10, T11, a foto e o convite exigem conexão e mostram T47.
- [x] Testes automatizados das regras 13.1, 13.2 e 13.4 (e das categorias) e da geração por módulo.
- [x] Analytics: `modo_escolhido`, incluindo "indefinido".

## Divergências da especificação ou do protótipo

1. **Voltar no T06:** a especificação leva ao T03, mas nesse ponto a conta já existe. O T06 não tem "Voltar". Para trocar de conta, existe "Sair" no Perfil.
2. **Foto do casal:** é guardada em arquivo pela API, que roda no Mac até a VPS existir (decisão de 25/10/2026). Sem o Mac ligado, a foto não carrega. O texto do T50 foi adaptado para "Para tirar a foto do casal, permita o acesso…", porque o original fala de itens.
3. **Código do convite:** tem 6 letras e números, como `ABC123`. O exemplo da especificação (`7K2`) tem 3, o que seria fácil de adivinhar.
4. **Link do convite:** a mensagem do WhatsApp usa `lartie.app/convite/{codigo}`, como a especificação pede, mas ele só abre o app quando o domínio existir (P13). Até lá, os testes usam `lartie://convite/{codigo}`.
5. **Convite por e-mail:** o campo existe, mas avisa "[a definir]". O envio entra junto com o domínio (decisão de 25/10/2026).
6. **T11:** "Convide {nome}." em vez de "Convide o Pedro.", para não supor o gênero do parceiro.
7. **T10, "Ajustado para vocês":** "2 moradores, com pets e o clima de Curitiba". O app guarda se há pets, não quantos; o protótipo diz "1 pet".
8. **Moradores:** a especificação prevê "2 + pessoas informadas", mas nenhuma tela pergunta. Fica 2 até existir onde informar.
9. **T09, "Algum de vocês já mora sozinho?":** a resposta fica gravada, mas a especificação não diz o que ela muda no plano.
10. **Tarefas da mudança** (`tarefas_mudanca` em `dados/`): não são geradas nesta etapa. Onde aparecem é a pendência P04, da Etapa 4.
11. **P05:** "Terá cerimônia religiosa?" no T07, para Mini wedding, Festa grande e Destination. "Civil + religioso" sempre inclui as tarefas de igreja; "Só civil", nunca.
12. **Modelo de dados**, campos a mais:
    - no casal: `onboarding_passo`, `onboarding_respostas` e `cerimonia_religiosa`;
    - em tarefas e itens: `catalogo_id`;
    - nos itens: `bom_para_presente`.
    O `preco_estimado` dos itens é o preço por unidade.
13. **Aviso "Parceiro entrou":** aparece como aviso rápido no app. O push e a tela de notificações são da Etapa 9.
14. **Data da mudança:** é um campo de texto com máscara "mm/aaaa", como no protótipo. Os seletores nativos não têm modo mês/ano no Android.

## Observações para a revisão dos catálogos (P03)

- **"Monte Verde (MG)",** nas exceções de clima, não é município; é distrito de Camanducaia.
- **"Cozinha montada"** marca 28 itens como "já tenho", incluindo eletrodomésticos como micro-ondas, liquidificador, air fryer e cafeteira. Vale conferir se é essa a intenção.
- **Os números do protótipo** (64 tarefas, 182 itens) são ilustrativos. Com os catálogos atuais:
  - um casal "Civil + religioso" recebe cerca de 50 tarefas;
  - um apartamento de 2 quartos recebe cerca de 90 itens.

## Pendências e riscos

- **Conta que já tem casal e aceita um convite:** ela passa para o casal do convite, e o casal antigo fica sem uso, mas não é apagado. A especificação não trata esse caso. Sugestão: na Etapa 3, avisar antes de aceitar.
- **API e fotos no Mac:** valem as mesmas observações da Etapa 1, e tudo isso vai para a VPS junto com o domínio.
- **Revisão dos catálogos (P03):** continua em aberto. Mudanças nos arquivos valem para os próximos planos gerados.

## Perguntas para o dono do produto

1. Moradores (Divergência 8): incluímos uma pergunta "Quantas pessoas vão morar?" no T08, ou fica sempre 2 no MVP?
2. "Já mora sozinho" (Divergência 9): deve mudar alguma coisa no plano, ou é só informativo?
3. Conta que já tem casal e recebe convite: avisamos e pedimos confirmação (sugestão), ou bloqueamos?
4. Quando você revisa os catálogos de `dados/` (P03)? As observações acima podem ajudar.

## Ajuste pedido pelo dono do produto (25/10/2026): recusar e cancelar convite

A especificação só previa "Aceitar e criar conta" e "Já tenho conta" no T66. Agora:

- **T66, quem recebeu o convite:**
  - **"Agora não"** fecha a tela sem mexer no convite;
  - **"Recusar convite"** pede confirmação ("Recusar o convite?"), cancela o convite e avisa quem convidou;
  - funciona com ou sem conta, e o código do link serve de chave.
- **T11, quem convidou:** **"Cancelar este convite e gerar outro"**, com confirmação. O link antigo deixa de funcionar.
- **Aviso:** "O convite para planejar juntos foi recusado. Se foi engano, envie um novo." Aparece no onboarding e no Início. O tipo de notificação `convite_recusado` é novo e não estava na Seção 12.
- **Perfil (Etapa 3):** ganha a mesma opção de cancelar ou gerar outro convite.
- **Testes:** 2 novos na API (recusar sem conta; cancelar e gerar outro). Total: **100 testes, todos passando**.

## Correção (25/10/2026): convite com o app já aberto

- **Problema:** no iOS, o link do convite só funcionava com o app fechado.
- **Causa:** o `AppDelegate` não repassava ao React Native os links recebidos com o app aberto ou em segundo plano.
- **Correção:** o `AppDelegate` agora repassa:
  - os links do app (`lartie://…`);
  - os universal links (`https://lartie.app/…`), que entram quando houver domínio.
- **Testes:**
  - **Android:** link enviado com o app aberto chegou à tela que já estava aberta.
  - **iOS:** com o app aberto, o sistema pergunta "Abrir com 'Lartiê'?" e depois entrega o link.

---
Aguardando: `APROVADO ETAPA 2` ou `AJUSTES ETAPA 2: …`
