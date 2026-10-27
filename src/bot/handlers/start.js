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
  const updateId = ctx.update?.update_id ?? 'unknown';
  const startedAt = Date.now();
  let stage = 'message_build';

  console.info(`[START] entered update_id=${updateId}`);

  try {
    const text = buildStartMessage(ctx.from?.first_name);
    console.info(`[START] message_built update_id=${updateId} chars=${text.length}`);

    // Analytics is non-critical: do not await it or let it block the welcome message.
    void recordSectionClick('start');

    stage = 'keyboard_build';
    const keyboard = getMainKeyboard(ctx.from?.id);
    console.info(`[START] keyboard_built update_id=${updateId}`);

    stage = 'send_message';
    console.info(`[START] send_begin update_id=${updateId}`);
    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });

    console.info(`[START] send_success update_id=${updateId} elapsed_ms=${Date.now() - startedAt}`);
  } catch (error) {
    console.error(
      `[START] failed update_id=${updateId} stage=${stage} elapsed_ms=${Date.now() - startedAt} error=${error?.description || error?.message || String(error)}`
    );
    throw error;
  }
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
