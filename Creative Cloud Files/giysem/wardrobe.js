import { outfitColorScore } from './colors.js';
import { itemLook } from './visuals.js';

const KEY = 'giysem_wardrobe_v1';

export const CATEGORIES = ['ust', 'ustune', 'dis', 'alt', 'ayak', 'yanina'];

export function loadWardrobe() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ---------- Photo store ----------
// Item details are tiny and stay in localStorage, but photos are not: a few dozen
// of them would blow through localStorage's ~5 MB. Photos live in IndexedDB
// (hundreds of MB) keyed by item id. If IndexedDB isn't available (some private
// windows), photos stay inline in localStorage exactly as before, so nothing is lost.

const DB_NAME = 'skystyle';
const STORE = 'photos';
let dbPromise = null;
let photoStoreOk = null; // null = not checked yet, true/false once known

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) { reject(new Error('no indexedDB')); return; }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('indexedDB blocked'));
  });
  return dbPromise;
}

function tx(mode, fn) {
  return openDb().then(db => new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    const result = fn(store);
    t.oncomplete = () => resolve(result && 'result' in result ? result.result : undefined);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error || new Error('transaction aborted'));
  }));
}

function putPhoto(id, dataUrl) { return tx('readwrite', s => s.put(dataUrl, id)); }
function deletePhoto(id) { return tx('readwrite', s => s.delete(id)); }
function getAllPhotos() {
  return openDb()
    .then(db => new Promise((resolve, reject) => {
      const t = db.transaction(STORE, 'readonly');
      const store = t.objectStore(STORE);
      const out = new Map();
      const req = store.openCursor();
      req.onsuccess = () => {
        const cur = req.result;
        if (cur) { out.set(cur.key, cur.value); cur.continue(); } else resolve(out);
      };
      req.onerror = () => reject(req.error);
    }));
}

// Called once at startup: moves any photos still stored inline into IndexedDB,
// then attaches every stored photo to its item. Returns the hydrated items.
export async function initPhotoStore(items) {
  try {
    await openDb();
    for (const item of items) {
      if (item.photo) await putPhoto(item.id, item.photo);
    }
    photoStoreOk = true;
    const photos = await getAllPhotos();
    const hydrated = items.map(i => (photos.has(i.id) ? { ...i, photo: photos.get(i.id), hasPhoto: true } : i));
    // Drop photos of items that no longer exist (e.g. deleted in another tab).
    for (const id of photos.keys()) if (!items.some(i => i.id === id)) deletePhoto(id).catch(() => {});
    return hydrated;
  } catch (err) {
    console.warn('[SkyStyle] Photo store unavailable, keeping photos in localStorage:', err && err.message);
    photoStoreOk = false;
    return items;
  }
}

// Returns false when localStorage is full, so the caller can tell the user.
export function saveWardrobe(items) {
  const slim = photoStoreOk
    ? items.map(({ photo, ...rest }) => (photo || rest.hasPhoto ? { ...rest, hasPhoto: true } : rest))
    : items;
  try {
    localStorage.setItem(KEY, JSON.stringify(slim));
    return true;
  } catch (err) {
    console.error('[SkyStyle] Could not save wardrobe:', err && err.name);
    return false;
  }
}

// Returns { items, ok }.
export function addOrUpdateItem(items, item) {
  const idx = items.findIndex(i => i.id === item.id);
  const next = [...items];
  const stored = photoStoreOk && item.photo ? { ...item, hasPhoto: true } : item;
  if (idx >= 0) next[idx] = stored; else next.push(stored);
  if (photoStoreOk && item.photo) {
    putPhoto(item.id, item.photo).catch(err => console.error('[SkyStyle] Could not store photo:', err && err.name));
  }
  return { items: next, ok: saveWardrobe(next) };
}

export function removeItem(items, id) {
  const next = items.filter(i => i.id !== id);
  if (photoStoreOk) deletePhoto(id).catch(() => {});
  saveWardrobe(next);
  return next;
}

