import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeSupportHtml, sanitizeSupportMessage } from '../src/bot/handlers/support.js';

test('support message HTML is escaped before sending with Telegram HTML parse mode', () => {
  assert.equal(escapeSupportHtml('<script>&"'), '&lt;script&gt;&amp;&quot;');
});

test('support message input is trimmed and preserved', () => {
  assert.equal(sanitizeSupportMessage('  Salom, yordam kerak.  '), 'Salom, yordam kerak.');
});

test('support message rejects empty text', () => {
  assert.throws(() => sanitizeSupportMessage('   '), /bo‘sh bo‘lmasligi/);
});

test('support message rejects text above the configured limit', () => {
  assert.throws(() => sanitizeSupportMessage('x'.repeat(11), 10), /10 ta belgidan oshmasligi/);
});
