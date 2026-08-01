import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const reviewSchema = z.object({
  serviceRequestId: z.string().uuid(),
  providerId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export async function reviewsRoutes(app: FastifyInstance) {
  app.post('/', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = reviewSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid payload', issues: parsed.error.flatten() });
    }

    const user = request.user;
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const service = await prisma.serviceRequest.findUnique({ where: { id: parsed.data.serviceRequestId } });
    if (!service || service.clientId !== user.sub || service.status !== 'COMPLETED') {
      return reply.code(400).send({ error: 'Only completed services can be reviewed' });
    }

    if (service.providerId !== parsed.data.providerId) {
      return reply.code(400).send({ error: 'Review provider does not match the service request' });
    }

    const existingReview = await prisma.review.findFirst({
      where: {
        serviceRequestId: parsed.data.serviceRequestId,
        clientId: user.sub,
      },
    });

    if (existingReview) {
      return reply.code(409).send({ error: 'Service request already reviewed' });
    }

    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          serviceRequestId: parsed.data.serviceRequestId,
          clientId: user.sub,
          providerId: parsed.data.providerId,
          rating: parsed.data.rating,
          comment: parsed.data.comment ?? '',
        },
      });

      const providerProfile = await tx.providerProfile.findUnique({ where: { userId: parsed.data.providerId } });
      if (providerProfile) {
        const newTotal = providerProfile.totalReviews + 1;
        const currentAverage = Number(providerProfile.averageRating || 0);
        const newAverage = (currentAverage * providerProfile.totalReviews + parsed.data.rating) / newTotal;
        await tx.providerProfile.update({
          where: { userId: parsed.data.providerId },
          data: {
            totalReviews: newTotal,
            averageRating: newAverage,
          },
        });
      }

      return created;
    });

    return reply.code(201).send({ review });
  });
}
