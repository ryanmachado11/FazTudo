import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
export async function dashboardRoutes(app) {
    app.get('/', { preHandler: requireAuth }, async (request, reply) => {
        const user = request.user;
        if (!user) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }
        if (user.role !== 'PROVIDER') {
            return reply.code(403).send({ error: 'Only providers can access this route' });
        }
        const [profile, latestVerification, requests, completedThisMonth, reviews] = await Promise.all([
            prisma.providerProfile.findUnique({
                where: { userId: user.sub },
                include: { categories: { include: { category: true } } },
            }),
            prisma.userVerification.findFirst({
                where: { userId: user.sub },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.serviceRequest.findMany({
                where: { providerId: user.sub, status: { in: ['REQUESTED', 'ACCEPTED', 'IN_PROGRESS'] } },
                select: {
                    id: true,
                    clientId: true,
                    description: true,
                    status: true,
                    scheduledFor: true,
                    client: { select: { name: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 100,
            }),
            prisma.serviceRequest.count({
                where: {
                    providerId: user.sub,
                    status: 'COMPLETED',
                    updatedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
                },
            }),
            prisma.review.findMany({
                where: { providerId: user.sub, status: 'APPROVED' },
                select: {
                    id: true,
                    rating: true,
                    comment: true,
                    createdAt: true,
                    client: { select: { name: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }),
        ]);
        return {
            verification: latestVerification
                ? {
                    status: latestVerification.status,
                    reviewedAt: latestVerification.reviewedAt,
                    rejectionReason: latestVerification.rejectionReason,
                }
                : {
                    status: 'NONE',
                    reviewedAt: null,
                    rejectionReason: null,
                },
            setup: {
                profileReady: Boolean(profile),
                verificationReady: latestVerification?.status === 'PENDING' || latestVerification?.status === 'APPROVED',
            },
            provider: profile
                ? {
                    verified: profile.isVerified,
                    hourlyRate: profile.hourlyRate,
                    averageRating: Number(profile.averageRating),
                    totalReviews: profile.totalReviews,
                    category: profile.categories[0]?.category.name || 'Prestador',
                }
                : null,
            stats: {
                pendingRequests: requests.filter((entry) => entry.status === 'REQUESTED').length,
                activeServices: requests.filter((entry) => entry.status === 'IN_PROGRESS' || entry.status === 'ACCEPTED').length,
                completedThisMonth,
                totalEarnings: 'R$ 0,00',
            },
            requests: requests.map((entry) => ({
                id: entry.id,
                clientId: entry.clientId,
                clientName: entry.client.name,
                description: entry.description,
                status: entry.status,
                scheduledFor: entry.scheduledFor,
            })),
            reviews: reviews.map((entry) => ({
                id: entry.id,
                clientName: entry.client.name,
                rating: entry.rating,
                comment: entry.comment,
                createdAt: entry.createdAt,
            })),
        };
    });
}
