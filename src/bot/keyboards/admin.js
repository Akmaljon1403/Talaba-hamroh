import { InlineKeyboard } from 'grammy';

export function getAdminKeyboard() {
  return new InlineKeyboard()
    .text('📊 Statistika', 'admin_stats')
    .text('❓ Javobsiz savollar', 'admin_unanswered').row()
    .text('✏️ Ma’lumotlarni tahrirlash', 'admin_edit_data').row()
    .text('💬 Foydalanuvchi fikrlari', 'admin_feedback').row()
    .text('🆘 Yordam so‘rovlari', 'admin_support_inbox')
    .text('📢 E\'lon yuborish', 'admin_broadcast').row()
    .text('➕ Yangi kitob qo‘shish', 'admin_add_book')
    .text('👨‍🏫 O‘qituvchi qo‘shish', 'admin_add_teacher').row()
    .text('🏠 Asosiy menyu', 'menu_home');
}
