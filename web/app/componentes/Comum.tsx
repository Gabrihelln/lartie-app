import Link from 'next/link';

/** Rodapé das páginas do convidado: "Lista feita com Lartiê" (Seção 10). */
export function Rodape() {
  return (
    <footer className="rodape">
      Lista feita com{' '}
      <Link href="/" className="marca">
        Lartiê
      </Link>
    </footer>
  );
}

/** T52 · Link inativo: lista despublicada, excluída ou inexistente. */
export function LinkInativo() {
  return (
    <main className="pagina">
      <section className="estado">
        <div className="icone-estado" aria-hidden>
          !
        </div>
        <h2>Este link não está mais ativo</h2>
        <p className="suave">A lista pode ter sido despublicada pelos noivos. Peça um novo link a eles.</p>
        <Link href="/" className="botao" style={{ maxWidth: 320 }}>
          Conhecer o Lartiê
        </Link>
      </section>
    </main>
  );
}

const inicial = (n: string) => n.trim().charAt(0).toLocaleUpperCase('pt-BR') || '?';

/** Cabeçalho da página da lista: avatares, ocasião, nomes, data e a mensagem do casal (T25). */
export function CabecalhoCasal({
  nome1,
  nome2,
  ocasiao,
  data,
  mensagem,
}: {
  nome1: string;
  nome2: string | null;
  ocasiao: string;
  data: string | null;
  mensagem: string | null;
}) {
  return (
    <header className="cabecalho-casal">
      <div className="avatares" aria-hidden>
        <span className="avatar um">{inicial(nome1)}</span>
        {nome2 ? <span className="avatar dois">{inicial(nome2)}</span> : null}
      </div>
      <span className="sobretitulo">{ocasiao}</span>
      <h1>{nome2 ? `${nome1} & ${nome2}` : nome1}</h1>
      {data ? <span className="suave">{data}</span> : null}
      <p className="suave" style={{ margin: 'var(--space-2) 0 0', maxWidth: 420 }}>
        {mensagem ?? 'Estamos montando nosso primeiro lar. Escolha um presente abaixo e reserve para não repetir.'}
      </p>
    </header>
  );
}
