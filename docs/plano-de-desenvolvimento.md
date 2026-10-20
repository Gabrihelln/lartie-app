# Lartiê — Plano de desenvolvimento por etapas (MVP)

> Documento para o **Claude Code**. Ele define **a ordem do desenvolvimento**, o que entra em cada etapa, as dependências e o **portão de aprovação** entre etapas.
>
> **O que construir** (telas, regras, dados e textos) está em `docs/especificacao-funcional.md`. Este plano só diz **em que ordem** construir e **como entregar**. Se os dois documentos discordarem, vale a especificação funcional: registre a divergência no relatório da etapa e pergunte.

---

## 0. Regras de trabalho (leia antes de começar)

### 0.1 Fontes de verdade
| Fonte | Para quê |
| --- | --- |
| `docs/especificacao-funcional.md` | Telas T01 a T67 (mais T06b, T12b, T12c, T12d, T33b), ações, regras de negócio, modelo de dados, textos exatos |
| `design/telas/` (imagens PNG, HTML estático e fonte `.dc.html`; índice em `design/telas/INDEX.md`) | Visual de cada tela (nome do arquivo indicado em cada etapa) |
| `design-system/` (`tokens.json`, `tokens.css`, `README.md`, `componentes/`, `logos/`) | Tokens de cor, tipografia, espaçamento, raios, sombras, degradês, ícone final e componentes |

### 0.2 Portão de aprovação (obrigatório)
1. Cada etapa termina com um **Relatório da etapa** (modelo na Seção 13) e uma **build instalável** para o dono do produto testar no celular (iOS e Android).
2. Depois de entregar o relatório, **pare**. Não escreva código da próxima etapa.
3. A próxima etapa só começa quando o dono do produto responder exatamente: **`APROVADO ETAPA N`**.
4. Se a resposta for **`AJUSTES ETAPA N: …`**, faça os ajustes dentro da mesma etapa, entregue um novo relatório e espere outra vez.
5. Enquanto espera, só é permitido: responder perguntas, ler a especificação e propor o plano técnico da próxima etapa (sem implementar).
6. Mudanças em etapas já aprovadas só com pedido explícito ("ajuste na etapa N já aprovada"). Registre no relatório da etapa atual.

### 0.3 Recursos que valem desde a primeira tela
Alguns recursos não são "uma etapa no fim": a estrutura deles nasce na **Etapa 0**, e cada etapa liga os seus casos.

| Recurso | Nasce em | Cada etapa deve… |
| --- | --- | --- |
| Diálogos de confirmação (padrão T34–T43) | Etapa 0 (componente) | ligar as confirmações das suas telas |
| Erros (padrão T44–T53), sem conexão (T47), falha ao salvar (T48) | Etapa 0 | tratar todos os erros das suas telas |
| Avisos rápidos com "Desfazer" (T54) | Etapa 0 | usar em toda ação rápida e em todo salvar/excluir |
| Esqueleto de carregamento (T64) e estados vazios (T60–T63) | Etapa 0 (componentes) | aplicar nas suas listas |
| Telas de explicação de permissão (T57–T59) | Etapa 0 (componente) | ligar quando a permissão for usada pela primeira vez |
| Descartar alterações (T36) | Etapa 0 | ligar em todo formulário |
| Modo do app (Seção 13.9 da especificação) | Etapa 0 (dados) e Etapa 2 (escolha) | respeitar o modo nas telas, menus e notificações |
| Offline com fila de envio, tempo real entre os dois usuários | Etapa 0 | funcionar offline nas suas telas |
| Tema claro e escuro, acessibilidade, iOS e Android | Etapa 0 | entregar as telas nos dois temas e nas duas plataformas |
| Analytics | Etapa 0 | registrar os eventos das suas telas |

As Etapas 7 e 8 **não criam** confirmações e erros do zero. Elas **auditam** se todos foram ligados e completam os casos sem protótipo próprio.

### 0.4 Definição de pronto (vale para toda tela)
- [ ] Igual ao protótipo e usando só tokens do design system, sem valores soltos.
- [ ] Todos os botões levam ao destino descrito na especificação.
- [ ] Estados: carregando, vazio, erro, sem conexão e sucesso.
- [ ] Confirmações, erros e avisos da tela ligados.
- [ ] Tema claro e escuro; iOS (SF Pro) e Android (Roboto).
- [ ] Alvos de toque de 44 pt / 48 dp, rótulos para leitor de tela, fonte grande sem cortar texto.
- [ ] Respeita o modo do app.
- [ ] Funciona offline (ou mostra T47 quando exige servidor).
- [ ] Testes automatizados das regras de negócio da tela.
- [ ] Eventos de analytics registrados.

