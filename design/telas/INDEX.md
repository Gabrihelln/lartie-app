# Índice das telas do Lartiê

Cada tela tem três formatos:

| Pasta | Formato | Para quê |
| --- | --- | --- |
| `png/<grupo>/` | Imagem 780 × 1688 (390 × 844 pt em 2x) | Referência visual. Abra com o leitor de imagens |
| `html/<grupo>/` | HTML estático que abre em qualquer navegador | Conferir medidas, cores e textos exatos (inspecionar elemento). Mostra o estado inicial, sem interação |
| `fonte-dc/` | Fonte original do protótipo (`.dc.html`) | Ver os outros estados e a lógica da tela no bloco `<script>` (`renderVals`). Não abre sozinho: precisa do runtime do canvas, use só como leitura |
| `visao-geral/` | Uma imagem por grupo com todas as telas | Visão rápida de cada etapa |

Observações:
- As imagens foram geradas fora do iPhone: a fonte do sistema aparece como Inter (no app, use SF Pro no iOS e Roboto no Android) e o nome "Lartiê" pode aparecer numa serifa substituta (a fonte certa é Fraunces 500, eixo SOFT 100; o HTML carrega a Fraunces do Google Fonts quando há internet).
- Os dados das telas (nomes, datas, valores, 64 tarefas, 182 itens) são exemplos.
- A barra de status do sistema (hora, bateria) não aparece nos protótipos; o app deve respeitar a área segura.
- Se o protótipo e a especificação discordarem, vale a especificação (`docs/especificacao-funcional.md`).

## Etapa 1 · Acesso e login

| ID | Tela | Estado | Imagem | HTML | Fonte |
| --- | --- | --- | --- | --- | --- |
| T01 | Splash | inicial | [png](png/01-acesso/T01-Main.png) | [html](html/01-acesso/T01-Main.html) | [dc](fonte-dc/Main.dc.html) |
| T02 | Boas-vindas | inicial | [png](png/01-acesso/T02-BoasVindas.png) | [html](html/01-acesso/T02-BoasVindas.html) | [dc](fonte-dc/BoasVindas.dc.html) |
| T03 | Criar conta | inicial | [png](png/01-acesso/T03-CriarConta.png) | [html](html/01-acesso/T03-CriarConta.html) | [dc](fonte-dc/CriarConta.dc.html) |
| T04 | Entrar | inicial | [png](png/01-acesso/T04-Entrar.png) | [html](html/01-acesso/T04-Entrar.html) | [dc](fonte-dc/Entrar.dc.html) |
| T05 | Esqueci a senha | inicial | [png](png/01-acesso/T05-EsqueciSenha.png) | [html](html/01-acesso/T05-EsqueciSenha.html) | [dc](fonte-dc/EsqueciSenha.dc.html) |
| T02 | Boas-vindas | Carrossel, página 2 | [png](png/01-acesso/T02-BoasVindas-pagina-2.png) | [html](html/01-acesso/T02-BoasVindas-pagina-2.html) | [dc](fonte-dc/BoasVindas.dc.html) |
| T02 | Boas-vindas | Carrossel, página 3 | [png](png/01-acesso/T02-BoasVindas-pagina-3.png) | [html](html/01-acesso/T02-BoasVindas-pagina-3.html) | [dc](fonte-dc/BoasVindas.dc.html) |
| T05 | Esqueci a senha | Link enviado | [png](png/01-acesso/T05-EsqueciSenha-enviado.png) | [html](html/01-acesso/T05-EsqueciSenha-enviado.html) | [dc](fonte-dc/EsqueciSenha.dc.html) |

## Etapa 2 · Onboarding

