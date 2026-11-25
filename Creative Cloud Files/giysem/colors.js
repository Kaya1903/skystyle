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
  de: { siyah: 'Schwarz', beyaz: 'Weiß', gri: 'Grau', lacivert: 'Marineblau', bej: 'Beige', kahve: 'Braun', denim: 'Denim', haki: 'Khaki', yesil: 'Grün', mavi: 'Blau', kirmizi: 'Rot', bordo: 'Bordeaux', pembe: 'Rosa', mor: 'Lila', sari: 'Gelb', turuncu: 'Orange' },
  fr: { siyah: "Noir", beyaz: "Blanc", gri: "Gris", lacivert: "Bleu marine", bej: "Beige", kahve: "Marron", denim: "Denim", haki: "Kaki", yesil: "Vert", mavi: "Bleu", kirmizi: "Rouge", bordo: "Bordeaux", pembe: "Rose", mor: "Violet", sari: "Jaune", turuncu: "Orange" },
  ru: { siyah: "Чёрный", beyaz: "Белый", gri: "Серый", lacivert: "Тёмно-синий", bej: "Бежевый", kahve: "Коричневый", denim: "Деним", haki: "Хаки", yesil: "Зелёный", mavi: "Синий", kirmizi: "Красный", bordo: "Бордовый", pembe: "Розовый", mor: "Фиолетовый", sari: "Жёлтый", turuncu: "Оранжевый" },
  az: { siyah: "Qara", beyaz: "Ağ", gri: "Boz", lacivert: "Lacivərd", bej: "Bej", kahve: "Qəhvəyi", denim: "Cins", haki: "Xaki", yesil: "Yaşıl", mavi: "Mavi", kirmizi: "Qırmızı", bordo: "Tünd qırmızı", pembe: "Çəhrayı", mor: "Bənövşəyi", sari: "Sarı", turuncu: "Narıncı" },
  zh: { siyah: "黑色", beyaz: "白色", gri: "灰色", lacivert: "藏青色", bej: "米色", kahve: "棕色", denim: "牛仔蓝", haki: "卡其色", yesil: "绿色", mavi: "蓝色", kirmizi: "红色", bordo: "酒红色", pembe: "粉色", mor: "紫色", sari: "黄色", turuncu: "橙色" },
  ja: { siyah: "ブラック", beyaz: "ホワイト", gri: "グレー", lacivert: "ネイビー", bej: "ベージュ", kahve: "ブラウン", denim: "デニム", haki: "カーキ", yesil: "グリーン", mavi: "ブルー", kirmizi: "レッド", bordo: "ボルドー", pembe: "ピンク", mor: "パープル", sari: "イエロー", turuncu: "オレンジ" },
  ko: { siyah: "블랙", beyaz: "화이트", gri: "그레이", lacivert: "네이비", bej: "베이지", kahve: "브라운", denim: "데님", haki: "카키", yesil: "그린", mavi: "블루", kirmizi: "레드", bordo: "버건디", pembe: "핑크", mor: "퍼플", sari: "옐로", turuncu: "오렌지" },
  hi: { siyah: "काला", beyaz: "सफ़ेद", gri: "ग्रे", lacivert: "गहरा नीला", bej: "बेज", kahve: "भूरा", denim: "डेनिम", haki: "खाकी", yesil: "हरा", mavi: "नीला", kirmizi: "लाल", bordo: "मैरून", pembe: "गुलाबी", mor: "बैंगनी", sari: "पीला", turuncu: "नारंगी" },
};

export function colorName(key, lang) {
  const dict = COLOR_NAMES[lang] || COLOR_NAMES.tr;
  return dict[key] || COLOR_NAMES.tr[key] || '';
}

// Closest palette key for an exact color (so photo-measured colors still work
// with the harmony rules). Weighted RGB distance is plenty for 16 swatches.
export function nearestColorKey(hex) {
  const toRgb = h => { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const [r, g, b] = toRgb(hex);
  let best = null, bestD = Infinity;
  for (const key of COLOR_KEYS) {
    if (key === 'denim') continue; // too close to blue/navy to pick from pixels alone
    const [r2, g2, b2] = toRgb(COLORS[key].hex);
    const rm = (r + r2) / 2;
    const d = (2 + rm / 256) * (r - r2) ** 2 + 4 * (g - g2) ** 2 + (2 + (255 - rm) / 256) * (b - b2) ** 2;
    if (d < bestD) { bestD = d; best = key; }
  }
  return best;
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
