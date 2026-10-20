# Lartiê

**Lartiê: casamento e casa nova.** O app que organiza o casamento e a montagem da casa nova do casal, num só lugar.

Este guia define a marca e a interface do app para iOS e Android: logo, ícone, cores, tipografia, espaçamentos, componentes e tom de voz. A interface usa as fontes nativas de cada sistema (SF Pro no iOS e Roboto no Android). A fonte de marca (Fraunces) aparece só no nome "Lartiê".

## Princípios

1. **Claro antes de bonito.** Quem abre o app entende na hora o que fazer: organizar o casamento e montar a casa. Rótulos diretos, sem metáforas.
2. **Calma, não pressa.** Cores suaves, muito respiro e progresso visível. O app tira a ansiedade, não aumenta.
3. **Feito a dois.** Toda tela considera o casal: "vocês", "Ana & Pedro", quem é responsável por cada tarefa.
4. **Nativo em cada plataforma.** Seguimos as Human Interface Guidelines no iOS e o Material 3 no Android. A marca aparece nas cores e no símbolo, não em reinventar controles.

## Logo

O símbolo junta, num único desenho, a **casa** e a **aliança**: um telhado com beiral e duas paredes curtas pousa sobre uma aliança com volume (dois anéis, o interno mais claro). Um coração cheio fica sob o telhado. Lido de cima para baixo, é "casa nova" sobre "casamento".

- **Versão principal (ícone):** o símbolo em `brand-cream` dentro do bloco com o degradê `gradient-icon`. É o ícone do app e aparece na splash e nas telas de acesso.
- **Versão com nome:** o ícone (ou o símbolo solto) à esquerda e "Lartiê" em Fraunces 500, eixo SOFT 100, à direita. Abaixo do nome, o slogan "casamento e casa nova" em minúsculas.
- **Versões de cor do símbolo solto:** `primary` sobre fundos claros (`simbolo-rose.svg`), `on-primary-container` para impressão em uma cor (`simbolo-vinho.svg`) e `brand-cream` sobre o rosé, o vinho e o tema escuro (`simbolo-creme.svg`).
- **Traço:** linhas de espessura única com pontas e cantos arredondados (3,6 a 4 unidades no desenho de 100). O anel interno usa 55% de opacidade, o que cria o volume da aliança. O coração é o único elemento preenchido.
- **Área de proteção:** em volta do símbolo, deixe livre um espaço igual à altura do telhado.
- **Tamanho mínimo:** símbolo com 24 px de altura. Abaixo disso (favicon, notificações, ícone temático do Android), use `simbolo-simplificado.svg`: telhado e um só anel, sem o anel interno e sem o coração.

**Não faça:** esticar, girar ou recolorir o degradê do ícone; desenhar o símbolo à mão; trocar a fonte do nome; colocar o símbolo sobre fotos sem contraste; usar o rosé de marca como fundo de texto branco; adicionar contornos ou brilhos extras. As versões anteriores do símbolo (aliança com casinha e três brilhos) não devem mais ser usadas.

## Ícone do app

