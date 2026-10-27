import { InlineKeyboard } from 'grammy';
import {
  getEditableEntityConfig,
  getEditableField,
  getEditableEntity,
  listEditableEntities,
  updateEditableField,
  validateEditableValue
} from '../../db/queries/contentEditor.js';
import { contentEditStates } from '../state/adminState.js';
import {
  enableAdminEditMode,
  isAdminEditModeActive,
} from '../utils/adminEditMode.js';
import { escapeHtml } from '../utils/formatters.js';

async function requirePrivateChat(ctx) {
  if (ctx.chat?.type === 'private') return true;
  const message = 'Ma’lumotlarni tahrirlash xavfsizlik uchun faqat botning shaxsiy chatida ishlaydi.';
  if (ctx.callbackQuery) await ctx.answerCallbackQuery(message);
  else await ctx.reply(message);
  return false;
}

const PAGE_SIZE = 8;

const EDITABLE_TYPES = [
  ['dept', '🏛 Kafedralar'],
  ['subject', '📖 Fanlar'],
  ['teacher', '👨‍🏫 O‘qituvchilar / mudirlar'],
  ['base', '🏥 Klinik bazalar'],
  ['room', '🚪 Auditoriyalar'],
  ['book', '📚 Kitoblar'],
  ['calendar', '📅 O‘quv jadvali'],
  ['faculty', '🏢 Fakultetlar'],
  ['service', '💡 Talaba xizmatlari']
];

function homeKeyboard() {
  const kb = new InlineKeyboard();
  for (let i = 0; i < EDITABLE_TYPES.length; i += 2) {
    const first = EDITABLE_TYPES[i];
    const second = EDITABLE_TYPES[i + 1];
    kb.text(first[1], `content_list:${first[0]}:1`);
    if (second) kb.text(second[1], `content_list:${second[0]}:1`);
    kb.row();
  }
  kb.text('⚙️ Admin paneli', 'admin_panel')
    .text('✅ Tahrirlashni tugatish', 'admin_edit_mode_off');
  return kb;
}

export async function handleContentEditorHome(ctx) {
  if (!(await requirePrivateChat(ctx))) return;
  if (!ctx.isAdmin) {
    if (ctx.callbackQuery) await ctx.answerCallbackQuery('Faqat adminlar uchun.');
    else await ctx.reply('⛔️ Bu bo‘lim faqat administratorlar uchun.');
    return;
  }

  enableAdminEditMode(ctx.from.id, ctx.api, ctx.chat?.id);
  const text = `🗂 <b>Ma’lumotlarni boshqarish</b>\n\n` +
    `Kerakli ma’lumot turini tanlang. O‘zgarishlar bazaga saqlanadi va shu yozuvdan foydalanadigan qidiruvlar, kartalar va menyularda qo‘llanadi.\n\n` +
    `⏳ Tahrirlash rejimi 5 daqiqa harakatsizlikdan keyin avtomatik o‘chadi.`;

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: homeKeyboard() });
    await ctx.answerCallbackQuery('Tahrirlash rejimi yoqildi.');
  } else {
    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: homeKeyboard() });
  }
}

export async function handleContentList(ctx, entityType, page = 1) {
  if (!(await requirePrivateChat(ctx))) return;
  if (!ctx.isAdmin || !isAdminEditModeActive(ctx.from?.id)) {
    if (ctx.callbackQuery) await ctx.answerCallbackQuery('Tahrirlash rejimi o‘chiq. Admin panelidan yoqing.');
    else await ctx.reply('Tahrirlash rejimi o‘chiq. Admin panelidan yoqing.');
    return;
  }

  const entityConfig = getEditableEntityConfig(entityType);
  if (!entityConfig) {
    await ctx.answerCallbackQuery('Ma’lumot turi topilmadi.');
    return;
  }

  const safePage = Math.max(1, Number(page) || 1);
  const items = await listEditableEntities(entityType, PAGE_SIZE + 1, (safePage - 1) * PAGE_SIZE);
  const visibleItems = items.slice(0, PAGE_SIZE);
  const kb = new InlineKeyboard();

  for (const item of visibleItems) {
    const label = String(item.label ?? `#${item.id}`);
    const extra = item.extra ? ` · ${item.extra}` : '';
    const buttonText = `${label}${extra}`;
    kb.text(buttonText.length > 60 ? buttonText.slice(0, 57) + '…' : buttonText, `content_edit:${entityType}:${item.id}`).row();
  }

  const nav = [];
  if (safePage > 1) nav.push({ text: '⬅️ Oldingi', callback_data: `content_list:${entityType}:${safePage - 1}` });
  nav.push({ text: `📄 ${safePage}-sahifa`, callback_data: 'noop' });
  if (items.length > PAGE_SIZE) nav.push({ text: 'Keyingi ➡️', callback_data: `content_list:${entityType}:${safePage + 1}` });
  kb.row(...nav);
  kb.row()
    .text('⬅️ Toifalar', 'content_editor_home')
    .text('✅ Tugatish', 'admin_edit_mode_off');

  const text = `🗂 <b>${escapeHtml(entityConfig.title)} ma’lumotlari</b>\n\n` +
    `Tahrirlash uchun yozuvni tanlang. Ro‘yxatdagi nomlar ma’lumotlar bazasidan olinadi.`;

  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
  await ctx.answerCallbackQuery();
}

