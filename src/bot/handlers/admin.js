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
import { adminActionStates } from '../state/adminState.js';
import { createAdmin, getAdminByTelegramId, getAdminRoles } from '../../db/queries/admins.js';
import { registerRuntimeAdmin, isSuperAdmin } from '../../config/env.js';
import { enableAdminEditMode, disableAdminEditMode, isAdminEditModeActive } from '../utils/adminEditMode.js';

export { adminActionStates };

export async function handleAdminPanel(ctx) {
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

  const privateChat = ctx.chat?.type === 'private';
  const editModeOn = privateChat && isAdminEditModeActive(ctx.from?.id);
  const kb = getAdminKeyboard({
    canManageAdmins: privateChat && isSuperAdmin(ctx.from?.id),
    editModeOn,
    canEditContent: privateChat
  });

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: kb });
  }
}

export async function handleAdminList(ctx) {
  if (ctx.chat?.type !== 'private') {
    await ctx.answerCallbackQuery('Admin boshqaruvini bot bilan shaxsiy chatda oching.');
    return;
  }

  if (!ctx.isAdmin || !isSuperAdmin(ctx.from?.id)) {
    await ctx.answerCallbackQuery('Faqat superadmin ko‘ra oladi.');
    return;
  }

  const admins = await getAdminRoles();
  let text = `👥 <b>Administratorlar ro‘yxati</b>\n\n`;
  admins.forEach((admin, index) => {
    const roleLabel = admin.role === 'superadmin' ? 'Superadmin' : 'Admin';
    text += `${index + 1}. <b>${escapeHtml(admin.full_name || 'Nomi kiritilmagan')}</b>\n   ID: <code>${escapeHtml(admin.telegram_id)}</code>\n   Rol: ${roleLabel}\n\n`;
  });
  if (admins.length === 0) text += 'Hozircha admin ro‘yxati bo‘sh.';

  await ctx.editMessageText(text, {
    parse_mode: 'HTML',
    reply_markup: new InlineKeyboard()
      .text('👑 Yangi admin', 'admin_add')
      .text('⬅️ Admin paneli', 'admin_panel')
  });
  await ctx.answerCallbackQuery();
}

export async function handleAdminAddPrompt(ctx) {
  if (ctx.chat?.type !== 'private') {
    await ctx.answerCallbackQuery('Yangi adminni faqat botning shaxsiy chatida qo‘shish mumkin.');
    return;
  }

  if (!ctx.isAdmin || !isSuperAdmin(ctx.from?.id)) {
    await ctx.answerCallbackQuery('Faqat superadmin yangi admin qo‘sha oladi.');
    return;
  }

  adminActionStates.set(ctx.from.id, { action: 'add_admin_id' });
  const text = `👑 <b>Yangi administrator qo‘shish</b>\n\n` +
    `Yangi adminning Telegram ID raqamini yuboring.\n\n` +
    `Yangi admin Telegram’da <code>/myid</code> yuborib, o‘z ID raqamini bilishi mumkin.\n` +
    `Bu bosqichda admin huquqi hali berilmaydi — keyingi xabarda tasdiqlaysiz.\n\n` +
    `Bekor qilish uchun pastdagi tugmani bosing yoki /cancel yuboring.`;

  const kb = new InlineKeyboard().text('❌ Bekor qilish', 'admin_add_cancel');
  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: kb });
  }
}

export async function handleAdminAddCancel(ctx) {
  if (ctx.chat?.type !== 'private') {
    await ctx.answerCallbackQuery('Amalni botning shaxsiy chatida bajaring.');
    return;
  }

  if (!ctx.isAdmin) {
    await ctx.answerCallbackQuery('Ruxsat yo‘q.');
    return;
  }
  adminActionStates.delete(ctx.from.id);
  await handleAdminPanel(ctx);
}

export async function handleAdminConfirmAdd(ctx) {
  if (ctx.chat?.type !== 'private') {
    await ctx.answerCallbackQuery('Admin qo‘shishni faqat shaxsiy chatda tasdiqlash mumkin.');
    return;
  }

  if (!ctx.isAdmin || !isSuperAdmin(ctx.from?.id)) {
    await ctx.answerCallbackQuery('Faqat superadmin tasdiqlashi mumkin.');
    return;
  }

  const state = adminActionStates.get(ctx.from.id);
  if (state?.action !== 'confirm_add_admin') {
    await ctx.answerCallbackQuery('Tasdiqlash holati topilmadi. Qaytadan boshlang.');
    return;
  }

  try {
    const result = await createAdmin(state.targetTelegramId, null);
    if (result.created) {
      registerRuntimeAdmin(state.targetTelegramId, 'admin');
      adminActionStates.delete(ctx.from.id);
      await ctx.answerCallbackQuery('Yangi admin qo‘shildi.');
      await ctx.editMessageText(
        `✅ <b>Yangi admin muvaffaqiyatli qo‘shildi.</b>\n\nTelegram ID: <code>${state.targetTelegramId}</code>\nRoli: <b>Admin</b>\n\nUshbu huquq bazada saqlanadi va bot qayta ishga tushganda ham qoladi.`,
        {
          parse_mode: 'HTML',
          reply_markup: new InlineKeyboard().text('⚙️ Admin paneli', 'admin_panel')
        }
      );
    } else {
      adminActionStates.delete(ctx.from.id);
      await ctx.answerCallbackQuery('Bu ID allaqachon admin.');
      await ctx.editMessageText(
        `ℹ️ <b>Bu Telegram ID allaqachon administratorlar ro‘yxatida.</b>\nID: <code>${state.targetTelegramId}</code>`,
        { parse_mode: 'HTML', reply_markup: new InlineKeyboard().text('⚙️ Admin paneli', 'admin_panel') }
      );
    }
  } catch (error) {
    await ctx.answerCallbackQuery('Admin qo‘shishda xatolik yuz berdi.');
    console.error('[ADMIN] Admin qo‘shish xatosi:', error?.message || error);
  }
}