O ícone é o símbolo creme (`brand-cream`) sobre o degradê `gradient-icon`: diagonal de 155°, de `brand-rose-light` (#E2AFA4) no topo esquerdo, passando por `brand-rose` (#C4837A), até `brand-rose-deep` (#A9655B) na base, com um brilho radial branco suave (38% de opacidade) no canto superior esquerdo. O símbolo ocupa cerca de 78% do lado do quadrado (desenho de 100 em 187 de 240). Arquivos em `logos/svg/` e `logos/png/`.

| Plataforma | Entrega | Regras |
| --- | --- | --- |
| iOS | PNG 1024 × 1024, sem transparência, a partir de `icone-app-1024.svg` | Entregue o quadrado sem cantos arredondados; o iOS aplica a máscara. |
| Android (adaptive icon) | Camadas de 108 × 108 dp: fundo (degradê com brilho) e frente (símbolo) | Mantenha o símbolo dentro da zona segura central de 66 dp: reduza-o para cerca de 60% do lado. |
| Android 13+ (ícone temático) | Camada monocromática | `simbolo-simplificado.svg`. |
| Google Play | PNG 512 × 512 | Mesmo desenho do ícone adaptativo. |
| Materiais e telas de acesso | `icone-app-arredondado.svg` ou o bloco em CSS | Raio `radius-icon` (22,5%) e, a partir de 96 px, sombra `shadow-icon-tile`. |
| Favicon e notificações | 32 e 16 px | `simbolo-simplificado.svg`. |

## Cores

A paleta tem dois papéis: as **cores de marca** (rosé, creme e vinho), usadas no logo, no ícone e na splash, e as **cores de interface**, que seguem os papéis do Material 3 e também valem no iOS.

- **`primary`** é a cor de ação: botão principal, aba ativa, links e progresso do casamento.
- **`home`** (verde-sálvia) é a cor da área Casa nova. Assim o casal distingue num relance o que é do casamento (rosé) e o que é da casa (sálvia).
- **`info`** marca o que está na lista de presentes, **`success`** o que já foi concluído, **`warning`** o que pede atenção e **`error`** o que está atrasado ou estourou.
- Todo texto atinge contraste de 4.5:1 nos dois temas. As cores de marca rosé não levam texto branco.
- O app tem **tema claro e escuro** e segue a configuração do sistema.

### Estados do item do enxoval

| Estado | Fundo | Texto |
| --- | --- | --- |
| Falta | `error-container` | `error` |
| Já tenho | `home` | `on-primary` |
| Na lista de presentes | `info-container` | `info` |

### Cores de marca

| Token | Valor | Uso |
| --- | --- | --- |
| `brand-rose-light` | #E2AFA4 | Topo do degradê do ícone |
| `brand-rose` | #C4837A | Meio do degradê do ícone |
| `brand-rose-deep` | #A9655B | Base do degradê do ícone |
| `brand-blush` | #DCA196 | Topo da splash |
| `brand-rose-strong` | #B87268 | Segunda parada da splash |
| `brand-wine` | #8E4C43 | Terceira parada da splash, logo sobre vinho |
| `brand-wine-deep` | #6E352E | Base da splash |
| `brand-petal` | #EDC9BF | Topo do fundo do onboarding |
| `brand-cream` | #FCEEE8 | Símbolo e textos sobre o rosé e o vinho |

### Degradês

Os degradês são parte da marca e só aparecem nestes lugares. Use sempre os valores abaixo.

| Nome | CSS | Onde |
| --- | --- | --- |
| `gradient-icon` | `radial-gradient(circle at 28% 18%, rgba(255,255,255,.38), rgba(255,255,255,0) 55%), linear-gradient(155deg, var(--brand-rose-light) 0%, var(--brand-rose) 52%, var(--brand-rose-deep) 100%)` | Ícone do app, bloco do ícone nas telas de acesso e no Início "Decidir depois" |
| `gradient-splash` | `linear-gradient(165deg, var(--brand-blush) 0%, var(--brand-rose-strong) 42%, var(--brand-wine) 78%, var(--brand-wine-deep) 100%)` | Splash (T01) |
| `gradient-onboarding` | `linear-gradient(170deg, var(--brand-petal) 0%, var(--primary-container) 55%, var(--background) 100%)`, nos 470 pt do topo | Boas-vindas, esqueci a senha, onboarding e o cartão de boas-vindas do Início "Decidir depois". Sempre com os dois anéis brancos decorativos (35% e 25%) saindo pelo canto superior direito |

Nunca coloque texto branco sobre `gradient-icon` ou `gradient-onboarding`. Sobre `gradient-splash`, use `brand-cream`.

### Cores por área do app (modo do app)

O app pode ser usado só para o casamento, só para a casa nova ou para os dois. As cores marcam cada área em todos os modos:

| Área | Cor | Fundo claro | Onde aparece |
| --- | --- | --- | --- |
| Casamento | `primary` | `primary-container` | Contagem regressiva, checklist, opção "Só o casamento", cartão "Vão casar também?" |
| Casa nova | `home` | `home-container` | Cartão da mudança, cômodos, opção "Só a casa nova", cartão "Vão montar a casa nova também?" |
| Os dois | `on-primary-container` | `primary-container` | Opção "Casamento e casa nova" (selo "Mais completo") |
| Decidir depois | marca | `gradient-onboarding` | Cartão de boas-vindas do Início, com o ícone do app |


## Tipografia

A interface usa a **fonte do sistema** em cada plataforma. Isso garante leitura nítida, suporte a Dynamic Type no iOS e à escala de fonte do Android, e a sensação de app nativo.

- **iOS:** SF Pro (chamada pelo sistema), com a escala de estilos de texto da Apple no tamanho padrão.
- **Android:** Roboto, com a escala de tipos do Material 3.
- **Marca:** Fraunces 500, eixo SOFT 100, só no nome "Lartiê" (logo, splash, telas de acesso e página pública de presentes). O slogan "casamento e casa nova" usa a fonte do sistema, em minúsculas.

Equivalência entre plataformas:

| Uso no app | iOS | Android |
| --- | --- | --- |
| Título das abas | `ios-large-title` 34/41 Bold | `md-headline-medium` 28/36 |
| Título de tela interna | `ios-title-2` 22/28 Bold | `md-title-large` 22/28 |
| Título de seção | `ios-title-3` 20/25 Semibold | `md-title-small` 14/20 Medium |
| Nome de item, título de cartão | `ios-headline` 17/22 Semibold | `md-title-medium` 16/24 Medium |
| Texto corrido, campos | `ios-body` 17/22 | `md-body-large` 16/24 |
| Metadados | `ios-subheadline` 15/20 | `md-body-medium` 14/20 |
| Ajuda, notas | `ios-footnote` 13/18 | `md-body-small` 12/16 |
| Texto de botão | `ios-headline` 17/22 Semibold | `md-label-large` 14/20 Medium |
| Rótulo da navegação | `ios-caption-2` 11/13 | `md-label-medium` 12/16 Medium |

Tamanhos em pt (iOS) e sp (Android). Respeite o tamanho de fonte escolhido pelo usuário: nenhum texto deve ter altura fixa que corte o conteúdo.

## Espaçamento, grade e tamanhos

- Grade de **4 pt / 4 dp**. Use os tokens `space-*`.
- Margem lateral das telas: `space-4` (16) no Android e `space-5` (20) no iOS.
- Alvos de toque: no mínimo `touch-ios` (44 pt) e `touch-android` (48 dp).
- Botão principal e campos: `button-height` e `field-height` (52).
- Navegação: tab bar do iOS com `tabbar-ios` (49 pt + área segura) e barra do Material 3 com `navbar-android` (80 dp).
- Botão flutuante da assistente: `fab` (56).

## Formas e elevação

- Cartões com `radius-lg` (16), campos com `radius-md` (12), folhas inferiores com `radius-xl` (24) e botões e chips com `radius-full`.
- Elevação leve: `shadow-card` em cartões e `shadow-fab` no botão da assistente. No tema escuro, a elevação vem de superfícies mais claras, não de sombra.

## Iconografia

- **iOS:** SF Symbols, peso Regular, tamanho 24.
- **Android:** Material Symbols Rounded, peso 400, sem preenchimento (outline), tamanho 24 dp.
- Os dois combinam com o traço arredondado do símbolo da marca.
- Ícones das abas: Início (casa), Casamento (alianças), Convidados (pessoas, só no modo "Só o casamento"), Casa (sofá), Presentes (presente) e Perfil (pessoa). Na aba ativa, use a versão preenchida.
- As abas visíveis dependem do modo do app: os dois (5 abas), só casamento (Início, Casamento, Convidados, Presentes, Perfil), só casa (Início, Casa, Presentes, Perfil) e decidir depois (Início, Presentes, Perfil).

## Componentes

Os componentes seguem os controles nativos de cada sistema, com as cores e formas deste guia. Veja as pastas em `componentes/`: Logo, Degradês, Botão, Chip, Campo de texto, Cartão de progresso, Item do enxoval, Opção de modo e Barra de navegação.

## Tom de voz

- Português do Brasil, tratando o casal por **"vocês"** e chamando cada um pelo nome.
- Frases curtas e concretas: "Faltam 34 itens na cozinha", não "Sua jornada continua!".
- Carinhoso sem exagero: comemore conquistas ("Quarto completo!") sem emojis na interface.
- Botões dizem a ação: "Reservar presente", "Marcar como fechado", "Enviar convite".

## Acessibilidade

- Contraste mínimo de 4.5:1 para texto e 3:1 para ícones e bordas de controles, nos dois temas.
- Estado nunca só por cor: todo selo tem texto ("Atrasada", "Recebido").
- Todos os ícones sem texto têm rótulo para VoiceOver e TalkBack.
- Suporte a fonte grande (Dynamic Type e escala de fonte) sem cortar texto.
