# Relatório · Etapa 1 · Acesso e login

## Resumo

As telas de acesso T01 a T05 estão prontas no iOS e no Android, com login por e-mail, Google (iOS e Android) e Apple (iOS). Ao entrar pela primeira vez, a API (que vai rodar na VPS) cria o usuário `noivo_1` e o casal vazio e marca a conta com o casal; o app segue a regra de roteamento do T01 (sem sessão → acesso; sessão sem onboarding → onboarding, provisório até a Etapa 2; onboarding completo → tela inicial do modo). Também nesta etapa o Android foi ligado: compila, roda no moto g31 e acompanha o iOS daqui em diante.

## Como testar

- **Build iOS:** simulador do Xcode (`npm run ios`; `LARTIE_AMBIENTE=dev npm run ios` para o Firebase `lartie-dev`). iPhone físico e TestFlight: ainda não (ver Pendências).
- **Build Android:** celular no cabo (`npm run android`; `LARTIE_AMBIENTE=dev npm run android` para o dev). Antes, no Terminal: `adb start-server` e `npm run android:reverse`.
- **Serviços no Mac:**
  - ambiente demo: `npm run emuladores`, `npm run semear` e `npm run api`;
  - ambiente dev: `npm run dev:dev -w @lartie/api` (usa a chave em `~/.config/lartie/lartie-dev-admin.json`).
- **Contas de teste:**
  - **demo:** `ana@teste.lartie.app` e `pedro@teste.lartie.app`, senha `lartie-teste` (botões no T04);
  - **dev:** qualquer conta Google, Apple ou e-mail criada pelo próprio app.
- **Modo do app de uma conta nova:** `os_dois`, com o onboarding pendente.
- **Roteiro:**
  1. Primeira abertura: T01 com "Começar" e "Já tenho conta".
  2. T02: arrastar o carrossel e tocar nos pontos.
  3. T03 com e-mail:
     - campos inválidos mostram o erro ao sair do campo;
     - o botão fica desativado até tudo estar válido e os termos marcados;
     - a conta nova vai para o onboarding provisório.
  4. T03 com um e-mail já cadastrado: aparecem "Este e-mail já tem uma conta." e o link "Entrar com este e-mail".
  5. T04:
     - senha errada: aviso no topo e "Senha incorreta.";
     - 5 erros: acesso bloqueado por 15 minutos.
  6. T05: tela "Confira seu e-mail" e "Reenviar e-mail" liberado após 60 s. No dev, o e-mail chega de verdade.
  7. Google (iOS e Android) e Apple (iOS): criar a conta, sair e entrar de novo.

**Resultado do teste do dono do produto (25/10/2026):** cadastro e login, saindo e entrando de novo, funcionando com Google e Apple no iOS e com Google no Android, no projeto `lartie-dev`. Em 20/10, criação de conta por e-mail nos emuladores (a falha de ir para a home foi corrigida).

## Telas

| ID | Tela | Status | Observação |
| --- | --- | --- | --- |
| T01 | Splash | pronta | Regra de roteamento completa; "Começar" só na primeira abertura; tela de lançamento nativa do iOS com o degradê da marca |
| T02 | Boas-vindas | pronta | Carrossel de 3 páginas com os cartões do protótipo |
| T03 | Criar conta | pronta | E-mail, Google e Apple; termos com link (texto [a definir], P09) |
| T04 | Entrar | pronta | Erro T44, bloqueio, sessão expirada; contas de teste só no ambiente demo |
| T05 | Esqueci a senha | pronta | Formulário e "enviado"; o link do e-mail abre a página do Firebase (ver Divergência 3) |
| — | Preparando a conta | pronta | Chama a API; sem conexão → T47; erro → "Tentar de novo" ou "Sair" |
| T06 | Onboarding | provisória | Etapa 2. Em desenvolvimento há "Pular o onboarding" |
| T12 a T33 | Abas | provisórias | Perfil provisório com o "Sair" temporário (T41 na Etapa 3) |

