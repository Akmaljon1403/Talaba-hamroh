import { GrammyError, HttpError } from 'grammy';

export function errorHandler(err) {
  const ctx = err.ctx;
  const e = err.error;

  console.error(`[BOT ERROR] Update ID: ${ctx.update.update_id}:`);

  if (e instanceof GrammyError) {
    console.error('[BOT ERROR] Telegram API javob xatosi:', e.description);
  } else if (e instanceof HttpError) {
    console.error('[BOT ERROR] Tarmoq so\'rovi xatosi:', e.message);
  } else {
    console.error('[BOT ERROR] Kutilmagan dastur xatosi:', e?.message || e);
  }

  // Safe user notification
  try {
    ctx.reply(
      '⚠️ Kechirasiz, tizimda vaqtinchalik xatolik yuz berdi.\n\nIltimos, qayta urinib ko‘ring yoki /start buyrug‘ini bosing.'
    ).catch(() => {});
  } catch (replyErr) {
    // Ignore secondary reply failure
  }
}
