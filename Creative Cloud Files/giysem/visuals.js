// Big flat illustrations: clothing pieces tinted with the item's real color,
// and animated weather glyphs. Pure SVG strings so they slot into the
// template-literal renderers.

import { COLORS, isValidColor } from './colors.js';

// Fallback color per drawing, for suggestions that don't come from the user's wardrobe.
const DEFAULT_GARMENT_COLOR = {
  tee: '#f3eee4', longsleeve: '#e6ddcb', sweater: '#b7473b', shirt: '#d7e6f5',
  cardigan: '#c8895a', fleece: '#5e7d6a',
  jacket: '#3f5f86', puffer: '#e0603f', coat: '#a8763e', trench: '#cdb07c', windbreaker: '#2f8f8a',
  trousers: '#2f3e5e', chinos: '#c8b48f', jeans: '#3f6496', shorts: '#d9c7a7', skirt: '#6b4a7a', dress: '#e79bb3',
  sneaker: '#f4f2ee', boot: '#6b4a32', sandal: '#b8865b', loafer: '#4a3426',
  umbrella: '#e2564c',
  sweatshirt: '#8a9bb0', hoodie: '#5b6b7d', polo: '#2f6f5e', tank: '#f2f2f2',
  vest: '#2f3e5e', bomber: '#4e5a3a', blazer: '#3a3f4b',
  bag: '#8b5a3c', beanie: '#c94f4f', cap: '#2f3e5e', scarf: '#b7473b',
  blouse: '#f4d6dc', shortshirt: '#dbe8f2',
  wrapcoat: '#c8a27a', pufferw: '#efe6da', cropjacket: '#d8b4a0', blazerw: '#e9dccb', parka: '#4e5a3a', leggings: '#2b2b33', minishorts: '#8fb3d9', sunglasses: '#23262d', catglasses: '#5a2433',
};

// What each wardrobe category draws when nothing more specific is known.
const LIGHT_FRAME = { sunglasses: '#e6d6b8', catglasses: '#f1c3cd' };
const CATEGORY_DEFAULT = { ust: 'tee', ustune: 'cardigan', dis: 'jacket', alt: 'trousers', ayak: 'sneaker', yanina: 'umbrella' };

function clamp(n) { return Math.max(0, Math.min(255, Math.round(n))); }

