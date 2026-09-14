import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret-with-at-least-32-characters';
const { buildApp } = await import('../dist/app.js');
const { prisma } = await import('../dist/config/prisma.js');
const { signAccessToken } = await import('../dist/lib/auth.js');

test('CLIENT starts chat; both participants reopen it and PROVIDER replies without a service', async () => {
  const app = await buildApp();
  const clientId = '11111111-1111-4111-8111-111111111111';
  const providerId = '22222222-2222-4222-8222-222222222222';
  const outsiderId = '33333333-3333-4333-8333-333333333333';
  const roomId = '44444444-4444-4444-8444-444444444444';
  const originals = [];
  const stub = (model, method, implementation) => {
    const original = model[method];
    originals.push(() => { model[method] = original; });
    model[method] = implementation;
  };
  let room;
  const messages = [];
  let creations = 0;
  stub(prisma.user, 'findUnique', async ({ where }) => ({ id: where.id, isActive: true, role: where.id === providerId ? 'PROVIDER' : 'CLIENT' }));
  stub(prisma.providerProfile, 'findUnique', async ({ where }) => where.userId === providerId ? { user: { role: 'PROVIDER', isActive: true } } : null);
  stub(prisma.serviceRequest, 'findFirst', async () => null);
  stub(prisma.serviceRequest, 'findUnique', async () => { throw new Error('Existing room must not require service lookup'); });
  stub(prisma.chatRoom, 'findFirst', async ({ where }) => room && room.clientId === where.clientId && room.providerId === where.providerId && room.serviceRequestId === where.serviceRequestId ? room : null);
  stub(prisma.chatRoom, 'findUnique', async ({ where }) => where.id === room?.id ? room : null);
  stub(prisma.chatRoom, 'create', async ({ data }) => {
    creations++;
    room = { ...data, id: roomId, serviceRequestId: null, client: { name: 'Client' }, provider: { name: 'Provider' }, messages: [], createdAt: new Date() };
    return room;
  });
  stub(prisma.chatMessage, 'create', async ({ data }) => {
    const message = { ...data, id: String(messages.length), isRead: false, createdAt: new Date() };
    messages.push(message);
    return message;
  });
  stub(prisma.chatMessage, 'findMany', async () => [...messages].reverse());
  const request = (userId, method, url, payload) => app.inject({ method, url, payload, headers: { authorization: `Bearer ${signAccessToken({ sub: userId, role: userId === providerId ? 'PROVIDER' : 'CLIENT' })}` } });
  try {
    const start = await request(clientId, 'POST', '/api/chat/rooms', { providerId });
    assert.equal(start.statusCode, 200, start.body);
    assert.equal(start.json().room.clientId, clientId);
    assert.equal((await request(clientId, 'POST', '/api/chat/messages', { roomId, content: 'Ola' })).statusCode, 201);
    const legacyOpen = await request(providerId, 'POST', '/api/chat/rooms', { clientId });
    assert.equal(legacyOpen.statusCode, 200, legacyOpen.body);
    assert.equal(legacyOpen.json().room.id, roomId);
    for (const serviceRequestId of [null, '55555555-5555-4555-8555-555555555555']) {
      room.serviceRequestId = serviceRequestId;
      for (const userId of [clientId, providerId]) {
        const opened = await request(userId, 'POST', '/api/chat/rooms', { roomId });
        assert.equal(opened.statusCode, 200, opened.body);
        assert.equal(opened.json().room.id, roomId);
      }
    }
    const reply = await request(providerId, 'POST', '/api/chat/messages', { roomId, content: 'Posso ajudar' });
    assert.equal(reply.statusCode, 201, reply.body);
    assert.equal(reply.json().message.senderId, providerId);
    const history = await request(clientId, 'GET', `/api/chat/rooms/${roomId}/messages`);
    assert.equal(history.statusCode, 200);
    assert.deepEqual(history.json().map(message => message.content), ['Ola', 'Posso ajudar']);
    for (const [method, url, payload] of [
      ['POST', '/api/chat/rooms', { roomId }],
      ['GET', `/api/chat/rooms/${roomId}/messages`],
      ['POST', `/api/chat/rooms/${roomId}/read`, {}],
      ['POST', '/api/chat/messages', { roomId, content: 'Intrusao' }],
    ]) {
      assert.equal((await request(outsiderId, method, url, payload)).statusCode, 403);
      assert.equal((await app.inject({ method, url, payload })).statusCode, 401);
    }
    assert.equal((await request(providerId, 'POST', '/api/chat/rooms', { clientId: outsiderId })).statusCode, 403);
    assert.equal(creations, 1);
    assert.equal(messages.length, 2);
  } finally {
    originals.reverse().forEach(restore => restore());
    await app.close();
  }
});