export function newItemId() {
  return 'item_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function resizePhoto(file, maxDim = 480) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round(height * (maxDim / width));
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round(width * (maxDim / height));
          height = maxDim;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// The front graphic of a printed piece, cut out of its photo as a small image
// for the drawing. `box` is [left, top, width, height] as fractions of the photo
// (from the AI); without a usable one we take the middle of the photo, where a
// tee's print usually sits.
export const DEFAULT_PRINT_BOX = [0.22, 0.2, 0.56, 0.56];
export function validPrintBox(box) {
  if (!Array.isArray(box) || box.length !== 4 || !box.every(n => typeof n === 'number' && isFinite(n))) return null;
  let [x, y, w, h] = box;
  x = Math.min(Math.max(x, 0), 0.95); y = Math.min(Math.max(y, 0), 0.95);
  w = Math.min(w, 1 - x); h = Math.min(h, 1 - y);
  return w >= 0.08 && h >= 0.08 ? [x, y, w, h] : null;
}
export function cropPrint(dataUrl, box, maxDim = 112) {
  const [x, y, w, h] = validPrintBox(box) || DEFAULT_PRINT_BOX;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const sx = x * img.width, sy = y * img.height, sw = w * img.width, sh = h * img.height;
      const scale = Math.min(1, maxDim / Math.max(sw, sh));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(sw * scale));
      canvas.height = Math.max(1, Math.round(sh * scale));
      canvas.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.78));
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

// Measures the garment's main (and second) color straight from the photo.
// The background is guessed from the border pixels and ignored; the rest is
// clustered and the biggest cluster wins. Returns { hex, hex2 } (hex2 may be null).
export function photoColors(dataUrl) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const N = 64;
      const canvas = document.createElement('canvas');
      canvas.width = N; canvas.height = N;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, N, N);
      const px = ctx.getImageData(0, 0, N, N).data;
      const at = (x, y) => { const i = (y * N + x) * 4; return [px[i], px[i + 1], px[i + 2]]; };
      const border = [];
      for (let i = 0; i < N; i++) border.push(at(i, 0), at(i, N - 1), at(0, i), at(N - 1, i));
      const bg = [0, 1, 2].map(c => border.reduce((s, p) => s + p[c], 0) / border.length);
      const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
      const pts = [];
      for (let y = Math.floor(N * 0.15); y < N * 0.85; y++) {
        for (let x = Math.floor(N * 0.15); x < N * 0.85; x++) {
          const p = at(x, y);
          if (dist(p, bg) > 45) pts.push(p);
        }
      }
      const sample = pts.length > 80 ? pts : (() => { const all = []; for (let y = 16; y < 48; y++) for (let x = 16; x < 48; x++) all.push(at(x, y)); return all; })();
      // k-means, k=3, seeded from spread-out samples
      let centers = [sample[0], sample[Math.floor(sample.length / 2)], sample[sample.length - 1]].map(c => [...c]);
      let groups = [];
      for (let it = 0; it < 10; it++) {
        groups = centers.map(() => []);
        for (const p of sample) {
          let bi = 0, bd = Infinity;
          centers.forEach((c, i) => { const d = dist(p, c); if (d < bd) { bd = d; bi = i; } });
          groups[bi].push(p);
        }
        centers = groups.map((g, i) => g.length ? [0, 1, 2].map(c => g.reduce((s, p) => s + p[c], 0) / g.length) : centers[i]);
      }
      const ranked = groups.map((g, i) => ({ c: centers[i], n: g.length })).sort((a, b) => b.n - a.n);
      const hex = c => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
      const main = ranked[0];
      const second = ranked.find(r => r !== main && r.n > sample.length * 0.18 && dist(r.c, main.c) > 60);
      resolve({ hex: hex(main.c), hex2: second ? hex(second.c) : null });
    };
    img.onerror = () => resolve({ hex: null, hex2: null });
    img.src = dataUrl;
  });
}

