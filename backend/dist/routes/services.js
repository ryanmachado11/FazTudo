import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
const requestSchema = z.object({
    categoryId: z.string().uuid().optional(),
    providerId: z.string().uuid().optional(),
    description: z.string().min(10),
    urgencyFlag: z.boolean().optional(),
    scheduledFor: z.string().optional(),
});
const paramsSchema = z.object({
    id: z.string().uuid(),
});
const statusSchema = z.object({
    status: z.enum(['ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
});
export async function servicesRoutes(app) {
    app.get('/', { preHandler: requireAuth }, async (request, reply) => {
        const user = request.user;
        if (!user) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }
        if (user.role !== 'CLIENT' && user.role !== 'PROVIDER') {
            return reply.code(403).send({ error: 'Only clients and providers can list services' });
        }
        const services = await prisma.serviceRequest.findMany({
            where: user.role === 'CLIENT' ? { clientId: user.sub } : { providerId: user.sub },
            include: {
                client: true,
                provider: true,
                category: true,
                reviews: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return services.map((service) => ({
            id: service.id,
            clientId: service.clientId,
            clientName: service.client.name,
            providerId: service.providerId,
            providerName: service.provider?.name ?? 'Prestador',
            categoryId: service.categoryId,
            categoryName: service.category.name,
            status: service.status,
            description: service.description,
            scheduledFor: service.scheduledFor,
            createdAt: service.createdAt,
            hasReview: service.reviews.length > 0,
        }));
    });
    app.post('/', { preHandler: requireAuth }, async (request, reply) => {
        const parsed = requestSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.code(400).send({ error: 'Invalid payload', issues: parsed.error.flatten() });
        }
        const user = request.user;
        if (!user) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }
        if (user.role !== 'CLIENT') {
            return reply.code(403).send({ error: 'Only clients can request services' });
        }
        const { categoryId, providerId, description, urgencyFlag = false, scheduledFor } = parsed.data;
        let resolvedCategoryId = categoryId;
        let provider = null;
        if (providerId) {
            provider = await prisma.providerProfile.findUnique({
                where: { userId: providerId },
                include: { user: true, categories: { include: { category: true } } },
            });
            if (!provider || provider.user.role !== 'PROVIDER' || !provider.user.isActive) {
                return reply.code(404).send({ error: 'Provider not found' });
            }
            if (!provider.isVerified) {
                return reply.code(403).send({ error: 'Provider is not verified yet' });
            }
            resolvedCategoryId ??= provider.categories.find((entry) => entry.category.isActive)?.categoryId;
            if (!resolvedCategoryId) {
                return reply.code(400).send({ error: 'Provider has no active category configured' });
            }
            const offersCategory = provider.categories.some((entry) => entry.categoryId === resolvedCategoryId && entry.category.isActive);
            if (!offersCategory) {
                return reply.code(400).send({ error: 'Provider does not offer this category' });
            }
        }
        if (!resolvedCategoryId) {
            return reply.code(400).send({ error: 'Category is required when no provider is selected' });
        }
        const category = await prisma.category.findFirst({
            where: { id: resolvedCategoryId, isActive: true },
        });
        if (!category) {
            return reply.code(404).send({ error: 'Category not found' });
        }
        const service = await prisma.serviceRequest.create({
            data: {
                clientId: user.sub,
                providerId,
                categoryId: resolvedCategoryId,
                description,
                urgencyFlag,
                scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
            },
        });
        return reply.code(201).send({ service });
    });
    app.patch('/:id/status', { preHandler: requireAuth }, async (request, reply) => {
        const parsedParams = paramsSchema.safeParse(request.params);
        if (!parsedParams.success) {
            return reply.code(400).send({ error: 'Invalid service id' });
        }
        const parsedBody = statusSchema.safeParse(request.body);
        if (!parsedBody.success) {
            return reply.code(400).send({ error: 'Invalid payload', issues: parsedBody.error.flatten() });
        }
        const user = request.user;
        if (!user) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }
        const service = await prisma.serviceRequest.findUnique({
            where: { id: parsedParams.data.id },
        });
        if (!service) {
            return reply.code(404).send({ error: 'Service request not found' });
        }
        const nextStatus = parsedBody.data.status;
        const isProvider = user.role === 'PROVIDER' && service.providerId === user.sub;
        const isClient = user.role === 'CLIENT' && service.clientId === user.sub;
        if (!isProvider && !isClient) {
            return reply.code(403).send({ error: 'You do not have access to this service request' });
        }
        const allowedTransitions = {
            REQUESTED: isProvider ? ['ACCEPTED', 'CANCELLED'] : ['CANCELLED'],
            ACCEPTED: isProvider ? ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'] : ['CANCELLED'],
            IN_PROGRESS: isProvider ? ['COMPLETED', 'CANCELLED'] : ['CANCELLED'],
            COMPLETED: [],
            CANCELLED: [],
        };
        const allowedNextStatuses = allowedTransitions[service.status] ?? [];
        if (!allowedNextStatuses.includes(nextStatus)) {
            return reply.code(409).send({ error: `Cannot change service from ${service.status} to ${nextStatus}` });
        }
        const updated = await prisma.serviceRequest.update({
            where: { id: service.id },
            data: { status: nextStatus },
        });
        return reply.code(200).send({ service: updated });
    });
}
