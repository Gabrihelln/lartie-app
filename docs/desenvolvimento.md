# Como rodar o Lartiê

## Estrutura

```
mobile/            app React Native CLI (iOS e Android)
packages/tokens    tokens do design system, gerados de design-system/ (npm run tokens)
packages/modelo    modelo de dados da Seção 3 e caminhos no Firestore
packages/regras    regras de negócio da Seção 13 (por enquanto, modo do app)
firebase/          regras do Firestore, testes no emulador e script do casal de teste
```

A API da VPS (`api/`) e a web do convidado (`web/`) entram nas etapas que precisam delas (2 e 5).

## Pré-requisitos

- Node 20.19 ou mais novo.
- Xcode 26 e CocoaPods (iOS).
- Android Studio com o SDK 36 (Android).
- Java 21 para os emuladores do Firebase (o Android Studio já traz um: aponte `JAVA_HOME` para
  `/Applications/Android Studio.app/Contents/jbr/Contents/Home`).
- Firebase CLI (`npm i -g firebase-tools`).

## Primeira vez

```sh
npm install                 # pacotes compartilhados e firebase/
cd mobile && npm install    # app
cd ios && pod install       # use LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 se der erro de Unicode
```

## Rodar com os emuladores (ambiente demo)

Em três terminais, na raiz do repositório:

```sh
npm run emuladores          # 1. Auth e Firestore locais (interface em http://localhost:4000)
npm run semear              # 2. cria Ana e Pedro (senha lartie-teste) no casal de teste
cd mobile && npm start      # 3. Metro
```

Depois, em outro terminal: `cd mobile && npm run ios` (simulador) ou `npm run android` (flavor `demoDebug`).
No app, "Entrar como Ana" ou "Entrar como Pedro" e, no Início, "Abrir catálogo de componentes".

Para testar a sincronização entre dois aparelhos: abra um simulador com Ana e outro (ou o Android) com Pedro, e use
"Somar 1" e a troca de modo no topo do catálogo.

## Ambientes do Firebase

| Ambiente | Projeto | Para quê |
| --- | --- | --- |
| demo | `demo-lartie` | Emuladores locais. Configuração falsa, já no repositório |
| dev | `lartie-dev` | Testes no celular com dados de teste |
| prod | `lartie-prod` | Usuários reais |

- **iOS:** coloque o `GoogleService-Info.plist` de cada projeto em `mobile/ios/Lartie/Firebase/<ambiente>/` e rode
  `npm run ambiente -- dev` (ou `prod`) antes de compilar. `LARTIE_AMBIENTE=dev npm run ios` faz os dois.
- **Android:** coloque o `google-services.json` em `mobile/android/app/src/<ambiente>/` e compile o flavor
  correspondente (`demoDebug`, `devDebug`, `prodRelease`).
- Os arquivos de dev e prod não vão para o git.

## Testes

```sh
npm test                    # tokens e regras de negócio (Vitest)
npm run typecheck           # tipos de todos os pacotes
npm run test:regras-firestore   # regras de segurança no emulador (precisa de Java)
cd mobile && npm test && npm run typecheck
```

O CI (`.github/workflows/ci.yml`) roda tudo isso a cada envio.

## Tokens do design system

Mudou `design-system/tokens.json` ou `tokens.css`? Rode `npm run tokens`. Um teste falha se os tokens gerados
estiverem desatualizados.
