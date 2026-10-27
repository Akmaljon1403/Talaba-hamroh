import { InlineKeyboard } from 'grammy';
import { getAdminKeyboard } from '../keyboards/admin.js';
import { getDashboardStats } from '../../db/queries/stats.js';
import { getUnansweredQuestions, resolveUnansweredQuestion } from '../../db/queries/unanswered.js';
import { getRecentFeedback, markFeedbackReviewed } from '../../db/queries/feedback.js';
import { getAllUserIds } from '../../db/queries/users.js';
import { createAnnouncement } from '../../db/queries/announcements.js';
import { addBook } from '../../db/queries/books.js';
import { addTeacher } from '../../db/queries/teachers.js';
import { getAllDepartments } from '../../db/queries/departments.js';
import { escapeHtml } from '../utils/formatters.js';
import { isAdminEditModeActive } from '../utils/adminEditMode.js';
import { getAllAdmins, getAdminByTelegramId, createAdmin, deleteAdmin, countSuperAdmins, logAdminChange } from '../../db/queries/admins.js';

export const adminActionStates = new Map();
const pendingAdminMutations = new Map();

export async function handleAdminPanel(ctx) {
  if (ctx.chat?.type !== 'private') {
    if (ctx.callbackQuery) await ctx.answerCallbackQuery('Admin paneldan bot bilan shaxsiy chatda foydalaning.');
    else await ctx.reply('🔒 Xavfsizlik uchun admin paneldan bot bilan shaxsiy chatda foydalaning.');
    return;
  }
  if (!ctx.isAdmin) {
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery('Sizda admin ruxsati yo‘q.');
    } else {
      await ctx.reply('⛔️ Ushbu bo‘lim faqat bot administratorlari uchun mo‘ljallangan.');
    }
    return;
  }

  const text = `⚙️ <b>Bot Ma'muriyati Boshqaruv Paneli</b>\n\n` +
    `Farg‘ona jamoat salomatligi tibbiyot instituti «Talaba Hamrohi» botining ichki boshqaruv xizmatiga xush kelibsiz.\n\n` +
    `<i>Quyidagi amallardan birini tanlang:</i>`;

  const kb = getAdminKeyboard({
    isSuperAdmin: Boolean(ctx.isSuperAdmin),
    editModeActive: isAdminEditModeActive(ctx.from?.id)
  });

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: kb });
  }
}

export async function handleAdminAddAdminPrompt(ctx) {
  if (ctx.chat?.type !== 'private') {
    await ctx.answerCallbackQuery('Admin boshqaruvi faqat shaxsiy chatda ishlaydi.');
    return;
  }

  if (!ctx.isSuperAdmin) {
    await ctx.answerCallbackQuery('Yangi admin qo‘shish faqat superadmin uchun.');
    return;
  }

  adminActionStates.set(ctx.from.id, { action: 'add_admin_input', createdAt: Date.now() });
  const text = `➕ <b>Yangi admin qo‘shish</b>\n\n` +
    `Yangi adminning Telegram ID raqamini yuboring. Ixtiyoriy ravishda ismni ham qo‘shishingiz mumkin:\n` +
    `<code>123456789 | Akmaljon Bahodirov</code>\n\n` +
    `Faqat Telegram ID ham yetarli. Davom etishdan oldin alohida tasdiqlash so‘raladi. Bekor qilish: /cancel.`;
  const kb = new InlineKeyboard().text('❌ Bekor qilish', 'admin_cancel_admin_change');
  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
  await ctx.answerCallbackQuery();
}

