import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret-with-at-least-32-characters';

const { buildApp } = await import('../dist/app.js');
const { signAccessToken, verifyAccessToken } = await import('../dist/lib/auth.js');
const { prisma } = await import('../dist/config/prisma.js');
const app = await buildApp();

before(async () => {
  await app.ready();
});

after(async () => {
  await app.close();
});

test('health endpoint applies restrictive security headers', async () => {
  const response = await app.inject({ method: 'GET', url: '/health' });
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers['cache-control'], 'no-store');
  assert.equal(response.headers['x-content-type-options'], 'nosniff');
  assert.equal(response.headers['x-frame-options'], 'DENY');
});

test('CORS only reflects configured development origins', async () => {
  const allowed = await app.inject({ method: 'GET', url: '/health', headers: { origin: 'http://localhost:5173' } });
  const denied = await app.inject({ method: 'GET', url: '/health', headers: { origin: 'https://attacker.example' } });
  assert.equal(allowed.headers['access-control-allow-origin'], 'http://localhost:5173');
  assert.equal(denied.headers['access-control-allow-origin'], undefined);
});

test('oversized JSON bodies are rejected before route processing', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email: 'user@example.com', password: 'x'.repeat(70_000) },
  });
  assert.equal(response.statusCode, 413);
});

test('login endpoint is rate limited by client address', async () => {
  let response;
  for (let attempt = 0; attempt < 11; attempt += 1) {
    response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      remoteAddress: '192.0.2.10',
      payload: { email: 'invalid', password: '' },
    });
  }
  assert.equal(response?.statusCode, 429);
  assert.ok(response?.headers['retry-after']);
});

test('access tokens enforce issuer, audience and algorithm', () => {
  const token = signAccessToken({ sub: 'user-id', role: 'CLIENT' });
  assert.equal(verifyAccessToken(token).sub, 'user-id');

  const wrongAudience = jwt.sign(
    { sub: 'user-id', role: 'CLIENT' },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', issuer: 'faztudo-api', audience: 'another-app' },
  );
  assert.throws(() => verifyAccessToken(wrongAudience));
});

test('provider dashboard rejects authenticated clients before database access', async () => {
  const token = signAccessToken({ sub: 'client-id', role: 'CLIENT' });
  const response = await app.inject({
    method: 'GET',
    url: '/api/provider/dashboard',
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(response.statusCode, 403);
});

test('profile updates cannot self-verify a provider', async () => {
  const originalTransaction = prisma.$transaction;
  const originalVerificationFindFirst = prisma.userVerification.findFirst;
  let upsertArguments;

  prisma.$transaction = async (callback) => callback({
    user: { update: async () => ({}) },
    providerProfile: {
      upsert: async (args) => {
        upsertArguments = args;
        return { id: 'profile-id' };
      },
      findUnique: async () => ({
        id: 'profile-id',
        userId: 'provider-id',
        user: { name: 'Provider', email: 'provider@example.com' },
        bio: 'Updated profile',
        specialties: [],
        city: 'São Paulo',
        neighborhood: '',
        state: 'SP',
        hourlyRate: 100,
        isUrgentAvailable: true,
        isVerified: false,
        categories: [],
      }),
    },
    providerCategory: { deleteMany: async () => ({}), createMany: async () => ({}) },
  });
  prisma.userVerification.findFirst = async () => null;

  try {
    const token = signAccessToken({ sub: 'provider-id', role: 'PROVIDER' });
    const response = await app.inject({
      method: 'PUT',
      url: '/api/provider/profile/me',
      headers: { authorization: `Bearer ${token}` },
      payload: { bio: 'Updated profile', hourlyRate: 100, isUrgentAvailable: true },
    });
    assert.equal(response.statusCode, 200);
    assert.equal(Object.hasOwn(upsertArguments.update, 'isVerified'), false);
    assert.equal(upsertArguments.create.isVerified, false);
  } finally {
    prisma.$transaction = originalTransaction;
    prisma.userVerification.findFirst = originalVerificationFindFirst;
  }
});
