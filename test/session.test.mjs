import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { beforeEach, test } from 'node:test';
import ts from '../backend/node_modules/typescript/lib/typescript.js';

const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText).toString('base64');
const sessionUrl = moduleUrl(await readFile(new URL('../src/app/lib/session.ts', import.meta.url), 'utf8'));
const session = await import(sessionUrl);
const api = await import(moduleUrl((await readFile(new URL('../src/app/lib/api.ts', import.meta.url), 'utf8'))
  .replace("'./session'", JSON.stringify(sessionUrl))
  .replace('import.meta.env.VITE_API_BASE_URL', "''")));
const user = { id: 'client', name: 'Client', email: 'client@example.invalid', role: 'CLIENT' };
const storage = () => {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
};
beforeEach(() => {
  globalThis.window = Object.assign(new EventTarget(), { sessionStorage: storage(), localStorage: storage(), setTimeout, clearTimeout });
});

test('session persists during reload and logout notifies mounted subscribers', () => {
  let changes = 0;
  const unsubscribe = session.subscribeSession(() => changes++);
  window.localStorage.setItem('faztudo_session', 'legacy');
  session.saveSession({ accessToken: 'token', user });
  assert.deepEqual(session.getCurrentUser(), user);
  assert.equal(window.localStorage.getItem('faztudo_session'), null);
  assert.equal(JSON.parse(window.sessionStorage.getItem('faztudo_session')).accessToken, 'token');
  session.clearSession();
  assert.equal(session.getSession(), null);
  assert.equal(changes, 2);
  unsubscribe();
  session.saveSession({ accessToken: 'token', user });
  assert.equal(changes, 2);
});

test('malformed and incomplete persisted sessions are not authenticated', () => {
  for (const value of ['{', 'null', '{}', '{"accessToken":"token","user":{}}', JSON.stringify({ accessToken: '', user })]) {
    window.sessionStorage.setItem('faztudo_session', value);
    assert.equal(session.isLoggedIn(), false);
    assert.equal(session.getCurrentUser(), null);
  }
});

test('401 expires current session and notifies subscribers', async () => {
  session.saveSession({ accessToken: 'token', user });
  let changes = 0;
  const unsubscribe = session.subscribeSession(() => changes++);
  globalThis.fetch = async () => new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
  await assert.rejects(api.apiGet('/api/auth/me'), error => error.status === 401);
  assert.equal(session.getSession(), null);
  assert.equal(changes, 1);
  unsubscribe();
});

test('late 401 from an old request cannot erase a newer login', async () => {
  session.saveSession({ accessToken: 'old-token', user });
  let finish;
  globalThis.fetch = () => new Promise(resolve => { finish = resolve; });
  const pending = api.apiGet('/api/auth/me');
  session.saveSession({ accessToken: 'new-token', user });
  finish(new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 }));
  await assert.rejects(pending, error => error.status === 401);
  assert.equal(session.getAccessToken(), 'new-token');
});

test('403, server failures and wrong login credentials preserve an existing session', async () => {
  for (const [path, status] of [['/api/provider/dashboard', 403], ['/api/auth/me', 503], ['/api/auth/login', 401]]) {
    session.saveSession({ accessToken: 'token', user });
    globalThis.fetch = async () => new Response(JSON.stringify({ error: 'Expected failure' }), { status });
    await assert.rejects(api.apiGet(path), error => error.status === status);
    assert.equal(session.getAccessToken(), 'token');
  }
});

test('first API request after login carries the new token; logout removes it', async () => {
  const headers = [];
  globalThis.fetch = async (_url, options) => { headers.push(options.headers); return new Response('{}'); };
  session.saveSession({ accessToken: 'new-token', user });
  await api.apiGet('/api/services');
  session.clearSession();
  await api.apiGet('/api/categories');
  assert.equal(headers[0].Authorization, 'Bearer new-token');
  assert.equal(headers[1].Authorization, undefined);
});

test('network failure remains visible without destroying the session', async () => {
  session.saveSession({ accessToken: 'token', user });
  globalThis.fetch = async () => { throw new TypeError('Network disconnected'); };
  await assert.rejects(api.apiGet('/api/auth/me'), error => error instanceof api.ApiError && error.status === 0);
  assert.equal(session.getAccessToken(), 'token');
});