// Desired warmth level (1 incecik .. 5 kışlık) per temperature band key
export const BAND_WARMTH = {
  dondurucu: 5,
  soguk: 4,
  serin: 3,
  ilik: 2,
  sicak: 1,
  cok_sicak: 1,
};

// Stable per-item hash so equally-scored pieces don't always resolve to the
// first-added one, while staying stable across re-renders.
function idHash(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return hash;
}

// 0..0.99, well mixed: a one-letter change in the date reshuffles every piece
// (a plain string hash would shift them all by the same amount).
function dayNudge(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 15; h = Math.imul(h, 2246822507); h ^= h >>> 13; h = Math.imul(h, 3266489909); h ^= h >>> 16;
  return ((h >>> 0) % 1000) / 1000;
}

// How dressy a piece is: 1 relaxed, 2 everyday, 3 smart. The user's own choice wins;
// otherwise it's read from the kind of piece.
const RELAXED_ARTS = ['hoodie', 'sweatshirt', 'tank', 'fleece', 'leggings', 'shorts', 'minishorts', 'slide', 'cap', 'bucket'];
const SMART_ARTS = ['shirt', 'blouse', 'blazer', 'blazerw', 'coat', 'wrapcoat', 'trench', 'trousers', 'dress', 'loafer', 'heel', 'chelsea', 'watch'];
export function isFormality(f) { return f === 1 || f === 2 || f === 3; }
export function itemFormality(item) {
  if (isFormality(item.formality)) return item.formality;
  const art = itemLook(item).art;
  return RELAXED_ARTS.includes(art) ? 1 : SMART_ARTS.includes(art) ? 3 : 2;
}

const MAX_CANDIDATES_PER_SLOT = 5;
// Clothes people change every day. Shoes, coats and accessories are fine to repeat.
const REST_SLOTS = ['ust', 'ustune', 'alt'];

// Days since 1970 from a seed that starts with the date (YYYY-MM-DD), or null.
function dayNumber(seed) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(seed || ''));
  return m ? Math.floor(Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86400000) : null;
}
const COLOR_WEIGHT = 0.7;

// Viable wardrobe pieces for one slot, best weather fit first.
// `allowArts` limits a slot to certain kinds of piece (e.g. only an umbrella in
// the accessory slot on a rainy day, only a beanie or scarf when it's freezing).
// `relaxed` (wardrobe-only mode): any thickness is allowed and rain/wind only
// lower the score, so the user always gets an outfit from their own clothes.
// `planFit` (wardrobe-only mode): pieces that don't suit today's plans rank lower.
function slotCandidates(items, { category, bandKey, needsRain, needsWind, allowArts, relaxed, planFit, seed = '' }, limit = MAX_CANDIDATES_PER_SLOT) {
  const desired = BAND_WARMTH[bandKey];
  const kinds = allowArts && allowArts[category];
  const isAcc = category === 'yanina';
  let pool = items.filter(i => i.category === category);
  // From the user's own clothes (or a store's stock): a piece that doesn't suit
  // today's plans is left out when the slot has another that does.
  if (relaxed && planFit) {
    const fit = pool.filter(i => planFit(i) && (!kinds || kinds.includes(itemLook(i).art)));
    if (fit.length) pool = pool.filter(i => planFit(i));
  }
  return pool
    .filter(i => !kinds || kinds.includes(itemLook(i).art))
    // require a close warmth match to avoid nonsensical picks (e.g. a sweatshirt for a heatwave);
    // accessories are chosen by kind instead
    .filter(i => relaxed || isAcc || Math.abs((i.warmth || 3) - desired) <= 1)
    // Even from the user's own clothes, a coat or extra layer that's far too warm is left out.
    .filter(i => !relaxed || !['dis', 'ustune'].includes(category) || (i.warmth || 3) - desired <= 1)
    // On mild and warm days a layer may not be warmer than the day calls for
    // (no fleece or wool coat at 20°).
    .filter(i => !['dis', 'ustune'].includes(category) || !['ilik', 'sicak', 'cok_sicak'].includes(bandKey) || (i.warmth || 3) <= desired)
    .filter(i => relaxed || !(needsRain && category === 'ayak' && !i.rainOk))
    .filter(i => relaxed || !(needsWind && category === 'dis' && !i.windproof))
    .map(i => {
      let score = isAcc ? 3 : 3 - Math.abs((i.warmth || 3) - desired);
      // In freezing weather (snow) a warm coat matters more than a rain-proof one:
      // a down puffer beats a trench, and a thin coat loses twice.
      const freezingCoat = bandKey === 'dondurucu' && category === 'dis';
      if (freezingCoat) score += (needsRain && (i.rainOk || (i.warmth || 3) >= 5) ? 2 : 0) - Math.max(0, desired - (i.warmth || 3));
      else if (needsRain && category !== 'yanina') score += i.rainOk ? 2 : -3;
      if (needsWind && category === 'dis') score += i.windproof ? 2 : -3;
      if (needsRain && i.rainOk) score += 0.5;
      if (planFit && !planFit(i)) score -= 2.5;
      // A small nudge that changes every day, so similar pieces take turns
      // instead of the same T-shirt winning every day.
      if (seed) score += dayNudge(`${i.id}|${seed}`);
      return { item: i, score };
    })
    .sort((a, b) => b.score - a.score || idHash(a.item.id) - idHash(b.item.id))
    .slice(0, limit);
}

