import dotenv from 'dotenv';
dotenv.config();

export const config = {
  botToken: process.env.BOT_TOKEN || '',
  databaseUrl: process.env.DATABASE_URL || '',
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  adminIds: (process.env.ADMIN_TELEGRAM_IDS || '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean)
    .map(id => Number(id))
    .filter(id => !isNaN(id))
};

export function validateEnv() {
  const errors = [];
  if (!config.botToken) {
    errors.push('BOT_TOKEN muhit o\'zgaruvchisi topilmadi. Render Environment Variables yoki .env faylida ko\'rsating.');
  }
  if (!config.databaseUrl) {
    errors.push('DATABASE_URL muhit o\'zgaruvchisi topilmadi. Neon PostgreSQL connection string ko\'rsating.');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function isAdmin(telegramId) {
  if (!telegramId) return false;
  return config.adminIds.includes(Number(telegramId));
}
