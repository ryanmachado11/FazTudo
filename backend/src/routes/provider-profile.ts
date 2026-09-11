import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const profileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  bio: z.string().trim().max(5000).optional(),
  specialties: z.array(z.string().trim().min(1).max(100)).max(20)
    .refine((items) => new Set(items.map((item) => item.toLowerCase())).size === items.length, 'Duplicate specialty')
    .optional(),
  city: z.string().trim().max(120).optional(),
  neighborhood: z.string().trim().max(120).optional(),
  state: z.string().trim().length(2).transform((value) => value.toUpperCase()).optional(),
  hourlyRate: z.number().finite().min(0).max(100_000).optional(),
  isUrgentAvailable: z.boolean().optional(),
  categoryIds: z.array(z.string().uuid()).max(10).refine((ids) => new Set(ids).size === ids.length, 'Duplicate category').optional(),
}).strict();

export async function providerProfileRoutes(app: FastifyInstance) {
  app.get('/me', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;
    if (!user || user.role !== 'PROVIDER') {
      return reply.code(403).send({ error: 'Only providers can access this route' });
    }

    const profile = await prisma.providerProfile.findUnique({
      where: { userId: user.sub },
      include: {
        user: { select: { name: true, email: true, avatarUrl: true } },
        categories: { include: { category: true } },
      },
    });

    if (!profile) {
      return reply.code(404).send({ error: 'Provider profile not found' });
    }

    return {
      id: profile.id,
      userId: profile.userId,
      name: profile.user.name,
      email: profile.user.email,
      avatarUrl: profile.user.avatarUrl,
      bio: profile.bio,
      specialties: Array.isArray(profile.specialties) ? profile.specialties : [],
      city: profile.city,
      neighborhood: profile.neighborhood,
      state: profile.state,
      hourlyRate: profile.hourlyRate,
      isUrgentAvailable: profile.isUrgentAvailable,
      isVerified: profile.isVerified,
      category: profile.categories[0]?.category.name ?? 'Prestador',
      categoryId: profile.categories[0]?.category.id ?? null,
      categoryIds: profile.categories.map((entry) => entry.category.id),
    };
  });

  app.put('/me', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;
    if (!user || user.role !== 'PROVIDER') {
      return reply.code(403).send({ error: 'Only providers can access this route' });
    }

    const parsed = profileSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid payload', issues: parsed.error.flatten() });
    }

    const { name, bio, specialties, city, neighborhood, state, hourlyRate, isUrgentAvailable, categoryIds } = parsed.data;

    if (categoryIds) {
      const activeCategoryCount = await prisma.category.count({
        where: { id: { in: categoryIds }, isActive: true },
      });
      if (activeCategoryCount !== categoryIds.length) {
        return reply.code(400).send({ error: 'One or more categories are invalid or inactive' });
      }
    }

    const profile = await prisma.$transaction(async (tx) => {
      if (name) {
        await tx.user.update({ where: { id: user.sub }, data: { name } });
      }
      const upserted = await tx.providerProfile.upsert({
        where: { userId: user.sub },
        update: {
          bio,
          specialties,
          city,
          neighborhood,
          state,
          hourlyRate,
          isUrgentAvailable,
        },
        create: {
          userId: user.sub,
          bio: bio ?? '',
          specialties: specialties ?? [],
          city: city ?? 'SÃ£o Paulo',
          neighborhood: neighborhood ?? '',
          state: state ?? 'SP',
          hourlyRate: hourlyRate ?? 0,
          isUrgentAvailable: isUrgentAvailable ?? false,
          isVerified: false,
        },
      });

      if (categoryIds) {
        await tx.providerCategory.deleteMany({
          where: { providerProfileId: upserted.id },
        });

        if (categoryIds.length > 0) {
          await tx.providerCategory.createMany({
            data: categoryIds.map((catId) => ({
              providerProfileId: upserted.id,
              categoryId: catId,
            })),
          });
        }
      }

      return tx.providerProfile.findUnique({
        where: { userId: user.sub },
        include: {
          user: { select: { name: true, email: true, avatarUrl: true } },
          categories: { include: { category: true } },
        },
      });
    });

    if (!profile) {
      return reply.code(404).send({ error: 'Provider profile not found' });
    }

    return reply.code(200).send({
      id: profile.id,
      userId: profile.userId,
      name: profile.user.name,
      email: profile.user.email,
      avatarUrl: profile.user.avatarUrl,
      bio: profile.bio,
      specialties: Array.isArray(profile.specialties) ? profile.specialties : [],
      city: profile.city,
      neighborhood: profile.neighborhood,
      state: profile.state,
      hourlyRate: profile.hourlyRate,
      isUrgentAvailable: profile.isUrgentAvailable,
      isVerified: profile.isVerified,
      category: profile.categories[0]?.category.name ?? 'Prestador',
      categoryId: profile.categories[0]?.category.id ?? null,
      categoryIds: profile.categories.map((entry) => entry.category.id),
    });
  });
}
