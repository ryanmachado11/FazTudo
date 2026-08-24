import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
const reviewSchema = z.object({
    serviceRequestId: z.string().uuid(),
    providerId: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().max(2000).optional(),
}).strict();
export async function reviewsRoutes(app) {
    app.post('/', { preHandler: requireAuth }, async (request, reply) => {
        const parsed = reviewSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.code(400).send({ error: 'Invalid payload', issues: parsed.error.flatten() });
        }
        const user = request.user;
        if (!user) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }
        if (user.role !== 'CLIENT') {
            return reply.code(403).send({ error: 'Only clients can review services' });
        }
        const service = await prisma.serviceRequest.findUnique({ where: { id: parsed.data.serviceRequestId } });
        if (!service || service.clientId !== user.sub || service.status !== 'COMPLETED') {
            return reply.code(400).send({ error: 'Only completed services can be reviewed' });
        }
        if (service.providerId !== parsed.data.providerId) {
            return reply.code(400).send({ error: 'Review provider does not match the service request' });
        }
        const existingReview = await prisma.review.findUnique({
            where: { serviceRequestId: parsed.data.serviceRequestId },
        });
        if (existingReview) {
            return reply.code(409).send({ error: 'Service request already reviewed' });
        }
        let review;
        try {
            review = await prisma.$transaction(async (tx) => {
                const created = await tx.review.create({
                    data: {
                        serviceRequestId: parsed.data.serviceRequestId,
                        clientId: user.sub,
                        providerId: parsed.data.providerId,
                        rating: parsed.data.rating,
                        comment: parsed.data.comment ?? '',
                        status: 'APPROVED',
                    },
                });
                const aggregate = await tx.review.aggregate({
                    where: { providerId: parsed.data.providerId, status: 'APPROVED' },
                    _avg: { rating: true },
                    _count: true,
                });
                await tx.providerProfile.update({
                    where: { userId: parsed.data.providerId },
                    data: {
                        totalReviews: aggregate._count,
                        averageRating: aggregate._avg.rating ?? 0,
                    },
                });
                return created;
            }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        }
        catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                return reply.code(409).send({ error: 'Service request already reviewed' });
            }
            throw error;
        }
        return reply.code(201).send({ review });
    });
}