### 0.5 Convenções de nome
- Marca com acento em tudo que o usuário lê: **Lartiê**.
- Sem acento em tudo que é técnico ou digitado: `lartie` (identificador do app `com.lartie.app`, domínio `lartie.app`, e-mails `@lartie.app`, pastas e pacotes do código).

---

## 1. Cronograma resumido

Estimativas para uma pessoa desenvolvendo com o Claude Code, sem contar o tempo de espera pela aprovação. A estimativa é revista no fim da Etapa 0.

| Etapa | Nome | Estimativa | Depende de |
| --- | --- | --- | --- |
| 0 | Fundação (projeto, design system, infraestrutura comum) | 1,5 a 2 semanas | — |
| 1 | Acesso e login | 1 semana | 0 |
| 2 | Onboarding (com modo do app) | 1,5 semana | 1 |
| 3 | Início por modo e Casamento | 2,5 a 3 semanas | 2 |
| 4 | Casa nova | 2 semanas | 2 (e 3 para o orçamento da casa) |
| 5 | Lista de presentes e reservas | 2 semanas | 4 |
| 6 | Convidados e RSVP | 1,5 semana | 3 |
| 7 | Modais de confirmação (auditoria e complementos) | 0,5 a 1 semana | 1 a 6 |
| 8 | Erros, avisos e estados (auditoria final) | 1 semana | 1 a 7 |
| 9 | Assistente Lu e notificações | 2 semanas | 3 a 6 |
| 10 | Preparação para as lojas | 1 semana | 1 a 9 |
| | **Total estimado** | **16 a 18 semanas** | |

As Etapas 9 e 10 não estavam na lista inicial de etapas, mas fazem parte do MVP (assistente, notificações e publicação). Por isso entram no fim.

```
0 Fundação ─► 1 Acesso ─► 2 Onboarding ─► 3 Início + Casamento ─► 4 Casa nova ─► 5 Presentes ─► 6 Convidados ─► 7 Modais ─► 8 Erros/avisos ─► 9 Lu + notificações ─► 10 Lojas
   (confirmações, erros, avisos, estados, offline e modo do app ficam disponíveis desde a Etapa 0)
```

---

## 2. Etapa 0 · Fundação

**Objetivo:** deixar pronta a base que todas as telas vão usar, para que nenhuma etapa precise "voltar" depois.

### 2.1 Decisão técnica (primeira entrega da etapa, com aprovação própria)
Antes de criar o projeto, entregue uma proposta curta com:
- Framework do app multiplataforma (com aparência nativa no iOS e no Android, como pede a especificação 1.1).
- Backend: banco, autenticação (e-mail, Google, Apple), tempo real, armazenamento de arquivos, jobs agendados, envio de push e de e-mail.
- Hospedagem da web pública do convidado (`lartie.app/{slug}`).
- Serviço de IA para o cadastro por foto e a assistente.
- Custos mensais estimados para até 1.000 casais.

Espere **`APROVADO STACK`** antes de seguir para 2.2.

### 2.2 Entregas
1. Projeto criado com identificador `com.lartie.app`, ambientes de desenvolvimento e produção, CI com testes.
2. **Design system no código:** todos os tokens do DS "Lartiê" (cores claro/escuro, tipografia iOS e Android, espaços, raios, sombras, degradês `gradient-icon`, `gradient-splash`, `gradient-onboarding`) e o **ícone final**.
3. **Componentes base:** Botão (todas as variantes), Campo de texto, Chip, Cartão de progresso, Item do enxoval, Opção de modo, Barra de navegação (com as abas por modo), FAB da assistente, Folha inferior, Controle segmentado, Avatar duplo.
4. **Infraestrutura de feedback** (Seção 0.3):
   - `Dialogo` de confirmação no padrão T34–T43 (título, texto, cancelar tonal, confirmar na cor da ação, versão destrutiva, versão com campo de texto para T42).
   - `Toast` (T54): neutro, sucesso e erro, com ação "Desfazer" de 5 s e fila.
   - `ErroCampo` (T44–T46), `TelaSemConexao` (T47), diálogo "Não foi possível salvar" (T48).
   - `Esqueleto` (T64) e `EstadoVazio` (T60–T63) parametrizáveis.
   - `ExplicacaoPermissao` (T57–T59).
   - Guarda de "Descartar alterações" (T36) para qualquer formulário.
   - Verificação de versão mínima (T67).
