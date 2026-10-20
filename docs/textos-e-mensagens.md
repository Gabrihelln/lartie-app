# Lartiê — Textos de mensagens, e-mails e notificações

> **Status: rascunho para aprovação do dono do produto.** Os textos das telas estão na especificação funcional e nos protótipos. Aqui ficam os textos que **saem do app**: WhatsApp, e-mail e push. Variáveis entre chaves.
>
> Tom: português do Brasil, tratando por "vocês" o casal e por "você" o convidado; frases curtas; sem emojis nos textos do sistema (o casal pode editar as mensagens que envia).

---

## 1. Convite do parceiro(a) (T11)

**WhatsApp (mensagem pronta, editável antes de enviar)**
> {nome_1} convidou você para planejar juntos no Lartiê: o casamento e a casa nova de vocês, num só lugar. Entre pelo link: lartie.app/convite/{codigo}
> O convite vale por 7 dias.

**E-mail**
- Assunto: {nome_1} convidou você para o Lartiê
- Corpo:
  > Oi, {nome_2}!
  >
  > {nome_1} começou a organizar o casamento e a casa nova de vocês no Lartiê e quer fazer isso junto com você. Vocês vão ver e editar o mesmo checklist, o enxoval e as listas de presentes.
  >
  > [Aceitar o convite] → lartie.app/convite/{codigo}
  >
  > O convite vale até {data_expiracao}.

## 2. Conta

**Recuperar senha (T05)**
- Assunto: Crie uma nova senha no Lartiê
- Corpo:
  > Recebemos um pedido para criar uma nova senha para {email}.
  >
  > [Criar nova senha] (o link vale por 1 hora)
  >
  > Se não foi você, ignore este e-mail. Sua senha atual continua a mesma.

**Confirmação de troca de e-mail (T33)**
- Assunto: Confirme seu novo e-mail no Lartiê
- Corpo: "Toque no botão para confirmar que {novo_email} é o seu e-mail no Lartiê. [Confirmar e-mail]"

**Conta excluída (T42)**
- Assunto: Sua conta no Lartiê foi excluída
- Corpo: "A conta de {nome_1} & {nome_2} foi excluída. Os dados serão apagados em até 30 dias e os links de presentes e RSVP já estão desativados."

## 3. Lista de presentes (convidado)

**Confirmação de reserva (T26) · WhatsApp ou e-mail, se o convidado informou**
> Oi, {nome_convidado}! Sua reserva de {quantidade} {item} para {nome_1} & {nome_2} está confirmada. Ela vale até {data_expiracao}.
> Entrega: {endereco_entrega}
> Se mudar de ideia, desfaça aqui: lartie.app/{slug}/reserva/{token}

**Lembrete 2 dias antes de expirar**
> Oi, {nome_convidado}! A sua reserva de {item} para {nome_1} & {nome_2} vence em 2 dias. Se já comprou, está tudo certo. Se desistiu, libere para outra pessoa: lartie.app/{slug}/reserva/{token}

**Reserva cancelada pelo casal (item removido ou lista excluída)**
> Oi, {nome_convidado}! {nome_1} & {nome_2} tiraram {item} da lista, então a sua reserva foi cancelada. Veja outros presentes: lartie.app/{slug}/{lista}

**Mensagem padrão de agradecimento (T27, editável pelo casal)**
> Oi, {nome}! Muito obrigado pelo {presente}. Ele já tem lugar especial na nossa casa nova. Com carinho, {nome_1} e {nome_2}.

## 4. Convidados e RSVP

**Convite de RSVP (T29 "Salvar e enviar convite")**
> Oi, {nome_grupo}! {nome_1} & {nome_2} vão se casar em {data_casamento}, em {cidade}. Confirme a presença de vocês até {rsvp_prazo}: lartie.app/{slug}/rsvp/{token}

**Lembrete de RSVP (T38)**
> Oi, {nome_grupo}! Ainda não recebemos a confirmação de vocês para o casamento de {nome_1} & {nome_2}. Leva menos de um minuto: lartie.app/{slug}/rsvp/{token}

## 5. Notificações push (resumo)

Os textos e gatilhos estão na Seção 12 da especificação. Regra de título: o título é sempre "Lartiê" e o texto é a frase da tabela. Ao tocar, abre o destino indicado na tabela.

## 6. Textos das lojas (Etapa 10)

- **Nome:** Lartiê: casamento e casa nova
- **Subtítulo (App Store, até 30 caracteres):** Casamento e casa nova juntos
- **Descrição curta (Google Play, até 80 caracteres):** Checklist do casamento, enxoval por cômodo e lista de presentes num só app.
- **Palavras-chave (App Store):** lartie, casamento, noivos, enxoval, casa nova, checklist, lista de presentes, chá de panela, convidados, rsvp
- **Descrição longa:** escrever na Etapa 10 a partir das telas finais e mencionar "Lartie" uma vez.