// Mix a hex color toward black (amt < 0) or white (amt > 0).
export function shade(hex, amt) {
  const h = hex.replace('#', '');
  const num = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  let r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
  const target = amt < 0 ? 0 : 255;
  const p = Math.abs(amt);
  r = clamp(r + (target - r) * p);
  g = clamp(g + (target - g) * p);
  b = clamp(b + (target - b) * p);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

function isLight(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 > 170;
}

let uid = 0;

// Shared silhouettes
const LONG_TOP = 'M40 20 L20 30 L10 88 Q10 91 13 91 H23 Q26 91 26 88 L33 50 V102 Q33 105 36 105 H84 Q87 105 87 102 V50 L94 88 Q94 91 97 91 H107 Q110 91 110 88 L100 30 L80 20 C76 28 69 32 60 32 C51 32 44 28 40 20 Z';
const LONG_COAT = 'M42 15 L21 26 L11 96 Q11 99 14 99 H26 Q29 99 29 96 L33 56 V112 Q33 115 36 115 H84 Q87 115 87 112 V56 L91 96 Q91 99 94 99 H106 Q109 99 109 96 L99 26 L78 15 C74 22 67 25 60 25 C53 25 46 22 42 15 Z';
const SHORT_JACKET = 'M42 15 L21 26 L11 96 Q11 99 14 99 H26 Q29 99 29 96 L33 56 V100 Q33 103 36 103 H84 Q87 103 87 100 V56 L91 96 Q91 99 94 99 H106 Q109 99 109 96 L99 26 L78 15 C74 22 67 25 60 25 C53 25 46 22 42 15 Z';
const WOMEN_COAT = 'M44 15 L24 26 L14 94 Q14 97 17 97 H28 Q31 97 31 94 L36 56 L40 66 Q34 90 30 114 Q30 117 33 117 H87 Q90 117 90 114 Q86 90 80 66 L84 56 L89 94 Q89 97 92 97 H103 Q106 97 106 94 L96 26 L76 15 C72 22 66 25 60 25 C54 25 48 22 44 15 Z';
const SOLE = '<path d="M11 86 H111 V93 Q111 99 105 99 H17 Q11 99 11 93 Z" fill="{L}" stroke="{D}" stroke-width="2"/>';

// Each drawing: main silhouette path + detail markup using {D} (darker) / {L} (lighter).
const GARMENTS = {
  // ---- tops ----
  tee: {
    body: 'M40 22 L17 35 L26 54 L37 49 V99 Q37 102 40 102 H80 Q83 102 83 99 V49 L94 54 L103 35 L80 22 C76 30 69 34 60 34 C51 34 44 30 40 22 Z',
    detail: '<path d="M40 22 C44 30 51 34 60 34 C69 34 76 30 80 22" fill="none" stroke="{D}" stroke-width="3" stroke-linecap="round"/><path d="M37 49 V60 M83 49 V60" stroke="{D}" stroke-width="2" opacity=".35" stroke-linecap="round"/>',
  },
  longsleeve: {
    body: LONG_TOP,
    detail: '<path d="M40 20 C44 28 51 32 60 32 C69 32 76 28 80 20" fill="none" stroke="{D}" stroke-width="3" stroke-linecap="round"/><path d="M12 84 H25 M95 84 H108" stroke="{D}" stroke-width="2.5" stroke-linecap="round" opacity=".6"/>',
  },
  sweater: {
    body: LONG_TOP,
    detail: '<path d="M40 20 C44 28 51 32 60 32 C69 32 76 28 80 20" fill="none" stroke="{D}" stroke-width="5" stroke-linecap="round"/><path d="M33 96 H87" stroke="{D}" stroke-width="2"/><path d="M38 97 V104 M44 97 V104 M50 97 V104 M56 97 V104 M62 97 V104 M68 97 V104 M74 97 V104 M80 97 V104" stroke="{D}" stroke-width="1.6" opacity=".55"/><path d="M11 82 H25 M95 82 H109" stroke="{D}" stroke-width="2"/><path d="M52 40 Q48 48 52 56 Q56 64 52 72 Q48 80 52 88 M68 40 Q72 48 68 56 Q64 64 68 72 Q72 80 68 88" fill="none" stroke="{D}" stroke-width="2.4" opacity=".45"/>',
  },
  // Men's / classic shirt: pointed collar on a stand, shoulder yoke, button
  // placket, flapped chest pocket and buttoned cuffs.
  shirt: {
    body: LONG_TOP,
    detail: '<path d="M33 40 Q60 45 87 40" fill="none" stroke="{D}" stroke-width="1.8" opacity=".4"/><path d="M41 18 L49 40 L60 29 L71 40 L79 18 C73 25 67 28 60 28 C53 28 47 25 41 18 Z" fill="{L}" stroke="{D}" stroke-width="2" stroke-linejoin="round"/><path d="M57 31 V105 M63 31 V105" stroke="{D}" stroke-width="1.6"/><circle cx="60" cy="44" r="1.8" fill="{D}"/><circle cx="60" cy="58" r="1.8" fill="{D}"/><circle cx="60" cy="72" r="1.8" fill="{D}"/><circle cx="60" cy="86" r="1.8" fill="{D}"/><circle cx="60" cy="100" r="1.8" fill="{D}"/><path d="M68 50 H81 V64 Q74.5 67 68 64 Z" fill="none" stroke="{D}" stroke-width="1.8"/><path d="M68 50 H81 V55 H68 Z" fill="{D}" opacity=".3"/><path d="M11.5 80 H25.5 L24 90 H10.5 Z M94.5 80 H108.5 L109.5 90 H96 Z" fill="{D}" opacity=".3"/><circle cx="21" cy="85" r="1.3" fill="{L}"/><circle cx="99" cy="85" r="1.3" fill="{L}"/>',
  },
  // Short-sleeve shirt: boxy cut, pointed collar, placket, chest pocket, rolled sleeve hems.
  shortshirt: {
    body: 'M40 20 L16 32 L24 56 L37 51 V102 Q37 105 40 105 H80 Q83 105 83 102 V51 L96 56 L104 32 L80 20 C76 28 69 31 60 31 C51 31 44 28 40 20 Z',
    detail: '<path d="M16 32 L24 56 L29 54 L21 29.5 Z M104 32 L96 56 L91 54 L99 29.5 Z" fill="{D}" opacity=".3"/><path d="M41 18 L49 40 L60 29 L71 40 L79 18 C73 25 67 28 60 28 C53 28 47 25 41 18 Z" fill="{L}" stroke="{D}" stroke-width="2" stroke-linejoin="round"/><path d="M57 31 V105 M63 31 V105" stroke="{D}" stroke-width="1.6"/><circle cx="60" cy="46" r="1.8" fill="{D}"/><circle cx="60" cy="60" r="1.8" fill="{D}"/><circle cx="60" cy="74" r="1.8" fill="{D}"/><circle cx="60" cy="88" r="1.8" fill="{D}"/><path d="M67 50 H79 V63 Q73 66 67 63 Z" fill="none" stroke="{D}" stroke-width="1.8"/><path d="M37 51 V62 M83 51 V62" stroke="{D}" stroke-width="2" opacity=".3" stroke-linecap="round"/>',
  },
  // Women's blouse: puffed 3/4 sleeves, fitted waist, peplum hem, tie-neck bow.
  blouse: {
    body: 'M44 22 L34 26 C22 26 16 36 18 48 L14 76 Q14 79 17 79 H27 Q30 79 30 76 L35 50 Q36 64 41 76 Q36 90 31 103 Q31 106 34 106 H86 Q89 106 89 103 Q84 90 79 76 Q84 64 85 50 L90 76 Q90 79 93 79 H103 Q106 79 106 76 L102 48 C104 36 98 26 86 26 L76 22 C72 30 66 33 60 33 C54 33 48 30 44 22 Z',
    detail: '<path d="M44 22 C48 30 54 33 60 33 C66 33 72 30 76 22" fill="none" stroke="{D}" stroke-width="2.2"/><path d="M26 30 Q23 37 25 44 M31 28 Q29 34 30 40 M94 30 Q97 37 95 44 M89 28 Q91 34 90 40" fill="none" stroke="{D}" stroke-width="1.6" opacity=".45" stroke-linecap="round"/><path d="M15 73 H29 M91 73 H105" stroke="{D}" stroke-width="2" opacity=".55"/><path d="M41 76 Q60 80 79 76" fill="none" stroke="{D}" stroke-width="2"/><path d="M45 80 L40 104 M60 80 V105 M75 80 L80 104" stroke="{D}" stroke-width="1.4" opacity=".3"/><circle cx="60" cy="50" r="1.4" fill="{D}"/><circle cx="60" cy="60" r="1.4" fill="{D}"/><circle cx="60" cy="70" r="1.4" fill="{D}"/><path d="M60 36 C52 29 46 40 56 40 Z M60 36 C68 29 74 40 64 40 Z" fill="{L}" stroke="{D}" stroke-width="1.6" stroke-linejoin="round"/><path d="M58 39 L53 54 M62 39 L67 54" stroke="{D}" stroke-width="2.2" stroke-linecap="round"/><circle cx="60" cy="37.5" r="2.4" fill="{D}"/>',
  },
  // ---- mid layers ----
  cardigan: {
    body: 'M40 19 L19 30 L12 92 Q12 95 15 95 H26 Q29 95 29 92 L33 52 V102 Q33 105 36 105 H84 Q87 105 87 102 V52 L91 92 Q91 95 94 95 H105 Q108 95 108 92 L101 30 L80 19 L60 62 Z',
    detail: '<path d="M40 19 L60 62 L80 19 C74 25 67 27 60 27 C53 27 46 25 40 19 Z" fill="{L}"/><path d="M60 62 V105" stroke="{D}" stroke-width="2.5"/><circle cx="64.5" cy="72" r="2.4" fill="{D}"/><circle cx="64.5" cy="84" r="2.4" fill="{D}"/><circle cx="64.5" cy="96" r="2.4" fill="{D}"/><path d="M40 19 L60 62 M80 19 L60 62" stroke="{D}" stroke-width="2.5" fill="none"/>',
  },
  fleece: {
    body: 'M44 14 H76 L78 22 L100 30 L110 88 Q110 91 107 91 H97 Q94 91 94 88 L87 50 V102 Q87 105 84 105 H36 Q33 105 33 102 V50 L26 88 Q26 91 23 91 H13 Q10 91 10 88 L20 30 L42 22 Z',
    detail: '<path d="M44 14 H76 L78 24 H42 Z" fill="{D}" opacity=".35"/><path d="M60 14 V105" stroke="{D}" stroke-width="2.5"/><circle cx="60" cy="30" r="3" fill="{L}" stroke="{D}" stroke-width="1.5"/><path d="M33 64 H87" stroke="{D}" stroke-width="2" opacity=".3"/><path d="M11 84 H25 M95 84 H109" stroke="{D}" stroke-width="2.5" stroke-linecap="round" opacity=".6"/>',
  },
  // ---- outerwear ----
  jacket: {
    body: SHORT_JACKET,
    detail: '<path d="M42 15 L50 42 L60 25 Z M78 15 L70 42 L60 25 Z" fill="{D}" opacity=".55"/><path d="M60 25 V103" stroke="{D}" stroke-width="2.5"/><path d="M41 78 H52 M68 78 H79" stroke="{D}" stroke-width="3" stroke-linecap="round"/><path d="M33 56 H87" stroke="{D}" stroke-width="2" opacity=".25"/>',
  },
  puffer: {
    body: LONG_COAT,
    detail: '<path d="M42 18 C40 2 80 2 78 18 C72 24 48 24 42 18 Z" fill="{D}" opacity=".5"/><path d="M60 25 V115" stroke="{D}" stroke-width="2.5"/><path d="M33 44 Q60 50 87 44 M33 62 Q60 68 87 62 M33 80 Q60 86 87 80 M33 98 Q60 104 87 98" fill="none" stroke="{D}" stroke-width="2.4" opacity=".55"/><path d="M24 44 L36 46 M22 62 L34 64 M19 80 L31 82 M96 46 L84 44 M98 64 L86 62 M101 82 L89 80" stroke="{D}" stroke-width="2.2" opacity=".5"/>',
  },
  coat: {
    body: LONG_COAT,
    detail: '<path d="M42 15 L48 48 L56 40 L60 25 Z M78 15 L72 48 L64 40 L60 25 Z" fill="{D}" opacity=".45"/><path d="M60 40 V115" stroke="{D}" stroke-width="2"/><circle cx="53" cy="62" r="2.6" fill="{D}"/><circle cx="67" cy="62" r="2.6" fill="{D}"/><circle cx="53" cy="80" r="2.6" fill="{D}"/><circle cx="67" cy="80" r="2.6" fill="{D}"/><path d="M38 92 H50 M70 92 H82" stroke="{D}" stroke-width="2.5" stroke-linecap="round" opacity=".6"/>',
  },
  trench: {
    body: LONG_COAT,
    detail: '<path d="M42 15 L48 46 L56 38 L60 25 Z M78 15 L72 46 L64 38 L60 25 Z" fill="{D}" opacity=".4"/><path d="M33 66 H87 V74 H33 Z" fill="{D}" opacity=".55"/><rect x="55" y="64.5" width="10" height="11" rx="1.5" fill="none" stroke="{L}" stroke-width="2"/><path d="M60 38 V115" stroke="{D}" stroke-width="2"/><circle cx="52" cy="52" r="2.2" fill="{D}"/><circle cx="68" cy="52" r="2.2" fill="{D}"/><circle cx="52" cy="88" r="2.2" fill="{D}"/><circle cx="68" cy="88" r="2.2" fill="{D}"/>',
  },
  // Women's long wrap coat: nipped waist, tie belt, wide lapels, flared hem.
  wrapcoat: {
    body: WOMEN_COAT,
    detail: '<path d="M44 15 L52 44 L46 48 L60 66 L60 25 Z M76 15 L68 44 L74 48 L60 66 L60 25 Z" fill="{D}" opacity=".4"/><path d="M60 66 L69 116" stroke="{D}" stroke-width="2"/><path d="M39.5 61 Q60 65 80.5 61 L81.5 69 Q60 73 38.5 69 Z" fill="{D}" opacity=".65"/><path d="M63 67 Q61 76 57 86 M66 67 Q68 76 72 84" fill="none" stroke="{D}" stroke-width="3" stroke-linecap="round" opacity=".75"/><path d="M15 88 H30 M90 88 H105" stroke="{D}" stroke-width="2.5" stroke-linecap="round" opacity=".55"/>',
  },
  // Women's long puffer: cinched waist, fur-trimmed hood.
  pufferw: {
    back: 'M42 22 C38 0 82 0 78 22 Z',
    body: WOMEN_COAT,
    detail: '<path d="M40 22 C36 2 84 2 80 22" fill="none" stroke="{L}" stroke-width="7" stroke-linecap="round" stroke-dasharray="1.5 5"/><path d="M60 25 V116" stroke="{D}" stroke-width="2.5"/><path d="M37 40 Q60 45 83 40 M38 52 Q60 57 82 52 M37 82 Q60 87 83 82 M34 98 Q60 103 86 98" fill="none" stroke="{D}" stroke-width="2.2" opacity=".5"/><path d="M39.5 62 Q60 66 80.5 62 L81 68 Q60 72 39 68 Z" fill="{D}" opacity=".6"/><rect x="55" y="62" width="10" height="8" rx="1.5" fill="none" stroke="{L}" stroke-width="2"/><path d="M22 46 L33 48 M19 68 L31 70 M98 48 L87 46 M101 70 L89 68" stroke="{D}" stroke-width="2" opacity=".45"/>',
  },
  // Women's cropped jacket: fitted, ends at the waist, off-centre zip, wide collar.
  cropjacket: {
    body: 'M44 15 L24 26 L14 94 Q14 97 17 97 H28 Q31 97 31 94 L36 54 V78 Q36 81 39 81 H81 Q84 81 84 78 V54 L89 94 Q89 97 92 97 H103 Q106 97 106 94 L96 26 L76 15 C72 22 66 25 60 25 C54 25 48 22 44 15 Z',
    detail: '<path d="M44 15 L50 36 L60 28 Z M76 15 L68 42 L62 29 Z" fill="{D}" opacity=".45"/><path d="M62 29 L69 81" stroke="{D}" stroke-width="2.2"/><rect x="65.4" y="34" width="3.4" height="7" rx="1" fill="{L}" stroke="{D}" stroke-width="1"/><path d="M40 62 L50 58 M80 54 L74 56" stroke="{D}" stroke-width="2.4" stroke-linecap="round"/><path d="M36 74 H84 V81 H36 Z" fill="{D}" opacity=".3"/><path d="M15 88 H30 M90 88 H105" stroke="{D}" stroke-width="2.5" stroke-linecap="round" opacity=".55"/>',
  },
  // Women's longline blazer: one button at a nipped waist, deep lapels.
  blazerw: {
    body: 'M44 15 L24 26 L14 94 Q14 97 17 97 H28 Q31 97 31 94 L36 56 L39 68 Q36 88 34 106 Q34 109 37 109 H83 Q86 109 86 106 Q84 88 81 68 L84 56 L89 94 Q89 97 92 97 H103 Q106 97 106 94 L96 26 L76 15 C72 22 66 25 60 25 C54 25 48 22 44 15 Z',
    detail: '<path d="M44 15 L52 40 L47 44 L60 70 L60 25 Z M76 15 L68 40 L73 44 L60 70 L60 25 Z" fill="{D}" opacity=".4"/><path d="M60 74 L58 109" stroke="{D}" stroke-width="1.6" opacity=".6"/><circle cx="60" cy="74" r="2.8" fill="{D}"/><path d="M40 90 H52 M68 90 H80" stroke="{D}" stroke-width="3" stroke-linecap="round" opacity=".6"/><path d="M15 88 H30 M90 88 H105" stroke="{D}" stroke-width="2" stroke-linecap="round" opacity=".45"/>',
  },
  // Men's parka: long and boxy, fur-trimmed hood, storm flap, four flap pockets, drawcord waist.
  parka: {
    back: 'M42 20 C36 -2 84 -2 78 20 Z',
    body: LONG_COAT,
    detail: '<path d="M42 20 C40 2 80 2 78 20" fill="none" stroke="{L}" stroke-width="6" stroke-linecap="round" stroke-dasharray="1.5 5"/><path d="M57 25 H63 V115 H57 Z" fill="{D}" opacity=".35"/><circle cx="60" cy="40" r="1.6" fill="{L}"/><circle cx="60" cy="60" r="1.6" fill="{L}"/><circle cx="60" cy="80" r="1.6" fill="{L}"/><circle cx="60" cy="100" r="1.6" fill="{L}"/><path d="M38 44 H52 V58 H38 Z M68 44 H82 V58 H68 Z M37 84 H53 V102 H37 Z M67 84 H83 V102 H67 Z" fill="none" stroke="{D}" stroke-width="1.8"/><path d="M38 44 H52 V49 H38 Z M68 44 H82 V49 H68 Z M37 84 H53 V90 H37 Z M67 84 H83 V90 H67 Z" fill="{D}" opacity=".35"/><path d="M33 72 H87" stroke="{D}" stroke-width="2" stroke-dasharray="4 3"/>',
  },
  windbreaker: {
    body: SHORT_JACKET,
    detail: '<path d="M44 16 C42 4 78 4 76 16 C70 21 50 21 44 16 Z" fill="{D}" opacity=".45"/><path d="M33 44 L87 38 V58 L33 64 Z" fill="{L}" opacity=".8"/><path d="M60 22 V103" stroke="{D}" stroke-width="2.5"/><path d="M12 88 H28 M92 88 H108" stroke="{D}" stroke-width="2.5" stroke-linecap="round" opacity=".6"/>',
  },
  // ---- bottoms ----
  trousers: {
    body: 'M35 14 H85 L92 104 Q92 107 89 107 H68 Q65 107 65 104 L60 48 L55 104 Q55 107 52 107 H31 Q28 107 28 104 Z',
    detail: '<path d="M35 14 H85 L85.8 24 H34.2 Z" fill="{D}" opacity=".45"/><path d="M60 24 V44" stroke="{D}" stroke-width="2.5" stroke-linecap="round"/><path d="M42 30 Q44 38 50 40 M78 30 Q76 38 70 40" fill="none" stroke="{D}" stroke-width="2" opacity=".5" stroke-linecap="round"/>',
  },
  jeans: {
    body: 'M35 14 H85 L92 104 Q92 107 89 107 H68 Q65 107 65 104 L60 48 L55 104 Q55 107 52 107 H31 Q28 107 28 104 Z',
    detail: '<path d="M35 14 H85 L85.8 24 H34.2 Z" fill="{D}" opacity=".45"/><path d="M38 24 Q40 36 52 38 M82 24 Q80 36 68 38" fill="none" stroke="#e9b44c" stroke-width="1.8" stroke-dasharray="3 2"/><path d="M60 24 V46" stroke="#e9b44c" stroke-width="1.8" stroke-dasharray="3 2"/><path d="M32 98 H54 M66 98 H89" stroke="{L}" stroke-width="2" opacity=".6"/>',
  },
  // Bermuda shorts (men's / neutral): knee length, belt loops, slant pockets, hem cuff.
  shorts: {
    body: 'M32 26 H88 L93 86 Q93 89 90 89 H66 Q63 89 63 86 L60 54 L57 86 Q57 89 54 89 H30 Q27 89 27 86 Z',
    detail: '<path d="M32 26 H88 L88.8 35 H31.2 Z" fill="{D}" opacity=".45"/><path d="M41 26 V35 M79 26 V35 M60 26 V35" stroke="{D}" stroke-width="2.2"/><path d="M60 35 V51" stroke="{D}" stroke-width="2.2" stroke-linecap="round"/><path d="M36 35 Q40 45 49 46 M84 35 Q80 45 71 46" fill="none" stroke="{D}" stroke-width="2" opacity=".55" stroke-linecap="round"/><path d="M28 80 H57 M63 80 H92" stroke="{D}" stroke-width="2" opacity=".5"/>',
  },
  // Women's shorts: high waist, short flared legs with rolled cuffs.
  minishorts: {
    body: 'M38 24 H82 L90 66 Q91 70 87 70 H66 Q63 70 63 67 L60 56 L57 67 Q57 70 54 70 H33 Q29 70 30 66 Z',
    detail: '<path d="M38 24 H82 L83.6 34 H36.4 Z" fill="{D}" opacity=".4"/><circle cx="60" cy="29" r="2.3" fill="{L}" stroke="{D}" stroke-width="1.3"/><path d="M60 34 V50" stroke="{D}" stroke-width="2" stroke-linecap="round"/><path d="M40 34 Q43 43 51 44 M80 34 Q77 43 69 44" fill="none" stroke="{D}" stroke-width="1.8" opacity=".55" stroke-linecap="round"/><path d="M31 61 H56.5 L57 70 H30 Z M63.5 61 H89 L90 70 H63 Z" fill="{L}" opacity=".7"/><path d="M31 61 H56.5 M63.5 61 H89" stroke="{D}" stroke-width="1.6"/>',
  },
  // Leggings / tights: slim legs, tall waistband, no fly.
  leggings: {
    body: 'M36 14 H84 L86 58 L83 104 Q83 107 80 107 H68 Q65 107 65 104 L60 50 L55 104 Q55 107 52 107 H40 Q37 107 37 104 L34 58 Z',
    detail: '<path d="M36 14 H84 L84.6 25 H35.4 Z" fill="{D}" opacity=".35"/><path d="M38 28 L41 104 M82 28 L79 104" stroke="{D}" stroke-width="1.5" opacity=".3"/><path d="M47 34 L47 96 M73 34 L73 96" stroke="{L}" stroke-width="2.5" opacity=".3" stroke-linecap="round"/>',
  },
  skirt: {
    body: 'M40 24 H80 L97 96 Q98 100 94 100 H26 Q22 100 23 96 Z',
    detail: '<path d="M40 24 H80 L81.6 32 H38.4 Z" fill="{D}" opacity=".45"/><path d="M50 34 L44 98 M60 34 V98 M70 34 L76 98" stroke="{D}" stroke-width="2" opacity=".35"/>',
  },
  dress: {
    body: 'M46 12 L40 22 L37 46 Q30 72 22 104 Q21 108 25 108 H95 Q99 108 98 104 Q90 72 83 46 L80 22 L74 12 C70 20 50 20 46 12 Z',
    detail: '<path d="M37 46 Q60 52 83 46" fill="none" stroke="{D}" stroke-width="2.5"/><path d="M46 12 C50 20 70 20 74 12" fill="none" stroke="{D}" stroke-width="2.5"/><path d="M48 54 L40 104 M60 54 V106 M72 54 L80 104" stroke="{D}" stroke-width="1.8" opacity=".3"/>',
  },
  // ---- shoes ----
  sneaker: {
    body: 'M13 80 C13 63 21 52 30 50 L45 47 C51 56 61 61 75 63 L98 67 C106 69 109 75 109 81 V88 H13 Z',
    detail: SOLE + '<path d="M47 56 L55 52 M53 60 L61 56 M59 63 L67 59" stroke="{D}" stroke-width="2.5" stroke-linecap="round"/><path d="M13 76 Q40 72 62 76" fill="none" stroke="{D}" stroke-width="2" opacity=".35"/>',
  },
  boot: {
    body: 'M28 20 H58 Q61 20 61 23 V58 C61 63 65 67 73 69 L97 75 C105 77 109 83 109 89 V92 H24 V24 Q24 20 28 20 Z',
    detail: '<path d="M22 90 H111 V97 Q111 103 105 103 H28 Q22 103 22 97 Z" fill="{D}" opacity=".85"/><path d="M24 26 H61" stroke="{D}" stroke-width="3"/><path d="M50 32 L60 36 M50 42 L60 46 M50 52 L60 56" stroke="{L}" stroke-width="2.4" stroke-linecap="round"/><path d="M24 74 Q50 70 72 74" fill="none" stroke="{D}" stroke-width="2" opacity=".35"/>',
  },
  sandal: {
    body: 'M12 88 C12 82 18 80 28 80 H96 C104 80 109 83 109 89 V93 H12 Z',
    detail: '<path d="M36 82 C38 64 56 60 62 82 M70 82 C74 64 90 64 94 82 M24 82 C24 72 30 66 36 64" fill="none" stroke="{D}" stroke-width="5" stroke-linecap="round"/><path d="M12 92 H109 V96 Q109 100 105 100 H16 Q12 100 12 96 Z" fill="{D}" opacity=".7"/>',
  },
  loafer: {
    body: 'M13 84 C13 72 21 66 31 65 L58 63 C66 69 80 71 98 73 C106 74 109 79 109 85 V90 H13 Z',
    detail: '<path d="M11 88 H111 V94 Q111 99 106 99 H16 Q11 99 11 94 Z" fill="{D}" opacity=".8"/><path d="M58 70 Q74 74 86 74" fill="none" stroke="{D}" stroke-width="3"/><rect x="66" y="72" width="10" height="4" rx="2" fill="{L}" opacity=".8"/>',
  },
  sweatshirt: {
    body: LONG_TOP,
    detail: '<path d="M40 20 C44 28 51 32 60 32 C69 32 76 28 80 20" fill="none" stroke="{D}" stroke-width="5" stroke-linecap="round"/><path d="M33 96 H87 V105 H33 Z" fill="{D}" opacity=".3"/><path d="M10 82 H26 V91 H10 Z M94 82 H110 V91 H94 Z" fill="{D}" opacity=".3"/>',
  },
  hoodie: {
    back: 'M42 24 C38 2 82 2 78 24 Z',
    body: LONG_TOP,
    detail: '<path d="M42 22 C46 30 52 34 60 34 C68 34 74 30 78 22" fill="none" stroke="{D}" stroke-width="3"/><path d="M55 34 V48 M65 34 V48" stroke="{L}" stroke-width="2" stroke-linecap="round"/><path d="M42 80 H78 L83 100 H37 Z" fill="none" stroke="{D}" stroke-width="2.2" stroke-linejoin="round"/><path d="M33 96 H87 V105 H33 Z" fill="{D}" opacity=".25"/>',
  },
  polo: {
    body: 'M40 22 L17 35 L26 54 L37 49 V99 Q37 102 40 102 H80 Q83 102 83 99 V49 L94 54 L103 35 L80 22 C76 30 69 34 60 34 C51 34 44 30 40 22 Z',
    detail: '<path d="M44 21 L52 33 L60 30 Z M76 21 L68 33 L60 30 Z" fill="{L}" stroke="{D}" stroke-width="2" stroke-linejoin="round"/><path d="M60 30 V52" stroke="{D}" stroke-width="2"/><circle cx="62.5" cy="38" r="1.6" fill="{D}"/><circle cx="62.5" cy="46" r="1.6" fill="{D}"/>',
  },
  tank: {
    body: 'M44 18 Q46 36 60 38 Q74 36 76 18 L84 20 Q82 40 86 50 V100 Q86 103 83 103 H37 Q34 103 34 100 V50 Q38 40 36 20 Z',
    detail: '<path d="M44 18 Q46 36 60 38 Q74 36 76 18" fill="none" stroke="{D}" stroke-width="2.5"/>',
  },
  vest: {
    body: 'M44 16 L36 22 Q38 40 34 50 V102 Q34 105 37 105 H83 Q86 105 86 102 V50 Q82 40 84 22 L76 16 C72 22 66 25 60 25 C54 25 48 22 44 16 Z',
    detail: '<path d="M60 25 V105" stroke="{D}" stroke-width="2.5"/><path d="M35 46 Q60 52 85 46 M34 64 Q60 70 86 64 M34 82 Q60 88 86 82" fill="none" stroke="{D}" stroke-width="2.2" opacity=".5"/>',
  },
  bomber: {
    body: SHORT_JACKET,
    detail: '<path d="M44 16 C48 26 54 29 60 29 C66 29 72 26 76 16" fill="none" stroke="{D}" stroke-width="6" stroke-linecap="round"/><path d="M33 94 H87 V103 H33 Z M11 88 H29 V98 H11 Z M91 88 H109 V98 H91 Z" fill="{D}" opacity=".35"/><path d="M60 29 V94" stroke="{D}" stroke-width="2.5"/><path d="M18 44 H26 V54 H18 Z" fill="none" stroke="{D}" stroke-width="1.6"/>',
  },
  blazer: {
    body: 'M42 15 L21 26 L11 96 Q11 99 14 99 H26 Q29 99 29 96 L33 56 V108 Q33 111 36 111 H84 Q87 111 87 108 V56 L91 96 Q91 99 94 99 H106 Q109 99 109 96 L99 26 L78 15 C74 22 67 25 60 25 C53 25 46 22 42 15 Z',
    detail: '<path d="M42 15 L50 40 L46 44 L58 70 L60 25 Z M78 15 L70 40 L74 44 L62 70 L60 25 Z" fill="{D}" opacity=".4"/><path d="M60 70 V111" stroke="{D}" stroke-width="1.8"/><circle cx="64" cy="78" r="2.2" fill="{D}"/><circle cx="64" cy="90" r="2.2" fill="{D}"/><path d="M38 88 H52 M68 88 H82" stroke="{D}" stroke-width="3" stroke-linecap="round" opacity=".6"/>',
  },
  // ---- accessories ----
  umbrella: {
    body: 'M12 62 C12 36 34 18 60 18 C86 18 108 36 108 62 C102 56 94 56 88 62 C82 56 74 56 68 62 C64 57 56 57 52 62 C46 56 38 56 32 62 C26 56 18 56 12 62 Z',
    detail: '<path d="M60 18 V12" stroke="{D}" stroke-width="3" stroke-linecap="round"/><path d="M60 18 C50 30 46 46 52 62 M60 18 C70 30 74 46 68 62 M60 18 C40 26 30 44 32 62 M60 18 C80 26 90 44 88 62" fill="none" stroke="{D}" stroke-width="2" opacity=".4"/><path d="M60 60 V96 Q60 104 52 104 Q45 104 45 97" fill="none" stroke="#5b4636" stroke-width="4.5" stroke-linecap="round"/>',
  },
  bag: {
    back: 'M42 58 Q42 26 60 26 Q78 26 78 58 H72 Q72 34 60 34 Q48 34 48 58 Z',
    body: 'M28 56 H92 L98 104 Q98 108 94 108 H26 Q22 108 22 104 Z',
    detail: '<path d="M28 56 H92 L93 66 H27 Z" fill="{D}" opacity=".35"/><rect x="54" y="62" width="12" height="9" rx="2" fill="{L}" stroke="{D}" stroke-width="1.6"/>',
  },
  beanie: {
    body: 'M30 86 Q30 42 60 40 Q90 42 90 86 Z',
    detail: '<path d="M27 80 H93 V98 Q93 100 91 100 H29 Q27 100 27 98 Z" fill="{D}" opacity=".45"/><path d="M34 82 V98 M42 82 V98 M50 82 V98 M58 82 V98 M66 82 V98 M74 82 V98 M82 82 V98" stroke="{D}" stroke-width="1.6" opacity=".5"/><circle cx="60" cy="34" r="9" fill="{L}" stroke="{D}" stroke-width="2"/>',
  },
  cap: {
    body: 'M26 80 Q26 44 60 42 Q92 44 92 80 Z',
    detail: '<path d="M70 80 H110 Q108 92 92 92 H70 Z" fill="{D}" opacity=".6"/><path d="M60 42 V80 M42 48 Q46 64 44 80 M78 48 Q74 64 76 80" fill="none" stroke="{D}" stroke-width="1.6" opacity=".45"/><circle cx="60" cy="42" r="3" fill="{D}"/>',
  },
  // Men's sunglasses: square wayfarer frame with a heavy brow bar.
  sunglasses: {
    body: 'M10 46 H110 V54 Q110 58 107 58 L104 74 Q102 84 90 84 H74 Q64 84 63 74 L62 61 Q60 57 58 61 L57 74 Q56 84 46 84 H30 Q18 84 16 74 L13 58 Q10 58 10 54 Z',
    detail: '<path d="M18 56 H56 L55 73 Q54 79 46 79 H31 Q22 79 21 73 Z M64 56 H102 L99 73 Q98 79 89 79 H74 Q66 79 65 73 Z" fill="{LENS}"/><path d="M24 61 L34 61 M70 61 L80 61" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".45"/><path d="M10 50 L3 47 M110 50 L117 47" stroke="{D}" stroke-width="3" stroke-linecap="round"/><circle cx="15" cy="51" r="1.5" fill="{L}"/><circle cx="105" cy="51" r="1.5" fill="{L}"/>',
  },
  // Women's sunglasses: cat-eye frame with swept-up outer corners.
  catglasses: {
    body: 'M8 42 Q22 48 36 49 Q50 49 57 54 Q59 65 55 73 Q48 85 34 83 Q17 81 13 68 Q9 56 8 42 Z M112 42 Q98 48 84 49 Q70 49 63 54 Q61 65 65 73 Q72 85 86 83 Q103 81 107 68 Q111 56 112 42 Z',
    detail: '<path d="M15 51 Q27 54 37 55 Q48 55 52 58 Q53 65 50 71 Q45 79 35 77 Q22 76 19 67 Q16 59 15 51 Z M105 51 Q93 54 83 55 Q72 55 68 58 Q67 65 70 71 Q75 79 85 77 Q98 76 101 67 Q104 59 105 51 Z" fill="{LENS}"/><path d="M57 57 Q60 53 63 57" fill="none" stroke="{D}" stroke-width="3" stroke-linecap="round"/><path d="M24 60 Q30 59 34 61 M88 60 Q93 59 97 61" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".45" fill="none"/><circle cx="12" cy="46" r="1.8" fill="{L}"/><circle cx="108" cy="46" r="1.8" fill="{L}"/><circle cx="16.5" cy="47.5" r="1.2" fill="{L}"/><circle cx="103.5" cy="47.5" r="1.2" fill="{L}"/>',
  },
  scarf: {
    body: 'M36 28 Q60 40 84 28 L88 44 Q60 58 32 44 Z M62 48 L58 102 H74 L78 50 Z',
    detail: '<path d="M60 102 V110 M64 102 V110 M68 102 V110 M72 102 V110" stroke="{D}" stroke-width="1.6"/><path d="M36 34 Q60 46 84 34" fill="none" stroke="{D}" stroke-width="1.6" opacity=".4"/>',
  },
};

// Words in an item's name (any of our languages) that tell us which drawing fits.
// For layers (tops, mid layers, outerwear) the warmest piece mentioned wins, so
// "t-shirt with a thick sweater on top" draws the sweater: lists are warmest first.
// For bottoms and shoes the piece mentioned first wins ("sneakers or boots" -> sneakers).
const KEYWORDS = {
  ust: [
    ['hoodie', ['kapüşonlu', 'hoodie', 'con capucha', 'z kapturem', 'kapuzen']],
    ['sweater', ['kazak', 'triko', 'balıkçı', 'sweater', 'jumper', 'knit', 'suéter', 'sweter', 'كنزة', 'pullover', 'strickpulli', 'rollkragen']],
    ['sweatshirt', ['sweatshirt', 'sweat', 'sudadera', 'bluza']],
    ['polo', ['polo']],
    ['shirt', ['gömlek', 'shirt', 'camisa', 'koszula', 'قميص', 'hemd']],
    ['longsleeve', ['uzun kollu', 'termal', 'long sleeve', 'long-sleeve', 'thermal', 'manga larga', 'longsleeve', 'golf', 'langarm']],
    ['tank', ['atlet', 'askılı', 'tank top', 'camisole', 'strappy', 'tirantes', 'tanktop', 'trägertop']],
    ['blouse', ['bluz', 'blouse', 'blusa', 'bluzka', 'بلوزة', 'bluse']],
    ['tee', ['tişört', 't-shirt', 'tshirt', 'tee', 'camiseta', 'koszulka', 'تيشيرت']],
  ],
  ustune: [
    ['hoodie', ['kapüşonlu', 'hoodie', 'con capucha', 'z kapturem']],
    ['fleece', ['polar', 'fleece', 'forro']],
    ['sweatshirt', ['sweatshirt', 'sudadera', 'bluza']],
    ['vest', ['yelek', 'vest', 'gilet', 'chaleco', 'kamizelka', 'weste']],
    ['cardigan', ['hırka', 'cardigan', 'rebeca', 'kardigan', 'سترة', 'strickjacke']],
    ['shirt', ['gömlek', 'shirt', 'camisa', 'koszula']],
  ],
  dis: [
    ['parka', ['parka']],
    ['puffer', ['şişme', 'puf', 'puffer', 'down', 'kaz tüyü', 'dizüstü', 'knee-length', 'plumífero', 'puchowa', 'daunen', 'stepp']],
    ['trench', ['trençkot', 'trenchcoat', 'trench', 'gabardina', 'trencz']],
    ['coat', ['kaban', 'palto', 'coat', 'abrigo', 'płaszcz', 'معطف', 'mantel']],
    ['bomber', ['bomber']],
    ['blazer', ['blazer', 'americana', 'marynarka', 'takım ceket']],
    ['vest', ['şişme yelek', 'yelek', 'vest', 'gilet', 'chaleco', 'kamizelka']],
    ['windbreaker', ['yağmurluk', 'rüzgarlık', 'rüzgar geçirmez', 'windbreaker', 'windproof', 'raincoat', 'cortavientos', 'wiatrówka', 'windjacke', 'regenjacke']],
    ['jacket', ['ceket', 'mont', 'jacket', 'blazer', 'hırka', 'chaqueta', 'kurtka', 'جاكيت', 'jacke']],
  ],
  alt: [
    ['dress', ['elbise', 'dress', 'vestido', 'sukienka', 'فستان', 'kleid']],
    ['skirt', ['etek', 'skirt', 'falda', 'spódnica', 'تنورة', 'rock']],
    ['shorts', ['şort', 'short', 'pantalón corto', 'szorty', 'شورت']],
    ['leggings', ['tayt', 'legging', 'tights', 'mallas', 'leginsy', 'rajstopy', 'strumpfhose']],
    ['jeans', ['kot', 'jean', 'denim', 'vaquero', 'dżinsy', 'جينز']],
    ['trousers', ['pantolon', 'chino', 'trouser', 'pant', 'eşofman', 'jogger', 'pantalón', 'spodnie', 'بنطال', 'hose']],
  ],
  ayak: [
    ['boot', ['bot', 'çizme', 'boot', 'bota', 'kozaki', 'buty zimowe', 'حذاء طويل', 'stiefel']],
    ['sandal', ['sandalet', 'terlik', 'sandal', 'flip', 'chancla', 'sandał', 'صندل', 'sandale']],
    ['loafer', ['makosen', 'loafer', 'oxford', 'mokasyn', 'mocasín', 'babet']],
    ['sneaker', ['spor ayakkabı', 'sneaker', 'trainer', 'zapatilla', 'tenis', 'adidasy', 'ayakkabı', 'shoe', 'turnschuh', 'schuh']],
  ],
  yanina: [
    ['sunglasses', ['güneş gözlüğü', 'gözlük', 'sunglasses', 'shades', 'gafas de sol', 'okulary', 'نظارة', 'sonnenbrille']],
    ['umbrella', ['şemsiye', 'umbrella', 'paraguas', 'parasol', 'مظلة', 'schirm']],
    ['bag', ['çanta', 'bag', 'bolso', 'torba', 'حقيبة', 'tasche']],
    ['beanie', ['bere', 'beanie', 'gorro', 'czapka', 'mütze']],
    ['cap', ['şapka', 'kasket', 'cap', 'gorra', 'kappe']],
    ['scarf', ['atkı', 'şal', 'scarf', 'bufanda', 'szalik', 'وشاح', 'schal']],
  ],
};

// Picks which drawing to use for a piece: the item's own words first,
// then how warm it is (1 = thinnest .. 5 = winter).
export function garmentVariant(category, text = '', warmth = 3) {
  // "T-shirt" contains "shirt": read it as a tee before matching.
  const lower = String(text || '').toLocaleLowerCase('tr').replace(/t-?shirt/g, 'tee');
  const byPriority = category === 'ust' || category === 'ustune' || category === 'dis';
  let best = null, bestPos = Infinity;
  for (const [variant, words] of KEYWORDS[category] || []) {
    const pos = Math.min(...words.map(w => { const i = lower.indexOf(w); return i === -1 ? Infinity : i; }));
    if (pos === Infinity) continue;
    if (byPriority) { best = variant; break; }
    if (pos < bestPos) { best = variant; bestPos = pos; }
  }
  // Tights worn under a dress or skirt: the dress/skirt is the look.
  if (best === 'leggings' && /elbise|dress|vestido|sukienka|etek|skirt|falda|spódnica/.test(lower)) {
    return /elbise|dress|vestido|sukienka/.test(lower) ? 'dress' : 'skirt';
  }
  // "Kot şort" / "denim shorts": the cut (shorts) matters more than the fabric.
  if (best === 'jeans' && /şort|short|szorty|شورت/.test(lower)) return 'shorts';
  if (best === 'shirt' && /kısa kol|short-sleeve|short sleeve|manga corta|krótki rękaw/.test(lower)) return 'shortshirt';
  // Light-weather trousers read better as beige chinos than dark formal pants.
  if (best === 'trousers' && warmth <= 2) return 'chinos';
  if (best) return best;
  switch (category) {
    case 'ust': return warmth >= 4 ? 'sweater' : warmth === 3 ? 'longsleeve' : 'tee';
    case 'ustune': return warmth >= 4 ? 'fleece' : 'cardigan';
    case 'dis': return warmth >= 5 ? 'puffer' : warmth === 4 ? 'coat' : warmth === 3 ? 'jacket' : 'windbreaker';
    case 'alt': return warmth <= 1 ? 'shorts' : warmth === 2 ? 'chinos' : warmth >= 4 ? 'jeans' : 'trousers';
    case 'ayak': return warmth >= 4 ? 'boot' : warmth <= 1 ? 'sandal' : 'sneaker';
    default: return CATEGORY_DEFAULT[category] || 'tee';
  }
}

// Which drawings make sense for each wardrobe category (the editor's style picker).
export const STYLE_OPTIONS = {
  ust: ['tee', 'longsleeve', 'sweater', 'sweatshirt', 'hoodie', 'shirt', 'shortshirt', 'blouse', 'polo', 'tank'],
  ustune: ['cardigan', 'fleece', 'hoodie', 'sweatshirt', 'vest', 'shirt'],
  dis: ['jacket', 'puffer', 'coat', 'trench', 'windbreaker', 'bomber', 'blazer', 'vest', 'parka', 'wrapcoat', 'pufferw', 'cropjacket', 'blazerw'],
  alt: ['trousers', 'chinos', 'jeans', 'leggings', 'shorts', 'minishorts', 'skirt', 'dress'],
  ayak: ['sneaker', 'boot', 'sandal', 'loafer'],
  yanina: ['umbrella', 'bag', 'beanie', 'cap', 'scarf', 'sunglasses', 'catglasses'],
};
export const PATTERN_TYPES = ['solid', 'stripes', 'checks', 'dots', 'floral', 'print'];
export const DETAIL_KEYS = ['hood', 'zip', 'buttons', 'pocket', 'logo'];

// Where details can be drawn on each drawing family (neckline, hem, chest spot).
const LONG = { neck: 32, shoulder: 20, bottom: 104, chest: [70, 50], pocket: 'kangaroo' };
const ZONES = {
  tee: { neck: 34, shoulder: 22, bottom: 101, chest: [70, 52], pocket: 'kangaroo' },
  polo: { neck: 34, shoulder: 22, bottom: 101, chest: [70, 54], pocket: 'kangaroo' },
  tank: { neck: 38, shoulder: 18, bottom: 102, chest: [68, 56], pocket: 'kangaroo' },
  longsleeve: LONG, sweater: LONG, sweatshirt: LONG, hoodie: { ...LONG, hasHood: true }, shirt: { ...LONG, pocket: 'patch' },
  shortshirt: { neck: 31, shoulder: 20, bottom: 104, chest: [70, 52], pocket: 'patch' },
  blouse: { neck: 34, shoulder: 24, bottom: 104, chest: [70, 54], pocket: 'patch' },
  cardigan: { neck: 62, shoulder: 19, bottom: 104, chest: [72, 70], pocket: 'patch', open: true },
  fleece: { neck: 24, shoulder: 14, bottom: 104, chest: [72, 46], pocket: 'patch' },
  vest: { neck: 25, shoulder: 16, bottom: 104, chest: [72, 46], pocket: 'patch' },
  jacket: { neck: 25, shoulder: 15, bottom: 102, chest: [72, 46], pocket: 'patch' },
  bomber: { neck: 29, shoulder: 15, bottom: 94, chest: [72, 48], pocket: 'patch' },
  blazer: { neck: 70, shoulder: 15, bottom: 110, chest: [74, 50], pocket: 'patch', open: true },
  windbreaker: { neck: 25, shoulder: 15, bottom: 102, chest: [72, 70], pocket: 'patch', hasHood: true },
  puffer: { neck: 25, shoulder: 15, bottom: 114, chest: [72, 54], pocket: 'patch', hasHood: true },
  coat: { neck: 40, shoulder: 15, bottom: 114, chest: [74, 50], pocket: 'patch' },
  trench: { neck: 38, shoulder: 15, bottom: 114, chest: [74, 50], pocket: 'patch' },
  parka: { neck: 25, shoulder: 15, bottom: 114, chest: [74, 50], pocket: 'patch', hasHood: true },
  wrapcoat: { neck: 50, shoulder: 15, bottom: 116, chest: [74, 50], pocket: 'patch', open: true },
  pufferw: { neck: 25, shoulder: 15, bottom: 116, chest: [72, 48], pocket: 'patch', hasHood: true },
  cropjacket: { neck: 30, shoulder: 15, bottom: 80, chest: [74, 46], pocket: 'patch' },
  blazerw: { neck: 70, shoulder: 15, bottom: 108, chest: [74, 50], pocket: 'patch', open: true },
};

const LABELS = {
  tr: { tee: 'Tişört', longsleeve: 'Uzun kollu', sweater: 'Kazak', sweatshirt: 'Sweatshirt', hoodie: 'Kapüşonlu', shirt: 'Gömlek', polo: 'Polo', tank: 'Atlet',
    cardigan: 'Hırka', fleece: 'Polar', vest: 'Yelek', jacket: 'Ceket', puffer: 'Şişme mont', coat: 'Kaban', trench: 'Trençkot', windbreaker: 'Rüzgarlık', bomber: 'Bomber', blazer: 'Blazer',
    trousers: 'Pantolon', chinos: 'Chino', jeans: 'Kot', shorts: 'Şort', skirt: 'Etek', dress: 'Elbise',
    sneaker: 'Spor ayakkabı', boot: 'Bot', sandal: 'Sandalet', loafer: 'Makosen', umbrella: 'Şemsiye', bag: 'Çanta', beanie: 'Bere', cap: 'Şapka', scarf: 'Atkı',
    shortshirt: 'Kısa kollu gömlek', blouse: 'Bluz', parka: 'Parka', wrapcoat: 'Kuşaklı kaban', pufferw: 'Uzun şişme mont', cropjacket: 'Kısa ceket', blazerw: 'Uzun blazer', leggings: 'Tayt', minishorts: 'Kadın şortu', sunglasses: 'Güneş gözlüğü', catglasses: 'Kedi göz gözlük' },
  en: { tee: 'T-shirt', longsleeve: 'Long sleeve', sweater: 'Sweater', sweatshirt: 'Sweatshirt', hoodie: 'Hoodie', shirt: 'Shirt', polo: 'Polo', tank: 'Tank top',
    cardigan: 'Cardigan', fleece: 'Fleece', vest: 'Vest', jacket: 'Jacket', puffer: 'Puffer', coat: 'Coat', trench: 'Trench coat', windbreaker: 'Windbreaker', bomber: 'Bomber', blazer: 'Blazer',
    trousers: 'Trousers', chinos: 'Chinos', jeans: 'Jeans', shorts: 'Shorts', skirt: 'Skirt', dress: 'Dress',
    sneaker: 'Sneakers', boot: 'Boots', sandal: 'Sandals', loafer: 'Loafers', umbrella: 'Umbrella', bag: 'Bag', beanie: 'Beanie', cap: 'Cap', scarf: 'Scarf',
    shortshirt: 'Short-sleeve shirt', blouse: 'Blouse', parka: 'Parka', wrapcoat: 'Wrap coat', pufferw: 'Long puffer', cropjacket: 'Cropped jacket', blazerw: 'Long blazer', leggings: 'Leggings', minishorts: "Women's shorts", sunglasses: 'Sunglasses', catglasses: 'Cat-eye sunglasses' },
  es: { tee: 'Camiseta', longsleeve: 'Manga larga', sweater: 'Jersey', sweatshirt: 'Sudadera', hoodie: 'Sudadera con capucha', shirt: 'Camisa', polo: 'Polo', tank: 'Camiseta de tirantes',
    cardigan: 'Chaqueta de punto', fleece: 'Forro polar', vest: 'Chaleco', jacket: 'Chaqueta', puffer: 'Plumífero', coat: 'Abrigo', trench: 'Gabardina', windbreaker: 'Cortavientos', bomber: 'Bomber', blazer: 'Blazer',
    trousers: 'Pantalón', chinos: 'Chinos', jeans: 'Vaqueros', shorts: 'Pantalón corto', skirt: 'Falda', dress: 'Vestido',
    sneaker: 'Zapatillas', boot: 'Botas', sandal: 'Sandalias', loafer: 'Mocasines', umbrella: 'Paraguas', bag: 'Bolso', beanie: 'Gorro', cap: 'Gorra', scarf: 'Bufanda',
    shortshirt: 'Camisa de manga corta', blouse: 'Blusa', parka: 'Parka', wrapcoat: 'Abrigo cruzado', pufferw: 'Plumífero largo', cropjacket: 'Chaqueta corta', blazerw: 'Blazer larga', leggings: 'Mallas', minishorts: 'Shorts de mujer', sunglasses: 'Gafas de sol', catglasses: 'Gafas cat-eye' },
  pl: { tee: 'T-shirt', longsleeve: 'Długi rękaw', sweater: 'Sweter', sweatshirt: 'Bluza', hoodie: 'Bluza z kapturem', shirt: 'Koszula', polo: 'Polo', tank: 'Koszulka na ramiączkach',
    cardigan: 'Kardigan', fleece: 'Polar', vest: 'Kamizelka', jacket: 'Kurtka', puffer: 'Kurtka puchowa', coat: 'Płaszcz', trench: 'Trencz', windbreaker: 'Wiatrówka', bomber: 'Bomberka', blazer: 'Marynarka',
    trousers: 'Spodnie', chinos: 'Chinosy', jeans: 'Dżinsy', shorts: 'Szorty', skirt: 'Spódnica', dress: 'Sukienka',
    sneaker: 'Sneakersy', boot: 'Kozaki', sandal: 'Sandały', loafer: 'Mokasyny', umbrella: 'Parasol', bag: 'Torba', beanie: 'Czapka', cap: 'Czapka z daszkiem', scarf: 'Szalik',
    shortshirt: 'Koszula z krótkim rękawem', blouse: 'Bluzka', parka: 'Parka', wrapcoat: 'Płaszcz z paskiem', pufferw: 'Długa puchówka', cropjacket: 'Krótka kurtka', blazerw: 'Długa marynarka', leggings: 'Legginsy', minishorts: 'Szorty damskie', sunglasses: 'Okulary przeciwsłoneczne', catglasses: 'Okulary kocie oko' },
  ar: { tee: 'تيشيرت', longsleeve: 'أكمام طويلة', sweater: 'كنزة', sweatshirt: 'سويت شيرت', hoodie: 'هودي', shirt: 'قميص', polo: 'بولو', tank: 'قميص بلا أكمام',
    cardigan: 'كارديغان', fleece: 'فليس', vest: 'صديري', jacket: 'جاكيت', puffer: 'جاكيت منفوخ', coat: 'معطف', trench: 'ترنش كوت', windbreaker: 'جاكيت واقٍ من الريح', bomber: 'بومبر', blazer: 'بليزر',
    trousers: 'بنطال', chinos: 'تشينو', jeans: 'جينز', shorts: 'شورت', skirt: 'تنورة', dress: 'فستان',
    sneaker: 'حذاء رياضي', boot: 'بوت', sandal: 'صندل', loafer: 'لوفر', umbrella: 'مظلة', bag: 'حقيبة', beanie: 'قبعة صوف', cap: 'قبعة', scarf: 'وشاح',
    shortshirt: 'قميص بأكمام قصيرة', blouse: 'بلوزة', parka: 'باركا', wrapcoat: 'معطف بحزام', pufferw: 'معطف منفوخ طويل', cropjacket: 'جاكيت قصير', blazerw: 'بليزر طويل', leggings: 'ليقنز', minishorts: 'شورت نسائي', sunglasses: 'نظارة شمسية', catglasses: 'نظارة عين القطة' },
  de: { tee: 'T-Shirt', longsleeve: 'Langarmshirt', sweater: 'Pullover', sweatshirt: 'Sweatshirt', hoodie: 'Hoodie', shirt: 'Hemd', polo: 'Poloshirt', tank: 'Tanktop',
    cardigan: 'Strickjacke', fleece: 'Fleece', vest: 'Weste', jacket: 'Jacke', puffer: 'Daunenjacke', coat: 'Mantel', trench: 'Trenchcoat', windbreaker: 'Windjacke', bomber: 'Bomberjacke', blazer: 'Blazer',
    trousers: 'Hose', chinos: 'Chinos', jeans: 'Jeans', shorts: 'Shorts', skirt: 'Rock', dress: 'Kleid',
    sneaker: 'Sneaker', boot: 'Stiefel', sandal: 'Sandalen', loafer: 'Loafer', umbrella: 'Regenschirm', bag: 'Tasche', beanie: 'Mütze', cap: 'Cap', scarf: 'Schal',
    shortshirt: 'Kurzarmhemd', blouse: 'Bluse', parka: 'Parka', wrapcoat: 'Wickelmantel', pufferw: 'Lange Daunenjacke', cropjacket: 'Kurze Jacke', blazerw: 'Langer Blazer', leggings: 'Leggings', minishorts: 'Damenshorts', sunglasses: 'Sonnenbrille', catglasses: 'Cat-Eye-Sonnenbrille' },
};
export function styleLabel(name, lang) {
  return (LABELS[lang] || (lang === 'tr' ? LABELS.tr : LABELS.en))[name] || name;
}

// Everything needed to draw one wardrobe item, from whatever it has stored.
// Older items (before smart drawing) fall back to name/warmth guesses and palette colors.
export function itemLook(item) {
  const options = STYLE_OPTIONS[item.category] || [];
  const art = options.includes(item.art) ? item.art : garmentVariant(item.category, item.name, item.warmth || 3);
  const color = item.hex || (isValidColor(item.color) ? COLORS[item.color].hex : null);
  const color2 = item.hex2 || (isValidColor(item.color2) ? COLORS[item.color2].hex : null);
  const patternType = PATTERN_TYPES.includes(item.patternType) ? item.patternType : (item.pattern === 'desenli' ? 'stripes' : 'solid');
  return { art, color, color2, patternType, details: item.details || {} };
}

function patternDefs(id, type, fill, c2) {
  const ink = c2 || (isLight(fill) ? shade(fill, -0.45) : shade(fill, 0.6));
  const op = c2 ? 0.95 : 0.55;
  switch (type) {
    case 'stripes': return `<pattern id="${id}" width="10" height="9" patternUnits="userSpaceOnUse"><rect y="0" width="10" height="3.6" fill="${ink}" opacity="${op}"/></pattern>`;
    case 'checks': return `<pattern id="${id}" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="4.5" height="12" fill="${ink}" opacity="${op * 0.55}"/><rect width="12" height="4.5" fill="${ink}" opacity="${op * 0.55}"/><rect width="12" height="0.8" y="8" fill="${ink}" opacity="${op * 0.7}"/></pattern>`;
    case 'dots': return `<pattern id="${id}" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="4.5" cy="4.5" r="1.7" fill="${ink}" opacity="${op}"/></pattern>`;
    case 'floral': return `<pattern id="${id}" width="16" height="16" patternUnits="userSpaceOnUse">${[[8, 5], [11, 8], [8, 11], [5, 8]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="${ink}" opacity="${op}"/>`).join('')}<circle cx="8" cy="8" r="1.4" fill="${isLight(fill) ? '#e9b44c' : '#fff3c4'}"/></pattern>`;
    default: return '';
  }
}

function detailOverlays(name, d, fill, c2, dark, light) {
  const z = ZONES[name];
  if (!z) return { back: '', front: '' };
  let back = '', front = '';
  if (d.hood && !z.hasHood && name !== 'tank') {
    back += `<path d="M42 ${z.shoulder + 6} C38 ${z.shoulder - 18} 82 ${z.shoulder - 18} 78 ${z.shoulder + 6} Z" fill="${shade(fill, -0.2)}" stroke="${dark}" stroke-width="2.5"/>`;
    front += `<path d="M55 ${z.neck} v12 M65 ${z.neck} v12" stroke="${light}" stroke-width="2" stroke-linecap="round"/>`;
  }
  if (d.zip && !z.open) front += `<path d="M60 ${z.neck} V${z.bottom}" stroke="${dark}" stroke-width="2.2"/><rect x="58.2" y="${z.neck + 3}" width="3.6" height="8" rx="1" fill="${light}" stroke="${dark}" stroke-width="1"/>`;
  if (d.buttons && !d.zip) {
    for (let y = z.neck + 9; y < z.bottom - 4; y += 12) front += `<circle cx="64" cy="${y}" r="2" fill="${dark}"/>`;
    if (!z.open) front += `<path d="M60 ${z.neck} V${z.bottom}" stroke="${dark}" stroke-width="1.4" opacity=".6"/>`;
  }
  if (d.pocket) {
    front += z.pocket === 'kangaroo'
      ? `<path d="M43 ${z.bottom - 26} H77 L81 ${z.bottom - 6} H39 Z" fill="none" stroke="${dark}" stroke-width="2" stroke-linejoin="round"/>`
      : `<path d="M39 ${z.bottom - 30} h14 v13 h-14 Z M67 ${z.bottom - 30} h14 v13 h-14 Z" fill="none" stroke="${dark}" stroke-width="1.8"/>`;
  }
  if (d.logo) {
    const [x, y] = z.chest;
    front += `<rect x="${x - 4}" y="${y - 3.5}" width="8" height="7" rx="1.5" fill="${c2 || light}" stroke="${dark}" stroke-width="1"/>`;
  }
  return { back, front };
}

// `kind` is a drawing name (tee, puffer, boot, ...) or a wardrobe category (ust, dis, ...).
// `opts` is either a boolean (legacy "patterned") or { patternType, color2, details }.
// Add the class "flat" to drop the ground shadow (for stacked layouts).
export function garmentArt(kind, color, opts = {}, extraClass = '') {
  if (typeof opts === 'boolean') opts = { patternType: opts ? 'stripes' : 'solid' };
  const name = GARMENTS[kind] || kind === 'chinos' ? kind : (CATEGORY_DEFAULT[kind] || 'tee');
  const g = GARMENTS[name === 'chinos' ? 'trousers' : name];
  const glasses = name === 'sunglasses' || name === 'catglasses';
  const lightLens = glasses && opts.lens === 'light';
  // Summer glasses: light frame with a warm, lighter tint. Otherwise dark frame and smoke lens.
  const fill = color || (lightLens ? LIGHT_FRAME[name] : null) || DEFAULT_GARMENT_COLOR[name] || '#cccccc';
  const c2 = opts.color2 || null;
  const dark = shade(fill, isLight(fill) ? -0.32 : -0.38);
  const light = shade(fill, 0.55);
  const id = `gp${++uid}`;
  const type = opts.patternType || 'solid';
  const lensDef = glasses
    ? `<linearGradient id="${id}l" x1="0" y1="0" x2="0" y2="1">${(lightLens ? ['#9a5b2e', '#e9b778'] : ['#1c1f26', '#5a6474']).map((c, i) => `<stop offset="${i}" stop-color="${c}"/>`).join('')}</linearGradient>`
    : '';
  const defs = patternDefs(id, type, fill, c2) + lensDef;
  const detail = g.detail.replaceAll('{D}', dark).replaceAll('{L}', light).replaceAll('{LENS}', `url(#${id}l)`);
  const over = detailOverlays(name, opts.details || {}, fill, c2, dark, light);
  const zone = ZONES[name];
  const print = type === 'print' && zone
    ? `<circle cx="60" cy="${(zone.neck + zone.bottom) / 2}" r="11" fill="${c2 || light}" stroke="${dark}" stroke-width="1.5"/><path d="M53 ${(zone.neck + zone.bottom) / 2} h14 M60 ${(zone.neck + zone.bottom) / 2 - 7} v14" stroke="${dark}" stroke-width="2" stroke-linecap="round"/>`
    : '';
  return `
    <svg class="garment ${extraClass}" viewBox="0 0 120 120" aria-hidden="true">
      ${defs ? `<defs>${defs}</defs>` : ''}
      ${extraClass.includes('flat') ? '' : '<ellipse cx="60" cy="114" rx="34" ry="4" fill="rgba(20,24,40,.16)"/>'}
      ${g.back ? `<path d="${g.back}" fill="${shade(fill, -0.2)}" stroke="${dark}" stroke-width="2.5" stroke-linejoin="round"/>` : ''}
      ${over.back}
      <path d="${g.body}" fill="${fill}" stroke="${dark}" stroke-width="2.5" stroke-linejoin="round"/>
      ${patternDefs(id, type, fill, c2) ? `<path d="${g.body}" fill="url(#${id})"/>` : ''}
      ${detail}
      ${print}
      ${over.front}
    </svg>`;
}

// ---------- Outfit figure ----------
// Composes an outfit into ONE drawing, placing each piece on an implied body
// (shoulders, waist, leg length, feet) instead of stacking separate images.
// All torso drawings share the same 120-unit frame (shoulders ~y20, centred on
// x60), so upper layers simply sit on top of each other; bottoms hang from the
// waist; shoes stand at the end of the legs, both pointing the same way.

// Where the waistband starts inside each bottom drawing.
const WAIST_TOP = { trousers: 14, chinos: 14, jeans: 14, leggings: 14, shorts: 26, minishorts: 24, skirt: 24 };
// Bottom of the sole and horizontal middle of the shoe, per shoe drawing.
// `ankle` is where the leg enters the shoe (side view): the shoe is placed so
// this point sits under the middle of the trouser leg. A boot's shaft then
// hides behind the leg instead of sticking out of it, and the toe points forward.
const SHOE = {
  sneaker: { sole: 99, ankle: 36, top: 47 }, boot: { sole: 103, ankle: 42.5, top: 20 },
  sandal: { sole: 100, ankle: 40, top: 62 }, loafer: { sole: 99, ankle: 44, top: 63 },
};
// Middle of each leg (x) for bottoms whose legs aren't the standard trouser width.
const LEG_X = { leggings: [46, 74] };
// Lowest point of short bottoms inside their own drawing.
const SHORT_HEM = { shorts: 89, minishorts: 70, skirt: 100, dress: 108 };
const FIG = { s: 1.3, w: 220, y0: 10, waistInTop: 92, legLen: 93, legL: 41, legR: 79 };

function placed(kind, look, x, y, scale) {
  const svg = garmentArt(kind, look.color, look, 'flat');
  return svg.replace(/<svg class="garment[^"]*"/, `<svg x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(120 * scale).toFixed(1)}" height="${(120 * scale).toFixed(1)}" overflow="visible"`);
}

// Picks what the figure shows from an outfit's rows. Rules:
//  - the user's own pieces win: a suggested (non-wardrobe) layer never covers one,
//  - at most two upper layers: the outermost and the innermost,
//  - a dress is a whole look, so no base top is drawn over it.
export function figurePartsFromRows(rows) {
  const by = k => rows.find(r => r.slotKey === k) || null;
  const bottom = by('alt');
  const isDress = bottom && bottom.art === 'dress';
  let uppers = [by('dis'), by('ustune'), isDress ? null : by('ust')].filter(Boolean);
  while (uppers.length > 1 && !uppers[0].fromWardrobe && uppers.slice(1).some(r => r.fromWardrobe)) uppers = uppers.slice(1);
  const outer = uppers[0] || null;
  const inner = uppers.length > 1 ? uppers[uppers.length - 1] : null;
  const look = r => (r ? r.look : null);
  return { outer: look(outer), inner: look(inner), bottom: look(bottom), feet: look(by('ayak')), acc: look(by('yanina')) };
}

// parts: { outer, inner, bottom, feet, acc } - each a look ({ art, color, ... }) or null.
export function outfitFigure(parts) {
  const { s, w, y0, waistInTop, legLen, legL, legR } = FIG;
  const boxX = w / 2 - 60 * s;
  const waistY = y0 + waistInTop * s;
  const feetY = waistY + legLen * s;
  const layers = [];

  // Trousers reach the feet, so shoes stand at the hem. With shorts, skirts,
  // dresses (or no bottom at all) the shoes sit a short, fixed gap below the
  // lowest hem in the drawing, so they never float far away from the outfit.
  const longBottom = parts.bottom && !(parts.bottom.art in SHORT_HEM);
  const sh = s * 0.5;
  let soleY;
  const meta = parts.feet ? (SHOE[parts.feet.art] || SHOE.sneaker) : SHOE.sneaker;
  if (longBottom) {
    soleY = feetY + 24 * s;
  } else {
    let hem = y0 + 104 * s;
    if (parts.bottom) {
      const art = parts.bottom.art;
      hem = art === 'dress' ? y0 + (8 + SHORT_HEM.dress) * s : waistY + (SHORT_HEM[art] - (WAIST_TOP[art] ?? 14)) * s;
    }
    for (const up of [parts.outer, parts.inner]) {
      if (up && ZONES[up.art]) hem = Math.max(hem, y0 + ZONES[up.art].bottom * s);
    }
    soleY = hem + 12 * s + (meta.sole - meta.top) * sh;
  }

  // 1. Shoes, under the trouser hems. Both face right; the far one sits a little higher.
  if (parts.feet) {
    const [lx, rx] = (parts.bottom && LEG_X[parts.bottom.art]) || [legL, legR];
    [[lx, -4 * s], [rx, 0]].forEach(([leg, lift]) => {
      const x = boxX + leg * s - meta.ankle * sh;
      layers.push(placed(parts.feet.art, parts.feet, x, soleY - meta.sole * sh + lift, sh));
    });
  }

  // 2. Bottoms hang from the waist. A dress hangs from the shoulders instead.
  if (parts.bottom) {
    const art = parts.bottom.art;
    if (art === 'dress') {
      layers.push(placed(art, parts.bottom, boxX, y0 + 8 * s, s));
    } else {
      const top = WAIST_TOP[art] ?? 14;
      layers.push(placed(art, parts.bottom, boxX, waistY - top * s, s));
    }
  }

  // 3. Upper body: inner layer first, outer layer on top, same frame.
  // The inner layer is drawn 4% smaller so its sleeves and hem never poke out
  // past the outer layer's edges as thin slivers.
  if (parts.inner) {
    const k = 0.96;
    layers.push(placed(parts.inner.art, parts.inner, boxX + 60 * s * (1 - k), y0 + 20 * s * (1 - k), s * k));
  }
  if (parts.outer) layers.push(placed(parts.outer.art, parts.outer, boxX, y0, s));

  // 4. Accessories: carried items at the right hand, hats in the corner, scarf at the neck.
  if (parts.acc) {
    const a = parts.acc.art;
    if (a === 'scarf') layers.push(placed(a, parts.acc, w / 2 - 60 * 0.75 * s, y0 - 4 * s, 0.75 * s));
    else if (a === 'beanie' || a === 'cap') layers.push(placed(a, parts.acc, w - 62, -8, 0.55));
    else if (a === 'sunglasses' || a === 'catglasses') layers.push(placed(a, parts.acc, w - 64, -14, 0.55));
    else layers.push(`<g transform="rotate(10 ${w - 30} ${waistY})">${placed(a, parts.acc, w - 66, waistY - 52, 0.6)}</g>`);
  }

  const height = Math.ceil(Math.max(soleY + 6, y0 + 120 * s));
  return `<svg class="figure" viewBox="0 0 ${w} ${height}" aria-hidden="true">${layers.join('')}</svg>`;
}

const CLOUD = 'M30 86 H90 A19 19 0 0 0 88 48 A27 27 0 0 0 36 52 A17 17 0 0 0 30 86 Z';
const CLOUD_SM = 'M58 60 H96 A12 12 0 0 0 95 36 A17 17 0 0 0 62 39 A11 11 0 0 0 58 60 Z';

function sun(cx = 60, cy = 60, r = 20) {
  const rays = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    const r1 = r + 8, r2 = r + 17;
    return `<path d="M${(cx + Math.cos(a) * r1).toFixed(1)} ${(cy + Math.sin(a) * r1).toFixed(1)} L${(cx + Math.cos(a) * r2).toFixed(1)} ${(cy + Math.sin(a) * r2).toFixed(1)}"/>`;
  }).join('');
  return `
    <g class="g-sun-rays" style="transform-origin:${cx}px ${cy}px" stroke="#ffd25e" stroke-width="5" stroke-linecap="round">${rays}</g>
    <circle class="g-sun-core" cx="${cx}" cy="${cy}" r="${r}" fill="url(#gSun)" style="transform-origin:${cx}px ${cy}px"/>`;
}

function moon(cx = 60, cy = 56) {
  return `
    <path class="g-moon" d="M${cx + 6} ${cy - 30} A30 30 0 1 0 ${cx + 28} ${cy + 16} A24 24 0 1 1 ${cx + 6} ${cy - 30} Z" fill="#f3efff"/>
    <g class="g-twinkle" fill="#fff"><circle cx="24" cy="26" r="2.2"/><circle cx="98" cy="20" r="1.8"/><circle cx="102" cy="58" r="2.4"/><circle cx="20" cy="74" r="1.6"/></g>`;
}

const GLYPH_DEFS = `
  <defs>
    <radialGradient id="gSun" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="#fff3b0"/><stop offset=".6" stop-color="#ffc93c"/><stop offset="1" stop-color="#ff9f1c"/></radialGradient>
    <linearGradient id="gCloud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dfe7f3"/></linearGradient>
    <linearGradient id="gCloudDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c3cbd9"/><stop offset="1" stop-color="#8d98ad"/></linearGradient>
  </defs>`;

export function weatherGlyph(kind, isDay = true, extraClass = '') {
  let body = '';
  const darkCloud = kind === 'rain' || kind === 'storm';
  const cloudFill = darkCloud ? 'url(#gCloudDark)' : 'url(#gCloud)';
  switch (kind) {
    case 'clear':
      body = isDay ? sun() : moon();
      break;
    case 'partly':
      body = `<g transform="translate(-10 -12)">${isDay ? sun(54, 50, 17) : moon(48, 44)}</g>
        <path class="g-cloud g-drift" d="${CLOUD}" fill="${cloudFill}" transform="translate(6 10) scale(.92)"/>`;
      break;
    case 'cloudy':
      body = `<path class="g-cloud g-drift-slow" d="${CLOUD_SM}" fill="#c9d2e0" transform="translate(-6 -6)"/>
        <path class="g-cloud g-drift" d="${CLOUD}" fill="${cloudFill}"/>`;
      break;
    case 'fog':
      body = `<path class="g-cloud" d="${CLOUD}" fill="${cloudFill}" transform="translate(0 -14)"/>
        <g class="g-fog" stroke="#e8edf5" stroke-width="5" stroke-linecap="round"><path d="M22 88 H78"/><path d="M40 100 H100"/><path d="M18 112 H70"/></g>`;
      break;
    case 'rain':
    case 'storm': {
      const drops = [[40, 92], [56, 98], [72, 92], [88, 98], [48, 108], [80, 108]]
        .map(([x, y], i) => `<path class="g-drop" style="animation-delay:${i * 0.18}s" d="M${x} ${y} l-4 10" stroke="#8fc1ff" stroke-width="4" stroke-linecap="round"/>`).join('');
      const bolt = kind === 'storm' ? '<path class="g-bolt" d="M62 78 L50 100 H62 L54 120 L78 92 H66 L74 78 Z" fill="#ffd84d" stroke="#f2a900" stroke-width="2" stroke-linejoin="round"/>' : '';
      body = `${drops}${bolt}<path class="g-cloud g-drift" d="${CLOUD}" fill="${cloudFill}" transform="translate(0 -14)"/>`;
      break;
    }
    case 'snow': {
      const flakes = [[40, 96], [60, 104], [80, 96], [50, 114], [72, 116]]
        .map(([x, y], i) => `<g class="g-flake" style="animation-delay:${i * 0.4}s;transform-origin:${x}px ${y}px"><path d="M${x - 5} ${y} H${x + 5} M${x} ${y - 5} V${y + 5} M${x - 3.5} ${y - 3.5} L${x + 3.5} ${y + 3.5} M${x + 3.5} ${y - 3.5} L${x - 3.5} ${y + 3.5}" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></g>`).join('');
      body = `${flakes}<path class="g-cloud g-drift" d="${CLOUD}" fill="url(#gCloud)" transform="translate(0 -14)"/>`;
      break;
    }
    default:
      body = sun();
  }
  return `<svg class="wglyph ${extraClass}" viewBox="0 0 120 120" aria-hidden="true">${GLYPH_DEFS}${body}</svg>`;
}

// Temperature → color for range bars / accents (cold blue → hot red).
export function tempColor(t) {
  const stops = [[-10, [91, 141, 239]], [5, [86, 182, 230]], [14, [72, 199, 160]], [20, [168, 214, 84]], [27, [255, 176, 59]], [35, [240, 84, 79]]];
  if (t <= stops[0][0]) return `rgb(${stops[0][1].join(',')})`;
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [t0, c0] = stops[i - 1], [t1, c1] = stops[i];
      const k = (t - t0) / (t1 - t0);
      return `rgb(${c0.map((c, j) => Math.round(c + (c1[j] - c) * k)).join(',')})`;
    }
  }
  return `rgb(${stops[stops.length - 1][1].join(',')})`;
}
