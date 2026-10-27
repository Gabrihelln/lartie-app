import { dataPorExtenso } from '@lartie/regras';
import { buscar, caminhoRsvp, type PaginaRsvp } from '../../../../lib/api';
import { LinkInativo, Rodape } from '../../../componentes/Comum';
import { FormularioRsvp } from './FormularioRsvp';

// T30 · Confirmação de presença (RsvpConvidado.dc.html) — lartie.app/{slug}/rsvp/{token}.

export const metadata = { title: 'Confirmação de presença · Lartiê' };

export default async function Pagina({ params }: { params: Promise<{ slug: string; token: string }> }) {
  const { token } = await params;
  const d = await buscar<PaginaRsvp>(caminhoRsvp(token));
  if (!d) return <LinkInativo />;
  const nomes = d.casal.nome_2 ? `${d.casal.nome_1} & ${d.casal.nome_2}` : d.casal.nome_1;
  const quando = d.data ? `${dataPorExtenso(d.data)}${d.horario ? `, ${d.horario.replace(/:00$/, 'h').replace(':', 'h')}` : ''}` : null;
  const onde = [d.local, d.cidade && d.uf ? `${d.cidade}, ${d.uf}` : d.cidade].filter(Boolean).join(' · ');
  return (
    <main className="pagina">
      <header className="cabecalho-casal" style={{ paddingTop: 'var(--space-6)' }}>
        <span className="sobretitulo">Vocês estão convidados</span>
        <h1>{nomes}</h1>
        {quando ? <span className="suave">{quando}</span> : null}
        {onde ? <span className="suave">{onde}</span> : null}
      </header>
      <FormularioRsvp
        token={token}
        dados={d}
        prazo={d.prazo ? dataPorExtenso(d.prazo) : null}
        linkLista={d.lista ? `/${encodeURIComponent(d.lista.slug)}/${encodeURIComponent(d.lista.slug_lista)}` : null}
      />
      <Rodape />
    </main>
  );
}
