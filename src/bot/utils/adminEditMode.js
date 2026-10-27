import { contentEditStates } from '../state/adminState.js';

export const ADMIN_EDIT_MODE_IDLE_MS = 5 * 60 * 1000;
const editModeStates = new Map();

function clearTimer(state) {
  if (state?.timer) clearTimeout(state.timer);
}

function expireMode(telegramId, state, notify = true) {
  if (editModeStates.get(telegramId) !== state) return;
  editModeStates.delete(telegramId);
  clearTimer(state);
  contentEditStates.delete(telegramId);


  if (notify && state.api && state.chatId) {
    state.api.sendMessage(
      state.chatId,
      '⌛️ Tahrirlash rejimi 5 daqiqa faol bo‘lmaganingiz sabab avtomatik o‘chirildi. Siz foydalanuvchi rejimidasiz.'
    ).catch(() => {});
  }
}

function armExpiry(telegramId, state) {
  clearTimer(state);
  state.expiresAt = Date.now() + state.timeoutMs;
  state.timer = setTimeout(() => {
    if (Date.now() >= state.expiresAt) {
      expireMode(telegramId, state, true);
    } else {
      armExpiry(telegramId, state);
    }
  }, state.timeoutMs + 50);
  state.timer.unref?.();
}

export function enableAdminEditMode(telegramId, api, chatId, timeoutMs = ADMIN_EDIT_MODE_IDLE_MS) {
  const id = Number(telegramId);
  const previous = editModeStates.get(id);
  clearTimer(previous);
  const safeTimeoutMs = Number.isFinite(timeoutMs) ? Math.max(10, Math.min(timeoutMs, 24 * 60 * 60 * 1000)) : ADMIN_EDIT_MODE_IDLE_MS;
  const state = { api, chatId, timeoutMs: safeTimeoutMs, expiresAt: 0, timer: null };
  editModeStates.set(id, state);
  armExpiry(id, state);
  return true;
}

export function refreshAdminEditMode(telegramId, api, chatId) {
  const id = Number(telegramId);
  const state = editModeStates.get(id);
  if (!state) return false;
  if (Date.now() >= state.expiresAt) {
    expireMode(id, state, true);
    return false;
  }
  if (api) state.api = api;
  if (chatId) state.chatId = chatId;
  armExpiry(id, state);
  return true;
}

export function isAdminEditModeActive(telegramId) {
  const id = Number(telegramId);
  const state = editModeStates.get(id);
  if (!state) return false;
  if (Date.now() >= state.expiresAt) {
    expireMode(id, state, true);
    return false;
  }
  return true;
}

export function disableAdminEditMode(telegramId) {
  const id = Number(telegramId);
  const state = editModeStates.get(id);
  if (state) {
    clearTimer(state);
    editModeStates.delete(id);
  }
  contentEditStates.delete(id);
}
