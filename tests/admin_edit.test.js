import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAdminEditValue } from '../src/bot/handlers/adminEdit.js';

test('admin editor accepts valid integer fields and trims text values', () => {
  assert.equal(normalizeAdminEditValue('book', 'course', '3'), 3);
  assert.equal(normalizeAdminEditValue('teacher', 'full_name', '  Ali Valiyev  '), 'Ali Valiyev');
});

test('admin editor allows clearing optional fields with a dash', () => {
  assert.equal(normalizeAdminEditValue('book', 'author', '-'), null);
  assert.equal(normalizeAdminEditValue('service', 'source_url', '   '), null);
});

test('admin editor refuses empty required fields', () => {
  assert.throws(() => normalizeAdminEditValue('book', 'title', '-'), /bo‘sh qolishi mumkin emas/);
  assert.throws(() => normalizeAdminEditValue('calendar', 'course', ''), /bo‘sh qolishi mumkin emas/);
});

test('admin editor validates integer fields', () => {
  assert.throws(() => normalizeAdminEditValue('book', 'course', 'uch'), /butun son kiriting/);
  assert.throws(() => normalizeAdminEditValue('room', 'capacity', '-2'), /Manfiy son/);
});

test('admin editor rejects fields outside its allowlist', () => {
  assert.throws(() => normalizeAdminEditValue('faculty', 'id', '1'), /ruxsat berilmagan/);
  assert.throws(() => normalizeAdminEditValue('unknown_table', 'name', 'Example'), /Noma’lum ma’lumot turi/);
});

test('admin editor prevents oversized content values', () => {
  assert.throws(() => normalizeAdminEditValue('service', 'content', 'x'.repeat(3501)), /juda uzun/);
});
