// Uzbek text normalization and fuzzy matching helpers

const CYRILLIC_TO_LATIN = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'ё': 'yo',
  'ж': 'j', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'x', 'ҳ': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sh',
  'ъ': '\'', 'ы': 'i', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
  'ў': 'o\'', 'ғ': 'g\'', 'қ': 'q'
};

const VOWELS = new Set(['а', 'е', 'ё', 'и', 'о', 'у', 'э', 'ю', 'я', 'ў']);

export function transliterateCyrillicToLatin(text) {
  if (!text) return '';
  let result = '';
  const lower = text.toLowerCase();
  for (let i = 0; i < lower.length; i++) {
    const char = lower[i];
    if (char === 'е') {
      const prev = i > 0 ? lower[i - 1] : '';
      if (i === 0 || VOWELS.has(prev) || /\s|-/.test(prev)) {
        result += 'ye';
      } else {
        result += 'e';
      }
    } else if (CYRILLIC_TO_LATIN[char] !== undefined) {
      result += CYRILLIC_TO_LATIN[char];
    } else {
      result += char;
    }
  }
  return result;
}

export function normalizeUzbekText(text) {
  if (!text) return '';
  let str = text.toLowerCase();
  
  // Convert Cyrillic if contains cyrillic letters
  if (/[а-яёқғҳ]/i.test(str)) {
    str = transliterateCyrillicToLatin(str);
  }

  // Normalize apostrophes: o‘, o', o`, o’ -> o'
  str = str.replace(/[‘`’ʻ]/g, '\'');

  // Strip non-alphanumeric except space and apostrophe
  str = str.replace(/[^a-z0-9'\s]/g, ' ');

  // Collapse consecutive whitespaces
  str = str.replace(/\s+/g, ' ').trim();

  return str;
}

export function calculateSimilarity(str1, str2) {
  const s1 = normalizeUzbekText(str1);
  const s2 = normalizeUzbekText(str2);

  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.85;

  // Token overlap
  const words1 = new Set(s1.split(' '));
  const words2 = new Set(s2.split(' '));
  let intersection = 0;
  for (const w of words1) {
    if (words2.has(w)) intersection++;
  }
  const union = new Set([...words1, ...words2]).size;
  return union > 0 ? intersection / union : 0;
}