| ID | Tela | Estado | Imagem | HTML | Fonte |
| --- | --- | --- | --- | --- | --- |
| T06 | Onboarding · O casal | inicial | [png](png/02-onboarding/T06-Ob1Casal.png) | [html](html/02-onboarding/T06-Ob1Casal.html) | [dc](fonte-dc/Ob1Casal.dc.html) |
| T06b | Onboarding · O que vão organizar (modo do app) | inicial | [png](png/02-onboarding/T06b-ObUso.png) | [html](html/02-onboarding/T06b-ObUso.html) | [dc](fonte-dc/ObUso.dc.html) |
| T07 | Onboarding · Sobre o casamento | inicial | [png](png/02-onboarding/T07-Ob2Casamento.png) | [html](html/02-onboarding/T07-Ob2Casamento.html) | [dc](fonte-dc/Ob2Casamento.dc.html) |
| T08 | Onboarding · Casa nova | inicial | [png](png/02-onboarding/T08-Ob3Casa.png) | [html](html/02-onboarding/T08-Ob3Casa.html) | [dc](fonte-dc/Ob3Casa.dc.html) |
| T09 | Onboarding · O que vocês já têm | inicial | [png](png/02-onboarding/T09-Ob4Partida.png) | [html](html/02-onboarding/T09-Ob4Partida.html) | [dc](fonte-dc/Ob4Partida.dc.html) |
| T10 | Onboarding · Plano pronto | inicial | [png](png/02-onboarding/T10-ObGerando.png) | [html](html/02-onboarding/T10-ObGerando.html) | [dc](fonte-dc/ObGerando.dc.html) |
| T11 | Onboarding · Convidar parceiro(a) | inicial | [png](png/02-onboarding/T11-ObConvidar.png) | [html](html/02-onboarding/T11-ObConvidar.html) | [dc](fonte-dc/ObConvidar.dc.html) |
| T66 | Convite do parceiro(a) | inicial | [png](png/02-onboarding/T66-AceitarConvite.png) | [html](html/02-onboarding/T66-AceitarConvite.html) | [dc](fonte-dc/AceitarConvite.dc.html) |

## Etapa 3 · Início por modo e Casamento

| ID | Tela | Estado | Imagem | HTML | Fonte |
| --- | --- | --- | --- | --- | --- |
| T12 | Início · Casamento e casa nova | inicial | [png](png/03-inicio-e-casamento/T12-Inicio.png) | [html](html/03-inicio-e-casamento/T12-Inicio.html) | [dc](fonte-dc/Inicio.dc.html) |
| T12b | Início · Só casamento | inicial | [png](png/03-inicio-e-casamento/T12b-InicioCasamento.png) | [html](html/03-inicio-e-casamento/T12b-InicioCasamento.html) | [dc](fonte-dc/InicioCasamento.dc.html) |
| T12c | Início · Só casa nova | inicial | [png](png/03-inicio-e-casamento/T12c-InicioCasa.png) | [html](html/03-inicio-e-casamento/T12c-InicioCasa.html) | [dc](fonte-dc/InicioCasa.dc.html) |
| T12d | Início · Decidir depois | inicial | [png](png/03-inicio-e-casamento/T12d-InicioDepois.png) | [html](html/03-inicio-e-casamento/T12d-InicioDepois.html) | [dc](fonte-dc/InicioDepois.dc.html) |
| T13 | Casamento · Checklist | inicial | [png](png/03-inicio-e-casamento/T13-Checklist.png) | [html](html/03-inicio-e-casamento/T13-Checklist.html) | [dc](fonte-dc/Checklist.dc.html) |
| T14 | Detalhe da tarefa | inicial | [png](png/03-inicio-e-casamento/T14-Tarefa.png) | [html](html/03-inicio-e-casamento/T14-Tarefa.html) | [dc](fonte-dc/Tarefa.dc.html) |
| T15 | Orçamento | inicial | [png](png/03-inicio-e-casamento/T15-Orcamento.png) | [html](html/03-inicio-e-casamento/T15-Orcamento.html) | [dc](fonte-dc/Orcamento.dc.html) |
| T16 | Fornecedores | inicial | [png](png/03-inicio-e-casamento/T16-Fornecedores.png) | [html](html/03-inicio-e-casamento/T16-Fornecedores.html) | [dc](fonte-dc/Fornecedores.dc.html) |
| T17 | Detalhe do fornecedor | inicial | [png](png/03-inicio-e-casamento/T17-Fornecedor.png) | [html](html/03-inicio-e-casamento/T17-Fornecedor.html) | [dc](fonte-dc/Fornecedor.dc.html) |
| T33 | Perfil e configurações | inicial | [png](png/03-inicio-e-casamento/T33-Perfil.png) | [html](html/03-inicio-e-casamento/T33-Perfil.html) | [dc](fonte-dc/Perfil.dc.html) |
| T33b | Perfil · Modo do app | inicial | [png](png/03-inicio-e-casamento/T33b-ConfigModo.png) | [html](html/03-inicio-e-casamento/T33b-ConfigModo.html) | [dc](fonte-dc/ConfigModo.dc.html) |
| T33b | Perfil · Modo do app | Folha de confirmação ao trocar para "Só a casa nova" | [png](png/03-inicio-e-casamento/T33b-ConfigModo-confirmacao.png) | [html](html/03-inicio-e-casamento/T33b-ConfigModo-confirmacao.html) | [dc](fonte-dc/ConfigModo.dc.html) |
| T33b | Perfil · Modo do app | Depois de salvar | [png](png/03-inicio-e-casamento/T33b-ConfigModo-salvo.png) | [html](html/03-inicio-e-casamento/T33b-ConfigModo-salvo.html) | [dc](fonte-dc/ConfigModo.dc.html) |
| T15 | Orçamento | Aba Casa nova | [png](png/03-inicio-e-casamento/T15-Orcamento-casa-nova.png) | [html](html/03-inicio-e-casamento/T15-Orcamento-casa-nova.html) | [dc](fonte-dc/Orcamento.dc.html) |

