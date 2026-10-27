import test from 'node:test';
import assert from 'node:assert/strict';
import { getEditableField, getEditableEntitySchema, validateEditableValue } from '../src/bot/utils/adminEditorPolicy.js';

test('department editor exposes canonical linked fields only', () => {
  const schema = getEditableEntitySchema('department');
  assert.equal(schema.table, 'departments');
  assert.ok(getEditableField('department', 'name'));
  assert.equal(getEditableField('department', 'created_at'), null);
});

test('editor rejects empty required values and unsafe URLs', () => {
  assert.throws(() => validateEditableValue('department', 'name', '   '));
  assert.throws(() => validateEditableValue('book', 'file_url', 'javascript:alert(1)'));
  assert.throws(() => validateEditableValue('book', 'course', '99'));
});

test('editor accepts valid text, nullable values and URLs', () => {
  assert.equal(validateEditableValue('department', 'name', 'A'), 'A');
  assert.equal(validateEditableValue('department', 'contact_phone', '-'), null);
  assert.equal(validateEditableValue('book', 'file_url', 'https://library.fjsti.uz/book'), 'https://library.fjsti.uz/book');
});
