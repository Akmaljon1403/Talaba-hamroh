import { InlineKeyboard } from 'grammy';
import { query } from '../../db/pool.js';

const PAGE_SIZE = 8;

const ENTITIES = {
  faculty: {
    label: 'Fakultetlar', table: 'faculties', titleField: 'name', required: ['name'],
    fields: [
      { key: 'name', label: 'Fakultet nomi' },
      { key: 'code', label: 'Kodi' },
      { key: 'dean_name', label: 'Dekan F.I.Sh.' },
      { key: 'description', label: 'Tavsif / yo‘nalishlar' }
    ]
  },
  department: {
    label: 'Kafedralar', table: 'departments', titleField: 'name', required: ['name'],
    fields: [
      { key: 'name', label: 'Kafedra nomi' },
      { key: 'level', label: 'Ta’lim bosqichi' },
      { key: 'head_name', label: 'Kafedra mudiri' },
      { key: 'contact_phone', label: 'Telefon' },
      { key: 'location_notes', label: 'Joylashuv / izoh' }
    ]
  },
  subject: {
    label: 'Fanlar', table: 'subjects', titleField: 'name', required: ['name'], numericFields: ['department_id'],
    fields: [
      { key: 'name', label: 'Fan nomi' },
      { key: 'courses', label: 'Kurslar' },
      { key: 'semesters', label: 'Semestrlar' },
      { key: 'level', label: 'Ta’lim bosqichi' },
      { key: 'department_id', label: 'Kafedra ID raqami' }
    ]
  },
  base: {
    label: 'Klinik bazalar', table: 'clinical_bases', titleField: 'name', required: ['name'],
    numericFields: ['total_rooms', 'total_capacity'],
    fields: [
      { key: 'name', label: 'Baza nomi' },
      { key: 'department_name', label: 'Biriktirilgan kafedra' },
      { key: 'head_name', label: 'Mas’ul shaxs' },
      { key: 'contact_phone', label: 'Telefon' },
      { key: 'address', label: 'Manzil' },
      { key: 'map_link', label: 'Xarita havolasi' },
      { key: 'total_rooms', label: 'Xonalar soni' },
      { key: 'total_capacity', label: 'Umumiy sig‘im' }
    ]
  },
  room: {
    label: 'Auditoriyalar', table: 'rooms', titleField: 'room_number', required: ['room_number', 'room_type'],
    numericFields: ['clinical_base_id', 'department_id', 'capacity'],
    fields: [
      { key: 'room_number', label: 'Xona raqami' },
      { key: 'room_type', label: 'Xona turi' },
      { key: 'capacity', label: 'Sig‘im' },
      { key: 'department_name', label: 'Biriktirilgan kafedra' },
      { key: 'notes', label: 'Izoh' },
      { key: 'clinical_base_id', label: 'Klinik baza ID raqami' },
      { key: 'department_id', label: 'Kafedra ID raqami' }
    ]
  },
  calendar: {
    label: 'O‘quv jarayoni jadvali', table: 'academic_calendars', titleField: 'direction_name',
    required: ['course', 'direction_name'],
    numericFields: ['course', 'theory_weeks', 'internship_weeks', 'attestation_weeks', 'credit_intro_weeks', 'vacation_weeks', 'state_exam_weeks', 'gpa_weeks', 'total_weeks'],
    fields: [
      { key: 'course', label: 'Kurs' },
      { key: 'direction_name', label: 'Ta’lim yo‘nalishi' },
      { key: 'theory_weeks', label: 'Nazariy ta’lim haftalari' },
      { key: 'internship_weeks', label: 'Amaliyot haftalari' },
      { key: 'attestation_weeks', label: 'Attestatsiya haftalari' },
      { key: 'credit_intro_weeks', label: 'Kredit-modulga kirish haftalari' },
      { key: 'vacation_weeks', label: 'Ta’til haftalari' },
      { key: 'state_exam_weeks', label: 'Davlat imtihoni haftalari' },
      { key: 'gpa_weeks', label: 'GPA haftalari' },
      { key: 'total_weeks', label: 'Jami haftalar' },
      { key: 'academic_year', label: 'O‘quv yili' },
      { key: 'source', label: 'Manba / izoh' }
    ]
  },
  teacher: {
    label: 'O‘qituvchilar', table: 'teachers', titleField: 'full_name', required: ['full_name'], numericFields: ['department_id'],
    fields: [
      { key: 'full_name', label: 'F.I.Sh.' },
      { key: 'department_id', label: 'Kafedra ID raqami' },
      { key: 'position', label: 'Lavozimi' },
      { key: 'official_contact', label: 'Rasmiy aloqa' },
      { key: 'source', label: 'Ma’lumot manbasi' }
    ]
  },
  book: {
    label: 'Elektron kitoblar', table: 'books', titleField: 'title', required: ['title', 'file_url'], numericFields: ['course'],
    fields: [
      { key: 'title', label: 'Kitob nomi' },
      { key: 'author', label: 'Muallif' },
      { key: 'subject_name', label: 'Fan nomi' },
      { key: 'course', label: 'Kurs' },
      { key: 'file_url', label: 'Kitob havolasi' },
      { key: 'source', label: 'Manba' }
    ]
  },
  service: {
    label: 'Talaba xizmatlari', table: 'student_services', titleField: 'title', required: ['title', 'content'], updatedAt: true,
    fields: [
      { key: 'title', label: 'Xizmat sarlavhasi' },
      { key: 'short_description', label: 'Qisqa tavsif' },
      { key: 'content', label: 'Asosiy matn / yo‘riqnoma' },
      { key: 'source_url', label: 'Rasmiy havola' }
    ]
  }
};

