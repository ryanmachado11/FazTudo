import { Prisma } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { createRateLimit } from '../middleware/rate-limit.js';

const optionalUuid = z.preprocess(
  (value) => (value === null || value === '' ? undefined : value),
  z.string().uuid().optional(),
);

const createRoomSchema = z.object({
  roomId: optionalUuid,
  providerId: optionalUuid,
  clientId: optionalUuid,
  serviceRequestId: optionalUuid,
}).strict();

const messageSchema = z.object({
  roomId: optionalUuid,
  providerId: optionalUuid,
  clientId: optionalUuid,
  serviceRequestId: optionalUuid,
  content: z.string().trim().min(1).max(2000),
  messageType: z.enum(['TEXT', 'IMAGE', 'AUDIO', 'PROPOSAL']).optional(),
}).strict().superRefine((value, context) => {
  if (value.messageType === 'IMAGE' || value.messageType === 'AUDIO') {
    try {
      const url = new URL(value.content);
      if (url.protocol !== 'https:') throw new Error();
    } catch {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['content'], message: 'Media content must be an HTTPS URL' });
    }
  }
});

const messagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(100),
}).strict();

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
    unreadCount: room.unreadCount ?? 0,
  };
}

const roomDetails = {
  client: { select: { name: true } },
  provider: { select: { name: true } },
  messages: {
    orderBy: { createdAt: 'desc' as const },
    take: 1,
    select: { content: true, createdAt: true },
  },
};

async function findRoomDetails(id: string) {
  return prisma.chatRoom.findUnique({ where: { id }, include: roomDetails });
}

async function getOrCreateRoomForUser(user: { sub: string; role: string }, payload: ChatPayload) {
  if (user.role !== 'CLIENT' && user.role !== 'PROVIDER') {
    throw chatError(403, 'Only clients and providers can access conversations');
  }

  // Opening an existing conversation depends on membership, not a new service request.
  if (payload.roomId) {
    const room = await findRoomDetails(payload.roomId);
    if (!room) throw chatError(404, 'Room not found');
    if (room.clientId !== user.sub && room.providerId !== user.sub) {
      throw chatError(403, 'You do not have access to this room');
    }
    return room;
  }

  let clientId = user.sub;
  let providerId = payload.providerId;
  let serviceRequestId = payload.serviceRequestId;

  if (serviceRequestId) {
    const service = await prisma.serviceRequest.findUnique({
      where: { id: serviceRequestId },
      select: {
        clientId: true,
        providerId: true,
        provider: { select: { role: true, isActive: true } },
      },
    });
    if (!service?.providerId) throw chatError(404, 'Service request not found');
    if (service.clientId !== user.sub && service.providerId !== user.sub) {
      throw chatError(403, 'You do not have access to this service request');
    }
    if (service.provider?.role !== 'PROVIDER' || !service.provider.isActive) {
      throw chatError(404, 'Provider not found');
    }
    clientId = service.clientId;
    providerId = service.providerId;
  } else if (user.role === 'CLIENT') {
    if (!providerId || providerId === user.sub) throw chatError(400, 'Invalid provider');
    const provider = await prisma.providerProfile.findUnique({
      where: { userId: providerId },
      select: { user: { select: { role: true, isActive: true } } },
    });
    if (!provider || provider.user.role !== 'PROVIDER' || !provider.user.isActive) {
      throw chatError(404, 'Provider not found');
    }
  } else {
    if (!payload.clientId || payload.clientId === user.sub) throw chatError(400, 'Invalid client');

    const existingRoom = await prisma.chatRoom.findFirst({
      where: { clientId: payload.clientId, providerId: user.sub, serviceRequestId: null },
    });
    if (existingRoom) {
      const detailedRoom = await findRoomDetails(existingRoom.id);
      if (!detailedRoom) throw chatError(404, 'Room not found');
      return detailedRoom;
    }

    const service = await prisma.serviceRequest.findFirst({
      where: { clientId: payload.clientId, providerId: user.sub, status: { not: 'CANCELLED' } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, clientId: true },
    });
    if (!service) throw chatError(403, 'Only providers with a service request can start this conversation');
    clientId = service.clientId;
    providerId = user.sub;
    serviceRequestId = service.id;
  }

  if (!providerId) throw chatError(400, 'Invalid provider');

  let room = serviceRequestId
    ? await prisma.chatRoom.findUnique({ where: { serviceRequestId } })
    : await prisma.chatRoom.findFirst({ where: { clientId, providerId, serviceRequestId: null } });

  if (!room && serviceRequestId) {
    const pendingRoom = await prisma.chatRoom.findFirst({
      where: { clientId, providerId, serviceRequestId: null },
      orderBy: { createdAt: 'desc' },
    });
    if (pendingRoom) {
      try {
        room = await prisma.chatRoom.update({ where: { id: pendingRoom.id }, data: { serviceRequestId } });
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) throw error;
        room = await prisma.chatRoom.findUnique({ where: { serviceRequestId } });
      }
    }
  }

  if (!room) {
    try {
      room = await prisma.chatRoom.create({ data: { serviceRequestId, clientId, providerId } });
    } catch (error) {
      if (!(serviceRequestId && error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) {
        throw error;
      }
      room = await prisma.chatRoom.findUnique({ where: { serviceRequestId } });
    }
  }

  if (!room) throw chatError(404, 'Room not found');
  const detailedRoom = await findRoomDetails(room.id);
  if (!detailedRoom) throw chatError(404, 'Room not found');
  return detailedRoom;
}

