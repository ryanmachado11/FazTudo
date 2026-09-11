import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';

const providersQuerySchema = z.object({
  category: z.string().trim().max(255).optional(),
  city: z.string().trim().max(120).optional(),
  urgent: z.enum(['true', 'false']).optional(),
  sort: z.enum(['rating', 'price']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
}).strict();

export async function providersRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    const parsed = providersQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid query', issues: parsed.error.flatten() });
    }

    const { category, city, urgent, sort = 'rating', limit } = parsed.data;
    const where: any = {
      user: { role: 'PROVIDER', isActive: true },
    };

    if (category) {
      where.categories = { some: { category: { slug: category } } };
    }

    if (city) {
      where.city = { contains: city };
    }

    if (urgent === 'true') {
      where.isUrgentAvailable = true;
    }

    const providers = await prisma.providerProfile.findMany({
      where,
      select: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        averageRating: true,
        bio: true,
        city: true,
        createdAt: true,
        hourlyRate: true,
        isUrgentAvailable: true,
        isVerified: true,
        neighborhood: true,
        specialties: true,
        state: true,
        totalReviews: true,
        categories: { include: { category: true } },
        _count: { select: { serviceRequests: { where: { status: 'COMPLETED' } } } },
      },
      orderBy: sort === 'rating' ? { averageRating: 'desc' } : { hourlyRate: 'asc' },
      take: limit,
    });

    return providers.map((provider: any) => ({
      id: provider.user.id,
      name: provider.user.name,
      avatarUrl: provider.user.avatarUrl,
      category: provider.categories[0]?.category.name ?? 'Prestador',
      categoryId: provider.categories[0]?.category.id ?? null,
      rating: Number(provider.averageRating),
      reviews: provider.totalReviews,
      verified: provider.isVerified,
      price: provider.hourlyRate ? `A partir de R$ ${Number(provider.hourlyRate).toFixed(2)}` : 'A combinar',
      distance: 'Próximo',
      responseTime: '~15 min',
      specialties: Array.isArray(provider.specialties) && provider.specialties.length > 0
        ? provider.specialties
        : provider.categories.map((entry: any) => entry.category.name),
      description: provider.bio ?? 'Prestador disponível para atendimento local.',
      serviceRegion: [provider.city, provider.neighborhood, provider.state].filter(Boolean).join(' - '),
      memberSince: provider.createdAt.toLocaleDateString('pt-BR'),
      completedJobs: provider._count.serviceRequests,
      responseRate: '98%',
      isUrgentAvailable: provider.isUrgentAvailable,
    }));
  });

  app.get('/:id', async (request, reply) => {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const parsed = paramsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid provider id' });
    }

    const provider = await prisma.providerProfile.findUnique({
      where: { userId: parsed.data.id },
      select: {
        averageRating: true,
        bio: true,
        city: true,
        createdAt: true,
        hourlyRate: true,
        isUrgentAvailable: true,
        isVerified: true,
        neighborhood: true,
        specialties: true,
        state: true,
        totalReviews: true,
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            isActive: true,
            reviewsReceived: {
              where: { status: 'APPROVED' },
              select: {
                id: true,
                rating: true,
                comment: true,
                createdAt: true,
                client: { select: { name: true } },
              },
              orderBy: { createdAt: 'desc' },
              take: 50,
            },
          },
        },
        categories: { include: { category: true } },
        _count: { select: { serviceRequests: { where: { status: 'COMPLETED' } } } },
      },
    });

    if (!provider) {
      return reply.code(404).send({ error: 'Provider not found' });
    }

    if (!provider.user.isActive) {
      return reply.code(404).send({ error: 'Provider not found' });
    }

    return {
      id: provider.user.id,
      name: provider.user.name,
      avatarUrl: provider.user.avatarUrl,
      category: provider.categories[0]?.category.name ?? 'Prestador',
      categoryId: provider.categories[0]?.category.id ?? null,
      rating: Number(provider.averageRating),
      reviews: provider.totalReviews,
      verified: provider.isVerified,
      price: provider.hourlyRate ? `A partir de R$ ${Number(provider.hourlyRate).toFixed(2)}` : 'A combinar',
      description: provider.bio ?? 'Prestador disponível para atendimento local.',
      serviceRegion: [provider.city, provider.neighborhood, provider.state].filter(Boolean).join(' - '),
      completionRate: '98%',
      responseTime: '~15 min',
      specialties: Array.isArray(provider.specialties) && provider.specialties.length > 0
        ? provider.specialties
        : provider.categories.map((entry: any) => entry.category.name),
      isUrgentAvailable: provider.isUrgentAvailable,
      completedJobs: provider._count.serviceRequests,
      memberSince: provider.createdAt.toLocaleDateString('pt-BR'),
      responseRate: '98%',
      distance: 'Próximo',
      reviewsList: (provider.user.reviewsReceived || []).map((r: any) => ({
        id: r.id,
        client: r.client.name,
        rating: r.rating,
        date: r.createdAt.toLocaleDateString('pt-BR'),
        comment: r.comment,
      })),
    };
  });
}