// Every wardrobe piece that suits this slot today, best weather fit first.
// The swap button cycles through these.
export function slotOptionIds(items, category, { bandKey, needsRain, needsWind, allowArts, relaxed, planFit }) {
  return slotCandidates(items, { category, bandKey, needsRain, needsWind, allowArts, relaxed, planFit }, Infinity).map(c => c.item.id);
}

// Picks one wardrobe piece per slot (where a viable one exists) so that the
// whole outfit fits the weather AND its colors/patterns work together.
// `locks` pins a slot to a specific item id (from the swap button); the other
// slots are then re-picked to go with it. Returns { [category]: item }.
export function pickWardrobeOutfit(items, categories, { bandKey, needsRain, needsWind, allowArts, relaxed, planFit, seed }, locks = {}) {
  const day = dayNumber(seed);
  const slots = categories
    .map(category => {
      const opts = { category, bandKey, needsRain, needsWind, allowArts, relaxed, planFit, seed };
      if (locks[category]) {
        const locked = slotCandidates(items, opts, Infinity).filter(c => c.item.id === locks[category]);
        if (locked.length) return { category, cands: locked };
      }
      const cands = slotCandidates(items, opts);
      // Mixed mode: with only a few pieces that fit, some days go to a suggestion
      // instead, so one black T-shirt doesn't turn up every single day of the week.
      if (!relaxed && day !== null && REST_SLOTS.includes(category) && cands.length && cands.length <= 3) {
        const cycle = cands.length + 1;
        if ((day + idHash(category)) % cycle === cands.length) return { category, cands: [] };
      }
      return { category, cands };
    })
    .filter(s => s.cands.length);
  if (!slots.length) return {};

  // From the user's own clothes (or a store's stock) the extra warm layer may be
  // left out, so a chunky top doesn't get a cardigan forced over it.
  if (relaxed) {
    const mid = slots.find(s => s.category === 'ustune' && !locks.ustune);
    if (mid) mid.cands = mid.cands.concat({ item: null, score: mid.cands[0].score - 1.2 });
  }
  let best = null;
  let bestScore = -Infinity;
  const chosen = [];
  (function search(idx, weatherScore) {
    if (idx === slots.length) {
      const picked = chosen.map(c => c.item).filter(Boolean);
      const total = weatherScore + COLOR_WEIGHT * outfitColorScore(picked) - layerPenalty(picked) - darkDayPenalty(picked, bandKey);
      if (total > bestScore) { bestScore = total; best = [...chosen]; }
      return;
    }
    for (const cand of slots[idx].cands) {
      chosen.push(cand);
      search(idx + 1, weatherScore + cand.score);
      chosen.pop();
    }
  })(0, 0);

  const result = {};
  slots.forEach((s, i) => { if (best[i].item) result[s.category] = best[i].item; });
  return result;
}

