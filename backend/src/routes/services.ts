import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const requestSchema = z.object({
  categoryId: z.string().uuid().optional(),
  providerId: z.string().uuid().optional(),
  description: z.string().trim().min(10).max(5000),
  urgencyFlag: z.boolean().optional(),
  scheduledFor: z.string().datetime({ offset: true }).optional(),
}).strict();

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(100),
}).strict();

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const statusSchema = z.object({
  status: z.enum(['ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
});

const updateRequestSchema = z.object({
  categoryId: z.string().uuid(),
  description: z.string().trim().min(10).max(5000),
  urgencyFlag: z.boolean().optional(),
  scheduledFor: z.string().datetime({ offset: true }).nullable().optional(),
}).strict();

export async function servicesRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    if (user.role !== 'CLIENT' && user.role !== 'PROVIDER') {
      return reply.code(403).send({ error: 'Only clients and providers can list services' });
    }

    const parsedQuery = listQuerySchema.safeParse(request.query);
    if (!parsedQuery.success) {
      return reply.code(400).send({ error: 'Invalid query', issues: parsedQuery.error.flatten() });
    }

    const services = await prisma.serviceRequest.findMany({
      where: user.role === 'CLIENT' ? { clientId: user.sub } : { providerId: user.sub },
      select: {
        id: true,
        clientId: true,
        providerId: true,
        status: true,
        description: true,
        urgencyFlag: true,
        scheduledFor: true,
        createdAt: true,
        client: { select: { name: true } },
        provider: { select: { name: true } },
        category: { select: { id: true, name: true } },
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: parsedQuery.data.limit,
    });

    return services.map((service) => ({
      id: service.id,
      clientId: service.clientId,
      clientName: service.client.name,
      providerId: service.providerId,
      providerName: service.provider?.name ?? 'Prestador',
      categoryId: service.category.id,
      categoryName: service.category.name,
      status: service.status,
      description: service.description,
      urgencyFlag: service.urgencyFlag,
      scheduledFor: service.scheduledFor,
      createdAt: service.createdAt,
      hasReview: service._count.reviews > 0,
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

    let provider: any = null;
    if (providerId) {
      provider = await prisma.providerProfile.findUnique({
        where: { userId: providerId },
        select: {
          isUrgentAvailable: true,
          user: { select: { role: true, isActive: true } },
          categories: {
            select: { categoryId: true, category: { select: { isActive: true } } },
          },
        },
      });

      if (!provider || provider.user.role !== 'PROVIDER' || !provider.user.isActive) {
        return reply.code(404).send({ error: 'Provider not found' });
      }

      if (urgencyFlag && !provider.isUrgentAvailable) {
        return reply.code(409).send({ error: 'Provider is not available for urgent requests' });
      }

      resolvedCategoryId ??= provider.categories.find((entry: any) => entry.category.isActive)?.categoryId;
      if (!resolvedCategoryId) {
        return reply.code(400).send({ error: 'Provider has no active category configured' });
      }

      const offersCategory = provider.categories.some(
        (entry: any) => entry.categoryId === resolvedCategoryId && entry.category.isActive,
      );
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

  app.patch('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const parsedParams = paramsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      return reply.code(400).send({ error: 'Invalid service id' });
    }

    const parsedBody = updateRequestSchema.safeParse(request.body);
    if (!parsedBody.success) {
      return reply.code(400).send({ error: 'Invalid payload', issues: parsedBody.error.flatten() });
    }

    const user = request.user;
    if (!user) return reply.code(401).send({ error: 'Unauthorized' });
    if (user.role !== 'CLIENT') {
      return reply.code(403).send({ error: 'Only clients can edit services' });
    }

    const service = await prisma.serviceRequest.findUnique({
      where: { id: parsedParams.data.id },
      select: { id: true, clientId: true, providerId: true, status: true },
    });
    if (!service) return reply.code(404).send({ error: 'Service request not found' });
    if (service.clientId !== user.sub) {
      return reply.code(403).send({ error: 'You do not have access to this service request' });
    }
    if (service.status !== 'REQUESTED') {
      return reply.code(409).send({ error: 'Only requested services can be edited' });
    }

    const { categoryId, description, urgencyFlag = false, scheduledFor } = parsedBody.data;
    const category = await prisma.category.findFirst({
      where: { id: categoryId, isActive: true },
      select: { id: true },
    });
    if (!category) return reply.code(404).send({ error: 'Category not found' });

    if (service.providerId) {
      const provider = await prisma.providerProfile.findUnique({
        where: { userId: service.providerId },
        select: {
          isUrgentAvailable: true,
          user: { select: { role: true, isActive: true } },
          categories: {
            select: { categoryId: true, category: { select: { isActive: true } } },
          },
        },
      });
      if (!provider || provider.user.role !== 'PROVIDER' || !provider.user.isActive) {
        return reply.code(404).send({ error: 'Provider not found' });
      }
      if (urgencyFlag && !provider.isUrgentAvailable) {
        return reply.code(409).send({ error: 'Provider is not available for urgent requests' });
      }
      const offersCategory = provider.categories.some(
        (entry) => entry.categoryId === categoryId && entry.category.isActive,
      );
      if (!offersCategory) {
        return reply.code(400).send({ error: 'Provider does not offer this category' });
      }
    }

    const updated = await prisma.serviceRequest.updateMany({
      where: { id: service.id, clientId: user.sub, status: 'REQUESTED' },
      data: {
        categoryId,
        description,
        urgencyFlag,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      },
    });
    if (updated.count !== 1) {
      return reply.code(409).send({ error: 'Service status changed; reload and try again' });
    }

    return { service: await prisma.serviceRequest.findUnique({ where: { id: service.id } }) };
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

    const allowedTransitions: Record<string, string[]> = {
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

    const result = await prisma.serviceRequest.updateMany({
      where: { id: service.id, status: service.status },
      data: { status: nextStatus },
    });
    if (result.count !== 1) {
      return reply.code(409).send({ error: 'Service status changed; reload and try again' });
    }
    const updated = await prisma.serviceRequest.findUnique({ where: { id: service.id } });

    return reply.code(200).send({ service: updated });
  });
}
