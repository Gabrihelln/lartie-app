# Pacote de desenvolvimento do Lartiê

Tudo o que o Claude Code precisa para desenvolver o app Lartiê, organizado numa pasta só.

## Como usar

1. Descompacte esta pasta onde você guarda seus projetos (por exemplo, `Documentos/lartie`).
2. Abra o terminal nessa pasta e inicie o Claude Code (`claude`).
3. Escreva: **"Leia o CLAUDE.md e comece a Etapa 0."**
4. O Claude Code vai propor a tecnologia e parar. Leia a proposta e responda **`APROVADO STACK`** (ou peça ajustes).
5. A cada etapa, ele entrega um relatório e um app de teste e para. Teste no celular e responda **`APROVADO ETAPA N`** ou **`AJUSTES ETAPA N: …`**.

Antes de começar, veja `docs/pendencias-do-produto.md`: algumas coisas só você pode fazer (criar contas nas lojas, domínio, chave de IA) e alguns conteúdos precisam da sua revisão.

## O que tem aqui

```
lartie/
├── CLAUDE.md                        instruções que o Claude Code lê sozinho
├── LEIA-ME.md                       este arquivo
├── docs/
│   ├── especificacao-funcional.md   o que o app faz, tela por tela (fonte de verdade)
│   ├── plano-de-desenvolvimento.md  etapas, cronograma e portões de aprovação
│   ├── textos-e-mensagens.md        WhatsApp, e-mails, push e textos das lojas (rascunho)
│   └── pendencias-do-produto.md     decisões em aberto e o que só você pode fazer
├── design/
│   └── telas/
│       ├── INDEX.md                 lista das 72 telas (e 11 estados extras) com links
│       ├── visao-geral/             uma imagem por grupo de telas
│       ├── png/                     imagem de cada tela
│       ├── html/                    cada tela em HTML que abre no navegador
│       └── fonte-dc/                fonte original dos protótipos, com a lógica
├── design-system/
│   ├── README.md                    guia da marca e da interface
│   ├── tokens.json / tokens.css     cores (claro e escuro), tipos, espaços, raios, sombras, degradês
│   ├── componentes/                 cada componente com regras e prévia em HTML
│   └── logos/                       ícone final em SVG e PNG (iOS, Android, Play, favicon)
└── dados/
    ├── catalogo-tarefas.json        tarefas do checklist e da mudança (rascunho)
    ├── catalogo-enxoval.json        itens do enxoval por cômodo (rascunho)
    ├── clima-por-cidade.json        clima por UF e cidade
    └── categorias.json              orçamento, fornecedores, estilos, ocasiões
```

## O que não está no pacote

- **Screenshots das lojas** (App Store e Google Play): continuam no canvas de protótipos no claude.ai, linhas 10 e 11. Exporte de lá na Etapa 10.
- **Landing page:** está no canvas "Lartiê · Landing page" no claude.ai e não faz parte do app.
- Os protótipos e o design system originais continuam no claude.ai. Se você mudar alguma tela lá, gere um pacote novo ou atualize a pasta `design/` antes de pedir ao Claude Code.
