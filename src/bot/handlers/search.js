import { InlineKeyboard } from 'grammy';
import { normalizeUzbekText } from '../utils/text.js';
import { searchSubjects } from '../../db/queries/subjects.js';
import { searchDepartments } from '../../db/queries/departments.js';
import { searchRooms } from '../../db/queries/rooms.js';
import { searchTeachers } from '../../db/queries/teachers.js';
import { searchBooks } from '../../db/queries/books.js';
import { searchLocations } from '../../db/queries/locations.js';
import { logSearch, recordSectionClick } from '../../db/queries/stats.js';
import { logUnansweredQuestion } from '../../db/queries/unanswered.js';
import { escapeHtml } from '../utils/formatters.js';
import { isAdminEditModeActive } from '../utils/adminEditMode.js';

export async function handleSearchPrompt(ctx) {
  recordSectionClick('search_prompt');

  const text = `🔍 <b>Tezkor Qidiruv Tizimi</b>\n\n` +
    `Istalgan so‘zni yozib yuboring:\n` +
    `• Fan nomi (masalan: <i>anatomiya, mikrobiologiya, farmakologiya</i>)\n` +
    `• Kafedra nomi (masalan: <i>gigiyena, jarrohlik, terapiya</i>)\n` +
    `• O‘qituvchi yoki mudir ismi (masalan: <i>Suyarqulova, Mahmudov, Boltaboyev</i>)\n` +
    `• Auditoriya yoki xona raqami (masalan: <i>101, 201, 310, 418</i>)\n` +
    `• Tibbiyot muassasasi (masalan: <i>Yuqumli, Farovon, Uromed</i>)\n\n` +
    `<i>Savolingizni pastdagi xabarlar qatoriga yozing:</i>`;

  const kb = new InlineKeyboard()
    .text('🏠 Asosiy menyu', 'menu_home');

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: kb });
  }
}

