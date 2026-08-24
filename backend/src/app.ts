import Fastify from 'fastify';
import cors from '@fastify/cors';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { registerRoutes } from './routes/index.js';

function configuredOrigins() {
  const configured = process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()).filter(Boolean);
  if (configured?.length) return new Set(configured);
  if (process.env.NODE_ENV === 'production') return new Set<string>();
  return new Set(['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173']);
}

export async function buildApp() {
  const app = Fastify({
    bodyLimit: 64 * 1024,
    logger: process.env.NODE_ENV !== 'test',
    trustProxy: process.env.TRUST_PROXY === 'true' ? 1 : false,
  });
  const origins = configuredOrigins();

  await app.register(cors, {
    credentials: false,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    origin(origin, callback) {
      callback(null, !origin || origins.has(origin));
    },
  });

  app.addHook('onSend', async (request, reply) => {
    const isPublicCatalog = request.method === 'GET'
      && (request.url.startsWith('/api/categories') || request.url.startsWith('/api/providers'));
    reply.header('Cache-Control', isPublicCatalog ? 'public, max-age=60, stale-while-revalidate=300' : 'no-store');
    reply.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    reply.header('Cross-Origin-Resource-Policy', 'same-site');
    reply.header('Referrer-Policy', 'no-referrer');
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
  });

  app.get('/health', async () => ({ ok: true, service: 'faztudo-backend' }));
  let openApiDocument: unknown;
  app.get('/docs', async () => {
    openApiDocument ??= JSON.parse(await readFile(join(process.cwd(), 'docs', 'openapi.json'), 'utf8'));
    return openApiDocument;
  });
  await registerRoutes(app);
  return app;
}
