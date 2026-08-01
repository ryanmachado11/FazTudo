import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
const profileSchema = z.object({
    bio: z.string().optional(),
    city: z.string().optional(),
    neighborhood: z.string().optional(),
    state: z.string().optional(),
    hourlyRate: z.number().optional(),
    isUrgentAvailable: z.boolean().optional(),
    categoryIds: z.array(z.string().uuid()).optional(),
});
export async function providerProfileRoutes(app) {
    app.get('/me', { preHandler: requireAuth }, async (request, reply) => {
        const user = request.user;
        if (!user || user.role !== 'PROVIDER') {
            return reply.code(403).send({ error: 'Only providers can access this route' });
        }
        const verification = await prisma.userVerification.findFirst({
            where: { userId: user.sub },
            orderBy: { createdAt: 'desc' },
        });
        const profile = await prisma.providerProfile.findUnique({
            where: { userId: user.sub },
            include: {
                user: true,
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
            bio: profile.bio,
            city: profile.city,
            neighborhood: profile.neighborhood,
            state: profile.state,
            hourlyRate: profile.hourlyRate,
            isUrgentAvailable: profile.isUrgentAvailable,
            isVerified: profile.isVerified,
            verificationStatus: verification?.status ?? 'NONE',
            verificationReviewedAt: verification?.reviewedAt ?? null,
            verificationRejectionReason: verification?.rejectionReason ?? null,
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
        const { bio, city, neighborhood, state, hourlyRate, isUrgentAvailable, categoryIds } = parsed.data;
        const existingProfile = await prisma.providerProfile.findUnique({ where: { userId: user.sub } });
        if (!existingProfile) {
            const verification = await prisma.userVerification.findFirst({
                where: { userId: user.sub },
                orderBy: { createdAt: 'desc' },
            });
            if (!verification) {
                return reply.code(403).send({ error: 'Complete the verification flow before creating your provider profile' });
            }
        }
        const profile = await prisma.$transaction(async (tx) => {
            const upserted = await tx.providerProfile.upsert({
                where: { userId: user.sub },
                update: {
                    bio,
                    city,
                    neighborhood,
                    state,
                    hourlyRate,
                    isUrgentAvailable,
                },
                create: {
                    userId: user.sub,
                    bio: bio ?? '',
                    city: city ?? 'São Paulo',
                    neighborhood: neighborhood ?? '',
                    state: state ?? 'SP',
                    hourlyRate: hourlyRate ?? 0,
                    isUrgentAvailable: isUrgentAvailable ?? false,
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
                    user: true,
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
            bio: profile.bio,
            city: profile.city,
            neighborhood: profile.neighborhood,
            state: profile.state,
            hourlyRate: profile.hourlyRate,
            isUrgentAvailable: profile.isUrgentAvailable,
            isVerified: profile.isVerified,
            verificationStatus: (await prisma.userVerification.findFirst({
                where: { userId: user.sub },
                orderBy: { createdAt: 'desc' },
            }))?.status ?? 'NONE',
            category: profile.categories[0]?.category.name ?? 'Prestador',
            categoryId: profile.categories[0]?.category.id ?? null,
            categoryIds: profile.categories.map((entry) => entry.category.id),
        });
    });
}