const EDIT_STATES = new Map();

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function shorten(value, maxLength = 100) {
  const normalized = String(value ?? '—').replace(/\s+/g, ' ').trim() || '—';
  return normalized.length > maxLength ? normalized.slice(0, maxLength - 1) + '…' : normalized;
}

function getEntity(type) {
  const entity = ENTITIES[type];
  if (!entity) throw new Error('Noma’lum ma’lumot turi tanlandi.');
  return entity;
}

export function normalizeAdminEditValue(type, fieldKey, rawValue) {
  const entity = getEntity(type);
  const field = entity.fields.find((item) => item.key === fieldKey);
  if (!field) throw new Error('Bu maydonni tahrirlashga ruxsat berilmagan.');

  const value = String(rawValue ?? '').trim();
  if (entity.required.includes(fieldKey) && (!value || value === '-')) {
    throw new Error('Bu maydon bo‘sh qolishi mumkin emas.');
  }

  if (!value || value === '-') return null;
  const maxLength = fieldKey === 'content' || fieldKey === 'description' ? 3500 : 1800;
  if (value.length > maxLength) throw new Error('Matn juda uzun. Iltimos, qisqaroq qiymat kiriting.');

  if ((entity.numericFields || []).includes(fieldKey)) {
    if (!/^-?\d+$/.test(value)) throw new Error('Bu maydon uchun butun son kiriting.');
    const number = Number(value);
    if (!Number.isSafeInteger(number)) throw new Error('Son formati noto‘g‘ri.');
    if (number < 0) throw new Error('Manfiy son kiritish mumkin emas.');
    return number;
  }

  return value;
}

async function getRecord(type, id) {
  const entity = getEntity(type);
  const result = await query('SELECT * FROM ' + entity.table + ' WHERE id = $1 LIMIT 1', [id]);
  return result.rows[0] || null;
}

function makeCategoryKeyboard() {
  const kb = new InlineKeyboard();
  const types = Object.keys(ENTITIES);
  for (let i = 0; i < types.length; i += 2) {
    const left = types[i];
    kb.text(ENTITIES[left].label, 'admin_edit_list:' + left + ':1');
    if (types[i + 1]) {
      const right = types[i + 1];
      kb.text(ENTITIES[right].label, 'admin_edit_list:' + right + ':1');
    }
    kb.row();
  }
  return kb.text('⬅️ Admin paneliga', 'admin_panel');
}

async function deliver(ctx, text, keyboard) {
  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: keyboard });
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
  }
}

function requireAdmin(ctx) {
  return Boolean(ctx.isAdmin && ctx.from?.id);
}

export async function handleAdminEditData(ctx) {
  if (ctx.callbackQuery && ctx.from?.id) EDIT_STATES.delete(ctx.from.id);
  if (!requireAdmin(ctx)) {
    if (ctx.callbackQuery) await ctx.answerCallbackQuery('Bu bo‘lim faqat adminlar uchun.', { show_alert: true });
    else await ctx.reply('⛔️ Bu bo‘lim faqat adminlar uchun.');
    return;
  }

  const text = '✏️ <b>Ma’lumotlarni tahrirlash</b>\n\n' +
    'Kerakli bo‘limni tanlang. O‘zgarishlar ma’lumotlar bazasiga yoziladi va keyingi qayta ishga tushirishda ham saqlanadi.\n\n' +
    '<i>Hozircha mavjud yozuvlar tahrirlanadi; yozuvni tanlab, keyin kerakli maydonni belgilang.</i>';
  await deliver(ctx, text, makeCategoryKeyboard());
}

