import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { hashPassword, verifyPassword, signAccessToken, signRefreshToken } from '../lib/auth.js';
import { requireAuth } from '../middleware/auth.js';
const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(8),
    password: z.string().min(8),
    role: z.enum(['CLIENT', 'PROVIDER']).optional(),
});
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});
export async function authRoutes(app) {
    app.post('/register', async (request, reply) => {
        const parsed = registerSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.code(400).send({ error: 'Invalid payload', issues: parsed.error.flatten() });
        }
        const { name, email, phone, password, role = 'CLIENT' } = parsed.data;
        const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { phone }] } });
        if (existing) {
            return reply.code(409).send({ error: 'User already exists' });
        }
        const passwordHash = await hashPassword(password);
        const user = await prisma.user.create({
            data: {
                name,
                email,
                phone,
                passwordHash,
                role: role === 'PROVIDER' ? 'PROVIDER' : 'CLIENT',
            },
        });
        if (role === 'PROVIDER') {
            await prisma.providerProfile.create({
                data: {
                    userId: user.id,
                    bio: 'Novo prestador cadastrado via API',
                    city: 'São Paulo',
                    state: 'SP',
                    isVerified: false,
                },
            });
        }
        return reply.code(201).send({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    });
    app.post('/login', async (request, reply) => {
        const parsed = loginSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.code(400).send({ error: 'Invalid payload' });
        }
        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) {
            return reply.code(401).send({ error: 'Invalid credentials' });
        }
        const valid = await verifyPassword(user.passwordHash, password);
        if (!valid) {
            return reply.code(401).send({ error: 'Invalid credentials' });
        }
        const payload = { sub: user.id, role: user.role, email: user.email };
        return {
            accessToken: signAccessToken(payload),
            refreshToken: signRefreshToken(payload),
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        };
    });
    app.get('/me', { preHandler: requireAuth }, async (request, reply) => {
        const user = request.user;
        if (!user) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }
        const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
        if (!dbUser) {
            return reply.code(404).send({ error: 'User not found' });
        }
        return {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
        };
    });
    app.post('/verification', { preHandler: requireAuth }, async (request, reply) => {
        const user = request.user;
        if (!user || user.role !== 'PROVIDER') {
            return reply.code(403).send({ error: 'Only providers can verify their account' });
        }
        return reply.code(201).send({ message: 'Verification payload received', userId: user.sub });
    });
}