export async function handleAdminManageAdmins(ctx) {
  if (ctx.chat?.type !== 'private') {
    await ctx.answerCallbackQuery('Admin boshqaruvi faqat shaxsiy chatda ishlaydi.');
    return;
  }

  if (!ctx.isSuperAdmin) {
    await ctx.answerCallbackQuery('Adminlarni boshqarish faqat superadmin uchun.');
    return;
  }

  const admins = await getAllAdmins();
  const kb = new InlineKeyboard();
  let text = `👥 <b>Adminlar ro‘yxati</b> (${admins.length} ta)\n\n`;
  admins.forEach((admin, index) => {
    const roleLabel = admin.role === 'superadmin' ? 'Superadmin' : 'Admin';
    text += `${index + 1}. <b>${escapeHtml(admin.full_name || 'Ismi ko‘rsatilmagan')}</b>\n   🆔 <code>${admin.telegram_id}</code>\n   🛡 ${roleLabel}\n\n`;
    if (admin.role !== 'superadmin' && String(admin.telegram_id) !== String(ctx.from.id)) {
      kb.text(`🗑 O‘chirish #${String(admin.telegram_id).slice(-6)}`, `admin_remove_admin:${admin.telegram_id}`).row();
    }
  });

  text += `<i>Superadmin huquqini bot ichidan olib tashlab bo‘lmaydi. Oddiy adminlar kontentni tahrirlashi mumkin, ammo boshqa admin tayinlay olmaydi.</i>`;
  kb.text('⬅️ Admin panel', 'admin_panel').text('🏠 Menyu', 'menu_home');
  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
  await ctx.answerCallbackQuery();
}

export async function handleAdminRequestRemove(ctx, targetTelegramId) {
  if (ctx.chat?.type !== 'private') {
    await ctx.answerCallbackQuery('Admin boshqaruvi faqat shaxsiy chatda ishlaydi.');
    return;
  }

  if (!ctx.isSuperAdmin) {
    await ctx.answerCallbackQuery('Bu amal faqat superadmin uchun.');
    return;
  }
  if (String(targetTelegramId) === String(ctx.from.id)) {
    await ctx.answerCallbackQuery('O‘zingizni bu tugma orqali o‘chira olmaysiz.');
    return;
  }

  const target = await getAdminByTelegramId(targetTelegramId);
  if (!target) {
    await ctx.answerCallbackQuery('Bu admin ro‘yxatda topilmadi.');
    return;
  }
  if (target.role === 'superadmin') {
    await ctx.answerCallbackQuery('Superadminni bu yerdan olib tashlab bo‘lmaydi.');
    return;
  }

  pendingAdminMutations.set(ctx.from.id, {
    action: 'remove',
    targetTelegramId: String(targetTelegramId),
    targetName: target.full_name || 'Admin',
    createdAt: Date.now()
  });

  const kb = new InlineKeyboard()
    .text('✅ Ha, adminni o‘chirish', 'admin_confirm_admin_change')
    .text('❌ Bekor qilish', 'admin_cancel_admin_change');
  await ctx.editMessageText(
    `⚠️ <b>Admin huquqini olib tashlash</b>\n\n${escapeHtml(target.full_name || 'Admin')} (<code>${escapeHtml(targetTelegramId)}</code>) endi botning admin funksiyalaridan foydalana olmaydi. Davom etasizmi?`,
    { parse_mode: 'HTML', reply_markup: kb }
  );
  await ctx.answerCallbackQuery();
}

async function showAdminMutationResult(ctx, message, alertText) {
  const kb = new InlineKeyboard()
    .text('👥 Adminlar', 'admin_manage_admins')
    .text('⚙️ Admin panel', 'admin_panel');
  await ctx.editMessageText(message, { parse_mode: 'HTML', reply_markup: kb });
  await ctx.answerCallbackQuery(alertText);
}

