import { rotinaDeReservas } from './presentes';
import { criarServidor } from './servidor';

// Na VPS, a API escuta só em 127.0.0.1 (o nginx publica com HTTPS). No Mac, 0.0.0.0 deixa o
// simulador e um iPhone na mesma rede chegarem até ela.
const porta = Number(process.env.API_PORT ?? 8100);
const host = process.env.API_HOST ?? '0.0.0.0';

const app = criarServidor();
app.listen({ port: porta, host }).catch((erro) => {
  app.log.error(erro);
  process.exit(1);
});

// 13.5: expiração das reservas (15 dias) e aviso 2 dias antes, a cada 10 minutos.
const DEZ_MINUTOS = 10 * 60 * 1000;
const rodar = () =>
  rotinaDeReservas()
    .then((r) => (r.expiradas || r.avisadas) && app.log.info(r, 'rotina de reservas'))
    .catch((erro) => app.log.error(erro, 'rotina de reservas'));
setTimeout(rodar, 30_000);
setInterval(rodar, DEZ_MINUTOS);