export async function handleContentEditEntity(ctx, entityType, entityId) {
  if (!(await requirePrivateChat(ctx))) return;
  if (!ctx.isAdmin || !isAdminEditModeActive(ctx.from?.id)) {
    await ctx.answerCallbackQuery('Tahrirlash rejimi o‘chiq. Admin panelidan yoqing.');
    return;
  }

  const config = getEditableEntityConfig(entityType);
  const entity = await getEditableEntity(entityType, entityId);
  if (!config || !entity) {
    await ctx.answerCallbackQuery('Yozuv topilmadi.');
    return;
  }

  contentEditStates.delete(ctx.from.id);
  const label = escapeHtml(String(entity[config.labelField] ?? `#${entityId}`));
  const kb = new InlineKeyboard();
  for (let i = 0; i < config.fields.length; i += 2) {
    const first = config.fields[i];
    const second = config.fields[i + 1];
    kb.text(first.label, `content_field:${entityType}:${entityId}:${first.key}`);
    if (second) kb.text(second.label, `content_field:${entityType}:${entityId}:${second.key}`);
    kb.row();
  }
  kb.text('⬅️ Ro‘yxatga', `content_list:${entityType}:1`)
    .text('🗂 Toifalar', 'content_editor_home');

  await ctx.editMessageText(
    `✏️ <b>${escapeHtml(config.title)} tahriri</b>\n\nTanlangan yozuv: <b>${label}</b>\n\nQaysi maydonni o‘zgartirmoqchisiz?`,
    { parse_mode: 'HTML', reply_markup: kb }
  );
  await ctx.answerCallbackQuery();
}

export async function handleContentEditField(ctx, entityType, entityId, fieldKey) {
  if (!(await requirePrivateChat(ctx))) return;
  if (!ctx.isAdmin || !isAdminEditModeActive(ctx.from?.id)) {
    await ctx.answerCallbackQuery('Tahrirlash rejimi o‘chiq.');
    return;
  }

  const config = getEditableEntityConfig(entityType);
  const field = getEditableField(entityType, fieldKey);
  const entity = await getEditableEntity(entityType, entityId);
  if (!config || !field || !entity) {
    await ctx.answerCallbackQuery('Maydon yoki yozuv topilmadi.');
    return;
  }

  const current = entity[fieldKey] == null || entity[fieldKey] === '' ? '—' : String(entity[fieldKey]);
  contentEditStates.set(ctx.from.id, {
    action: 'value',
    entityType,
    entityId: Number(entityId),
    fieldKey,
    oldValue: entity[fieldKey]
  });

  const preview = current.length > 500 ? current.slice(0, 500) + '…' : current;
  const text = `✏️ <b>${escapeHtml(config.title)} — ${escapeHtml(field.label)}</b>\n\n` +
    `Hozirgi qiymat:\n<code>${escapeHtml(preview)}</code>\n\n` +
    `Yangi qiymatni bitta xabar qilib yuboring. Bekor qilish uchun “❌ Bekor qilish” tugmasini bosing.\n` +
    `Bo‘sh qoldirish mumkin bo‘lgan maydonni tozalash uchun <code>—</code> yuboring.`;

  await ctx.editMessageText(text, {
    parse_mode: 'HTML',
    reply_markup: new InlineKeyboard().text('❌ Bekor qilish', 'content_edit_cancel')
  });
  await ctx.answerCallbackQuery();
}

