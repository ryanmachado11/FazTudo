import jwt from 'jsonwebtoken';
import argon2 from 'argon2';

export type JwtPayload = {
  sub: string;
  role: string;
};

const JWT_ISSUER = 'faztudo-api';
const JWT_AUDIENCE = 'faztudo-web';
const LOCAL_DEVELOPMENT_JWT_SECRET = 'faztudo-local-development-jwt-secret-2026-only';
const LOCAL_DEVELOPMENT_DATABASE_URL = 'mysql://root:password@mysql:3306/faztudo';

function getSecret(name: 'JWT_SECRET') {
  const value = process.env[name];
  if (
    !value
    || value.length < 32
    || value.startsWith('change-me')
    || value.includes('dev-secret')
    || (process.env.NODE_ENV === 'production' && value === LOCAL_DEVELOPMENT_JWT_SECRET)
  ) {
    throw new Error(`${name} must be configured with at least 32 unpredictable characters`);
  }
  return value;
}

export function validateAuthConfig() {
  getSecret('JWT_SECRET');
}

export function validateRuntimeConfig() {
  validateAuthConfig();
  if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL === LOCAL_DEVELOPMENT_DATABASE_URL) {
    throw new Error('DATABASE_URL must not use the bundled development database credentials in production');
  }
}

export async function hashPassword(password: string) {
  return argon2.hash(password);
}

export async function verifyPassword(hash: string, password: string) {
  return argon2.verify(hash, password);
}

export function signAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, getSecret('JWT_SECRET'), {
    algorithm: 'HS256',
    audience: JWT_AUDIENCE,
    expiresIn: '15m',
    issuer: JWT_ISSUER,
  });
}

export function verifyAccessToken(token: string) {
  const payload = jwt.verify(token, getSecret('JWT_SECRET'), {
    algorithms: ['HS256'],
    audience: JWT_AUDIENCE,
    issuer: JWT_ISSUER,
  });
  if (typeof payload === 'string' || typeof payload.sub !== 'string' || typeof payload.role !== 'string') {
    throw new Error('Invalid token payload');
  }
  return payload as JwtPayload;
}
