import { Rodape } from './componentes/Comum';

// "Conhecer o Lartiê" (T52) e o link do rodapé. A página do app nas lojas entra na Etapa 10.
export default function Inicio() {
  return (
    <main className="pagina">
      <section className="estado">
        <h1 className="marca" style={{ fontSize: 44 }}>
          Lartiê
        </h1>
        <p className="suave">Casamento e casa nova, num só lugar. O app chega em breve à App Store e ao Google Play.</p>
      </section>
      <Rodape />
    </main>
  );
}
