'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Dialogo } from '../../../../componentes/Dialogo';
import type { Presente } from '../../../../../lib/api';

// T26 estado 1 (formulário) e estado 2 (confirmado), T40 (desfazer) e T51 (esgotou ao salvar).
// O navegador guarda o token da reserva para o convidado desfazer depois (localStorage).

interface Confirmada {
  token: string;
  quantidade: number;
  item: string;
  entrega: string | null;
  mensagem_confirmacao: string;
  whatsapp: string | null;
}

const CHAVE = 'lartie.reservas';

function guardar(r: { token: string; item: string; slug: string }) {
  try {
    const lista = JSON.parse(localStorage.getItem(CHAVE) ?? '[]') as unknown[];
    localStorage.setItem(CHAVE, JSON.stringify([...lista, { ...r, em: Date.now() }].slice(-20)));
  } catch {
    // navegador sem armazenamento: o link do WhatsApp continua servindo
  }
}

/** "(41) 99999-0000" enquanto digita (11 dígitos). */
function mascara(t: string) {
  const d = t.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  const resto = d.slice(2);
  const meio = resto.length > 8 ? 5 : 4;
  return resto.length <= meio ? `(${d.slice(0, 2)}) ${resto}` : `(${d.slice(0, 2)}) ${resto.slice(0, meio)}-${resto.slice(meio)}`;
}

