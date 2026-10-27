import { InlineKeyboard } from 'grammy';
import {
  enableAdminEditMode,
  disableAdminEditMode,
  isAdminEditModeActive,
  ADMIN_EDIT_IDLE_TIMEOUT_MS
} from '../utils/adminEditMode.js';
import { getEditableEntity, updateEditableEntityField } from '../../db/queries/adminEditor.js';
import { getEditableEntitySchema, getEditableField } from '../utils/adminEditorPolicy.js';
import { escapeHtml } from '../utils/formatters.js';

export const adminEditInputStates = new Map();

function isAuthorizedEditor(ctx) {
  return Boolean(ctx.isAdmin && isAdminEditModeActive(ctx.from?.id));
}

function entityName(type, entity) {
  const keys = {
    department: entity.name,
    subject: entity.name,
    teacher: entity.full_name,
    base: entity.name,
    room: entity.room_number,
    book: entity.title,
    calendar: entity.direction_name,
    service: entity.title
  };
  return keys[type] || 'Ma’lumot';
}

function editorMenuKeyboard(entityType, entityId) {
  const schema = getEditableEntitySchema(entityType);
  const kb = new InlineKeyboard();
  schema.fields.forEach((field, index) => {
    kb.text(field.label, `admin_edit_field:${entityType}:${entityId}:${field.key}`);
    if (index % 2 === 1 || index === schema.fields.length - 1) kb.row();
  });
  kb.text('⬅️ Admin panel', 'admin_panel')
    .text('🏠 Asosiy menyu', 'menu_home');
  return kb;
}

export async function handleAdminEditModeToggle(ctx) {
  if (!ctx.isAdmin) {
    await ctx.answerCallbackQuery('Sizda admin ruxsati yo‘q.');
    return;
  }

  const userId = ctx.from.id;
  const active = isAdminEditModeActive(userId);
  let message;

  if (active) {
    disableAdminEditMode(userId);
    adminEditInputStates.delete(userId);
    message = '🛡 <b>Tahrirlash rejimi o‘chirildi.</b>\n\nBot oddiy foydalanuvchi rejimida. Admin huquqlaringiz saqlanadi.';
  } else {
    enableAdminEditMode(userId, ctx.api, ctx.chat?.id, ADMIN_EDIT_IDLE_TIMEOUT_MS);
    message = '🛠 <b>Tahrirlash rejimi yoqildi.</b>\n\nEndi qidiruv natijalari va tegishli ma’lumot kartalarida ✏️ tahrirlash tugmalari chiqadi. 10 daqiqa faollik bo‘lmasa rejim avtomatik o‘chadi.';
  }

  const kb = new InlineKeyboard()
    .text('🔍 Qidiruvni ochish', 'search_prompt').row()
    .text('⚙️ Admin panel', 'admin_panel')
    .text('🏠 Asosiy menyu', 'menu_home');

  await ctx.editMessageText(message, { parse_mode: 'HTML', reply_markup: kb });
  await ctx.answerCallbackQuery(active ? 'Rejim o‘chirildi.' : 'Rejim yoqildi.');
}

export async function handleAdminEntityEditMenu(ctx, entityType, entityId) {
  if (!ctx.isAdmin) {
    await ctx.answerCallbackQuery('Sizda admin ruxsati yo‘q.');
    return;
  }
  if (!isAuthorizedEditor(ctx)) {
    await ctx.answerCallbackQuery('Tahrirlash rejimi o‘chgan yoki muddati tugagan. /admin orqali qayta yoqing.');
    return;
  }

  const schema = getEditableEntitySchema(entityType);
  if (!schema) {
    await ctx.answerCallbackQuery('Bu turdagi ma’lumot tahrirlash uchun ochilmagan.');
    return;
  }

  const entity = await getEditableEntity(entityType, entityId);
  if (!entity) {
    await ctx.answerCallbackQuery('Ma’lumot topilmadi. Qidiruvni yangilang.');
    return;
  }

  const currentName = escapeHtml(entityName(entityType, entity));
  await ctx.reply(
    `✏️ <b>${escapeHtml(schema.label)}ni tahrirlash</b>\n\nTanlangan ma’lumot: <b>${currentName}</b>\n\nO‘zgartirmoqchi bo‘lgan maydonni tanlang. O‘zgarishlar ma’lumotlar bazasida saqlanadi va shu yozuvdan foydalanadigan tegishli bo‘limlarda aks etadi.`,
    { parse_mode: 'HTML', reply_markup: editorMenuKeyboard(entityType, Number(entityId)) }
  );
  await ctx.answerCallbackQuery();
}