// Pieces that are a layer of their own: a heavy shirt-jacket, a fleece, a hoodie.
const OVERSHIRT = /overshirt|shacket|shirt[- ]jacket|flannel|oduncu|gömlek ceket|kalın gömlek/i;
const CHUNKY = /chunky|cable|heavy|kalın|iri örgü|saç örgü/i;
function isBulkyTop(item) {
  const art = itemLook(item).art;
  if (['hoodie', 'fleece', 'sweatshirt'].includes(art)) return true;
  if (OVERSHIRT.test(item.name || '')) return true;
  // A fine or ribbed knit (a turtleneck) sits fine under a cardigan; a chunky one doesn't.
  return art === 'sweater' && (CHUNKY.test(item.name || '') || (item.warmth || 3) >= 5);
}
// Mid tones that turn into one muddy block when two neighbouring pieces share them.
const MUDDY = { bej: 'sand', haki: 'olive', kahve: 'brown' };
const sameMud = (a, b) => a && b && MUDDY[a.color] && MUDDY[a.color] === MUDDY[b.color];

// On a mild or warm day an outfit of only deep colors (navy, black, burgundy,
// brown) looks heavy and closed; one light piece among the big ones fixes it.
const DEEP = ['siyah', 'lacivert', 'bordo', 'kahve'];
const WARM_DAY = ['ilik', 'sicak', 'cok_sicak'];
export function darkDayPenalty(items, bandKey) {
  if (!WARM_DAY.includes(bandKey)) return 0;
  const big = items.filter(i => i && ['ust', 'ustune', 'dis', 'alt'].includes(i.category) && i.color);
  const deep = big.filter(i => DEEP.includes(i.color)).length;
  return big.length >= 2 && deep >= 3 ? 1.5 : big.length >= 2 && deep === big.length ? 1 : 0;
}

// How much a set of pieces fights itself when worn together (0 = fine).
export function layerPenalty(items) {
  const by = {};
  for (const i of items) if (i) by[i.category] = i;
  let p = 0;
  // A chunky top or an overshirt under a cardigan or sweater: bulky, wrong order.
  if (by.ust && by.ustune && isBulkyTop(by.ust)) p += 3;
  // Two knits on top of each other (a crewneck under a quarter-zip).
  else if (by.ust && by.ustune && itemLook(by.ust).art === 'sweater' && itemLook(by.ustune).art === 'sweater') p += 1.5;
  // Under a dress only a thin fitted top works, not a sweater, blouse or shirt.
  if (by.ust && by.alt && itemLook(by.alt).art === 'dress' && !['longsleeve', 'tee', 'tank'].includes(itemLook(by.ust).art)) p += 2;
  // A knit under a cardigan or another knit in the very same color: one flat block.
  const KNITS = ['sweater', 'cardigan', 'vest', 'fleece', 'hoodie', 'sweatshirt'];
  if (by.ust && by.ustune && by.ust.color && by.ust.color === by.ustune.color && KNITS.includes(itemLook(by.ust).art) && KNITS.includes(itemLook(by.ustune).art)) p += 1.5;
  // Same sand, olive or brown on pieces that sit next to each other.
  if (sameMud(by.dis, by.alt)) p += 1.5;
  if (sameMud(by.ust, by.dis) || sameMud(by.ustune, by.dis)) p += 1.2;
  if (sameMud(by.alt, by.ayak)) p += 1;
  return p;
}
