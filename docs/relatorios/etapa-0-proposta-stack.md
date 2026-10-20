# Etapa 0 · Proposta de tecnologia (Seção 2.1 do plano)

Status: aguardando `APROVADO STACK`. Nenhum código foi escrito.
Versão 3: React Native CLI (como no Newzi) + Firebase no plano gratuito (Spark) + VPS própria (Hostinger KVM 1) para o que o Firebase só oferece no plano pago. IA fora do escopo atual. Custo de infraestrutura no MVP: zero além da VPS que já existe.

## Resumo

Um único código em **React Native CLI + TypeScript** para iOS e Android, como no Newzi. O **Firebase gratuito** cuida de login, banco (com offline e tempo real entre os parceiros), push, erros, analytics e configuração remota. A **VPS** roda uma API em Node (funções do servidor), os agendamentos, a página do convidado em Next.js e o armazenamento de fotos, no mesmo esquema de implantação do Newzi (nginx + systemd). As regras de negócio da Seção 13 ficam num pacote compartilhado, usado pelo app, pela web e pela API.

## 1. App iOS e Android

| Escolha | Por quê |
| --- | --- |
| **React Native CLI + TypeScript**, sem Expo | Mesma base do Newzi: um só código, com os projetos nativos `ios/` (Xcode) e `android/` (Gradle). Usa os controles nativos de cada sistema e as fontes do sistema (SF Pro / Roboto), como pede a especificação 1.1. Fraunces só no nome "Lartiê". |
| **React Navigation** (pilhas nativas + abas) | Abas que mudam conforme o modo do app; voltar do Android; deep links e universal links (`lartie.app/convite/…`, `lartie.app/{slug}/…`). |
| **@react-native-firebase/\*** | Auth, Firestore, Messaging, Crashlytics, Analytics, Remote Config e App Check, como no Newzi. |
| Login social | `@react-native-google-signin/google-signin` e `@invertase/react-native-apple-authentication`, como no Newzi. |
| Fotos | Comprimidas no app (cerca de 300 KB) antes do envio para a VPS. |
| Builds de teste | Geradas localmente (Xcode e Gradle) e enviadas ao TestFlight e ao teste interno da Google Play. |

## 2. Firebase, plano gratuito (Spark, sem cartão)

| Necessidade | Serviço |
| --- | --- |
| Autenticação (e-mail, Google, Apple), recuperação de senha, limite de tentativas | **Firebase Authentication** |
| Banco, offline com fila de envio, tempo real (até 2 s), "vence a última gravação" | **Cloud Firestore** (o SDK já faz cache offline, fila e sincronização) |
| Cada casal só vê os próprios dados | **Firestore Security Rules**, com dados em `casais/{casal_id}/…`, testadas no emulador |
| Push | **Firebase Cloud Messaging**, enviado pela API da VPS com o Admin SDK, como no Newzi |
| Erros e analytics | **Crashlytics** e **Google Analytics for Firebase** |
| Versão mínima do app (T67) e chaves de recursos (ex.: IA desligada) | **Remote Config** |
| Proteção do app | **App Check** (DeviceCheck/App Attest no iOS, Play Integrity no Android) |

**Limite do plano gratuito:** o Firestore permite cerca de 50 mil leituras e 20 mil gravações por dia e 1 GB armazenado. Ao passar, ele **para até o dia seguinte** em vez de cobrar. Basta para o MVP e os primeiros casais. Quando o uso se aproximar do limite (com alerta no painel), a saída é ativar o plano Blaze, sem mudar código, com custo estimado de US$ 0 a 50 por mês para 1.000 casais.

Ponto de atenção: o Firestore não faz somas e cruzamentos como um banco relacional. O orçamento (13.4) e as contagens de progresso (13.3) são calculados no app a partir dos dados do casal, com as funções do pacote de regras. Os totais usados em notificações (ex.: orçamento estourado) são recalculados na API.

## 3. VPS (Hostinger KVM 1: 1 vCPU, 4 GB de RAM, 50 GB NVMe)

| Era Firebase pago | Na VPS |
| --- | --- |
| Cloud Functions | **API em Node + TypeScript** (Fastify) com o Firebase Admin SDK: reserva atômica (13.5, transação do Firestore, com teste de concorrência), geração do plano no onboarding (13.1, 13.2), convite do parceiro, exclusão de conta (13.8), RSVP e reserva do convidado (rotas públicas com limite de requisições) |
| Cloud Scheduler | **systemd timers**: lembretes de tarefas e parcelas, expiração de reservas, notificações da Seção 12 com horário de silêncio |
| App Hosting | **Next.js** atrás do nginx em `lartie.app`: T25, T26, T30, T52 e a página de convite, com renderização no servidor (abrir em menos de 2 s). O mesmo site publica os arquivos de universal links |
| Cloud Storage | **Disco da VPS** (`/var/lib/lartie/arquivos`), servido pela API só para o casal dono, com link temporário |