## Confirmações, erros e avisos ligados nesta etapa

| ID | Onde aparece | Teste automatizado |
| --- | --- | --- |
| T44 | T04: aviso no topo e senha em erro | Manual (roteiro) |
| T45 | T03: e-mail já cadastrado e senha curta | `validacaoAcesso.test.ts` (textos); fluxo manual |
| Bloqueio 5 em 15 min | T04 | `bloqueioLogin.test.ts` (6 testes) |
| T46 / erros por campo | T03, T04, T05 | `validacaoAcesso.test.ts` |
| T47 | Criar conta, entrar e Google/Apple sem internet (aviso); Preparando a conta (tela) | Manual |
| Sessão expirada | T04 ("Sua sessão expirou. Entre de novo.") | Manual |
| T67 | Antes do T01 (versão mínima no Remote Config) | `versao.test.ts` (Etapa 0) |
| Criação do casal e do `noivo_1` | API `POST /v1/conta/inicializar` | `api/test/conta.test.ts` (8 testes: criação, idempotência, chamadas simultâneas, nome, token) |

Total de testes automatizados: **62, todos passando**:
- 7 de tokens;
- 14 de regras de negócio;
- 14 do app;
- 19 de regras do Firestore;
- 8 da API.

O CI roda todos, inclusive os da API nos emuladores.

## Definição de pronto (Seção 0.4)

- [x] Igual ao protótipo e só com tokens (exceções na Divergência 1).
- [x] Botões levam aos destinos da especificação.
- [x] Estados de carregando, erro, sem conexão e sucesso.
- [x] Erros e avisos da etapa ligados.
- [x] Tema claro e escuro (o Android foi testado no tema escuro do celular).
- [x] iOS (SF Pro) e Android (fonte do sistema/Roboto).
- [x] Alvos de toque, rótulos para leitor de tela e fonte grande nos componentes. A revisão completa com VoiceOver e TalkBack fica para a Etapa 8.
- [x] Respeita o modo do app (as abas vêm do casal).
- [x] Offline: o acesso exige o servidor; sem internet, aviso ou T47.
- [x] Testes automatizados das regras da etapa.
- [x] Analytics: eventos `sign_up` e `login` com o método (e-mail, Google ou Apple).

## Android (ligado nesta etapa, junto com o iOS)

- Primeiro build sem erros. O app roda no moto g31 nos ambientes demo e dev.
- Login com Google no Android funcionando no `lartie-dev` (SHA-1 da chave de teste cadastrado só no dev).
- **Neste Mac**, o `adb` trava no acesso nativo ao USB do moto g31. A solução é o modo `ADB_LIBUSB=1`, já no script `npm run android:reverse` e no `~/.zshrc`.
- **Da Etapa 0 no Android, ainda não conferido por você:** o catálogo de componentes (barra de navegação do Material 3 com a pílula, chips com o check) e a sincronização entre um Android e um iPhone. Sugestão: entrar com a mesma conta nos dois, tocar em "Pular o onboarding" e abrir o catálogo no Início.

## Divergências da especificação ou do protótipo

