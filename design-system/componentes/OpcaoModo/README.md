# OpcaoModo

Cartão de escolha única (rádio) usado para escolher o modo do app no onboarding (T06b) e em Perfil › Modo do app (T33b).

- Estrutura: ícone em círculo de 46 com o fundo da área (`primary-container`, `home-container`), título `ios-headline`/`md-title-medium`, descrição `ios-footnote`/`md-body-small` em `on-surface-variant` e rádio de 24 à direita.
- Repouso: fundo `surface`, borda de 2 em `outline-variant`. Selecionado: borda de 2 em `primary`, sombra leve e rádio preenchido em `primary` com ponto `on-primary`.
- Selo opcional ("Mais completo") em `primary-container` com texto `on-primary-container`.
- Raio `radius-lg` + 2 (18), padding 12 × 14 (compacto) ou 14 × 16.
- Acessibilidade: o grupo tem papel de rádio e rótulo "Modo do app"; cada cartão inteiro é o alvo de toque.
- "Decidir depois" **não** é um cartão: é um botão de texto abaixo do botão principal.
