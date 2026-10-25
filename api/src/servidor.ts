import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import multipart from '@fastify/multipart';
import { CLAIM_CASAL } from '@lartie/modelo';
import { ErroValidacao, inicializarConta, type DadosToken } from './conta';
import { aceitarConvite, consultarConvite, criarConvite, ErroConvite } from './convites';
import { abrirArquivo, ErroArquivo, removerFotoCasal, salvarFotoCasal, TAMANHO_MAXIMO } from './fotos';
import { auth, PROJETO } from './firebase';
import { gerarPlano } from './plano';

// API v1. As rotas do casal exigem o ID token do Firebase em "Authorization: Bearer …"; a API nunca
// confia num uid ou casal enviado pelo app: os dois vêm do token verificado.

declare module 'fastify' {
  interface FastifyRequest {
    token?: DadosToken;
    casalId?: string;
  }
}

async function exigirLogin(req: FastifyRequest, resposta: FastifyReply) {
  const cabecalho = req.headers.authorization ?? '';
  const idToken = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7) : '';
  if (!idToken) return resposta.code(401).send({ erro: 'sem_token' });
  try {
    const t = await auth.verifyIdToken(idToken);
    req.token = { uid: t.uid, email: t.email, name: t.name, provedor: t.firebase.sign_in_provider };
    const casal = t[CLAIM_CASAL];
    req.casalId = typeof casal === 'string' ? casal : undefined;
  } catch {
    return resposta.code(401).send({ erro: 'token_invalido' });
  }
}

/** Login e casal (claim casal_id): rotas que mexem nos dados do casal. */
async function exigirCasal(req: FastifyRequest, resposta: FastifyReply) {
  await exigirLogin(req, resposta);
  if (resposta.sent) return;
  if (!req.casalId) return resposta.code(403).send({ erro: 'sem_casal' });
}

const STATUS_CONVITE: Record<ErroConvite['codigo'], number> = {
  nao_encontrado: 404,
  expirado: 410,
  usado: 410,
  proprio_casal: 409,
  casal_completo: 409,
  sem_permissao: 403,
};

export function criarServidor() {
  const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? 'info' } });
  app.register(multipart, { limits: { fileSize: TAMANHO_MAXIMO, files: 1 } });

  app.setErrorHandler((erro, _req, resposta) => {
    if (erro instanceof ErroValidacao) return resposta.code(400).send({ erro: 'validacao', mensagem: erro.message });
    if (erro instanceof ErroConvite) return resposta.code(STATUS_CONVITE[erro.codigo]).send({ erro: erro.codigo });
    if (erro instanceof ErroArquivo) {
      return resposta.code(erro.codigo === 'nao_encontrado' ? 404 : 400).send({ erro: erro.codigo });
    }
    const status = (erro as { statusCode?: number }).statusCode;
    if (status && status < 500) return resposta.code(status).send({ erro: 'requisicao_invalida' });
    app.log.error(erro);
    return resposta.code(500).send({ erro: 'interno' });
  });

  app.get('/health', async () => ({ ok: true, projeto: PROJETO }));

  // Etapa 1: casal e usuário noivo_1 depois do cadastro.
  app.post<{ Body: { nome?: string } | undefined }>(
    '/v1/conta/inicializar',
    {
      preHandler: exigirLogin,
      schema: {
        body: { type: ['object', 'null'], properties: { nome: { type: 'string', maxLength: 200 } }, additionalProperties: false },
      },
    },
    async (req) => inicializarConta(req.token!, req.body?.nome),
  );

  // T10: gera checklist, enxoval e categorias dos módulos ativos.
  app.post('/v1/plano/gerar', { preHandler: exigirCasal }, async (req) => gerarPlano(req.token!.uid, req.casalId!));

  // T11: convite do parceiro.
  app.post('/v1/convites', { preHandler: exigirCasal }, async (req) => criarConvite(req.token!, req.casalId!));

  // T66: consulta pública (sem login) de quem convidou e se o convite vale.
  app.get<{ Params: { codigo: string } }>('/v1/convites/:codigo', async (req) => consultarConvite(req.params.codigo));

  app.post<{ Params: { codigo: string }; Body: { nome?: string } | undefined }>(
    '/v1/convites/:codigo/aceitar',
    {
      preHandler: exigirLogin,
      schema: {
        body: { type: ['object', 'null'], properties: { nome: { type: 'string', maxLength: 200 } }, additionalProperties: false },
      },
    },
    async (req) => aceitarConvite(req.token!, req.params.codigo, req.body?.nome),
  );

  // T06: foto do casal.
  app.post('/v1/casal/foto', { preHandler: exigirCasal }, async (req, resposta) => {
    const arquivo = await req.file();
    if (!arquivo) return resposta.code(400).send({ erro: 'sem_arquivo' });
    const conteudo = await arquivo.toBuffer();
    return salvarFotoCasal(req.token!.uid, req.casalId!, conteudo, arquivo.mimetype);
  });

  app.delete('/v1/casal/foto', { preHandler: exigirCasal }, async (req) => {
    await removerFotoCasal(req.token!.uid, req.casalId!);
    return { ok: true };
  });

  // Arquivos do casal: só quem é do casal lê.
  app.get<{ Params: { casal: string; arquivo: string } }>(
    '/v1/arquivos/:casal/:arquivo',
    { preHandler: exigirCasal },
    async (req, resposta) => {
      if (req.params.casal !== req.casalId) return resposta.code(404).send({ erro: 'nao_encontrado' });
      const { fluxo, tipo } = abrirArquivo(req.params.casal, req.params.arquivo);
      return resposta.header('cache-control', 'private, max-age=86400').type(tipo).send(fluxo);
    },
  );

  return app;
}
