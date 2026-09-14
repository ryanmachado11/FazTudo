// Requires the built frontend, Docker backend, and PLAYWRIGHT_MODULE.
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { preview } from 'vite';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const ids = [randomUUID(), randomUUID(), randomUUID()];
const password = randomBytes(24).toString('base64url');
const docker = input => execFileSync('docker', ['compose', '-f', 'backend/docker-compose.yml', 'exec', '-T', 'app', 'node', '--input-type=module'], {
  input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'],
});
const dbImport = "import { prisma } from './dist/config/prisma.js';";
const sessions = [];
const serverErrors = [];
const pageErrors = [];
let server;
let browser;
let realCalls = 0;
let injectingFailure = false;

async function api(index, method, path, payload, expected = 200) {
  const response = await fetch('http://localhost:3001' + path, {
    method,
    headers: { 'content-type': 'application/json', ...(sessions[index] ? { authorization: `Bearer ${sessions[index].accessToken}` } : {}) },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
  realCalls++;
  if (response.status >= 500) serverErrors.push([path, response.status]);
  const body = response.status === 204 ? undefined : await response.json();
  assert.equal(response.status, expected, `${method} ${path}: ${response.status} ${JSON.stringify(body)}`);
  return body;
}

try {
  const categoryId = JSON.parse(docker(`${dbImport}
    import { hashPassword } from './dist/lib/auth.js';
    try {
      const category = await prisma.category.findFirst({where:{isActive:true}});
      if (!category) throw new Error('Profile audit requires one active category');
      const passwordHash = await hashPassword(${JSON.stringify(password)});
      await prisma.user.create({data:{id:${JSON.stringify(ids[0])},name:'Profile Audit Client',email:${JSON.stringify(ids[0] + '@profile-audit.invalid')},phone:${JSON.stringify(ids[0])},passwordHash,role:'CLIENT'}});
      await prisma.user.create({data:{id:${JSON.stringify(ids[1])},name:'Profile Audit Provider',email:${JSON.stringify(ids[1] + '@profile-audit.invalid')},phone:${JSON.stringify(ids[1])},passwordHash,role:'PROVIDER',providerProfile:{create:{bio:'Original bio',city:'Campinas',neighborhood:'Centro',state:'SP',hourlyRate:80,isUrgentAvailable:false,specialties:['Original'],categories:{create:{categoryId:category.id}}}}}});
      await prisma.user.create({data:{id:${JSON.stringify(ids[2])},name:'Profile Audit New Provider',email:${JSON.stringify(ids[2] + '@profile-audit.invalid')},phone:${JSON.stringify(ids[2])},passwordHash,role:'PROVIDER'}});
      console.log(JSON.stringify(category.id));
    } finally { await prisma.$disconnect(); }
  `));

  for (const [index, id] of ids.entries()) sessions.push(await api(index, 'POST', '/api/auth/login', { email: id + '@profile-audit.invalid', password }));
  await api(0, 'GET', '/api/provider/profile/me', undefined, 403);
  await api(0, 'PUT', '/api/provider/profile/me', { name: 'Forbidden' }, 403);
  await api(2, 'GET', '/api/provider/profile/me', undefined, 404);
  await api(0, 'GET', `/api/providers/${randomUUID()}`, undefined, 404);
  console.log('PASS: profile permissions and missing-profile responses');

  server = await preview({ preview: { host: '127.0.0.1', port: 4173, strictPort: true }, logLevel: 'error' });
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('response', response => {
    if (response.url().includes('/api/') && !injectingFailure) {
      realCalls++;
      if (response.status() >= 500) serverErrors.push([response.url(), response.status()]);
    }
  });
  page.on('dialog', dialog => dialog.accept());
  const base = 'http://127.0.0.1:4173';
  const storeSession = async session => {
    await page.goto(base + '/login');
    await page.evaluate(value => sessionStorage.setItem('faztudo_session', JSON.stringify(value)), session);
  };
  const upload = async (name, mimeType, buffer) => {
    const response = page.waitForResponse(result => result.url().endsWith('/api/auth/me/avatar') && result.request().method() === 'PUT');
    await page.locator('input[type="file"]').setInputFiles({ name, mimeType, buffer });
    assert.equal((await response).status(), 200);
    await page.getByRole('button', { name: 'Remover foto' }).waitFor();
  };
  const imageBuffers = {
    'image/jpeg': Buffer.from([0xff, 0xd8, 0xff]),
    'image/png': Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
    'image/webp': Buffer.from('UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEAAUAmJaQAA3AA/v89WAAAAA==', 'base64'),
    'image/gif': Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
  };

  await storeSession(sessions[0]);
  await page.goto(base + '/home');
  for (const [extension, mimeType] of [['jpg', 'image/jpeg'], ['png', 'image/png'], ['webp', 'image/webp'], ['gif', 'image/gif']]) {
    await upload(`avatar.${extension}`, mimeType, imageBuffers[mimeType]);
  }
  let avatarRequests = 0;
  const countAvatarRequest = request => {
    if (request.url().endsWith('/api/auth/me/avatar') && request.method() === 'PUT') avatarRequests++;
  };
  page.on('request', countAvatarRequest);
  await page.locator('input[type="file"]').setInputFiles({ name: 'too-large.png', mimeType: 'image/png', buffer: Buffer.alloc(2 * 1024 * 1024 + 1) });
  await page.getByText('A imagem deve ter no máximo 2 MB.').waitFor();
  assert.equal(avatarRequests, 0);
  page.off('request', countAvatarRequest);
  const removeResponse = page.waitForResponse(result => result.url().endsWith('/api/auth/me/avatar') && result.request().method() === 'DELETE');
  await page.getByRole('button', { name: 'Remover foto' }).click();
  assert.equal((await removeResponse).status(), 200);
  await page.getByRole('button', { name: 'Remover foto' }).waitFor({ state: 'detached' });
  await page.reload();
  assert.equal(await page.getByRole('button', { name: 'Remover foto' }).count(), 0);
  assert.equal((await api(0, 'GET', '/api/auth/me')).avatarUrl, null);
  console.log('PASS: CLIENT uploads/replaces JPG, PNG, WEBP and GIF; oversize stays local; removal persists');

  await storeSession(sessions[1]);
  await page.goto(base + '/home');
  await page.locator('[data-profile-navigation]').click();
  await page.waitForURL(base + '/perfil/editar');
  console.log('PASS: /home provider avatar navigates to profile without opening a file chooser');
  await page.goto(base + '/dashboard');
  await page.getByLabel('Abrir meu perfil').first().click();
  await page.waitForURL(base + '/perfil/editar');
  console.log('PASS: Dashboard avatar navigates to profile without opening a file chooser');
  await page.goto(base + '/perfil/editar');
  await page.locator('#name').waitFor();
  await page.locator('#name').fill('Provider Updated');
  await page.locator('#price').fill('R$ 125,50');
  await page.locator('#city').fill('São Paulo');
  await page.locator('#neighborhood').fill('Bela Vista');
  await page.locator('#state').fill('sp');
  await page.locator('#description').fill('Perfil público atualizado e persistido.');
  await page.getByPlaceholder('Adicionar nova especialidade...').fill('Instalação');
  await page.getByRole('button', { name: 'Adicionar' }).click();
  await page.getByLabel('Disponível para atendimentos urgentes').check();
  await upload('provider.png', 'image/png', imageBuffers['image/png']);
  const saveResponse = page.waitForResponse(result => result.url().endsWith('/api/provider/profile/me') && result.request().method() === 'PUT');
  await page.getByRole('button', { name: 'Salvar Alterações' }).click();
  assert.equal((await saveResponse).status(), 200);
  await page.waitForURL(base + '/dashboard');
  const ownProfile = await api(1, 'GET', '/api/provider/profile/me');
  assert.equal(ownProfile.name, 'Provider Updated');
  assert.equal(ownProfile.city, 'São Paulo');
  assert.equal(ownProfile.neighborhood, 'Bela Vista');
  assert.equal(ownProfile.state, 'SP');
  assert.equal(Number(ownProfile.hourlyRate), 125.5);
  assert.equal(ownProfile.isUrgentAvailable, true);
  assert.ok(ownProfile.specialties.includes('Instalação'));
  assert.ok(ownProfile.avatarUrl.startsWith('data:image/png;base64,'));
  const publicProfile = await api(0, 'GET', `/api/providers/${ids[1]}`);
  assert.equal(publicProfile.name, 'Provider Updated');
  assert.equal(publicProfile.serviceRegion, 'São Paulo - Bela Vista - SP');
  for (const field of ['distance', 'responseTime', 'responseRate', 'completionRate']) assert.equal(Object.hasOwn(publicProfile, field), false);
  console.log('PASS: PROVIDER edits persisted fields, urgent availability and photo; public profile returns only stored/calculated data');

  await page.goto(base + `/prestador/${ids[1]}`);
  await page.getByRole('heading', { name: 'Provider Updated' }).waitFor();
  await page.locator('img[alt="Foto de Provider Updated"]').waitFor();
  await page.getByText('São Paulo - Bela Vista - SP', { exact: true }).first().waitFor();
  await page.getByText('Este prestador ainda não recebeu avaliações.').waitFor();
  assert.equal(await page.getByText('Taxa de resposta').count(), 0);
  console.log('PASS: public profile shows persisted data and the empty reviews state');

  await page.goto(base + '/perfil/editar');
  await page.getByRole('button', { name: 'Remover foto' }).waitFor();
  const providerRemove = page.waitForResponse(result => result.url().endsWith('/api/auth/me/avatar') && result.request().method() === 'DELETE');
  await page.getByRole('button', { name: 'Remover foto' }).click();
  assert.equal((await providerRemove).status(), 200);
  await page.getByRole('button', { name: 'Remover foto' }).waitFor({ state: 'detached' });
  assert.equal((await api(1, 'GET', '/api/auth/me')).avatarUrl, null);
  console.log('PASS: PROVIDER removes the photo and the change persists');

  injectingFailure = true;
  await page.route(`**/api/providers/${ids[1]}`, route => route.fulfill({ status: 503, json: { error: 'Temporary profile outage' } }));
  await page.goto(base + `/prestador/${ids[1]}`);
  await page.getByRole('heading', { name: 'Não foi possível carregar o perfil' }).waitFor();
  await page.unroute(`**/api/providers/${ids[1]}`);
  injectingFailure = false;
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await page.getByRole('heading', { name: 'Provider Updated' }).waitFor();
  await page.goto(base + `/prestador/${randomUUID()}`);
  await page.getByRole('heading', { name: 'Prestador não encontrado' }).waitFor();
  console.log('PASS: public profile distinguishes server error from missing profile and retry works');

  await storeSession(sessions[2]);
  await page.goto(base + '/perfil/editar');
  await page.locator('#name').waitFor();
  assert.equal(await page.getByText('Não foi possível carregar seu perfil.').count(), 0);
  await page.locator('#price').fill('90');
  await page.locator('#city').fill('Santos');
  await page.locator('#neighborhood').fill('Centro');
  await page.locator('#state').fill('SP');
  await page.locator('#description').fill('Novo perfil criado pela tela de edição.');
  await page.getByLabel('Disponível para atendimentos urgentes').check();
  const createResponse = page.waitForResponse(result => result.url().endsWith('/api/provider/profile/me') && result.request().method() === 'PUT');
  await page.getByRole('button', { name: 'Salvar Alterações' }).click();
  assert.equal((await createResponse).status(), 200);
  await page.waitForURL(base + '/dashboard');
  const createdProfile = await api(2, 'GET', '/api/provider/profile/me');
  assert.equal(createdProfile.city, 'Santos');
  assert.equal(createdProfile.categoryIds[0], categoryId);
  assert.equal(createdProfile.isUrgentAvailable, true);
  assert.equal((await api(0, 'GET', `/api/providers/${ids[2]}`)).serviceRegion, 'Santos - Centro - SP');
  console.log('PASS: PROVIDER without a profile creates one through the editor and becomes publicly visible');

  assert.deepEqual(serverErrors, []);
  assert.deepEqual(pageErrors, []);
  console.log(`PASS: ${realCalls} real profile API/browser calls; zero HTTP 5xx and zero browser runtime errors`);
} finally {
  try {
    await browser?.close();
    await new Promise(resolve => server ? server.httpServer.close(resolve) : resolve());
  } finally {
    docker(`${dbImport} try { await prisma.user.deleteMany({where:{id:{in:${JSON.stringify(ids)}}}}); } finally { await prisma.$disconnect(); }`);
    console.log('Temporary profile users, profiles and photos removed');
  }
}
