import { InlineKeyboard } from 'grammy';

export function getAdminKeyboard({ isSuperAdmin = false, editModeActive = false } = {}) {
  const kb = new InlineKeyboard()
    .text('📊 Statistika', 'admin_stats')
    .text('❓ Javobsiz savollar', 'admin_unanswered').row()
    .text('💬 Foydalanuvchi fikrlari', 'admin_feedback')
    .text('📢 E\'lon yuborish', 'admin_broadcast').row()
    .text('➕ Yangi kitob qo‘shish', 'admin_add_book')
    .text('👨‍🏫 O‘qituvchi qo‘shish', 'admin_add_teacher').row()
    .text(editModeActive ? '🛠 Tahrirlash: YOQILGAN' : '🛡 Tahrirlash rejimini yoqish', 'admin_edit_mode_toggle').row();
    kb.text('🧾 Tahrirlar tarixi', 'admin_edit_history').row();

  if (isSuperAdmin) {
    kb.text('➕ Yangi admin qo‘shish', 'admin_add_admin')
      .text('👥 Adminlarni boshqarish', 'admin_manage_admins').row();
  }

  kb.text('🏠 Asosiy menyu', 'menu_home');
  return kb;
}
