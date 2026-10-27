import { InlineKeyboard } from 'grammy';
import { getAllServices, getServiceByCategory } from '../../db/queries/studentServices.js';
import { recordSectionClick } from '../../db/queries/stats.js';
import { isAdminEditModeActive } from '../utils/adminEditMode.js';
import { escapeHtml } from '../utils/formatters.js';

export async function handleServices(ctx) {
  recordSectionClick('services_main');

  const text = `💡 <b>Talabalar uchun Rasmiy Xizmatlar va Yo‘riqnomalar</b>\n\n` +
    `Institut talabalarining o‘qish, hujjatlar, to‘lovlar va ijtimoiy xizmatlar bo‘yicha eng ko‘p beriladigan savollariga rasmiy javoblar:\n\n` +
    `<i>Kerakli xizmat turini tanlang:</i>`;

  const kb = new InlineKeyboard()
    .text('📱 HEMIS tizimi', 'service_detail:hemis').text('🎓 Kredit-modul va GPA', 'service_detail:kredit_modul').row()
    .text('📄 Kontrakt va to‘lov', 'service_detail:kontrakt').text('💰 Stipendiyalar', 'service_detail:stipendiya').row()
    .text('🏢 Yotoqxona (TTJ)', 'service_detail:yotoqxona').text('📑 Ma’lumotnoma (Spravka)', 'service_detail:spravka').row()
    .text('🏠 Asosiy menyu', 'menu_home');

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: kb });
  }
}

export async function handleServiceDetail(ctx, category) {
  const service = await getServiceByCategory(category);
  if (!service) {
    await ctx.answerCallbackQuery('Xizmat ma\'lumoti topilmadi.');
    return;
  }

  recordSectionClick(`service_${category}`);

  let text = `📌 <b>${escapeHtml(service.title)}</b>\n\n` +
    `${escapeHtml(service.content)}\n\n`;

  if (service.source_url) {
    text += `🔗 <b>Rasmiy havola:</b> <a href="${escapeHtml(service.source_url)}">${escapeHtml(service.source_url)}</a>\n`;
  }
  text += `🕒 <i>Oxirgi yangilanish: ${new Date(service.updated_at).toLocaleDateString('uz-UZ')}</i>`;

  const kb = new InlineKeyboard()
    .text('⬅️ Barcha xizmatlar', 'services_main')
    .text('🏠 Asosiy menyu', 'menu_home');

  if (ctx.isAdmin && isAdminEditModeActive(ctx.from?.id)) {
    kb.row().text('✏️ Xizmat matnini tahrirlash', `admin_edit:service:${service.id}`);
  }

  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb, link_preview_options: { is_disabled: true } });
  await ctx.answerCallbackQuery();
}