export async function handleAdminEditFieldStart(ctx, entityType, entityId, fieldKey) {
  if (!ctx.isAdmin) {
    await ctx.answerCallbackQuery('Sizda admin ruxsati yo‘q.');
    return;
  }
  if (!isAuthorizedEditor(ctx)) {
    await ctx.answerCallbackQuery('Tahrirlash rejimi muddati tugagan. /admin orqali qayta yoqing.');
    return;
  }

  const field = getEditableField(entityType, fieldKey);
  const schema = getEditableEntitySchema(entityType);
  if (!field || !schema) {
    await ctx.answerCallbackQuery('Tanlangan maydon mavjud emas.');
    return;
  }

  const entity = await getEditableEntity(entityType, entityId);
  if (!entity) {
    await ctx.answerCallbackQuery('Ma’lumot topilmadi.');
    return;
  }

  adminEditInputStates.set(ctx.from.id, {
    entityType,
    entityId: Number(entityId),
    fieldKey,
    createdAt: Date.now(),
    expiresAt: Date.now() + 5 * 60 * 1000
  });

  const currentValue = String(entity[fieldKey] ?? '—').slice(0, 300);
  const kb = new InlineKeyboard().text('❌ Tahrirlashni bekor qilish', 'admin_edit_cancel');
  await ctx.reply(
    `✏️ <b>${escapeHtml(field.label)}</b>\n\nHozirgi qiymat:\n<code>${escapeHtml(currentValue)}</code>\n\nYangi qiymatni bitta xabarda yuboring. Bo‘shatish mumkin bo‘lgan maydonni tozalash uchun <code>-</code> yuboring.\n/cancel bilan ham bekor qilishingiz mumkin.`,
    { parse_mode: 'HTML', reply_markup: kb }
  );
  await ctx.answerCallbackQuery();
}

export async function handleAdminEditCancel(ctx) {
  if (ctx.from?.id) adminEditInputStates.delete(ctx.from.id);
  await ctx.answerCallbackQuery('Tahrirlash bekor qilindi.');
  await ctx.reply('Tahrirlash bekor qilindi. Admin panel: /admin');
}

export async function processAdminEditInput(ctx) {
  const userId = ctx.from?.id;
  if (!userId) return false;
  const state = adminEditInputStates.get(userId);
  if (!state) return false;

  const text = ctx.message?.text;
  if (typeof text !== 'string') return false;

  if (text.trim() === '/cancel' || text.trim() === '❌ Bekor qilish') {
    adminEditInputStates.delete(userId);
    await ctx.reply('Tahrirlash bekor qilindi. Admin panel: /admin');
    return true;
  }

  if (!ctx.isAdmin || !isAdminEditModeActive(userId) || Date.now() > state.expiresAt) {
    adminEditInputStates.delete(userId);
    await ctx.reply('⏱ Tahrirlash sessiyasi tugagan. Ma’lumotni o‘zgartirish uchun /admin orqali tahrirlash rejimini qayta yoqing.');
    return true;
  }

  try {
    const result = await updateEditableEntityField({
      entityType: state.entityType,
      entityId: state.entityId,
      fieldKey: state.fieldKey,
      inputValue: text,
      actorTelegramId: userId
    });

    if (!result.changed) {
      await ctx.reply('ℹ️ Yangi qiymat avvalgi qiymat bilan bir xil. Ma’lumot o‘zgartirilmadi.');
      return true;
    }

    adminEditInputStates.delete(userId);
    const field = getEditableField(state.entityType, state.fieldKey);
    const oldValue = String(result.oldValue ?? '—').slice(0, 250);
    const newValue = String(result.newValue ?? '—').slice(0, 250);
    const kb = new InlineKeyboard()
      .text('✏️ Shu obyektni yana tahrirlash', `admin_edit:${state.entityType}:${state.entityId}`).row()
      .text('⚙️ Admin panel', 'admin_panel')
      .text('🏠 Asosiy menyu', 'menu_home');

    await ctx.reply(
      `✅ <b>O‘zgarish saqlandi.</b>\n\n<b>Maydon:</b> ${escapeHtml(field.label)}\n<b>Avval:</b> <code>${escapeHtml(oldValue)}</code>\n<b>Hozir:</b> <code>${escapeHtml(newValue)}</code>\n\nO‘zgarish audit jurnaliga yozildi. Bog‘langan ma’lumotlar mavjud bo‘lsa, ular ham sinxronlashtirildi.`,
      { parse_mode: 'HTML', reply_markup: kb }
    );
    return true;
  } catch (error) {
    const safeMessage = escapeHtml(error?.message || 'Noma’lum xatolik');
    await ctx.reply(`⚠️ O‘zgarish saqlanmadi: ${safeMessage}\n\nQiymatni qayta yuboring yoki /cancel deb bekor qiling.`, { parse_mode: 'HTML' });
    return true;
  }
}
