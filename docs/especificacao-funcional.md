# Lartiê — Especificação funcional do app (MVP)

> **Lartiê: casamento e casa nova.** App para o casal organizar o casamento e montar a casa nova, com checklist, enxoval da casa por cômodo, lista de presentes compartilhável, orçamento, fornecedores, convidados com RSVP e uma assistente de IA. O casal escolhe se vai usar o app **só para o casamento, só para a casa nova ou para os dois**, e pode decidir depois ou mudar quando quiser (Seção 13.9).

Este documento descreve **tudo o que o app faz, tela por tela**: cada elemento, botão, campo, validação, estado, regra de negócio e para onde cada ação leva. Ele é a fonte de verdade para o desenvolvimento.

---

## 0. Como usar este documento (para o Claude Code)

- Cada tela tem um **ID** (ex.: `T12`) e o nome do protótipo correspondente (ex.: `Inicio.dc.html`). Neste pacote, cada protótipo está em `design/telas/` como imagem (`png/`), HTML estático (`html/`) e fonte com a lógica (`fonte-dc/`). O índice é `design/telas/INDEX.md`.
- Os catálogos de conteúdo (tarefas, itens do enxoval, clima, categorias) estão em `dados/`. Os textos de mensagens e e-mails estão em `docs/textos-e-mensagens.md`.
- As tabelas de ações usam as colunas: **Elemento** · **Tipo** · **Ação do usuário** · **Resultado**.
- Os tokens visuais (cores, tipografia, espaçamentos, raios, sombras, degradês e componentes) estão no design system **"Lartiê"**, em `design-system/`. Use sempre os nomes dos tokens (`primary`, `home`, `error`, `space-4`, `radius-lg`, etc.), nunca valores soltos.
- Textos entre aspas são os textos exatos da interface (pt-BR).
- "Casal" = a conta compartilhada. "Usuário" = cada pessoa que faz login (noivo 1 e noivo 2).
- Ordem sugerida de implementação: Seção 19.
- Pix e cotas em dinheiro **estão fora do MVP** (Seção 20).
- **Modo do app** (`casamento`, `casa`, `os_dois`, `indefinido`): muda a tela inicial, o menu e o que o onboarding pergunta. As regras estão na **Seção 13.9** e valem para todas as telas. Antes de implementar qualquer tela, confira se ela depende do modo.
- **Identidade visual:** o ícone oficial é o **ícone final** (monograma com telhado com beiral sobre a aliança com volume, traço creme sobre o degradê rosé). Arquivos, cores e regras de uso estão no design system "Lartiê" › Logo. Não use versões anteriores do símbolo.

---

## 1. Visão geral

### 1.1 Plataformas
| Superfície | Quem usa | Tecnologia esperada |
| --- | --- | --- |
| App iOS e Android | O casal (2 usuários por conta) | App nativo multiplataforma, com aparência nativa em cada sistema (SF Pro no iOS, Roboto no Android) |
| Web pública (navegador do celular) | Convidados | Páginas web sem login: lista de presentes (T25, T26) e RSVP (T30) |
| Backend | — | API + banco + tempo real + jobs agendados (lembretes, expirações) + armazenamento de arquivos + IA |

### 1.2 Módulos do MVP
1. **Acesso e onboarding** (T01 a T11, mais T06b · O que vão organizar)
2. **Início**, uma versão por modo do app (T12, T12b, T12c, T12d)
3. **Casamento**: checklist, orçamento, fornecedores, convidados (T13 a T17, T28, T29)
4. **Casa nova**: cômodos, itens, medidas, cadastro por foto (T18 a T22)
5. **Presentes**: listas, reservas, agradecimentos (T23 a T27, T65)
6. **Assistente de IA** (T31)
7. **Notificações e perfil** (T32, T33, T33b · Modo do app)
8. **Web do convidado** (T25, T26, T30)
9. **Modais, erros, avisos, permissões e estados** (T34 a T67)
10. **Modo do app**: escolha no onboarding (T06b), telas iniciais por modo (T12 a T12d) e troca no perfil (T33b). Regras na Seção 13.9

### 1.3 Navegação principal
Barra inferior fixa (componente `BarraNavegacao`). **As abas dependem do modo do app** (Seção 13.9):

| Modo | Abas, da esquerda para a direita | Tela inicial |
| --- | --- | --- |
| `os_dois` | Início · Casamento · Casa · Presentes · Perfil | T12 |
| `casamento` | Início · Casamento · Convidados · Presentes · Perfil | T12b |
| `casa` | Início · Casa · Presentes · Perfil | T12c |
| `indefinido` | Início · Presentes · Perfil | T12d |

| Aba | Ícone | Abre |
| --- | --- | --- |
| Início | casa | Tela inicial do modo (T12, T12b, T12c ou T12d) |
| Casamento | alianças | T13 (com seletor interno: Checklist · Orçamento · Fornecedores · Convidados) |
| Convidados | pessoas | T28 (só no modo `casamento`, como atalho direto) |
| Casa | sofá | T18 |
| Presentes | presente | T23 |
| Perfil | pessoa | T33 |

- **Botão flutuante da assistente** (`fab`, 56): canto inferior direito, acima da barra, em T12, T12b, T12c, T13, T18. Abre T31. Em T12d não aparece (a assistente está como item da lista "Já dá para usar").
- **Seletor interno de Casamento** (controle segmentado com 4 opções): Checklist (T13), Orçamento (T15), Fornecedores (T16), Convidados (T28). A aba "Casamento" fica ativa em todas as quatro. No modo `casamento`, abrir T28 pela aba "Convidados" deixa essa aba ativa.
- A barra mantém a ordem fixa das abas; ao mudar de modo, as abas entram e saem sem animação de reordenação.
- Telas internas (detalhes e formulários) abrem empilhadas, com botão **Voltar** (seta) no topo esquerdo. No Android, o botão voltar do sistema tem o mesmo efeito.

---

## 2. Regras globais (valem para todas as telas)

### 2.1 Conta do casal e sincronização
- Uma **conta de casal** reúne todos os dados. Até **2 usuários** (noivo 1 e noivo 2) por casal no MVP.
- Toda alteração de um usuário aparece para o outro em **até 2 segundos** (tempo real).
- Conflito de edição simultânea no mesmo campo: **vence a última gravação**; a outra pessoa vê o valor atualizado.
- Cada registro guarda `criado_por`, `atualizado_por` e `atualizado_em`.

### 2.2 Offline
- O app funciona sem internet usando dados em cache. Alterações feitas offline ficam numa fila e são enviadas quando a conexão volta.
- Ao perder a conexão: mostrar um aviso discreto no topo ("Sem conexão. Suas alterações serão enviadas depois."). Ações que exigem servidor (login, enviar convite, cadastro por foto, assistente, publicar lista) mostram T47.

### 2.3 Padrões de interação
| Padrão | Regra |
| --- | --- |
| Botão principal | Um por tela, no rodapé, largura total, `primary`, pílula, 52 de altura. Fica desativado (38% de opacidade) até o formulário ser válido. Mostra indicador de carregamento enquanto salva e bloqueia toque duplo. |
| Salvar | Ao salvar com sucesso: volta à tela anterior e mostra o aviso rápido de sucesso (T54). Em falha: T48. |
| Voltar com alterações não salvas | Mostra T36 ("Descartar as alterações?"). |
| Excluir | Sempre pede confirmação (T34, T35, T42, T43). Depois de excluir, mostra aviso rápido. |
| Ações reversíveis rápidas | Marcar tarefa, mudar estado de item, marcar recebido: aplicam na hora e mostram aviso rápido com "Desfazer" por 5 segundos. |
| Validação de campo | Ao sair do campo e ao tocar no botão principal. Borda `error`, ícone e mensagem abaixo do campo (ver T44 a T46). |
| Avisos rápidos (toasts) | Aparecem acima da barra inferior por 4 segundos (5 com ação). Tipos: neutro, sucesso, erro (T54). |
| Carregamento | Telas com dados remotos mostram esqueleto (T64) na primeira carga; atualizações seguintes são silenciosas. Puxar para baixo atualiza listas. |
| Estados vazios | Cada lista tem estado vazio próprio (T60 a T63), com ação para começar. |
| Links externos | WhatsApp, Instagram, telefone, links de loja: abrem o app correspondente ou o navegador. |
| Datas | Formato dd/mm/aaaa; mês/ano para mudança. Seletores nativos de data. |
| Valores | Real brasileiro, "R$ 1.300", máscara de moeda na digitação. |
| Acessibilidade | Alvos de toque 44 pt (iOS) / 48 dp (Android); rótulos de acessibilidade em todos os ícones; estado nunca só por cor; suporte a fonte grande. |

### 2.4 Temas
- Tema claro e escuro seguindo o sistema. Todos os tokens de cor têm as duas versões.

### 2.5 Permissões do sistema
Sempre mostrar a **tela de explicação** antes do pedido nativo:
| Permissão | Explicação | Quando pedir |
| --- | --- | --- |
| Notificações | T57 | Após o onboarding (T11), se "Ativar lembretes" estiver ligado |
| Câmera | T58 | Primeiro uso do cadastro por foto ou de foto em item/contrato |
| Contatos | T59 | Primeiro toque em "Importar contatos" |
| Fotos (galeria) | pedido nativo direto | Ao escolher imagem da galeria |
Se negada: T50 (câmera) ou mensagem equivalente com "Abrir Ajustes".

---

## 3. Modelo de dados

> Tipos: `uuid`, `texto`, `data`, `mês/ano`, `inteiro`, `dinheiro` (centavos, inteiro), `booleano`, `enum`, `arquivo` (URL no armazenamento).

### 3.1 Casal (`casal`)
| Campo | Tipo | Regras |
| --- | --- | --- |
| id | uuid | |
| nome_1, nome_2 | texto | nome_1 obrigatório; nome_2 opcional até o parceiro entrar |
| foto | arquivo | opcional |
| data_casamento | data, opcional | se nula, prazos ficam relativos (Seção 13.1) |
| cidade, uf | texto | obrigatório; define o clima |
| estilo | enum: `so_civil`, `civil_religioso`, `mini_wedding`, `festa_grande`, `destination` | |
| num_convidados_previsto | inteiro ≥ 10 | passo de 10 no onboarding |
| orcamento_total | dinheiro, opcional | |
| slug | texto único | usado nos links públicos: `lartie.app/{slug}` (ex.: `ana-e-pedro`) |
| modo_app | enum: `casamento`, `casa`, `os_dois`, `indefinido` | padrão `os_dois` na tela T06b; `indefinido` se o casal tocar em "Decidir depois". Define tela inicial, menu e módulos visíveis (Seção 13.9) |
| modo_alterado_em, modo_alterado_por | data/hora, usuario_id | registro da última troca |
| modulos_gerados | `{casamento: booleano, casa: booleano}` | indica se o checklist e o enxoval já foram gerados. Trocar de modo nunca apaga nada |
| criado_em | data/hora | |
- `data_casamento`, `cidade`, `estilo` e `num_convidados_previsto` só são obrigatórios quando o módulo casamento está ativo. A `cidade` também é pedida no T08 quando o modo é `casa` (define o clima).

### 3.2 Usuário (`usuario`)
| Campo | Tipo | Regras |
| --- | --- | --- |
| id, casal_id | uuid | |
| nome, email | texto | email único |
| provedor_login | enum: `email`, `google`, `apple` | |
| papel | enum: `noivo_1`, `noivo_2` | |
| preferencias_notificacao | objeto | `tarefas`, `parcelas`, `reservas`, `rsvp` (booleanos, padrão true); `silencio_inicio` 22:00, `silencio_fim` 08:00 |

