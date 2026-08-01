import { z } from 'zod';
import { prisma } from '../config/prisma.js';
const providersQuerySchema = z.object({
    category: z.string().optional(),
    city: z.string().optional(),
    urgent: z.string().optional(),
    sort: z.enum(['rating', 'price']).optional(),
});
export async function providersRoutes(app) {
    app.get('/', async (request, reply) => {
        const parsed = providersQuerySchema.safeParse(request.query);
        if (!parsed.success) {
            return reply.code(400).send({ error: 'Invalid query', issues: parsed.error.flatten() });
        }
        const { category, city, urgent, sort = 'rating' } = parsed.data;
        const where = {
            user: { role: 'PROVIDER' },
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
            include: {
                user: true,
                categories: { include: { category: true } },
            },
            orderBy: sort === 'rating' ? { averageRating: 'desc' } : { hourlyRate: 'asc' },
        });
        return providers.map((provider) => ({
            id: provider.user.id,
            name: provider.user.name,
            category: provider.categories[0]?.category.name ?? 'Prestador',
            rating: Number(provider.averageRating),
            reviews: provider.totalReviews,
            verified: provider.isVerified,
            price: provider.hourlyRate ? `A partir de R$ ${Number(provider.hourlyRate).toFixed(2)}` : 'A combinar',
            distance: 'Próximo',
            responseTime: '~15 min',
            specialties: provider.categories.map((entry) => entry.category.name),
            description: provider.bio ?? 'Prestador disponível para atendimento local.',
            serviceRegion: [provider.city, provider.neighborhood, provider.state].filter(Boolean).join(' - '),
            memberSince: provider.createdAt.toLocaleDateString('pt-BR'),
            completedJobs: provider.totalReviews,
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
            include: { user: true, categories: { include: { category: true } } },
        });
        if (!provider) {
            return reply.code(404).send({ error: 'Provider not found' });
        }
        return {
            id: provider.user.id,
            name: provider.user.name,
            category: provider.categories[0]?.category.name ?? 'Prestador',
            rating: Number(provider.averageRating),
            reviews: provider.totalReviews,
            verified: provider.isVerified,
            price: provider.hourlyRate ? `A partir de R$ ${Number(provider.hourlyRate).toFixed(2)}` : 'A combinar',
            description: provider.bio ?? 'Prestador disponível para atendimento local.',
            serviceRegion: [provider.city, provider.neighborhood, provider.state].filter(Boolean).join(' - '),
            completionRate: '98%',
            responseTime: '~15 min',
            specialties: provider.categories.map((entry) => entry.category.name),
            isUrgentAvailable: provider.isUrgentAvailable,
        };
    });
}
