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

const MAX_CANDIDATES_PER_SLOT = 5;
const COLOR_WEIGHT = 0.7;

// Viable wardrobe pieces for one slot, best weather fit first.
// `allowArts` limits a slot to certain kinds of piece (e.g. only an umbrella in
// the accessory slot on a rainy day, only a beanie or scarf when it's freezing).
function slotCandidates(items, { category, bandKey, needsRain, needsWind, allowArts }, limit = MAX_CANDIDATES_PER_SLOT) {
  const desired = BAND_WARMTH[bandKey];
  const kinds = allowArts && allowArts[category];
  const isAcc = category === 'yanina';
  return items
    .filter(i => i.category === category)
    .filter(i => !kinds || kinds.includes(itemLook(i).art))
    // require a close warmth match to avoid nonsensical picks (e.g. a sweatshirt for a heatwave);
    // accessories are chosen by kind instead
    .filter(i => isAcc || Math.abs((i.warmth || 3) - desired) <= 1)
    .filter(i => !(needsRain && category === 'ayak' && !i.rainOk))
    .filter(i => !(needsWind && category === 'dis' && !i.windproof))
    .map(i => {
      let score = isAcc ? 3 : 3 - Math.abs((i.warmth || 3) - desired);
      if (needsRain && category !== 'yanina') score += i.rainOk ? 2 : -3;
      if (needsWind && category === 'dis') score += i.windproof ? 2 : -3;
      if (needsRain && i.rainOk) score += 0.5;
      return { item: i, score };
    })
    .sort((a, b) => b.score - a.score || idHash(a.item.id) - idHash(b.item.id))
    .slice(0, limit);
}

// Every wardrobe piece that suits this slot today, best weather fit first.
// The swap button cycles through these.
export function slotOptionIds(items, category, { bandKey, needsRain, needsWind, allowArts }) {
  return slotCandidates(items, { category, bandKey, needsRain, needsWind, allowArts }, Infinity).map(c => c.item.id);
}

// Picks one wardrobe piece per slot (where a viable one exists) so that the
// whole outfit fits the weather AND its colors/patterns work together.
// `locks` pins a slot to a specific item id (from the swap button); the other
// slots are then re-picked to go with it. Returns { [category]: item }.
export function pickWardrobeOutfit(items, categories, { bandKey, needsRain, needsWind, allowArts }, locks = {}) {
  const slots = categories
    .map(category => {
      const opts = { category, bandKey, needsRain, needsWind, allowArts };
      if (locks[category]) {
        const locked = slotCandidates(items, opts, Infinity).filter(c => c.item.id === locks[category]);
        if (locked.length) return { category, cands: locked };
      }
      return { category, cands: slotCandidates(items, opts) };
    })
    .filter(s => s.cands.length);
  if (!slots.length) return {};

  let best = null;
  let bestScore = -Infinity;
  const chosen = [];
  (function search(idx, weatherScore) {
    if (idx === slots.length) {
      const total = weatherScore + COLOR_WEIGHT * outfitColorScore(chosen.map(c => c.item));
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
  slots.forEach((s, i) => { result[s.category] = best[i].item; });
  return result;
}
