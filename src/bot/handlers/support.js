import { InlineKeyboard } from 'grammy';
import { query } from '../../db/pool.js';
import { config } from '../../config/env.js';
import { getMainKeyboard, getCancelKeyboard } from '../keyboards/main.js';

const SUPPORT_MAX_LENGTH = 2500;
const ADMIN_REPLY_MAX_LENGTH = 3500;

// In-memory input mode; conversation records themselves are persisted in PostgreSQL.
const supportStates = new Map();

export function escapeSupportHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function sanitizeSupportMessage(rawValue, maxLength = SUPPORT_MAX_LENGTH) {
  if (typeof rawValue !== 'string') {
    throw new Error('Faqat matnli xabar yuboring.');
  }
  const value = rawValue.trim();
  if (!value) throw new Error('Xabar bo‘sh bo‘lmasligi kerak.');
  if (value.length > maxLength) {
    throw new Error(`Xabar ${maxLength} ta belgidan oshmasligi kerak.`);
  }
  return value;
}

function getUserName(user) {
  return [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || 'Talaba';
}

async function findOpenConversation(userId) {
  const result = await query(
    "SELECT * FROM support_conversations WHERE user_id = $1 AND status = 'open' ORDER BY id DESC LIMIT 1",
    [userId]
  );
  return result.rows[0] || null;
}

async function getConversation(conversationId) {
  const result = await query('SELECT * FROM support_conversations WHERE id = $1 LIMIT 1', [conversationId]);
  return result.rows[0] || null;
}

async function getOrCreateConversation(ctx) {
  const userId = ctx.from.id;
  const existing = await findOpenConversation(userId);
  if (existing) return { conversation: existing, created: false };

  const firstName = ctx.from.first_name || '';
  const lastName = ctx.from.last_name || null;
  const username = ctx.from.username || null;
  try {
    const inserted = await query(
      `INSERT INTO support_conversations (user_id, first_name, last_name, username)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, firstName, lastName, username]
    );
    return { conversation: inserted.rows[0], created: true };
  } catch (error) {
    // A second rapid message may race with the unique open-conversation index.
    if (error.code === '23505') {
      const conversation = await findOpenConversation(userId);
      if (conversation) return { conversation, created: false };
    }
    throw error;
  }
}

function supportKeyboard(conversationId) {
  return new InlineKeyboard()
    .text('↩️ Javob yozish', `support_reply:${conversationId}`)
    .text('✅ Suhbatni yopish', `support_close:${conversationId}`).row()
    .text('📂 Suhbatni ochish', `support_view:${conversationId}`);
}

async function getStudentDetails(conversation) {
  const result = await query(
    `SELECT u.course, u.group_name, f.name AS faculty_name
       FROM users u
       LEFT JOIN faculties f ON f.id = u.faculty_id
      WHERE u.id = $1 LIMIT 1`,
    [conversation.user_id]
  );
  return result.rows[0] || {};
}

function buildStudentProfile(conversation, details = {}) {
  const name = getUserName(conversation);
  const username = conversation.username ? '@' + conversation.username : 'username ko‘rsatilmagan';
  const lines = [
    '👤 <b>Talaba ma’lumotlari</b>',
    `Ism: ${escapeSupportHtml(name)}`,
    `Username: ${escapeSupportHtml(username)}`,
    `Telegram ID: <code>${conversation.user_id}</code>`
  ];
  if (details.faculty_name) lines.push(`Fakultet: ${escapeSupportHtml(details.faculty_name)}`);
  if (details.course) lines.push(`Kurs: ${escapeSupportHtml(details.course)}`);
  if (details.group_name) lines.push(`Guruh: ${escapeSupportHtml(details.group_name)}`);
  return lines.join('\n');
}

async function sendAdminNotification(ctx, conversation, messageText, isNew = false) {
  const allAdminIds = config.adminIds;
  if (!allAdminIds.length) return 0;

  const details = await getStudentDetails(conversation);
  const profile = buildStudentProfile(conversation, details);
  const title = isNew
    ? `🆘 <b>Yangi yordam so‘rovi #${conversation.id}</b>`
    : `💬 <b>Yordam suhbatida yangi xabar #${conversation.id}</b>`;
  const body = `${title}\n\n${profile}\n\n<b>Talaba xabari:</b>\n${escapeSupportHtml(messageText)}`;
  const preferred = conversation.assigned_admin_id
    ? [Number(conversation.assigned_admin_id)]
    : allAdminIds;
  let delivered = 0;

  for (const adminId of preferred) {
    try {
      await ctx.api.sendMessage(adminId, body, {
        parse_mode: 'HTML',
        reply_markup: supportKeyboard(conversation.id)
      });
      delivered++;
    } catch (error) {
      console.warn(`[SUPPORT] Admin notification failed for adminId=${adminId}: ${error.message}`);
    }
  }

  // If the assigned administrator cannot receive messages, release the assignment
  // and let another configured administrator pick up the request.
  if (!delivered && conversation.assigned_admin_id) {
    await query(
      'UPDATE support_conversations SET assigned_admin_id = NULL WHERE id = $1 AND status = \'open\'',
      [conversation.id]
    );
    for (const adminId of allAdminIds) {
      try {
        await ctx.api.sendMessage(adminId, body, {
          parse_mode: 'HTML',
          reply_markup: supportKeyboard(conversation.id)
        });
        delivered++;
      } catch (error) {
        console.warn(`[SUPPORT] Fallback notification failed for adminId=${adminId}: ${error.message}`);
      }
    }
  }

  return delivered;
}

export async function handleSupportPrompt(ctx) {
  const userId = ctx.from?.id;
  if (!userId) return;

  if (ctx.isAdmin) {
    await ctx.reply('Bu tugma talabalar uchun. Yangi murojaatlarni ⚙️ Admin boshqaruvi → 🆘 Yordam so‘rovlari bo‘limidan ko‘rishingiz mumkin.');
    return;
  }

  if (!config.adminIds.length) {
    await ctx.reply('Hozirda administratorlar sozlanmagan. Iltimos, keyinroq qayta urinib ko‘ring.');
    return;
  }

  try {
    const existing = await findOpenConversation(userId);
    supportStates.set(userId, { mode: 'user' });
    const text = existing
      ? `🆘 <b>Administrator bilan suhbatingiz ochiq (#${existing.id}).</b>\n\nXabaringizni yozing — bot uni administratorga yetkazadi. Suhbatni davom ettirish yoki undan chiqish uchun shu yerdan foydalanishingiz mumkin.\n\n🔒 Administrator siz haqingizdagi ma’lumotlarni (ism, username va Telegram ID) ko‘radi. Uning shaxsiy akkaunti va Telegram IDsi sizga ko‘rsatilmaydi.\n\nBekor qilish: /cancel`
      : '🆘 <b>Administratordan yordam so‘rash</b>\n\nSavolingiz yoki muammoingizni bitta xabar qilib yozing. Bot uni administratorlarga yetkazadi. Suhbat davomida javoblarni shu bot orqali olasiz.\n\n🔒 Administrator siz haqingizdagi ma’lumotlarni (ism, username va Telegram ID) ko‘radi. Administratorning shaxsiy akkaunti va Telegram IDsi sizga ko‘rsatilmaydi.\n\nXabarni yuboring. Bekor qilish: /cancel';
    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: getCancelKeyboard() });
  } catch (error) {
    console.error('[SUPPORT] Prompt failed:', error.message);
    await ctx.reply('Yordam bo‘limini ochishda xatolik yuz berdi. Iltimos, qayta urinib ko‘ring.');
  }
}

export async function handleAdminSupportInbox(ctx) {
  if (!ctx.isAdmin) {
    if (ctx.callbackQuery) await ctx.answerCallbackQuery('Bu bo‘lim faqat adminlar uchun.', { show_alert: true });
    return;
  }

  const result = await query(
    `SELECT id, user_id, first_name, last_name, username, updated_at
       FROM support_conversations
      WHERE status = 'open'
      ORDER BY updated_at DESC, id DESC
      LIMIT 15`
  );
  const keyboard = new InlineKeyboard();
  let text = '🆘 <b>Ochiq yordam so‘rovlari</b>\n\n';

  if (!result.rows.length) {
    text += 'Hozircha ochiq yordam so‘rovlari yo‘q.';
  } else {
    text += 'Ko‘rish yoki javob berish uchun suhbatni tanlang:\n';
    for (const row of result.rows) {
      const name = getUserName(row);
      text += `\n• #${row.id} — ${escapeSupportHtml(name)}`;
      keyboard.text(`#${row.id} · ${name.slice(0, 20)}`, `support_view:${row.id}`).row();
    }
  }
  keyboard.text('⬅️ Admin paneli', 'admin_panel');

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: keyboard });
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
  }
}

