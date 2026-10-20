# CartaoProgresso

Cartão que mostra quanto do casamento ou da casa já foi feito, usado na tela inicial e no topo das listas.

- Fundo `surface`, raio `radius-lg`, padding `space-4`, sombra `shadow-card`.
- Rótulo da área em `ios-subheadline` / `md-body-medium` na cor `on-surface-variant`.
- Percentual em `ios-title-1` / `md-headline-small`.
- Barra de 8 de altura, raio `radius-full`: **casamento** com trilho `primary-container` e preenchimento `primary`; **casa** com trilho `home-container` e preenchimento `home`.
- Abaixo, o total em texto ("15 de 64 tarefas"), para não depender só da barra.
- Ao chegar a 100%, troque o total por um selo `success` ("Completo").