### 3.3 Convite de parceiro (`convite_parceiro`)
id, casal_id, codigo (ex.: `7K2`), email (opcional), criado_em, expira_em (criado_em + 7 dias), status `pendente | aceito | expirado | cancelado`.

### 3.4 Imóvel (`imovel`)
tipo `apartamento | casa`; quartos (≥1); banheiros (≥1); posse `alugado | proprio`; mobiliado `sim | em_parte | nao`; data_mudanca (mês/ano, opcional); tem_pets (booleano); moradores (inteiro, padrão 2 + pessoas informadas).

### 3.5 Cômodo (`comodo`)
id, imovel_id, nome, ordem, largura_m, comprimento_m, pe_direito_m (opcionais), paredes_livres: lista de `{nome, largura_m}`.

### 3.6 Item do enxoval (`item`)
| Campo | Tipo | Regras |
| --- | --- | --- |
| id, comodo_id | uuid | |
| nome | texto | obrigatório |
| fase | enum `primeira_noite`, `primeiro_mes`, `com_calma` | |
| quantidade | inteiro ≥ 1 | |
| estado | enum `falta`, `ja_tenho`, `na_lista` | padrão `falta` |
| origem | enum `comprado`, `ganhado`, `ja_era_nosso`, nulo | só quando `ja_tenho` |
| quem_deu | texto | só quando origem = `ganhado` |
| preco_estimado | dinheiro | opcional |
| link_loja | URL | opcional, validar formato |
| medidas | `{largura_cm, profundidade_cm, altura_cm}` | opcional |
| parede_destino | referência a parede livre | opcional, usada na checagem de encaixe |
| observacao, foto | texto, arquivo | opcionais |
| gerado_pelo_plano | booleano | itens criados no onboarding |

### 3.7 Tarefa (`tarefa`)
id, casal_id, titulo (obrigatório), fase (`decisoes_iniciais`, `fornecedores_principais`, `detalhes`, `documentos_reta_final`, `semana_casamento`), prazo (data), responsavel (`noivo_1 | noivo_2 | os_dois`), status (`a_fazer | em_andamento | concluida`), fornecedor_id (opcional), notas, lembrete_ativo (booleano, padrão true), oculta (booleano), ordem, gerada_pelo_plano.
- **Atrasada** = status ≠ concluída e prazo < hoje (calculado, não gravado).

### 3.8 Fornecedor (`fornecedor`)
id, casal_id, nome, categoria (lista da Seção 13.4), contato_whatsapp, contato_instagram, contato_telefone, valor (dinheiro), o_que_inclui (texto), status (`pesquisando | orcamento_pedido | negociando | fechado | descartado`), forma_pagamento (texto, ex.: "Entrada + 5x"), contrato (arquivo PDF/imagem), notas, data_orcamento.

### 3.9 Parcela (`parcela`)
id, fornecedor_id, numero, descricao ("Entrada", "Parcela 1"), valor, vencimento, paga (booleano), paga_em.

### 3.10 Categoria de orçamento (`categoria_orcamento`)
id, casal_id, escopo (`casamento | casa`), nome, planejado (dinheiro), ordem. **Gasto** é calculado (Seção 13.4).

### 3.11 Lançamento avulso (`gasto`)
id, categoria_id, descricao, valor, data, origem (`manual | nota_fiscal | item | fornecedor`). Itens comprados com preço e fornecedores fechados geram gastos automaticamente.

### 3.12 Lista de presentes (`lista_presentes`)
id, casal_id, ocasiao (`cha_panela | cha_cozinha | cha_bar | casamento`), data_evento (opcional), slug_lista (único por casal, ex.: `cha-de-panela`), status (`rascunho | publicada | despublicada`), modo_surpresa (booleano), endereco_entrega (texto, opcional).
- Relação **lista ↔ item** (`lista_item`): lista_id, item_id, quantidade_na_lista.

### 3.13 Reserva (`reserva`)
id, lista_item_id, quantidade, nome_convidado (obrigatório), whatsapp (opcional), mensagem (opcional), status (`ativa | recebida | expirada | cancelada`), criada_em, expira_em (criada_em + 15 dias), token_gerenciar (para o convidado desfazer).

### 3.14 Agradecimento (`agradecimento`)
id, reserva_id **ou** item_id (presente registrado à mão), nome, presente_descricao, agradecido (booleano), agradecido_em.

### 3.15 Grupo de convidados (`grupo`)
id, casal_id, nome, lado (`noivo_1 | noivo_2 | os_dois`), tipo (`familia | amigos | trabalho`), whatsapp, token_rsvp (link único), convite_enviado_em, ultimo_lembrete_em.

### 3.16 Convidado (`convidado`)
id, grupo_id, nome, faixa (`adulto | crianca`), presenca (`sem_resposta | vai | nao_vai`), restricao_alimentar (`nenhuma | vegetariano | vegano | sem_gluten | sem_lactose | outra`), restricao_outra (texto).
- Configuração do casal: `rsvp_prazo` (data; padrão = casamento − 60 dias), `buffet_valor_por_pessoa` (dinheiro, opcional).

### 3.17 Notificação (`notificacao`)
id, casal_id, usuario_id (nulo = para os dois), tipo (Seção 12), texto, destino (rota), lida (booleano), criada_em.

### 3.18 Conversa da assistente (`mensagem_assistente`)
id, casal_id, autor (`usuario:<id> | assistente`), texto, anexos (fotos), acao_proposta (JSON, opcional), status_acao (`pendente | confirmada | cancelada`), criada_em. Histórico compartilhado entre os dois.

---

## 4. Acesso e login

### T01 · Splash (`Main.dc.html`)
**Objetivo:** abrir o app e decidir para onde ir.
- Elementos: fundo em degradê rosé → vinho (`gradient-splash`), ícone final do app (bloco com degradê e símbolo creme), "Lartiê" em Fraunces, slogan "casamento e casa nova".
- Comportamento real:
  - Sessão válida e onboarding completo → tela inicial do modo do app (T12, T12b, T12c ou T12d).
  - Sessão válida e onboarding incompleto → próxima tela do onboarding pendente.
  - Sem sessão → T02.
  - Versão do app abaixo da mínima → T67.
  - App aberto por link de convite do parceiro → T66; por link expirado → T53.
- Botão **"Começar"** (só aparece na primeira abertura sem sessão) → T02.

### T02 · Boas-vindas (`BoasVindas.dc.html`)
| Elemento | Tipo | Ação | Resultado |
| --- | --- | --- | --- |
| Carrossel (3 páginas) | Arraste lateral | Arrastar | Troca página: (1) "Casamento e casa nova no mesmo lugar", (2) "Quantidades certas, sem exageros", (3) "A família sabe o que dar" |
| Pontos de página | Botões | Tocar | Vai para a página |
| "Criar conta" | Botão principal | Tocar | T03 |
| "Já tenho conta" | Botão contornado | Tocar | T04 |

### T03 · Criar conta (`CriarConta.dc.html`)
| Elemento | Tipo | Ação | Resultado |
| --- | --- | --- | --- |
| Voltar | Ícone | Tocar | T02 |
| "Continuar com Google" | Botão | Tocar | Login Google; conta nova → T06; conta existente → regra do T01 |
| "Continuar com Apple" | Botão | Tocar | Login Apple (obrigatório no iOS); mesmo destino |
| Seu nome | Campo texto | — | Obrigatório, 2 a 40 caracteres |
| E-mail | Campo e-mail | — | Obrigatório, formato válido, único |
| Senha | Campo senha | — | Obrigatório, mínimo 8 caracteres; botão de mostrar/ocultar |
| Termos | Caixa de seleção | Marcar | Obrigatória; textos "Termos de Uso" e "Política de Privacidade" são links |
| "Criar conta" | Botão principal | Tocar | Cria usuário (papel `noivo_1`) e casal vazio → T06 |
| "Entrar" | Link | Tocar | T04 |

Erros (T45): e-mail já cadastrado ("Este e-mail já tem uma conta." + link "Entrar com este e-mail" → T04 com e-mail preenchido); senha curta ("Use pelo menos 8 caracteres."); sem internet → T47.
Se o usuário veio de um convite de parceiro (T66), a conta criada entra no casal existente como `noivo_2` e **pula o onboarding** → T12.

### T04 · Entrar (`Entrar.dc.html`)
| Elemento | Tipo | Ação | Resultado |
| --- | --- | --- | --- |
| Voltar | Ícone | Tocar | T02 |
| "Entrar com Google" / "Entrar com Apple" | Botões | Tocar | Login social → regra do T01 |
| E-mail, Senha | Campos | — | Obrigatórios |
| "Esqueci a senha" | Link | Tocar | T05 (e-mail preenchido se houver) |
| "Entrar" | Botão principal | Tocar | Autentica → regra do T01 |
| "Criar conta" | Link | Tocar | T03 |

Erro (T44): credenciais inválidas → aviso no topo "E-mail ou senha incorretos. Confira e tente de novo." e campo senha em erro. Após 5 tentativas erradas em 15 minutos: bloquear por 15 minutos com mensagem explicativa.

### T05 · Esqueci a senha (`EsqueciSenha.dc.html`)
- Estado 1 (formulário): campo E-mail (obrigatório) e botão **"Enviar link"**. Sempre mostra o estado 2, exista ou não a conta (não revelar quais e-mails existem).
- Estado 2 (enviado): "Confira seu e-mail. Enviamos o link para {email}. Ele vale por 1 hora."; **"Reenviar e-mail"** (liberado após 60 s; volta ao estado 1 preenchido) e **"Voltar para o login"** → T04.
- O link do e-mail abre a tela nativa de nova senha (campo nova senha + confirmar, mínimo 8) → entra direto no app.

---

## 5. Onboarding

Regras gerais do onboarding:
- Fundo das telas do onboarding (T06 a T11, incluindo T06b) e de T05: degradê `gradient-onboarding` no topo, com os anéis brancos decorativos; os cartões e campos ficam sobre `surface`.
- Os passos dependem do modo escolhido no T06b. A barra de progresso mostra só os passos do caminho escolhido:

| Modo | Passos | Contador |
| --- | --- | --- |
| `os_dois` | T06 → T06b → T07 → T08 → T09 → T10 → T11 | "1 de 5" … "5 de 5" |
| `casamento` | T06 → T06b → T07 → T10 → T11 | "1 de 3" … "3 de 3" |
| `casa` | T06 → T06b → T08 → T09 → T10 → T11 | "1 de 4" … "4 de 4" |
| `indefinido` | T06 → T06b → T12d | "1 de 5" e "2 de 5" (depois sai do onboarding) |

- Até o T06b o contador usa 5 passos. Depois da escolha ele é recalculado (ex.: no modo `casamento`, o T07 aparece como "3 de 3").
- Voltar mantém os dados preenchidos.
- O progresso é salvo a cada passo: se o app fechar, retoma do passo pendente.
- Só o `noivo_1` faz o onboarding. O `noivo_2` entra pelo convite e cai direto no T12.

### T06 · O casal (`Ob1Casal.dc.html`)
| Elemento | Tipo | Ação | Resultado |
| --- | --- | --- | --- |
| Voltar | Ícone | Tocar | T03 |
| "Foto do casal" | Botão circular | Tocar | Folha com "Tirar foto" (T58 se necessário), "Escolher da galeria", "Remover foto" (se houver). Opcional |
| Seu nome | Campo | — | Pré-preenchido com o nome da conta; obrigatório |
| Nome do seu amor | Campo | — | Obrigatório (vira `nome_2` provisório) |
| "Continuar" | Botão principal | Tocar | Salva → T06b |