export async function handleSupportView(ctx, conversationId) {
  if (!ctx.isAdmin) {
    if (ctx.callbackQuery) await ctx.answerCallbackQuery('Bu bo‘lim faqat adminlar uchun.', { show_alert: true });
    return;
  }
  const conversation = await getConversation(conversationId);
  if (!conversation) {
    await ctx.answerCallbackQuery('Suhbat topilmadi.', { show_alert: true });
    return;
  }

  const details = await getStudentDetails(conversation);
  const messages = await query(
    `SELECT sender_role, message_text, created_at
       FROM support_messages
      WHERE conversation_id = $1
      ORDER BY created_at DESC, id DESC
      LIMIT 5`,
    [conversationId]
  );

  let text = `📂 <b>Yordam suhbati #${conversation.id}</b>\nHolat: ${conversation.status === 'open' ? '🟢 Ochiq' : '⚫ Yopilgan'}\n\n`;
  text += buildStudentProfile(conversation, details) + '\n\n<b>So‘nggi xabarlar:</b>\n';
  if (!messages.rows.length) {
    text += 'Hozircha xabar yo‘q.';
  } else {
    text += messages.rows.reverse().map((message) => {
      const role = message.sender_role === 'admin' ? '🛡 Administrator' : '👤 Talaba';
      const safeText = escapeSupportHtml(String(message.message_text).slice(0, 450));
      return `\n<b>${role}:</b> ${safeText}`;
    }).join('\n');
  }

  const keyboard = new InlineKeyboard();
  if (conversation.status === 'open') {
    keyboard.text('↩️ Javob yozish', `support_reply:${conversation.id}`)
      .text('✅ Suhbatni yopish', `support_close:${conversation.id}`).row();
  }
  keyboard.text('⬅️ Ochiq so‘rovlar', 'admin_support_inbox').text('⚙️ Admin paneli', 'admin_panel');

  await ctx.editMessageText(text.slice(0, 4000), { parse_mode: 'HTML', reply_markup: keyboard });
  await ctx.answerCallbackQuery();
}

