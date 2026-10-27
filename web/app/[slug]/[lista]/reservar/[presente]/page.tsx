import Link from 'next/link';
import { buscar, caminhoLista, reais, type PaginaLista } from '../../../../../lib/api';
import { LinkInativo, Rodape } from '../../../../componentes/Comum';
import { IconePresente } from '../../ListaPresentes';
import { FormularioReserva } from './FormularioReserva';

// T26 · Reservar presente (Reservar.dc.html). Se o presente acabou enquanto a pessoa navegava,
// mostra T51 ("Alguém reservou antes") com "Ver outros presentes".

type Props = { params: Promise<{ slug: string; lista: string; presente: string }> };

export default async function Pagina({ params }: Props) {
  const { slug, lista, presente } = await params;
  const dados = await buscar<PaginaLista>(caminhoLista(slug, lista));
  if (!dados) return <LinkInativo />;
  const voltar = `/${encodeURIComponent(slug)}/${encodeURIComponent(lista)}`;
  const p = dados.presentes.find((x) => x.id === presente);
  if (!p) {
    return (
      <main className="pagina">
        <section className="estado">
          <h2>Alguém reservou antes</h2>
          <p className="suave">Este presente acabou de ser reservado por outro convidado. Que tal escolher outro presente?</p>
          <Link href={voltar} className="botao" style={{ maxWidth: 320 }}>
            Ver outros presentes
          </Link>
        </section>
      </main>
    );
  }
  const casal = dados.casal.nome_2 ? `${dados.casal.nome_1} e ${dados.casal.nome_2}` : dados.casal.nome_1;
  return (
    <main className="pagina">
      <section className="conteudo">
        <Link href={voltar} className="voltar" aria-label="Voltar para a lista">
          ‹
        </Link>
        <div className="cartao">
          <div className="foto" style={{ aspectRatio: '16 / 9' }}>
            {p.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/foto/${encodeURIComponent(slug)}/${encodeURIComponent(lista)}/${encodeURIComponent(p.id)}`} alt={p.nome} />
            ) : (
              <IconePresente />
            )}
          </div>
        </div>
        <div>
          <h1>{p.nome}</h1>
          <p className="suave" style={{ margin: 'var(--space-1) 0 0' }}>
            {[p.comodo, p.preco ? `preço de referência ${reais(p.preco)} cada` : null].filter(Boolean).join(' · ')}
          </p>
          {p.link ? (
            <p style={{ margin: 'var(--space-2) 0 0' }}>
              <a href={p.link} target="_blank" rel="noopener noreferrer nofollow">
                Ver sugestão na loja
              </a>
            </p>
          ) : null}
        </div>
        <FormularioReserva slug={slug} lista={lista} presente={p} casal={casal} voltar={voltar} />
      </section>
      <Rodape />
    </main>
  );
}
