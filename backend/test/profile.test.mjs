import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret-with-at-least-32-characters';
const { buildApp } = await import('../dist/app.js');
const { prisma } = await import('../dist/config/prisma.js');
const { signAccessToken } = await import('../dist/lib/auth.js');

test('avatar endpoint accepts supported formats through 2 MB and rejects larger decoded files', async () => {
  const app = await buildApp();
  const userId = '11111111-1111-4111-8111-111111111111';
  const originalFindUnique = prisma.user.findUnique;
  const originalUpdate = prisma.user.update;
  prisma.user.findUnique = async () => ({ id: userId, role: 'CLIENT', isActive: true });
  prisma.user.update = async ({ data }) => ({ id: userId, avatarUrl: data.avatarUrl });
  const headers = { authorization: `Bearer ${signAccessToken({ sub: userId, role: 'CLIENT' })}` };
  const upload = avatarUrl => app.inject({ method: 'PUT', url: '/api/auth/me/avatar', headers, payload: { avatarUrl } });
  const signatures = {
    jpeg: Buffer.from([0xff, 0xd8, 0xff]),
    png: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    webp: Buffer.from('RIFF0000WEBP'),
    gif: Buffer.from('GIF89a'),
  };
  try {
    for (const type of ['jpeg', 'png', 'webp', 'gif']) {
      const response = await upload(`data:image/${type};base64,${signatures[type].toString('base64')}`);
      assert.equal(response.statusCode, 200, `${type}: ${response.body}`);
    }
    const exactBytes = Buffer.alloc(2 * 1024 * 1024);
    signatures.png.copy(exactBytes);
    const exactLimit = await upload(`data:image/png;base64,${exactBytes.toString('base64')}`);
    assert.equal(exactLimit.statusCode, 200, exactLimit.body);
    const oversizedBytes = Buffer.alloc(2 * 1024 * 1024 + 1);
    signatures.png.copy(oversizedBytes);
    const overLimit = await upload(`data:image/png;base64,${oversizedBytes.toString('base64')}`);
    assert.equal(overLimit.statusCode, 413, overLimit.body);
    assert.equal((await upload(`data:image/png;base64,${Buffer.from('not an image').toString('base64')}`)).statusCode, 400);
    const unsupported = await upload(`data:image/svg+xml;base64,${Buffer.from('<svg/>').toString('base64')}`);
    assert.equal(unsupported.statusCode, 400);
  } finally {
    prisma.user.findUnique = originalFindUnique;
    prisma.user.update = originalUpdate;
    await app.close();
  }
});
