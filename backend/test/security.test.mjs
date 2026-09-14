import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret-with-at-least-32-characters';

const { buildApp } = await import('../dist/app.js');
const { signAccessToken, verifyAccessToken, validateAuthConfig, validateRuntimeConfig } = await import('../dist/lib/auth.js');
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
    payload: { email: 'user@example.com', password: 'x'.repeat(5 * 1024 * 1024) },
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

test('all environments reject the publicly known JWT secret', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSecret = process.env.JWT_SECRET;
  process.env.NODE_ENV = 'production';
  process.env.JWT_SECRET = 'faztudo-local-development-jwt-secret-2026-only';
  try {
    for (const environment of ['development', 'test', 'production']) {
      process.env.NODE_ENV = environment;
      assert.throws(() => validateAuthConfig());
    }
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.JWT_SECRET = originalSecret;
  }
});

test('production rejects bundled development database credentials', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalDatabaseUrl = process.env.DATABASE_URL;
  process.env.NODE_ENV = 'production';
  process.env.DATABASE_URL = 'mysql://root:password@mysql:3306/faztudo';
  try {
    assert.throws(() => validateRuntimeConfig());
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.DATABASE_URL = originalDatabaseUrl;
  }
});

test('provider registration requires and creates the profile in one transaction', async () => {
  const originalFindUnique = prisma.user.findUnique;
  const originalTransaction = prisma.$transaction;
  let createdProfile = false;
  let createdCategoryLink = false;

  prisma.user.findUnique = async () => null;
  prisma.$transaction = async (callback) => callback({
    user: {
      create: async ({ data }) => ({
        id: 'provider-id',
        name: data.name,
        email: data.email,
        role: data.role,
      }),
    },
    category: {
      findFirst: async () => ({ id: 'category-id' }),
    },
    providerProfile: {
      create: async () => {
        createdProfile = true;
        return { id: 'profile-id' };
      },
    },
    providerCategory: {
      create: async () => {
        createdCategoryLink = true;
        return {};
      },
    },
  });

  try {
    const missingProfile = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'Provider',
        email: 'provider@example.com',
        phone: '5511999999999',
        password: 'FazTudo123!',
        role: 'PROVIDER',
      },
    });
    assert.equal(missingProfile.statusCode, 400);
    assert.equal(createdProfile, false);

    const completeRegistration = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'Provider',
        email: 'provider@example.com',
        phone: '5511999999999',
        password: 'FazTudo123!',
        role: 'PROVIDER',
        providerProfile: {
          categoryId: '11111111-1111-4111-8111-111111111111',
          bio: 'Provider profile',
          specialties: ['Installation'],
          city: 'Sao Paulo',
          neighborhood: '',
          state: 'SP',
          hourlyRate: 80,
          isUrgentAvailable: true,
        },
      },
    });
    assert.equal(completeRegistration.statusCode, 201);
    assert.equal(createdProfile, true);
    assert.equal(createdCategoryLink, true);
  } finally {
    prisma.user.findUnique = originalFindUnique;
    prisma.$transaction = originalTransaction;
  }
});

test('protected routes reject missing or inactive users', async () => {
  const originalFindUnique = prisma.user.findUnique;
  prisma.user.findUnique = async ({ where }) => (where.id === 'missing-id' ? null : {
    id: where.id,
    isActive: false,
    role: 'PROVIDER',
  });

  try {
    const missingResponse = await app.inject({
      method: 'GET',
      url: '/api/provider/dashboard',
      headers: { authorization: `Bearer ${signAccessToken({ sub: 'missing-id', role: 'PROVIDER' })}` },
    });
    const inactiveResponse = await app.inject({
      method: 'GET',
      url: '/api/provider/dashboard',
      headers: { authorization: `Bearer ${signAccessToken({ sub: 'inactive-id', role: 'PROVIDER' })}` },
    });
    assert.equal(missingResponse.statusCode, 401);
    assert.equal(inactiveResponse.statusCode, 401);
  } finally {
    prisma.user.findUnique = originalFindUnique;
  }
});

