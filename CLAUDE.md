# Lartiê · instruções para o Claude Code

Este repositório vai conter o app **Lartiê: casamento e casa nova** (iOS, Android e web pública do convidado). Antes de qualquer código, leia este arquivo inteiro.

## Onde está cada coisa

| O quê | Onde | Use para |
| --- | --- | --- |
| O que o app faz, tela por tela | `docs/especificacao-funcional.md` | **Fonte de verdade.** Regras, dados, textos exatos, destinos de cada botão |
| Ordem do trabalho e portões de aprovação | `docs/plano-de-desenvolvimento.md` | Em que etapa estamos, o que entra nela, quando parar |
| Visual de cada tela | `design/telas/` (índice: `design/telas/INDEX.md`) | PNG para olhar, HTML estático para medir, `fonte-dc/` para ler os outros estados |
| Design system | `design-system/` (`README.md`, `tokens.json`, `tokens.css`, `componentes/`, `logos/`) | Cores, tipografia, espaços, raios, sombras, degradês, ícone e componentes |
| Conteúdo do plano | `dados/` | Catálogos de tarefas, enxoval, clima e categorias (carga inicial do backend) |
| Mensagens que saem do app | `docs/textos-e-mensagens.md` | WhatsApp, e-mail, push, textos das lojas |
| Decisões em aberto | `docs/pendencias-do-produto.md` | Não invente: pergunte no relatório e use `[a definir]` |

Ordem de prioridade se houver conflito: especificação funcional › design system › protótipo. Registre toda divergência no relatório da etapa.

## Regra mais importante: portões de aprovação

1. Trabalhe **uma etapa por vez**, na ordem do plano (Etapa 0 a 10).
2. Ao terminar a etapa, entregue o **Relatório da etapa** (modelo na Seção 13 do plano) e **pare**.
3. Só comece a próxima etapa quando o dono do produto escrever **`APROVADO ETAPA N`**. Na Etapa 0, a escolha de tecnologia tem portão próprio: **`APROVADO STACK`**.
4. `AJUSTES ETAPA N: …` → corrija dentro da mesma etapa e entregue de novo.
5. Nunca adiante código de uma etapa futura, nem "só a estrutura".

Para saber em que etapa estamos, leia `docs/progresso.md`. Crie esse arquivo na Etapa 0 e atualize ao fim de cada etapa (etapa atual, status, data da aprovação, links dos relatórios). Guarde os relatórios em `docs/relatorios/etapa-N.md`.

## Desde a primeira tela

Confirmações, erros, avisos com "Desfazer", estados de carregamento e vazio, telas de permissão, "descartar alterações", offline e **modo do app** (`casamento`, `casa`, `os_dois`, `indefinido`, Seção 13.9 da especificação) nascem na Etapa 0 e são ligados em cada etapa. As Etapas 7 e 8 só auditam. Veja a Seção 0.3 do plano.

## Padrões de código e produto

- Interface em português do Brasil; textos exatamente como na especificação.
- **Lartiê** com acento em tudo que o usuário lê. **lartie** sem acento em tudo que é técnico: identificador `com.lartie.app`, domínio `lartie.app`, e-mails `@lartie.app`, nomes de pastas, pacotes, tabelas e variáveis.
- Só tokens do design system: nada de cor, tamanho ou raio solto no código. Os tokens estão prontos em `design-system/tokens.json` e `tokens.css` (claro e escuro).
- Aparência nativa: SF Pro e controles do iOS no iPhone; Roboto e Material 3 no Android. Fraunces só no nome "Lartiê".
- Ícone do app: use os arquivos de `design-system/logos/` (há PNGs prontos para iOS e Android). Não redesenhe o símbolo.
- Acessibilidade: alvos de 44 pt / 48 dp, rótulos para leitor de tela, fonte grande sem cortar, contraste nos dois temas.
- Toda regra de negócio da Seção 13 da especificação tem teste automatizado. A reserva de presente (13.5) tem teste de concorrência.
- Segredos (chaves de API, credenciais) nunca no repositório: use variáveis de ambiente e um `.env.example`.
- Commits pequenos, mensagens em português, uma etapa por branch (`etapa-N-nome`), com merge depois do `APROVADO`.

## Antes de começar a Etapa 0

Leia, nesta ordem: este arquivo → `docs/plano-de-desenvolvimento.md` → `docs/especificacao-funcional.md` → `design-system/README.md` → `design/telas/INDEX.md` → `docs/pendencias-do-produto.md`. Depois entregue a proposta de tecnologia (Seção 2.1 do plano) e espere `APROVADO STACK`.
