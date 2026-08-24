import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from '../lib/auth.js';

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization;
  if (!header || !/^Bearer [^\s]+$/.test(header)) {
    reply.code(401).send({ error: 'Unauthorized' });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    request.user = payload;
  } catch {
    reply.code(401).send({ error: 'Invalid token' });
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      sub: string;
      role: string;
    };
  }
}