export async function handleAdminEditList(ctx, type, requestedPage = 1) {
  if (ctx.callbackQuery && ctx.from?.id) EDIT_STATES.delete(ctx.from.id);
  if (!requireAdmin(ctx)) {
    if (ctx.callbackQuery) await ctx.answerCallbackQuery('Bu bo‘lim faqat adminlar uchun.', { show_alert: true });
    return;
  }

  let entity;
  try {
    entity = getEntity(type);
  } catch {
    await ctx.answerCallbackQuery('Ma’lumot turi topilmadi.');
    return;
  }

  const countResult = await query('SELECT COUNT(*)::int AS total FROM ' + entity.table);
  const total = Number(countResult.rows[0]?.total || 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.max(1, Math.min(Number(requestedPage) || 1, totalPages));
  const offset = (page - 1) * PAGE_SIZE;

  const text = '✏️ <b>' + escapeHtml(entity.label) + ' — tahrirlash</b>\n\n' +
    (total
      ? 'Tahrirlamoqchi bo‘lgan yozuvni tanlang (' + page + '/' + totalPages + '-sahifa, jami ' + total + ' ta):'
      : 'Bu bo‘limda hozircha yozuv topilmadi.');

  const kb = new InlineKeyboard();
  if (total) {
    const result = await query(
      'SELECT id, ' + entity.titleField + ' AS item_title FROM ' + entity.table + ' ORDER BY id ASC LIMIT $1 OFFSET $2',
      [PAGE_SIZE, offset]
    );

    for (const row of result.rows) {
      kb.text('#' + row.id + ' · ' + shorten(row.item_title, 38), 'admin_edit_item:' + type + ':' + row.id).row();
    }

    const nav = [];
    if (page > 1) nav.push({ text: '⬅️ Oldingi', callback_data: 'admin_edit_list:' + type + ':' + (page - 1) });
    nav.push({ text: page + '/' + totalPages, callback_data: 'noop' });
    if (page < totalPages) nav.push({ text: 'Keyingi ➡️', callback_data: 'admin_edit_list:' + type + ':' + (page + 1) });
    kb.row(...nav);
  }

  kb.row()
    .text('⬅️ Tahrirlash bo‘limlari', 'admin_edit_data')
    .text('⚙️ Admin paneli', 'admin_panel');

  await deliver(ctx, text, kb);
}

export async function handleAdminEditRecord(ctx, type, id) {
  if (ctx.callbackQuery && ctx.from?.id) EDIT_STATES.delete(ctx.from.id);
  if (!requireAdmin(ctx)) {
    if (ctx.callbackQuery) await ctx.answerCallbackQuery('Bu bo‘lim faqat adminlar uchun.', { show_alert: true });
    return;
  }

  let entity;
  let record;
  try {
    entity = getEntity(type);
    record = await getRecord(type, id);
  } catch (error) {
    if (ctx.callbackQuery) await ctx.answerCallbackQuery(error.message, { show_alert: true });
    else await ctx.reply(error.message);
    return;
  }

  if (!record) {
    if (ctx.callbackQuery) await ctx.answerCallbackQuery('Yozuv topilmadi.');
    else await ctx.reply('Yozuv topilmadi.');
    return;
  }

  const lines = entity.fields.map((field) =>
    '• <b>' + escapeHtml(field.label) + ':</b> ' + escapeHtml(shorten(record[field.key], 140))
  );
  const text = '✏️ <b>' + escapeHtml(entity.label) + ' · #' + record.id + '</b>\n\n' +
    lines.join('\n') + '\n\n' +
    '<i>O‘zgartirish uchun kerakli maydon tugmasini bosing.</i>';

  const kb = new InlineKeyboard();
  for (let i = 0; i < entity.fields.length; i += 2) {
    const first = entity.fields[i];
    kb.text(first.label, 'admin_edit_field:' + type + ':' + record.id + ':' + first.key);
    if (entity.fields[i + 1]) {
      const second = entity.fields[i + 1];
      kb.text(second.label, 'admin_edit_field:' + type + ':' + record.id + ':' + second.key);
    }
    kb.row();
  }
  kb.row()
    .text('⬅️ Ro‘yxat', 'admin_edit_list:' + type + ':1')
    .text('Turlarga qaytish', 'admin_edit_data');

  await deliver(ctx, text, kb);
}

export async function handleAdminEditField(ctx, type, id, fieldKey) {
  if (!requireAdmin(ctx)) {
    if (ctx.callbackQuery) await ctx.answerCallbackQuery('Bu bo‘lim faqat adminlar uchun.', { show_alert: true });
    return;
  }

  try {
    const entity = getEntity(type);
    const field = entity.fields.find((item) => item.key === fieldKey);
    if (!field) throw new Error('Maydon topilmadi.');
    const record = await getRecord(type, id);
    if (!record) throw new Error('Yozuv topilmadi.');

    EDIT_STATES.set(ctx.from.id, { entity: type, id: Number(id), field: fieldKey });
    const currentValue = shorten(record[fieldKey], 500);
    const text = '✏️ <b>' + escapeHtml(entity.label) + ' · #' + id + '</b>\n' +
      '<b>Maydon:</b> ' + escapeHtml(field.label) + '\n' +
      '<b>Hozirgi qiymat:</b>\n<code>' + escapeHtml(currentValue) + '</code>\n\n' +
      'Yangi qiymatni bitta xabar qilib yuboring.\n' +
      'Ixtiyoriy maydonni tozalash uchun <code>-</code> yuboring. Majburiy maydonni bo‘shatib bo‘lmaydi.\n\n' +
      '<i>Bekor qilish uchun /cancel yozing yoki tugmani bosing.</i>';
    const kb = new InlineKeyboard()
      .text('↩️ Bekor qilish', 'admin_edit_cancel')
      .text('✏️ Boshqa maydon', 'admin_edit_item:' + type + ':' + id);
    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
    await ctx.answerCallbackQuery();
  } catch (error) {
    await ctx.answerCallbackQuery(error.message || 'Xatolik yuz berdi.', { show_alert: true });
  }
}

export async function handleAdminEditCancel(ctx) {
  if (!requireAdmin(ctx)) {
    if (ctx.callbackQuery) await ctx.answerCallbackQuery('Bu bo‘lim faqat adminlar uchun.', { show_alert: true });
    return;
  }

  const state = EDIT_STATES.get(ctx.from.id);
  EDIT_STATES.delete(ctx.from.id);
  if (state) await handleAdminEditRecord(ctx, state.entity, state.id);
  else await handleAdminEditData(ctx);
}

export async function processAdminEditInput(ctx) {
  const userId = ctx.from?.id;
  const state = userId ? EDIT_STATES.get(userId) : null;
  if (!state) return false;

  if (!ctx.isAdmin) {
    EDIT_STATES.delete(userId);
    await ctx.reply('⛔️ Admin ruxsati topilmadi. Tahrirlash bekor qilindi.');
    return true;
  }

  const rawValue = ctx.message?.text;
  if (typeof rawValue !== 'string') return false;
  const text = rawValue.trim();

  if (text === '/cancel' || text === '❌ Bekor qilish') {
    EDIT_STATES.delete(userId);
    await ctx.reply('Tahrirlash bekor qilindi.');
    return true;
  }

  try {
    const entity = getEntity(state.entity);
    const field = entity.fields.find((item) => item.key === state.field);
    if (!field) throw new Error('Tahrirlanadigan maydon topilmadi.');
    const value = normalizeAdminEditValue(state.entity, state.field, text);
    const setClause = '"' + state.field + '" = $1' + (entity.updatedAt ? ', updated_at = CURRENT_TIMESTAMP' : '');
    const result = await query(
      'UPDATE ' + entity.table + ' SET ' + setClause + ' WHERE id = $2 RETURNING id, ' + entity.titleField + ' AS item_title',
      [value, state.id]
    );
    if (!result.rowCount) throw new Error('Yozuv topilmadi yoki yangilanmadi.');

    EDIT_STATES.delete(userId);
    await ctx.reply(
      '✅ <b>Ma’lumot saqlandi.</b>\n' +
      'Bo‘lim: ' + escapeHtml(entity.label) + '\n' +
      'Yozuv: #' + state.id + ' · ' + escapeHtml(shorten(result.rows[0].item_title, 120)) + '\n' +
      'Maydon: ' + escapeHtml(field.label),
      { parse_mode: 'HTML' }
    );
    await handleAdminEditRecord(ctx, state.entity, state.id);
    return true;
  } catch (error) {
    await ctx.reply(
      '⚠️ <b>Saqlab bo‘lmadi.</b>\n' + escapeHtml(shorten(error.message, 260)) + '\n\n' +
      'Qiymatni qaytadan yuboring yoki /cancel deb yozing.',
      { parse_mode: 'HTML' }
    );
    return true;
  }
}
