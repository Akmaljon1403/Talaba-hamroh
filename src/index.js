import http from 'http';
import { config, validateEnv } from './config/env.js';
import { testConnection, closePool } from './db/pool.js';
import { runMigrations } from './db/migrate.js';
import { seedDatabase } from './db/seed.js';
import { createBot } from './bot/index.js';

let botInstance = null;
let httpServer = null;

async function bootstrap() {
  console.log('====================================================');
  console.log('🚀 FJSTI Talaba Hamrohi Bot ishga tushmoqda...');
  console.log(`📌 Muhit: ${config.nodeEnv}`);
  console.log('====================================================');

  // 1. Environment validation
  const envCheck = validateEnv();
  if (!envCheck.isValid) {
    console.error('❌ Muhit konfiguratsiyasida kamchiliklar aniqlandi:');
    envCheck.errors.forEach(err => console.error(`  - ${err}`));
    console.error('\nIltimos, Render Environment Variables yoki .env faylini to\'g\'rilang.');
    process.exit(1);
  }

  // 2. Database connection & migrations
  console.log('🔍 Neon PostgreSQL ma\'lumotlar bazasiga ulanish tekshirilmoqda...');
  const dbTest = await testConnection();
  if (!dbTest.success) {
    console.error('❌ Ma\'lumotlar bazasiga ulanib bo\'lmadi:', dbTest.error);
    console.error('Iltimos, DATABASE_URL to\'g\'riligini tekshiring.');
    process.exit(1);
  }
  console.log(`✅ Baza bilan aloqa o'rnatildi: [${dbTest.db}] (${dbTest.time})`);

  // Run migrations & initial seed
  try {
    await runMigrations();
    // Auto-seed if database is fresh
    await seedDatabase();
  } catch (dbInitErr) {
    console.error('❌ Baza initsializatsiyasida xatolik:', dbInitErr.message);
    process.exit(1);
  }

  // 3. Initialize & start Telegram Bot (Long Polling)
  console.log('🤖 Telegram bot initsializatsiya qilinmoqda...');
  botInstance = createBot(config.botToken);

  // This service is explicitly configured for Long Polling. A webhook left by
  // an older deployment prevents Telegram getUpdates from delivering messages.
  // Inspect only whether a webhook exists; never log the URL because it may be sensitive.
  const webhookInfo = await botInstance.api.getWebhookInfo();
  if (webhookInfo.url) {
    console.warn('[TELEGRAM] An existing webhook was found; removing it for Long Polling. Pending updates will be preserved.');
    await botInstance.api.deleteWebhook({ drop_pending_updates: false });
    console.log('[TELEGRAM] Existing webhook removed; Long Polling can receive updates.');
  } else {
    console.log('[TELEGRAM] No existing webhook detected; Long Polling is ready.');
  }

  // Optional lightweight health-check server (useful if deployed as Web Service on Render)
  if (process.env.PORT) {
    httpServer = http.createServer((req, res) => {
      if (req.url === '/health' || req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'ok',
          service: 'fjsti-talaba-hamroh',
          timestamp: new Date().toISOString()
        }));
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    httpServer.listen(config.port, () => {
      console.log(`🌐 Sog'lomlik (health-check) serveri ${config.port}-portda ishlamoqda.`);
    });
  }

  console.log('⚡️ Telegram Long Polling faollashtirilmoqda...');
  
  // Start bot long polling
  // Await polling startup so initialization failures reach bootstrap().catch().
  // This also keeps the startup lifecycle explicit for Render logs and shutdown.
  await botInstance.start({
    onStart: (botInfo) => {
      console.log('====================================================');
      console.log(`🎉 Bot muvaffaqiyatli ishga tushdi: @${botInfo.username}`);
      console.log(`🆔 Bot ID: ${botInfo.id}`);
      console.log(`👥 Adminlar soni: ${config.adminIds.length}`);
      console.log('24/7 rejimda xabarlarni qabul qilishga tayyor!');
      console.log('====================================================');
    }
  });
}

// Graceful shutdown
async function handleShutdown(signal) {
  console.log(`\n🛑 ${signal} signali qabul qilindi. Bot xavfsiz to'xtatilmoqda...`);

  if (botInstance) {
    try {
      await botInstance.stop();
      console.log('🤖 Bot long polling to\'xtatildi.');
    } catch (e) {
      console.error('Botni to\'xtatishda xato:', e.message);
    }
  }

  if (httpServer) {
    httpServer.close();
    console.log('🌐 HTTP server to\'xtatildi.');
  }

  await closePool();
  console.log('🏁 Barcha jarayonlar to\'liq yakunlandi.');
  process.exit(0);
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

bootstrap().catch((err) => {
  console.error('❌ Kutilmagan kritik xatolik:', err);
  process.exit(1);
});
