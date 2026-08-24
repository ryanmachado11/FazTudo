import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
const JWT_ISSUER = 'faztudo-api';
const JWT_AUDIENCE = 'faztudo-web';
function getSecret(name) {
    const value = process.env[name];
    if (!value || value.length < 32 || value.startsWith('change-me') || value.includes('dev-secret')) {
        throw new Error(`${name} must be configured with at least 32 unpredictable characters`);
    }
    return value;
}
export function validateAuthConfig() {
    getSecret('JWT_SECRET');
}
export async function hashPassword(password) {
    return argon2.hash(password);
}
export async function verifyPassword(hash, password) {
    return argon2.verify(hash, password);
}
export function signAccessToken(payload) {
    return jwt.sign(payload, getSecret('JWT_SECRET'), {
        algorithm: 'HS256',
        audience: JWT_AUDIENCE,
        expiresIn: '15m',
        issuer: JWT_ISSUER,
    });
}
export function verifyAccessToken(token) {
    const payload = jwt.verify(token, getSecret('JWT_SECRET'), {
        algorithms: ['HS256'],
        audience: JWT_AUDIENCE,
        issuer: JWT_ISSUER,
    });
    if (typeof payload === 'string' || typeof payload.sub !== 'string' || typeof payload.role !== 'string') {
        throw new Error('Invalid token payload');
    }
    return payload;
}
