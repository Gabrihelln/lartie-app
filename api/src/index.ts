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