export async function handleAdminConfirmMutation(ctx) {
  if (ctx.chat?.type !== 'private') {
    await ctx.answerCallbackQuery('Admin boshqaruvi faqat shaxsiy chatda ishlaydi.');
    return;
  }

  if (!ctx.isSuperAdmin) {
    await ctx.answerCallbackQuery('Bu amal faqat superadmin uchun.');
    return;
  }

  const pending = pendingAdminMutations.get(ctx.from.id);
  if (!pending || Date.now() - pending.createdAt > 5 * 60 * 1000) {
    pendingAdminMutations.delete(ctx.from.id);
    await ctx.answerCallbackQuery('Tasdiqlash muddati tugagan. Amalni qaytadan boshlang.');
    return;
  }

  if (pending.action === 'add') {
    const existing = await getAdminByTelegramId(pending.targetTelegramId);
    if (existing) {
      pendingAdminMutations.delete(ctx.from.id);
      await showAdminMutationResult(ctx, 'ℹ️ Bu Telegram ID allaqachon adminlar ro‘yxatida.', 'Bu ID allaqachon admin.');
      return;
    }

    const created = await createAdmin({
      telegramId: pending.targetTelegramId,
      fullName: pending.targetName,
      createdBy: ctx.from.id
    });
    if (!created) {
      pendingAdminMutations.delete(ctx.from.id);
      await showAdminMutationResult(ctx, '⚠️ Admin qo‘shilmadi. ID avval ro‘yxatga olingan bo‘lishi mumkin.', 'Admin qo‘shilmadi.');
      return;
    }

    await logAdminChange({ actorTelegramId: ctx.from.id, targetTelegramId: pending.targetTelegramId, action: 'add' });
    pendingAdminMutations.delete(ctx.from.id);
    await showAdminMutationResult(
      ctx,
      `✅ <b>Yangi admin qo‘shildi.</b>\n\nIsm: <b>${escapeHtml(created.full_name || pending.targetName)}</b>\nTelegram ID: <code>${escapeHtml(pending.targetTelegramId)}</code>\n\nAdmin huquqi bazada saqlandi va botni qayta ishga tushirganda ham yo‘qolmaydi.`,
      'Yangi admin muvaffaqiyatli qo‘shildi.'
    );
    return;
  }

  if (pending.action === 'remove') {
    const target = await getAdminByTelegramId(pending.targetTelegramId);
    if (!target || target.role === 'superadmin' || String(target.telegram_id) === String(ctx.from.id)) {
      pendingAdminMutations.delete(ctx.from.id);
      await showAdminMutationResult(ctx, '⚠️ Adminni o‘chirish xavfsizlik qoidalari sababli bajarilmadi.', 'Admin o‘chirilmadi.');
      return;
    }
    if (await countSuperAdmins() < 1) {
      pendingAdminMutations.delete(ctx.from.id);
      await ctx.answerCallbackQuery('Kamida bitta superadmin qolishi shart.');
      return;
    }

    const deleted = await deleteAdmin(pending.targetTelegramId);
    if (deleted) {
      await logAdminChange({ actorTelegramId: ctx.from.id, targetTelegramId: pending.targetTelegramId, action: 'remove' });
    }
    pendingAdminMutations.delete(ctx.from.id);
    await showAdminMutationResult(
      ctx,
      deleted
        ? `✅ <b>Admin huquqi olib tashlandi.</b>\n\n<code>${escapeHtml(pending.targetTelegramId)}</code> endi botning admin funksiyalaridan foydalana olmaydi.`
        : '⚠️ Admin o‘chirilmadi. Ro‘yxatni yangilab tekshiring.',
      deleted ? 'Admin huquqi olib tashlandi.' : 'Admin o‘chirilmadi.'
    );
  }
}

export async function handleAdminCancelMutation(ctx) {
  pendingAdminMutations.delete(ctx.from?.id);
  adminActionStates.delete(ctx.from?.id);
  const kb = new InlineKeyboard()
    .text('👥 Adminlar', 'admin_manage_admins')
    .text('⚙️ Admin panel', 'admin_panel');
  await ctx.editMessageText('Amal bekor qilindi. Adminlar ro‘yxati yoki panelga qaytishingiz mumkin.', {
    reply_markup: kb
  });
  await ctx.answerCallbackQuery('Amal bekor qilindi.');
}

