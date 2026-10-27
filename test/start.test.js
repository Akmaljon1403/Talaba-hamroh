import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStartMessage, handleStart } from '../src/bot/handlers/start.js';

test('buildStartMessage escapes user-provided HTML characters', () => {
  const message = buildStartMessage('<Akmal & "Jahongir">');

  assert.match(message, /&lt;Akmal &amp; &quot;Jahongir&quot;&gt;/);
  assert.match(message, /<b>Farg‘ona jamoat salomatligi tibbiyot instituti \(FJSTI\)<\/b>/);
  assert.ok(message.length < 4096, 'Telegram message must remain within the 4096-character limit');
});

test('handleStart sends a welcome message with HTML mode and a reply keyboard', async () => {
  let receivedText;
  let receivedOptions;
  const ctx = {
    update: { update_id: 12345 },
    from: { id: 123456789, first_name: 'Akmal' },
    reply: async (text, options) => {
      receivedText = text;
      receivedOptions = options;
      return { message_id: 77 };
    }
  };

  await handleStart(ctx);

  assert.match(receivedText, /Assalomu alaykum, <b>Akmal<\/b>/);
  assert.equal(receivedOptions.parse_mode, 'HTML');
  assert.ok(receivedOptions.reply_markup, 'A reply keyboard should be included');
});