export async function processContentEditInput(ctx) {
  if (ctx.chat?.type !== 'private') return false;
  const userId = ctx.from?.id;
  const state = contentEditStates.get(userId);
  if (!state) return false;

  if (!ctx.isAdmin || !isAdminEditModeActive(userId)) {
    contentEditStates.delete(userId);
    await ctx.reply('Tahrirlash rejimi tugagan. Xabar foydalanuvchi amali sifatida qayta ishlanmaydi.');
    return true;
  }

  const text = ctx.message?.text;
  if (typeof text !== 'string') return false;
  if (text === '/cancel' || text === '❌ Bekor qilish') {
    contentEditStates.delete(userId);
    await ctx.reply('Tahrirlash amali bekor qilindi.');
    return true;
  }

  if (state.action === 'value') {
    const validation = validateEditableValue(state.entityType, state.fieldKey, text);
    if (!validation.ok) {
      await ctx.reply(`⚠️ ${escapeHtml(validation.error)}\nYangi qiymatni qayta yuboring yoki /cancel yozing.`, { parse_mode: 'HTML' });
      return true;
    }

    const config = getEditableEntityConfig(state.entityType);
    const field = getEditableField(state.entityType, state.fieldKey);
    state.action = 'confirm';
    state.value = validation.value;
    state.fieldLabel = field.label;
    state.entityLabel = config.title;
    contentEditStates.set(userId, state);

    const shownValue = validation.value === null ? '— (tozalanadi)' : String(validation.value);
    const preview = shownValue.length > 1000 ? shownValue.slice(0, 1000) + '…' : shownValue;
    await ctx.reply(
      `🔎 <b>O‘zgarishni tasdiqlang</b>\n\n` +
      `Ma’lumot turi: <b>${escapeHtml(config.title)}</b>\n` +
      `Maydon: <b>${escapeHtml(field.label)}</b>\n` +
      `Yangi qiymat:\n<code>${escapeHtml(preview)}</code>\n\n` +
      `Tasdiqlangandan keyin o‘zgarish ma’lumotlar bazasiga saqlanadi.`,
      {
        parse_mode: 'HTML',
        reply_markup: new InlineKeyboard()
          .text('✅ Saqlash', 'content_save_confirm')
          .text('❌ Bekor qilish', 'content_edit_cancel')
      }
    );
    return true;
  }

  if (state.action === 'confirm') {
    await ctx.reply('Hozir saqlash yoki bekor qilish tugmalaridan birini bosing.');
    return true;
  }

  contentEditStates.delete(userId);
  return false;
}

export async function handleContentSaveConfirm(ctx) {
  if (!(await requirePrivateChat(ctx))) return;
  const userId = ctx.from?.id;
  const state = contentEditStates.get(userId);
  if (!ctx.isAdmin || !isAdminEditModeActive(userId) || state?.action !== 'confirm') {
    contentEditStates.delete(userId);
    await ctx.answerCallbackQuery('Tahrirlash holati tugagan. Qaytadan boshlang.');
    return;
  }

  try {
    const updated = await updateEditableField(state.entityType, state.entityId, state.fieldKey, state.value, state.oldValue, userId);
    contentEditStates.delete(userId);
    const config = getEditableEntityConfig(state.entityType);
    const field = getEditableField(state.entityType, state.fieldKey);
    const newValue = updated[state.fieldKey] == null ? '—' : String(updated[state.fieldKey]);
    const preview = newValue.length > 500 ? newValue.slice(0, 500) + '…' : newValue;

    await ctx.editMessageText(
      `✅ <b>O‘zgarish saqlandi</b>\n\n` +
      `Ma’lumot turi: <b>${escapeHtml(config.title)}</b>\n` +
      `Maydon: <b>${escapeHtml(field.label)}</b>\n` +
      `Yangi qiymat: <code>${escapeHtml(preview)}</code>\n\n` +
      `O‘zgarish tegishli bazadagi bog‘langan yozuvlarga ham qo‘llandi. Qayta qidirishda yangi qiymat ko‘rinadi.`,
      {
        parse_mode: 'HTML',
        reply_markup: new InlineKeyboard()
          .text('✏️ Shu yozuvni yana tahrirlash', `content_edit:${state.entityType}:${state.entityId}`)
          .row()
          .text('🗂 Ma’lumotlar ro‘yxati', `content_list:${state.entityType}:1`)
          .text('⚙️ Admin paneli', 'admin_panel')
      }
    );
    await ctx.answerCallbackQuery('Ma’lumot saqlandi.');
  } catch (error) {
    console.error('[CONTENT EDIT] Saqlash xatosi:', error?.message || error);
    if (error?.code === 'EDIT_CONFLICT') {
      contentEditStates.delete(userId);
      await ctx.answerCallbackQuery('Boshqa admin bu maydonni o‘zgartirdi. Yozuvni qayta oching.');
      await ctx.editMessageText(
        '⚠️ Bu yozuv boshqa administrator tomonidan yangilangan. Oxirgi qiymatni ko‘rib, tahrirlashni qaytadan boshlang.',
        {
          reply_markup: new InlineKeyboard()
            .text('↻ Yozuvni qayta ochish', `content_edit:${state.entityType}:${state.entityId}`)
            .row()
            .text('🗂 Ma’lumotlar ro‘yxati', `content_list:${state.entityType}:1`)
        }
      );
      return;
    }
    await ctx.answerCallbackQuery('Saqlash amalga oshmadi.', { show_alert: true });
  }
}

