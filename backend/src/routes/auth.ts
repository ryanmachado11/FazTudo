import { Prisma } from '@prisma/client';
import { FastifyInstance, type FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { hashPassword, verifyPassword, signAccessToken } from '../lib/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { createRateLimit } from '../middleware/rate-limit.js';

const DUMMY_PASSWORD_HASH = '$argon2id$v=19$m=65536,p=4,t=3$EZPJf/FcpGcwlQv/PYA65Q$oCRRh4BZPQxzXb5s9LHcpFtUSyAs1Kzrs+F7dostk8M';
const normalizedEmail = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const normalizedPhone = z.string().transform((value) => value.replace(/\D/g, '')).pipe(z.string().regex(/^\d{10,15}$/));
const providerProfileSchema = z.object({
  categoryId: z.string().uuid(),
  bio: z.string().trim().max(5000),
  specialties: z.array(z.string().trim().min(1).max(100)).max(20),
  city: z.string().trim().max(120),
  neighborhood: z.string().trim().max(120),
  state: z.string().trim().length(2).transform((value) => value.toUpperCase()),
  hourlyRate: z.number().finite().min(0).max(100_000),
  isUrgentAvailable: z.boolean(),
}).strict();

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: normalizedEmail,
  phone: normalizedPhone,
  password: z.string().min(8).max(128),
  role: z.enum(['CLIENT', 'PROVIDER']).optional(),
  providerProfile: providerProfileSchema.optional(),
}).strict().superRefine((value, context) => {
  if (value.role === 'PROVIDER' && !value.providerProfile) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['providerProfile'],
      message: 'Provider profile is required',
    });
  }
});

const loginSchema = z.object({
  email: normalizedEmail,
  password: z.string().min(1).max(128),
}).strict();
const avatarSchema = z.object({
  avatarUrl: z.string().regex(/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/, 'Invalid image data'),
}).strict();
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

function decodeAvatar(avatarUrl: string) {
  return Buffer.from(avatarUrl.slice(avatarUrl.indexOf(',') + 1), 'base64');
}

function hasValidAvatarSignature(avatarUrl: string, bytes: Buffer) {
  if (avatarUrl.startsWith('data:image/jpeg;')) return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (avatarUrl.startsWith('data:image/png;')) return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (avatarUrl.startsWith('data:image/gif;')) return ['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString('ascii'));
  return avatarUrl.startsWith('data:image/webp;')
    && bytes.subarray(0, 4).toString('ascii') === 'RIFF'
    && bytes.subarray(8, 12).toString('ascii') === 'WEBP';
}

export async function authRoutes(app: FastifyInstance) {
  const registerRateLimit = createRateLimit({ limit: 5, windowMs: 60 * 60 * 1000 });
  const loginIpRateLimit = createRateLimit({ limit: 20, windowMs: 15 * 60 * 1000 });
  const loginAccountRateLimit = createRateLimit({
    limit: 10,
    windowMs: 15 * 60 * 1000,
    key: (request) => {
      const email = typeof (request.body as { email?: unknown })?.email === 'string'
        ? (request.body as { email: string }).email.trim().toLowerCase()
        : '<invalid-email>';
      return `${request.ip}:${email}`;
    },
  });

  function sendFieldError(reply: FastifyReply, statusCode: number, fieldErrors: Record<string, string[]>, message: string) {
    return reply.code(statusCode).send({
      error: message,
      issues: {
        fieldErrors,
        formErrors: [],
      },
    });
  }

  app.post('/register', { preHandler: registerRateLimit }, async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid payload', issues: parsed.error.flatten() });
    }

    const { name, email, phone, password, role = 'CLIENT', providerProfile } = parsed.data;

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

    let user;
    try {
      user = await prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            name,
            email,
            phone,
            passwordHash,
            role: role === 'PROVIDER' ? 'PROVIDER' : 'CLIENT',
          },
        });

        if (role === 'PROVIDER' && providerProfile) {
          const category = await tx.category.findFirst({
            where: { id: providerProfile.categoryId, isActive: true },
            select: { id: true },
          });
          if (!category) {
            const error = new Error('Provider category is invalid or inactive') as Error & { code: string };
            error.code = 'INVALID_PROVIDER_CATEGORY';
            throw error;
          }

          const profile = await tx.providerProfile.create({
            data: {
              userId: createdUser.id,
              bio: providerProfile.bio,
              specialties: providerProfile.specialties,
              city: providerProfile.city,
              neighborhood: providerProfile.neighborhood,
              state: providerProfile.state,
              hourlyRate: providerProfile.hourlyRate,
              isUrgentAvailable: providerProfile.isUrgentAvailable,
              isVerified: false,
            },
          });
          await tx.providerCategory.create({
            data: {
              providerProfileId: profile.id,
              categoryId: category.id,
            },
          });
        }

        return createdUser;
      });
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'INVALID_PROVIDER_CATEGORY') {
        return reply.code(400).send({ error: error.message });
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return reply.code(409).send({ error: 'Dados já cadastrados' });
      }
      throw error;
    }

    return reply.code(201).send({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });

  app.post('/login', { preHandler: [loginIpRateLimit, loginAccountRateLimit] }, async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid payload' });
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    const valid = await verifyPassword(user?.passwordHash ?? DUMMY_PASSWORD_HASH, password);
    if (!user || !user.isActive || !valid) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    const payload = { sub: user.id, role: user.role };
    return {
      accessToken: signAccessToken(payload),
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl },
    };
  });

  app.put('/me/avatar', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;
    if (!user) return reply.code(401).send({ error: 'Unauthorized' });

    const parsed = avatarSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid image' });
    const avatarBytes = decodeAvatar(parsed.data.avatarUrl);
    if (avatarBytes.byteLength > MAX_AVATAR_SIZE) {
      return reply.code(413).send({ error: 'A imagem deve ter no máximo 2 MB.' });
    }
    if (!hasValidAvatarSignature(parsed.data.avatarUrl, avatarBytes)) {
      return reply.code(400).send({ error: 'Invalid image' });
    }

    const updated = await prisma.user.update({
      where: { id: user.sub },
      data: { avatarUrl: parsed.data.avatarUrl },
      select: { id: true, avatarUrl: true },
    });
    return { id: updated.id, avatarUrl: updated.avatarUrl };
  });

  app.delete('/me/avatar', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;
    if (!user) return reply.code(401).send({ error: 'Unauthorized' });

    const updated = await prisma.user.update({
      where: { id: user.sub },
      data: { avatarUrl: null },
      select: { id: true, avatarUrl: true },
    });
    return { id: updated.id, avatarUrl: updated.avatarUrl };
  });

  app.get('/me', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.sub },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true, isActive: true },
    });
    if (!dbUser?.isActive) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    return {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      avatarUrl: dbUser.avatarUrl,
    };
  });
}
