'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/** T40 · "Desfazer a reserva?" na página de gerenciar a reserva. */
export function BotaoDesfazer({ token, item, quantidade }: { token: string; item: string; quantidade: number }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const desfazer = async () => {
    setEnviando(true);
    const r = await fetch(`/api/reservas/${encodeURIComponent(token)}/desfazer`, { method: 'POST' }).catch(() => null);
    setEnviando(false);
    setAberto(false);
    if (r && (r.ok || r.status === 409)) router.refresh();
    else setErro('Não foi possível desfazer agora. Tente de novo.');
  };
  return (
    <>
      <button className="botao contornado" onClick={() => setAberto(true)}>
        Desfazer reserva
      </button>
      {erro ? <span className="campo"><span className="erro">{erro}</span></span> : null}
      {aberto ? (
        <div className="veu" role="alertdialog" aria-modal aria-labelledby="t40">
          <div className="dialogo">
            <h2 id="t40">Desfazer a reserva?</h2>
            <p className="suave">
              {quantidade === 1 ? `${item} volta` : `Os ${quantidade} ${item.toLocaleLowerCase('pt-BR')} voltam`} a aparecer na lista para outros convidados.
            </p>
            <div className="botoes">
              <button className="botao contornado" onClick={() => setAberto(false)}>
                Manter
              </button>
              <button className="botao" onClick={desfazer} disabled={enviando}>
                Desfazer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
