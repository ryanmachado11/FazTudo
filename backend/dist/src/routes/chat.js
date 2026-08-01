import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
const messageSchema = z.object({
    roomId: z.string().uuid(),
    content: z.string().min(1),
    messageType: z.enum(['TEXT', 'IMAGE', 'AUDIO', 'PROPOSAL']).optional(),
});
export async function chatRoutes(app) {
    app.get('/rooms', { preHandler: requireAuth }, async (request) => {
        const user = request.user;
        if (!user)
            return [];
        return prisma.chatRoom.findMany({
            where: { OR: [{ clientId: user.sub }, { providerId: user.sub }] },
            include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
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
        const message = await prisma.chatMessage.create({
            data: {
                roomId: parsed.data.roomId,
                senderId: user.sub,
                content: parsed.data.content,
                messageType: parsed.data.messageType ?? 'TEXT',
            },
        });
        return reply.code(201).send({ message });
    });
}
