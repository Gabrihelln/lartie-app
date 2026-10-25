import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import { ErroValidacao, inicializarConta, type DadosToken } from './conta';
import { auth, PROJETO } from './firebase';

// API v1. Toda rota do casal exige o ID token do Firebase em "Authorization: Bearer …";
// a API nunca confia num uid enviado pelo app.

declare module 'fastify' {
  interface FastifyRequest {
    token?: DadosToken;
  }
}

async function exigirLogin(req: FastifyRequest, resposta: FastifyReply) {
  const cabecalho = req.headers.authorization ?? '';
  const idToken = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7) : '';
  if (!idToken) return resposta.code(401).send({ erro: 'sem_token' });
  try {
    const t = await auth.verifyIdToken(idToken);
    req.token = { uid: t.uid, email: t.email, name: t.name, provedor: t.firebase.sign_in_provider };
  } catch {
    return resposta.code(401).send({ erro: 'token_invalido' });
  }
}

export function criarServidor() {
  const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? 'info' } });

  app.get('/health', async () => ({ ok: true, projeto: PROJETO }));

  app.post<{ Body: { nome?: string } | undefined }>(
    '/v1/conta/inicializar',
    {
      preHandler: exigirLogin,
      schema: {
        body: {
          type: ['object', 'null'],
          properties: { nome: { type: 'string', maxLength: 200 } },
          additionalProperties: false,
        },
      },
    },
    async (req, resposta) => {
      try {
        return await inicializarConta(req.token!, req.body?.nome);
      } catch (erro) {
        if (erro instanceof ErroValidacao) return resposta.code(400).send({ erro: 'validacao', mensagem: erro.message });
        throw erro;
      }
    },
  );

  return app;
}
