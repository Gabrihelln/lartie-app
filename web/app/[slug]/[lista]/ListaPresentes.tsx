'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { Presente } from '../../../lib/api';

/** Lista com o filtro por cômodo. Ao voltar para a página, atualiza a disponibilidade (T25). */
export function ListaPresentes({ slug, lista, presentes }: { slug: string; lista: string; presentes: Presente[] }) {
  const router = useRouter();
  const [comodo, setComodo] = useState<string | null>(null);
  useEffect(() => {
    const atualizar = () => document.visibilityState === 'visible' && router.refresh();
    document.addEventListener('visibilitychange', atualizar);
    window.addEventListener('pageshow', atualizar);
    return () => {
      document.removeEventListener('visibilitychange', atualizar);
      window.removeEventListener('pageshow', atualizar);
    };
  }, [router]);
  const comodos = useMemo(() => [...new Set(presentes.map((p) => p.comodo).filter((c): c is string => !!c))], [presentes]);
  const visiveis = comodo ? presentes.filter((p) => p.comodo === comodo) : presentes;
  const total = presentes.length;

  return (
    <section className="conteudo">
      <h2>{total === 0 ? 'Todos os presentes já foram escolhidos' : total === 1 ? 'Ainda falta 1 presente' : `Ainda faltam ${total} presentes`}</h2>
      {total === 0 ? <p className="suave">Obrigado por passar aqui! Fale direto com o casal se quiser presentear de outro jeito.</p> : null}
      {comodos.length > 1 ? (
        <div className="chips" role="group" aria-label="Filtrar por cômodo">
          <button className="chip" aria-pressed={comodo === null} onClick={() => setComodo(null)}>
            Todos
          </button>
          {comodos.map((c) => (
            <button key={c} className="chip" aria-pressed={comodo === c} onClick={() => setComodo(c)}>
              {c}
            </button>
          ))}
        </div>
      ) : null}
      <div className="grade">
        {visiveis.map((p) => (
          <article key={p.id} className="cartao">
            <div className="foto">
              {p.foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/foto/${encodeURIComponent(slug)}/${encodeURIComponent(lista)}/${encodeURIComponent(p.id)}`} alt={p.nome} loading="lazy" />
              ) : (
                <IconePresente />
              )}
            </div>
            <div className="corpo">
              <span className="nome-item">{p.nome}</span>
              <span className="suave">
                {p.comodo ? `${p.comodo} · ` : ''}
                {p.faltam === 1 ? 'falta 1' : `faltam ${p.faltam}`}
              </span>
              <Link className="botao pequeno" href={`/${encodeURIComponent(slug)}/${encodeURIComponent(lista)}/reservar/${encodeURIComponent(p.id)}`}>
                Reservar
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/** Ícone de presente (Material Symbols "redeem") quando o item não tem foto. Sem emojis na interface. */
export function IconePresente() {
  return (
    <svg aria-hidden width="40" height="40" viewBox="0 -960 960 960" fill="currentColor">
      <path d="M160-280v80h640v-80H160Zm0-440h88q-5-9-6.5-19t-1.5-21q0-50 35-85t85-35q30 0 55.5 15.5T460-826l20 26 20-26q18-24 44-39t56-15q50 0 85 35t35 85q0 11-1.5 21t-6.5 19h88q33 0 56.5 23.5T880-640v440q0 33-23.5 56.5T800-120H160q-33 0-56.5-23.5T80-200v-440q0-33 23.5-56.5T160-720Zm0 320h640v-240H596l84 114-64 46-136-184-136 184-64-46 82-114H160v240Zm200-320q17 0 28.5-11.5T400-760q0-17-11.5-28.5T360-800q-17 0-28.5 11.5T320-760q0 17 11.5 28.5T360-720Zm240 0q17 0 28.5-11.5T640-760q0-17-11.5-28.5T600-800q-17 0-28.5 11.5T560-760q0 17 11.5 28.5T600-720Z" />
    </svg>
  );
}
