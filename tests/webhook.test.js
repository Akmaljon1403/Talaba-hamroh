import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createWebhookServer,
  deriveWebhookSecret,
  resolveWebhookBaseUrl,
  listen,
  closeServer,
  TELEGRAM_WEBHOOK_PATH
} from '../src/bot/webhook.js';

test('webhook secret is stable for the same bot token and differs for another token', () => {
  const first = deriveWebhookSecret('example-token-one');
  assert.equal(first, deriveWebhookSecret('example-token-one'));
  assert.notEqual(first, deriveWebhookSecret('example-token-two'));
  assert.match(first, /^[A-Fa-f0-9]{64}$/);
});

test('webhook base URL resolves Render environment values safely', () => {
  assert.equal(
    resolveWebhookBaseUrl({ RENDER_EXTERNAL_URL: 'https://talaba-hamroh.onrender.com/' }),
    'https://talaba-hamroh.onrender.com'
  );
  assert.equal(
    resolveWebhookBaseUrl({ RENDER_EXTERNAL_HOSTNAME: 'example.onrender.com' }),
    'https://example.onrender.com'
  );
  assert.throws(
    () => resolveWebhookBaseUrl({ RENDER_EXTERNAL_URL: 'http://example.com' }),
    /HTTPS URL/
  );
  assert.throws(
    () => resolveWebhookBaseUrl({}),
    /Webhook URL topilmadi/
  );
});

test('webhook endpoint rejects requests without the Telegram secret', async () => {
  const server = createWebhookServer({
    bot: { handleUpdate: async () => {} },
    secret: 'test-secret',
    isReady: () => true
  });
  await listen(server, 0);
  const port = server.address().port;

  try {
    const response = await fetch(`http://127.0.0.1:${port}${TELEGRAM_WEBHOOK_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', connection: 'close' },
      body: JSON.stringify({ update_id: 1 })
    });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { status: 'unauthorized' });
  } finally {
    const closing = closeServer(server);
    server.closeAllConnections?.();
    await closing;
  }
});

test('webhook endpoint passes authenticated updates to the bot', async () => {
  const updates = [];
  const server = createWebhookServer({
    bot: { handleUpdate: async (update) => { updates.push(update); } },
    secret: 'test-secret',
    isReady: () => true
  });
  await listen(server, 0);
  const port = server.address().port;
  const update = { update_id: 42, message: { text: 'hello' } };

  try {
    const response = await fetch(`http://127.0.0.1:${port}${TELEGRAM_WEBHOOK_PATH}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-telegram-bot-api-secret-token': 'test-secret',
        connection: 'close'
      },
      body: JSON.stringify(update)
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok' });
    assert.deepEqual(updates, [update]);
  } finally {
    const closing = closeServer(server);
    server.closeAllConnections?.();
    await closing;
  }
});

test('health endpoint reports starting until the webhook is configured', async () => {
  let ready = false;
  const server = createWebhookServer({
    bot: { handleUpdate: async () => {} },
    secret: 'test-secret',
    isReady: () => ready
  });
  await listen(server, 0);
  const port = server.address().port;

  try {
    const starting = await fetch(`http://127.0.0.1:${port}/health`, {
      headers: { connection: 'close' }
    });
    assert.equal(starting.status, 503);
    assert.equal((await starting.json()).status, 'starting');

    ready = true;
    const healthy = await fetch(`http://127.0.0.1:${port}/health`, {
      headers: { connection: 'close' }
    });
    assert.equal(healthy.status, 200);
    assert.equal((await healthy.json()).status, 'ok');
  } finally {
    const closing = closeServer(server);
    server.closeAllConnections?.();
    await closing;
  }
});

test('webhook endpoint rejects malformed JSON', async () => {
  const server = createWebhookServer({
    bot: { handleUpdate: async () => {} },
    secret: 'test-secret'
  });
  await listen(server, 0);
  const port = server.address().port;

  try {
    const response = await fetch(`http://127.0.0.1:${port}${TELEGRAM_WEBHOOK_PATH}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-telegram-bot-api-secret-token': 'test-secret',
        connection: 'close'
      },
      body: '{not-json'
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { status: 'invalid_json' });
  } finally {
    const closing = closeServer(server);
    server.closeAllConnections?.();
    await closing;
  }
});
