import test from 'node:test';
import assert from 'node:assert/strict';

test('backend package exposes test runner', () => {
  assert.equal(typeof test, 'function');
});
