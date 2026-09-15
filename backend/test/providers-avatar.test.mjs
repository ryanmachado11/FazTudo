import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret-with-at-least-32-characters';

const { buildApp } = await import('../dist/app.js');
const { prisma } = await import('../dist/config/prisma.js');

test('provider listings return short avatar URLs while detail and image retain the avatar', async () => {
  const app = await buildApp();
  const originalFindMany = prisma.providerProfile.findMany;
  const originalFindUnique = prisma.providerProfile.findUnique;
  const image = Buffer.alloc(200_000);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(image);
  const avatarUrl = `data:image/png;base64,${image.toString('base64')}`;
  const providers = Array.from({ length: 100 }, (_, index) => ({
    user: {
      id: `11111111-1111-4111-8111-${String(index).padStart(12, '0')}`,
      name: `Provider ${index}`,
      role: 'PROVIDER',
      isActive: true,
      avatarUrl: index === 1 ? null : avatarUrl,
      reviewsReceived: [],
    },
    averageRating: 5,
    bio: null,
    city: 'São Paulo',
    createdAt: new Date('2026-01-01'),
    hourlyRate: null,
    isUrgentAvailable: false,
    isVerified: false,
    neighborhood: null,
    specialties: [],
    state: 'SP',
    totalReviews: 0,
    categories: [],
    _count: { serviceRequests: 0 },
  }));
  prisma.providerProfile.findMany = async () => providers;
  prisma.providerProfile.findUnique = async ({ where }) => {
    const provider = providers.find((entry) => entry.user.id === where.userId);
    return provider ?? null;
  };

  try {
    const listing = await app.inject({ method: 'GET', url: '/api/providers?limit=100' });
    assert.equal(listing.statusCode, 200);
    const rows = listing.json();
    assert.equal(rows.length, 100);
    assert.equal(rows[0].avatarUrl, `/api/providers/${providers[0].user.id}/avatar`);
    assert.equal(rows[1].avatarUrl, null);
    assert.ok(!listing.body.includes('data:image/png;base64,'));
    assert.ok(listing.body.length < avatarUrl.length);

    const detail = await app.inject({ method: 'GET', url: `/api/providers/${providers[0].user.id}` });
    assert.equal(detail.statusCode, 200);
    assert.equal(detail.json().avatarUrl, avatarUrl);

    const avatar = await app.inject({ method: 'GET', url: rows[0].avatarUrl });
    assert.equal(avatar.statusCode, 200);
    assert.equal(avatar.headers['content-type'], 'image/png');
    assert.deepEqual(avatar.rawPayload, image);

    const missing = await app.inject({ method: 'GET', url: `/api/providers/${providers[1].user.id}/avatar` });
    assert.equal(missing.statusCode, 404);
  } finally {
    prisma.providerProfile.findMany = originalFindMany;
    prisma.providerProfile.findUnique = originalFindUnique;
    await app.close();
  }
});
