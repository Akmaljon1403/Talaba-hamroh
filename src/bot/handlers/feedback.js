import { getCancelKeyboard, getMainKeyboard } from '../keyboards/main.js';
import { saveFeedback } from '../../db/queries/feedback.js';
import { recordSectionClick } from '../../db/queries/stats.js';

// Simple user feedback state map
export const feedbackStates = new Set();

export async function handleFeedbackPrompt(ctx) {
  recordSectionClick('feedback_prompt');
  
  if (ctx.from) {
    feedbackStates.add(ctx.from.id);
  }

  const text = `✍️ <b>Fikr va Takliflar Bildirish</b>\n\n` +
    `Hurmatli talaba! Institut ta'lim sifati, o‘quv jarayoni yoki ushbu Telegram bot haqida o‘z fikr, mulohaza va takliflaringizni yozib qoldirishingiz mumkin.\n\n` +
    `<i>Xabaringizni yozib yuboring (bekor qilish uchun «❌ Bekor qilish» tugmasini bosing):</i>`;

  await ctx.reply(text, {
    parse_mode: 'HTML',
    reply_markup: getCancelKeyboard()
  });
}

export async function processFeedbackMessage(ctx) {
  const userId = ctx.from?.id;
  const messageText = ctx.message?.text;

  if (!userId || !messageText) return false;

  if (messageText === '❌ Bekor qilish' || messageText === '/cancel') {
    feedbackStates.delete(userId);
    await ctx.reply('Fikr bildirish bekor qilindi.', {
      reply_markup: getMainKeyboard(userId)
    });
    return true;
  }

  if (messageText.length < 5) {
    await ctx.reply('⚠️ Iltimos, fikringizni batafsilroq yozing (kamida 5 ta belgi).');
    return true;
  }

  const userName = [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(' ') || ctx.from.username || 'Talaba';

  try {
    await saveFeedback({
      userId,
      userName,
      message: messageText
    });

    feedbackStates.delete(userId);

    await ctx.reply(
      '✅ <b>Rahmat! Fikringiz qabul qilindi.</b>\n\nSizning taklifingiz institut mas\'ullariga va bot administratorlariga yetkaziladi.',
      {
        parse_mode: 'HTML',
        reply_markup: getMainKeyboard(userId)
      }
    );
    return true;
  } catch (error) {
    console.error('[FEEDBACK ERROR]:', error.message);
    await ctx.reply('Fikrni saqlashda xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko‘ring.', {
      reply_markup: getMainKeyboard(userId)
    });
    feedbackStates.delete(userId);
    return true;
  }
}
