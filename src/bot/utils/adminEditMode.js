const DEFAULT_IDLE_TIMEOUT_MS = 10 * 60 * 1000;
const sessions = new Map();

function clearSessionTimer(session) {
  if (session?.timer) clearTimeout(session.timer);
}

function expireSession(userId, session) {
  if (sessions.get(userId) !== session) return;
  sessions.delete(userId);
  console.info(`[ADMIN EDIT MODE] Automatically disabled after inactivity for admin_id=${userId}`);
  if (session.api && session.chatId) {
    session.api.sendMessage(
      session.chatId,
      '⏱ Tahrirlash rejimi 10 daqiqa faollik bo‘lmagani sababli avtomatik o‘chirildi. Bot oddiy foydalanuvchi rejimida.'
    ).catch(() => {});
  }
}

function scheduleExpiry(userId, session) {
  clearSessionTimer(session);
  session.expiresAt = Date.now() + session.timeoutMs;
  session.timer = setTimeout(() => expireSession(userId, session), session.timeoutMs);
  session.timer.unref?.();
}

export function enableAdminEditMode(userId, api, chatId, timeoutMs = DEFAULT_IDLE_TIMEOUT_MS) {
  disableAdminEditMode(userId);
  const session = { api, chatId, timeoutMs, expiresAt: 0, timer: null };
  sessions.set(Number(userId), session);
  scheduleExpiry(Number(userId), session);
  return { expiresAt: session.expiresAt, timeoutMs: session.timeoutMs };
}

export function disableAdminEditMode(userId) {
  const key = Number(userId);
  const session = sessions.get(key);
  if (!session) return false;
  clearSessionTimer(session);
  sessions.delete(key);
  return true;
}

export function isAdminEditModeActive(userId) {
  const key = Number(userId);
  const session = sessions.get(key);
  if (!session) return false;
  if (Date.now() >= session.expiresAt) {
    clearSessionTimer(session);
    sessions.delete(key);
    return false;
  }
  return true;
}

export function touchAdminEditMode(userId) {
  const key = Number(userId);
  if (!isAdminEditModeActive(key)) return false;
  const session = sessions.get(key);
  scheduleExpiry(key, session);
  return true;
}

export function getAdminEditModeRemainingMs(userId) {
  if (!isAdminEditModeActive(userId)) return 0;
  return Math.max(0, sessions.get(Number(userId)).expiresAt - Date.now());
}

export const ADMIN_EDIT_IDLE_TIMEOUT_MS = DEFAULT_IDLE_TIMEOUT_MS;