test('protected routes use the current database role instead of the JWT role', async () => {
  const originalFindUnique = prisma.user.findUnique;
  prisma.user.findUnique = async ({ where }) => ({
    id: where.id,
    isActive: true,
    role: 'CLIENT',
  });

  try {
    const token = signAccessToken({ sub: 'client-id', role: 'PROVIDER' });
    const response = await app.inject({
      method: 'GET',
      url: '/api/provider/dashboard',
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(response.statusCode, 403);
  } finally {
    prisma.user.findUnique = originalFindUnique;
  }
});

test('profile updates cannot self-verify a provider', async () => {
  const originalTransaction = prisma.$transaction;
  const originalUserFindUnique = prisma.user.findUnique;
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
  prisma.user.findUnique = async () => ({ id: 'provider-id', isActive: true, role: 'PROVIDER' });
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
    prisma.user.findUnique = originalUserFindUnique;
    prisma.userVerification.findFirst = originalVerificationFindFirst;
  }
});

test('service routes enforce ownership, roles and ignore spoofed ownership fields', async () => {
  const originalUserFindUnique = prisma.user.findUnique;
  const originalServiceFindUnique = prisma.serviceRequest.findUnique;
  const originalServiceUpdateMany = prisma.serviceRequest.updateMany;
  const originalServiceCreate = prisma.serviceRequest.create;
  const originalCategoryFindFirst = prisma.category.findFirst;
  const originalProviderProfileFindUnique = prisma.providerProfile.findUnique;
  let updateWhere;
  let createdService;
  let currentUser = { id: '11111111-1111-4111-8111-111111111111', role: 'CLIENT' };
  const clientA = currentUser.id;
  const clientB = '22222222-2222-4222-8222-222222222222';
  const providerA = '33333333-3333-4333-8333-333333333333';
  const providerB = '44444444-4444-4444-8444-444444444444';
  const serviceId = '55555555-5555-4555-8555-555555555555';

  prisma.user.findUnique = async () => ({ id: currentUser.id, isActive: true, role: currentUser.role });
  prisma.serviceRequest.findUnique = async () => ({
    id: serviceId,
    clientId: clientB,
    providerId: providerB,
    status: 'REQUESTED',
  });
  prisma.serviceRequest.updateMany = async ({ where }) => {
    updateWhere = where;
    return { count: 1 };
  };
  prisma.serviceRequest.create = async ({ data }) => {
    createdService = data;
    return { id: serviceId, ...data, status: 'REQUESTED' };
  };
  prisma.category.findFirst = async () => ({ id: '66666666-6666-4666-8666-666666666666' });
  prisma.providerProfile.findUnique = async () => ({
    isUrgentAvailable: true,
    user: { role: 'PROVIDER', isActive: true },
    categories: [{ categoryId: '66666666-6666-4666-8666-666666666666', category: { isActive: true } }],
  });

  const tokenFor = (user) => signAccessToken({ sub: user.id, role: user.role });
  const editPayload = {
    categoryId: '66666666-6666-4666-8666-666666666666',
    description: 'Descricao valida para o pedido de servico.',
  };

  try {
    const clientOnOtherService = await app.inject({
      method: 'PATCH', url: `/api/services/${serviceId}`, headers: { authorization: `Bearer ${tokenFor({ id: clientA, role: 'CLIENT' })}` }, payload: editPayload,
    });
    assert.equal(clientOnOtherService.statusCode, 403);

    currentUser = { id: providerA, role: 'PROVIDER' };
    const providerOnOtherService = await app.inject({
      method: 'PATCH', url: `/api/services/${serviceId}/status`, headers: { authorization: `Bearer ${tokenFor(currentUser)}` }, payload: { status: 'ACCEPTED' },
    });
    assert.equal(providerOnOtherService.statusCode, 403);

    currentUser = { id: clientB, role: 'CLIENT' };
    const clientProviderOnlyAction = await app.inject({
      method: 'PATCH', url: `/api/services/${serviceId}/status`, headers: { authorization: `Bearer ${tokenFor(currentUser)}` }, payload: { status: 'ACCEPTED' },
    });
    assert.equal(clientProviderOnlyAction.statusCode, 409);

    currentUser = { id: providerB, role: 'PROVIDER' };
    const providerClientOnlyAction = await app.inject({
      method: 'PATCH', url: `/api/services/${serviceId}`, headers: { authorization: `Bearer ${tokenFor(currentUser)}` }, payload: editPayload,
    });
    assert.equal(providerClientOnlyAction.statusCode, 403);

    currentUser = { id: clientB, role: 'CLIENT' };
    const spoofedOwner = await app.inject({
      method: 'POST', url: '/api/services', headers: { authorization: `Bearer ${tokenFor(currentUser)}` },
      payload: { ...editPayload, clientId: clientA, providerId: providerA },
    });
    assert.equal(spoofedOwner.statusCode, 400);

    const providerSelection = await app.inject({
      method: 'POST', url: '/api/services', headers: { authorization: `Bearer ${tokenFor(currentUser)}` },
      payload: { ...editPayload, providerId: providerA },
    });
    assert.equal(providerSelection.statusCode, 201);
    assert.equal(createdService.clientId, clientB);
    assert.equal(createdService.providerId, providerA);

    const ownEdit = await app.inject({
      method: 'PATCH', url: `/api/services/${serviceId}`, headers: { authorization: `Bearer ${tokenFor(currentUser)}` }, payload: editPayload,
    });
    assert.equal(ownEdit.statusCode, 200);
    assert.equal(updateWhere.clientId, clientB);
  } finally {
    prisma.user.findUnique = originalUserFindUnique;
    prisma.serviceRequest.findUnique = originalServiceFindUnique;
    prisma.serviceRequest.updateMany = originalServiceUpdateMany;
    prisma.serviceRequest.create = originalServiceCreate;
    prisma.category.findFirst = originalCategoryFindFirst;
    prisma.providerProfile.findUnique = originalProviderProfileFindUnique;
  }
});

test('chat routes require room participation and always use the authenticated sender', async () => {
  const originalUserFindUnique = prisma.user.findUnique;
  const originalRoomFindUnique = prisma.chatRoom.findUnique;
  const originalMessageUpdateMany = prisma.chatMessage.updateMany;
  const originalMessageCreate = prisma.chatMessage.create;
  const outsider = '77777777-7777-4777-8777-777777777777';
  const client = '88888888-8888-4888-8888-888888888888';
  const provider = '99999999-9999-4999-8999-999999999999';
  const roomId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  let currentUser = { id: outsider, role: 'CLIENT' };
  let sentMessage;

  prisma.user.findUnique = async () => ({ id: currentUser.id, isActive: true, role: currentUser.role });
  prisma.chatRoom.findUnique = async () => ({
    id: roomId,
    clientId: client,
    providerId: provider,
    createdAt: new Date(),
    client: { name: 'Client' },
    provider: { name: 'Provider' },
    messages: [],
  });
  prisma.chatMessage.updateMany = async () => ({ count: 1 });
  prisma.chatMessage.create = async ({ data }) => {
    sentMessage = data;
    return { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', ...data, isRead: false, createdAt: new Date() };
  };
  const token = () => signAccessToken({ sub: currentUser.id, role: currentUser.role });

  try {
    for (const request of [
      { method: 'GET', url: `/api/chat/rooms/${roomId}/messages` },
      { method: 'POST', url: `/api/chat/rooms/${roomId}/read` },
      { method: 'POST', url: '/api/chat/messages', payload: { roomId, content: 'Mensagem indevida' } },
    ]) {
      const response = await app.inject({ ...request, headers: { authorization: `Bearer ${token()}` } });
      assert.equal(response.statusCode, 403);
    }

    const spoofedSender = await app.inject({
      method: 'POST', url: '/api/chat/messages', headers: { authorization: `Bearer ${token()}` },
      payload: { roomId, senderId: client, content: 'Tentativa de falsificar remetente' },
    });
    assert.equal(spoofedSender.statusCode, 400);

    currentUser = { id: client, role: 'CLIENT' };
    const ownMessage = await app.inject({
      method: 'POST', url: '/api/chat/messages', headers: { authorization: `Bearer ${token()}` }, payload: { roomId, content: 'Mensagem legitima' },
    });
    assert.equal(ownMessage.statusCode, 201);
    assert.equal(sentMessage.senderId, client);

    const ownRead = await app.inject({ method: 'POST', url: `/api/chat/rooms/${roomId}/read`, headers: { authorization: `Bearer ${token()}` } });
    assert.equal(ownRead.statusCode, 200);
  } finally {
    prisma.user.findUnique = originalUserFindUnique;
    prisma.chatRoom.findUnique = originalRoomFindUnique;
    prisma.chatMessage.updateMany = originalMessageUpdateMany;
    prisma.chatMessage.create = originalMessageCreate;
  }
});

test('profile and avatar endpoints are self-scoped and retain legitimate self-service', async () => {
  const originalUserFindUnique = prisma.user.findUnique;
  const originalUserUpdate = prisma.user.update;
  const self = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const other = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  let updatedWhere;
  prisma.user.findUnique = async () => ({ id: self, isActive: true, role: 'CLIENT' });
  prisma.user.update = async ({ where, data }) => {
    updatedWhere = where;
    return { id: where.id, avatarUrl: data.avatarUrl };
  };
  const headers = { authorization: `Bearer ${signAccessToken({ sub: self, role: 'CLIENT' })}` };

  try {
    const spoofedAvatarOwner = await app.inject({
      method: 'PUT', url: '/api/auth/me/avatar', headers,
      payload: { userId: other, avatarUrl: 'data:image/png;base64,iVBORw0KGgo=' },
    });
    assert.equal(spoofedAvatarOwner.statusCode, 400);

    const ownAvatar = await app.inject({
      method: 'PUT', url: '/api/auth/me/avatar', headers, payload: { avatarUrl: 'data:image/png;base64,iVBORw0KGgo=' },
    });
    assert.equal(ownAvatar.statusCode, 200);
    assert.equal(updatedWhere.id, self);

    const ownAvatarRemoval = await app.inject({ method: 'DELETE', url: '/api/auth/me/avatar', headers });
    assert.equal(ownAvatarRemoval.statusCode, 200);
    assert.equal(updatedWhere.id, self);

    const otherProfile = await app.inject({
      method: 'PUT', url: '/api/provider/profile/me', headers,
      payload: { userId: other, name: 'Alteracao indevida' },
    });
    assert.equal(otherProfile.statusCode, 403);
  } finally {
    prisma.user.findUnique = originalUserFindUnique;
    prisma.user.update = originalUserUpdate;
  }
});
