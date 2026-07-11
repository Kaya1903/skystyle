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

// Desired warmth level (1 incecik .. 5 kışlık) per temperature band key
export const BAND_WARMTH = {
  dondurucu: 5,
  soguk: 4,
  serin: 3,
  ilik: 2,
  sicak: 1,
  cok_sicak: 1,
};

// Deterministic pick among equally-scored items, seeded by their ids. This avoids
// always defaulting to the first-added item when several pieces score identically
// (e.g. two plain t-shirts with the same warmth) while staying stable across re-renders.
function pickAmongTies(list) {
  if (list.length === 1) return list[0];
  const key = list.map(x => x.item.id).sort().join('|');
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}

export function findWardrobeMatch(items, { category, bandKey, needsRain, needsWind }) {
  const desired = BAND_WARMTH[bandKey];
  const candidates = items.filter(i => i.category === category);
  if (!candidates.length) return null;
  const scored = candidates.map(i => {
    let score = 3 - Math.abs((i.warmth || 3) - desired);
    if (needsRain && category !== 'yanina') score += i.rainOk ? 2 : -3;
    if (needsWind && category === 'dis') score += i.windproof ? 2 : -3;
    if (needsRain && i.rainOk) score += 0.5;
    return { item: i, score };
  });
  const maxScore = Math.max(...scored.map(s => s.score));
  const tied = scored.filter(s => s.score === maxScore);
  const best = pickAmongTies(tied);
  if (!best) return null;
  // require a close warmth match to avoid nonsensical picks (e.g. a sweatshirt for a heatwave)
  if (Math.abs((best.item.warmth || 3) - desired) > 1) return null;
  if (needsRain && category === 'ayak' && !best.item.rainOk) return null;
  if (needsWind && category === 'dis' && !best.item.windproof) return null;
  return best.item;
}