## Etapa 4 · Casa nova

| ID | Tela | Estado | Imagem | HTML | Fonte |
| --- | --- | --- | --- | --- | --- |
| T18 | Casa · Cômodos | inicial | [png](png/04-casa-nova/T18-Casa.png) | [html](html/04-casa-nova/T18-Casa.html) | [dc](fonte-dc/Casa.dc.html) |
| T19 | Cômodo · Itens | inicial | [png](png/04-casa-nova/T19-Comodo.png) | [html](html/04-casa-nova/T19-Comodo.html) | [dc](fonte-dc/Comodo.dc.html) |
| T20 | Item (adicionar/editar) | inicial | [png](png/04-casa-nova/T20-Item.png) | [html](html/04-casa-nova/T20-Item.html) | [dc](fonte-dc/Item.dc.html) |
| T21 | Medidas do cômodo | inicial | [png](png/04-casa-nova/T21-Medidas.png) | [html](html/04-casa-nova/T21-Medidas.html) | [dc](fonte-dc/Medidas.dc.html) |
| T22 | Cadastro por foto | inicial | [png](png/04-casa-nova/T22-FotoCadastro.png) | [html](html/04-casa-nova/T22-FotoCadastro.html) | [dc](fonte-dc/FotoCadastro.dc.html) |
| T22 | Cadastro por foto | Item reconhecido, revisão antes de salvar | [png](png/04-casa-nova/T22-FotoCadastro-resultado.png) | [html](html/04-casa-nova/T22-FotoCadastro-resultado.html) | [dc](fonte-dc/FotoCadastro.dc.html) |

## Etapa 5 · Presentes e reservas

| ID | Tela | Estado | Imagem | HTML | Fonte |
| --- | --- | --- | --- | --- | --- |
| T23 | Presentes · Listas | inicial | [png](png/05-presentes/T23-Presentes.png) | [html](html/05-presentes/T23-Presentes.html) | [dc](fonte-dc/Presentes.dc.html) |
| T24 | Lista · Itens e reservas | inicial | [png](png/05-presentes/T24-ListaPresentes.png) | [html](html/05-presentes/T24-ListaPresentes.html) | [dc](fonte-dc/ListaPresentes.dc.html) |
| T25 | Página pública da lista (convidado, web) | inicial | [png](png/05-presentes/T25-PaginaConvidado.png) | [html](html/05-presentes/T25-PaginaConvidado.html) | [dc](fonte-dc/PaginaConvidado.dc.html) |
| T26 | Reservar presente (convidado, web) | inicial | [png](png/05-presentes/T26-Reservar.png) | [html](html/05-presentes/T26-Reservar.html) | [dc](fonte-dc/Reservar.dc.html) |
| T27 | Agradecimentos | inicial | [png](png/05-presentes/T27-Agradecimentos.png) | [html](html/05-presentes/T27-Agradecimentos.html) | [dc](fonte-dc/Agradecimentos.dc.html) |
| T65 | Folha · Compartilhar lista | inicial | [png](png/05-presentes/T65-SheetCompartilhar.png) | [html](html/05-presentes/T65-SheetCompartilhar.html) | [dc](fonte-dc/SheetCompartilhar.dc.html) |
| T23 | Presentes · Listas | Folha "Nova lista" | [png](png/05-presentes/T23-Presentes-nova-lista.png) | [html](html/05-presentes/T23-Presentes-nova-lista.html) | [dc](fonte-dc/Presentes.dc.html) |
| T26 | Reservar presente (convidado, web) | Reserva concluída | [png](png/05-presentes/T26-Reservar-reservado.png) | [html](html/05-presentes/T26-Reservar-reservado.html) | [dc](fonte-dc/Reservar.dc.html) |