export async function handleSupportReply(ctx, conversationId) {
  if (!ctx.isAdmin) {
    if (ctx.callbackQuery) await ctx.answerCallbackQuery('Bu amal faqat adminlar uchun.', { show_alert: true });
    return;
  }

  const conversation = await getConversation(conversationId);
  if (!conversation || conversation.status !== 'open') {
    await ctx.answerCallbackQuery('Bu suhbat yopilgan yoki topilmadi.', { show_alert: true });
    return;
  }
  if (conversation.assigned_admin_id && Number(conversation.assigned_admin_id) !== Number(ctx.from.id)) {
    await ctx.answerCallbackQuery('Bu suhbatga boshqa administrator javob berishni boshlagan.', { show_alert: true });
    return;
  }

  supportStates.set(ctx.from.id, { mode: 'admin_reply', conversationId: Number(conversationId) });
  await ctx.answerCallbackQuery();
  await ctx.reply(
    `↩️ <b>#${conversationId} suhbatiga javob yozish</b>\n\nYuboradigan matningizni yozing. Talaba javobni botdan oladi; sizning shaxsiy akkauntingiz ko‘rsatilmaydi.\n\nBekor qilish: /cancel`,
    { parse_mode: 'HTML', reply_markup: getCancelKeyboard() }
  );
}

export async function handleSupportClose(ctx, conversationId) {
  if (!ctx.isAdmin) {
    if (ctx.callbackQuery) await ctx.answerCallbackQuery('Bu amal faqat adminlar uchun.', { show_alert: true });
    return;
  }

  const result = await query(
    `UPDATE support_conversations
        SET status = 'closed', closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status = 'open'
      RETURNING user_id`,
    [conversationId]
  );
  if (!result.rowCount) {
    await ctx.answerCallbackQuery('Suhbat allaqachon yopilgan yoki topilmadi.', { show_alert: true });
    return;
  }

  for (const [userId, state] of supportStates.entries()) {
    if (state.mode === 'user' && Number(userId) === Number(result.rows[0].user_id)) {
      supportStates.delete(userId);
    }
    if (state.mode === 'admin_reply' && state.conversationId === Number(conversationId)) {
      supportStates.delete(userId);
    }
  }

  try {
    await ctx.api.sendMessage(
      result.rows[0].user_id,
      '✅ <b>Administrator yordam suhbatini yakunladi.</b> Yana yordam kerak bo‘lsa, «🆘 Administratordan yordam» tugmasini bosing.',
      { parse_mode: 'HTML', reply_markup: getMainKeyboard(result.rows[0].user_id) }
    );
  } catch (error) {
    console.warn('[SUPPORT] Could not notify user about closed conversation:', error.message);
  }

  await ctx.answerCallbackQuery('Suhbat yopildi.');
}

