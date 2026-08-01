import { FastifyInstance } from 'fastify';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';

export async function dashboardRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const profile = await prisma.providerProfile.findUnique({
      where: { userId: user.sub },
      include: { categories: { include: { category: true } } },
    });
    const latestVerification = await prisma.userVerification.findFirst({
      where: { userId: user.sub },
      orderBy: { createdAt: 'desc' },
    });
    const requests = await prisma.serviceRequest.findMany({
      where: { providerId: user.sub, status: { in: ['REQUESTED', 'ACCEPTED', 'IN_PROGRESS'] } },
      include: { client: true, category: true },
      orderBy: { createdAt: 'desc' },
    });
    const completedThisMonth = await prisma.serviceRequest.count({
      where: {
        providerId: user.sub,
        status: 'COMPLETED',
        updatedAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    });
    const reviews = await prisma.review.findMany({
      where: { providerId: user.sub },
      include: { client: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

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
        pendingRequests: requests.filter((entry: { status: string }) => entry.status === 'REQUESTED').length,
        activeServices: requests.filter((entry: { status: string }) => entry.status === 'IN_PROGRESS' || entry.status === 'ACCEPTED').length,
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