export async function handleAdminEditModeOn(ctx) {
  if (ctx.chat?.type !== 'private') {
    await ctx.answerCallbackQuery('Tahrirlash rejimini botning shaxsiy chatida yoqing.');
    return;
  }

  if (!ctx.isAdmin) {
    await ctx.answerCallbackQuery('Admin ruxsati kerak.');
    return;
  }
  enableAdminEditMode(ctx.from.id, ctx.api, ctx.chat?.id);
  await ctx.editMessageText(
    `🛠 <b>Tahrirlash rejimi yoqildi.</b>\n\n` +
    `Endi qidiruv natijalari va ma’lumot kartalarida ✏️ tahrirlash tugmalari paydo bo‘ladi. O‘zgartirishlar tasdiqlangandan keyin ma’lumotlar bazasiga yoziladi va tegishli bog‘langan bo‘limlarda ham aks etadi.\n\n` +
    `⏳ 5 daqiqa davomida faoliyat bo‘lmasa, rejim avtomatik o‘chadi va siz foydalanuvchi rejimiga qaytasiz.`,
    {
      parse_mode: 'HTML',
      reply_markup: getAdminKeyboard({ canManageAdmins: isSuperAdmin(ctx.from.id), editModeOn: true })
    }
  );
  await ctx.answerCallbackQuery('Tahrirlash rejimi yoqildi.');
}

export async function handleAdminEditModeOff(ctx) {
  if (ctx.chat?.type !== 'private') {
    await ctx.answerCallbackQuery('Tahrirlash rejimini botning shaxsiy chatida boshqaring.');
    return;
  }

  if (!ctx.isAdmin) {
    await ctx.answerCallbackQuery('Admin ruxsati kerak.');
    return;
  }
  disableAdminEditMode(ctx.from.id);
  await ctx.editMessageText(
    '✅ <b>Tahrirlash rejimi o‘chirildi.</b> Endi bot oddiy foydalanuvchi rejimida.',
    {
      parse_mode: 'HTML',
      reply_markup: getAdminKeyboard({ canManageAdmins: isSuperAdmin(ctx.from.id), editModeOn: false })
    }
  );
  await ctx.answerCallbackQuery('Foydalanuvchi rejimiga qaytdingiz.');
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
  if (['add_admin_id', 'confirm_add_admin'].includes(state.action) && ctx.chat?.type !== 'private') return false;

  const text = ctx.message?.text;
  if (!text) return false;

  if (text === '/cancel' || text === '❌ Bekor qilish') {
    adminActionStates.delete(userId);
    await ctx.reply('Admin amali bekor qilindi.');
    await handleAdminPanel(ctx);
    return true;
  }

  if (state.action === 'add_admin_id') {
    if (!ctx.isSuperAdmin && !isSuperAdmin(userId)) {
      adminActionStates.delete(userId);
      await ctx.reply('⛔️ Faqat superadmin yangi admin qo‘sha oladi.');
      return true;
    }

    const candidate = text.trim();
    if (!/^\d{5,20}$/.test(candidate) || !Number.isSafeInteger(Number(candidate)) || Number(candidate) <= 0) {
      await ctx.reply('⚠️ Telegram ID noto‘g‘ri ko‘rinishda. Faqat raqam yuboring, masalan: <code>123456789</code>.', { parse_mode: 'HTML' });
      return true;
    }

    const targetTelegramId = Number(candidate);
    const existing = await getAdminByTelegramId(targetTelegramId);
    if (existing) {
      adminActionStates.delete(userId);
      await ctx.reply(`ℹ️ <code>${targetTelegramId}</code> allaqachon administratorlar ro‘yxatida (rol: <b>${escapeHtml(existing.role)}</b>).`, { parse_mode: 'HTML' });
      await handleAdminPanel(ctx);
      return true;
    }

    adminActionStates.set(userId, { action: 'confirm_add_admin', targetTelegramId });
    const kb = new InlineKeyboard()
      .text('✅ Admin qilib qo‘shish', 'admin_add_confirm')
      .text('❌ Bekor qilish', 'admin_add_cancel');
    await ctx.reply(
      `🛡 <b>Admin qo‘shishni tasdiqlang</b>\n\nTelegram ID: <code>${targetTelegramId}</code>\n` +
      `Tasdiqlasangiz, ushbu hisob administrator huquqiga ega bo‘ladi. ID raqamini tekshirib chiqing.`,
      { parse_mode: 'HTML', reply_markup: kb }
    );
    return true;
  }

  if (state.action === 'confirm_add_admin') {
    await ctx.reply('Iltimos, yangi adminni qo‘shish yoki bekor qilish uchun yuqoridagi tugmalardan foydalaning.');
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