5. **Dados:** modelo completo da Seção 3 da especificação, incluindo `casal.modo_app`, `modo_alterado_em`, `modo_alterado_por` e `modulos_gerados`. Migrações versionadas e regras de acesso por casal.
6. **Sincronização:** tempo real entre os dois usuários (até 2 s), cache offline com fila de envio e "vence a última gravação".
7. **Navegação:** pilhas, abas que mudam conforme `modo_app`, voltar do Android, deep links (`lartie.app/convite/…`, `lartie.app/{slug}/…`).
8. **Analytics e registro de erros** configurados.
9. Uma **tela de catálogo interna** (só em desenvolvimento) mostrando todos os componentes e o feedback acima nos dois temas, para validação visual.

### 2.3 Aceite da etapa
- [ ] Catálogo interno mostra todos os componentes e os padrões de diálogo, aviso, erro, vazio e esqueleto, em claro e escuro, no iOS e no Android.
- [ ] Trocar `modo_app` num registro de teste muda as abas da barra conforme a especificação 1.3.
- [ ] Alteração feita num aparelho aparece no outro em até 2 s; alteração offline sincroniza ao voltar a conexão.

**→ Pare e entregue o relatório. Próxima etapa só com `APROVADO ETAPA 0`.**

---

## 3. Etapa 1 · Acesso e login

**Telas:** T01 Splash (`Main`), T02 Boas-vindas (`BoasVindas`), T03 Criar conta (`CriarConta`), T04 Entrar (`Entrar`), T05 Esqueci a senha (`EsqueciSenha`).

**Ligados nesta etapa**
- Erros: T44 (login), T45 (cadastro), T47 (sem conexão), mensagem de sessão expirada.
- Bloqueio após 5 tentativas em 15 min.
- T67 (atualização obrigatória) na splash.
- Login com Google e Apple (obrigatório no iOS), criação do usuário `noivo_1` e do casal vazio.
- Regra de roteamento do T01, já considerando o modo do app: sessão + onboarding completo → tela inicial do modo. Até a Etapa 3, usar uma tela provisória.
- Fluxo de nova senha pelo link do e-mail.
- "Sair" temporário no menu de desenvolvimento (o T41 definitivo entra na Etapa 3).

**Aceite**
- [ ] Criar conta por e-mail, Google e Apple; entrar; sair; recuperar senha.
- [ ] Erros T44 e T45 com os textos exatos; e-mail existente oferece "Entrar com este e-mail".
- [ ] Splash com `gradient-splash` e o ícone final; telas de acesso iguais aos protótipos.

**→ Pare e entregue o relatório. Próxima etapa só com `APROVADO ETAPA 1`.**

---

## 4. Etapa 2 · Onboarding (com modo do app)

**Telas:** T06 O casal (`Ob1Casal`), **T06b O que vocês querem organizar** (`ObUso`), T07 Casamento (`Ob2Casamento`), T08 Casa nova (`Ob3Casa`), T09 O que já têm (`Ob4Partida`), T10 Plano pronto (`ObGerando`), T11 Convidar parceiro(a) (`ObConvidar`), T66 Aceitar convite (`AceitarConvite`).

**Ligados nesta etapa**
- **Modo do app:** escolha em T06b (três opções e o link "Decidir depois"), passos e contador por modo (tabela da Seção 5 da especificação), gravação de `modo_app`.
- **Geração do plano por módulo** (13.1 e 13.2): use os catálogos de `dados/` (tarefas, enxoval, clima por cidade, categorias) como carga inicial do backend; escala por moradores, mobiliado e pets. Gera só os módulos ativos e grava `modulos_gerados`.
- "Decidir depois" → marca o onboarding como concluído sem gerar nada → T12d (tela provisória até a Etapa 3).
- Convite do parceiro: código, link, WhatsApp, e-mail, expiração em 7 dias; entrada como `noivo_2` pulando o onboarding.
- Erros: T46 (campos), T48 (falha na geração com "Tentar de novo"), T53 (convite expirado), T47.
- Permissão: T57 depois do T11, se "Ativar lembretes" estiver ligado.
- Progresso salvo a cada passo e retomada do passo pendente.
- Fundo `gradient-onboarding` com os anéis em todas as telas do onboarding.