Uso estimado: 300 a 600 MB de RAM e cerca de 15 GB de disco para 1.000 casais. Operação no mesmo padrão do Newzi: usuário Unix `lartie`, serviços systemd, nginx com HTTPS, só SSH e HTTPS abertos, segredos em `/etc/lartie/`, backup diário das fotos para fora do servidor com `rclone`, e checagens `/health`.

**Convivência com o Newzi (mesma VPS):** o Newzi já roda nessa máquina (API na porta 8090, worker com coleta, geração de áudio e tradução). O Lartiê fica isolado dele:
- usuário Unix, pastas (`/opt/lartie`, `/var/lib/lartie`, `/etc/lartie`) e serviços systemd próprios; nada do Newzi é alterado;
- portas locais diferentes (ex.: API em 8100 e web em 3100), só acessíveis pelo nginx;
- um bloco `server` próprio no nginx do Newzi, com certificado próprio para `lartie.app`;
- limites de recursos no systemd (`MemoryMax`, `CPUWeight`) para nenhum dos dois derrubar o outro, com prioridade de CPU para a API e a web do Lartiê, que atendem convidados em tempo real; os agendamentos do Lartiê rodam com prioridade baixa;
- antes da primeira implantação, medir o uso real da VPS (RAM, CPU e disco livres com o Newzi rodando) e registrar no relatório.

Riscos: os dois apps dividem 1 vCPU. Quando o worker do Newzi estiver gerando áudio ou traduzindo, a página do convidado pode ficar mais lenta que os 2 s pedidos. O disco também é dividido com os MP3s e os modelos do Newzi. Se as medições mostrarem aperto, a saída é subir para o KVM 2. A VPS é um ponto único de falha para reservas, RSVP e convites; o app continua funcionando (o Firestore não depende dela).

E-mail transacional (convite do parceiro, confirmação de reserva): **Resend** no plano gratuito (3 mil e-mails por mês). A recuperação de senha usa o e-mail do próprio Firebase Auth. WhatsApp: no MVP, abre o WhatsApp com a mensagem pronta (`wa.me`), grupo a grupo; envio em lote fica para a decisão P10.

## 4. Inteligência artificial: fora do escopo atual

Decisão do dono do produto: a IA não entra agora. Ficam de fora:

| Item | Onde estava | Como fica |
| --- | --- | --- |
| T22 Cadastro por foto | Etapa 4 | Botão "Cadastrar por foto" escondido |
| T31 Assistente Lu e o botão flutuante (T12, T12b, T12c, T13, T18) | Etapa 9 | Botão escondido; a Etapa 9 fica só com notificações |
| Lu na lista "Já dá para usar" do T12d | Etapa 3 | Item escondido |
| Erro T49 (foto não reconhecida) | Etapa 4 | Não se aplica |

Os pontos ficam atrás de uma chave no Remote Config, para ligar a IA no futuro sem refazer telas. Cada etapa afetada registra a mudança em "Divergências".

## 5. Organização do código

Monorepo (npm workspaces):

```
mobile/            app React Native CLI (ios/ e android/)
web/               página do convidado (Next.js)
api/               API e agendamentos da VPS (Node + TypeScript)
packages/regras    regras de negócio da Seção 13 + testes
packages/tokens    tokens gerados a partir de design-system/tokens.json (claro e escuro)
firebase/          regras do Firestore, índices, configuração
deploy/            nginx, systemd e backup da VPS
```

Testes: Jest (regras e componentes), Firebase Emulator Suite (regras de segurança, API contra o Firestore, reserva concorrente), Maestro (fluxos ponta a ponta no app). CI no GitHub Actions. Dois projetos Firebase separados: `lartie-dev` e `lartie-prod`. Segredos fora do repositório, com `.env.example`.

## 6. Custo mensal estimado

| Item | Custo |
| --- | --- |
| Firebase (plano Spark) | US$ 0 |
| VPS Hostinger KVM 1 | já contratada |
| Resend (até 3 mil e-mails por mês) | US$ 0 |
| **Total adicional no MVP** | **US$ 0** |
| Se crescer: Firebase Blaze | US$ 0 a 50 por mês (1.000 casais) |
| Se crescer: VPS KVM 2 | diferença de plano da Hostinger |

Custos que não são mensais: Apple Developer US$ 99 por ano, Google Play US$ 25 uma vez só, domínio `lartie.app` cerca de US$ 15 por ano.

## 7. Respostas do dono do produto (20/10/2026)

1. **Estrutura da pasta:** aprovado. O pacote foi movido para a raiz `lartie-app/`.
2. **IA:** esconder (atrás da chave no Remote Config), sem remover da especificação.
3. **VPS e domínio:** o Newzi já roda nessa mesma VPS (ver "Convivência com o Newzi" na Seção 3). O domínio `lartie.app` ainda será comprado. Até lá, o desenvolvimento usa os emuladores locais e um endereço provisório; os links públicos, os universal links e o e-mail `@lartie.app` são configurados quando o domínio existir.
4. **Contas:** o dono do produto cria os projetos Firebase (dev e prod), o GitHub e a VPS no mesmo padrão do Newzi.

---
Aguardando: `APROVADO STACK` ou ajustes.