export function FormularioReserva({ slug, lista, presente, casal, voltar }: { slug: string; lista: string; presente: Presente; casal: string; voltar: string }) {
  const router = useRouter();
  const [qtd, setQtd] = useState(1);
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [tentou, setTentou] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [esgotou, setEsgotou] = useState(false);
  const [confirmada, setConfirmada] = useState<Confirmada | null>(null);
  const [desfazer, setDesfazer] = useState(false);
  const [desfeita, setDesfeita] = useState(false);

  const erroNome = nome.trim() ? null : 'Informe o seu nome.';
  const digitos = whatsapp.replace(/\D/g, '');
  const erroWhats = !digitos || digitos.length >= 10 ? null : 'Confira o número com o DDD.';

  const reservar = async () => {
    setTentou(true);
    if (erroNome || erroWhats || enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      const r = await fetch(`/api/reservar/${encodeURIComponent(slug)}/${encodeURIComponent(lista)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ presente: presente.id, quantidade: qtd, nome: nome.trim(), whatsapp: digitos || null, mensagem: mensagem.trim() || null }),
      });
      const dados = await r.json().catch(() => ({}));
      if (r.status === 409 && dados.erro === 'indisponivel') return setEsgotou(true);
      if (r.status === 404) return router.refresh();
      if (!r.ok) throw new Error(dados.erro ?? 'erro');
      guardar({ token: dados.token, item: dados.item, slug });
      setConfirmada(dados as Confirmada);
      window.scrollTo({ top: 0 });
    } catch {
      setErro('Não foi possível reservar agora. Confira a internet e tente de novo.');
    } finally {
      setEnviando(false);
    }
  };

  const confirmarDesfazer = async () => {
    if (!confirmada) return;
    setEnviando(true);
    const r = await fetch(`/api/reservas/${encodeURIComponent(confirmada.token)}/desfazer`, { method: 'POST' }).catch(() => null);
    setEnviando(false);
    setDesfazer(false);
    if (r && (r.ok || r.status === 409)) setDesfeita(true);
    else setErro('Não foi possível desfazer agora. Tente de novo.');
  };

  if (desfeita) {
    return (
      <section className="estado">
        <h2>Reserva desfeita</h2>
        <p className="suave">O presente voltou para a lista. Obrigado por avisar.</p>
        <a className="botao" href={voltar} style={{ maxWidth: 320 }}>
          Voltar para a lista
        </a>
      </section>
    );
  }

  if (confirmada) {
    const n = confirmada.quantidade;
    const whatsConvidado = confirmada.whatsapp ? (confirmada.whatsapp.startsWith('55') ? confirmada.whatsapp : `55${confirmada.whatsapp}`) : null;
    return (
      <section className="conteudo" style={{ padding: 0 }} aria-live="polite">
        <div className="estado" style={{ padding: 'var(--space-4) 0', flex: 'none' }}>
          <div className="icone-estado" aria-hidden>
            ✓
          </div>
          <h2>Reservado!</h2>
          <p className="suave">
            {n} {confirmada.item.toLocaleLowerCase('pt-BR')} {n === 1 ? 'fica reservado' : 'ficam reservados'} para você por 15 dias. {casal} vão adorar.
          </p>
        </div>
        {confirmada.entrega ? (
          <div className="bloco">
            <strong>Entrega</strong>
            <p style={{ margin: 'var(--space-1) 0 0' }}>{confirmada.entrega}</p>
          </div>
        ) : null}
        {whatsConvidado ? (
          // Sem serviço de mensagens até o domínio (P13): o convidado manda para si mesmo.
          <a className="botao whatsapp" href={`https://wa.me/${whatsConvidado}?text=${encodeURIComponent(confirmada.mensagem_confirmacao)}`} target="_blank" rel="noopener noreferrer">
            Guardar no meu WhatsApp
          </a>
        ) : null}
        <button className="botao contornado" onClick={() => setDesfazer(true)}>
          Desfazer reserva
        </button>
        <a className="botao texto" href={voltar}>
          Voltar para a lista
        </a>
        {erro ? <p className="campo"><span className="erro">{erro}</span></p> : null}
        {desfazer ? (
          <Dialogo id="t40" titulo="Desfazer a reserva?" onCancelar={() => setDesfazer(false)}>
              <p className="suave">
                {n === 1 ? `${confirmada.item} volta` : `Os ${n} ${confirmada.item.toLocaleLowerCase('pt-BR')} voltam`} a aparecer na lista para outros convidados.
              </p>
              <div className="botoes">
                <button className="botao contornado" onClick={() => setDesfazer(false)}>
                  Manter
                </button>
                <button className="botao" onClick={confirmarDesfazer} disabled={enviando}>
                  Desfazer
                </button>
              </div>
            </Dialogo>
        ) : null}
      </section>
    );
  }

  return (
    <>
      <div className="campo">
        <label id="qtd">Quantos você vai dar? (faltam {presente.faltam})</label>
        <div className="contador" role="group" aria-labelledby="qtd">
          <button type="button" aria-label="Menos" onClick={() => setQtd((q) => Math.max(1, q - 1))} disabled={qtd <= 1}>
            −
          </button>
          <output aria-live="polite">{qtd}</output>
          <button type="button" aria-label="Mais" onClick={() => setQtd((q) => Math.min(presente.faltam, q + 1))} disabled={qtd >= presente.faltam}>
            +
          </button>
        </div>
      </div>
      <div className="campo">
        <label htmlFor="nome">Seu nome</label>
        <input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Como o casal te conhece" maxLength={60} autoComplete="name" />
        {tentou && erroNome ? <span className="erro">{erroNome}</span> : null}
      </div>
      <div className="campo">
        <label htmlFor="whatsapp">WhatsApp (opcional)</label>
        <input id="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(mascara(e.target.value))} placeholder="(41) 90000-0000" inputMode="tel" autoComplete="tel" />
        {tentou && erroWhats ? <span className="erro">{erroWhats}</span> : <span className="ajuda">Para lembrarmos você antes da reserva expirar.</span>}
      </div>
      <div className="campo">
        <label htmlFor="mensagem">Mensagem para o casal (opcional)</label>
        <textarea id="mensagem" value={mensagem} onChange={(e) => setMensagem(e.target.value.slice(0, 300))} maxLength={300} />
      </div>
      {erro ? <p className="campo"><span className="erro">{erro}</span></p> : null}
      <div className="rodape-fixo" style={{ margin: '0 calc(-1 * var(--space-4))' }}>
        <button className="botao" onClick={reservar} disabled={enviando}>
          {enviando ? 'Reservando…' : 'Reservar presente'}
        </button>
      </div>
      {esgotou ? (
        <Dialogo id="t51" titulo="Alguém reservou antes">
            <p className="suave">
              {presente.nome} acabou de ser reservado por outro convidado. Que tal escolher outro presente?
            </p>
            <a className="botao" href={voltar}>
              Ver outros presentes
            </a>
          </Dialogo>
      ) : null}
    </>
  );
}
