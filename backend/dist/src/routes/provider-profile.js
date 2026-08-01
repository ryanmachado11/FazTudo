import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
const profileSchema = z.object({
    bio: z.string().optional(),
    city: z.string().optional(),
    neighborhood: z.string().optional(),
    state: z.string().optional(),
    hourlyRate: z.number().optional(),
    isUrgentAvailable: z.boolean().optional(),
});
export async function providerProfileRoutes(app) {
    app.get('/me', { preHandler: requireAuth }, async (request, reply) => {
        const user = request.user;
        if (!user || user.role !== 'PROVIDER') {
            return reply.code(403).send({ error: 'Only providers can access this route' });
        }
        const profile = await prisma.providerProfile.findUnique({ where: { userId: user.sub } });
        if (!profile) {
            return reply.code(404).send({ error: 'Provider profile not found' });
        }
        return profile;
    });
    app.put('/me', { preHandler: requireAuth }, async (request, reply) => {
        const user = request.user;
        if (!user || user.role !== 'PROVIDER') {
            return reply.code(403).send({ error: 'Only providers can access this route' });
        }
        const parsed = profileSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.code(400).send({ error: 'Invalid payload', issues: parsed.error.flatten() });
        }
        const profile = await prisma.providerProfile.upsert({
            where: { userId: user.sub },
            update: parsed.data,
            create: {
                userId: user.sub,
                bio: parsed.data.bio ?? '',
                city: parsed.data.city ?? '',
                neighborhood: parsed.data.neighborhood ?? '',
                state: parsed.data.state ?? '',
                hourlyRate: parsed.data.hourlyRate ?? 0,
                isUrgentAvailable: parsed.data.isUrgentAvailable ?? false,
            },
        });
        return reply.code(200).send(profile);
    });
}
