// Telegram HTML message formatting utilities

export function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatDepartmentCard(dept) {
  let text = `🏛 <b>${escapeHtml(dept.name)}</b>\n`;
  text += `📚 Daraja: <i>${dept.level === 'magistratura' ? 'Magistratura' : 'Bakalavriat'}</i>\n`;
  if (dept.head_name) {
    text += `👤 <b>Kafedra mudiri:</b> ${escapeHtml(dept.head_name)}\n`;
  }
  if (dept.contact_phone) {
    text += `📞 <b>Mas'ul telefon:</b> ${escapeHtml(dept.contact_phone)}\n`;
  }
  if (dept.location_notes) {
    text += `📍 <b>Joylashuv:</b> ${escapeHtml(dept.location_notes)}\n`;
  }

  if (dept.subjects && dept.subjects.length > 0) {
    text += `\n📖 <b>Biriktirilgan fanlar (${dept.subjects.length} ta):</b>\n`;
    dept.subjects.slice(0, 15).forEach((s, idx) => {
      text += `${idx + 1}. ${escapeHtml(s.name)} (<i>${escapeHtml(s.courses)}-kurs, ${escapeHtml(s.semesters)}-semestr</i>)\n`;
    });
    if (dept.subjects.length > 15) {
      text += `<i>...va yana ${dept.subjects.length - 15} ta fan.</i>\n`;
    }
  }

  text += `\n🔗 <i>Manba: FJSTI O'quv-uslubiy boshqarma rasmiy buyrug'i</i>`;
  return text;
}

export function formatClinicalBaseCard(base) {
  let text = `🏥 <b>${escapeHtml(base.name)}</b>\n\n`;
  if (base.department_name) {
    text += `📌 <b>Biriktirilgan kafedra:</b> ${escapeHtml(base.department_name)}\n`;
  }
  if (base.head_name) {
    text += `👤 <b>Mas'ul / Mudir:</b> ${escapeHtml(base.head_name)}\n`;
  }
  if (base.contact_phone) {
    text += `📞 <b>Bog'lanish:</b> ${escapeHtml(base.contact_phone)}\n`;
  }
  if (base.address) {
    text += `📍 <b>Manzil:</b> ${escapeHtml(base.address)}\n`;
  }
  if (base.map_link) {
    const mapUrl = escapeHtml(base.map_link);
    text += `🗺 <b>Xarita:</b> <a href="${mapUrl}">Xaritada ochish</a>\n`;
  }
  const roomCount = base.total_rooms ?? (base.rooms ? base.rooms.length : 0);
  text += `🚪 <b>Xonalar soni:</b> ${roomCount} ta\n`;
  text += `👥 <b>Umumiy sig'imi:</b> ${base.total_capacity || 0} nafar talaba\n`;

  if (base.rooms && base.rooms.length > 0) {
    text += `\n📋 <b>Mavjud auditoriyalar:</b>\n`;
    base.rooms.forEach((r, idx) => {
      text += `• Xona <b>${escapeHtml(r.room_number)}</b> — ${escapeHtml(r.room_type)} (${r.capacity} o'rin)\n`;
      if (r.department_name) text += `   🏛 Kafedra: ${escapeHtml(r.department_name)}\n`;
      if (r.notes) text += `   📝 ${escapeHtml(r.notes)}\n`;
    });
  }

  text += `\n🔗 <i>Manba: FJSTI O'quv auditoriyalar fondi rasmiy hujjati</i>`;
  return text;
}

export function formatCalendarCard(item) {
  const yearLabel = item.academic_year ? ` — ${escapeHtml(item.academic_year)}` : '';
  let text = `📅 <b>${escapeHtml(item.direction_name)} (${item.course}-kurs${yearLabel})</b>\n\n`;
  text += `🔹 Nazariy ta'lim: <b>${item.theory_weeks}</b> hafta\n`;
  text += `🔹 Attestatsiyalar: <b>${item.attestation_weeks}</b> hafta\n`;
  text += `🔹 Malakaviy amaliyot: <b>${item.internship_weeks}</b> hafta\n`;
  if (item.credit_intro_weeks > 0) {
    text += `🔹 Kredit tizimiga kirish: <b>${item.credit_intro_weeks}</b> hafta\n`;
  }
  if (item.state_exam_weeks > 0) {
    text += `🔹 Yakuniy Davlat attestatsiyasi: <b>${item.state_exam_weeks}</b> hafta\n`;
  }
  text += `🔹 Ta'til haftalari: <b>${item.vacation_weeks}</b> hafta\n`;
  if (item.gpa_weeks > 0) {
    text += `🔹 GPA hisoblash: <b>${item.gpa_weeks}</b> hafta\n`;
  }
  text += `\n📊 <b>Jami o'quv yili haftalari:</b> ${item.total_weeks} hafta\n`;
  text += `\n🔗 <i>Manba: ${escapeHtml(item.source || 'FJSTI Rektorati tomonidan tasdiqlangan O‘quv jarayoni jadvali')}</i>`;
  return text;
}

export function formatTeacherCard(teacher) {
  let text = `👨‍🏫 <b>${escapeHtml(teacher.full_name)}</b>\n`;
  if (teacher.position) {
    text += `💼 <b>Lavozimi:</b> ${escapeHtml(teacher.position)}\n`;
  }
  if (teacher.department_name) {
    text += `🏛 <b>Kafedrasi:</b> ${escapeHtml(teacher.department_name)}\n`;
  }
  if (teacher.official_contact) {
    text += `📞 <b>Rasmiy aloqa:</b> ${escapeHtml(teacher.official_contact)}\n`;
  }
  if (teacher.source) {
    text += `\n🔗 <i>Manba: ${escapeHtml(teacher.source)}</i>`;
  }
  return text;
}

export function formatBookCard(book) {
  let text = `📖 <b>${escapeHtml(book.title)}</b>\n`;
  if (book.author) {
    text += `✍️ <b>Muallif:</b> ${escapeHtml(book.author)}\n`;
  }
  if (book.subject_name) {
    text += `📚 <b>Fan:</b> ${escapeHtml(book.subject_name)}\n`;
  }
  if (book.course) {
    text += `🎓 <b>Kurs:</b> ${book.course}-kurs\n`;
  }
  text += `\n📥 <a href="${escapeHtml(book.file_url)}">Kitobni o'qish / yuklab olish</a>\n`;
  text += `\n🔗 <i>Manba: ${escapeHtml(book.source || 'FJSTI ARM')}</i>`;
  return text;
}