**Aceite**
- [ ] Os quatro caminhos (os dois, só casamento, só casa, decidir depois) seguem os fluxos 1, 1b, 1c e 1d da especificação (Seção 18).
- [ ] O plano gerado tem as quantidades e tarefas certas para pelo menos 3 perfis de teste (apê 1 quarto em cidade quente; casa 3 quartos com pets em cidade fria; só civil sem data).
- [ ] O parceiro entra pelo link, cai no casal certo e o `noivo_1` recebe o aviso.

**→ Pare e entregue o relatório. Próxima etapa só com `APROVADO ETAPA 2`.**

---

## 5. Etapa 3 · Início por modo e Casamento

**Telas**
- Início: T12 os dois (`Inicio`), T12b só casamento (`InicioCasamento`), T12c só casa (`InicioCasa`), T12d decidir depois (`InicioDepois`).
- Casamento: T13 Checklist (`Checklist`), T14 Tarefa (`Tarefa`), T15 Orçamento (`Orcamento`), T16 Fornecedores (`Fornecedores`), T17 Fornecedor (`Fornecedor`).
- Conta: T33 Perfil (`Perfil`), **T33b Modo do app** (`ConfigModo`).

**Ligados nesta etapa**
- Confirmações: T34 (excluir tarefa), T36 (descartar), T37 (fornecedor fechado), T41 (sair), T42 (excluir conta), T43 (remover parceiro), mais excluir fornecedor e marcar parcela paga.
- Celebração: T56 (fase concluída).
- Vazio: T62 (fornecedores). Esqueleto T64 no Início e nas listas.
- Avisos com "Desfazer" ao marcar tarefa.
- Regras: progresso (13.3), orçamento (13.4) com categorias do casamento e da casa, parcelas, gasto automático de fornecedor fechado, estimativa do buffet.
- **Modo do app completo (13.9):** troca em T33b com folha de confirmação; ativação de módulo nunca gerado (pede os dados que faltam e gera); cartões "Vão montar a casa nova também?" (T12b) e "Vão casar também?" (T12c); "Começar pelo…" e "Quero os dois" no T12d; folha "Ativar {módulo}?" para links de módulos ocultos; aviso ao parceiro.
- Os atalhos do T12/T12c que apontam para telas da Casa e de Presentes podem abrir telas provisórias até as Etapas 4 e 5. Registre isso no relatório.

**Aceite**
- [ ] As quatro telas iniciais aparecem conforme o modo, com as abas certas.
- [ ] Fluxos 3, 4, 14, 15 e 16 da especificação (Seção 18) passam.
- [ ] Trocar de modo e voltar mostra os dados exatamente como estavam.

**→ Pare e entregue o relatório. Próxima etapa só com `APROVADO ETAPA 3`.**

---

## 6. Etapa 4 · Casa nova

**Telas:** T18 Casa (`Casa`), T19 Cômodo (`Comodo`), T20 Item (`Item`), T21 Medidas (`Medidas`), T22 Cadastro por foto (`FotoCadastro`).

**Ligados nesta etapa**
- Confirmações: T35 (excluir item), T36, excluir cômodo.
- Erros: T49 (foto não reconhecida), T50 (câmera negada), T47 (foto exige conexão).
- Permissão: T58 (câmera) no primeiro uso; galeria com pedido nativo.
- Celebração: T55 (cômodo completo).
- Estados do item (falta, já tenho, na lista) com origem e "quem deu"; fases; filtros.
- Medidas e checagem de encaixe pela parede livre.
- Cadastro por foto com IA (item, nota fiscal, print), em série, com revisão antes de salvar.
- Itens comprados com preço geram gasto nas categorias da casa (13.4).
- Respeitar o modo: a área Casa só existe em `casa` e `os_dois`.

**Aceite**
- [ ] Fluxos 5 e 6 da especificação passam.
- [ ] O T12c e o cartão "Casa nova" do T12 abrem as telas reais (fim das telas provisórias da Etapa 3).

**→ Pare e entregue o relatório. Próxima etapa só com `APROVADO ETAPA 4`.**

---

## 7. Etapa 5 · Lista de presentes e reservas