### T06b · O que vocês querem organizar? (`ObUso.dc.html`)
**Objetivo:** escolher o modo do app. Define a tela inicial, o menu e os próximos passos do onboarding.

| Elemento | Tipo | Ação | Resultado |
| --- | --- | --- | --- |
| Voltar | Ícone | Tocar | T06 |
| Título e texto | Texto | — | "O que vocês querem organizar?" · "Isso define a tela inicial e o menu do app. Dá para mudar quando quiserem." |
| "Só o casamento" | Opção (rádio, cartão) | Tocar | Seleciona `casamento`. Texto: "Checklist, orçamento, fornecedores, convidados e lista de presentes." Ícone alianças, cor `primary-container` |
| "Só a casa nova" | Opção (rádio, cartão) | Tocar | Seleciona `casa`. Texto: "Enxoval por cômodo, medidas, cadastro por foto e lista de presentes." Ícone casa, cor `home-container` |
| "Casamento e casa nova" | Opção (rádio, cartão) com selo "Mais completo" | Tocar | Seleciona `os_dois`. **Vem selecionada por padrão** |
| Aviso | Caixa informativa | — | "Dá para mudar quando quiserem em Perfil › Modo do app. Nada do que vocês cadastrarem é apagado." |
| "Continuar" | Botão principal | Tocar | Grava `modo_app` → `casamento` ou `os_dois`: T07 · `casa`: T08 |
| "Decidir depois" | Botão de texto (link, abaixo do principal, mesmo estilo de "Pular") | Tocar | Grava `modo_app = indefinido`, marca o onboarding como concluído **sem gerar checklist nem enxoval** → T12d |

- Só uma opção pode estar selecionada. O cartão selecionado tem borda `primary` de 2 e rádio preenchido; os outros, borda `outline-variant`.
- Acessibilidade: o grupo é anunciado como "Modo do app, grupo de opções"; cada cartão como rádio com título e descrição.
- "Decidir depois" não é uma opção da lista: é um link de texto. O convite do parceiro fica disponível no T12d.

### T07 · Sobre o casamento (`Ob2Casamento.dc.html`)
| Elemento | Tipo | Ação | Resultado |
| --- | --- | --- | --- |
| Data | Seletor de data | — | Obrigatória, a menos que "Ainda não definimos a data" esteja marcado. Deve ser futura |
| Cidade | Campo com sugestões | Digitar | Lista de cidades (cidade + UF). Obrigatória |
| "Ainda não definimos a data" | Caixa de seleção | Marcar | Desativa o campo Data |
| Estilo | Chips (escolha única) | Tocar | `Só civil`, `Civil + religioso` (padrão), `Mini wedding`, `Festa grande`, `Destination` |
| Número de convidados | Contador − / + | Tocar | Passo 10, mínimo 10, padrão 100 |
| Orçamento total | Campo moeda | — | Opcional |
| Voltar | Ícone | Tocar | T06b |
| "Continuar" | Botão principal | Tocar | Valida → modo `os_dois`: T08 · modo `casamento`: gera o plano (só checklist e orçamento do casamento) → T10 |

Erros (T46): data no passado "Escolha uma data depois de hoje."; cidade vazia "Informe a cidade para ajustarmos o clima."

### T08 · Casa nova (`Ob3Casa.dc.html`)
| Elemento | Tipo | Regras |
| --- | --- | --- |
| Tipo de imóvel | Escolha única | Apartamento (padrão) · Casa |
| Quartos / Banheiros | Contadores | Mínimo 1; máximo 6; padrão 2 e 1 |
| O imóvel é | Escolha única | Alugado (padrão) · Próprio. "Alugado" adiciona tarefas de vistoria e contrato de locação |
| Vem mobiliado? | Escolha única | Sim · Em parte · Não (padrão). "Sim" remove móveis grandes do enxoval; "Em parte" marca móveis como fase "Com calma" |
| Data da mudança | Mês/ano | Opcional |
| Temos pets | Caixa de seleção | Cria o cômodo "Pets" |
| Cidade | Campo com sugestões | **Só no modo `casa`** (no modo `os_dois` já veio do T07). Obrigatória, define o clima |
| Voltar | Ícone | Modo `os_dois`: T07 · modo `casa`: T06b |
| "Continuar" | Botão principal | → T09 |

### T09 · O que vocês já têm (`Ob4Partida.dc.html`)
| Elemento | Tipo | Regras |
| --- | --- | --- |
| Algum de vocês já mora sozinho? | Escolha única | Sim · Não |
| Marque o que já têm | Múltipla escolha (8) | Cozinha montada, Cama e colchão, Geladeira, Fogão, Máquina de lavar, Sofá, Cama e banho, Micro-ondas. Cada opção marca um conjunto de itens como `ja_tenho` com origem `ja_era_nosso` |
| "Montar nosso plano" | Botão principal | Gera o plano (Seção 13) → T10 |
| "Pular, começamos do zero" | Botão de texto | Gera o plano sem itens marcados → T10 |

### T10 · Plano pronto (`ObGerando.dc.html`)
- Primeiro mostra o carregamento ("Montando o plano de vocês…", 2 a 6 s) enquanto o backend gera tarefas, cômodos, itens, categorias de orçamento e o slug.
- Depois mostra o resumo: "Ana & Pedro, este é o começo de tudo" e os cartões **do modo escolhido**:
  - **Checklist do casamento** (modos `casamento` e `os_dois`): "{n} tarefas em 5 fases, até {data}".
  - **Enxoval da casa** (modos `casa` e `os_dois`): "{c} cômodos e {i} itens, {j} já marcados".
  - **Ajustado para vocês**: modo `casa` ou `os_dois`: "{moradores} moradores, {pets} pet(s) e o clima de {cidade}"; modo `casamento`: "{convidados} convidados, estilo {estilo}, em {cidade}".
- O backend gera **só os módulos ativos** e grava `modulos_gerados`.
- Botão **"Continuar"** → T11.
- Falha na geração: T48 com "Tentar de novo".

### T11 · Convidar parceiro(a) (`ObConvidar.dc.html`)
| Elemento | Tipo | Ação | Resultado |
| --- | --- | --- | --- |
| "Enviar convite pelo WhatsApp" | Botão (`whatsapp`) | Tocar | Cria `convite_parceiro` e abre o WhatsApp com mensagem pronta + link |
| Link do convite | Campo somente leitura | — | `lartie.app/convite/{codigo}` |
| "Copiar" | Botão | Tocar | Copia o link; aviso "Link copiado" |
| Ou envie por e-mail | Campo e-mail | Enviar pelo teclado | Envia e-mail de convite; aviso "Convite enviado" |
| "Ativar lembretes" | Interruptor | Alternar | Padrão ligado |
| "Ir para o início" | Botão principal | Tocar | Se lembretes ligados e permissão não pedida → T57; senão → tela inicial do modo (T12, T12b ou T12c) |
| "Convidar depois" | Botão de texto | Tocar | Mesmo destino do botão principal; o convite fica disponível no Perfil |

---

## 6. Início (uma tela por modo do app)

A aba **Início** abre uma tela diferente para cada modo (Seção 13.9). O cabeçalho (avatares, "Olá, Ana & Pedro", sino) e a barra inferior seguem as mesmas regras nas quatro; o que muda é o conteúdo e as abas.

| Modo | Tela | Protótipo |
| --- | --- | --- |
| `os_dois` | T12 · Casamento e casa nova | `Inicio.dc.html` |
| `casamento` | T12b · Só casamento | `InicioCasamento.dc.html` |
| `casa` | T12c · Só casa nova | `InicioCasa.dc.html` |
| `indefinido` | T12d · Decidir depois | `InicioDepois.dc.html` |

### T12 · Início: casamento e casa nova (`Inicio.dc.html`)
| Elemento | Tipo | Ação | Resultado |
| --- | --- | --- | --- |
| Avatares + "Olá, Ana & Pedro" | Cabeçalho | — | Mostra só o nome_1 se o parceiro ainda não entrou |
| Sino | Ícone com ponto vermelho | Tocar | T32. O ponto aparece se houver notificação não lida |
| Cartão de contagem | Cartão `primary` | — | "Faltam {n} dias", data e cidade. Sem data: "Data a definir" + link "Definir data" → edição dos dados do casamento |
| Cartão "Casamento" | Cartão de progresso | Tocar | T13. Percentual = tarefas concluídas / total visível |
| Cartão "Casa nova" | Cartão de progresso (cor `home`) | Tocar | T18. Percentual = itens `ja_tenho` / total |
| "Próximas tarefas" | Lista (até 3) | Tocar item | T14. Ordem: atrasadas primeiro, depois por prazo. Selo "Atrasada" (`error`) ou data curta |
| "Ver todas" | Link | Tocar | T13 |
| Atalho "reservas novas" | Cartão | Tocar | T23. Conta reservas criadas desde a última visita a Presentes |
| Atalho "confirmados de {total}" | Cartão | Tocar | T28 |
| Atalho "% do orçamento usado" | Cartão | Tocar | T15. Sem orçamento: "Definir orçamento" |
| Botão da assistente | FAB | Tocar | T31 |
| Barra inferior | Navegação | — | Aba Início ativa |

- Puxar para baixo atualiza. Primeira carga: T64. Sem tarefas futuras: a seção mostra "Tudo em dia por aqui".

### T12b · Início: só casamento (`InicioCasamento.dc.html`)
| Elemento | Tipo | Ação | Resultado |
| --- | --- | --- | --- |
| Cabeçalho e sino | — | — | Como T12 |
| Cartão de contagem | Cartão `primary` | — | Como T12 |
| "Checklist do casamento" | Cartão de progresso largo | Tocar | T13. Mostra "{x} de {total} tarefas", percentual, selo da fase atual ("Fase: {fase}") e selo "{n} atrasada(s)" (`error`) se houver |
| "Próximas tarefas" + "Ver todas" | Lista (até 3) | Tocar | Como T12 |
| Atalhos (3) | Cartões | Tocar | "confirmados de {total}" → T28 · "% do orçamento usado" → T15 · "{x} de {y} fornecedores fechados" → T16 |
| "Lista de presentes" | Linha com ícone | Tocar | T23. Texto: "{n} reservas novas · {r} de {t} reservados". Sem lista: "Criem a lista e compartilhem por link" |
| "Vão montar a casa nova também?" | Cartão tracejado | Tocar | T33b com "Casamento e casa nova" pré-selecionado |
| Assistente | FAB | Tocar | T31 |
| Barra inferior | Navegação | — | Início · Casamento · Convidados · Presentes · Perfil |

### T12c · Início: só casa nova (`InicioCasa.dc.html`)
| Elemento | Tipo | Ação | Resultado |
| --- | --- | --- | --- |
| Cabeçalho e sino | — | — | Como T12 |
| Cartão da mudança | Cartão `home` | Tocar | T18. "Mudança em {n} meses" (ou "{n} dias" se faltar menos de 60), mês/ano e resumo do imóvel ("Apê de 2 quartos"), percentual e "{x} de {total} itens". Sem data de mudança: "Data da mudança a definir" + link "Definir" → Dados da casa nova |
| Fases | 3 cartões pequenos | Tocar | T18 filtrado pela fase. Primeira noite · Primeiro mês · Com calma, cada um com "{x} de {total}". A fase atual (primeira não concluída) fica destacada (`inverse`) |
| Atalhos | 2 botões | Tocar | "Cadastrar por foto" → T22 (T58 se precisar) · "Medidas dos cômodos" → T21 do primeiro cômodo sem medidas (ou seletor de cômodo) |
| "Cômodos" + "Ver todos" | Grade 2×2 | Tocar | T19 do cômodo. Mostra os 4 cômodos com mais itens faltando; "Ver todos" → T18 |
| "Faltam para a primeira noite" | Lista (até 3) | Tocar | T20. Itens `falta` da fase atual, com cômodo, quantidade ou preço e selo "Falta" (`warning`). Fase atual completa: troca para a próxima fase |
| "Vão casar também?" | Cartão tracejado | Tocar | T33b com "Casamento e casa nova" pré-selecionado |
| Assistente | FAB | Tocar | T31 |
| Barra inferior | Navegação | — | Início · Casa · Presentes · Perfil |

