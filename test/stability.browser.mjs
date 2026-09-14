// Run after npm run build, with Docker running and PLAYWRIGHT_MODULE pointing
// to an installed playwright/index.mjs (the dependency can live outside the repo).
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { preview } from 'vite';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const fixtureIds = [randomUUID(), randomUUID(), randomUUID()];
const password = randomBytes(24).toString('base64url');
const docker = code => execFileSync('docker', ['compose', '-f', 'backend/docker-compose.yml', 'exec', '-T', 'app', 'node', '--input-type=module'], {
  input: code, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'],
});
const dbImports = "import { prisma } from './dist/config/prisma.js';";
let server;
let browser;
let realCalls = 0;
const serverErrors = [];
const browserErrors = [];
const sessions = [];
let injectingFailure = false;
async function api(path, { token, payload, expected = 200 } = {}) {
  const response = await fetch('http://localhost:3001' + path, {
    method: payload ? 'POST' : 'GET',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  realCalls++;
  if (response.status >= 500) serverErrors.push([path, response.status]);
  assert.equal(response.status, expected, `${path}: ${response.status}`);
  return response.json();
}

try {
  docker(`${dbImports}
    import { hashPassword } from './dist/lib/auth.js';
    const ids = ${JSON.stringify(fixtureIds)};
    const passwordHash = await hashPassword(${JSON.stringify(password)});
    try {
      for (const [index, id] of ids.entries()) await prisma.user.create({ data: {
        id, name: 'Audit ' + (index === 0 ? 'Client' : 'Provider'), email: id + '@audit.invalid',
        phone: id, passwordHash, role: index === 0 ? 'CLIENT' : 'PROVIDER',
        ...(index === 1 ? {providerProfile:{create:{}}} : {}),
      }});
    } finally { await prisma.$disconnect(); }
  `);
  await api('/health');
  await api('/api/auth/login', { payload: { email: fixtureIds[0] + '@audit.invalid', password: 'wrong-password' }, expected: 401 });
  await api('/api/auth/me', { expected: 401 });
  await api('/api/auth/me', { token: 'invalid', expected: 401 });
  await api('/api/does-not-exist', { expected: 404 });
  for (const [index, id] of fixtureIds.entries()) {
    const login = await api('/api/auth/login', { payload: { email: id + '@audit.invalid', password } });
    sessions.push(login);
    const token = login.accessToken;
    for (const path of ['/api/auth/me', '/api/providers', '/api/categories', '/api/services']) await api(path, { token });
    await api('/api/provider/dashboard', { token, expected: index === 0 ? 403 : 200 });
    await api('/api/provider/profile/me', { token, expected: index === 0 ? 403 : index === 1 ? 200 : 404 });
  }
  console.log('PASS: real login, initial APIs, 401/403/404 for CLIENT and PROVIDER');

  server = await preview({ preview: { host: '127.0.0.1', port: 4173, strictPort: true }, logLevel: 'error' });
  const base = 'http://127.0.0.1:4173';
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', error => browserErrors.push(error.message));
  page.on('response', response => {
    if (response.url().includes('/api/') && !injectingFailure) {
      realCalls++;
      if (response.status() >= 500) serverErrors.push([response.url(), response.status()]);
    }
  });
  const storeSession = async session => {
    await page.goto(base + '/login');
    await page.evaluate(value => sessionStorage.setItem('faztudo_session', JSON.stringify(value)), session);
  };
  const ready = () => page.getByRole('button', { name: 'Sair', exact: true }).waitFor();
  for (const index of [0, 1]) {
    await page.goto(base + '/login');
    await page.locator('#email').fill(fixtureIds[index] + '@audit.invalid');
    await page.locator('#password').fill(password);
    const loginResponse = page.waitForResponse(response => response.url().endsWith('/api/auth/login'));
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    assert.equal((await loginResponse).status(), 200, 'Browser login must return 200');
    await page.waitForURL(base + (index === 0 ? '/home' : '/dashboard'));
    await ready();
    await page.reload();
    await ready();
    assert.equal(await page.evaluate(() => JSON.parse(sessionStorage.getItem('faztudo_session')).user.role), index === 0 ? 'CLIENT' : 'PROVIDER');
    const routes = index === 0 ? ['/servicos', '/urgente', '/home'] : ['/perfil/editar', '/home', '/dashboard'];
    for (const route of routes) {
      await page.goto(base + route);
      await page.waitForLoadState('networkidle');
      assert.equal(new URL(page.url()).pathname, route);
      assert.ok((await page.locator('#root').innerText()).trim().length > 30);
      assert.equal(await page.getByRole('alert').filter({ hasText: 'Não foi possível validar sua sessão.' }).count(), 0);
      console.log(`PASS: initial screen ${route}`);
    }
    await page.getByRole('button', { name: 'Sair', exact: true }).click();
    await page.waitForURL(/\/login/);
    assert.equal(await page.evaluate(() => sessionStorage.getItem('faztudo_session')), null);
    await page.goto(base + (index === 0 ? '/home' : '/dashboard'));
    await page.waitForURL(/\/login/);
    console.log(`PASS: browser login, reload, main screens and logout (${index === 0 ? 'CLIENT' : 'PROVIDER'})`);
  }

  await storeSession({ accessToken: 'invalid', user: sessions[0].user });
  await page.goto(base + '/home');
  await page.waitForURL(/\/login/);
  assert.equal(await page.evaluate(() => sessionStorage.getItem('faztudo_session')), null);
  console.log('PASS: invalid persisted token redirects to login');

  await storeSession(sessions[0]);
  injectingFailure = true;
  await page.route('**/api/auth/me', route => route.fulfill({ status: 503, json: { error: 'Audit: database temporarily unavailable' } }));
  await page.goto(base + '/home');
  await page.getByRole('alert').filter({ hasText: 'Não foi possível validar sua sessão.' }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Sair', exact: true }).count(), 0);
  assert.ok(await page.evaluate(() => sessionStorage.getItem('faztudo_session')));
  await page.unroute('**/api/auth/me');
  injectingFailure = false;
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await ready();
  console.log('PASS: session validation outage blocks initial load; retry recovers');

  injectingFailure = true;
  await page.route('**/api/services', route => route.fulfill({ status: 401, json: { error: 'Invalid token' } }));
  await page.locator('a[href="/servicos"]').first().click();
  await page.waitForURL(/\/login/);
  assert.equal(await page.evaluate(() => sessionStorage.getItem('faztudo_session')), null);
  await page.unroute('**/api/services');
  injectingFailure = false;
  console.log('PASS: 401 from a mounted screen updates route guard immediately');

  await storeSession(sessions[0]);
  let meRequests = 0;
  let release;
  const held = new Promise(resolve => { release = resolve; });
  let notifyHeld;
  const received = new Promise(resolve => { notifyHeld = resolve; });
  await page.route('**/api/auth/me', async route => {
    meRequests++;
    if (meRequests === 2) {
      const response = await route.fetch();
      notifyHeld();
      await held;
      await route.fulfill({ response });
    } else await route.continue();
  });
  await page.goto(base + '/home');
  await ready();
  await Promise.race([received, new Promise((_, reject) => setTimeout(() => reject(new Error('Missing second /me request')), 10000))]);
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await page.waitForURL(/\/login/);
  release();
  await page.waitForLoadState('networkidle');
  assert.equal(await page.evaluate(() => sessionStorage.getItem('faztudo_session')), null);
  await page.unroute('**/api/auth/me');
  console.log('PASS: late profile response cannot restore session after logout');

  await storeSession(sessions[1]);
  injectingFailure = true;
  await page.route('**/api/provider/profile/me', route => route.fulfill({ status: 503, json: { error: 'Audit: temporary outage' } }));
  await page.goto(base + '/dashboard');
  await page.getByRole('heading', { name: 'Não foi possível carregar o painel', exact: true }).waitFor();
  await page.unroute('**/api/provider/profile/me');
  injectingFailure = false;
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await ready();
  console.log('PASS: dashboard profile failure is not treated as missing profile');

  await storeSession(sessions[2]);
  await page.goto(base + '/dashboard');
  await page.getByRole('link', { name: 'Completar cadastro' }).first().click();
  await page.waitForURL(base + '/perfil/editar');
  await page.waitForLoadState('networkidle');
  console.log('PASS: provider without profile opens profile editor without redirect loop');

  await page.goto(base + '/does-not-exist');
  await page.getByRole('heading', { name: 'Página não encontrada' }).waitFor();
  assert.deepEqual(serverErrors, []);
  assert.deepEqual(browserErrors, []);
  console.log(`PASS: ${realCalls} real API calls; zero HTTP 5xx; zero browser runtime errors (injected faults excluded)`);
} finally {
  await browser?.close();
  await new Promise(resolve => server ? server.httpServer.close(resolve) : resolve());
  docker(`${dbImports}
    try {
      await prisma.user.deleteMany({where:{id:{in:${JSON.stringify(fixtureIds)}}}});
      const count = await prisma.user.count({where:{id:{in:${JSON.stringify(fixtureIds)}}}});
      if (count !== 0) throw new Error('Fixture cleanup failed');
    } finally { await prisma.$disconnect(); }
  `);
  console.log('Temporary audit users removed; browser and preview server closed');
}
