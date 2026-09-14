import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret-with-at-least-32-characters';
const { buildApp } = await import('../dist/app.js');
const { prisma } = await import('../dist/config/prisma.js');
const { signAccessToken } = await import('../dist/lib/auth.js');

test('partial service edit preserves omitted urgency and schedule; explicit values can clear them', async () => {
  const app = await buildApp();
  const clientId = '11111111-1111-4111-8111-111111111111';
  const serviceId = '22222222-2222-4222-8222-222222222222';
  const categoryId = '33333333-3333-4333-8333-333333333333';
  let service = { id: serviceId, clientId, providerId: null, status: 'REQUESTED', urgencyFlag: true, scheduledFor: new Date('2026-10-01T12:00:00Z') };
  const originals = [];
  const stub = (model, method, implementation) => {
    const original = model[method];
    originals.push(() => { model[method] = original; });
    model[method] = implementation;
  };
  stub(prisma.user, 'findUnique', async () => ({ id: clientId, role: 'CLIENT', isActive: true }));
  stub(prisma.serviceRequest, 'findUnique', async () => service);
  stub(prisma.category, 'findFirst', async () => ({ id: categoryId }));
  stub(prisma.serviceRequest, 'updateMany', async ({ where, data }) => {
    assert.equal(where.clientId, clientId);
    assert.equal(where.status, 'REQUESTED');
    service = { ...service, ...Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) };
    return { count: 1 };
  });
  const edit = payload => app.inject({ method: 'PATCH', url: `/api/services/${serviceId}`,
    headers: { authorization: `Bearer ${signAccessToken({ sub: clientId, role: 'CLIENT' })}` },
    payload: { categoryId, description: 'Descricao atualizada do atendimento', ...payload },
  });
  try {
    const partial = await edit({});
    assert.equal(partial.statusCode, 200, partial.body);
    assert.equal(partial.json().service.urgencyFlag, true);
    assert.equal(partial.json().service.scheduledFor, '2026-10-01T12:00:00.000Z');
    const cleared = await edit({ urgencyFlag: false, scheduledFor: null });
    assert.equal(cleared.statusCode, 200, cleared.body);
    assert.equal(cleared.json().service.urgencyFlag, false);
    assert.equal(cleared.json().service.scheduledFor, null);
  } finally {
    originals.reverse().forEach(restore => restore());
    await app.close();
  }
});
