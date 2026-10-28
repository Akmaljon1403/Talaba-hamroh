import { Keyboard } from 'grammy';
import { isAdmin } from '../../config/env.js';

export function getMainKeyboard(userId) {
  const kb = new Keyboard()
    .text('🏛 Institut haqida').text('📍 Manzil va xonalar').row()
    .text('👨‍🏫 O‘qituvchilar').text('📚 Elektron kutubxona').row()
    .text('📅 O‘quv jadvali').text('💡 Talaba xizmatlari').row()
    .text('🔍 Qidiruv').text('✍️ Fikr bildirish').row()
    .text('🆘 Administratordan yordam');

  if (isAdmin(userId)) {
    kb.row().text('⚙️ Admin boshqaruvi');
  }

  return kb.resized();
}

export function getCancelKeyboard() {
  return new Keyboard()
    .text('❌ Bekor qilish')
    .resized();
}
