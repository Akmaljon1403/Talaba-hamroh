import http from 'node:http';
import { createHash, timingSafeEqual } from 'node:crypto';

const MAX_WEBHOOK_BODY_BYTES = 1024 * 1024;
export const TELEGRAM_WEBHOOK_PATH = '/telegram-webhook';

export function deriveWebhookSecret(botToken) {
  if (typeof botToken !== 'string' || !botToken.trim()) {
    throw new Error('Webhook secretini yaratish uchun BOT_TOKEN kerak.');
  }

  // Stable across Render instance replacements without adding another required secret.
  // Only the hash is used as the Telegram webhook header secret; the token is never logged.
  return createHash('sha256')
    .update('fjsti-talaba-hamroh:telegram-webhook:')
    .update(botToken)
    .digest('hex');
}

export function resolveWebhookBaseUrl(env = process.env) {
  const rawUrl = env.TELEGRAM_WEBHOOK_BASE_URL
    || env.RENDER_EXTERNAL_URL
    || (env.RENDER_EXTERNAL_HOSTNAME ? `https://${env.RENDER_EXTERNAL_HOSTNAME}` : '');

  if (!rawUrl) {
    throw new Error(
      'Webhook URL topilmadi. Render Web Service uchun RENDER_EXTERNAL_URL mavjudligini tekshiring yoki TELEGRAM_WEBHOOK_BASE_URL sozlang.'
    );
  }

  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('Webhook bazaviy URL formati noto‘g‘ri.');
  }

  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error('Telegram webhook uchun HTTPS URL kerak; URL ichida login, parol, query yoki hash bo‘lmasligi lozim.');
  }

  return url.toString().replace(/\/+$/, '');
}

function sendJson(res, statusCode, body) {
  if (res.writableEnded) return;
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function matchesSecret(providedSecret, expectedSecret) {
  if (typeof providedSecret !== 'string' || typeof expectedSecret !== 'string') return false;
  const provided = Buffer.from(providedSecret);
  const expected = Buffer.from(expectedSecret);
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

export function createWebhookServer({
  bot,
  secret,
  isReady = () => true,
  serviceName = 'fjsti-talaba-hamroh'
}) {
  if (!bot || typeof bot.handleUpdate !== 'function') {
    throw new Error('Webhook server uchun bot.handleUpdate mavjud bo‘lishi kerak.');
  }
  if (!secret) throw new Error('Telegram webhook secret ko‘rsatilmagan.');

  return http.createServer((req, res) => {
    let pathname;
    try {
      pathname = new URL(req.url || '/', 'http://localhost').pathname;
    } catch {
      sendJson(res, 400, { status: 'error', message: 'Invalid request URL' });
      return;
    }

    if (req.method === 'GET' && (pathname === '/' || pathname === '/health')) {
      const ready = Boolean(isReady());
      sendJson(res, ready ? 200 : 503, {
        status: ready ? 'ok' : 'starting',
        service: serviceName,
        mode: 'webhook',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (req.method !== 'POST' || pathname !== TELEGRAM_WEBHOOK_PATH) {
      sendJson(res, 404, { status: 'not_found' });
      return;
    }

    if (!matchesSecret(req.headers['x-telegram-bot-api-secret-token'], secret)) {
      sendJson(res, 401, { status: 'unauthorized' });
      return;
    }

    const chunks = [];
    let receivedBytes = 0;
    let tooLarge = false;

    req.on('data', (chunk) => {
      if (tooLarge) return;
      receivedBytes += chunk.length;
      if (receivedBytes > MAX_WEBHOOK_BODY_BYTES) {
        tooLarge = true;
        chunks.length = 0;
        sendJson(res, 413, { status: 'payload_too_large' });
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', async () => {
      if (tooLarge || res.writableEnded) return;

      let update;
      try {
        update = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      } catch {
        sendJson(res, 400, { status: 'invalid_json' });
        return;
      }

      if (!update || typeof update !== 'object' || Array.isArray(update)) {
        sendJson(res, 400, { status: 'invalid_update' });
        return;
      }

      try {
        await bot.handleUpdate(update);
        sendJson(res, 200, { status: 'ok' });
      } catch (error) {
        console.error('[WEBHOOK] Update processing failed:', error?.message || String(error));
        sendJson(res, 500, { status: 'processing_error' });
      }
    });

    req.on('error', (error) => {
      console.error('[WEBHOOK] Request stream error:', error.message);
      sendJson(res, 400, { status: 'bad_request' });
    });
  });
}

export function listen(server, port) {
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off('listening', onListening);
      reject(error);
    };
    const onListening = () => {
      server.off('error', onError);
      resolve();
    };

    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, '0.0.0.0');
  });
}

export function closeServer(server) {
  if (!server || !server.listening) return Promise.resolve();
  return new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}
