import { InlineKeyboard } from 'grammy';
import { getAllDepartments, getDepartmentById, searchDepartments } from '../../db/queries/departments.js';
import { searchTeachers } from '../../db/queries/teachers.js';
import { formatDepartmentCard, formatTeacherCard, escapeHtml } from '../utils/formatters.js';
import { recordSectionClick } from '../../db/queries/stats.js';
import { isAdminEditModeActive } from '../utils/adminEditMode.js';

const DEPTS_PER_PAGE = 6;

export async function handleTeachers(ctx) {
  recordSectionClick('teachers_main');

  const text = `👨‍🏫 <b>Kafedralar va O‘qituvchilar Bo‘limi</b>\n\n` +
    `Farg‘ona jamoat salomatligi tibbiyot institutida faoliyat yuritayotgan kafedralar, kafedra mudirlari, mas'ul telefonlar va biriktirilgan fanlar ro‘yxati bilan tanishing.\n\n` +
    `<i>Kerakli bo‘limni tanlang:</i>`;

  const kb = new InlineKeyboard()
    .text('🏛 Bakalavriat kafedralari (29 ta)', 'depts:bakalavriat:page:1').row()
    .text('🎓 Magistratura kafedralari', 'depts:magistratura:page:1').row()
    .text('🔍 O‘qituvchini qidirish', 'search_teacher_prompt').row()
    .text('🏠 Asosiy menyu', 'menu_home');

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: kb });
  }
}

export async function handleDepartmentsPagination(ctx, level = 'bakalavriat', page = 1) {
  const depts = await getAllDepartments(level);
  const totalPages = Math.ceil(depts.length / DEPTS_PER_PAGE) || 1;
  const currentPage = Math.max(1, Math.min(page, totalPages));

  const startIdx = (currentPage - 1) * DEPTS_PER_PAGE;
  const currentDepts = depts.slice(startIdx, startIdx + DEPTS_PER_PAGE);

  const text = `🏛 <b>${level === 'magistratura' ? 'Magistratura' : 'Bakalavriat'} kafedralari (${currentPage}/${totalPages}):</b>\n\n` +
    `Batafsil mudir va fanlarini ko‘rish uchun kafedra nomini bosing:`;

  const kb = new InlineKeyboard();
  currentDepts.forEach((d) => {
    const shortName = d.name.length > 38 ? d.name.substring(0, 35) + '...' : d.name;
    kb.text(`🏛 ${shortName}`, `dept_detail:${d.id}`).row();
    if (ctx.isAdmin && isAdminEditModeActive(ctx.from?.id)) {
      kb.text(`✏️ Kafedra #${d.id}`, `admin_edit:department:${d.id}`).row();
    }
  });

  const navRow = [];
  if (currentPage > 1) {
    navRow.push({ text: '⬅️ Oldingi', callback_data: `depts:${level}:page:${currentPage - 1}` });
  }
  navRow.push({ text: `📄 ${currentPage}/${totalPages}`, callback_data: 'noop' });
  if (currentPage < totalPages) {
    navRow.push({ text: 'Keyingi ➡️', callback_data: `depts:${level}:page:${currentPage + 1}` });
  }
  kb.row(...navRow);

  kb.row()
    .text('⬅️ Orqaga', 'teachers_main')
    .text('🏠 Asosiy menyu', 'menu_home');

  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
  await ctx.answerCallbackQuery();
}

export async function handleDepartmentDetail(ctx, deptId) {
  const dept = await getDepartmentById(deptId);
  if (!dept) {
    await ctx.answerCallbackQuery('Kafedra topilmadi.');
    return;
  }

  const text = formatDepartmentCard(dept);
  const kb = new InlineKeyboard()
    .text('⬅️ Kafedralarga qaytish', `depts:${dept.level}:page:1`)
    .text('🏠 Asosiy menyu', 'menu_home');

  if (ctx.isAdmin && isAdminEditModeActive(ctx.from?.id)) {
    kb.row().text('✏️ Kafedrani tahrirlash', `admin_edit:department:${dept.id}`);
  }

  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
  await ctx.answerCallbackQuery();
}