1. **Botões do Google e da Apple (T03 e T04):** o protótipo mostra "Google" e "Apple" lado a lado. No app, eles ficam empilhados, com o texto da especificação ("Continuar com…" no T03, "Entrar com…" no T04). O da Apple é o **botão oficial da Apple**, com o texto do próprio sistema em português, porque as regras da App Store exigem esse formato. O "G" do Google usa as cores da marca Google, como as regras de uso dele pedem.
2. **T01:** o app segue o protótipo (símbolo creme solto, sem o bloco do ícone, que a especificação cita). O slogan está em minúsculas, como pede o design system; o protótipo usa maiúsculas. O nome usa a Fraunces 500 gerada na Etapa 0; o protótipo usa peso 400 e tamanho óptico 144.
3. **T05 · link de nova senha:** a especificação pede que o link do e-mail abra uma tela de nova senha dentro do app. Isso depende do domínio `lartie.app` (P13), para o link abrir o app. Até lá, o link abre a página padrão do Firebase, que já está em português. A tela dentro do app entra quando houver domínio.
4. **E-mail de recuperação:** o texto de `docs/textos-e-mensagens.md` (assunto "Crie uma nova senha no Lartiê") ainda não está aplicado. Hoje vai o modelo padrão do Firebase em português. Para aplicar o texto: Authentication › Templates no console, ou envio próprio pelo Resend quando houver domínio.
5. **Textos que a especificação não define** (para você aprovar):
   - nome: "Informe seu nome, com 2 a 40 letras.";
   - e-mail vazio: "Informe seu e-mail.";
   - e-mail inválido: "Confira o e-mail. Ele precisa ter o formato nome@exemplo.com.";
   - senha vazia: "Informe sua senha.";
   - termos: "Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.";
   - bloqueio: "Muitas tentativas com este e-mail. Por segurança, o acesso fica bloqueado por {n} minutos. Se esqueceu a senha, crie uma nova.";
   - conta Google ou Apple com e-mail já usado de outro jeito: "Este e-mail já tem uma conta" + "Entre do mesmo jeito que vocês usaram para criar a conta, com e-mail e senha ou com o outro botão.";
   - sem internet (aviso): "Sem conexão com a internet. Confira e tente de novo.".
6. **Termos de Uso e Política de Privacidade:** os links abrem um aviso "[a definir]" até os textos existirem (P09).
7. **Login com Apple só no iOS:** no Android aparece só o Google. A Apple é obrigatória no iOS; no Android, não.
8. **Nome em login social:** vem do Google ou da Apple (a Apple só envia no primeiro login) ou, sem nome, do começo do e-mail. O onboarding (T06) pede os nomes do casal de qualquer forma.
9. **Bloqueio de 5 tentativas:** é contado neste aparelho, por e-mail. O Firebase também limita tentativas no servidor e, quando isso acontece, o app mostra a mesma mensagem.
10. **Sessão salva no iOS:** como em todo app com Firebase, a sessão fica no Keychain e continua depois de reinstalar o app. A especificação não pede o contrário.

## Pendências e riscos

- **API fora da VPS:** a API roda no Mac por enquanto. Sem o Mac ligado, uma conta nova não termina o cadastro. Antes de testar com outras pessoas ou fora de casa, ela precisa ir para a VPS, com HTTPS, e isso depende do domínio (P13). Sugestão: fazer junto com a Etapa 2 ou assim que o domínio existir.
- **Prod (`lartie`):** Google e Apple ainda não estão ativados nem configurados lá. Fica para a Etapa 10, junto com a chave de publicação do Android.
- **iPhone físico e TestFlight:** o perfil de assinatura do `com.lartie.app` já existe na sua conta (com Sign in with Apple). Falta instalar num iPhone de verdade.
- **Exclusão de conta com Apple (Etapa 3, T42):** a Apple exige revogar o acesso do Sign in with Apple ao excluir a conta. Vai seguir o mesmo caminho do Newzi.
- **Firebase iOS no CocoaPods:** o mesmo aviso da Etapa 0.

## Perguntas para o dono do produto

1. Aprova os textos da Divergência 5, ou quer trocar algum?
2. Está de acordo em deixar a tela de nova senha dentro do app para quando houver domínio (Divergência 3)?
3. Quer que eu aplique agora o texto do e-mail de recuperação no Firebase do `lartie-dev` (Divergência 4)? É pelo console; eu passo o passo a passo.
4. Quando colocamos a API na VPS? Precisa do domínio, ou de um subdomínio provisório num domínio que você já tenha.

---
Aguardando: `APROVADO ETAPA 1` ou `AJUSTES ETAPA 1: …`
