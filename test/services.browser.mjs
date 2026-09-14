// Requires the built frontend, Docker backend, and PLAYWRIGHT_MODULE (see stability.browser.mjs).
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { preview } from 'vite';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const ids = Array.from({ length: 4 }, () => randomUUID());
const password = randomBytes(24).toString('base64url');
const docker = input => execFileSync('docker', ['compose', '-f', 'backend/docker-compose.yml', 'exec', '-T', 'app', 'node', '--input-type=module'], { input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
const imports = "import { prisma } from './dist/config/prisma.js';";
let browser;
let server;
const sessions = [];
const errors = [];
const pageErrors = [];
let calls = 0;
async function api(index, method, path, payload, expected = 200) {
  const response = await fetch('http://localhost:3001' + path, {
    method, headers: { 'content-type': 'application/json', ...(sessions[index] ? { authorization: `Bearer ${sessions[index].accessToken}` } : {}) },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
  calls++;
  if (response.status >= 500) errors.push([path, response.status]);
  assert.equal(response.status, expected, `${method} ${path}: ${response.status}`);
  return response.json();
}
try {
  const categoryId = JSON.parse(docker(`${imports}
    import { hashPassword } from './dist/lib/auth.js';
    try {
      const category = await prisma.category.findFirst({where:{isActive:true,slug:'hidraulica'}});
      if (!category) throw new Error('Test requires an existing active hidraulica category');
      const passwordHash = await hashPassword(${JSON.stringify(password)});
      for (const [index,id] of ${JSON.stringify(ids)}.entries()) await prisma.user.create({data:{
        id, name: 'Services Audit ' + index, email:id+'@services-audit.invalid',phone:id,passwordHash,
        role:index < 2 ? 'CLIENT' : 'PROVIDER',
        ...(index >= 2 ? {providerProfile:{create:{isUrgentAvailable:true,categories:{create:{categoryId:category.id}}}}} : {}),
      }});
      console.log(JSON.stringify(category.id));
    } finally { await prisma.$disconnect(); }
  `));
  for (const [index, id] of ids.entries()) sessions.push(await api(index, 'POST', '/api/auth/login', { email: id + '@services-audit.invalid', password }));
  const create = async (description, extra = {}) => (await api(0, 'POST', '/api/services', { providerId: ids[2], categoryId, description, ...extra }, 201)).service;
  const status = (index, service, next, expected = 200) => api(index, 'PATCH', `/api/services/${service.id}/status`, { status: next }, expected);
  const list = index => api(index, 'GET', '/api/services');
  await api(2, 'POST', '/api/services', { providerId: ids[3], categoryId, description: 'Provider cannot request' }, 403);
  const lifecycle = await create('Audit lifecycle service', { urgencyFlag: true, scheduledFor: '2026-10-01T12:00:00Z' });
  assert.equal(lifecycle.status, 'REQUESTED');
  assert.equal((await list(0)).length, 1);
  assert.equal((await list(2)).length, 1);
  assert.equal((await list(1)).length, 0);
  assert.equal((await list(3)).length, 0);
  await status(0, lifecycle, 'ACCEPTED', 409);
  await status(2, lifecycle, 'COMPLETED', 409);
  await status(3, lifecycle, 'ACCEPTED', 403);
  await status(1, lifecycle, 'CANCELLED', 403);
  await api(2, 'PATCH', `/api/services/${lifecycle.id}`, { categoryId, description: 'Provider cannot edit' }, 403);
  const edited = await api(0, 'PATCH', `/api/services/${lifecycle.id}`, { categoryId, description: lifecycle.description });
  assert.equal(edited.service.urgencyFlag, true);
  assert.equal(edited.service.scheduledFor, '2026-10-01T12:00:00.000Z');
  console.log('PASS: creation stays REQUESTED; scoped lists; CLIENT/PROVIDER permissions; partial edit preserves fields');

  server = await preview({ preview: { host: '127.0.0.1', port: 4173, strictPort: true }, logLevel: 'error' });
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const client = await browser.newPage();
  const provider = await browser.newPage();
  for (const [page, index] of [[client, 0], [provider, 2]]) {
    page.setDefaultTimeout(12000);
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('dialog', dialog => dialog.accept());
    await page.goto('http://127.0.0.1:4173/login');
    await page.evaluate(session => sessionStorage.setItem('faztudo_session', JSON.stringify(session)), sessions[index]);
  }
  const goto = (page, path) => page.goto('http://127.0.0.1:4173' + path);
  const card = (page, description) => page.locator('[data-slot="card"]').filter({ hasText: description });
  await goto(provider, '/dashboard');
  await card(provider, lifecycle.description).getByRole('button', { name: 'Aceitar', exact: true }).click();
  await provider.getByRole('tab', { name: 'Serviços aceitos e concluídos' }).click();
  await card(provider, lifecycle.description).getByRole('button', { name: 'Iniciar', exact: true }).click();
  await card(provider, lifecycle.description).getByText('Em andamento', { exact: true }).waitFor();
  await card(provider, lifecycle.description).getByRole('button', { name: 'Finalizar', exact: true }).click();
  await card(provider, lifecycle.description).getByText('Concluído', { exact: true }).waitFor();
  await provider.getByText('0 solicitações no painel', { exact: true }).waitFor();
  await goto(client, '/servicos');
  await card(client, lifecycle.description).getByText('Concluido', { exact: true }).waitFor();
  await status(0, lifecycle, 'CANCELLED', 409);
  await status(2, lifecycle, 'IN_PROGRESS', 409);
  await status(2, lifecycle, 'COMPLETED', 409);
  console.log('PASS: provider buttons accept, start and complete; client sees completion; terminal states reject changes');

  const editable = await create('Audit cancel editor service');
  await goto(provider, '/dashboard');
  await provider.getByText('1 solicitações no painel', { exact: true }).waitFor();
  await goto(client, '/servicos');
  await card(client, editable.description).getByRole('button', { name: 'Editar', exact: true }).click();
  await card(client, editable.description).getByRole('button', { name: 'Salvar alterações' }).waitFor();
  await card(client, editable.description).getByRole('button', { name: 'Cancelar', exact: true }).click();
  await card(client, editable.description).getByText('Cancelado', { exact: true }).waitFor();
  assert.equal(await card(client, editable.description).getByRole('button', { name: 'Salvar alterações' }).count(), 0);
  console.log('PASS: client cancellation closes the editor');

  const conflict = await create('Audit edit conflict service');
  await goto(client, '/servicos');
  await card(client, conflict.description).getByRole('button', { name: 'Editar', exact: true }).click();
  await status(2, conflict, 'ACCEPTED');
  await card(client, conflict.description).getByRole('button', { name: 'Salvar alterações' }).click();
  await card(client, conflict.description).getByText('Aceito', { exact: true }).waitFor();
  assert.equal(await card(client, conflict.description).getByRole('button', { name: 'Editar', exact: true }).count(), 0);
  await goto(provider, '/dashboard');
  await provider.getByText('0 solicitações no painel', { exact: true }).waitFor();
  await status(2, conflict, 'IN_PROGRESS');
  await goto(provider, '/dashboard');
  await provider.getByText('0 solicitações no painel', { exact: true }).waitFor();
  await status(2, conflict, 'CANCELLED');
  console.log('PASS: client reloads authoritative status after edit conflict; provider can cancel accepted service');

  const stale = await create('Audit stale provider service');
  await goto(provider, '/dashboard');
  await card(provider, stale.description).getByRole('button', { name: 'Aceitar', exact: true }).waitFor();
  await status(0, stale, 'CANCELLED');
  await card(provider, stale.description).getByRole('button', { name: 'Aceitar', exact: true }).click();
  await provider.getByText('Nenhuma solicitação pendente no momento.').waitFor();
  console.log('PASS: provider refreshes after conflicting cancellation');

  const first = await create('Audit first pending service');
  const second = await create('Audit second pending service');
  await goto(provider, '/dashboard');
  let release;
  const hold = new Promise(resolve => { release = resolve; });
  await provider.route(`**/api/services/${first.id}/status`, async route => { await hold; await route.continue(); });
  await card(provider, first.description).getByRole('button', { name: 'Aceitar', exact: true }).click();
  assert.equal(await card(provider, second.description).getByRole('button', { name: 'Aceitar', exact: true }).isDisabled(), true);
  release();
  await card(provider, first.description).waitFor({ state: 'detached' });
  await provider.unroute(`**/api/services/${first.id}/status`);
  await status(0, first, 'CANCELLED');
  await status(0, second, 'CANCELLED');
  console.log('PASS: pending status request disables conflicting provider actions');

  await goto(client, `/prestador/${ids[2]}`);
  await client.getByRole('button', { name: 'Contratar Agora', exact: true }).click();
  await client.locator('textarea').fill('curto');
  await client.getByRole('button', { name: 'Confirmar Contratação' }).click();
  await client.getByText('A descrição deve ter pelo menos 10 caracteres.').first().waitFor();
  await client.locator('textarea').fill('Audit booking after creation');
  let releaseBooking;
  const bookingHold = new Promise(resolve => { releaseBooking = resolve; });
  await client.route('**/api/services', async route => { if (route.request().method() === 'POST') await bookingHold; await route.continue(); });
  await client.route('**/api/chat/rooms', route => route.fulfill({ status: 503, json: { error: 'Simulated downstream failure' } }));
  await client.getByRole('button', { name: 'Confirmar Contratação' }).click();
  assert.equal(await client.getByRole('button', { name: 'Cancelar', exact: true }).isDisabled(), true);
  releaseBooking();
  await client.waitForURL(/\/chat\/servico\//);
  assert.equal((await list(0)).filter(service => service.description === 'Audit booking after creation').length, 1);
  await client.unroute('**/api/services');
  await client.unroute('**/api/chat/rooms');
  console.log('PASS: booking validates minimum description, blocks cancellation during submit, and succeeds independently of downstream failure');

  await goto(client, '/urgente');
  assert.equal(await client.locator('#address').inputValue(), '');
  await client.locator('#description').fill('Audit urgent request description');
  await client.locator('#address').fill('Rua de teste, 123');
  await client.route('**/api/providers?*', route => route.fulfill({ json: [] }));
  await client.getByRole('button', { name: 'Enviar Solicitação Urgente' }).click();
  await client.getByText('Nenhum profissional disponível para essa especialidade no momento.').waitFor();
  await client.getByRole('button', { name: 'Enviar Solicitação Urgente' }).waitFor();
  await client.unroute('**/api/providers?*');
  console.log('PASS: urgent service requires a real address and recovers from no providers available');

  await client.route('**/api/services', route => route.fulfill({ status: 503, json: { error: 'Simulated listing outage' } }));
  await goto(client, '/servicos');
  await client.getByRole('heading', { name: 'Não foi possível carregar seus serviços' }).waitFor();
  await client.unroute('**/api/services');
  await client.getByRole('button', { name: 'Tentar novamente' }).click();
  await card(client, lifecycle.description).waitFor();
  assert.deepEqual(errors, []);
  assert.deepEqual(pageErrors, []);
  console.log(`PASS: list error and retry; ${calls} real API checks, no 5xx, no browser runtime errors`);
} finally {
  try {
    await browser?.close();
    await new Promise(resolve => server ? server.httpServer.close(resolve) : resolve());
  } finally {
    docker(`${imports} try { await prisma.user.deleteMany({where:{id:{in:${JSON.stringify(ids)}}}}); } finally { await prisma.$disconnect(); }`);
    console.log('Temporary users, profiles, service requests and related test data removed');
  }
}
