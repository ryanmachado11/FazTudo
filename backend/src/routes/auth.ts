import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
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

const VERIFICATION_UPLOAD_DIR = join(process.cwd(), 'uploads', 'verifications');
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type StoredImageInput = string | null | undefined;

function buildDocumentFingerprint(userId: string, email: string, documentNumber?: string) {
  const source = documentNumber?.trim() || `${userId}:${email}`;
  return createHash('sha256').update(source).digest('hex');
}

async function storeDataUrlImage(userId: string, label: string, input: StoredImageInput) {
  if (!input) {
    return null;
  }

  const trimmed = input.trim();
  const match = /^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=\s]+)$/.exec(trimmed);
  if (!match) {
    throw new Error(`Invalid ${label} image`);
  }

  const mimeType = match[1];
  const extension = mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1];
  const base64 = match[2].replace(/\s+/g, '');
  const buffer = Buffer.from(base64, 'base64');

  if (buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES) {
    throw new Error(`Invalid ${label} image size`);
  }

  await mkdir(VERIFICATION_UPLOAD_DIR, { recursive: true });

  const fileName = `${userId}-${label}-${Date.now()}.${extension}`;
  const filePath = join(VERIFICATION_UPLOAD_DIR, fileName);
  await writeFile(filePath, buffer);

  return `/uploads/verifications/${fileName}`;
}

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid payload', issues: parsed.error.flatten() });
    }

    const { name, email, phone, password, role = 'CLIENT' } = parsed.data;

    const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { phone }] } });
    if (existing) {
      return reply.code(409).send({ error: 'User already exists' });
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

  app.post('/verification', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;
    if (!user || user.role !== 'PROVIDER') {
      return reply.code(403).send({ error: 'Only providers can verify their account' });
    }

    const verificationSchema = z.object({
      documentType: z.string().trim().min(2).max(50).default('RG'),
      documentNumber: z.string().trim().min(1).optional(),
      documentNumberEncrypted: z.string().trim().min(1).optional(),
      documentFrontImage: z.string().optional(),
      documentBackImage: z.string().optional(),
      selfieImage: z.string().optional(),
      documentFrontUrl: z.string().trim().optional(),
      documentBackUrl: z.string().trim().optional(),
      selfieUrl: z.string().trim().optional(),
      bio: z.string().trim().max(1000).optional(),
      city: z.string().trim().max(120).optional(),
      neighborhood: z.string().trim().max(120).optional(),
      state: z.string().trim().max(120).optional(),
      hourlyRate: z.number().nonnegative().optional(),
      isUrgentAvailable: z.boolean().optional(),
      categoryIds: z.array(z.string().uuid()).optional(),
    });

    const parsed = verificationSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid payload', issues: parsed.error.flatten() });
    }

    const data = parsed.data;
    const account = await prisma.user.findUnique({ where: { id: user.sub } });
    if (!account) {
      return reply.code(404).send({ error: 'User not found' });
    }

    try {
      const [documentFrontPath, documentBackPath, selfiePath] = await Promise.all([
        storeDataUrlImage(user.sub, 'document-front', data.documentFrontImage),
        storeDataUrlImage(user.sub, 'document-back', data.documentBackImage),
        storeDataUrlImage(user.sub, 'selfie', data.selfieImage),
      ]);

      const verification = await prisma.$transaction(async (tx) => {
        const createdVerification = await tx.userVerification.create({
          data: {
            userId: user.sub,
            documentType: data.documentType,
            documentNumberEncrypted:
              data.documentNumberEncrypted || buildDocumentFingerprint(user.sub, account.email, data.documentNumber),
            documentFrontUrl: documentFrontPath || data.documentFrontUrl || '',
            documentBackUrl: documentBackPath || data.documentBackUrl || documentFrontPath || '',
            selfieUrl: selfiePath || data.selfieUrl || '',
            status: 'PENDING',
          },
        });

        const profile = await tx.providerProfile.upsert({
          where: { userId: user.sub },
          update: {
            bio: data.bio,
            city: data.city,
            neighborhood: data.neighborhood,
            state: data.state,
            hourlyRate: data.hourlyRate,
            isUrgentAvailable: data.isUrgentAvailable,
            isVerified: false,
          },
          create: {
            userId: user.sub,
            bio: data.bio ?? '',
            city: data.city ?? 'São Paulo',
            neighborhood: data.neighborhood ?? '',
            state: data.state ?? 'SP',
            hourlyRate: data.hourlyRate ?? null,
            isUrgentAvailable: data.isUrgentAvailable ?? false,
            isVerified: false,
          },
        });

        if (data.categoryIds && data.categoryIds.length > 0) {
          await tx.providerCategory.deleteMany({
            where: { providerProfileId: profile.id },
          });

          await tx.providerCategory.createMany({
            data: data.categoryIds.map((categoryId) => ({
              providerProfileId: profile.id,
              categoryId,
            })),
          });
        }

        return createdVerification;
      });

      return reply.code(201).send({
        message: 'Verification payload received and stored',
        verificationId: verification.id,
        userId: user.sub,
        verificationStatus: verification.status,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Could not store verification data' });
    }
  });
}