**Telas do casal:** T23 Presentes (`Presentes`), T24 Lista (`ListaPresentes`), T65 Compartilhar (`SheetCompartilhar`), T27 Agradecimentos (`Agradecimentos`).
**Web pública do convidado (sem login):** T25 Página da lista (`PaginaConvidado`), T26 Reservar (`Reservar`).

**Ligados nesta etapa**
- Confirmações: T39 (publicar lista), T40 (desfazer reserva, convidado), cancelar reserva pelo casal, tirar da lista item com reserva, excluir e despublicar lista.
- Erros: T51 (alguém reservou antes), T52 (link inativo).
- Vazio: T60.
- **Reserva atômica** (13.5): dois convidados nunca reservam a última unidade; expiração em 15 dias; "Recebido" move para "Já tenho" e cria agradecimento.
- Modo surpresa; ocasiões por modo do app (13.9, regra 4); link `lartie.app/{slug}/{lista}`.
- Mensagens ao convidado (confirmação com link para desfazer e lembrete antes de expirar).

**Aceite**
- [ ] Fluxos 7, 8 e 9 da especificação passam (o 9 com teste automatizado de concorrência).
- [ ] A página pública abre rápido no celular sem login e funciona nos navegadores mais comuns.

**→ Pare e entregue o relatório. Próxima etapa só com `APROVADO ETAPA 5`.**

---

## 8. Etapa 6 · Convidados e RSVP

**Telas:** T28 Convidados (`Convidados`), T29 Grupo (`NovoGrupo`) e, na web pública, T30 Confirmação de presença (`RsvpConvidado`).

**Ligados nesta etapa**
- Confirmações: T38 (lembrar pendentes), excluir grupo.
- Permissão: T59 (contatos) e importação da agenda.
- Vazio: T61.
- Status do grupo e lembretes em lote com limite de 1 a cada 3 dias (13.6); prazo do RSVP; leitura depois do prazo.
- Aba "Convidados" própria no modo `casamento`.
- Estimativa do buffet atualizada no orçamento.

**Aceite**
- [ ] Fluxo 10 da especificação passa.
- [ ] Respostas do convidado aparecem para os dois usuários em até 2 s.

**→ Pare e entregue o relatório. Próxima etapa só com `APROVADO ETAPA 6`.**

---

## 9. Etapa 7 · Modais de confirmação (auditoria e complementos)

**Objetivo:** garantir que **todas** as confirmações existem, estão ligadas e seguem o mesmo padrão.

- Conferir T34 a T43 contra a tabela da Seção 15 da especificação: quem abre, título, botões e resultado.
- Completar as "confirmações menores" sem protótipo próprio (Seção 15, último parágrafo) que ainda faltarem.
- Conferir a confirmação de troca de modo (T33b) e a folha "Ativar {módulo}?".
- Padrão único: tocar fora ou voltar cancela; leitores de tela anunciam como alerta; botão destrutivo em `error`.
- Entregar uma **tabela de rastreio**: cada confirmação → tela de origem → teste automatizado que a cobre.

**Aceite**
- [ ] 100% das exclusões pedem confirmação e mostram aviso depois.
- [ ] Tabela de rastreio sem pendências.

**→ Pare e entregue o relatório. Próxima etapa só com `APROVADO ETAPA 7`.**

---

## 10. Etapa 8 · Erros, avisos e estados (auditoria final)

**Objetivo:** revisar o app inteiro contra os casos de erro, aviso, permissão e estado.

- Erros T44 a T53: cada um disparável num teste e com o texto exato.
- Avisos e celebrações T54 a T56; permissões T57 a T59 (inclusive o caminho "negado" com "Abrir Ajustes").
- Estados T60 a T64 em toda lista; T66 e T67.
- Mensagens genéricas: erro inesperado e sessão expirada.
- **Teste offline completo** (fluxo 12): marcar itens e tarefas sem internet, voltar a conexão e conferir no aparelho do parceiro.
- **Revisão de acessibilidade** com VoiceOver e TalkBack, fonte no maior tamanho e contraste nos dois temas.
- **Revisão do modo do app** nas quatro combinações: nenhuma tela, atalho ou notificação de módulo oculto aparece.

**Aceite**
- [ ] Tabela de rastreio de T44 a T67 sem pendências.
- [ ] Critérios de aceite gerais da especificação (Seção 21) marcados, exceto os da assistente e das notificações.