### T12d · Início: decidir depois (`InicioDepois.dc.html`)
**Problema que resolve:** no modo `indefinido` não existe checklist nem enxoval gerado, então a tela não pode ficar vazia. Ela vira um ponto de partida: explica os dois caminhos, deixa começar com um toque e mostra o que já funciona sem escolher.

| Elemento | Tipo | Ação | Resultado |
| --- | --- | --- | --- |
| Cabeçalho e sino | — | — | Como T12 |
| Cartão de boas-vindas | Cartão com degradê `brand` e ícone do app | — | "Por onde vocês querem começar?" · "Escolham um caminho e o app monta o plano com o que vocês contarem. Dá para ativar o outro quando quiserem." |
| Cartão "Casamento" | Cartão com 3 tópicos | — | "Para quem vai casar" · Checklist com prazos até a data · Orçamento e fornecedores · Convidados e confirmações |
| "Começar pelo casamento" | Botão `primary` | Tocar | Abre T07 em modo "completar dados". Ao concluir: grava `modo_app = casamento`, gera checklist e orçamento → T10 resumido → T12b |
| Cartão "Casa nova" | Cartão com 3 tópicos | — | "Para quem vai mudar" · Enxoval por cômodo, na quantidade certa · Medidas e cadastro por foto · O que já têm entra como "Já tenho" |
| "Começar pela casa nova" | Botão `home` | Tocar | Abre T08 (com Cidade) → T09. Ao concluir: grava `modo_app = casa`, gera o enxoval → T10 resumido → T12c |
| "Quero os dois" | Botão de texto | Tocar | T07 → T08 → T09 → grava `os_dois` → T10 → T12 |
| "Já dá para usar" | Lista | Tocar | "Pergunte à Lu" → T31 (a Lu pode sugerir o modo, Seção 14) · "Lista de presentes" → T23 · "Convidar {parceiro}" → T11 (se o parceiro já entrou, a linha some) |
| Barra inferior | Navegação | — | Início · Presentes · Perfil (sem FAB) |

Regras do modo `indefinido`:
- Os dados preenchidos em "Começar pelo…" e cancelados no meio ficam salvos como rascunho; na próxima vez o formulário volta preenchido.
- **Lembrete único:** 3 dias depois do cadastro, se o modo continuar `indefinido`, envia uma notificação "Por onde vocês querem começar?" (Seção 12). Não repete.
- Se o casal criar uma lista de presentes antes de escolher, ela continua igual depois da escolha (as ocasiões disponíveis seguem a Seção 13.9).
- Deep links para telas de módulos não ativos (ex.: notificação antiga, link compartilhado) abrem T12d com a folha "Ativar {módulo}?" (ver 13.9).

---

## 7. Casamento

### T13 · Checklist (`Checklist.dc.html`)
| Elemento | Tipo | Ação | Resultado |
| --- | --- | --- | --- |
| "+" | Botão de ícone | Tocar | T14 em modo **nova tarefa** (campos vazios, fase pré-selecionada pela data) |
| Seletor interno | Controle segmentado | Tocar | Checklist · Orçamento (T15) · Fornecedores (T16) · Convidados (T28) |
| Progresso geral | Cartão | — | "{x} de {y} tarefas" e % |
| Filtros | Chips (escolha única) | Tocar | Todas (padrão) · A fazer · Atrasadas · Concluídas |
| Fase | Seção | Tocar no cabeçalho | Recolhe/expande a fase. Mostra nome, período ("12 meses antes") e contagem "{feitas}/{total}" |
| Caixa da tarefa | Caixa de seleção | Tocar | Alterna concluída ↔ a fazer. Aviso "Tarefa concluída" com "Desfazer" (T54). Se completar a fase → T56 |
| Nome da tarefa | Link | Tocar | T14 em modo edição |
| Meta à direita | Texto/selo | — | Responsável ou prazo; "Atrasada" em `error`; "Feita" quando concluída |
| Segurar a tarefa (pressão longa) | Gesto | Arrastar | Reordena dentro da fase |
| Arrastar para a esquerda | Gesto | — | Ações rápidas: "Ocultar" e "Excluir" (→ T34) |
| FAB / barra | — | — | Como T12 |

- Tarefas ocultas não aparecem nem contam no progresso. Opção "Mostrar ocultas" no fim da lista.
- Lista vazia por filtro: "Nenhuma tarefa aqui." com botão "Ver todas".

### T14 · Tarefa (`Tarefa.dc.html`) — criar e editar
| Elemento | Tipo | Ação | Resultado |
| --- | --- | --- | --- |
| Voltar | Ícone | Tocar | Se houver alterações → T36; senão volta |
| "…" | Menu | Tocar | "Ocultar tarefa", "Duplicar", "Excluir tarefa" (→ T34) |
| Selo de status | Selo | — | "Atrasada {n} dias" quando aplicável |
| Título | Campo grande | — | Obrigatório, até 80 caracteres |
| Fase | Seleção | — | 5 fases |
| Prazo | Data | — | Opcional; se vazio usa a data sugerida da fase |
| Responsável | Escolha única | — | {nome_1} · {nome_2} · Os dois |
| Status | Escolha única | — | A fazer · Em andamento · Concluída |
| Fornecedor vinculado | Cartão/link | Tocar | Com fornecedor → T17. Sem: botão "Vincular fornecedor" abre lista de fornecedores com busca e "Novo fornecedor" |
| Notas | Texto longo | — | Opcional, até 1.000 caracteres |
| "Lembrar 3 dias antes do prazo" | Interruptor | — | Agenda notificação (Seção 12) |
| "Excluir tarefa" | Botão de texto `error` | Tocar | T34 |
| "Salvar" | Botão principal | Tocar | Grava → T13 + aviso "Tarefa salva" |

Regras: concluir a tarefa ligada a fornecedor não muda o fornecedor; fechar um fornecedor conclui a tarefa ligada (T37).

### T15 · Orçamento (`Orcamento.dc.html`)
| Elemento | Tipo | Ação | Resultado |
| --- | --- | --- | --- |
| "+" | Botão | Tocar | Folha **Novo gasto**: descrição, valor, categoria, data, "Foto da nota fiscal" (opcional, usa IA para preencher valor) → "Salvar" |
| Seletor interno | Segmentado | — | Como T13 |
| Escopo | Escolha única | Tocar | Casamento · Casa nova |
| Resumo | Cartão escuro | — | "Gasto até agora R$ x de R$ y", barra, "% usado", "Saldo R$ z" |
| Alerta de estouro | Aviso `error` | — | Para cada categoria com gasto > planejado: "{categoria} passou R$ {diferença} do planejado." |
| Categorias | Lista | Tocar | Folha **Categoria**: editar valor planejado, ver lançamentos (fornecedores fechados, itens comprados, gastos avulsos), excluir gasto avulso (confirmação) |
| Barra da categoria | Indicador | — | `primary`; `error` quando estoura |
| "Editar orçamento" (no menu "…") | Ação | Tocar | Editar orçamento total e distribuir por categoria (percentuais da Seção 13.4) |
| "Próximas parcelas" | Lista | Tocar | T17 do fornecedor. Mostra data, fornecedor, "Parcela n de m", valor |
| Marcar parcela paga | Arrastar ou tocar no valor | — | Pergunta "Marcar como paga?"; grava `paga_em` |

- Sem orçamento total: cartão vazio "Definam quanto querem gastar" com botão "Definir orçamento".

### T16 · Fornecedores (`Fornecedores.dc.html`)
| Elemento | Tipo | Ação | Resultado |
| --- | --- | --- | --- |
| "+" | Botão | Tocar | T17 em modo **novo fornecedor** |
| Seletor interno | Segmentado | — | Como T13 |
| Categorias | Chips | Tocar | Filtra: Todos · Fotografia · Local e buffet · Decoração · Música · Roupas · (demais existentes) |
| Resumo | 3 números | — | Fechados · Negociando (inclui orçamento pedido) · Pesquisando |
| Cartão do fornecedor | Linha | Tocar | T17 |
| Selo de status | Selo | — | Cores: fechado `success`, negociando `warning`, orçamento pedido `info`, pesquisando neutro, descartado riscado |
| Comparar | Modo | Segurar um cartão e tocar em outro da mesma categoria | Abre comparação lado a lado: valor, o que inclui, pagamento, status |

- Vazio: T62.

### T17 · Fornecedor (`Fornecedor.dc.html`) — criar e editar
| Elemento | Tipo | Ação | Resultado |
| --- | --- | --- | --- |
| Voltar | Ícone | Tocar | Alterações não salvas → T36 |
| "Editar" | Botão de texto | Tocar | Entra em modo edição de nome, categoria, contatos |
| WhatsApp / Instagram / Ligar | Botões | Tocar | Abre o app correspondente. Ocultos se o contato não existir |
| Status | Chips (escolha única) | Tocar | Pesquisando · Orçamento pedido · Negociando · Fechado · Descartado. Escolher "Fechado" → T37 |
| Aviso de fechado | Faixa `success` | — | "Fechado. O valor entrou no orçamento, as parcelas foram para o calendário e a tarefa '{tarefa}' foi concluída." |
| Valor, O que inclui, Pagamento | Campos | Tocar | Edição inline |
| Parcelas | Lista | "+ Parcela" / tocar | Adicionar ou editar parcela (descrição, valor, vencimento, paga). "Gerar parcelas" cria entrada + N parcelas mensais a partir do valor |
| "Anexar contrato (PDF ou foto)" | Botão | Tocar | Escolher arquivo, foto ou documento. Com contrato: mostra o arquivo com "Abrir" e "Remover" |
| Notas | Texto | — | Opcional |
| "Excluir fornecedor" (menu) | Ação | Tocar | Confirmação "Excluir {nome}?" — remove parcelas e desvincula tarefas |
| "Marcar como fechado" / "Salvar" | Botão principal | Tocar | Não fechado → T37; fechado → salva |

Validações: nome obrigatório, categoria obrigatória; valor obrigatório para fechar; soma das parcelas deve ser igual ao valor (avisar se diferente, não bloquear).

### T28 · Convidados e RSVP (`Convidados.dc.html`)
| Elemento | Tipo | Ação | Resultado |
| --- | --- | --- | --- |
| "+" | Botão | Tocar | T29 em modo novo grupo |
| Seletor interno | Segmentado | — | Como T13 |
| Painel | Cartão | — | Total de convidados (adultos/crianças); barra empilhada; confirmados, não vão, sem resposta |
| Estimativa do buffet | Linha | Tocar | Editar valor por pessoa. Mostra "R$ {valor} × {confirmados} confirmados = R$ {total}" |
| "Importar contatos" | Botão | Tocar | T59 (primeira vez) → seletor de contatos com busca e seleção múltipla → cria um grupo por contato ou agrupa por sobrenome (pergunta ao usuário) |
| "Lembrar {n} pendentes" | Botão `whatsapp` | Tocar | T38 |
| Filtros | Chips | Tocar | Todos · Confirmados (inclui parciais) · Sem resposta · Não vão |
| Grupo | Linha | Tocar | T29 em modo edição |
| Selo do grupo | Selo | — | Confirmado · Parcial x/y · Sem resposta · Não vão |
| "Prazo do RSVP" (menu) | Ação | Tocar | Editar `rsvp_prazo` |
| "Exportar lista" (menu) | Ação | Tocar | Gera planilha CSV com nome, grupo, presença e restrição para enviar ao buffet |

