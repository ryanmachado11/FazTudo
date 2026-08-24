import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { hashPassword, verifyPassword, signAccessToken } from '../lib/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { createRateLimit } from '../middleware/rate-limit.js';
const DUMMY_PASSWORD_HASH = '$argon2id$v=19$m=65536,p=4,t=3$EZPJf/FcpGcwlQv/PYA65Q$oCRRh4BZPQxzXb5s9LHcpFtUSyAs1Kzrs+F7dostk8M';
const normalizedEmail = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const normalizedPhone = z.string().transform((value) => value.replace(/\D/g, '')).pipe(z.string().regex(/^\d{10,15}$/));
const registerSchema = z.object({
    name: z.string().trim().min(2).max(120),
    email: normalizedEmail,
    phone: normalizedPhone,
    password: z.string().min(8).max(128),
    role: z.enum(['CLIENT', 'PROVIDER']).optional(),
}).strict();
const loginSchema = z.object({
    email: normalizedEmail,
    password: z.string().min(1).max(128),
}).strict();
export async function authRoutes(app) {
    const registerRateLimit = createRateLimit({ limit: 5, windowMs: 60 * 60 * 1000 });
    const loginRateLimit = createRateLimit({ limit: 10, windowMs: 15 * 60 * 1000 });
    function sendFieldError(reply, statusCode, fieldErrors, message) {
        return reply.code(statusCode).send({
            error: message,
            issues: {
                fieldErrors,
                formErrors: [],
            },
        });
    }
    app.post('/register', { preHandler: registerRateLimit }, async (request, reply) => {
        const parsed = registerSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.code(400).send({ error: 'Invalid payload', issues: parsed.error.flatten() });
        }
        const { name, email, phone, password, role = 'CLIENT' } = parsed.data;
        const [existingEmail, existingPhone] = await Promise.all([
            prisma.user.findUnique({ where: { email } }),
            prisma.user.findUnique({ where: { phone } }),
        ]);
        const fieldErrors = {};
        if (existingEmail) {
            fieldErrors.email = ['Este e-mail já está em uso.'];
        }
        if (existingPhone) {
            fieldErrors.phone = ['Este celular já está em uso.'];
        }
        if (Object.keys(fieldErrors).length > 0) {
            return sendFieldError(reply, 409, fieldErrors, 'Dados já cadastrados');
        }
        const passwordHash = await hashPassword(password);
        let user;
        try {
            user = await prisma.user.create({
                data: {
                    name,
                    email,
                    phone,
                    passwordHash,
                    role: role === 'PROVIDER' ? 'PROVIDER' : 'CLIENT',
                },
            });
        }
        catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                return reply.code(409).send({ error: 'Dados já cadastrados' });
            }
            throw error;
        }
        return reply.code(201).send({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    });
    app.post('/login', { preHandler: loginRateLimit }, async (request, reply) => {
        const parsed = loginSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.code(400).send({ error: 'Invalid payload' });
        }
        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        const valid = await verifyPassword(user?.passwordHash ?? DUMMY_PASSWORD_HASH, password);
        if (!user || !user.isActive || !valid) {
            return reply.code(401).send({ error: 'Invalid credentials' });
        }
        const payload = { sub: user.id, role: user.role };
        return {
            accessToken: signAccessToken(payload),
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        };
    });
    app.get('/me', { preHandler: requireAuth }, async (request, reply) => {
        const user = request.user;
        if (!user) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }
        const dbUser = await prisma.user.findUnique({
            where: { id: user.sub },
            select: { id: true, name: true, email: true, role: true, isActive: true },
        });
        if (!dbUser?.isActive) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }
        return {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
        };
    });
}
