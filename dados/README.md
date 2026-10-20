# Dados de conteúdo do Lartiê

Carga inicial do backend para gerar o plano do casal (Seções 13.1 e 13.2 da especificação). **Status: rascunho para revisão do dono do produto (pendência P03).**

| Arquivo | Conteúdo | Usado em |
| --- | --- | --- |
| `catalogo-tarefas.json` | 62 tarefas do checklist do casamento, com fase, prazo relativo (dias antes do casamento), estilos, se exige cerimônia religiosa e categoria de orçamento. Mais as tarefas da mudança (relativas à data da mudança) | Geração do checklist (T10), T13, T14 |
| `catalogo-enxoval.json` | 98 itens por cômodo, com fase, quantidade base para 2 moradores, regra de escala, filtro de clima, se é móvel grande (regra de mobiliado), preço de referência e se é bom para presente. Mais o mapa das opções "O que vocês já têm" (T09) | Geração do enxoval (T10), T18 a T20, listas de presentes |
| `clima-por-cidade.json` | Clima padrão por UF e exceções por cidade (frio, temperado, quente) | Filtro de clima do enxoval |
| `categorias.json` | Categorias de orçamento (casamento com % sugerido, casa), categorias de fornecedor, estilos, ocasiões de lista e restrições alimentares | T07, T15, T16, T17, T23, T29 |

Regras de cálculo estão dentro de cada arquivo (campo `regras`). Os números que aparecem nos protótipos (64 tarefas, 182 itens) são ilustrativos: o resultado real depende destes catálogos e das respostas do onboarding.

Ao alterar um catálogo depois do lançamento, os planos já gerados **não** mudam sozinhos. Novos itens ou tarefas só entram para casais existentes com confirmação (regra de T33 "Dados da casa nova").
