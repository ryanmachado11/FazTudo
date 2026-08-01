import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { randomUUID } from 'crypto';
export async function hashPassword(password) {
    return argon2.hash(password);
}
export async function verifyPassword(hash, password) {
    return argon2.verify(hash, password);
}
export function signAccessToken(payload) {
    const secret = process.env.JWT_SECRET || 'dev-secret';
    return jwt.sign(payload, secret, { expiresIn: '15m' });
}
export function signRefreshToken(payload) {
    const secret = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
    return jwt.sign(payload, secret, { expiresIn: '7d' });
}
export function verifyAccessToken(token) {
    const secret = process.env.JWT_SECRET || 'dev-secret';
    return jwt.verify(token, secret);
}
export function generateId() {
    return randomUUID();
}