export async function handleAdminStats(ctx) {
  if (!ctx.isAdmin) return;

  const stats = await getDashboardStats();

  let text = `📊 <b>Institut Boti Statistikasi:</b>\n\n` +
    `👥 Jami ro‘yxatdan o‘tgan talabalar: <b>${stats.totalUsers}</b> nafar\n` +
    `⚡️ So‘nggi 7 kunda faol talabalar: <b>${stats.activeUsers7Days}</b> nafar\n` +
    `🔍 Jami amalga oshirilgan qidiruvlar: <b>${stats.totalSearches}</b> ta\n` +
    `❓ Yangi javobsiz savollar: <b>${stats.pendingUnanswered}</b> ta\n` +
    `💬 Yangi fikr va takliflar: <b>${stats.pendingFeedback}</b> ta\n\n`;

  if (stats.popularSearches && stats.popularSearches.length > 0) {
    text += `🔥 <b>Eng ko‘p izlangan so‘rovlar:</b>\n`;
    stats.popularSearches.forEach((s, idx) => {
      text += `${idx + 1}. «${escapeHtml(s.query)}» — ${s.count} marta\n`;
    });
    text += '\n';
  }

  if (stats.popularSections && stats.popularSections.length > 0) {
    text += `📌 <b>Eng ko‘p ochilgan bo‘limlar:</b>\n`;
    stats.popularSections.forEach((sec, idx) => {
      text += `${idx + 1}. ${escapeHtml(sec.section_key)} — ${sec.clicks_count} marta\n`;
    });
  }

  const kb = new InlineKeyboard()
    .text('⬅️ Boshqaruv paneliga', 'admin_panel')
    .text('🏠 Asosiy menyu', 'menu_home');

  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
  await ctx.answerCallbackQuery();
}

export async function handleAdminUnanswered(ctx) {
  if (!ctx.isAdmin) return;

  const items = await getUnansweredQuestions(10);
  if (!items || items.length === 0) {
    const text = `❓ <b>Javobsiz qolgan qidiruv so‘rovlari:</b>\n\nHozirda yangi javobsiz savollar yo‘q! Barcha so‘rovlar qondirilgan.`;
    const kb = new InlineKeyboard().text('⬅️ Admin panelga', 'admin_panel');
    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
    await ctx.answerCallbackQuery();
    return;
  }

  let text = `❓ <b>Javobi topilmagan so‘nggi qidiruvlar (${items.length} ta):</b>\n\n`;
  const kb = new InlineKeyboard();

  items.forEach((item, idx) => {
    const dateStr = new Date(item.created_at).toLocaleDateString('uz-UZ');
    text += `${idx + 1}. «<b>${escapeHtml(item.query_text)}</b>» (${dateStr})\n`;
    kb.text(`✅ Hal qilindi #${item.id}`, `admin_resolve_uq:${item.id}`).row();
  });

  kb.text('⬅️ Admin panelga', 'admin_panel');

  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
  await ctx.answerCallbackQuery();
}

export async function handleAdminResolveUq(ctx, uqId) {
  if (!ctx.isAdmin) return;
  await resolveUnansweredQuestion(uqId);
  await ctx.answerCallbackQuery(`So‘rov #${uqId} hal qilindi deb belgilandi!`);
  await handleAdminUnanswered(ctx);
}

export async function handleAdminFeedback(ctx) {
  if (!ctx.isAdmin) return;

  const items = await getRecentFeedback(8);
  if (!items || items.length === 0) {
    const text = `💬 <b>Talabalar Fikr va Takliflari:</b>\n\nHozircha yangi fikrlar yo‘q.`;
    const kb = new InlineKeyboard().text('⬅️ Admin panelga', 'admin_panel');
    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
    await ctx.answerCallbackQuery();
    return;
  }

  let text = `💬 <b>Foydalanuvchilardan kelgan fikrlar (${items.length} ta):</b>\n\n`;
  const kb = new InlineKeyboard();

  items.forEach((item, idx) => {
    const dateStr = new Date(item.created_at).toLocaleDateString('uz-UZ');
    const statusIcon = item.status === 'reviewed' ? '✅' : '🆕';
    text += `${idx + 1}. ${statusIcon} <b>${escapeHtml(item.user_name || 'Talaba')}:</b>\n` +
      `   «${escapeHtml(item.message)}»\n` +
      `   📅 <i>${dateStr}</i>\n\n`;

    if (item.status === 'new') {
      kb.text(`👁 O‘qildi #${item.id}`, `admin_mark_feedback:${item.id}`).row();
    }
  });

  kb.text('⬅️ Admin panelga', 'admin_panel');

  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
  await ctx.answerCallbackQuery();
}

export async function handleAdminMarkFeedback(ctx, feedbackId) {
  if (!ctx.isAdmin) return;
  await markFeedbackReviewed(feedbackId);
  await ctx.answerCallbackQuery(`Fikr #${feedbackId} ko‘rib chiqildi deb belgilandi!`);
  await handleAdminFeedback(ctx);
}

