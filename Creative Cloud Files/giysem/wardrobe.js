import { outfitColorScore } from './colors.js';

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

export function saveWardrobe(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function addOrUpdateItem(items, item) {
  const idx = items.findIndex(i => i.id === item.id);
  const next = [...items];
  if (idx >= 0) next[idx] = item; else next.push(item);
  saveWardrobe(next);
  return next;
}

export function removeItem(items, id) {
  const next = items.filter(i => i.id !== id);
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
function slotCandidates(items, { category, bandKey, needsRain, needsWind }, limit = MAX_CANDIDATES_PER_SLOT) {
  const desired = BAND_WARMTH[bandKey];
  return items
    .filter(i => i.category === category)
    // require a close warmth match to avoid nonsensical picks (e.g. a sweatshirt for a heatwave)
    .filter(i => Math.abs((i.warmth || 3) - desired) <= 1)
    .filter(i => !(needsRain && category === 'ayak' && !i.rainOk))
    .filter(i => !(needsWind && category === 'dis' && !i.windproof))
    .map(i => {
      let score = 3 - Math.abs((i.warmth || 3) - desired);
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
export function slotOptionIds(items, category, { bandKey, needsRain, needsWind }) {
  return slotCandidates(items, { category, bandKey, needsRain, needsWind }, Infinity).map(c => c.item.id);
}

// Picks one wardrobe piece per slot (where a viable one exists) so that the
// whole outfit fits the weather AND its colors/patterns work together.
// `locks` pins a slot to a specific item id (from the swap button); the other
// slots are then re-picked to go with it. Returns { [category]: item }.
export function pickWardrobeOutfit(items, categories, { bandKey, needsRain, needsWind }, locks = {}) {
  const slots = categories
    .map(category => {
      const opts = { category, bandKey, needsRain, needsWind };
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
