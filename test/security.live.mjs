// Run from the repository root against the current Docker backend on localhost:3001.
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import jwt from '../backend/node_modules/jsonwebtoken/index.js';

const ids = Array.from({ length: 4 }, () => randomUUID());
const password = randomBytes(32).toString('base64url');
const sessions = [];
let calls = 0;
const docker = input => execFileSync('docker', ['compose', '-f', 'backend/docker-compose.yml', 'exec', '-T', 'app', 'node', '--input-type=module'], { input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
const imports = "import { prisma } from './dist/config/prisma.js';";
async function api(index, method, path, payload, expected = 200, token = sessions[index]?.accessToken) {
  const response = await fetch('http://localhost:3001' + path, {
    method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
  calls++;
  assert.equal(response.status, expected, `${method} ${path}`);
  return response.json();
}
try {
  const categoryId = JSON.parse(docker(`${imports}
    import { hashPassword } from './dist/lib/auth.js';
    try {
      const category = await prisma.category.findFirst({where:{isActive:true}});
      if (!category) throw new Error('An existing active category is required');
      const passwordHash = await hashPassword(${JSON.stringify(password)});
      for (const [index,id] of ${JSON.stringify(ids)}.entries()) await prisma.user.create({data:{
        id, name:'Security Audit '+index, email:id+'@security-audit.invalid', phone:id, passwordHash,
        role:index<2?'CLIENT':'PROVIDER',
        ...(index>=2?{providerProfile:{create:{categories:{create:{categoryId:category.id}}}}}:{}),
      }});
      console.log(JSON.stringify(category.id));
    } finally { await prisma.$disconnect(); }
  `));
  for (const [i,id] of ids.entries()) sessions.push(await api(i,'POST','/api/auth/login',{email:id+'@security-audit.invalid',password}));
  await api(0,'GET','/health');
  for (const i of [0,2]) {
    const forged = jwt.sign({sub:ids[i],role:i===0?'CLIENT':'PROVIDER'},'faztudo-local-development-jwt-secret-2026-only',{algorithm:'HS256',issuer:'faztudo-api',audience:'faztudo-web',expiresIn:'1m'});
    await api(i,'GET','/api/auth/me',undefined,401,forged);
    const parts = sessions[i].accessToken.split('.');
    parts[1] = Buffer.from(JSON.stringify({...JSON.parse(Buffer.from(parts[1],'base64url')),sub:ids[i+1],role:'ADMIN'})).toString('base64url');
    await api(i,'GET','/api/auth/me',undefined,401,parts.join('.'));
  }
  for (const path of ['/api/auth/me','/api/services','/api/chat/rooms','/api/provider/profile/me','/api/provider/dashboard']) await api(-1,'GET',path,undefined,401);
  for (const [method,path,payload] of [
    ['POST','/api/services',{}],['PATCH',`/api/services/${ids[0]}/status`,{status:'ACCEPTED'}],
    ['POST','/api/chat/rooms',{}],['POST','/api/chat/messages',{}],
    ['PUT','/api/provider/profile/me',{}],['PUT','/api/auth/me/avatar',{}],['DELETE','/api/auth/me/avatar',undefined],
  ]) await api(-1,method,path,payload,401);
  console.log('PASS: legitimate logins; published-key forgery and payload tampering denied; protected endpoints require authentication');

  const payload = {providerId:ids[2],categoryId,description:'Security audit private service'};
  const {service} = await api(0,'POST','/api/services',payload,201);
  await api(0,'POST','/api/services',{...payload,clientId:ids[1]},400);
  for (const i of [1,3]) {
    assert.deepEqual(await api(i,'GET',`/api/services?clientId=${ids[0]}&providerId=${ids[2]}`),[]);
    await api(i,'PATCH',`/api/services/${service.id}`,{categoryId,description:'Unauthorized service edit'},403);
    await api(i,'PATCH',`/api/services/${service.id}/status`,{status:'CANCELLED'},403);
  }
  await api(0,'PATCH',`/api/services/${service.id}/status`,{status:'ACCEPTED'},409);
  assert.equal((await api(0,'GET','/api/services'))[0].status,'REQUESTED');
  await api(2,'PATCH',`/api/services/${service.id}/status`,{status:'ACCEPTED'});
  await api(2,'PATCH',`/api/services/${service.id}/status`,{status:'COMPLETED'});
  await api(1,'POST','/api/reviews',{serviceRequestId:service.id,providerId:ids[2],rating:5},400);
  console.log('PASS: manipulated service IDs, ownership fields, role-only actions and third-party reviews denied; legitimate status updates work');

  const {room} = await api(0,'POST','/api/chat/rooms',{serviceRequestId:service.id});
  await api(0,'POST','/api/chat/messages',{roomId:room.id,content:'Private client message'},201);
  for (const i of [1,3]) {
    assert.deepEqual(await api(i,'GET','/api/chat/rooms'),[]);
    for (const selector of [{roomId:room.id},{serviceRequestId:service.id}]) {
      await api(i,'POST','/api/chat/rooms',selector,403);
      await api(i,'POST','/api/chat/messages',{...selector,content:'Unauthorized message'},403);
    }
    await api(i,'GET',`/api/chat/rooms/${room.id}/messages`,undefined,403);
    await api(i,'POST',`/api/chat/rooms/${room.id}/read`,{},403);
  }
  await api(2,'POST','/api/chat/rooms',{roomId:room.id});
  await api(2,'POST','/api/chat/messages',{roomId:room.id,content:'Private provider reply'},201);
  await api(0,'POST','/api/chat/messages',{roomId:room.id,senderId:ids[2],content:'Spoofed sender'},400);
  await api(0,'POST','/api/chat/messages',{roomId:room.id,messageType:'IMAGE',content:'javascript:alert(1)'},400);
  assert.equal((await api(0,'GET',`/api/chat/rooms/${room.id}/messages`)).length,2);
  await api(0,'GET','/api/chat/rooms/not-a-uuid/messages',undefined,400);
  console.log('PASS: roomId/serviceRequestId cross-account reads, sends and read receipts denied; participants can open and reply');

  const otherBefore = await api(3,'GET','/api/provider/profile/me');
  await api(2,'PUT','/api/provider/profile/me',{userId:ids[3],name:'Unauthorized name'},400);
  await api(2,'PUT','/api/provider/profile/me',{isVerified:true},400);
  await api(0,'PUT','/api/provider/profile/me',{name:'Client escalation'},403);
  await api(2,'PUT',`/api/provider/profile/me?userId=${ids[3]}`,{bio:'Own profile change'});
  assert.deepEqual(await api(3,'GET','/api/provider/profile/me'),otherBefore);
  await api(0,'PUT','/api/auth/me/avatar',{userId:ids[1],avatarUrl:'data:image/png;base64,iVBORw0KGgo='},400);
  await api(0,'PUT','/api/auth/me/avatar',{avatarUrl:'data:image/svg+xml;base64,PHN2Zz4='},400);
  await api(0,'DELETE',`/api/auth/me/avatar?userId=${ids[1]}`);
  for (const path of ['/api/providers',`/api/providers/${ids[2]}`]) {
    const catalog = await api(-1,'GET',path);
    assert.doesNotMatch(JSON.stringify(catalog),/passwordHash|password_hash|documentNumber|@security-audit\.invalid|"email"|"phone"/);
  }
  await api(0,'GET','/api/providers/%27%20OR%201%3D1--',undefined,400);
  console.log(`PASS: profile ownership and allowlists; avatar ownership and SVG rejection; public data excludes credentials/contact fields; ${calls} HTTP calls with zero 5xx`);
} finally {
  const remaining = JSON.parse(docker(`${imports} try {
    await prisma.user.deleteMany({where:{id:{in:${JSON.stringify(ids)}}}});
    console.log(JSON.stringify(await prisma.user.count({where:{id:{in:${JSON.stringify(ids)}}}})));
  } finally {await prisma.$disconnect();}`));
  assert.equal(remaining,0);
  console.log('PASS: temporary accounts and dependent records removed');
}
