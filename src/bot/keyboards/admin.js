import { InlineKeyboard } from 'grammy';

export function getAdminKeyboard({ canManageAdmins = false, editModeOn = false, canEditContent = true } = {}) {
  const kb = new InlineKeyboard()
    .text('📊 Statistika', 'admin_stats')
    .text('❓ Javobsiz savollar', 'admin_unanswered').row()
    .text('💬 Foydalanuvchi fikrlari', 'admin_feedback')
    .text('📢 E\'lon yuborish', 'admin_broadcast').row()
    .text('➕ Yangi kitob qo‘shish', 'admin_add_book')
    .text('👨‍🏫 O‘qituvchi qo‘shish', 'admin_add_teacher').row();

  if (canEditContent) {
    kb.text(editModeOn ? '🛠 Tahrirlash rejimi: YOQILGAN' : '🛠 Tahrirlash rejimini yoqish', editModeOn ? 'admin_edit_mode_off' : 'admin_edit_mode_on')
      .text('🗂 Ma’lumotlar bazasini tahrirlash', 'content_editor_home').row();
    kb.text('🧾 Tahrirlar tarixi', 'content_edit_history').row();
  }

  if (canManageAdmins) {
    kb.text('👥 Adminlar ro‘yxati', 'admin_list')
      .text('👑 Yangi admin', 'admin_add').row();
  }

  kb.text('🏠 Asosiy menyu', 'menu_home');
  return kb;
}
