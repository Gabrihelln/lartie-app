# Chip

Chips de filtro e de seleção: filtram listas (Todas, A fazer, Atrasadas) e escolhem opções no onboarding (estilo do casamento, tipo de imóvel).

- Altura 40 (área de toque de 44/48 garantida pelo espaçamento), raio `radius-full`, padding lateral 14.
- **Não selecionado:** fundo `surface`, borda `outline-variant`, texto `on-surface`.
- **Selecionado:** fundo `primary`, texto `on-primary`. No Android, adicione o ícone de check à esquerda, como no Material 3.
- Texto: `ios-subheadline` Semibold no iOS e `md-label-large` no Android.
- Em listas horizontais, os chips rolam lateralmente e a margem da tela continua visível nas pontas.