export async function handleContentEditCancel(ctx) {
  if (!(await requirePrivateChat(ctx))) return;
  if (!ctx.isAdmin) {
    await ctx.answerCallbackQuery('Ruxsat yo‘q.');
    return;
  }
  contentEditStates.delete(ctx.from.id);
  await ctx.editMessageText(
    '❌ Tahrirlash amali bekor qilindi. Hech qanday o‘zgarish saqlanmadi.',
    { reply_markup: new InlineKeyboard().text('🗂 Ma’lumotlar ro‘yxati', 'content_editor_home') }
  );
  await ctx.answerCallbackQuery('Bekor qilindi.');
}


export async function handleContentEditHistory(ctx) {
  if (!(await requirePrivateChat(ctx))) return;
  if (!ctx.isAdmin) {
    await ctx.answerCallbackQuery('Faqat adminlar tahrirlar tarixini ko‘ra oladi.');
    return;
  }

  const edits = await getRecentContentEdits(12);
  const typeLabels = {
    dept: 'Kafedra',
    subject: 'Fan',
    teacher: 'O‘qituvchi / mudir',
    base: 'Klinik baza',
    room: 'Auditoriya',
    book: 'Kitob',
    calendar: 'O‘quv jadvali',
    faculty: 'Fakultet',
    service: 'Talaba xizmati'
  };
  let text = '🧾 <b>So‘nggi tahrirlar tarixi</b>\n\n';
  const kb = new InlineKeyboard();

  if (edits.length === 0) {
    text += 'Hozircha hech qanday tahrir saqlanmagan.';
  } else {
    edits.forEach((item, index) => {
      const typeLabel = typeLabels[item.entity_type] || item.entity_type;
      const config = getEditableEntityConfig(item.entity_type);
      const field = getEditableField(item.entity_type, item.field_name);
      const fieldLabel = field?.label || item.field_name;
      const oldValue = String(item.old_value ?? '—').replace(/\\s+/g, ' ').slice(0, 90);
      const newValue = String(item.new_value ?? '—').replace(/\\s+/g, ' ').slice(0, 90);
      const date = new Date(item.created_at).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' });

      text += `${index + 1}. <b>${escapeHtml(typeLabel)}</b> #${item.entity_id}\n` +
        `   Maydon: <b>${escapeHtml(fieldLabel)}</b>\n` +
        `   <code>${escapeHtml(oldValue)}</code> → <code>${escapeHtml(newValue)}</code>\n` +
        `   Admin ID: <code>${escapeHtml(item.actor_telegram_id)}</code>\n` +
        `   🕒 ${escapeHtml(date)}\n\n`;
    });
  }

  kb.text('⬅️ Ma’lumotlar boshqaruvi', 'content_editor_home')
    .text('⚙️ Admin paneli', 'admin_panel');
  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
  await ctx.answerCallbackQuery();
}