- Vazio: T61.

### T29 · Grupo de convidados (`NovoGrupo.dc.html`)
| Elemento | Tipo | Regras / Resultado |
| --- | --- | --- |
| Nome do grupo | Campo | Obrigatório |
| Lado | Escolha única | {nome_1} · {nome_2} · Os dois |
| Tipo | Escolha única | Família · Amigos · Trabalho |
| WhatsApp para o convite | Campo telefone | Opcional; obrigatório para enviar pelo WhatsApp |
| Pessoas ({n}) | Lista | Nome editável; botão Adulto/Criança alterna a faixa; arrastar para remover (com "Desfazer") |
| "+ Adicionar pessoa" | Botão de texto | Nova linha vazia com foco |
| Aviso | Texto | "O grupo recebe um link próprio. Cada pessoa confirma presença e informa restrição alimentar." |
| "Excluir grupo" | Botão `error` | Confirmação "Excluir {grupo} e {n} pessoas?" |
| "Salvar e enviar convite" | Botão principal `whatsapp` | Salva, gera `token_rsvp` e abre o WhatsApp com a mensagem e o link `lartie.app/{slug}/rsvp/{token}` |
| "Só salvar" | Botão de texto | Salva e volta para T28 |

Validações: pelo menos 1 pessoa com nome.

---

## 8. Casa nova

### T18 · Casa nova (`Casa.dc.html`)
| Elemento | Tipo | Ação | Resultado |
| --- | --- | --- | --- |
| Câmera | Botão de ícone | Tocar | T58 (primeira vez) → T22 |
| "+" | Botão | Tocar | T20 em modo novo item (pergunta o cômodo) |
| Resumo | Cartão `home` | — | "{tipo} de {quartos} quartos · mudança em {mês/ano}", "{x} de {y} itens", % |
| Fases | Chips | Tocar | Todas · Primeira noite · Primeiro mês · Com calma. Atualiza contagens e mostra a descrição da fase |
| Cômodo | Cartão | Tocar | T19 |
| Selo "Completo" | Selo | — | Quando todos os itens do cômodo (na fase filtrada) são `ja_tenho` |
| "+ Novo cômodo" | Cartão tracejado | Tocar | Folha: nome do cômodo e "Criar" (com sugestões: Escritório, Varanda, Quarto de hóspedes) |
| FAB / barra | — | — | Como T12 |

### T19 · Cômodo (`Comodo.dc.html`)
| Elemento | Tipo | Ação | Resultado |
| --- | --- | --- | --- |
| Voltar | Ícone | Tocar | T18 |
| "Medidas" | Botão | Tocar | T21 |
| "+" | Botão | Tocar | T20 novo item neste cômodo |
| "…" (menu) | Ação | Tocar | "Renomear cômodo", "Excluir cômodo" (confirmação; pergunta se move os itens para outro cômodo ou exclui) |
| Progresso | Barra `home` | — | "{x} de {y}" |
| Filtros | Chips | Tocar | Todos · Falta · Já tenho · Na lista de presentes |
| Item | Linha | Tocar no nome | T20 |
| Botão de estado | Botão | Tocar | Alterna Falta → Já tenho → Na lista → Falta. Aviso com "Desfazer". Regras abaixo |

Regras do botão de estado:
- **→ Já tenho**: abre uma folha rápida "Como chegou?" (Comprado · Ganhado + quem deu · Já era nosso) com "Pular". Se "Comprado" e houver preço, gera gasto na categoria da casa. Se completar o cômodo → T55.
- **→ Na lista**: se houver **uma** lista publicada ou em rascunho, adiciona nela; se houver várias, pergunta qual; se não houver, oferece "Criar lista".
- **Na lista → Falta**: se houver reserva ativa, pergunta "Este item tem reserva de {nome}. Tirar da lista mesmo assim?" e avisa o convidado.

### T20 · Item (`Item.dc.html`) — criar e editar
| Elemento | Tipo | Ação | Resultado |
| --- | --- | --- | --- |
| Voltar | Ícone | Tocar | Alterações não salvas → T36 |
| "Excluir" | Botão de texto `error` | Tocar | T35 |
| Foto | Botão | Tocar | "Tirar foto" (T22 em modo foto única) ou "Escolher da galeria" |
| Nome | Campo | — | Obrigatório |
| Cômodo | Seleção | — | Lista de cômodos |
| Fase | Seleção | — | 1ª noite · 1º mês · Com calma |
| Qtd. | Número | — | ≥ 1 |
| Estado | Escolha única | — | Falta · Já tenho · Na lista |
| Como chegou | Escolha única | Só se "Já tenho" | Comprado · Ganhado · Já era nosso |
| Quem deu? | Campo | Só se "Ganhado" | Cria registro em Agradecimentos |
| Preço estimado | Moeda | — | Opcional |
| Link da loja | URL | Colar | Opcional; ao colar, tenta buscar foto e preço da página (pode falhar silenciosamente) |
| Medidas (cm) | 3 números | — | Largura, Profundidade, Altura |
| Checagem de encaixe | Aviso | — | Com medidas e parede/espaço: `success` "Cabe no espaço {x} ({y} cm livres)" ou `error` "Não cabe: {item} tem {a} cm e {parede} tem {b} cm livres" |
| Observação | Campo | — | Opcional |
| "Salvar item" | Botão principal | Tocar | Grava → volta + aviso "Item salvo na {cômodo}"; falha → T48 |

### T21 · Medidas do cômodo (`Medidas.dc.html`)
| Elemento | Tipo | Ação | Resultado |
| --- | --- | --- | --- |
| Largura, Comprimento, Pé-direito (m) | Números decimais | — | Vírgula decimal; 0,5 a 30 m |
| "Enviar foto da planta para sugerir medidas" | Botão | Tocar | Câmera ou galeria → IA lê a planta e sugere medidas de todos os cômodos; o usuário revisa numa lista e confirma "Usar estas medidas" |
| Vista de cima | Desenho | — | Retângulo em escala com os móveis que têm medidas; móvel que não cabe em `error` |
| "% ocupado" | Barra | — | Soma das áreas dos móveis / área do cômodo |
| Alerta de encaixe | Aviso `error` | — | Para cada item cuja largura > parede destino |
| "Paredes livres" | Lista | "+ Adicionar" / tocar | Nome e largura livre; arrastar para excluir |
| Salvamento | Automático | — | Cada campo salva ao sair (sem botão) |

### T22 · Cadastrar por foto (`FotoCadastro.dc.html`)
| Elemento | Tipo | Ação | Resultado |
| --- | --- | --- | --- |
| Fechar (X) | Ícone | Tocar | Volta. Se houver itens salvos, aviso "{n} itens cadastrados" |
| Contador | Texto | — | "{n} salvos" |
| Modos | Chips | Tocar | Item · Nota fiscal · Print (de loja) |
| Galeria | Botão | Tocar | Escolher imagem |
| Obturador | Botão | Tocar | Envia a foto para a IA (mostra "Lendo a foto…") |
| "Em série" | Caixa de seleção | — | Ligado: após salvar, volta à câmera para a próxima |
| Folha de resultado | Folha inferior | — | Campos reconhecidos e editáveis: Item, Cômodo, Cor, Marca, Medidas (quando houver); modo Nota fiscal: valor e itens; modo Print: nome, preço e link |
| Como chegou? | Escolha única | — | Comprado · Ganhado (+ "Quem deu?") · Já era nosso |
| "Refazer" | Botão contornado | Tocar | Descarta e volta à câmera |
| "Salvar e próxima" / "Salvar" | Botão principal | Tocar | Se existir item parecido no enxoval ("Jogo de panelas"), **atualiza esse item** para Já tenho; senão cria item novo. Nota fiscal gera gasto |

Erros: não reconhecido → T49; câmera negada → T50; sem internet → T47.

---

## 9. Presentes

### T23 · Presentes (`Presentes.dc.html`)
| Elemento | Tipo | Ação | Resultado |
| --- | --- | --- | --- |
| "+ Nova lista" | Botão | Tocar | Folha **Nova lista**: Ocasião (Chá de panela · Chá de cozinha · Chá bar · Casamento), Data do evento, Endereço do link (`{slug}/{slug_lista}`, validar único) → "Criar e escolher itens" → T24 |
| Resumo | 3 números | — | Reservados · Recebidos · Ainda faltam (somando todas as listas) |
| Cartão de lista | Cartão | — | Nome, data, selo Publicada/Rascunho, barra "{x} de {y} reservados" |
| "Gerenciar" | Botão | Tocar | T24 |
| "Ver como convidado" | Botão (lista publicada) | Tocar | T65 (folha de compartilhar, com "Ver como convidado") |
| "Publicar link" | Botão (rascunho) | Tocar | T39 |
| "Agradecimentos" | Cartão | Tocar | T27. Mostra "{n} presentes ainda sem agradecimento" |

- Vazio: T60.

### T24 · Lista: itens e reservas (`ListaPresentes.dc.html`)
| Elemento | Tipo | Ação | Resultado |
| --- | --- | --- | --- |
| Voltar | Ícone | Tocar | T23 |
| "Ver como convidado" | Link | Tocar | Abre T25 desta lista no navegador interno |
| "…" (menu) | Ação | Tocar | "Editar lista" (ocasião, data, endereço do link, endereço de entrega), "Despublicar" (confirmação; o link passa a mostrar T52), "Excluir lista" (confirmação; reservas ativas são canceladas e convidados com WhatsApp são avisados) |
| Título e resumo | Texto | — | "{ocasião}", data, "{x} de {y} reservados" |
| "Compartilhar" | Botão `whatsapp` | Tocar | T65 |
| "Copiar link" | Botão | Tocar | Copia; aviso "Link copiado" |
| "Modo surpresa" | Interruptor | Alternar | Esconde do casal **quem** reservou até o dia do evento (mostra só "Reservado") |
| Abas | Segmentado | Tocar | Todos · Reservados · Recebidos |
| Item | Linha | — | Disponível: "{n} de {q} reservados"; reservado: "Reservado por {nome}" (ou "Reservado" no modo surpresa); recebido: "Presente de {nome}" |
| "Recebido" | Botão | Tocar | Reserva → `recebida`; item → `ja_tenho` com origem `ganhado` e quem_deu; cria Agradecimento; sai da página pública. Aviso com "Desfazer" |
| Arrastar item para a esquerda | Gesto | — | "Tirar da lista" (se tiver reserva, pede confirmação) |
| "+ Adicionar itens do enxoval" | Botão principal | Tocar | Abre a seleção de itens: todos os cômodos, só itens em "Falta", seleção múltipla com quantidade → "Adicionar {n} itens". Também permite "Item avulso" (nome, foto, preço, link, quantidade) |

### T65 · Compartilhar lista (`SheetCompartilhar.dc.html`)
Folha inferior:
| Elemento | Ação | Resultado |
| --- | --- | --- |
| Link da lista + "Copiar" | Tocar | Copia; aviso "Link copiado" (T54) |
| WhatsApp | Tocar | Abre o WhatsApp com mensagem pronta: "Oi! Fizemos nossa lista de presentes do {ocasião}. Escolha um presente e reserve aqui: {link}" |
| Instagram | Tocar | Compartilhamento nativo para stories com imagem gerada (nomes, ocasião, data, QR code) |
| E-mail | Tocar | Abre o e-mail com assunto e corpo prontos |
| QR code | Tocar | Mostra o QR code em tela cheia com "Salvar imagem" |
| Mais | Tocar | Folha de compartilhamento do sistema |
| "Ver como convidado" | Tocar | T25 |