**→ Pare e entregue o relatório. Próxima etapa só com `APROVADO ETAPA 8`.**

---

## 11. Etapa 9 · Assistente Lu e notificações

**Telas:** T31 Assistente (`Assistente`), T32 Notificações (`Notificacoes`), T63 vazio de notificações.

- Todas as intenções da Seção 14 da especificação, incluindo "Trocar o modo do app", sempre com cartão de confirmação.
- Escopo por modo (13.9, regra 7); histórico compartilhado do casal; lembretes proativos.
- Catálogo de notificações (Seção 12), incluindo "Modo alterado" e "Escolher por onde começar"; preferências por usuário, horário de silêncio e bloqueio de notificações de módulos ocultos.
- Jobs agendados: tarefas perto do prazo e atrasadas, parcelas, reservas expirando, lembrete único do modo indefinido.

**Aceite**
- [ ] Fluxo 11 da especificação passa; a Lu nunca grava nada sem "Confirmar".
- [ ] Cada notificação do catálogo disparada num teste, respeitando o horário de silêncio.

**→ Pare e entregue o relatório. Próxima etapa só com `APROVADO ETAPA 9`.**

---

## 12. Etapa 10 · Preparação para as lojas

- Ícones finais para iOS (1024) e Android (adaptativo, temático e Play 512): já exportados em `design-system/logos/png/`.
- Splash nativa com `gradient-splash`.
- Screenshots da App Store (1290 × 2796) e da Google Play (1080 × 2160): o dono do produto exporta do canvas de protótipos no claude.ai (linhas 10 e 11). Não fazem parte deste pacote.
- Textos das lojas com "Lartiê" no nome e "lartie" nas palavras-chave (App Store) e na descrição (Google Play).
- Política de privacidade e termos publicados em `lartie.app`; exclusão de conta acessível no app (exigência das duas lojas).
- Builds de teste: TestFlight e teste interno da Google Play.
- Conferir os itens pendentes de conteúdo: preço/assinatura, e-mail de contato, razão social e CNPJ.

**Aceite**
- [ ] Builds aprovadas nos testes internos das duas lojas.
- [ ] Todos os critérios da Seção 21 da especificação marcados.

**→ Pare e entregue o relatório final. A publicação só acontece com `APROVADO PUBLICAÇÃO`.**

---

## 13. Modelo do relatório de etapa

Ao terminar cada etapa, entregue exatamente esta estrutura:

```
# Relatório · Etapa N · {nome}

## Resumo
2 a 4 frases sobre o que foi entregue.

## Como testar
- Build iOS: {link TestFlight ou instruções}
- Build Android: {link ou APK}
- Conta de teste: {e-mail / senha} · modo do app: {modo}
- Roteiro: passo a passo dos fluxos desta etapa

## Telas
| ID | Tela | Status (pronta / parcial / provisória) | Observação |

## Confirmações, erros e avisos ligados nesta etapa
| ID | Onde aparece | Teste automatizado |

## Definição de pronto (Seção 0.4)
Checklist marcado, com justificativa para o que ficou de fora.

## Divergências da especificação ou do protótipo
O que foi diferente e por quê.

## Pendências e riscos
O que ficou para depois e o que pode atrasar a próxima etapa.

## Perguntas para o dono do produto
Decisões necessárias antes da próxima etapa.

---
Aguardando: `APROVADO ETAPA N` ou `AJUSTES ETAPA N: …`
```

---

## 14. Mapa de dependências

| Etapa | Precisa estar aprovada antes | Por quê |
| --- | --- | --- |
| 1 Acesso | 0 | Componentes, feedback, dados e navegação |
| 2 Onboarding | 1 | Usuário e casal criados no cadastro |
| 3 Início + Casamento | 2 | Plano gerado e modo do app gravado |
| 4 Casa nova | 2 e 3 | Enxoval gerado; orçamento da casa vive no T15 |
| 5 Presentes | 4 | A lista é feita com itens do enxoval |
| 6 Convidados | 3 | Prazo do RSVP vem da data do casamento; buffet no orçamento |
| 7 Modais | 1 a 6 | Audita todas as telas |
| 8 Erros e avisos | 1 a 7 | Auditoria final do app inteiro |
| 9 Lu + notificações | 3 a 6 | A assistente e as notificações agem sobre todos os módulos |
| 10 Lojas | 1 a 9 | App completo |
