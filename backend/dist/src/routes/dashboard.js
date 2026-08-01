import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
export async function dashboardRoutes(app) {
    app.get('/', { preHandler: requireAuth }, async (request, reply) => {
        const user = request.user;
        if (!user) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }
        const profile = await prisma.providerProfile.findUnique({ where: { userId: user.sub } });
        const requests = await prisma.serviceRequest.findMany({
            where: { providerId: user.sub, status: { in: ['REQUESTED', 'ACCEPTED', 'IN_PROGRESS'] } },
            orderBy: { createdAt: 'desc' },
        });
        return {
            provider: profile ? { verified: profile.isVerified, hourlyRate: profile.hourlyRate } : null,
            stats: {
                pendingRequests: requests.filter((entry) => entry.status === 'REQUESTED').length,
                activeServices: requests.filter((entry) => entry.status === 'IN_PROGRESS').length,
                totalEarnings: 'R$ 0,00',
            },
            requests,
        };
    });
}