export async function chatRoutes(app: FastifyInstance) {
  const messageRateLimit = createRateLimit({ limit: 60, windowMs: 60 * 1000 });

  app.get('/rooms', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;
    if (!user) return reply.code(401).send({ error: 'Unauthorized' });
    if (user.role !== 'CLIENT' && user.role !== 'PROVIDER') {
      return reply.code(403).send({ error: 'Only clients and providers can access conversations' });
    }

    const rooms = await prisma.chatRoom.findMany({
      where: { OR: [{ clientId: user.sub }, { providerId: user.sub }] },
      include: roomDetails,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCounts = await prisma.chatMessage.groupBy({
      by: ['roomId'],
      where: {
        roomId: { in: rooms.map((room) => room.id) },
        senderId: { not: user.sub },
        isRead: false,
      },
      _count: { _all: true },
    });
    const unreadByRoom = new Map(unreadCounts.map((entry) => [entry.roomId, entry._count._all]));

    return rooms
      .map((room) => serializeRoom({ ...room, unreadCount: unreadByRoom.get(room.id) ?? 0 }))
      .sort((left, right) => new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime());
  });

  app.post('/rooms', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = createRoomSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid payload', issues: parsed.error.flatten() });
    if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });

    try {
      const room = await getOrCreateRoomForUser(request.user, parsed.data);
      return reply.code(200).send({ room: serializeRoom(room) });
    } catch (error: any) {
      return reply.code(error?.statusCode || 500).send({ error: error?.statusCode ? error.message : 'Could not open chat room' });
    }
  });

  app.get('/rooms/:id/messages', { preHandler: requireAuth }, async (request, reply) => {
    const params = z.object({ id: z.string().uuid() }).strict().safeParse(request.params);
    const query = messagesQuerySchema.safeParse(request.query);
    if (!params.success || !query.success) return reply.code(400).send({ error: 'Invalid request' });

    const room = await prisma.chatRoom.findUnique({
      where: { id: params.data.id },
      select: { clientId: true, providerId: true },
    });
    if (!room) return reply.code(404).send({ error: 'Room not found' });
    const user = request.user;
    if (!user || (room.clientId !== user.sub && room.providerId !== user.sub)) {
      return reply.code(403).send({ error: 'You do not have access to this room' });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { roomId: params.data.id },
      select: { id: true, senderId: true, content: true, messageType: true, isRead: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: query.data.limit,
    });
    return messages.reverse();
  });

  app.post('/rooms/:id/read', { preHandler: requireAuth }, async (request, reply) => {
    const params = z.object({ id: z.string().uuid() }).strict().safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: 'Invalid room id' });

    const user = request.user;
    if (!user) return reply.code(401).send({ error: 'Unauthorized' });

    const room = await prisma.chatRoom.findUnique({
      where: { id: params.data.id },
      select: { clientId: true, providerId: true },
    });
    if (!room) return reply.code(404).send({ error: 'Room not found' });
    if (room.clientId !== user.sub && room.providerId !== user.sub) {
      return reply.code(403).send({ error: 'You do not have access to this room' });
    }

    const result = await prisma.chatMessage.updateMany({
      where: {
        roomId: params.data.id,
        senderId: { not: user.sub },
        isRead: false,
      },
      data: { isRead: true },
    });
    return { updatedCount: result.count };
  });

  app.post('/messages', { preHandler: [requireAuth, messageRateLimit] }, async (request, reply) => {
    const parsed = messageSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid payload', issues: parsed.error.flatten() });
    const user = request.user;
    if (!user) return reply.code(401).send({ error: 'Unauthorized' });

    let room;
    if (parsed.data.roomId) {
      room = await findRoomDetails(parsed.data.roomId);
      if (!room) return reply.code(404).send({ error: 'Room not found' });
      if (room.clientId !== user.sub && room.providerId !== user.sub) {
        return reply.code(403).send({ error: 'You do not have access to this room' });
      }
    } else {
      try {
        room = await getOrCreateRoomForUser(user, parsed.data);
      } catch (error: any) {
        return reply.code(error?.statusCode || 500).send({ error: error?.statusCode ? error.message : 'Could not open chat room' });
      }
    }

    const message = await prisma.chatMessage.create({
      data: {
        roomId: room.id,
        senderId: user.sub,
        content: parsed.data.content,
        messageType: parsed.data.messageType ?? 'TEXT',
      },
      select: { id: true, senderId: true, content: true, messageType: true, isRead: true, createdAt: true },
    });
    return reply.code(201).send({ room: serializeRoom(room), message });
  });
}