## Etapa 6 · Convidados e RSVP

| ID | Tela | Estado | Imagem | HTML | Fonte |
| --- | --- | --- | --- | --- | --- |
| T28 | Convidados e RSVP | inicial | [png](png/06-convidados/T28-Convidados.png) | [html](html/06-convidados/T28-Convidados.html) | [dc](fonte-dc/Convidados.dc.html) |
| T29 | Novo grupo de convidados | inicial | [png](png/06-convidados/T29-NovoGrupo.png) | [html](html/06-convidados/T29-NovoGrupo.html) | [dc](fonte-dc/NovoGrupo.dc.html) |
| T30 | Confirmação de presença (convidado, web) | inicial | [png](png/06-convidados/T30-RsvpConvidado.png) | [html](html/06-convidados/T30-RsvpConvidado.html) | [dc](fonte-dc/RsvpConvidado.dc.html) |
| T30 | Confirmação de presença (convidado, web) | Resposta enviada | [png](png/06-convidados/T30-RsvpConvidado-confirmado.png) | [html](html/06-convidados/T30-RsvpConvidado-confirmado.html) | [dc](fonte-dc/RsvpConvidado.dc.html) |

## Etapa 7 · Modais de confirmação

| ID | Tela | Estado | Imagem | HTML | Fonte |
| --- | --- | --- | --- | --- | --- |
| T34 | Confirmar · Excluir tarefa | inicial | [png](png/07-modais-confirmacao/T34-ConfExcluirTarefa.png) | [html](html/07-modais-confirmacao/T34-ConfExcluirTarefa.html) | [dc](fonte-dc/ConfExcluirTarefa.dc.html) |
| T35 | Confirmar · Excluir item | inicial | [png](png/07-modais-confirmacao/T35-ConfExcluirItem.png) | [html](html/07-modais-confirmacao/T35-ConfExcluirItem.html) | [dc](fonte-dc/ConfExcluirItem.dc.html) |
| T36 | Confirmar · Descartar alterações | inicial | [png](png/07-modais-confirmacao/T36-ConfDescartar.png) | [html](html/07-modais-confirmacao/T36-ConfDescartar.html) | [dc](fonte-dc/ConfDescartar.dc.html) |
| T37 | Confirmar · Fornecedor fechado | inicial | [png](png/07-modais-confirmacao/T37-ConfFecharFornecedor.png) | [html](html/07-modais-confirmacao/T37-ConfFecharFornecedor.html) | [dc](fonte-dc/ConfFecharFornecedor.dc.html) |
| T38 | Confirmar · Lembrar convidados | inicial | [png](png/07-modais-confirmacao/T38-ConfLembretes.png) | [html](html/07-modais-confirmacao/T38-ConfLembretes.html) | [dc](fonte-dc/ConfLembretes.dc.html) |
| T39 | Confirmar · Publicar lista | inicial | [png](png/07-modais-confirmacao/T39-ConfPublicarLista.png) | [html](html/07-modais-confirmacao/T39-ConfPublicarLista.html) | [dc](fonte-dc/ConfPublicarLista.dc.html) |
| T40 | Confirmar · Desfazer reserva (convidado) | inicial | [png](png/07-modais-confirmacao/T40-ConfDesfazerReserva.png) | [html](html/07-modais-confirmacao/T40-ConfDesfazerReserva.html) | [dc](fonte-dc/ConfDesfazerReserva.dc.html) |
| T41 | Confirmar · Sair da conta | inicial | [png](png/07-modais-confirmacao/T41-ConfSair.png) | [html](html/07-modais-confirmacao/T41-ConfSair.html) | [dc](fonte-dc/ConfSair.dc.html) |
| T42 | Confirmar · Excluir conta | inicial | [png](png/07-modais-confirmacao/T42-ConfExcluirConta.png) | [html](html/07-modais-confirmacao/T42-ConfExcluirConta.html) | [dc](fonte-dc/ConfExcluirConta.dc.html) |
| T43 | Confirmar · Remover parceiro(a) | inicial | [png](png/07-modais-confirmacao/T43-ConfRemoverParceiro.png) | [html](html/07-modais-confirmacao/T43-ConfRemoverParceiro.html) | [dc](fonte-dc/ConfRemoverParceiro.dc.html) |

