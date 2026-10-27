import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { InlineKeyboard } from 'grammy';
import { getBackKeyboard } from '../keyboards/navigation.js';
import { recordSectionClick } from '../../db/queries/stats.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const instituteData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../data/verified_institute.json'), 'utf-8')
);

export async function handleAbout(ctx) {
  recordSectionClick('about_main');

  const text = `🏛 <b>${instituteData.name}</b>\n\n` +
    `Farg‘ona jamoat salomatligi tibbiyot instituti mintaqadagi yetakchi oliy tibbiy ta’lim muassasalaridan biri bo‘lib, malakali shifokorlar, hamshiralar, sanitariya-gigiyena va jamoat salomatligi mutaxassislarini tayyorlaydi.\n\n` +
    `• <b>Tashkil etilgan yili:</b> ${instituteData.establishedYear}\n` +
    `• <b>Rektor:</b> ${instituteData.rector.fullName} (${instituteData.rector.degree})\n` +
    `• <b>Manzil:</b> ${instituteData.contacts.address}\n\n` +
    `<i>Batafsil ma'lumot olish uchun quyidagi bo‘limlardan birini tanlang:</i>`;

  const kb = new InlineKeyboard()
    .text('👥 Rektorat va rahbarlar', 'about_leadership').row()
    .text('🏢 Fakultetlar va yo‘nalishlar', 'about_faculties').row()
    .text('📞 Aloqa va ish vaqti', 'about_contacts').row()
    .text('🌐 Rasmiy havolalar', 'about_links').row()
    .text('🏠 Asosiy menyu', 'menu_home');

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: kb });
  }
}

export async function handleAboutLeadership(ctx) {
  recordSectionClick('about_leadership');

  let text = `👥 <b>Institut Rektorati va Rahbariyati:</b>\n\n`;
  text += `🏛 <b>Rektor:</b> ${instituteData.rector.fullName}\n`;
  text += `🎓 Ilmiy darajasi: <i>${instituteData.rector.degree}</i>\n`;
  text += `🕒 Qabul vaqti: ${instituteData.rector.receptionHours}\n\n`;
  text += `<b>Mas'ul rahbarlar:</b>\n`;

  instituteData.leadership.forEach((l, idx) => {
    text += `${idx + 1}. <b>${l.role}:</b>\n   👤 ${l.fullName}\n`;
  });

  text += `\n🔗 <i>Manba: FJSTI rasmiy sayti (fjsti.uz)</i>`;

  const kb = new InlineKeyboard()
    .text('⬅️ Orqaga', 'about_main')
    .text('🏠 Asosiy menyu', 'menu_home');

  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
  await ctx.answerCallbackQuery();
}

export async function handleAboutFaculties(ctx) {
  recordSectionClick('about_faculties');

  let text = `🏢 <b>Institut Fakultetlari va Ta'lim Yo‘nalishlari:</b>\n\n`;
  instituteData.faculties.forEach((f, idx) => {
    text += `${idx + 1}. <b>${f.name}</b>\n`;
    text += `   👤 Dekan: <i>${f.dean}</i>\n`;
    text += `   📚 Yo‘nalishlar: ${f.directions.join(', ')}\n\n`;
  });

  text += `🔗 <i>Manba: O'quv-uslubiy boshqarma rasmiy ma'lumotlari</i>`;

  const kb = new InlineKeyboard()
    .text('⬅️ Orqaga', 'about_main')
    .text('🏠 Asosiy menyu', 'menu_home');

  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
  await ctx.answerCallbackQuery();
}

export async function handleAboutContacts(ctx) {
  recordSectionClick('about_contacts');

  const c = instituteData.contacts;
  let text = `📞 <b>Aloqa va Ish tartibi:</b>\n\n`;
  text += `📍 <b>Manzil:</b> ${c.address}\n`;
  text += `☎️ <b>Telefon:</b> ${c.phone}\n`;
  text += `☎️ <b>Qo‘shimcha telefon:</b> ${c.phoneSecondary}\n`;
  text += `✉️ <b>Elektron pochta:</b> ${c.email}\n`;
  text += `🕒 <b>Ish vaqti:</b> ${c.workHours}\n\n`;
  text += `<i>Qabul va ma'lumot olish uchun institut devonxonasi yoki Registrator ofisiga murojaat qilishingiz mumkin.</i>`;

  const kb = new InlineKeyboard()
    .text('⬅️ Orqaga', 'about_main')
    .text('🏠 Asosiy menyu', 'menu_home');

  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
  await ctx.answerCallbackQuery();
}

export async function handleAboutLinks(ctx) {
  recordSectionClick('about_links');

  const l = instituteData.officialLinks;
  let text = `🌐 <b>Rasmiy Internet Manbalari:</b>\n\n`;
  text += `• <b>Rasmiy veb-sayt:</b> <a href="${l.website}">${l.website}</a>\n`;
  text += `• <b>HEMIS axborot tizimi:</b> <a href="${l.hemis}">${l.hemis}</a>\n`;
  text += `• <b>Moodle masofaviy ta'lim:</b> <a href="${l.moodle}">${l.moodle}</a>\n`;
  text += `• <b>Elektron kutubxona (ARM):</b> <a href="${l.library}">${l.library}</a>\n`;
  text += `• <b>E-Library fondi:</b> <a href="${l.elibrary}">${l.elibrary}</a>\n`;
  text += `• <b>Rasmiy Telegram kanal:</b> <a href="${l.telegramChannel}">@fjsti_uz</a>\n\n`;
  text += `<i>Barcha havolalar rasmiy va tasdiqlangan.</i>`;

  const kb = new InlineKeyboard()
    .text('⬅️ Orqaga', 'about_main')
    .text('🏠 Asosiy menyu', 'menu_home');

  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb, link_preview_options: { is_disabled: true } });
  await ctx.answerCallbackQuery();
}
