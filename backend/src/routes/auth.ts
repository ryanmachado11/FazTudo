import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { hashPassword, verifyPassword, signAccessToken, signRefreshToken } from '../lib/auth.js';
import { requireAuth } from '../middleware/auth.js';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(8),
  role: z.enum(['CLIENT', 'PROVIDER']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function authRoutes(app: FastifyInstance) {
  function sendFieldError(reply: any, statusCode: number, fieldErrors: Record<string, string[]>, message: string) {
    return reply.code(statusCode).send({
      error: message,
      issues: {
        fieldErrors,
        formErrors: [],
      },
    });
  }

  app.post('/register', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid payload', issues: parsed.error.flatten() });
    }

    const { name, email, phone, password, role = 'CLIENT' } = parsed.data;

    const [existingEmail, existingPhone] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.user.findUnique({ where: { phone } }),
    ]);

    const fieldErrors: Record<string, string[]> = {};
    if (existingEmail) {
      fieldErrors.email = ['Este e-mail já está em uso.'];
    }
    if (existingPhone) {
      fieldErrors.phone = ['Este celular já está em uso.'];
    }
    if (Object.keys(fieldErrors).length > 0) {
      return sendFieldError(reply, 409, fieldErrors, 'Dados já cadastrados');
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        role: role === 'PROVIDER' ? 'PROVIDER' : 'CLIENT',
      },
    });

    return reply.code(201).send({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });

  app.post('/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid payload' });
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    const valid = await verifyPassword(user.passwordHash, password);
    if (!valid) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    const payload = { sub: user.id, role: user.role, email: user.email };
    return {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  });

  app.get('/me', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
    if (!dbUser) {
      return reply.code(404).send({ error: 'User not found' });
    }

    return {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
    };
  });
}
