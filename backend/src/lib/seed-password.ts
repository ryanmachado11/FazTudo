import { randomBytes } from 'node:crypto';

export function seedPassword() {
  const configured = process.env.SEED_PASSWORD;
  if (!configured) return randomBytes(48).toString('base64url');
  if (configured.length < 32 || configured.startsWith('change-me')) {
    throw new Error('SEED_PASSWORD must have at least 32 unpredictable characters');
  }
  return configured;
}
