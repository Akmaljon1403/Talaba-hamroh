import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getEditableEntityConfig,
  getEditableField,
  validateEditableValue
} from '../src/db/queries/contentEditor.js';
import {
  replaceRuntimeAdminRoles,
  registerRuntimeAdmin,
  isAdmin,
  isSuperAdmin
} from '../src/config/env.js';

test('content editor exposes only known database entity types and editable fields', () => {
  for (const type of ['dept', 'subject', 'teacher', 'base', 'room', 'book', 'calendar', 'faculty', 'service']) {
    assert.ok(getEditableEntityConfig(type), `expected config for ${type}`);
  }
  assert.equal(getEditableEntityConfig('admins'), null);
  assert.equal(getEditableField('dept', 'name')?.key, 'name');
  assert.equal(getEditableField('dept', 'telegram_id'), null);
});

test('education level accepts only the supported values', () => {
  assert.deepEqual(validateEditableValue('dept', 'level', 'bakalavriat'), {
    ok: true,
    value: 'bakalavriat'
  });
  assert.deepEqual(validateEditableValue('subject', 'level', 'magistratura'), {
    ok: true,
    value: 'magistratura'
  });
  assert.equal(validateEditableValue('dept', 'level', 'boshqa').ok, false);
});

test('numeric fields enforce configured bounds', () => {
  assert.deepEqual(validateEditableValue('calendar', 'course', '3'), {
    ok: true,
    value: 3
  });
  assert.equal(validateEditableValue('calendar', 'course', '7').ok, false);
  assert.equal(validateEditableValue('base', 'total_capacity', '-1').ok, false);
  assert.equal(validateEditableValue('room', 'capacity', 'o‘n').ok, false);
});

test('URL fields reject unsafe schemes and accept HTTP(S)', () => {
  assert.equal(validateEditableValue('base', 'map_link', 'javascript:alert(1)').ok, false);
  assert.equal(validateEditableValue('book', 'file_url', 'file:///etc/passwd').ok, false);
  const safe = validateEditableValue('book', 'file_url', 'https://library.fjsti.uz/book/1');
  assert.equal(safe.ok, true);
  assert.equal(safe.value, 'https://library.fjsti.uz/book/1');
});

test('nullable text fields can be cleared, required fields cannot', () => {
  assert.deepEqual(validateEditableValue('dept', 'head_name', '—'), {
    ok: true,
    value: null
  });
  assert.equal(validateEditableValue('dept', 'name', '').ok, false);
});

test('oversized text is rejected before any database query', () => {
  assert.equal(validateEditableValue('service', 'content', 'x'.repeat(3501)).ok, false);
});

test('database-backed admin roles are persistent at runtime and separate admin from superadmin', () => {
  const adminId = 900123456789;
  const superAdminId = 900123456790;

  replaceRuntimeAdminRoles([{ telegram_id: String(adminId), role: 'admin' }]);
  assert.equal(isAdmin(adminId), true);
  assert.equal(isSuperAdmin(adminId), false);

  registerRuntimeAdmin(superAdminId, 'superadmin');
  assert.equal(isAdmin(superAdminId), true);
  assert.equal(isSuperAdmin(superAdminId), true);

  replaceRuntimeAdminRoles([]);
});