export async function handleAdminBroadcastPrompt(ctx) {
  if (!ctx.isAdmin) return;

  adminActionStates.set(ctx.from.id, { action: 'broadcast' });
  const text = `📢 <b>Barcha talabalarga e'lon yuborish</b>\n\n` +
    `Yubormoqchi bo‘lgan e'lon matnini yozib yuboring.\n\n` +
    `<i>Diqqat: Ushbu xabar botning barcha foydalanuvchilariga yetkaziladi. Bekor qilish uchun /cancel deb yozing.</i>`;

  const kb = new InlineKeyboard().text('❌ Bekor qilish', 'admin_panel');
  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
  await ctx.answerCallbackQuery();
}

export async function handleAdminAddBookPrompt(ctx) {
  if (!ctx.isAdmin) return;

  adminActionStates.set(ctx.from.id, { action: 'add_book' });
  const text = `➕ <b>Yangi Kitob Qo‘shish</b>\n\n` +
    `Kitob ma'lumotlarini quyidagi formatda bitta xabarda yozib yuboring:\n\n` +
    `<code>Kitob nomi | Muallif | Kurs (1-6) | Fan nomi | Havola (URL)</code>\n\n` +
    `<b>Namuna:</b>\n` +
    `<code>Klinik Terapiya | A. Qodirov | 3 | Terapiya | https://library.fjsti.uz/terapiya.pdf</code>\n\n` +
    `<i>Bekor qilish uchun /cancel deb yozing.</i>`;

  const kb = new InlineKeyboard().text('❌ Bekor qilish', 'admin_panel');
  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
  await ctx.answerCallbackQuery();
}

export async function handleAdminAddTeacherPrompt(ctx) {
  if (!ctx.isAdmin) return;

  adminActionStates.set(ctx.from.id, { action: 'add_teacher' });
  const text = `👨‍🏫 <b>Yangi O‘qituvchi Qo‘shish</b>\n\n` +
    `O‘qituvchi ma'lumotlarini quyidagi formatda bitta xabarda yozib yuboring:\n\n` +
    `<code>F.I.Sh | Kafedra nomi | Lavozimi | Rasmiy telefon/aloqa</code>\n\n` +
    `<b>Namuna:</b>\n` +
    `<code>Karimov Azizbek Shavkatovich | Umumiy jarrohlik | Dotsent | 90-123-45-67</code>\n\n` +
    `<i>Bekor qilish uchun /cancel deb yozing.</i>`;

  const kb = new InlineKeyboard().text('❌ Bekor qilish', 'admin_panel');
  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
  await ctx.answerCallbackQuery();
}

