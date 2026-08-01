import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const optionalUuid = z.preprocess(
  (value) => (value === null || value === '' ? undefined : value),
  z.string().uuid().optional(),
);

const createRoomSchema = z.object({
  providerId: optionalUuid,
  clientId: optionalUuid,
  serviceRequestId: optionalUuid,
});

const messageSchema = z.object({
  roomId: optionalUuid,
  providerId: optionalUuid,
  clientId: optionalUuid,
  serviceRequestId: optionalUuid,
  content: z.string().trim().min(1),
  messageType: z.enum(['TEXT', 'IMAGE', 'AUDIO', 'PROPOSAL']).optional(),
});

type ChatPayload = z.infer<typeof createRoomSchema>;

function chatError(statusCode: number, message: string) {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
}

function serializeRoom(room: any) {
  return {
    id: room.id,
    serviceRequestId: room.serviceRequestId,
    clientId: room.clientId,
    clientName: room.client.name,
    providerId: room.providerId,
    providerName: room.provider.name,
    lastMessage: room.messages?.[0]?.content ?? '',
    lastMessageAt: room.messages?.[0]?.createdAt ?? room.createdAt,
  };
}

async function getOrCreateRoomForUser(user: any, payload: ChatPayload) {
  let clientId = user.sub;
  let providerId = payload.providerId;
  let serviceRequestId = payload.serviceRequestId;

  if (serviceRequestId) {
    const service = await prisma.serviceRequest.findUnique({
      where: { id: serviceRequestId },
      include: {
        client: true,
        provider: true,
        providerProfile: true,
      },
    });

    if (!service || !service.providerId) {
      throw chatError(404, 'Service request not found');
    }

    const participates = service.clientId === user.sub || service.providerId === user.sub;
    if (!participates) {
      throw chatError(403, 'You do not have access to this service request');
    }

    if (!service.provider || service.provider.role !== 'PROVIDER' || !service.provider.isActive) {
      throw chatError(404, 'Provider not found');
    }

    if (!service.providerProfile?.isVerified) {
      throw chatError(403, 'Provider is not verified yet');
    }

    clientId = service.clientId;
    providerId = service.providerId;
  } else if (user.role === 'CLIENT') {
    if (!providerId || user.sub === providerId) {
      throw chatError(400, 'Invalid provider');
    }

    const serviceByProviderField = await prisma.serviceRequest.findFirst({
      where: {
        id: providerId,
        clientId: user.sub,
        providerId: { not: null },
      },
    });

    if (serviceByProviderField?.providerId) {
      serviceRequestId = serviceByProviderField.id;
      providerId = serviceByProviderField.providerId;
    }

    const provider = await prisma.providerProfile.findUnique({
      where: { userId: providerId },
      include: { user: true },
    });

    if (!provider || provider.user.role !== 'PROVIDER' || !provider.user.isActive) {
      throw chatError(404, 'Provider not found');
    }

    if (!provider.isVerified) {
      throw chatError(403, 'Provider is not verified yet');
    }
  } else if (user.role === 'PROVIDER') {
    if (!payload.clientId || user.sub === payload.clientId) {
      throw chatError(400, 'Invalid client');
    }

    let service = await prisma.serviceRequest.findFirst({
      where: {
        clientId: payload.clientId,
        providerId: user.sub,
      },
    });

    if (!service) {
      service = await prisma.serviceRequest.findFirst({
        where: {
          id: payload.clientId,
          providerId: user.sub,
        },
      });
    }

    if (!service) {
      throw chatError(403, 'Only providers with a service request can start this conversation');
    }

    clientId = service.clientId;
    providerId = user.sub;
    serviceRequestId = service.id;
  } else {
    throw chatError(403, 'Only clients and providers can access conversations');
  }

  let room = serviceRequestId
    ? await prisma.chatRoom.findUnique({ where: { serviceRequestId } })
    : await prisma.chatRoom.findFirst({
        where: {
          clientId,
          providerId,
        },
      });

  if (!room && serviceRequestId) {
    room = await prisma.chatRoom.findFirst({
      where: {
        clientId,
        providerId,
        serviceRequestId: null,
      },
    });

    if (room) {
      room = await prisma.chatRoom.update({
        where: { id: room.id },
        data: { serviceRequestId },
      });
    }
  }

  if (!room) {
    room = await prisma.chatRoom.create({
      data: {
        serviceRequestId,
        clientId,
        providerId: providerId!,
      },
    });
  }

  const roomWithParticipants = await prisma.chatRoom.findUnique({
    where: { id: room.id },
    include: {
      client: true,
      provider: true,
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  if (!roomWithParticipants) {
    throw chatError(404, 'Room not found');
  }

  return roomWithParticipants;
}

export async function chatRoutes(app: FastifyInstance) {
  app.get('/rooms', { preHandler: requireAuth }, async (request) => {
    const user = request.user;
    if (!user) return [];

    const rooms = await prisma.chatRoom.findMany({
      where: { OR: [{ clientId: user.sub }, { providerId: user.sub }] },
      include: {
        client: true,
        provider: true,
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rooms.map((room) => ({
      id: room.id,
      serviceRequestId: room.serviceRequestId,
      clientId: room.clientId,
      clientName: room.client.name,
      providerId: room.providerId,
      providerName: room.provider.name,
      lastMessage: room.messages[0]?.content ?? '',
      lastMessageAt: room.messages[0]?.createdAt ?? room.createdAt,
    }));
  });

  app.post('/rooms', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = createRoomSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid payload' });
    }

    const user = request.user;
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    let clientId = user.sub;
    let providerId = parsed.data.providerId;
    let serviceRequestId = parsed.data.serviceRequestId;

    if (serviceRequestId) {
      const service = await prisma.serviceRequest.findUnique({
        where: { id: serviceRequestId },
        include: {
          client: true,
          provider: true,
          providerProfile: true,
        },
      });

      if (!service || !service.providerId) {
        return reply.code(404).send({ error: 'Service request not found' });
      }

      const participates = service.clientId === user.sub || service.providerId === user.sub;
      if (!participates) {
        return reply.code(403).send({ error: 'You do not have access to this service request' });
      }

      if (!service.provider || service.provider.role !== 'PROVIDER' || !service.provider.isActive) {
        return reply.code(404).send({ error: 'Provider not found' });
      }

      if (!service.providerProfile?.isVerified) {
        return reply.code(403).send({ error: 'Provider is not verified yet' });
      }

      clientId = service.clientId;
      providerId = service.providerId;
    } else if (user.role === 'CLIENT') {
      if (!providerId || user.sub === providerId) {
        return reply.code(400).send({ error: 'Invalid provider' });
      }

      const serviceByProviderField = await prisma.serviceRequest.findFirst({
        where: {
          id: providerId,
          clientId: user.sub,
          providerId: { not: null },
        },
      });

      if (serviceByProviderField?.providerId) {
        serviceRequestId = serviceByProviderField.id;
        providerId = serviceByProviderField.providerId;
      }

      const provider = await prisma.providerProfile.findUnique({
        where: { userId: providerId },
        include: { user: true },
      });

      if (!provider || provider.user.role !== 'PROVIDER' || !provider.user.isActive) {
        return reply.code(404).send({ error: 'Provider not found' });
      }

      if (!provider.isVerified) {
        return reply.code(403).send({ error: 'Provider is not verified yet' });
      }
    } else if (user.role === 'PROVIDER') {
      if (!parsed.data.clientId || user.sub === parsed.data.clientId) {
        return reply.code(400).send({ error: 'Invalid client' });
      }

      let service = await prisma.serviceRequest.findFirst({
        where: {
          clientId: parsed.data.clientId,
          providerId: user.sub,
        },
      });

      if (!service) {
        service = await prisma.serviceRequest.findFirst({
          where: {
            id: parsed.data.clientId,
            providerId: user.sub,
          },
        });
      }

      if (!service) {
        return reply.code(403).send({ error: 'Only providers with a service request can start this conversation' });
      }

      clientId = service.clientId;
      providerId = user.sub;
      serviceRequestId = service.id;
    } else {
      return reply.code(403).send({ error: 'Only clients and providers can access conversations' });
    }

    let room = serviceRequestId
      ? await prisma.chatRoom.findUnique({ where: { serviceRequestId } })
      : await prisma.chatRoom.findFirst({
          where: {
            clientId,
            providerId,
          },
        });

    if (!room && serviceRequestId) {
      room = await prisma.chatRoom.findFirst({
        where: {
          clientId,
          providerId,
          serviceRequestId: null,
        },
      });

      if (room) {
        room = await prisma.chatRoom.update({
          where: { id: room.id },
          data: { serviceRequestId },
        });
      }
    }

    if (!room) {
      room = await prisma.chatRoom.create({
        data: {
          serviceRequestId,
          clientId,
          providerId: providerId!,
        },
      });
    }

    const roomWithParticipants = await prisma.chatRoom.findUnique({
      where: { id: room.id },
      include: {
        client: true,
        provider: true,
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    return reply.code(200).send({
      room: roomWithParticipants
        ? {
            id: roomWithParticipants.id,
            serviceRequestId: roomWithParticipants.serviceRequestId,
            clientId: roomWithParticipants.clientId,
            clientName: roomWithParticipants.client.name,
            providerId: roomWithParticipants.providerId,
            providerName: roomWithParticipants.provider.name,
            lastMessage: roomWithParticipants.messages[0]?.content ?? '',
            lastMessageAt: roomWithParticipants.messages[0]?.createdAt ?? roomWithParticipants.createdAt,
          }
        : room,
    });
  });

  app.get('/rooms/:id/messages', { preHandler: requireAuth }, async (request, reply) => {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const parsed = paramsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid room id' });
    }

    const room = await prisma.chatRoom.findUnique({ where: { id: parsed.data.id } });
    if (!room) {
      return reply.code(404).send({ error: 'Room not found' });
    }

    const user = request.user;
    if (!user || (room.clientId !== user.sub && room.providerId !== user.sub)) {
      return reply.code(403).send({ error: 'You do not have access to this room' });
    }

    return prisma.chatMessage.findMany({
      where: { roomId: parsed.data.id },
      orderBy: { createdAt: 'asc' },
    });
  });

  app.post('/messages', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = messageSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid payload', issues: parsed.error.flatten() });
    }

    const user = request.user;
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    let room: any = null;

    if (parsed.data.roomId) {
      room = await prisma.chatRoom.findUnique({
        where: { id: parsed.data.roomId },
        include: {
          client: true,
          provider: true,
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });
      if (!room) {
        return reply.code(404).send({ error: 'Room not found' });
      }

      if (room.clientId !== user.sub && room.providerId !== user.sub) {
        return reply.code(403).send({ error: 'You do not have access to this room' });
      }
    } else {
      try {
        room = await getOrCreateRoomForUser(user, {
          serviceRequestId: parsed.data.serviceRequestId,
          providerId: parsed.data.providerId,
          clientId: parsed.data.clientId,
        });
      } catch (error: any) {
        return reply.code(error?.statusCode || 400).send({ error: error?.message || 'Could not open chat room' });
      }
    }

    const message = await prisma.chatMessage.create({
      data: {
        roomId: room.id,
        senderId: user.sub,
        content: parsed.data.content,
        messageType: parsed.data.messageType ?? 'TEXT',
      },
    });

    return reply.code(201).send({ room: serializeRoom(room), message });
  });
}