export async function executeSearch(ctx, rawQuery) {
  const queryStr = rawQuery.trim();
  if (!queryStr || queryStr.length < 2) {
    await ctx.reply('⚠️ Qidiruv so‘zi kamida 2 ta belgidan iborat bo‘lishi kerak.');
    return;
  }

  const normalized = normalizeUzbekText(queryStr);

  // Parallel search across all entities
  const [subjects, depts, rooms, teachers, bases, books] = await Promise.all([
    searchSubjects(queryStr).catch(() => []),
    searchDepartments(queryStr).catch(() => []),
    searchRooms(queryStr).catch(() => []),
    searchTeachers(queryStr).catch(() => []),
    searchLocations(queryStr).catch(() => []),
    searchBooks(queryStr).catch(() => [])
  ]);

  const totalResults = subjects.length + depts.length + rooms.length + teachers.length + bases.length + books.length;

  // Log search stats
  logSearch(ctx.from?.id, queryStr, totalResults);

  if (totalResults === 0) {
    // Log unanswered query
    if (ctx.from?.id) {
      logUnansweredQuestion(ctx.from.id, queryStr).catch(() => {});
    }

    const notFoundText = `🔍 «<b>${escapeHtml(queryStr)}</b>» bo‘yicha natija topilmadi.\n\n` +
      `💡 <b>Maslahatlar:</b>\n` +
      `• So‘zning imlosini tekshirib ko‘ring yoki qisqartirib yozing (masalan, to‘liq so‘z o‘rniga uning asosini);\n` +
      `• Dars jadvali va baholar uchun to‘g‘ridan-to‘g‘ri <a href="https://hemis.fjsti.uz">HEMIS tizimi</a>ga kiring;\n` +
      `• Rasmiy ma'lumotlar uchun institut Registrator ofisi yoki dekanatga murojaat qiling.\n\n` +
      `<i>Ushbu so‘rov adminlarga yetkazildi va tez orada bazaga kiritiladi.</i>`;

    const kb = new InlineKeyboard()
      .text('🔄 Qaytadan qidirish', 'search_prompt')
      .text('🏠 Asosiy menyu', 'menu_home');

    await ctx.reply(notFoundText, { parse_mode: 'HTML', reply_markup: kb, link_preview_options: { is_disabled: true } });
    return;
  }

  let text = `🔍 «<b>${escapeHtml(queryStr)}</b>» bo‘yicha topilgan natijalar (${totalResults} ta):\n\n`;
  const kb = new InlineKeyboard();

  // 1. Subjects
  if (subjects.length > 0) {
    text += `📖 <b>Fanlar (${subjects.length} ta):</b>\n`;
    subjects.slice(0, 4).forEach((s) => {
      text += `• <b>${escapeHtml(s.name)}</b> (${escapeHtml(s.courses)}-kurs)\n   🏛 Kafedra: <i>${escapeHtml(s.department_name)}</i>\n`;
      if (ctx.chat?.type === 'private' && ctx.isAdmin && isAdminEditModeActive(ctx.from?.id)) {
        kb.text(`✏️ Fan: ${s.name.substring(0, 32)}`, `content_edit:subject:${s.id}`).row();
      }
    });
    text += '\n';
  }

  // 2. Departments
  if (depts.length > 0) {
    text += `🏛 <b>Kafedralar (${depts.length} ta):</b>\n`;
    depts.slice(0, 3).forEach((d) => {
      text += `• <b>${escapeHtml(d.name)}</b>\n`;
      if (d.head_name) text += `   👤 Mudir: ${escapeHtml(d.head_name)} (${escapeHtml(d.contact_phone || 'aloqa mavjud')})\n`;
      kb.text(`🏛 ${d.name.substring(0, 28)}`, `dept_detail:${d.id}`);
      if (ctx.chat?.type === 'private' && ctx.isAdmin && isAdminEditModeActive(ctx.from?.id)) {
        kb.text('✏️ Tahrirlash', `content_edit:dept:${d.id}`);
      }
      kb.row();
    });
    text += '\n';
  }

  // 3. Clinical Bases & Rooms
  if (bases.length > 0) {
    text += `🏥 <b>Tibbiyot muassasalari / Klinik bazalar (${bases.length} ta):</b>\n`;
    bases.slice(0, 3).forEach((b) => {
      text += `• <b>${escapeHtml(b.name)}</b> (${b.total_rooms} xona, ${b.total_capacity} o'rin)\n`;
      kb.text(`🏥 ${b.name.substring(0, 28)}`, `base_detail:${b.id}`);
      if (ctx.chat?.type === 'private' && ctx.isAdmin && isAdminEditModeActive(ctx.from?.id)) {
        kb.text('✏️ Tahrirlash', `content_edit:base:${b.id}`);
      }
      kb.row();
    });
    text += '\n';
  }

  if (rooms.length > 0) {
    text += `🚪 <b>Auditoriyalar (${rooms.length} ta):</b>\n`;
    rooms.slice(0, 4).forEach((r) => {
      text += `• Xona <b>${escapeHtml(r.room_number)}</b> — ${escapeHtml(r.base_name)} (${escapeHtml(r.room_type)}, ${r.capacity} o'rin)\n`;
      if (r.department_name) text += `   🏛 Kafedra: ${escapeHtml(r.department_name)}\n`;
      if (r.notes) text += `   📝 Izoh: ${escapeHtml(r.notes)}\n`;
      if (ctx.chat?.type === 'private' && ctx.isAdmin && isAdminEditModeActive(ctx.from?.id)) {
        kb.text(`✏️ Xona ${r.room_number}`, `content_edit:room:${r.id}`).row();
      }
    });
    text += '\n';
  }

  // 4. Teachers
  if (teachers.length > 0) {
    text += `👨‍🏫 <b>O‘qituvchilar / Mudirlar (${teachers.length} ta):</b>\n`;
    teachers.slice(0, 3).forEach((t) => {
      text += `• <b>${escapeHtml(t.full_name)}</b> — ${escapeHtml(t.position || 'O\'qituvchi')}\n`;
      if (t.department_name) text += `   🏛 ${escapeHtml(t.department_name)}\n`;
      if (t.official_contact) text += `   📞 ${escapeHtml(t.official_contact)}\n`;
      if (t.source) text += `   🔗 Manba: ${escapeHtml(t.source)}\n`;
      if (ctx.chat?.type === 'private' && ctx.isAdmin && isAdminEditModeActive(ctx.from?.id)) {
        kb.text(`✏️ ${t.full_name.substring(0, 30)}`, `content_edit:teacher:${t.id}`).row();
      }
    });
    text += '\n';
  }

  // 5. Books
  if (books.length > 0) {
    text += `📚 <b>Elektron kitoblar (${books.length} ta):</b>\n`;
    books.slice(0, 3).forEach((b) => {
      text += `• <b>${escapeHtml(b.title)}</b> (${escapeHtml(b.author || 'FJSTI ARM')})\n   📥 <a href="${escapeHtml(b.file_url)}">Kitob havolasi</a>\n`;
      if (ctx.chat?.type === 'private' && ctx.isAdmin && isAdminEditModeActive(ctx.from?.id)) {
        kb.text(`✏️ ${b.title.substring(0, 30)}`, `content_edit:book:${b.id}`).row();
      }
    });
    text += '\n';
  }

  kb.text('🔍 Yangi qidiruv', 'search_prompt')
    .text('🏠 Asosiy menyu', 'menu_home');

  await ctx.reply(text, { parse_mode: 'HTML', reply_markup: kb, link_preview_options: { is_disabled: true } });
}
