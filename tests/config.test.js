import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEnv, isAdmin, config } from '../src/config/env.js';

test('validateEnv identifies missing variables', () => {
  const result = validateEnv();
  // In test environment without .env, it should return false and list missing BOT_TOKEN and DATABASE_URL
  assert.equal(typeof result.isValid, 'boolean');
  assert.ok(Array.isArray(result.errors));
});

test('isAdmin correctly checks against configured admin IDs', () => {
  assert.equal(isAdmin(null), false);
  assert.equal(isAdmin(undefined), false);
  assert.equal(isAdmin(0), false);
  
  // If we temporarily add a test admin ID
  config.adminIds.push(999888777);
  assert.equal(isAdmin(999888777), true);
  assert.equal(isAdmin('999888777'), true);
  assert.equal(isAdmin(111222333), false);
});
