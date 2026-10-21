# Relatório · Etapa 0 · Fundação

## Resumo

A base do app está pronta e rodando no simulador do iOS: projeto React Native CLI (`com.lartie.app`) com o design system "Lartiê" no código, componentes base, toda a infraestrutura de confirmações, avisos, erros, estados e permissões, modelo de dados da Seção 3 no Firestore com regras de acesso por casal (publicadas em `lartie-dev` e `lartie`), sincronização em tempo real e offline, abas que mudam com o modo do app e um catálogo interno para conferência. Por decisão do dono do produto, esta etapa foi validada só no iOS; o Android fica para depois (configuração escrita, ainda não compilada).

## Como testar

- **Build iOS:** simulador do Xcode (iPhone 17 Pro e 17 Pro Max). Passo a passo em `docs/desenvolvimento.md`: `npm run emuladores`, `npm run semear`, `cd mobile && npm start` e `npm run ios`. Build no iPhone físico e TestFlight: pendentes (ver Perguntas).
- **Build Android:** não gerada nesta etapa (decisão de 20/10/2026: só iOS por enquanto).
- **Contas de teste** (só nos emuladores): `ana@teste.lartie.app` e `pedro@teste.lartie.app`, senha `lartie-teste` · casal `casal-teste-ana-pedro` · modo do app inicial: `os_dois`.
- **Roteiro:**
  1. Entrar como Ana num simulador e como Pedro no outro (tela de acesso provisório).
  2. Início › "Abrir catálogo de componentes".
  3. Conferir componentes, marca, cores, tipografia, diálogos, avisos e estados nos temas Claro e Escuro (chips no topo).
  4. "Somar 1" num aparelho e conferir no outro (até 2 s).
  5. Trocar o modo do app e conferir as abas no outro aparelho.
  6. Desligar o Wi-Fi: aparece "Sem conexão. Suas alterações serão enviadas depois."

**Resultado do teste do dono do produto (20/10/2026):** sincronização, troca de modo e aviso offline funcionando nos dois simuladores.

## Telas

Nenhuma tela do produto pertence a esta etapa. Existem apenas telas de apoio:

| ID | Tela | Status | Observação |
| --- | --- | --- | --- |
| — | Acesso provisório | provisória | Só em desenvolvimento; substituída por T01 a T05 na Etapa 1 |
| T12/T12b/T12c/T12d | Início | provisória | Mostra qual tela inicial o modo usa; real na Etapa 3 |
| T13, T18, T23, T28, T33 | Abas Casamento, Casa, Presentes, Convidados, Perfil | provisórias | Reais nas Etapas 3 a 6 |
| T66 | Convite (deep link `lartie://convite/{codigo}`) | provisória | Real na Etapa 2 |
| T67 | Atualização obrigatória | pronta | Ligada à versão mínima do Remote Config |
| — | Catálogo interno | pronta | Só em desenvolvimento |

## Confirmações, erros e avisos ligados nesta etapa

Componentes prontos para todas as etapas (cada etapa liga os casos das suas telas):

| ID | Componente | Teste automatizado |
| --- | --- | --- |
| T34 a T43 | `Dialogo` (`useDialogo().confirmar`): padrão, destrutivo, WhatsApp, um botão, campo "Digite EXCLUIR" | Manual (catálogo). Os testes de cada confirmação entram com as telas |
| T36 | `useDescartarAlteracoes` | `mobile/__tests__/descartar.test.ts` (textos); fluxo manual no catálogo |
| T44 a T46 | `ErroCampo` / `CampoTexto` com erro | Manual (catálogo) |
| T47 | `TelaSemConexao` e aviso de conexão no topo | Manual (catálogo e Wi-Fi desligado) |
| T48 | `useDialogo().erroAoSalvar` | Manual (catálogo) |
| T54 | `useAvisos()` com fila, 4 s / 5 s com ação, "Desfazer" | Manual (catálogo) |
| T57 a T59 | `ExplicacaoPermissao` | Manual (catálogo) |
| T60 a T63 | `EstadoVazio` | Manual (catálogo) |
| T64 | `Esqueleto` e `EsqueletoLista` | Manual (catálogo) |
| T67 | `AtualizacaoApp` + `versaoAbaixoDe` | `mobile/__tests__/versao.test.ts` |
| 13.9 | Abas, tela inicial e módulos por modo | `packages/regras/src/modoApp.test.ts` (14 testes) |
| Seção 3 | Regras de acesso por casal | `firebase/test/regras.test.ts` (19 testes, emulador) |

Testes automatizados no total: 21 (Vitest, pacotes) + 19 (regras do Firestore) + 4 (Jest, app), todos passando. Rodam no CI (`.github/workflows/ci.yml`).

## Definição de pronto (Seção 0.4)

- [x] Componentes iguais aos protótipos e só com tokens (gerados de `design-system/`, com teste que acusa tokens desatualizados).
- [x] Navegação e abas por modo funcionando.
- [x] Estados de carregando, vazio, erro, sem conexão e sucesso disponíveis como componentes.
- [x] Confirmações, erros e avisos prontos para as próximas etapas.
- [x] Tema claro e escuro (verificados no catálogo).
- [ ] iOS (SF Pro) **e Android (Roboto)**: só iOS verificado. Android adiado por decisão do dono do produto.
- [x] Alvos de toque de 44 pt / 48 dp, rótulos de acessibilidade e fonte grande (até 2×) nos componentes. Revisão com VoiceOver fica para a Etapa 8, como no plano.
- [x] Respeita o modo do app.
- [x] Funciona offline (cache e fila do Firestore; aviso no topo).
- [x] Testes automatizados das regras desta etapa (modo do app, acesso por casal, versão mínima).
- [x] Analytics e Crashlytics configurados (desligados no ambiente demo e em desenvolvimento); eventos `modo_alterado` e registro de telas.

