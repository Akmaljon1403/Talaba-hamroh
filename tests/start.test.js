import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStartMessage } from '../src/bot/handlers/start.js';

test('buildStartMessage escapes HTML in a Telegram profile name', () => {
  const message = buildStartMessage('<b>Akmal</b> & "friends"');
  assert.ok(message.includes('&lt;b&gt;Akmal&lt;/b&gt; &amp; &quot;friends&quot;'));
  assert.ok(!message.includes('<b><b>Akmal</b>'));
});

test('buildStartMessage falls back to Talaba when the name is missing', () => {
  const message = buildStartMessage(undefined);
  assert.ok(message.startsWith('Assalomu alaykum, <b>Talaba</b>!'));
});