## Etapa 8 · Erros, avisos e estados

| ID | Tela | Estado | Imagem | HTML | Fonte |
| --- | --- | --- | --- | --- | --- |
| T44 | Erro · Login | inicial | [png](png/08-erros-avisos-estados/T44-ErroLogin.png) | [html](html/08-erros-avisos-estados/T44-ErroLogin.html) | [dc](fonte-dc/ErroLogin.dc.html) |
| T45 | Erro · E-mail já cadastrado | inicial | [png](png/08-erros-avisos-estados/T45-ErroCadastro.png) | [html](html/08-erros-avisos-estados/T45-ErroCadastro.html) | [dc](fonte-dc/ErroCadastro.dc.html) |
| T46 | Erro · Campo obrigatório | inicial | [png](png/08-erros-avisos-estados/T46-ErroOnboarding.png) | [html](html/08-erros-avisos-estados/T46-ErroOnboarding.html) | [dc](fonte-dc/ErroOnboarding.dc.html) |
| T47 | Erro · Sem conexão | inicial | [png](png/08-erros-avisos-estados/T47-ErroSemConexao.png) | [html](html/08-erros-avisos-estados/T47-ErroSemConexao.html) | [dc](fonte-dc/ErroSemConexao.dc.html) |
| T48 | Erro · Não foi possível salvar | inicial | [png](png/08-erros-avisos-estados/T48-ErroSalvar.png) | [html](html/08-erros-avisos-estados/T48-ErroSalvar.html) | [dc](fonte-dc/ErroSalvar.dc.html) |
| T49 | Erro · Foto não reconhecida | inicial | [png](png/08-erros-avisos-estados/T49-ErroFoto.png) | [html](html/08-erros-avisos-estados/T49-ErroFoto.html) | [dc](fonte-dc/ErroFoto.dc.html) |
| T50 | Erro · Câmera sem permissão | inicial | [png](png/08-erros-avisos-estados/T50-ErroCamera.png) | [html](html/08-erros-avisos-estados/T50-ErroCamera.html) | [dc](fonte-dc/ErroCamera.dc.html) |
| T51 | Erro · Presente já reservado (convidado) | inicial | [png](png/08-erros-avisos-estados/T51-ErroReservaIndisponivel.png) | [html](html/08-erros-avisos-estados/T51-ErroReservaIndisponivel.html) | [dc](fonte-dc/ErroReservaIndisponivel.dc.html) |
| T52 | Erro · Link inativo (convidado) | inicial | [png](png/08-erros-avisos-estados/T52-ErroLinkInvalido.png) | [html](html/08-erros-avisos-estados/T52-ErroLinkInvalido.html) | [dc](fonte-dc/ErroLinkInvalido.dc.html) |
| T53 | Erro · Convite expirado | inicial | [png](png/08-erros-avisos-estados/T53-ErroConvite.png) | [html](html/08-erros-avisos-estados/T53-ErroConvite.html) | [dc](fonte-dc/ErroConvite.dc.html) |
| T54 | Avisos rápidos (toasts) | inicial | [png](png/08-erros-avisos-estados/T54-Toasts.png) | [html](html/08-erros-avisos-estados/T54-Toasts.html) | [dc](fonte-dc/Toasts.dc.html) |
| T55 | Celebração · Cômodo completo | inicial | [png](png/08-erros-avisos-estados/T55-Celebracao.png) | [html](html/08-erros-avisos-estados/T55-Celebracao.html) | [dc](fonte-dc/Celebracao.dc.html) |
| T56 | Celebração · Fase concluída | inicial | [png](png/08-erros-avisos-estados/T56-CelebracaoFase.png) | [html](html/08-erros-avisos-estados/T56-CelebracaoFase.html) | [dc](fonte-dc/CelebracaoFase.dc.html) |
| T57 | Permissão · Notificações | inicial | [png](png/08-erros-avisos-estados/T57-PermNotificacoes.png) | [html](html/08-erros-avisos-estados/T57-PermNotificacoes.html) | [dc](fonte-dc/PermNotificacoes.dc.html) |
| T58 | Permissão · Câmera | inicial | [png](png/08-erros-avisos-estados/T58-PermCamera.png) | [html](html/08-erros-avisos-estados/T58-PermCamera.html) | [dc](fonte-dc/PermCamera.dc.html) |
| T59 | Permissão · Contatos | inicial | [png](png/08-erros-avisos-estados/T59-PermContatos.png) | [html](html/08-erros-avisos-estados/T59-PermContatos.html) | [dc](fonte-dc/PermContatos.dc.html) |
| T60 | Estado vazio · Presentes | inicial | [png](png/08-erros-avisos-estados/T60-VazioPresentes.png) | [html](html/08-erros-avisos-estados/T60-VazioPresentes.html) | [dc](fonte-dc/VazioPresentes.dc.html) |
| T61 | Estado vazio · Convidados | inicial | [png](png/08-erros-avisos-estados/T61-VazioConvidados.png) | [html](html/08-erros-avisos-estados/T61-VazioConvidados.html) | [dc](fonte-dc/VazioConvidados.dc.html) |
| T62 | Estado vazio · Fornecedores | inicial | [png](png/08-erros-avisos-estados/T62-VazioFornecedores.png) | [html](html/08-erros-avisos-estados/T62-VazioFornecedores.html) | [dc](fonte-dc/VazioFornecedores.dc.html) |
| T63 | Estado vazio · Notificações | inicial | [png](png/08-erros-avisos-estados/T63-VazioNotificacoes.png) | [html](html/08-erros-avisos-estados/T63-VazioNotificacoes.html) | [dc](fonte-dc/VazioNotificacoes.dc.html) |
| T64 | Carregando (esqueleto) | inicial | [png](png/08-erros-avisos-estados/T64-Carregando.png) | [html](html/08-erros-avisos-estados/T64-Carregando.html) | [dc](fonte-dc/Carregando.dc.html) |
| T67 | Atualização obrigatória | inicial | [png](png/08-erros-avisos-estados/T67-AtualizacaoApp.png) | [html](html/08-erros-avisos-estados/T67-AtualizacaoApp.html) | [dc](fonte-dc/AtualizacaoApp.dc.html) |

## Etapa 9 · Assistente e notificações

| ID | Tela | Estado | Imagem | HTML | Fonte |
| --- | --- | --- | --- | --- | --- |
| T31 | Assistente Lu | inicial | [png](png/09-assistente-e-notificacoes/T31-Assistente.png) | [html](html/09-assistente-e-notificacoes/T31-Assistente.html) | [dc](fonte-dc/Assistente.dc.html) |
| T32 | Notificações | inicial | [png](png/09-assistente-e-notificacoes/T32-Notificacoes.png) | [html](html/09-assistente-e-notificacoes/T32-Notificacoes.html) | [dc](fonte-dc/Notificacoes.dc.html) |
| T31 | Assistente Lu | Depois de confirmar o cartão | [png](png/09-assistente-e-notificacoes/T31-Assistente-confirmado.png) | [html](html/09-assistente-e-notificacoes/T31-Assistente-confirmado.html) | [dc](fonte-dc/Assistente.dc.html) |
