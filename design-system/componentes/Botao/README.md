# Botao

Botões de ação do app: um botão principal por tela, preenchido em `primary` e em formato de pílula.

| Variante | Fundo | Texto | Quando usar |
| --- | --- | --- | --- |
| Principal | `primary` | `on-primary` | A ação principal da tela ("Continuar", "Salvar", "Reservar presente"). Só um por tela. |
| Tonal | `primary-container` | `on-primary-container` | Ação secundária forte ("Ver como convidado"). |
| Contornado | transparente, borda `outline` | `on-surface` | Alternativa ("Já tenho conta", "Refazer"). |
| Texto | transparente | `primary` | Ação de baixo peso ("Pular", "Convidar depois"). |
| Destrutivo | transparente | `error` | "Excluir tarefa", "Desfazer reserva". Sempre peça confirmação. |
| WhatsApp | `whatsapp` | branco | Só para ações que abrem o WhatsApp. |

- Altura `button-height` (52), raio `radius-full`, largura total no rodapé da tela.
- Texto: `ios-headline` no iOS e `md-label-large` no Android, sempre com o verbo da ação.
- Estado desativado: 38% de opacidade, sem mudar a cor.
- Área de toque mínima: 44 pt no iOS e 48 dp no Android, mesmo nos botões de texto.
