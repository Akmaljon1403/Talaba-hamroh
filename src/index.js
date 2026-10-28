import { config, validateEnv } from './config/env.js';
import { testConnection, closePool } from './db/pool.js';
import { runMigrations } from './db/migrate.js';
import { seedDatabase } from './db/seed.js';
import { createBot } from './bot/index.js';
import {
  createWebhookServer,
  deriveWebhookSecret,
  resolveWebhookBaseUrl,
  TELEGRAM_WEBHOOK_PATH,
  listen,
  closeServer
} from './bot/webhook.js';

let botInstance = null;
let httpServer = null;
let pollingMode = false;
let webhookReady = false;
let isShuttingDown = false;

function logBotReady(botInfo, mode) {
  console.log('====================================================');
  console.log(`🎉 Bot muvaffaqiyatli ishga tushdi: @${botInfo.username}`);
  console.log(`🆔 Bot ID: ${botInfo.id}`);
  console.log(`👥 Adminlar soni: ${config.adminIds.length}`);
  console.log(`📡 Telegram ulanish rejimi: ${mode}`);
  console.log('24/7 rejimda xabarlarni qabul qilishga tayyor!');
  console.log('====================================================');
}

async function bootstrap() {
  console.log('====================================================');
  console.log('🚀 FJSTI Talaba Hamrohi Bot ishga tushmoqda...');
  console.log(`📌 Muhit: ${config.nodeEnv}`);
  console.log('====================================================');

  // 1. Environment validation
  const envCheck = validateEnv();
  if (!envCheck.isValid) {
    console.error('❌ Muhit konfiguratsiyasida kamchiliklar aniqlandi:');
    envCheck.errors.forEach((err) => console.error(`  - ${err}`));
    console.error('\nIltimos, Render Environment Variables yoki .env faylini to‘g‘rilang.');
    process.exit(1);
  }

  // 2. Database connection & migrations
  console.log('🔍 Neon PostgreSQL ma’lumotlar bazasiga ulanish tekshirilmoqda...');
  const dbTest = await testConnection();
  if (!dbTest.success) {
    console.error('❌ Ma’lumotlar bazasiga ulanib bo‘lmadi:', dbTest.error);
    console.error('Iltimos, DATABASE_URL to‘g‘riligini tekshiring.');
    process.exit(1);
  }
  console.log(`✅ Baza bilan aloqa o‘rnatildi: [${dbTest.db}] (${dbTest.time})`);

  try {
    await runMigrations();
    await seedDatabase();
  } catch (dbInitErr) {
    console.error('❌ Baza initsializatsiyasida xatolik:', dbInitErr.message);
    process.exit(1);
  }

  console.log('🤖 Telegram bot initsializatsiya qilinmoqda...');
  botInstance = createBot(config.botToken);

  // Initialize grammY before accepting webhook updates. getMe() alone validates the token,
  // but does not populate bot.botInfo; handleUpdate() requires bot.init() to have completed.
  await botInstance.init();
  const botInfo = botInstance.botInfo;

  if (process.env.PORT) {
    // Render Web Services start overlapping old/new instances during zero-downtime deploys.
    // Long polling on both instances causes Telegram 409 conflicts. Webhooks avoid competing
    // getUpdates loops while allowing Render to route requests to the active healthy instance.
    const webhookBaseUrl = resolveWebhookBaseUrl();
    const webhookSecret = deriveWebhookSecret(config.botToken);

    httpServer = createWebhookServer({
      bot: botInstance,
      secret: webhookSecret,
      isReady: () => webhookReady
    });
    await listen(httpServer, config.port);
    console.log(`🌐 Web server ${config.port}-portda ishga tushdi.`);

    const webhookUrl = webhookBaseUrl + TELEGRAM_WEBHOOK_PATH;
    const webhookSet = await botInstance.api.setWebhook(webhookUrl, {
      secret_token: webhookSecret,
      drop_pending_updates: false
    });

    if (!webhookSet) {
      throw new Error('Telegram webhook sozlanmadi. Telegram API javobini tekshiring.');
    }

    webhookReady = true;
    console.log('[TELEGRAM] Secure webhook muvaffaqiyatli sozlandi; pending updates saqlanadi.');
    logBotReady(botInfo, 'webhook');
    return;
  }

  // Local development / worker mode: use long polling only when there is no HTTP port.
  // A previously configured webhook must be removed before getUpdates can be used.
  const webhookInfo = await botInstance.api.getWebhookInfo();
  if (webhookInfo.url) {
    console.warn('[TELEGRAM] Old webhook topildi; long polling uchun olib tashlanmoqda. Pending updates saqlanadi.');
    await botInstance.api.deleteWebhook({ drop_pending_updates: false });
    console.log('[TELEGRAM] Old webhook olib tashlandi.');
  } else {
    console.log('[TELEGRAM] Webhook mavjud emas; long polling ishga tushiriladi.');
  }

  pollingMode = true;
  console.log('⚡️ Telegram Long Polling faollashtirilmoqda...');
  await botInstance.start({
    onStart: (startedBotInfo) => logBotReady(startedBotInfo, 'long-polling')
  });
}

// Graceful shutdown
async function handleShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n🛑 ${signal} signali qabul qilindi. Bot xavfsiz to‘xtatilmoqda...`);

  if (botInstance && pollingMode) {
    try {
      await botInstance.stop();
      console.log('🤖 Bot long polling to‘xtatildi.');
    } catch (error) {
      console.error('Botni to‘xtatishda xato:', error.message);
    }
  }

  if (httpServer) {
    try {
      await closeServer(httpServer);
      console.log('🌐 HTTP server to‘xtatildi.');
    } catch (error) {
      console.error('HTTP serverni yopishda xato:', error.message);
    }
  }

  await closePool();
  console.log('🏁 Barcha jarayonlar to‘liq yakunlandi.');
  process.exit(0);
}

process.on('SIGINT', () => void handleShutdown('SIGINT'));
process.on('SIGTERM', () => void handleShutdown('SIGTERM'));

bootstrap().catch((error) => {
  console.error('❌ Kutilmagan kritik xatolik:', error);
  process.exit(1);
});
