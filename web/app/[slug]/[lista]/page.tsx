import type { Metadata } from 'next';
import { dataPorExtenso } from '@lartie/regras';
import { buscar, caminhoLista, type PaginaLista } from '../../../lib/api';
import { CabecalhoCasal, LinkInativo, Rodape } from '../../componentes/Comum';
import { ListaPresentes } from './ListaPresentes';

// T25 · Página pública da lista (PaginaConvidado.dc.html) — lartie.app/{slug}/{slug_lista}.
// Renderizada no servidor a cada visita (carrega rápido no celular). Itens esgotados não aparecem.

type Props = { params: Promise<{ slug: string; lista: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, lista } = await params;
  const dados = await buscar<PaginaLista>(caminhoLista(slug, lista)).catch(() => null);
  if (!dados) return { title: 'Lartiê' };
  const nomes = dados.casal.nome_2 ? `${dados.casal.nome_1} & ${dados.casal.nome_2}` : dados.casal.nome_1;
  return { title: `${dados.nome_ocasiao} · ${nomes}`, description: 'Escolha um presente e reserve para não repetir.' };
}

export default async function Pagina({ params }: Props) {
  const { slug, lista } = await params;
  const dados = await buscar<PaginaLista>(caminhoLista(slug, lista));
  if (!dados) return <LinkInativo />;
  return (
    <main className="pagina">
      <CabecalhoCasal
        nome1={dados.casal.nome_1}
        nome2={dados.casal.nome_2}
        ocasiao={dados.nome_ocasiao}
        data={dados.data_evento ? dataPorExtenso(dados.data_evento) : null}
        mensagem={dados.mensagem}
      />
      <ListaPresentes slug={slug} lista={lista} presentes={dados.presentes} />
      <Rodape />
    </main>
  );
}
