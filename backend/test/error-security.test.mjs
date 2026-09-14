import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.NODE_ENV = 'test';
const { buildApp } = await import('../dist/app.js');
const { prisma } = await import('../dist/config/prisma.js');

test('internal errors are redacted and never publicly cached; client errors retain their status', async () => {
  const app = await buildApp();
  const original = prisma.providerProfile.findMany;
  prisma.providerProfile.findMany = async () => { throw new Error('Database internals security-canary'); };
  try {
    const failed = await app.inject('/api/providers');
    assert.equal(failed.statusCode, 500);
    assert.deepEqual(failed.json(), { error: 'Internal server error' });
    assert.equal(failed.headers['cache-control'], 'no-store');

    const invalid = await app.inject('/api/providers/not-a-uuid');
    assert.equal(invalid.statusCode, 400);
    assert.equal(invalid.headers['cache-control'], 'no-store');
    const malformed = await app.inject({ method: 'POST', url: '/api/auth/login', headers: { 'content-type': 'application/json' }, payload: '{' });
    assert.equal(malformed.statusCode, 400);

    prisma.providerProfile.findMany = async () => [];
    const catalog = await app.inject('/api/providers');
    assert.equal(catalog.statusCode, 200);
    assert.match(catalog.headers['cache-control'], /^public,/);
  } finally {
    prisma.providerProfile.findMany = original;
    await app.close();
  }
});
