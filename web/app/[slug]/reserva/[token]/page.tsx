import Link from 'next/link';
import { buscar, caminhoReserva, type ReservaConsultada } from '../../../../lib/api';
import { LinkInativo, Rodape } from '../../../componentes/Comum';
import { BotaoDesfazer } from './BotaoDesfazer';

// lartie.app/{slug}/reserva/{token}: o link da confirmação no WhatsApp, para ver e desfazer a reserva.

export default async function Pagina({ params }: { params: Promise<{ slug: string; token: string }> }) {
  const { token } = await params;
  const r = await buscar<ReservaConsultada>(caminhoReserva(token));
  if (!r) return <LinkInativo />;
  const linkLista = r.lista ? `/${encodeURIComponent(r.lista.slug)}/${encodeURIComponent(r.lista.slug_lista)}` : null;
  const ativa = r.status === 'ativa';
  const situacao: Record<string, string> = {
    ativa: `Vale até ${r.expira_em}.`,
    recebida: 'O casal já recebeu este presente. Obrigado!',
    expirada: 'Esta reserva expirou e o presente voltou para a lista.',
    cancelada: 'Esta reserva foi desfeita.',
  };
  return (
    <main className="pagina">
      <section className="conteudo">
        <h1>Sua reserva</h1>
        <div className="bloco">
          <strong>
            {r.quantidade} {r.item}
          </strong>
          <p style={{ margin: 'var(--space-1) 0 0' }} className="suave">
            Para {r.casal}, reservado por {r.nome}. {situacao[r.status]}
          </p>
        </div>
        {ativa && r.entrega ? (
          <div className="bloco">
            <strong>Entrega</strong>
            <p style={{ margin: 'var(--space-1) 0 0' }}>{r.entrega}</p>
          </div>
        ) : null}
        {ativa ? <BotaoDesfazer token={token} item={r.item} quantidade={r.quantidade} /> : null}
        {linkLista ? (
          <Link href={linkLista} className="botao texto">
            Ver a lista {r.lista ? `do ${r.lista.nome.toLocaleLowerCase('pt-BR')}` : ''}
          </Link>
        ) : null}
      </section>
      <Rodape />
    </main>
  );
}
