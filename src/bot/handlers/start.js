import { getMainKeyboard } from '../keyboards/main.js';
import { recordSectionClick } from '../../db/queries/stats.js';
import { adminActionStates, contentEditStates } from '../state/adminState.js';
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
  const updateId = ctx.update.update_id;
  console.info(`[HANDLER ENTER] /start update_id=${updateId}`);

  try {
    const text = buildStartMessage(ctx.from?.first_name);
    console.info(`[START STAGE] message_built update_id=${updateId}`);

    // Analytics is non-critical: failures must not prevent the welcome message.
    void recordSectionClick('start');

    const keyboard = getMainKeyboard(ctx.from?.id);
    console.info(`[START STAGE] keyboard_built update_id=${updateId}`);

    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    console.info(`[START SUCCESS] welcome_sent update_id=${updateId}`);
  } catch (error) {
    console.error(`[START FAILURE] update_id=${updateId} stage=welcome_reply message=${error?.description || error?.message || error}`);
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

export async function handleMyId(ctx) {
  if (ctx.chat?.type !== 'private') {
    await ctx.reply('Telegram ID raqamingizni olish uchun botning shaxsiy chatida /myid yuboring.');
    return;
  }
  const id = ctx.from?.id;
  if (!id) {
    await ctx.reply('Telegram ID aniqlanmadi.');
    return;
  }
  await ctx.reply(`🪪 Sizning Telegram ID raqamingiz: <code>${id}</code>\n\nAdmin huquqi kerak bo‘lsa, ushbu raqamni bot superadminiga yuboring.`, {
    parse_mode: 'HTML'
  });
}

export async function handleCancel(ctx) {
  if (ctx.from?.id) {
    adminActionStates.delete(ctx.from.id);
    contentEditStates.delete(ctx.from.id);
  }
  await ctx.reply('Amal bekor qilindi. Asosiy menyudasiz.', {
    reply_markup: getMainKeyboard(ctx.from?.id)
  });
}
