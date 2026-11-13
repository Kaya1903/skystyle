// Clothing color palette + simple color-harmony rules used to pick wardrobe
// pieces that look good together, not just ones with the right warmth.

// `neutral` colors pair with almost anything; accents need more care.
export const COLORS = {
  siyah:    { hex: '#1f1f1f', neutral: true },
  beyaz:    { hex: '#f7f5f0', neutral: true },
  gri:      { hex: '#9a9a96', neutral: true },
  lacivert: { hex: '#22314f', neutral: true },
  bej:      { hex: '#d9c7a7', neutral: true },
  kahve:    { hex: '#6b4a32', neutral: true },
  denim:    { hex: '#5277a3', neutral: true },
  haki:     { hex: '#7a7a4f' },
  yesil:    { hex: '#2f7a4f' },
  mavi:     { hex: '#3f8fd8' },
  kirmizi:  { hex: '#c9302c' },
  bordo:    { hex: '#6e1f2b' },
  pembe:    { hex: '#e79bb3' },
  mor:      { hex: '#6c4a9e' },
  sari:     { hex: '#e8c13a' },
  turuncu:  { hex: '#e2793a' },
};

export const COLOR_KEYS = Object.keys(COLORS);
export const PATTERNS = ['duz', 'desenli'];

const COLOR_NAMES = {
  tr: { siyah: 'Siyah', beyaz: 'Beyaz', gri: 'Gri', lacivert: 'Lacivert', bej: 'Bej', kahve: 'Kahverengi', denim: 'Denim', haki: 'Haki', yesil: 'Yeşil', mavi: 'Mavi', kirmizi: 'Kırmızı', bordo: 'Bordo', pembe: 'Pembe', mor: 'Mor', sari: 'Sarı', turuncu: 'Turuncu' },
  en: { siyah: 'Black', beyaz: 'White', gri: 'Grey', lacivert: 'Navy', bej: 'Beige', kahve: 'Brown', denim: 'Denim', haki: 'Khaki', yesil: 'Green', mavi: 'Blue', kirmizi: 'Red', bordo: 'Burgundy', pembe: 'Pink', mor: 'Purple', sari: 'Yellow', turuncu: 'Orange' },
  es: { siyah: 'Negro', beyaz: 'Blanco', gri: 'Gris', lacivert: 'Azul marino', bej: 'Beige', kahve: 'Marrón', denim: 'Denim', haki: 'Caqui', yesil: 'Verde', mavi: 'Azul', kirmizi: 'Rojo', bordo: 'Burdeos', pembe: 'Rosa', mor: 'Morado', sari: 'Amarillo', turuncu: 'Naranja' },
  pl: { siyah: 'Czarny', beyaz: 'Biały', gri: 'Szary', lacivert: 'Granatowy', bej: 'Beżowy', kahve: 'Brązowy', denim: 'Denim', haki: 'Khaki', yesil: 'Zielony', mavi: 'Niebieski', kirmizi: 'Czerwony', bordo: 'Bordowy', pembe: 'Różowy', mor: 'Fioletowy', sari: 'Żółty', turuncu: 'Pomarańczowy' },
  ar: { siyah: 'أسود', beyaz: 'أبيض', gri: 'رمادي', lacivert: 'كحلي', bej: 'بيج', kahve: 'بني', denim: 'دنيم', haki: 'كاكي', yesil: 'أخضر', mavi: 'أزرق', kirmizi: 'أحمر', bordo: 'عنابي', pembe: 'وردي', mor: 'بنفسجي', sari: 'أصفر', turuncu: 'برتقالي' },
};

export function colorName(key, lang) {
  const dict = COLOR_NAMES[lang] || COLOR_NAMES.tr;
  return dict[key] || COLOR_NAMES.tr[key] || '';
}

export function isValidColor(key) {
  return Object.prototype.hasOwnProperty.call(COLORS, key);
}

// Accent pairs that classically work together.
const GOOD_PAIRS = [
  ['bordo', 'haki'], ['bordo', 'pembe'], ['mavi', 'turuncu'], ['mavi', 'sari'],
  ['yesil', 'haki'], ['yesil', 'turuncu'], ['kirmizi', 'mavi'], ['mor', 'sari'],
  ['pembe', 'mavi'], ['haki', 'turuncu'], ['mor', 'pembe'],
];
// Accent pairs that tend to fight each other.
const BAD_PAIRS = [
  ['kirmizi', 'pembe'], ['kirmizi', 'turuncu'], ['kirmizi', 'yesil'], ['kirmizi', 'bordo'],
  ['kirmizi', 'mor'], ['turuncu', 'pembe'], ['turuncu', 'mor'], ['sari', 'pembe'],
  ['yesil', 'mor'], ['sari', 'kirmizi'],
];
const pairKey = (a, b) => [a, b].sort().join('+');
const GOOD = new Set(GOOD_PAIRS.map(([a, b]) => pairKey(a, b)));
const BAD = new Set(BAD_PAIRS.map(([a, b]) => pairKey(a, b)));

// Harmony between two colors, roughly -2 (clash) .. +1 (great).
export function pairScore(a, b) {
  if (!isValidColor(a) || !isValidColor(b)) return 0;
  const na = COLORS[a].neutral, nb = COLORS[b].neutral;
  if (a === b) return na ? 0.5 : 0.3; // tonal look is fine, but a bit flat
  if (na && nb) return 0.8;
  if (na || nb) return 1;
  const k = pairKey(a, b);
  if (GOOD.has(k)) return 0.9;
  if (BAD.has(k)) return -2;
  return -0.6; // two unrelated accents
}

// Scores a whole set of items (colors + patterns). Higher is better.
export function outfitColorScore(items) {
  const colored = items.filter(i => isValidColor(i.color));
  let score = 0;
  for (let x = 0; x < colored.length; x++) {
    for (let y = x + 1; y < colored.length; y++) {
      score += pairScore(colored[x].color, colored[y].color);
    }
  }
  const accents = new Set(colored.filter(i => !COLORS[i.color].neutral).map(i => i.color));
  if (accents.size > 2) score -= 1.5 * (accents.size - 2);
  const patterned = items.filter(i => i.pattern === 'desenli').length;
  if (patterned > 1) score -= 1.5 * (patterned - 1);
  return score;
}
