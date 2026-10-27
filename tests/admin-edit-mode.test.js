import test from 'node:test';
import assert from 'node:assert/strict';
import {
  enableAdminEditMode,
  disableAdminEditMode,
  isAdminEditModeActive,
  touchAdminEditMode,
  getAdminEditModeRemainingMs
} from '../src/bot/utils/adminEditMode.js';

test('admin edit mode can be enabled, refreshed and disabled', () => {
  const adminId = 990001001;
  enableAdminEditMode(adminId, null, null, 1000);
  assert.equal(isAdminEditModeActive(adminId), true);
  assert.equal(touchAdminEditMode(adminId), true);
  assert.ok(getAdminEditModeRemainingMs(adminId) > 0);
  assert.equal(disableAdminEditMode(adminId), true);
  assert.equal(isAdminEditModeActive(adminId), false);
});

test('admin edit mode expires after the idle timeout', async () => {
  const adminId = 990001002;
  enableAdminEditMode(adminId, null, null, 15);
  await new Promise((resolve) => setTimeout(resolve, 35));
  assert.equal(isAdminEditModeActive(adminId), false);
});
