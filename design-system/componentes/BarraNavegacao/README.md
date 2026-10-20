# BarraNavegacao

Navegação principal. As abas dependem do modo do app:

| Modo | Abas |
| --- | --- |
| Casamento e casa nova | Início · Casamento · Casa · Presentes · Perfil |
| Só casamento | Início · Casamento · Convidados · Presentes · Perfil |
| Só casa nova | Início · Casa · Presentes · Perfil |
| Decidir depois | Início · Presentes · Perfil |


- **iOS:** tab bar nativa de `tabbar-ios` (49 pt) mais a área segura inferior. Ícones SF Symbols de 24, rótulo `ios-caption-2`. Aba ativa em `primary` com o ícone preenchido; inativas em `on-surface-variant`.
- **Android:** barra de navegação do Material 3 com `navbar-android` (80 dp). Ícones Material Symbols Rounded de 24, rótulo `md-label-medium`. A aba ativa ganha o indicador em pílula (64 × 32 dp) em `primary-container`, com ícone em `on-primary-container`.
- Fundo `surface` com divisor superior `outline-variant`.
- Sempre com rótulo visível em todas as abas; com 3 ou 4 abas, elas se distribuem igualmente na largura.
- O botão flutuante da assistente (`fab`, 56) fica acima da barra, à direita, com `shadow-fab`. No modo "Decidir depois" ele não aparece.
