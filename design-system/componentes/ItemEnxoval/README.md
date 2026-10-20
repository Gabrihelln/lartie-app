# ItemEnxoval

Linha de um item do enxoval da casa, com o estado que o casal alterna com um toque: Falta, Já tenho ou Na lista de presentes.

- Fundo `surface`, raio `radius-lg`, borda `outline-variant`, altura mínima 64.
- Nome em `ios-headline` / `md-title-medium`; abaixo, quantidade, fase e preço em `ios-subheadline` / `md-body-medium` na cor `on-surface-variant`.
- Botão de estado à direita, largura mínima 92 e altura 44/48:
  - **Falta:** fundo `error-container`, texto `error`.
  - **Já tenho:** fundo `home`, texto `on-primary`.
  - **Na lista:** fundo `info-container`, texto `info`.
- Tocar no nome abre o detalhe do item; tocar no estado alterna para o próximo.
- O estado sempre aparece escrito, nunca só pela cor.