### T27 · Agradecimentos (`Agradecimentos.dc.html`)
| Elemento | Tipo | Ação | Resultado |
| --- | --- | --- | --- |
| Contador | Texto | — | "{n} de {total} ainda sem agradecimento" |
| Modelo de mensagem | Cartão | "Editar modelo" | Editor do texto com variáveis `[nome]` e `[presente]`; salva no casal |
| Pessoa | Linha | — | Iniciais, nome, "{presente} · {ocasião}" |
| "Agradecer" | Botão `whatsapp` | Tocar | Abre o WhatsApp do convidado (se tiver número) com o modelo preenchido; senão, compartilhamento do sistema. Marca como agradecido |
| "Agradecido" | Selo-botão | Tocar | Desmarca (volta a pendente) |
| "+ Registrar presente" (menu) | Ação | Tocar | Presente recebido fora da lista: nome, presente, item do enxoval vinculado (opcional) |

---

## 10. Web do convidado (sem login)

Rotas públicas (navegador). Não usam a barra do app. Cabeçalho com a marca e rodapé "Lista feita com Lartiê" (link para a página do app).

### T25 · Página pública da lista (`PaginaConvidado.dc.html`) — `lartie.app/{slug}/{slug_lista}`
| Elemento | Tipo | Ação | Resultado |
| --- | --- | --- | --- |
| Cabeçalho | Bloco | — | Avatares, ocasião, "Ana & Pedro", data, mensagem do casal |
| "Ainda faltam {n} presentes" | Título | — | Conta só itens com quantidade disponível |
| Cômodos | Chips | Tocar | Todos + cômodos que têm itens na lista |
| Cartão do presente | Cartão | — | Foto, nome, "{cômodo} · faltam {n}" |
| "Reservar" | Botão | Tocar | T26 |

Regras: itens totalmente reservados ou recebidos **não aparecem**. Lista despublicada, excluída ou inexistente → T52. Página carrega em menos de 2 s no celular. Atualiza a disponibilidade ao voltar para a página.

### T26 · Reservar presente (`Reservar.dc.html`)
Estado 1 — formulário:
| Elemento | Tipo | Regras |
| --- | --- | --- |
| Foto, nome, cômodo, preço de referência | Exibição | — |
| "Ver sugestão na loja" | Link | Só se houver link; abre em nova aba |
| "Quantos você vai dar? (faltam n)" | Contador | 1 a n |
| Seu nome | Campo | Obrigatório |
| WhatsApp (opcional) | Telefone | "Para lembrarmos você antes da reserva expirar." |
| Mensagem para o casal | Texto | Opcional, até 300 caracteres |
| "Reservar presente" | Botão principal | Cria a reserva de forma atômica (Seção 13.5) |

Estado 2 — confirmado: "Reservado!", "{n} {item} ficam reservados para você por 15 dias. {nomes} vão adorar."; bloco **Entrega** com o endereço (só se o casal cadastrou); **"Desfazer reserva"** → T40; **"Voltar para a lista"** → T25. O navegador guarda o `token_gerenciar` para o convidado desfazer depois; o mesmo link vai no WhatsApp de confirmação (se informado).

Erros: quantidade esgotada no momento de salvar → T51; sem internet → mensagem de tentar de novo.

### T30 · Confirmação de presença (`RsvpConvidado.dc.html`) — `lartie.app/{slug}/rsvp/{token}`
| Elemento | Tipo | Regras |
| --- | --- | --- |
| Cabeçalho | Bloco | "Vocês estão convidados", nomes, data, horário, local |
| Grupo e prazo | Texto | "{grupo}", "Confirme até {rsvp_prazo}" |
| Pessoa | Cartão | Nome; botões "Vou" / "Não vou" (escolha única); se "Vou", seleção de restrição alimentar (Sem restrição · Vegetariano · Vegano · Sem glúten · Sem lactose · Outra + campo) |
| Recado para os noivos | Texto | Opcional |
| "Enviar confirmação" | Botão principal | Exige resposta para todas as pessoas |
| Estado enviado | Tela | "Presença confirmada", "{x} de {y} pessoas vão.", "Você pode mudar a resposta por este mesmo link até o prazo.", **"Ver lista de presentes"** (lista do casamento, se publicada) e **"Alterar resposta"** |

Regras: depois do prazo, o link mostra as respostas em modo leitura com "O prazo terminou. Fale direto com os noivos.". Cada resposta gera notificação para o casal.

---

## 11. Assistente, notificações e perfil

### T31 · Assistente "Lu" (`Assistente.dc.html`)
| Elemento | Tipo | Ação | Resultado |
| --- | --- | --- | --- |
| Voltar | Ícone | Tocar | Tela anterior |
| Cabeçalho | Texto | — | "Lu · Assistente · conversa compartilhada com {parceiro}" |
| Mensagens | Balões | — | Usuário à direita (`primary`), assistente à esquerda (`surface`). Histórico infinito com rolagem |
| Cartão de confirmação | Cartão | — | Lista as alterações propostas. **"Confirmar"** executa tudo e responde "Pronto, tudo registrado."; **"Cancelar"** responde "Tudo bem, não alterei nada." |
| Sugestões | Chips | Tocar | Envia a pergunta. Sugestões mudam conforme o contexto (ex.: "O que falta pra cozinha?", "Quem não confirmou?", "Quanto já gastamos?", "O rack de 1,80 m cabe na sala?") |
| Câmera | Botão | Tocar | Anexar foto (câmera/galeria). A assistente reconhece e propõe cadastrar |
| Campo de mensagem | Texto | — | "Pergunte ou conte o que aconteceu" |
| Enviar | Botão | Tocar | Envia; mostra "digitando…" |

Capacidades (intenções) da assistente — Seção 14.

### T32 · Notificações (`Notificacoes.dc.html`)
| Elemento | Tipo | Ação | Resultado |
| --- | --- | --- | --- |
| Voltar | Ícone | Tocar | T12 |
| "Marcar todas como lidas" | Botão de texto | Tocar | Marca todas; o ponto do sino some |
| Notificação | Linha | Tocar | Marca como lida e abre o destino (tarefa, orçamento, lista, convidados, cômodo) |
| Ponto colorido | Indicador | — | Não lida: cor do tipo (atraso `error`, parcela `warning`, reserva `info`, casa/RSVP `home`); lida: neutro |

- Agrupar por "Hoje", "Ontem", "Esta semana", "Mais antigas". Guardar 90 dias. Vazio: T63.

### T33 · Perfil (`Perfil.dc.html`)
| Seção | Item | Ação / Resultado |
| --- | --- | --- |
| Casal | Cartão | Tocar → editar nomes e foto do casal |
| Nosso plano | Modo do app | Mostra o modo atual ("Casamento e casa", "Só casamento", "Só casa nova" ou "A definir") → T33b |
| | Dados do casamento | Formulário igual ao T07 (data, cidade, estilo, convidados, orçamento). Mudar a data **recalcula prazos sugeridos** de tarefas não editadas manualmente |
| | Dados da casa nova | Formulário igual ao T08. Mudanças **não apagam** itens; podem sugerir novos itens/cômodos (perguntar antes) |
| | Parceiro(a) | Conectado: mostra nome e "Remover do plano" (T43). Não conectado: T11 |
| Conta | Meus dados e senha | Nome, e-mail (reconfirmação por e-mail), trocar senha (senha atual + nova) |
| | Assinatura | Plano atual (a definir) |
| Ajuda | Central de ajuda | Abre página de ajuda |
| | Termos e privacidade | Abre páginas legais |
| Lembretes | 4 interruptores | Tarefas perto do prazo · Parcelas a vencer · Novas reservas de presentes · Respostas de RSVP (por usuário) |
| | Horário de silêncio | Seletor de início e fim (padrão 22h às 8h) |
| — | "Sair da conta" | T41 |
| — | "Excluir conta e dados" | T42 |
| — | Versão | "Lartiê · versão {x}" |

- "Dados do casamento" só aparece com o módulo casamento ativo; "Dados da casa nova", só com o módulo casa ativo.

### T33b · Modo do app (`ConfigModo.dc.html`)
| Elemento | Tipo | Ação | Resultado |
| --- | --- | --- | --- |
| Voltar | Ícone | Tocar | T33 (sem mudança pendente) |
| Título e texto | Texto | — | "Modo do app" · "Escolham o que aparece na tela inicial e no menu. Vale para os dois." |
| Opções | 3 cartões rádio (iguais ao T06b, versão compacta) | Tocar | Seleciona. O modo atual vem marcado. No modo `indefinido`, nenhum vem marcado e aparece no topo o aviso "Vocês ainda não escolheram um modo." |
| Caixa informativa | Texto | — | "**Nada é apagado.** O que vocês esconderem fica guardado e volta igual quando reativarem." · "{parceiro} recebe um aviso quando o modo mudar." |
| "Salvar modo" | Botão principal | Tocar | Desativado enquanto a seleção for igual ao modo atual. Ativo → abre a folha de confirmação |
| Folha de confirmação | Folha inferior | — | Título "Mudar para "{modo}"?" · "O menu vai mostrar: {abas}." · texto do que fica guardado (ex.: "O checklist, o orçamento e os convidados ficam guardados.") |
| "Mudar modo" | Botão da folha | Tocar | Aplica o novo modo. Se o módulo ativado **nunca foi gerado**, abre antes os dados que faltam (T07 e/ou T08 + T09) e gera o módulo; se já foi gerado, só reexibe. Depois: aviso "Modo atualizado. O menu já mudou para vocês dois." e notifica o parceiro |
| "Cancelar" | Botão de texto da folha | Tocar | Fecha a folha sem mudar |

- Voltar com seleção diferente da atual: T36 ("Descartar as alterações?").
- A mudança vale para o casal inteiro (não é preferência por usuário) e chega ao parceiro em até 2 s, trocando a tela inicial e o menu dele. Se o parceiro estiver numa tela de módulo que ficou oculto, ele volta para a nova tela inicial com o aviso "{nome} mudou o modo do app."

---

## 12. Notificações (catálogo)

Todas respeitam as preferências do usuário e o horário de silêncio (se cair no silêncio, envia às 8h). Cada uma vira um registro em T32 e, se permitido, push.

| Tipo | Gatilho | Texto | Destino | Preferência |
| --- | --- | --- | --- | --- |
| Tarefa perto do prazo | 3 dias antes do prazo, se `lembrete_ativo` | "A tarefa '{t}' vence em 3 dias." | T14 | tarefas |
| Tarefa atrasada | Dia seguinte ao prazo, 9h, e depois a cada 7 dias | "A tarefa '{t}' está atrasada há {n} dias." | T14 | tarefas |
| Parcela a vencer | 3 dias antes do vencimento | "Parcela do {fornecedor} vence em 3 dias: R$ {v}." | T15 | parcelas |
| Nova reserva | Reserva criada | "{nome} reservou {item} no {ocasião}." (modo surpresa: "Alguém reservou {item}.") | T24 | reservas |
| Reserva expirando | 2 dias antes de expirar | "A reserva de {nome} expira em 2 dias." | T24 | reservas |
| RSVP respondido | Grupo respondeu | "{grupo} confirmou presença: {x} de {y} pessoas." | T28 | rsvp |
| Alteração do parceiro | Parceiro marcou item/tarefa (agrupado a cada 30 min) | "{nome} marcou '{item}' como Já tenho." | destino | tarefas |
| Cômodo completo | Último item marcado | "{cômodo} completo!" | T18 | — |
| Orçamento estourado | Categoria passa do planejado | "{categoria} passou R$ {d} do planejado." | T15 | parcelas |
| Parceiro entrou | Convite aceito | "{nome} entrou no plano de vocês." | Tela inicial do modo | — |
| Modo alterado | Parceiro trocou o modo em T33b | "{nome} mudou o app para "{modo}"." | Tela inicial do novo modo | — |
| Escolher por onde começar | 3 dias após o cadastro com modo `indefinido` (uma única vez) | "Por onde vocês querem começar? Casamento, casa nova ou os dois." | T12d | tarefas |

