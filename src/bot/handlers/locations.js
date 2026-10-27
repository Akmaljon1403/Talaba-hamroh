import { InlineKeyboard } from 'grammy';
import { getAllClinicalBases, getClinicalBaseById, searchLocations } from '../../db/queries/locations.js';
import { searchRooms } from '../../db/queries/rooms.js';
import { formatClinicalBaseCard, escapeHtml } from '../utils/formatters.js';
import { recordSectionClick } from '../../db/queries/stats.js';
import { isAdminEditModeActive } from '../utils/adminEditMode.js';

const BASES_PER_PAGE = 6;

export async function handleLocations(ctx) {
  recordSectionClick('locations_main');

  const text = `📍 <b>Manzil va O‘quv Auditoriyalari Fondi</b>\n\n` +
    `Farg‘ona jamoat salomatligi tibbiyot institutiga biriktirilgan <b>28 ta klinik baza</b> va <b>120 dan ortiq auditoriyalar</b> mavjud.\n\n` +
    `Bu yerda siz:\n` +
    `• Klinik bazalar va ularga biriktirilgan kafedralar ro‘yxatini ko‘rishingiz;\n` +
    `• Kafedra mudiri va mas'ul telefon raqamlarini bilishingiz;\n` +
    `• Auditoriyalar sig‘imi va turini (amaliy/ma'ruza) tekshirishingiz mumkin.\n\n` +
    `<i>Baza ro‘yxatini ko‘rish yoki xona qidirishni tanlang:</i>`;

  const kb = new InlineKeyboard()
    .text('🏥 Klinik bazalar ro‘yxati', 'bases:page:1').row()
    .text('🚪 Xona raqami bo‘yicha qidirish', 'search_room_prompt').row()
    .text('🏠 Asosiy menyu', 'menu_home');

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: kb });
  }
}

export async function handleBasesPagination(ctx, page = 1) {
  const bases = await getAllClinicalBases();
  const totalPages = Math.ceil(bases.length / BASES_PER_PAGE);
  const currentPage = Math.max(1, Math.min(page, totalPages));

  const startIdx = (currentPage - 1) * BASES_PER_PAGE;
  const currentBases = bases.slice(startIdx, startIdx + BASES_PER_PAGE);

  const text = `🏥 <b>Klinik bazalar ro‘yxati (${currentPage}/${totalPages}-sahifa):</b>\n\n` +
    `Batafsil ma'lumot va xonalarini ko‘rish uchun kerakli klinika ustiga bosing:`;

  const kb = new InlineKeyboard();
  currentBases.forEach((b) => {
    const shortName = b.name.length > 38 ? b.name.substring(0, 35) + '...' : b.name;
    kb.text(`🏥 ${shortName}`, `base_detail:${b.id}`);
    if (ctx.chat?.type === 'private' && ctx.isAdmin && isAdminEditModeActive(ctx.from?.id)) {
      kb.text('✏️ Tahrirlash', `content_edit:base:${b.id}`);
    }
    kb.row();
  });

  // Pagination navigation row
  const navRow = [];
  if (currentPage > 1) {
    navRow.push({ text: '⬅️ Oldingi', callback_data: `bases:page:${currentPage - 1}` });
  }
  navRow.push({ text: `📄 ${currentPage}/${totalPages}`, callback_data: 'noop' });
  if (currentPage < totalPages) {
    navRow.push({ text: 'Keyingi ➡️', callback_data: `bases:page:${currentPage + 1}` });
  }
  kb.row(...navRow);

  kb.row()
    .text('⬅️ Orqaga', 'locations_main')
    .text('🏠 Asosiy menyu', 'menu_home');

  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
  await ctx.answerCallbackQuery();
}

export async function handleBaseDetail(ctx, baseId) {
  const base = await getClinicalBaseById(baseId);
  if (!base) {
    await ctx.answerCallbackQuery('Klinik baza topilmadi.');
    return;
  }

  const text = formatClinicalBaseCard(base);
  const kb = new InlineKeyboard();
  if (ctx.chat?.type === 'private' && ctx.isAdmin && isAdminEditModeActive(ctx.from?.id)) {
    kb.text('✏️ Klinik bazani tahrirlash', `content_edit:base:${base.id}`).row();
  }
  kb.text('⬅️ Bazalar ro‘yxatiga', 'bases:page:1')
    .text('🏠 Asosiy menyu', 'menu_home');

  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
  await ctx.answerCallbackQuery();
}
