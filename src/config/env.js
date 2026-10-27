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

const runtimeAdminRoles = new Map();

export function replaceRuntimeAdminRoles(adminRows = []) {
  runtimeAdminRoles.clear();
  for (const row of adminRows) {
    const telegramId = Number(row.telegram_id);
    if (Number.isSafeInteger(telegramId) && telegramId > 0) {
      runtimeAdminRoles.set(telegramId, row.role || 'admin');
    }
  }
}

export function registerRuntimeAdmin(telegramId, role = 'admin') {
  const id = Number(telegramId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new TypeError('Telegram ID admini noto‘g‘ri.');
  }
  runtimeAdminRoles.set(id, role);
}

export function getAdminRole(telegramId) {
  const id = Number(telegramId);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  if (config.adminIds.includes(id)) return 'superadmin';
  return runtimeAdminRoles.get(id) || null;
}

export function isAdmin(telegramId) {
  return getAdminRole(telegramId) !== null;
}

export function isSuperAdmin(telegramId) {
  return getAdminRole(telegramId) === 'superadmin';
}
