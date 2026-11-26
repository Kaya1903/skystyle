// What the person likes, learned from what they do (it never leaves the phone as raw data).
//
// Signals:
//   wear   they wore today's outfit       -> its pieces and colors count as liked
//   swap   they changed one piece         -> the piece they moved away from counts against
//   reroll they asked for a new outfit    -> the outfit they saw counts a little against
//   adjust they asked for warmer, darker, more casual, ...
//   rate   👍 / 👎 on the stylist's note, with reasons ("colors", "too plain", ...)
//
// tasteSummary() turns all that into a few short English lines for the AI stylist,
// e.g. "Often wears navy, beige and denim. Usually swaps away from bright yellow."
// Older signals weigh less, so the profile follows the person as their taste changes.

const KEY = 'giysem_taste_v1';
const MAX_EVENTS = 300;
const HALF_LIFE_DAYS = 45;

export const RATE_REASONS_DOWN = ['colors', 'plain', 'bold', 'not_me', 'weather'];
export const RATE_REASONS_UP = ['colors_good', 'me', 'idea'];

function load() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (v && Array.isArray(v.events)) return v;
  } catch { /* fall through */ }
  return { events: [], ratings: {} };
}
let store = load();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { /* private mode: learning just pauses */ }
}

// One outfit row as the profile keeps it: kind of piece, palette color, formality.
// `color` is a palette key (siyah, lacivert, ...) or null.
export function pieceOf(row) {
  return { slot: row.slot, art: row.art || null, color: row.color || null };
}

export function recordTaste(type, date, data = {}) {
  store.events.push({ type, date, ...data });
  if (store.events.length > MAX_EVENTS) store.events.splice(0, store.events.length - MAX_EVENTS);
  save();
}

// 👍 / 👎 on a day's stylist pick: one rating per day, the latest wins.
export function rateStylist(date, rating, reasons = []) {
  store.ratings = store.ratings || {};
  if (!rating) delete store.ratings[date];
  else store.ratings[date] = { rating, reasons: reasons.slice(0, 3) };
  save();
}
export function stylistRating(date) {
  return (store.ratings || {})[date] || null;
}

// Taking back "I'm wearing this" takes back its signal too.
export function forgetTaste(type, date) {
  store.events = store.events.filter(e => !(e.type === type && e.date === date));
  save();
}

export function clearTaste() {
  store = { events: [], ratings: {} };
  save();
}

function weight(date, today) {
  const days = Math.max(0, (Date.parse(today) - Date.parse(date)) / 86400000) || 0;
  return Math.pow(0.5, days / HALF_LIFE_DAYS);
}

const COLOR_EN = {
  siyah: 'black', beyaz: 'white', gri: 'grey', lacivert: 'navy', bej: 'beige', kahve: 'brown', denim: 'denim blue',
  haki: 'khaki', yesil: 'green', mavi: 'blue', kirmizi: 'red', bordo: 'burgundy', pembe: 'pink', mor: 'purple', sari: 'yellow', turuncu: 'orange',
};
const NEUTRALS = ['siyah', 'beyaz', 'gri', 'lacivert', 'bej', 'kahve', 'denim', 'haki'];
const ART_EN = {
  tee: 'T-shirts', longsleeve: 'long-sleeve tops', sweater: 'sweaters', sweatshirt: 'sweatshirts', hoodie: 'hoodies', shirt: 'shirts',
  shortshirt: 'short-sleeve shirts', blouse: 'blouses', polo: 'polos', tank: 'tank tops', cardigan: 'cardigans', fleece: 'fleeces', vest: 'vests',
  jacket: 'jackets', puffer: 'puffer jackets', coat: 'coats', trench: 'trench coats', windbreaker: 'windbreakers', bomber: 'bombers',
  blazer: 'blazers', parka: 'parkas', wrapcoat: 'belted coats', pufferw: 'long puffers', cropjacket: 'cropped jackets', blazerw: 'long blazers',
  trousers: 'tailored trousers', chinos: 'chinos', jeans: 'jeans', leggings: 'leggings', shorts: 'shorts', minishorts: 'short shorts',
  skirt: 'skirts', dress: 'dresses', jumpsuit: 'jumpsuits', sneaker: 'sneakers', boot: 'boots', chelsea: 'chelsea boots', sandal: 'sandals',
  slide: 'slides', espadrille: 'espadrilles', loafer: 'loafers', flat: 'ballet flats', heel: 'heels',
};
const ADJUST_EN = {
  casual: 'more casual', elegant: 'smarter', sporty: 'sportier', minimal: 'more minimal', bold: 'bolder',
  dark: 'darker colors', bright: 'brighter colors', light: 'lighter colors',
};
const REASON_EN = {
  colors: 'the colors didn\'t work for them', plain: 'it was too plain', bold: 'it was too loud', not_me: 'it wasn\'t their style',
  weather: 'it didn\'t suit the weather', colors_good: 'they liked the colors', me: 'it felt like them', idea: 'the styling idea helped',
};

