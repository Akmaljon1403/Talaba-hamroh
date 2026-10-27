import { InlineKeyboard } from 'grammy';
import { getCalendarByCourse } from '../../db/queries/academicCalendar.js';
import { formatCalendarCard } from '../utils/formatters.js';
import { recordSectionClick } from '../../db/queries/stats.js';
import { isAdminEditModeActive } from '../utils/adminEditMode.js';

export async function handleSchedule(ctx) {
  recordSectionClick('schedule_main');

  const text = `📅 <b>Bakalavriat O‘quv Jarayoni Grafigi (2026/2027)</b>\n\n` +
    `Farg‘ona jamoat salomatligi tibbiyot instituti rektorati tomonidan tasdiqlangan rasmiy o‘quv jarayoni taqvimi.\n\n` +
    `<i>O‘zingiz o‘qiyotgan kursni tanlang:</i>`;

  const kb = new InlineKeyboard()
    .text('1-kurs', 'sched_course:1').text('2-kurs', 'sched_course:2').row()
    .text('3-kurs', 'sched_course:3').text('4-kurs', 'sched_course:4').row()
    .text('5-kurs', 'sched_course:5').text('6-kurs', 'sched_course:6').row()
    .text('🏠 Asosiy menyu', 'menu_home');

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: kb });
  }
}

export async function handleCourseSchedule(ctx, course) {
  const calendars = await getCalendarByCourse(course);
  if (!calendars || calendars.length === 0) {
    await ctx.answerCallbackQuery(`${course}-kurs jadvali topilmadi.`);
    return;
  }

  const text = `📅 <b>${course}-kurs Kunduzgi Bakalavriat Ta'lim Yo‘nalishlari:</b>\n\n` +
    `Kerakli ta'lim yo‘nalishini tanlang:`;

  const kb = new InlineKeyboard();
  calendars.forEach((c) => {
    kb.text(`📚 ${c.direction_name}`, `sched_detail:${c.id}`).row();
  });

  kb.text('⬅️ Kursni qayta tanlash', 'schedule_main')
    .text('🏠 Asosiy menyu', 'menu_home');

  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
  await ctx.answerCallbackQuery();
}

export async function handleScheduleDetail(ctx, calendarId) {
  const { query } = await import('../../db/pool.js');
  const res = await query('SELECT * FROM academic_calendars WHERE id = $1', [calendarId]);
  if (res.rowCount === 0) {
    await ctx.answerCallbackQuery('Jadval topilmadi.');
    return;
  }

  const item = res.rows[0];
  const text = formatCalendarCard(item);

  const kb = new InlineKeyboard()
    .text('⬅️ Yo‘nalishlarga qaytish', `sched_course:${item.course}`)
    .text('🏠 Asosiy menyu', 'menu_home');

  if (ctx.isAdmin && isAdminEditModeActive(ctx.from?.id)) {
    kb.row().text('✏️ O‘quv grafigini tahrirlash', `admin_edit:calendar:${item.id}`);
  }

  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
  await ctx.answerCallbackQuery();
}
