import 'dotenv/config';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { registerRoutes } from './routes/index.js';

const app = Fastify({
  logger: true,
});

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : null;

function applyCorsHeaders(request: FastifyRequest, reply: FastifyReply) {
  const origin = request.headers.origin;
  if (!origin) {
    return;
  }

  const allowAll = !allowedOrigins;
  const isAllowed = allowAll || allowedOrigins?.includes(origin);
  if (!isAllowed) {
    return;
  }

  reply.header('Access-Control-Allow-Origin', allowAll ? '*' : origin);
  reply.header('Vary', 'Origin');
  reply.header('Access-Control-Allow-Credentials', 'true');
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  reply.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
}

app.addHook('onRequest', async (request, reply) => {
  applyCorsHeaders(request, reply);
  if (request.method === 'OPTIONS') {
    return reply.code(204).send();
  }
});

app.get('/health', async () => ({ ok: true, service: 'faztudo-backend' }));

app.get('/docs', async () => {
  const file = await readFile(join(process.cwd(), 'docs', 'openapi.json'), 'utf8');
  return JSON.parse(file);
});

await registerRoutes(app);

const port = Number(process.env.PORT || 3001);

try {
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`API listening on http://localhost:${port}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
