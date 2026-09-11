import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/prisma.js';
import { verifyAccessToken } from '../lib/auth.js';

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization;
  if (!header || !/^Bearer [^\s]+$/.test(header)) {
    reply.code(401).send({ error: 'Unauthorized' });
    return;
  }

  const token = header.slice(7);
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    reply.code(401).send({ error: 'Invalid token' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, isActive: true, role: true },
    });

    if (!user || !user.isActive) {
      reply.code(401).send({ error: 'Unauthorized' });
      return;
    }

    request.user = {
      sub: user.id,
      role: user.role,
    };
  } catch {
    reply.code(503).send({ error: 'Authentication service unavailable' });
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
