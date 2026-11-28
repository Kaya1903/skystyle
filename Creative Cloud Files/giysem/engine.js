// SkyStyle outfit engine: one clean door into the rule engine, for any catalog.
//
// The app, the stats-page pilot and the /api/engine service (functions/api) all
// build outfits through the same engine (outfit.js). This file is the part a
// store or another app talks to: a catalog and the conditions go in, a few
// weather-safe outfits built only from that catalog come out, with item ids.
// It has no browser code, so it runs in the browser and on the server alike.
//
// Input (all English field names, see normalizeCatalog for the item fields):
//   { catalog: [...items], weather: { feelsLike, wind, rain, uv, sky, evening },
//     customer: { fit: 'women'|'men'|'unisex', style, occasion }, count, date }
// Output:
//   { outfits: [{ items: [{ slot, id, name, kind, color }], gaps: [{ code, id? }] }], warnings: [...] }
// `gaps` say what the catalog lacks for today's weather (see GAP_CODES).

import { generateOutfit, OCCASIONS, TIP_TEXT } from './outfit.js';
import { STYLE_OPTIONS } from './visuals.js';
import { COLORS, colorName } from './colors.js';

export const ENGINE_VERSION = '1.0';
export const MAX_CATALOG = 600;
export const MAX_OUTFITS = 6;

// Public slot names and the engine's own codes.
const SLOT_CODES = { top: 'ust', mid: 'ustune', outer: 'dis', bottom: 'alt', shoes: 'ayak', accessory: 'yanina' };
const SLOT_NAMES = Object.fromEntries(Object.entries(SLOT_CODES).map(([k, v]) => [v, k]));
const FITS = { women: 'kadin', men: 'erkek', unisex: 'unisex' };
export const STYLES = ['casual', 'elegant', 'sporty', 'minimal', 'bold'];
export const SKIES = ['clear', 'partly', 'cloudy', 'rain', 'snow', 'storm', 'fog'];
export const OCCASION_KEYS = Object.keys(OCCASIONS);
export const KINDS = Object.fromEntries(Object.entries(STYLE_OPTIONS).map(([code, arts]) => [SLOT_NAMES[code], arts]));
export const COLOR_KEYS = Object.keys(COLORS).map(k => colorName(k, 'en').toLowerCase());

// Color names a catalog may use: the palette in English or Turkish, the codes,
// and the usual shop words (camel, cream, charcoal ...).
const COLOR_ALIASES = {
  camel: 'bej', cream: 'beyaz', ivory: 'beyaz', offwhite: 'beyaz', 'off-white': 'beyaz', ecru: 'beyaz', tan: 'bej', sand: 'bej', stone: 'bej', nude: 'bej',
  taupe: 'bej', charcoal: 'gri', gray: 'gri', silver: 'gri', olive: 'haki', maroon: 'bordo', wine: 'bordo', rust: 'turuncu', mustard: 'sari',
  lilac: 'mor', lavender: 'mor', cognac: 'kahve', chocolate: 'kahve', indigo: 'denim', 'light blue': 'mavi', 'sky blue': 'mavi', teal: 'yesil',
};
const COLOR_LOOKUP = (() => {
  const map = { ...COLOR_ALIASES };
  for (const k of Object.keys(COLORS)) {
    map[k] = k;
    map[colorName(k, 'en').toLowerCase()] = k;
    map[colorName(k, 'tr').toLocaleLowerCase('tr')] = k;
  }
  return map;
})();
function colorKey(value) {
  if (!value) return null;
  const v = String(value).trim().toLocaleLowerCase('tr');
  return COLOR_LOOKUP[v] || COLOR_LOOKUP[v.replace(/\s+/g, '')] || null;
}

const clampInt = (v, lo, hi, dflt) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt; };
const num = (v, dflt = 0) => (Number.isFinite(Number(v)) ? Number(v) : dflt);
const text = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);

// A store's catalog item, in public field names:
//   id (required), name (required), slot: top|mid|outer|bottom|shoes|accessory (required),
//   kind: one of KINDS[slot] (optional, guessed from the name), color, color2,
//   warmth 1-5 (1 very light .. 5 winter), formality 1-3 (1 relaxed, 2 everyday, 3 smart),
//   fit: women|men|unisex, pattern: solid|stripes|checks|dots|floral|print,
//   rainproof, windproof (true/false), inStock (false leaves it out).
// Returns the engine's own item shape plus warnings for anything it had to skip or guess.
export function normalizeCatalog(catalog) {
  const warnings = [];
  const items = [];
  const seen = new Set();
  const list = Array.isArray(catalog) ? catalog.slice(0, MAX_CATALOG) : [];
  if (Array.isArray(catalog) && catalog.length > MAX_CATALOG) warnings.push(`catalog has more than ${MAX_CATALOG} items; only the first ${MAX_CATALOG} are used`);
  list.forEach((raw, n) => {
    if (!raw || typeof raw !== 'object') { warnings.push(`item ${n}: not an object, skipped`); return; }
    const id = text(raw.id, 80);
    const name = text(raw.name, 120);
    const category = SLOT_CODES[String(raw.slot || '').toLowerCase()];
    if (!id || !name || !category) { warnings.push(`item ${n}: needs id, name and a slot (${Object.keys(SLOT_CODES).join(', ')}), skipped`); return; }
    if (seen.has(id)) { warnings.push(`item ${id}: duplicate id, skipped`); return; }
    if (raw.inStock === false) return;
    seen.add(id);
    const kinds = STYLE_OPTIONS[category];
    let art = String(raw.kind || '').toLowerCase();
    if (art && !kinds.includes(art)) { warnings.push(`item ${id}: unknown kind "${raw.kind}", guessed from the name`); art = ''; }
    const color = colorKey(raw.color);
    if (raw.color && !color) warnings.push(`item ${id}: unknown color "${raw.color}"`);
    const pattern = ['stripes', 'checks', 'dots', 'floral', 'print'].includes(raw.pattern) ? raw.pattern : 'solid';
    items.push({
      id, name, category, art: art || undefined,
      color: color || undefined, color2: colorKey(raw.color2) || undefined,
      warmth: clampInt(raw.warmth, 1, 5, 3),
      formality: raw.formality == null ? undefined : clampInt(raw.formality, 1, 3, 2),
      gender: FITS[String(raw.fit || '').toLowerCase()] || 'unisex',
      patternType: pattern, pattern: pattern === 'solid' ? 'duz' : 'desenli', details: {},
      rainOk: raw.rainproof === true, windproof: raw.windproof === true,
    });
  });
  return { items, warnings };
}

