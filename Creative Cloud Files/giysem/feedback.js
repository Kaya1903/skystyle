// Learning how this person feels the weather.
//
// When the user says "I'm wearing this today", the day's weather and outfit are
// saved. Later (the next time they open the app, at least a few hours after)
// we ask how it went: cold, just right, too warm. Those answers become a
// personal adjustment for similar weather, and a reminder of the most similar
// past day ("Tuesday felt like today and you were cold, so one more layer").
// Everything stays in this browser.

const KEY = 'giysem_feedback_v1';
const MAX_RECORDS = 120;
const ASK_AFTER_MS = 5 * 3600 * 1000; // same day: ask once the outfit has been worn for a while
const ASK_WITHIN_DAYS = 6;            // older unanswered days are not asked about anymore

// How far one answer pushes the felt temperature (in °C).
const SHIFT = { cold: -4, ok: 0, warm: 4 };
export const ANSWERS = ['cold', 'ok', 'warm'];

export function loadFeedback() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { days: d && typeof d.days === 'object' && d.days ? d.days : {} };
  } catch {
    return { days: {} };
  }
}

export function saveFeedback(fb) {
  try { localStorage.setItem(KEY, JSON.stringify(fb)); } catch { /* storage full or blocked */ }
}

function trim(days) {
  const keys = Object.keys(days).sort();
  while (keys.length > MAX_RECORDS) delete days[keys.shift()];
  return days;
}

// rec: { date, city, feelsLike, wind, rain, rows: [{ slot, item, art, fromWardrobe }] }
export function markWorn(fb, rec) {
  const prev = fb.days[rec.date];
  const days = { ...fb.days, [rec.date]: { ...rec, wornAt: Date.now(), answer: prev ? prev.answer || null : null } };
  return { days: trim(days) };
}

// Same outfit = same pieces in the same slots. Used to show the "wearing this"
// tick only on the outfit that was actually marked.
// Compared by drawing and color so a language switch doesn't count as a change;
// records saved before colors were stored fall back to the piece names.
export function sameOutfit(saved, rows) {
  const a = saved || [], b = rows || [];
  if (a.length !== b.length) return false;
  const byText = a.some(r => !('color' in r));
  const key = r => byText
    ? `${r.slot || r.slotKey}:${r.item}`
    : `${r.slot || r.slotKey}:${r.art}:${r.color || (r.look && r.look.color) || ''}`;
  return a.map(key).join('|') === b.map(key).join('|');
}

// Worn days, newest first, for the profile history.
export function wornHistory(fb) {
  return Object.values(fb.days || {}).filter(r => r && r.date && Array.isArray(r.rows)).sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function unmarkWorn(fb, date) {
  const days = { ...fb.days };
  delete days[date];
  return { days };
}

export function answerDay(fb, date, answer) {
  if (!fb.days[date]) return fb;
  return { days: { ...fb.days, [date]: { ...fb.days[date], answer, answeredAt: Date.now() } } };
}

export function clearLearning() {
  return { days: {} };
}

function dayDiff(a, b) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

// The worn day we should ask about now, if any.
export function pendingQuestion(fb, today, now = Date.now()) {
  const recs = Object.values(fb.days).filter(r => !r.answer).sort((a, b) => (a.date < b.date ? 1 : -1));
  for (const r of recs) {
    const age = dayDiff(r.date, today);
    if (age < 0 || age > ASK_WITHIN_DAYS) continue;
    if (age === 0 && now - (r.wornAt || now) < ASK_AFTER_MS) continue;
    return r;
  }
  return null;
}

function answered(fb) {
  return Object.values(fb.days).filter(r => ANSWERS.includes(r.answer));
}

// Personal adjustment (°C added to the felt temperature) for a day like this.
// Similar temperatures and wind count most, recent answers count more, and the
// result stays small until there are a few answers.
export function learnedOffset(fb, feelsLike, wind, today) {
  let num = 0, den = 0;
  for (const r of answered(fb)) {
    const dT = Math.abs(r.feelsLike - feelsLike);
    if (dT > 8) continue;
    const wTemp = 1 - dT / 9;
    const wWind = (r.wind >= 20) === (wind >= 20) ? 1 : 0.6;
    const age = Math.max(0, dayDiff(r.date, today));
    const wAge = Math.pow(0.5, age / 45);
    const w = wTemp * wWind * wAge;
    num += w * SHIFT[r.answer];
    den += w;
  }
  const v = num / (den + 0.5);
  return Math.max(-6, Math.min(6, Math.round(v)));
}

// The most recent answered day that felt like this one and wasn't "just right".
export function findMemory(fb, feelsLike, today) {
  const recs = answered(fb)
    .filter(r => r.answer !== 'ok' && r.date !== today && Math.abs(r.feelsLike - feelsLike) <= 2)
    .filter(r => { const age = dayDiff(r.date, today); return age > 0 && age <= 30; })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  return recs[0] || null;
}

// Overall picture for the profile: how many answers, and which way they lean.
export function learningSummary(fb) {
  const recs = answered(fb);
  if (!recs.length) return { count: 0, lean: null };
  const avg = recs.reduce((s, r) => s + SHIFT[r.answer], 0) / recs.length;
  return { count: recs.length, lean: avg <= -1 ? 'cold' : avg >= 1 ? 'warm' : 'ok' };
}

// "Yesterday", "Tuesday", or "3 November" in the user's language.
export function dayLabel(date, today, lang, t) {
  const age = dayDiff(date, today);
  if (age === 0) return t(lang, 'fb_today');
  if (age === 1) return t(lang, 'fb_yesterday');
  const d = new Date(date + 'T12:00:00');
  let s;
  try {
    s = age < 7
      ? new Intl.DateTimeFormat(lang, { weekday: 'long' }).format(d)
      : new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long' }).format(d);
  } catch {
    s = date;
  }
  return s.charAt(0).toLocaleUpperCase(lang) + s.slice(1);
}