## Divergências da especificação ou do protótipo

1. **Ícones no iOS:** o guia pede SF Symbols no iOS. Nesta etapa os dois sistemas usam Material Symbols Rounded, porque a biblioteca de SF Symbols disponível não funciona na arquitetura nova do React Native 0.86. Cada ícone já tem o nome SF Symbols equivalente em `Icone.tsx`; a troca no iOS não mexe nas telas.
2. **Ícone "Casamento" (alianças):** não existe no Material Symbols; usa o desenho do protótipo (duas alianças).
3. **IA escondida (P14):** o botão flutuante da assistente, a T22/T49 e o item da Lu no T12d ficam atrás da chave `ia_ativa` do Remote Config (desligada). A coleção `mensagens_assistente` está fechada nas regras.
4. **Modelo de dados:** campos e coleções a mais, que a especificação não lista:
   - `casal.onboarding_concluido` (roteamento do T01);
   - `usuario.tokens_push` (aparelhos para o push);
   - `reserva.lista_id` e `reserva.atualizado_em`;
   - os tokens dos links públicos (`token_rsvp`, `token_gerenciar`) saem dos documentos do casal e ficam em `tokens_rsvp/` e `tokens_reserva/`, que só o servidor lê, para que nenhum convidado consiga ler outros dados.
5. **Casal no login:** as regras identificam o casal por um claim `casal_id` do Firebase Auth, gravado pelo servidor, para não gastar leituras da cota gratuita. Na Etapa 1, o cadastro precisa chamar a API da VPS para criar o casal e gravar esse claim.
6. **Valores sem token no protótipo:** raios 14, 10 e 18 (controle segmentado, avisos, opção de modo) são derivados de `radius-md`, `radius-sm` e `radius-lg` + 2. A sombra dos diálogos e avisos usa `shadow-fab` (o protótipo tem uma sombra própria). O título dos estados de tela usa o papel "título de tela" (22/28 no iOS) em vez dos 24/30 do protótipo.
7. **Degradê do onboarding:** o protótipo HTML usa `#E9C1B7` no topo; o app usa o token `brand-petal` (`#EDC9BF`), como manda o guia.
8. **Fonte Fraunces:** o React Native não ajusta eixos de fonte variável; foi gerada uma versão estática (peso 500, SOFT 100, opsz 72) a partir da Fraunces oficial (OFL, sem nome reservado). Resolve a P12.
9. **T67 sem parceiro:** o protótipo cita o parceiro ("…sincronizando com Pedro"). Sem parceiro, o texto fica "Atualize o app para continuar sincronizando. Leva menos de um minuto."
10. **T58:** o texto do protótipo cita a assistente, que está escondida. O texto foi mantido; revisar quando a câmera for usada (Etapa 4).

## Pendências e riscos

- **Android:** configuração escrita (flavors demo/dev/prod, Firebase, ícone adaptativo, fonte, deep link), sem compilar. Risco de ajustes quando for ligado.
- **iPhone físico e TestFlight:** pendentes (ver Perguntas).
- **Firebase via CocoaPods:** o Google avisou que novas versões do Firebase iOS deixam de sair no CocoaPods depois de outubro de 2026. As atuais continuam funcionando; uma migração para Swift Package Manager pode ser necessária mais adiante.
- **Ciclo de vida UIScene:** o iOS avisa que o app vai precisar adotar o `UIScene`. Hoje é só aviso; ajustar antes da Etapa 10.
- **Cota do plano Spark:** 50 mil leituras por dia no Firestore. Basta para o desenvolvimento e os primeiros casais; acompanhar no console.
- **Login nos projetos reais:** só funciona a partir da Etapa 1, quando o cadastro gravar o claim do casal (precisa da API na VPS).
- **Splash nativa e ícone na tela inicial do simulador:** a tela de abertura ainda é a do template (T01 entra na Etapa 1; splash nativa na Etapa 10). No simulador, os ícones da tela inicial apareceram cinza ou brancos, inclusive de outros apps; confirmar no iPhone físico.

## Perguntas para o dono do produto

1. **Conta Apple Developer:** já existe (a do Newzi serve)? Ela é necessária para instalar no iPhone físico, para o TestFlight e para o login com Apple, que é obrigatório no iOS (Etapa 1).
2. **Ícones no iOS:** está de acordo em seguir com Material Symbols por enquanto e trocar por SF Symbols mais adiante (ver Divergência 1)?
3. **Android:** em que etapa vamos ligá-lo? Sugestão: antes da Etapa 5, porque a página do convidado e as reservas precisam ser testadas nos dois sistemas.
4. **Domínio (P13):** a compra do `lartie.app` precisa estar feita até a Etapa 5.

---
Aguardando: `APROVADO ETAPA 0` ou `AJUSTES ETAPA 0: …`
