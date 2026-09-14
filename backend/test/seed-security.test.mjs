import assert from 'node:assert/strict';
import { test } from 'node:test';
import { seedPassword } from '../dist/lib/seed-password.js';

test('seed never falls back to published credentials', () => {
  const original = process.env.SEED_PASSWORD;
  try {
    delete process.env.SEED_PASSWORD;
    const first = seedPassword();
    assert.equal(first.length, 64);
    assert.notEqual(seedPassword(), first);
    process.env.SEED_PASSWORD = 'FazTudo123!';
    assert.throws(() => seedPassword());
    process.env.SEED_PASSWORD = first;
    assert.equal(seedPassword(), first);
  } finally {
    if (original === undefined) delete process.env.SEED_PASSWORD;
    else process.env.SEED_PASSWORD = original;
  }
});