// What each gap code means (the engine's wardrobe notes, read for a store).
export const GAP_CODES = {
  add_layer: 'the top is thin for today and the catalog has no warm layer for it',
  add_coat: 'no coat warm enough for today',
  add_mid: 'no warm mid layer to wear under the coat',
  thin_top: 'the top (id) is thin for this cold',
  thin_bottom: 'the bottoms are thin for this weather',
  no_bottom: 'no bottoms fit this weather',
  no_shoe: 'no shoes fit this weather',
  thin_shoe: 'the shoes are light for this cold',
  open_shoe: 'open shoes (id) in the cold',
  too_warm: 'a piece (id) is warm for today',
  wet_shoe: 'the shoes (id) are not waterproof and rain is expected',
  wind: 'the outer layer (id) does not block the wind',
  umbrella: 'rain is expected and there is no umbrella',
  cold_acc: 'freezing and no beanie, scarf or gloves',
};
// Turns one of the engine's English notes back into its code (and the piece it names).
function gapOf(tip, rows, byId) {
  const s = String(tip || '');
  for (const [code, tmpl] of Object.entries(TIP_TEXT.en)) {
    if (code === 'all_good') continue;
    const [head, tail = ''] = tmpl.split('{n}');
    if (!tmpl.includes('{n}')) { if (s === tmpl) return { code }; continue; }
    if (s.startsWith(head) && s.endsWith(tail)) {
      const name = s.slice(head.length, s.length - tail.length);
      const row = rows.find(r => byId.get(r.itemId).name === name);
      return row ? { code, id: row.itemId } : { code };
    }
  }
  return null;
}

// Today's date as YYYY-MM-DD (the engine's day-to-day variety starts from it).
function today() { return new Date().toISOString().slice(0, 10); }

// Weather-safe outfits built only from the catalog. Each one differs from the others.
export function buildOutfits(input = {}) {
  const { items, warnings } = normalizeCatalog(input.catalog);
  const w = input.weather || {};
  const c = input.customer || {};
  const fit = FITS[String(c.fit || '').toLowerCase()] || 'unisex';
  const style = STYLES.includes(c.style) ? c.style : 'casual';
  const occasion = OCCASION_KEYS.includes(c.occasion) ? c.occasion : null;
  if (c.occasion && !occasion) warnings.push(`unknown occasion "${c.occasion}" (use ${OCCASION_KEYS.join(', ')})`);
  const sky = SKIES.includes(w.sky) ? w.sky : null;
  const count = clampInt(input.count, 1, MAX_OUTFITS, 3);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(input.date || '')) ? input.date : today();
  const feelsLike = num(w.feelsLike, NaN);
  if (!Number.isFinite(feelsLike)) return { outfits: [], warnings: warnings.concat('weather.feelsLike is required') };
  if (!items.length) return { outfits: [], warnings: warnings.concat('the catalog has no usable items') };

  const byId = new Map(items.map(i => [i.id, i]));
  const outfits = [];
  const seen = new Set();
  for (let roll = 0; roll < count * 3 + 4 && outfits.length < count; roll++) {
    const o = generateOutfit({
      feelsLike, wind: num(w.wind), rainMax: num(w.rain), uv: w.uv == null ? null : num(w.uv), kind: sky,
      gender: fit, lang: 'en', vibe: style, seed: date, late: !!w.evening, occasion, wardrobeOnly: true,
      adjust: roll ? { reroll: roll } : null,
    }, items);
    const rows = o.rows.filter(r => r.fromWardrobe && byId.has(r.itemId));
    if (!rows.length) continue;
    const sig = rows.map(r => r.itemId).join('|');
    if (seen.has(sig)) continue;
    seen.add(sig);
    outfits.push({
      items: rows.map(r => {
        const it = byId.get(r.itemId);
        return { slot: SLOT_NAMES[r.slotKey], id: it.id, name: it.name, kind: r.art, color: it.color ? colorName(it.color, 'en').toLowerCase() : null };
      }),
      // What the catalog is missing for today (no rain shoes, no warm layer ...).
      gaps: (o.tips || []).map(t => gapOf(t, rows, byId)).filter(Boolean),
    });
  }
  return { outfits, warnings };
}

// The outfits in the shape the stylist prompt reads (functions/api: stylistPrompt).
export function stylistCandidates(outfits) {
  return outfits.map(o => ({
    rows: o.items.map(it => ({ slot: SLOT_CODES[it.slot], item: it.name, kind: it.kind, owned: true, colorRule: 'fixed', color: it.color })),
  }));
}