- Notificações de módulos ocultos **não são enviadas** (ex.: no modo `casa`, nada de tarefas, parcelas ou RSVP). Os registros continuam sendo calculados e voltam a notificar quando o módulo for reativado, sem enviar atrasados acumulados.

Mensagens para **convidados** (WhatsApp, só quando o casal envia ou o convidado informou número):
- Convite de RSVP e lembrete de RSVP (disparados pelo casal em T29/T38).
- Confirmação de reserva com link para desfazer.
- Lembrete 2 dias antes da reserva expirar.
- Aviso de reserva cancelada pelo casal (item removido ou lista excluída).

---

## 13. Regras de negócio e cálculos

### 13.1 Geração do checklist
- Fases e janela (meses antes do casamento): Decisões iniciais 12 · Fornecedores principais 10 a 8 · Detalhes 7 a 4 · Documentos e reta final 3 a 1 · Semana do casamento (últimos 7 dias).
- Prazo sugerido de cada tarefa = data do casamento − deslocamento da tarefa (catálogo de tarefas no backend, com deslocamento em dias, fase, estilos em que se aplica e se exige igreja/religioso).
- Casamento com menos tempo do que a fase: prazos vencidos são distribuídos até hoje + 7 dias, sem criar atrasos no primeiro dia.
- Sem data: prazos ficam nulos e a lista mostra só a ordem das fases; ao definir a data, os prazos são calculados.
- Estilo filtra tarefas (ex.: "Só civil" remove tarefas de igreja; "Destination" adiciona viagem dos convidados).

### 13.2 Geração do enxoval
- Cômodos padrão: Cozinha, Quarto (um por quarto: "Quarto", "Quarto 2"…), Banheiro (um por banheiro), Sala, Lavanderia, Limpeza e organização, Pets (se tiver pets).
- Catálogo de itens no backend com: cômodo, fase, quantidade base para 2 moradores, regra de escala por morador, filtro de clima (frio: edredom, aquecedor; quente: ventilador, ar-condicionado), filtro de mobiliado.
- Quantidade = arredondar(base × moradores / 2) para itens por pessoa (toalhas, pratos, copos, talheres); itens únicos não escalam.
- Clima: classificar a cidade em frio/temperado/quente (tabela por UF/cidade no backend).

### 13.3 Progresso
- Casamento: tarefas concluídas / tarefas não ocultas.
- Casa: itens `ja_tenho` / itens totais (respeitando o filtro de fase quando houver).
- Fase completa → T56 (uma vez por fase). Cômodo completo → T55 (uma vez por cômodo, refaz se reabrir).

### 13.4 Orçamento
- Categorias padrão do casamento e % sugerido do total: Local e buffet 45 · Fotografia e vídeo 12 · Decoração e flores 10 · Música 7 · Roupas e beleza 10 · Convites e papelaria 3 · Lua de mel 10 · Imprevistos 3.
- Categorias padrão da casa: Móveis · Eletrodomésticos · Enxoval · Decoração (sem % sugerido; planejado começa vazio).
- Gasto da categoria = soma dos valores de fornecedores **fechados** da categoria + gastos avulsos + itens marcados como "Comprado" com preço (casa).
- Percentual usado = gasto total / planejado total. Saldo = planejado − gasto.
- Estouro: gasto > planejado na categoria → alerta e barra `error`.
- Estimativa do buffet = valor por pessoa × convidados confirmados (só exibição).

### 13.5 Reservas
- Disponível = quantidade_na_lista − soma das reservas `ativa` e `recebida`.
- Criação da reserva é **atômica**: se a quantidade pedida for maior que a disponível no momento, recusar e mostrar T51. Dois convidados nunca podem reservar a última unidade.
- Expira em 15 dias sem ser marcada como recebida. Expirada → volta a ficar disponível; notifica o casal.
- Convidado pode desfazer pelo `token_gerenciar` (T40). Casal pode cancelar uma reserva no detalhe do item (confirmação; avisa o convidado).
- "Recebido" move o item para `ja_tenho` e cria agradecimento.

### 13.6 RSVP
- Status do grupo: todos "vai" = Confirmado; todos "não vai" = Não vão; misto = Parcial x/y; nenhuma resposta = Sem resposta.
- Lembrete em lote (T38): só grupos "Sem resposta" com WhatsApp; no máximo 1 lembrete por grupo a cada 3 dias. Grupos sem WhatsApp são listados para envio manual.

### 13.7 Parceiro
- Convite expira em 7 dias (T53). Só um parceiro por casal. Remover o parceiro (T43) apaga o acesso dele, não os dados.

### 13.8 Exclusões
- Excluir tarefa, item, fornecedor, grupo, lista: exclusão definitiva no MVP, sempre com confirmação.
- Excluir conta (T42): apaga todos os dados do casal em até 30 dias, encerra sessões dos dois usuários e despublica links. Exige digitar "EXCLUIR".

### 13.9 Modo do app
**Valores:** `casamento`, `casa`, `os_dois`, `indefinido` (campo `casal.modo_app`).

**O que cada modo mostra**

| Módulo / tela | `os_dois` | `casamento` | `casa` | `indefinido` |
| --- | --- | --- | --- | --- |
| Tela inicial | T12 | T12b | T12c | T12d |
| Checklist, tarefas (T13, T14) | sim | sim | não | não |
| Orçamento (T15) | casamento + casa | só categorias do casamento | só categorias da casa, acessado por T18 › "Orçamento da casa" | não |
| Fornecedores (T16, T17) | sim | sim | não | não |
| Convidados e RSVP (T28 a T30) | sim | sim (com aba própria) | não | não |
| Casa, cômodos, itens, medidas, foto (T18 a T22) | sim | não | sim | não |
| Presentes (T23 a T27, T65) | sim | sim | sim | sim |
| Assistente (T31) | sim | sim, só casamento | sim, só casa | sim, ajuda a escolher |
| Perfil, notificações | sim | sim | sim | sim |

**Regras**
1. **Nada é apagado na troca.** Esconder um módulo só oculta telas, atalhos, notificações e cálculos visíveis. Ao reativar, tudo volta como estava.
2. **Gerar só uma vez.** Ao ativar um módulo pela primeira vez (`modulos_gerados` falso), o app pede só os dados que faltam (casamento: T07; casa: T08 + T09) e gera o conteúdo (13.1, 13.2). Se já foi gerado, apenas reexibe.
3. **Quem pode mudar:** qualquer um dos dois usuários, em T33b ou pelos cartões "Vão montar a casa nova também?" (T12b), "Vão casar também?" (T12c) e "Começar pelo…" (T12d). A troca vale para o casal e notifica o outro (Seção 12).
4. **Lista de presentes por modo:** ocasiões disponíveis ao criar lista: `casamento` → chá de panela, chá bar, casamento · `casa` → chá de panela, chá de cozinha, chá bar · `os_dois` e `indefinido` → todas. Listas já criadas continuam publicadas mesmo se a ocasião não estiver mais disponível.
5. **Progresso e atalhos** só contam módulos ativos (ex.: o percentual de orçamento usado no T12b considera só categorias do casamento).
6. **Deep links e notificações antigas** para telas de módulos ocultos abrem a tela inicial com a folha "Ativar {módulo}?" ("{Módulo} está desativado no momento. Querem ativar?") · Agora não / Ativar (segue a regra 2).
7. **Assistente:** no modo `casa`, perguntas de casamento recebem "O casamento está desativado no app. Querem ativar?" com cartão de confirmação para trocar o modo. No modo `indefinido`, a Lu pode sugerir um modo a partir da conversa, sempre com confirmação.
8. **Offline:** a troca de modo exige conexão (gera conteúdo e sincroniza o casal). Sem internet → T47.
9. **Analytics:** registrar `modo_escolhido` no onboarding (incluindo "decidir depois") e `modo_alterado` (de → para, origem: perfil, cartão, assistente).

---

## 14. Assistente de IA — capacidades

Regras:
- Responde só sobre casamento, casa nova, mudança e o uso do app. Fora disso: "Posso ajudar com o casamento, a casa nova e a mudança de vocês."
- **Toda alteração de dados passa pelo cartão de confirmação.** Nada é gravado sem "Confirmar".
- Usa os dados do casal (leitura) e as mesmas regras de negócio do app (escrita).
- Lembretes proativos: aparecem como primeira mensagem do dia quando há algo importante (atraso, parcela, reserva expirando).
- Respeita o modo do app (Seção 13.9, regra 7): não consulta nem altera módulos ocultos sem antes propor a troca de modo.

| Intenção | Exemplo do usuário | O que a assistente faz |
| --- | --- | --- |
| Consultar faltantes | "O que falta pra cozinha?" | Lista itens em Falta por fase; oferece pôr na lista de presentes |
| Registrar presente | "Ganhamos um jogo de panelas da tia Bia" | Propõe: item → Já tenho, origem ganhado, quem deu, agradecimento |
| Registrar compra | "Compramos a geladeira por 3.200" | Propõe: item → Já tenho, comprado, gasto na categoria |
| Fechar fornecedor | "Fechamos o fotógrafo por 7.800 em 6x" | Propõe: status fechado, valor, parcelas, tarefa concluída |
| Consultar orçamento | "Quanto já gastamos com a festa?" | Responde planejado × gasto × saldo e estouros |
| Consultar convidados | "Quem ainda não confirmou?" | Lista grupos sem resposta; oferece lembrete (T38) |
| Checar medidas | "Esse rack de 1,80 m cabe na sala?" | Compara com paredes livres e responde; sem medidas, pede para cadastrar (T21) |
| Criar tarefa | "Lembra a gente de marcar a prova do vestido em dezembro" | Propõe tarefa com fase, prazo e responsável |
| Cadastro por foto | Foto enviada no chat | Reconhece e propõe cadastro como T22 |
| Trocar o modo do app | "Vamos usar só para a casa" / "Agora vamos casar também!" | Propõe a troca com cartão (modo atual → novo, abas que vão aparecer, o que fica guardado). Ao confirmar, segue as regras de T33b |

---

## 15. Modais de confirmação (T34 a T43)

Padrão: diálogo centralizado sobre véu `scrim`, ícone opcional, título, texto, botões lado a lado (ou empilhados se o texto for longo). Botão da esquerda cancela (tonal); o da direita confirma (cor da ação). Tocar fora ou voltar = cancelar. Leitores de tela anunciam como alerta.

