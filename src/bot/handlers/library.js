import { InlineKeyboard } from 'grammy';
import { getBooksByCourse, searchBooks } from '../../db/queries/books.js';
import { formatBookCard, escapeHtml } from '../utils/formatters.js';
import { isAdminEditModeActive } from '../utils/adminEditMode.js';
import { recordSectionClick } from '../../db/queries/stats.js';

export async function handleLibrary(ctx) {
  recordSectionClick('library_main');

  const text = `📚 <b>FJSTI Axborot-Resurs Markazi (ARM) va Elektron Kutubxona</b>\n\n` +
    `Institut talabalari uchun darsliklar, o‘quv qo‘llanmalar va xalqaro tibbiy adabiyotlar bazasi.\n\n` +
    `• <b>Rasmiy ARM portali:</b> https://library.fjsti.uz\n` +
    `• <b>Elektron fond:</b> http://e-library.fjsti.uz\n\n` +
    `<i>Kitoblarni kurs bo‘yicha ko‘rish yoki qidirish uchun tanlang:</i>`;

  const kb = new InlineKeyboard()
    .text('1-kurs kitoblari', 'lib_course:1').text('2-kurs kitoblari', 'lib_course:2').row()
    .text('3-kurs kitoblari', 'lib_course:3').text('4-kurs kitoblari', 'lib_course:4').row()
    .text('5-kurs kitoblari', 'lib_course:5').text('6-kurs kitoblari', 'lib_course:6').row()
    .text('🔍 Kitob nomini qidirish', 'search_book_prompt').row()
    .text('🌐 ARM Portaliga o‘tish', 'about_links').row()
    .text('🏠 Asosiy menyu', 'menu_home');

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb, link_preview_options: { is_disabled: true } });
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: kb, link_preview_options: { is_disabled: true } });
  }
}

export async function handleLibraryCourse(ctx, course) {
  const books = await getBooksByCourse(course);
  if (!books || books.length === 0) {
    const text = `📚 <b>${course}-kurs kitoblari:</b>\n\nHozircha ushbu kurs uchun botga yuklangan kitoblar ro‘yxati yangilanmoqda. Rasmiy portal orqali to‘liq fonddan foydalanishingiz mumkin: https://library.fjsti.uz`;
    const kb = new InlineKeyboard()
      .text('⬅️ Orqaga', 'library_main')
      .text('🏠 Asosiy menyu', 'menu_home');
    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb, link_preview_options: { is_disabled: true } });
    await ctx.answerCallbackQuery();
    return;
  }

  let text = `📚 <b>${course}-kurs bo‘yicha mavjud adabiyotlar:</b>\n\n`;
  const kb = new InlineKeyboard();

  const editMode = Boolean(ctx.chat?.type === 'private' && ctx.isAdmin && isAdminEditModeActive(ctx.from?.id));
  books.forEach((b, idx) => {
    text += `${idx + 1}. <b>${escapeHtml(b.title)}</b> (${escapeHtml(b.author || 'FJSTI ARM')})\n   📥 <a href="${escapeHtml(b.file_url)}">Elektron nusxa</a>\n\n`;
    if (b.subject_name) text += `   📚 Fan: ${escapeHtml(b.subject_name)}\n`;
    if (b.course) text += `   🎓 Kurs: ${b.course}-kurs\n`;
    if (b.source) text += `   🔗 Manba: ${escapeHtml(b.source)}\n`;

    if (editMode) kb.text(`✏️ ${b.title.substring(0, 30)}`, `content_edit:book:${b.id}`).row();
  });

  kb.text('⬅️ Kursni almashtirish', 'library_main')
    .text('🏠 Asosiy menyu', 'menu_home');

  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb, link_preview_options: { is_disabled: true } });
  await ctx.answerCallbackQuery();
}