export async function processAdminInput(ctx) {
  const userId = ctx.from?.id;
  const state = adminActionStates.get(userId);
  if (!state) return false;

  const text = ctx.message?.text;
  if (!text) return false;

  if (text === '/cancel' || text === '❌ Bekor qilish') {
    adminActionStates.delete(userId);
    await ctx.reply('Admin amali bekor qilindi.');
    await handleAdminPanel(ctx);
    return true;
  }

  // Add-admin flow: the requested ID is validated and explicitly confirmed before insertion.
  if (state.action === 'add_admin_input') {
    if (!ctx.isSuperAdmin) {
      adminActionStates.delete(userId);
      await ctx.reply('⛔️ Yangi admin tayinlash faqat superadmin uchun.');
      return true;
    }

    const parts = text.split('|').map((part) => part.trim());
    const targetIdText = parts[0] || '';
    if (!/^\d{5,15}$/.test(targetIdText) || !Number.isSafeInteger(Number(targetIdText)) || Number(targetIdText) <= 0) {
      await ctx.reply('⚠️ Telegram ID noto‘g‘ri. Faqat raqam kiriting (masalan, <code>123456789</code>).', { parse_mode: 'HTML' });
      return true;
    }

    if (String(targetIdText) === String(userId)) {
      await ctx.reply('Siz allaqachon adminsiz. O‘zingizni qayta qo‘shish shart emas.');
      return true;
    }

    const existing = await getAdminByTelegramId(targetIdText);
    if (existing) {
      adminActionStates.delete(userId);
      await ctx.reply('ℹ️ Bu Telegram ID allaqachon adminlar ro‘yxatida.');
      await handleAdminPanel(ctx);
      return true;
    }

    const targetName = parts.slice(1).join(' | ').slice(0, 200) || `Telegram #${targetIdText}`;
    adminActionStates.delete(userId);
    pendingAdminMutations.set(userId, {
      action: 'add',
      targetTelegramId: targetIdText,
      targetName,
      createdAt: Date.now()
    });

    const kb = new InlineKeyboard()
      .text('✅ Ha, admin qilib qo‘shish', 'admin_confirm_admin_change')
      .text('❌ Bekor qilish', 'admin_cancel_admin_change');
    await ctx.reply(
      `⚠️ <b>Yangi admin tayinlashni tasdiqlang</b>\n\nIsm: <b>${escapeHtml(targetName)}</b>\nTelegram ID: <code>${escapeHtml(targetIdText)}</code>\n\nBu shaxs admin funksiyalariga ega bo‘ladi. ID to‘g‘riligini tekshiring.`,
      { parse_mode: 'HTML', reply_markup: kb }
    );
    return true;
  }

  // 1. Broadcast
  if (state.action === 'broadcast') {
    adminActionStates.delete(userId);
    const userIds = await getAllUserIds();
    await ctx.reply(`📢 E'lon ${userIds.length} ta foydalanuvchiga yuborilmoqda...`);

    let sentCount = 0;
    for (const uid of userIds) {
      try {
        await ctx.api.sendMessage(
          uid,
          `📢 <b>INSTITUT RASMIY E'LONI:</b>\n\n${escapeHtml(text)}`,
          { parse_mode: 'HTML' }
        );
        sentCount++;
      } catch (e) {
        // user may have blocked bot
      }
    }

    await createAnnouncement({
      title: 'Admin e\'loni',
      content: text,
      createdBy: userId
    });

    await ctx.reply(`✅ E'lon muvaffaqiyatli ${sentCount} ta talabaga yetkazildi!`);
    await handleAdminPanel(ctx);
    return true;
  }

  // 2. Add Book
  if (state.action === 'add_book') {
    adminActionStates.delete(userId);
    const parts = text.split('|').map(s => s.trim());
    if (parts.length < 5) {
      await ctx.reply('⚠️ Format noto‘g‘ri. Kamida 5 ta qism | belgisi bilan ajratilishi kerak.');
      return true;
    }

    try {
      const newBook = await addBook({
        title: parts[0],
        author: parts[1],
        course: parseInt(parts[2], 10) || null,
        subjectName: parts[3],
        fileUrl: parts[4],
        addedBy: userId
      });
      await ctx.reply(`✅ <b>«${escapeHtml(newBook.title)}»</b> kitobi bazaga muvaffaqiyatli qo‘shildi!`, { parse_mode: 'HTML' });
    } catch (e) {
      await ctx.reply(`Xatolik: ${e.message}`);
    }
    await handleAdminPanel(ctx);
    return true;
  }

  // 3. Add Teacher
  if (state.action === 'add_teacher') {
    adminActionStates.delete(userId);
    const parts = text.split('|').map(s => s.trim());
    if (parts.length < 3) {
      await ctx.reply('⚠️ Format noto‘g‘ri. Kamida: F.I.Sh | Kafedra | Lavozim');
      return true;
    }

    try {
      const depts = await getAllDepartments();
      const matchDept = depts.find(d => d.name.toLowerCase().includes(parts[1].toLowerCase()));

      const newTeacher = await addTeacher({
        fullName: parts[0],
        departmentId: matchDept ? matchDept.id : null,
        position: parts[2],
        contact: parts[3] || null,
        source: 'Admin tomonidan Telegram orqali kiritildi'
      });
      await ctx.reply(`✅ O‘qituvchi <b>${escapeHtml(newTeacher.full_name)}</b> muvaffaqiyatli qo‘shildi!`, { parse_mode: 'HTML' });
    } catch (e) {
      await ctx.reply(`Xatolik: ${e.message}`);
    }
    await handleAdminPanel(ctx);
    return true;
  }

  return false;
}