| ID | Protótipo | Aberto por | Título | Botões e resultado |
| --- | --- | --- | --- | --- |
| T34 | ConfExcluirTarefa | T14 "Excluir tarefa", T13 gesto | "Excluir esta tarefa?" | Cancelar → fecha · **Excluir** (`error`) → exclui, volta a T13, aviso "Tarefa excluída" |
| T35 | ConfExcluirItem | T20 "Excluir" | "Excluir '{item}'?" | Cancelar · **Excluir** → exclui, cancela reservas (avisa convidados), volta a T19 |
| T36 | ConfDescartar | Voltar com alterações em T14, T17, T20, T29, edição de perfil | "Descartar as alterações?" | Continuar editando · **Descartar** → volta sem salvar |
| T37 | ConfFecharFornecedor | T17 status "Fechado" ou botão | "Marcar {fornecedor} como fechado?" | Cancelar · **Confirmar** → status fechado, gasto, parcelas, conclui tarefa vinculada |
| T38 | ConfLembretes | T28 "Lembrar pendentes" | "Lembrar {n} pessoas?" | Cancelar · **Enviar** (`whatsapp`) → envia em sequência (abre o WhatsApp grupo a grupo, ou envio pelo serviço de mensagens se integrado); aviso de resultado |
| T39 | ConfPublicarLista | T23 "Publicar link" | "Publicar a lista do {ocasião}?" | Cancelar · **Publicar** → status publicada → T65 |
| T40 | ConfDesfazerReserva | T26 "Desfazer reserva" (convidado) | "Desfazer a reserva?" | Manter · **Desfazer** → reserva cancelada, volta a T25 |
| T41 | ConfSair | T33 "Sair da conta" | "Sair da conta?" | Cancelar · **Sair** → encerra sessão, limpa cache → T02 |
| T42 | ConfExcluirConta | T33 "Excluir conta e dados" | "Excluir a conta e todos os dados?" | Campo "Digite EXCLUIR"; **Excluir tudo** só ativo com o texto exato → exclui (13.8) → T02 |
| T43 | ConfRemoverParceiro | T33 Parceiro(a) | "Remover {nome} do plano?" | Cancelar · **Remover** → revoga acesso, notifica o parceiro |

Confirmações menores (mesmo padrão, sem protótipo próprio): excluir fornecedor, excluir grupo, excluir lista, despublicar lista, excluir cômodo, tirar item com reserva da lista, cancelar reserva pelo casal, excluir gasto avulso, marcar parcela paga.

---

## 16. Erros (T44 a T53)

| ID | Protótipo | Quando | Comportamento |
| --- | --- | --- | --- |
| T44 | ErroLogin | Credenciais inválidas | Aviso no topo + campo senha em erro; mantém o e-mail |
| T45 | ErroCadastro | E-mail existente / senha curta | Erros por campo + link "Entrar com este e-mail" |
| T46 | ErroOnboarding | Campo obrigatório ou inválido no onboarding | Erros por campo; foco no primeiro campo com erro |
| T47 | ErroSemConexao | Ação que exige servidor sem internet | Tela/estado "Sem conexão com a internet" com "Tentar de novo" e "Continuar sem internet" (quando a tela tem cache) |
| T48 | ErroSalvar | Falha do servidor ao gravar | Diálogo "Não foi possível salvar" · Agora não (mantém o formulário) · Tentar de novo |
| T49 | ErroFoto | IA não reconheceu a foto | Folha "Não reconhecemos este item" · Tirar outra foto · Cadastrar à mão (T20 com a foto anexada) |
| T50 | ErroCamera | Permissão de câmera negada | Diálogo "Sem acesso à câmera" · Agora não · Abrir Ajustes (abre os ajustes do app no sistema) |
| T51 | ErroReservaIndisponivel | Convidado tentou reservar o que acabou | Diálogo "Alguém reservou antes" · Ver outros presentes (T25 atualizada) |
| T52 | ErroLinkInvalido | Link de lista despublicada/excluída/inexistente | Página "Este link não está mais ativo" · Conhecer o Lartiê |
| T53 | ErroConvite | Convite de parceiro expirado ou já usado | Tela "Este convite expirou" · Entendi |

Mensagens genéricas: erro inesperado "Algo deu errado. Tente de novo em instantes."; sessão expirada → volta a T04 com "Sua sessão expirou. Entre de novo.".

---

## 17. Avisos, celebrações, permissões e estados (T54 a T67)

| ID | Protótipo | Uso |
| --- | --- | --- |
| T54 | Toasts | Avisos rápidos: neutro ("Tarefa concluída" + Desfazer; "Link copiado"), sucesso ("Item salvo na Cozinha"), erro ("Não foi possível enviar o lembrete" + Tentar de novo) |
| T55 | Celebracao | Cômodo completo: "{cômodo} completo!", "Todos os {n} itens… Faltam {m} cômodos…" · Continuar |
| T56 | CelebracaoFase | Fase do checklist concluída · "Ver próxima fase" (rola T13 até a fase seguinte) |
| T57 | PermNotificacoes | Explicação antes do pedido nativo · "Ativar notificações" / "Agora não" → T12 |
| T58 | PermCamera | Explicação antes do pedido nativo · "Permitir câmera" → pedido → T22 / "Agora não" |
| T59 | PermContatos | Explicação · "Permitir contatos" → seletor / "Adicionar à mão" → T29 |
| T60 | VazioPresentes | Nenhuma lista · "Criar primeira lista" (folha Nova lista) |
| T61 | VazioConvidados | Nenhum grupo · "Importar da agenda" (T59) / "Adicionar grupo" (T29) |
| T62 | VazioFornecedores | Nenhum fornecedor · "Adicionar fornecedor" (T17 novo) |
| T63 | VazioNotificacoes | "Tudo em dia" · "Voltar ao início" |
| T64 | Carregando | Esqueleto da primeira carga de cada tela principal |
| T65 | SheetCompartilhar | Ver Seção 9 |
| T66 | AceitarConvite | Link do parceiro válido · "Aceitar e criar conta" (T03, vincula como noivo_2) / "Já tenho conta" (T04, vincula após login) |
| T67 | AtualizacaoApp | Versão mínima não atendida · "Atualizar agora" (abre a loja). Sem botão de fechar |

---

## 18. Fluxos ponta a ponta (para testes)

1. **Primeiro acesso (os dois):** T01 → T02 → T03 → T06 → T06b (Casamento e casa nova) → T07 → T08 → T09 → T10 → T11 → T57 → T12.
1b. **Só casamento:** T06 → T06b (Só o casamento) → T07 → T10 → T11 → T12b (abas: Início, Casamento, Convidados, Presentes, Perfil).
1c. **Só casa:** T06 → T06b (Só a casa nova) → T08 (com Cidade) → T09 → T10 → T11 → T12c (abas: Início, Casa, Presentes, Perfil).
1d. **Decidir depois:** T06 → T06b → "Decidir depois" → T12d → "Começar pela casa nova" → T08 → T09 → T10 → T12c.
2. **Parceiro entra:** WhatsApp → T66 → T03 → T12 (mesmo plano, notifica o noivo_1).
3. **Concluir tarefa:** T12 → T13 → marcar → aviso + desfazer → (fase completa) T56.
4. **Fechar fornecedor:** T16 → T17 → "Marcar como fechado" → T37 → orçamento (T15) e parcelas atualizados, tarefa concluída.
5. **Montar a casa:** T18 → T19 → item Falta → Já tenho (como chegou) → cômodo completo → T55.
6. **Cadastro por foto:** T18 → T58 → T22 → resultado → salvar → item atualizado em T19.
7. **Lista de presentes:** T23 → Nova lista → T24 → adicionar itens → T39 → T65 → WhatsApp.
8. **Convidado reserva:** link → T25 → T26 → reservado → casal recebe notificação → T24 mostra reserva → "Recebido" → T27 → "Agradecer".
9. **Reserva concorrente:** dois convidados na última unidade → um reserva, o outro vê T51.
10. **RSVP:** T28 → T29 → "Salvar e enviar convite" → convidado abre T30 → confirma → T28 atualiza contagens e estimativa do buffet.
11. **Assistente:** T31 → "Fechamos o fotógrafo por 7.800 em 6x" → cartão → Confirmar → T15/T17 atualizados.
12. **Offline:** desligar internet → marcar itens → religar → dados sincronizados com o parceiro.
13. **Sair e excluir:** T33 → T41 → T02; T33 → T42 → digitar EXCLUIR → T02.
14. **Trocar de modo sem perder dados:** modo `os_dois` com tarefas concluídas → T33b → "Só a casa nova" → confirmar → menu sem Casamento, T12c → T33b → "Casamento e casa nova" → as tarefas voltam exatamente como estavam.
15. **Ativar módulo pela primeira vez:** modo `casa` → T12c "Vão casar também?" → T33b → "Casamento e casa nova" → confirmar → T07 → gera checklist → T12 com os dois progressos.
16. **Parceiro vê a troca:** usuário A troca o modo em T33b → usuário B, numa tela de módulo oculto, volta à nova tela inicial com o aviso "{nome} mudou o modo do app." e recebe a notificação.

---

## 19. Ordem sugerida de implementação

1. Base: autenticação (e-mail, Google, Apple), conta do casal, tempo real, design system (tokens e componentes), navegação, offline.
2. Onboarding (T06–T11, incluindo T06b) com modo do app (13.9) e geração do plano por módulo (13.1, 13.2).
3. Telas iniciais por modo (T12, T12b, T12c, T12d), checklist e tarefa (T13–T14), casa, cômodo e item (T18–T20), progresso e celebrações. Troca de modo (T33b) logo em seguida.
4. Presentes do casal (T23, T24, T27, T65) e web do convidado (T25, T26) com reservas atômicas e expiração.
5. Orçamento, fornecedores e parcelas (T15–T17); convidados, grupos e RSVP (T28–T30).
6. Notificações (Seção 12), perfil (T33) e todos os modais/erros/estados (T34–T67).
7. Assistente de IA (T31), cadastro por foto (T22) e medidas (T21).

---

## 20. Fora do MVP

- **Pix e cotas em dinheiro** na lista de presentes (e saldo/saque do casal).
- Moodboard de decoração, QR code nas caixas da mudança, marketplace de fornecedores.
- Mais de 2 usuários por casal (mães, padrinhos, cerimonialista).
- Montagem de mesas e cronograma do dia do casamento.
- Planos de assinatura e cobrança (o item "Assinatura" no perfil fica como espaço reservado).

---

## 21. Critérios de aceite gerais

- [ ] Todas as 72 telas existem (T01 a T67, mais T06b, T12b, T12c, T12d e T33b) e seguem os protótipos e o design system "Lartiê".
- [ ] O modo do app escolhido no T06b define tela inicial, abas e passos do onboarding conforme a Seção 13.9.
- [ ] "Decidir depois" leva ao T12d sem gerar checklist nem enxoval, e a tela nunca aparece vazia.
- [ ] Trocar de modo em T33b nunca apaga dados; reativar um módulo mostra tudo como estava.
- [ ] Ativar um módulo pela primeira vez pede só os dados que faltam e gera o conteúdo uma única vez.
- [ ] Notificações de módulos ocultos não são enviadas.
- [ ] O ícone do app, a splash e as telas de acesso usam o ícone final do design system.
- [ ] Todo botão desta especificação leva ao destino descrito.
- [ ] Toda exclusão pede confirmação; toda ação rápida tem "Desfazer".
- [ ] Os dois usuários do casal veem as mudanças um do outro em até 2 s.
- [ ] Dois convidados nunca reservam a mesma última unidade.
- [ ] Reservas expiram em 15 dias e voltam a ficar disponíveis.
- [ ] Lembretes respeitam preferências e horário de silêncio.
- [ ] A assistente nunca altera dados sem confirmação.
- [ ] O app funciona offline com sincronização posterior.
- [ ] Contraste, alvos de toque e leitores de tela atendem a Seção 2.3 nos temas claro e escuro.
