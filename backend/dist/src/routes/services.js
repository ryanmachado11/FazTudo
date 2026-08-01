import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
const requestSchema = z.object({
    categoryId: z.string().uuid(),
    providerId: z.string().uuid().optional(),
    description: z.string().min(10),
    urgencyFlag: z.boolean().optional(),
    scheduledFor: z.string().optional(),
});
export async function servicesRoutes(app) {
    app.post('/', { preHandler: requireAuth }, async (request, reply) => {
        const parsed = requestSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.code(400).send({ error: 'Invalid payload', issues: parsed.error.flatten() });
        }
        const user = request.user;
        if (!user) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }
        const { categoryId, providerId, description, urgencyFlag = false, scheduledFor } = parsed.data;
        const service = await prisma.serviceRequest.create({
            data: {
                clientId: user.sub,
                providerId,
                categoryId,
                description,
                urgencyFlag,
                scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
            },
        });
        return reply.code(201).send({ service });
    });
}
