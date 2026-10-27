import { getMainKeyboard } from '../keyboards/main.js';
import { recordSectionClick } from '../../db/queries/stats.js';
import { escapeHtml } from '../utils/formatters.js';

export function buildStartMessage(userName) {
  const safeUserName = escapeHtml(userName || 'Talaba');
  return `Assalomu alaykum, <b>${safeUserName}</b>!\n\n` +
    `🏛 <b>Farg‘ona jamoat salomatligi tibbiyot instituti (FJSTI)</b> talaba hamrohi botiga xush kelibsiz!\n\n` +
    `Ushbu bot orqali institut haqida tekshirilgan va rasmiy ma’lumotlarni tezda topishingiz mumkin:\n\n` +
    `• 🏛 <b>Institut haqida:</b> Rektorat, fakultetlar va rasmiy manbalar\n` +
    `• 📍 <b>Manzil va xonalar:</b> 28 ta klinik baza va 120+ auditoriyalar fondi\n` +
    `• 👨‍🏫 <b>O‘qituvchilar:</b> Kafedralar, mudirlar va fanlar biriktiruvi\n` +
    `• 📚 <b>Elektron kutubxona:</b> Darsliklar va ARM elektron resurslari\n` +
    `• 📅 <b>O‘quv jadvali:</b> 1-6 kurslar uchun o‘quv jarayoni grafigi\n` +
    `• 💡 <b>Talaba xizmatlari:</b> HEMIS, stipendiya, kontrakt, yotoqxona va spravka\n` +
    `• 🔍 <b>Qidiruv:</b> Istalgan fan, o‘qituvchi yoki xonani darhol izlash\n\n` +
    `<i>Kerakli bo‘limni tanlang:</i>`;
}

export async function handleStart(ctx) {
  console.info(`[HANDLER ENTER] /start update_id=${ctx.update.update_id}`);
  const text = buildStartMessage(ctx.from?.first_name);

  // Analytics is non-critical: failures must not prevent the welcome message.
  void recordSectionClick('start');
  await ctx.reply(text, {
    parse_mode: 'HTML',
    reply_markup: getMainKeyboard(ctx.from?.id)
  });
}

export async function handleHelp(ctx) {
  const text = `ℹ️ <b>FJSTI Talaba Hamrohi — Yordam</b>\n\n` +
    `Botdan foydalanish bo‘yicha qo‘llanma:\n\n` +
    `1. <b>Bo‘limlar:</b> Quyidagi menyu tugmalari orqali kerakli bo‘limni tanlang.\n` +
    `2. <b>Qidiruv:</b> «🔍 Qidiruv» tugmasini bosing yoki istalgan fan, auditoriya raqami yoki kafedra nomini botga yozib yuboring.\n` +
    `3. <b>Bekor qilish:</b> Qidiruv yoki fikr yuborish rejimida bo‘lsangiz, «❌ Bekor qilish» tugmasi yoki /cancel buyrug‘idan foydalaning.\n` +
    `4. <b>Rasmiy manbalar:</b>\n` +
    `   • Veb-sayt: https://fjsti.uz\n` +
    `   • HEMIS axborot tizimi: https://hemis.fjsti.uz\n` +
    `   • Elektron kutubxona: https://library.fjsti.uz\n` +
    `   • Rasmiy Telegram: @fjsti_uz\n\n` +
    `Savol va takliflaringiz bo‘lsa, «✍️ Fikr bildirish» bo‘limi orqali yozishingiz mumkin.`;

  recordSectionClick('help');
  await ctx.reply(text, {
    parse_mode: 'HTML',
    reply_markup: getMainKeyboard(ctx.from?.id),
    link_preview_options: { is_disabled: true }
  });
}

export async function handleCancel(ctx) {
  await ctx.reply('Amal bekor qilindi. Asosiy menyudasiz.', {
    reply_markup: getMainKeyboard(ctx.from?.id)
  });
}
