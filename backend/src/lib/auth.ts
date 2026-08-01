import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { randomUUID } from 'crypto';

export type JwtPayload = {
  sub: string;
  role: string;
  email: string;
};

export async function hashPassword(password: string) {
  return argon2.hash(password);
}

export async function verifyPassword(hash: string, password: string) {
  return argon2.verify(hash, password);
}

export function signAccessToken(payload: JwtPayload) {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  return jwt.sign(payload, secret, { expiresIn: '15m' });
}

export function signRefreshToken(payload: JwtPayload) {
  const secret = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string) {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  return jwt.verify(token, secret) as JwtPayload;
}

export function generateId() {
  return randomUUID();
}
