import { InlineKeyboard } from 'grammy';

export function getBackKeyboard(backCallback = 'menu_home') {
  return new InlineKeyboard()
    .text('⬅️ Orqaga', backCallback)
    .text('🏠 Asosiy menyu', 'menu_home');
}

export function getPaginationKeyboard(currentPage, totalPages, prefix, extraBack = 'menu_home') {
  const kb = new InlineKeyboard();
  
  if (currentPage > 1) {
    kb.text('⬅️ Oldingi', `${prefix}:page:${currentPage - 1}`);
  }
  
  kb.text(`📄 ${currentPage}/${totalPages}`, 'noop');
  
  if (currentPage < totalPages) {
    kb.text('Keyingi ➡️', `${prefix}:page:${currentPage + 1}`);
  }
  
  kb.row().text('⬅️ Orqaga', extraBack).text('🏠 Asosiy menyu', 'menu_home');
  return kb;
}