// What the stylist should do differently after each kind of thumbs down.
const REASON_FIX = {
  plain: 'Give the outfit one clear accent color instead of an all-neutral look.',
  bold: 'Keep the colors calmer, with at most one accent.',
  colors: 'Choose colors that sit closer together.',
  not_me: 'Stay closer to the colors and kinds of pieces they usually wear.',
  weather: 'Lean more on the weather when you choose.',
};
const top = (scores, n, min) => Object.entries(scores).filter(([, v]) => v >= min).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);
const list = arr => arr.length <= 1 ? arr.join('') : `${arr.slice(0, -1).join(', ')} and ${arr[arr.length - 1]}`;

// The numbers behind the summary (also handy for the profile screen and tests).
export function tasteStats(today) {
  const colorLike = {}, colorDislike = {}, artLike = {}, artDislike = {}, adjust = {};
  let wears = 0, stylistWears = 0, rerolls = 0, swaps = 0;
  for (const e of store.events) {
    const w = weight(e.date, today);
    if (e.type === 'wear') {
      wears += w;
      if (e.stylist) stylistWears += w;
      for (const p of e.pieces || []) {
        if (p.color) colorLike[p.color] = (colorLike[p.color] || 0) + w;
        if (p.art) artLike[p.art] = (artLike[p.art] || 0) + w;
      }
    } else if (e.type === 'swap' && e.from) {
      swaps += w;
      if (e.from.color) colorDislike[e.from.color] = (colorDislike[e.from.color] || 0) + w;
      if (e.from.art) artDislike[e.from.art] = (artDislike[e.from.art] || 0) + w;
    } else if (e.type === 'reroll') {
      rerolls += w;
      // A whole outfit turned down says less about each piece than a single swap.
      for (const p of e.pieces || []) {
        if (p.color && !NEUTRALS.includes(p.color)) colorDislike[p.color] = (colorDislike[p.color] || 0) + w * 0.4;
      }
    } else if (e.type === 'adjust' && e.kind) {
      adjust[e.kind] = (adjust[e.kind] || 0) + w;
    }
  }
  const up = { n: 0, reasons: {} }, down = { n: 0, reasons: {} };
  for (const [date, r] of Object.entries(store.ratings || {})) {
    const w = weight(date, today);
    const side = r.rating === 'up' ? up : down;
    side.n += w;
    for (const reason of r.reasons || []) side.reasons[reason] = (side.reasons[reason] || 0) + w;
  }
  return { colorLike, colorDislike, artLike, artDislike, adjust, wears, stylistWears, rerolls, swaps, up, down, events: store.events.length };
}

// A few short lines for the stylist, or '' while there's too little to go on.
export function tasteSummary(today) {
  const s = tasteStats(today);
  if (s.events + Object.keys(store.ratings || {}).length < 3) return '';
  const lines = [];
  // A color they wear but also keep swapping away from isn't a favorite.
  const net = (like, dislike) => Object.fromEntries(Object.keys({ ...like, ...dislike }).map(k => [k, (like[k] || 0) - (dislike[k] || 0)]));
  const colorsLiked = top(net(s.colorLike, s.colorDislike), 4, 1.5).map(k => COLOR_EN[k]).filter(Boolean);
  const colorsAvoided = top(net(s.colorDislike, s.colorLike), 3, 1.5).map(k => COLOR_EN[k]).filter(Boolean);
  const artsLiked = top(net(s.artLike, s.artDislike), 4, 1.5).map(k => ART_EN[k]).filter(Boolean);
  const artsAvoided = top(net(s.artDislike, s.artLike), 3, 1.5).map(k => ART_EN[k]).filter(Boolean);
  if (colorsLiked.length) lines.push(`Often wears ${list(colorsLiked)}.`);
  if (artsLiked.length) lines.push(`Likes ${list(artsLiked)}.`);
  if (colorsAvoided.length || artsAvoided.length) {
    lines.push(`Usually swaps away from ${list([...colorsAvoided, ...artsAvoided])}: use them only when nothing else works.`);
  }
  const asks = top(s.adjust, 2, 1.5).map(k => ADJUST_EN[k]).filter(Boolean);
  if (asks.length) lines.push(`Often asks for ${list(asks)} outfits.`);
  if (s.rerolls >= 2 && s.rerolls > s.wears) lines.push('Often asks for a different outfit, so the first pick should feel more like them.');
  const rated = s.up.n + s.down.n;
  if (rated >= 1) {
    const downReasons = top(s.down.reasons, 2, 0.8).map(k => REASON_EN[k]);
    const upReasons = top(s.up.reasons, 2, 0.8).map(k => REASON_EN[k]);
    if (s.down.n > s.up.n && downReasons.length) {
      lines.push(`When they disliked your picks, it was because ${list(downReasons)}.`);
      // Say what to do about it, not only what went wrong.
      const fixes = top(s.down.reasons, 2, 0.8).map(k => REASON_FIX[k]).filter(Boolean);
      if (fixes.length) lines.push(fixes.join(' '));
    }
    if (upReasons.length) lines.push(`When they liked your picks, ${list(upReasons)}.`);
  }
  return lines.join(' ').slice(0, 600);
}