export function cancelSupportMode(ctx) {
  const userId = ctx.from?.id;
  if (!userId || !supportStates.has(userId)) return false;
  const state = supportStates.get(userId);
  supportStates.delete(userId);
  const message = state.mode === 'admin_reply'
    ? 'Javob yozish bekor qilindi. Suhbat o‘z holicha ochiq qoldi.'
    : 'Yordam yozish rejimidan chiqdingiz. Murojaatingiz bo‘lsa, «🆘 Administratordan yordam» tugmasi orqali davom ettiring.';
  void ctx.reply(message, { reply_markup: getMainKeyboard(userId) });
  return true;
}

export async function processSupportMessage(ctx) {
  const userId = ctx.from?.id;
  const state = userId ? supportStates.get(userId) : null;
  if (!state) return false;

  const rawText = ctx.message?.text;
  if (typeof rawText !== 'string') return false;

  if (rawText.trim() === '/cancel' || rawText.trim() === '❌ Bekor qilish') {
    cancelSupportMode(ctx);
    return true;
  }

  if (state.mode === 'admin_reply') {
    let messageText;
    try {
      messageText = sanitizeSupportMessage(rawText, ADMIN_REPLY_MAX_LENGTH);
    } catch (error) {
      await ctx.reply(error.message);
      return true;
    }

    const claim = await query(
      `UPDATE support_conversations
          SET assigned_admin_id = COALESCE(assigned_admin_id, $2), updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND status = 'open'
        RETURNING user_id, assigned_admin_id`,
      [state.conversationId, userId]
    );
    if (!claim.rowCount) {
      supportStates.delete(userId);
      await ctx.reply('Bu suhbat yopilgan yoki topilmadi. Javob yozish rejimi tugatildi.');
      return true;
    }
    if (Number(claim.rows[0].assigned_admin_id) !== Number(userId)) {
      supportStates.delete(userId);
      await ctx.reply('Bu suhbatga boshqa administrator javob berishni boshlagan.');
      return true;
    }

    try {
      await ctx.api.sendMessage(
        claim.rows[0].user_id,
        `📩 <b>Administrator javobi:</b>\n\n${escapeSupportHtml(messageText)}`,
        { parse_mode: 'HTML' }
      );
      await query(
        `INSERT INTO support_messages (conversation_id, sender_role, sender_id, message_text)
         VALUES ($1, 'admin', $2, $3)`,
        [state.conversationId, userId, messageText]
      );
      await query(
        'UPDATE support_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [state.conversationId]
      );
      await ctx.reply('✅ Javob talabaga bot orqali yuborildi. Talabaning javobi shu yerda davom etadi.');
    } catch (error) {
      console.error('[SUPPORT] Failed to deliver administrator reply:', error.message);
      await ctx.reply('⚠️ Xabarni talabaga yetkazib bo‘lmadi. Talaba botni bloklamaganini tekshiring va qayta urinib ko‘ring.');
    }
    return true;
  }

  if (state.mode === 'user') {
    let messageText;
    try {
      messageText = sanitizeSupportMessage(rawText);
    } catch (error) {
      await ctx.reply(error.message);
      return true;
    }

    if (!config.adminIds.length) {
      supportStates.delete(userId);
      await ctx.reply('Administratorlar sozlanmagan. Keyinroq qayta urinib ko‘ring.');
      return true;
    }

    try {
      const { conversation } = await getOrCreateConversation(ctx);
      await query(
        `INSERT INTO support_messages (conversation_id, sender_role, sender_id, message_text)
         VALUES ($1, 'user', $2, $3)`,
        [conversation.id, userId, messageText]
      );
      const delivered = await sendAdminNotification(ctx, conversation, messageText, true);
      if (delivered > 0) {
        await ctx.reply(
          '✅ <b>Xabaringiz administratorga yetkazildi.</b>\n\nJavob shu bot orqali keladi. Administratorning shaxsiy akkaunti sizga ko‘rsatilmaydi. Suhbatni davom ettirish uchun shu oynaga yozing.',
          { parse_mode: 'HTML' }
        );
      } else {
        await ctx.reply(
          '⚠️ Xabaringiz saqlandi, lekin administratorlarga bildirishnoma yetkazilmadi. Administratorlar botni kamida bir marta ochib /start bosgan bo‘lishi kerak. Keyinroq qayta xabar yuboring.',
          { parse_mode: 'HTML' }
        );
      }
    } catch (error) {
      console.error('[SUPPORT] Failed to process student message:', error.message);
      await ctx.reply('Yordam xabarini yuborishda xatolik yuz berdi. Iltimos, qayta urinib ko‘ring.');
    }
    return true;
  }

  return false;
}
