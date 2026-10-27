'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Presenca, RestricaoAlimentar } from '@lartie/modelo';
import type { PaginaRsvp } from '../../../../lib/api';

// T30: cada pessoa marca "Vou" ou "Não vou"; quem vai escolhe a restrição alimentar. "Enviar
// confirmação" exige resposta para todas. Depois de enviar: "Presença confirmada", "Ver lista de
// presentes" (do casamento, se publicada) e "Alterar resposta". Depois do prazo: só leitura.

const RESTRICOES: { valor: RestricaoAlimentar; rotulo: string }[] = [
  { valor: 'nenhuma', rotulo: 'Sem restrição alimentar' },
  { valor: 'vegetariano', rotulo: 'Vegetariano' },
  { valor: 'vegano', rotulo: 'Vegano' },
  { valor: 'sem_gluten', rotulo: 'Sem glúten' },
  { valor: 'sem_lactose', rotulo: 'Sem lactose' },
  { valor: 'outra', rotulo: 'Outra' },
];

type Resposta = { presenca: Presenca; restricao: RestricaoAlimentar; restricao_outra: string };

export function FormularioRsvp({ token, dados, prazo, linkLista }: { token: string; dados: PaginaRsvp; prazo: string | null; linkLista: string | null }) {
  const router = useRouter();
  const [respostas, setRespostas] = useState<Record<string, Resposta>>(() =>
    Object.fromEntries(dados.pessoas.map((p) => [p.id, { presenca: p.presenca, restricao: p.restricao, restricao_outra: p.restricao_outra ?? '' }])),
  );
  const [recado, setRecado] = useState(dados.recado ?? '');
  const [enviado, setEnviado] = useState<{ vao: number; total: number } | null>(dados.respondido ? { vao: dados.pessoas.filter((p) => p.presenca === 'vai').length, total: dados.pessoas.length } : null);
  const [editando, setEditando] = useState(!dados.respondido);
  const [tentou, setTentou] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const somenteLeitura = dados.encerrado;
  const faltam = dados.pessoas.filter((p) => respostas[p.id]?.presenca === 'sem_resposta').length;

  const mudar = (id: string, campos: Partial<Resposta>) => setRespostas((r) => ({ ...r, [id]: { ...r[id]!, ...campos } }));

  const enviar = async () => {
    setTentou(true);
    if (faltam || enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      const r = await fetch(`/api/rsvp/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          respostas: dados.pessoas.map((p) => ({ id: p.id, presenca: respostas[p.id]!.presenca, restricao: respostas[p.id]!.restricao, restricao_outra: respostas[p.id]!.restricao_outra || null })),
          recado: recado.trim() || null,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.status === 409) return router.refresh();
      if (!r.ok) throw new Error(j.erro);
      setEnviado(j);
      setEditando(false);
      window.scrollTo({ top: 0 });
    } catch {
      setErro('Não foi possível enviar agora. Confira a internet e tente de novo.');
    } finally {
      setEnviando(false);
    }
  };

  if (enviado && !editando) {
    return (
      <section className="conteudo">
        <div className="estado" style={{ flex: 'none', padding: 'var(--space-6) 0' }} aria-live="polite">
          <div className="icone-estado" aria-hidden>
            ✓
          </div>
          <h2>{enviado.vao === 0 ? 'Resposta enviada' : 'Presença confirmada'}</h2>
          <p className="suave">
            {enviado.vao} de {enviado.total} {enviado.total === 1 ? 'pessoa vai' : 'pessoas vão'}.{' '}
            {somenteLeitura ? 'O prazo terminou. Fale direto com os noivos.' : 'Você pode mudar a resposta por este mesmo link até o prazo.'}
          </p>
        </div>
        {linkLista ? (
          <a className="botao" href={linkLista}>
            Ver lista de presentes
          </a>
        ) : null}
        {somenteLeitura ? null : (
          <button className="botao contornado" onClick={() => setEditando(true)}>
            Alterar resposta
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="conteudo">
      <div>
        <h2>{dados.grupo}</h2>
        {prazo ? <p className="suave" style={{ margin: 'var(--space-1) 0 0' }}>{somenteLeitura ? 'O prazo terminou. Fale direto com os noivos.' : `Confirme até ${prazo}`}</p> : null}
      </div>
      {dados.pessoas.map((p) => {
        const r = respostas[p.id]!;
        return (
          <div key={p.id} className="cartao pessoa-rsvp">
            <div className="linha-rsvp">
              <strong className="nome-item">{p.nome}</strong>
              <div role="radiogroup" aria-label={`Presença de ${p.nome}`} className="opcoes-rsvp">
                {(['vai', 'nao_vai'] as const).map((v) => (
                  <button
                    key={v}
                    role="radio"
                    aria-checked={r.presenca === v}
                    disabled={somenteLeitura}
                    onClick={() => mudar(p.id, { presenca: v })}
                    className={`opcao-rsvp${r.presenca === v ? (v === 'vai' ? ' vai' : ' nao-vai') : ''}`}
                  >
                    {v === 'vai' ? 'Vou' : 'Não vou'}
                  </button>
                ))}
              </div>
            </div>
            {r.presenca === 'vai' ? (
              <div className="campo">
                <label htmlFor={`r-${p.id}`} className="so-leitor">
                  Restrição alimentar de {p.nome}
                </label>
                <select
                  id={`r-${p.id}`}
                  value={r.restricao}
                  disabled={somenteLeitura}
                  onChange={(e) => mudar(p.id, { restricao: e.target.value as RestricaoAlimentar })}
                >
                  {RESTRICOES.map((x) => (
                    <option key={x.valor} value={x.valor}>
                      {x.rotulo}
                    </option>
                  ))}
                </select>
                {r.restricao === 'outra' ? (
                  <input
                    value={r.restricao_outra}
                    disabled={somenteLeitura}
                    onChange={(e) => mudar(p.id, { restricao_outra: e.target.value.slice(0, 80) })}
                    placeholder="Qual restrição?"
                    aria-label={`Qual restrição de ${p.nome}`}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
      <div className="campo">
        <label htmlFor="recado">Recado para os noivos (opcional)</label>
        <textarea id="recado" value={recado} disabled={somenteLeitura} onChange={(e) => setRecado(e.target.value.slice(0, 500))} maxLength={500} />
      </div>
      {tentou && faltam ? (
        <p className="campo">
          <span className="erro">Respondam por todas as pessoas do grupo ({faltam === 1 ? 'falta 1' : `faltam ${faltam}`}).</span>
        </p>
      ) : null}
      {erro ? (
        <p className="campo">
          <span className="erro">{erro}</span>
        </p>
      ) : null}
      {somenteLeitura ? null : (
        <div className="rodape-fixo" style={{ margin: '0 calc(-1 * var(--space-4))' }}>
          <button className="botao" onClick={enviar} disabled={enviando}>
            {enviando ? 'Enviando…' : 'Enviar confirmação'}
          </button>
        </div>
      )}
    </section>
  );
}
