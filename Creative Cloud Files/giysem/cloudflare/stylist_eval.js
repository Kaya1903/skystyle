// SkyStyle stylist exam: a fixed set of scenarios the AI stylist is graded on.
//
// How to run: open the live site (https://skystyle.pages.dev) in a browser,
// open the developer console, paste this whole file and press Enter. It builds
// each scenario's weather-safe options with the app's own outfit engine, asks
// the live /api/stylist endpoint to choose, checks every answer and prints a
// table plus a score. Nothing is saved anywhere.
//
// The checks are rules a good stylist answer always meets (valid pick, colors
// from the palette, a bright color where one is asked for, at most two accent
// colors unless the style is bold, the note in the right language with no
// numbers or dashes, their own pieces used when they fit, no repeat of what
// they wore yesterday). Since the second round (48 scenarios) it also checks
// today's plans (no pieces the occasion rules out), the learned taste profile
// (no colors or kinds the person keeps swapping away from), the hours they are
// out, extreme weather and more languages. Change SCENARIOS to add cases.

(async () => {
  const { generateOutfit, OCCASIONS } = await import('/outfit.js');
  const { COLORS, colorName, nearestColorKey, isValidColor } = await import('/colors.js');

  const W = (id, name, category, art, color, warmth, extra = {}) => ({
    id, name, category, art, color, hex: COLORS[color].hex, warmth, gender: 'unisex',
    patternType: 'solid', pattern: 'duz', details: {}, rainOk: false, windproof: false, ...extra,
  });
  const WARDROBES = {
    summer: [
      W('s1', 'Siyah tişört', 'ust', 'tee', 'siyah', 1),
      W('s2', 'Lacivert çizgili tişört', 'ust', 'tee', 'lacivert', 1, { patternType: 'stripes', pattern: 'desenli', color2: 'beyaz' }),
      W('s3', 'Açık mavi kot', 'alt', 'jeans', 'denim', 2),
      W('s4', 'Beyaz spor ayakkabı', 'ayak', 'sneaker', 'beyaz', 2),
    ],
    winter: [
      W('w1', 'Bordo kazak', 'ust', 'sweater', 'bordo', 4),
      W('w2', 'Kamel yün kaban', 'dis', 'coat', 'bej', 4),
      W('w3', 'Siyah kumaş pantolon', 'alt', 'trousers', 'siyah', 3),
      W('w4', 'Siyah deri bot', 'ayak', 'boot', 'siyah', 4),
    ],
    loud: [
      W('l1', 'Turuncu sweatshirt', 'ust', 'sweatshirt', 'turuncu', 3),
      W('l2', 'Mor kot ceket', 'dis', 'jacket', 'mor', 3),
    ],
  };

  // [name, feelsLike, uv, rain%, wind, gender, vibe, sky, extra]
  const SCENARIOS = [
    ['Heatwave, sunny, women, elegant', 35, 10, 0, 6, 'kadin', 'elegant', 'clear'],
    ['Heatwave, sunny, men, casual', 34, 9, 0, 8, 'erkek', 'casual', 'clear'],
    ['Hot, cloudy, unisex, sporty', 27, 2, 0, 10, 'unisex', 'sporty', 'cloudy'],
    ['Hot, sunny, women, bold', 28, 7, 0, 6, 'kadin', 'bold', 'clear'],
    ['Hot, sunny, men, minimal', 29, 8, 0, 7, 'erkek', 'minimal', 'clear'],
    ['Mild, partly cloudy, men, minimal', 21, 4, 0, 8, 'erkek', 'minimal', 'partly'],
    ['Mild, evening, women, casual', 20, 5, 0, 8, 'kadin', 'casual', 'clear', { late: true }],
    ['Mild, rain, unisex, casual', 19, 1, 80, 15, 'unisex', 'casual', 'rain'],
    ['Cool, windy, men, elegant', 13, 3, 10, 28, 'erkek', 'elegant', 'partly'],
    ['Cool, sunny, women, minimal', 12, 3, 0, 8, 'kadin', 'minimal', 'clear'],
    ['Cool, cloudy, unisex, bold', 11, 1, 20, 10, 'unisex', 'bold', 'cloudy'],
    ['Cold, cloudy, women, bold', 5, 1, 20, 12, 'kadin', 'bold', 'cloudy'],
    ['Cold, rain, men, sporty', 6, 1, 85, 18, 'erkek', 'sporty', 'rain'],
    ['Freezing, snow, unisex, casual', -9, 1, 70, 15, 'unisex', 'casual', 'snow'],
    ['Freezing, clear, women, elegant', -6, 2, 0, 10, 'kadin', 'elegant', 'clear'],
    ['Hot + summer wardrobe, men', 29, 8, 0, 6, 'erkek', 'casual', 'clear', { wardrobe: 'summer' }],
    ['Hot + summer wardrobe, wore the black tee yesterday', 29, 8, 0, 6, 'erkek', 'casual', 'clear',
      { wardrobe: 'summer', recent: ['yesterday: Siyah tişört (black), Açık mavi kot (denim), Beyaz spor ayakkabı (white)'], avoid: 'Siyah tişört' }],
    ['Cold + winter wardrobe, women, elegant', 4, 1, 0, 10, 'kadin', 'elegant', 'cloudy', { wardrobe: 'winter' }],
    ['Cool + loud wardrobe (orange, purple), unisex, minimal', 14, 2, 0, 9, 'unisex', 'minimal', 'cloudy', { wardrobe: 'loud' }],
    ['Cool, English, men, casual', 14, 3, 0, 9, 'erkek', 'casual', 'partly', { lang: 'en' }],
    ['Hot, Japanese, women, minimal', 30, 8, 0, 7, 'kadin', 'minimal', 'clear', { lang: 'ja' }],
    ['Cold, Russian, men, elegant', 3, 1, 10, 12, 'erkek', 'elegant', 'cloudy', { lang: 'ru' }],
    ['Mild, Arabic, women, casual', 22, 6, 0, 8, 'kadin', 'casual', 'clear', { lang: 'ar' }],
    ['Hot, Hindi, men, bold', 31, 9, 0, 6, 'erkek', 'bold', 'clear', { lang: 'hi' }],
    // Round two: today's plans, hours outside, learned taste, extreme weather, more languages.
    ['Work, cool, men', 13, 3, 0, 10, 'erkek', 'casual', 'partly', { occasion: 'work' }],
    ['Work, hot, women', 29, 8, 0, 6, 'kadin', 'casual', 'clear', { occasion: 'work' }],
    ['Work, rain, unisex', 11, 1, 85, 16, 'unisex', 'minimal', 'rain', { occasion: 'work' }],
    ['Date, mild evening, women', 19, 3, 0, 7, 'kadin', 'casual', 'clear', { occasion: 'date', late: true }],
    ['Date, cold, men', 4, 1, 10, 12, 'erkek', 'casual', 'cloudy', { occasion: 'date' }],
    ['Event, mild, women, elegant', 20, 4, 0, 8, 'kadin', 'elegant', 'partly', { occasion: 'event' }],
    ['Event, cold, men', 2, 1, 0, 10, 'erkek', 'minimal', 'clear', { occasion: 'event' }],
    ['Sport, hot, unisex', 30, 9, 0, 8, 'unisex', 'sporty', 'clear', { occasion: 'sport' }],
    ['Sport, cold rain, women', 7, 1, 80, 18, 'kadin', 'casual', 'rain', { occasion: 'sport' }],
    ['School, cool, unisex', 12, 2, 10, 10, 'unisex', 'casual', 'cloudy', { occasion: 'school' }],
    ['Out and about, hot, women', 31, 10, 0, 7, 'kadin', 'casual', 'clear', { occasion: 'walk' }],
    ['Out only in the cold morning hours, men', 1, 1, 0, 12, 'erkek', 'casual', 'clear', { hours: '07:00-10:00' }],
    ['Taste: swaps away from yellow and hoodies', 12, 2, 0, 9, 'unisex', 'casual', 'partly',
      { taste: 'Often wears navy, beige and grey. Usually swaps away from yellow and hoodies: use them only when nothing else works.', avoidColor: 'sari', avoidKind: 'hoodie' }],
    ['Taste: loves navy and beige, asks for casual', 20, 4, 0, 8, 'kadin', 'elegant', 'partly',
      { taste: 'Often wears navy, beige and denim blue. Likes jeans and sneakers. Often asks for more casual outfits.' }],
    ['Taste: found picks too plain', 6, 1, 10, 12, 'erkek', 'minimal', 'cloudy',
      { taste: 'When they disliked your picks, it was because it was too plain. Give the outfit one clear accent color instead of an all-neutral look.', wantAccent: true }],
    ['Extreme cold, snow, unisex', -20, 1, 60, 18, 'unisex', 'casual', 'snow'],
    ['Extreme heat, strong sun, men', 38, 11, 0, 5, 'erkek', 'casual', 'clear'],
    ['Storm, heavy rain and wind, women', 10, 1, 95, 48, 'kadin', 'casual', 'storm'],
    ['Fog, cool, men, elegant', 9, 1, 20, 6, 'erkek', 'elegant', 'fog'],
    ['Mild, German, women, bold', 18, 4, 0, 9, 'kadin', 'bold', 'partly', { lang: 'de' }],
    ['Cold, Polish, men, casual', 0, 1, 20, 14, 'erkek', 'casual', 'cloudy', { lang: 'pl' }],
    ['Hot, French, women, elegant', 28, 8, 0, 7, 'kadin', 'elegant', 'clear', { lang: 'fr' }],
    ['Cool, Korean, unisex, minimal', 13, 3, 0, 8, 'unisex', 'minimal', 'partly', { lang: 'ko' }],
    ['Mild, Chinese, men, elegant', 21, 5, 0, 7, 'erkek', 'elegant', 'clear', { lang: 'zh' }],
  ];

  const ALIASES = { camel: 'bej', cream: 'beyaz', ivory: 'beyaz', tan: 'bej', sand: 'bej', charcoal: 'gri', gray: 'gri', olive: 'haki', maroon: 'bordo', wine: 'bordo', rust: 'turuncu', mustard: 'sari', lilac: 'mor', 'light blue': 'mavi', 'sky blue': 'mavi' };
  const EN_TO_KEY = { ...Object.fromEntries(Object.keys(COLORS).map(k => [colorName(k, 'en').toLowerCase(), k])), ...ALIASES };
  const SCRIPT = { tr: /[a-zçğıöşü]/i, en: /[a-z]/i, ja: /[぀-ヿ]/, ru: /[Ѐ-ӿ]/, ar: /[؀-ۿ]/, hi: /[ऀ-ॿ]/,
    de: /[a-zäöüß]/i, pl: /[a-ząćęłńóśźż]/i, fr: /[a-zàâçéèêëîïôûùüÿœ]/i, ko: /[가-힣]/, zh: /[一-鿿]/ };
  const TR_LOANWORDS = /\b(outfit|look|oversize|layering|sneaker|joggers?|crop|tuck|style|color)\b/i;

  const run = async ([name, feelsLike, uv, rain, wind, gender, vibe, sky, x = {}]) => {
    const items = x.wardrobe ? WARDROBES[x.wardrobe] : [];
    const lang = x.lang || 'tr';
    const seen = new Set();
    const cands = [];
    for (let roll = 0; roll < 10 && cands.length < 6; roll++) {
      const o = generateOutfit({ feelsLike, wind, rainMax: rain, gender, lang: 'en', vibe, seed: '2026-07-02', kind: sky, uv, late: !!x.late, adjust: roll ? { reroll: roll } : null, occasion: x.occasion || null }, items);
      const sig = o.rows.map(r => `${r.slotKey}:${r.item}`).join('|');
      if (seen.has(sig)) continue;
      seen.add(sig);
      cands.push(o.rows.map(r => {
        const own = r.fromWardrobe ? items.find(i => i.id === r.itemId) : null;
        const hex = r.color || (r.look && r.look.color);
        const key = own && isValidColor(own.color) ? own.color : hex ? nearestColorKey(hex) : null;
        return { slot: r.slotKey, item: r.item, kind: r.art, owned: !!r.fromWardrobe, colorRule: r.colorRule || 'free', key: (r.fromWardrobe || r.colorRule === 'fixed') ? key : null };
      }));
    }
    const body = {
      lang, weather: { feelsLike, wind, rain, uv, sky, late: !!x.late, hours: x.hours || '' },
      person: { gender, styleVibe: vibe, comfort: 'normal', learned: '', taste: x.taste || '' }, recent: x.recent || [],
      occasion: x.occasion || null,
      candidates: cands.map(rows => ({ rows: rows.map(r => ({ ...r, color: r.key ? colorName(r.key, 'en').toLowerCase() : null, key: undefined })) })),
    };
    const t0 = Date.now();
    let res = null, error = null;
    try {
      const resp = await fetch('/api/stylist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      res = await resp.json();
      if (!resp.ok) error = res.error || `HTTP ${resp.status}`;
    } catch (e) { error = String(e); }
    const secs = (Date.now() - t0) / 1000;

    const fails = [];
    const chosen = res && Number.isInteger(res.pick) ? cands[res.pick] : null;
    if (error) fails.push(`error: ${error}`);
    else if (!chosen) fails.push(`invalid pick ${res && res.pick}`);
    if (chosen) {
      const colors = {};
      for (const [slot, val] of Object.entries(res.colors || {})) {
        const k = EN_TO_KEY[String(val).toLowerCase().trim()];
        if (!k) fails.push(`unknown color "${val}"`);
        const row = chosen.find(r => r.slot === slot) || chosen.find(r => r.kind === slot);
        if (!row) continue;
        if (k && !row.owned && row.colorRule !== 'fixed') colors[row.slot] = k;
      }
      for (const r of chosen) if (r.colorRule === 'accent' && (!colors[r.slot] || COLORS[colors[r.slot]].neutral)) fails.push(`"${r.item}" should get a bright color`);
      const finalKeys = chosen.map(r => colors[r.slot] || r.key).filter(Boolean);
      const accents = new Set(finalKeys.filter(k => !COLORS[k].neutral));
      if (accents.size > (vibe === 'bold' ? 3 : 2)) fails.push(`too many accent colors: ${[...accents].join(', ')}`);
      const note = String(res.note || '');
      if (note.length < 25 || note.length > 320) fails.push(`note length ${note.length}`);
      if (/\d/.test(note)) fails.push('note has a number');
      if (/[–—]/.test(note)) fails.push('note has a dash');
      if (SCRIPT[lang] && !SCRIPT[lang].test(note)) fails.push(`note not in ${lang}`);
      if (lang === 'tr' && TR_LOANWORDS.test(note)) fails.push(`English word in Turkish: ${note.match(TR_LOANWORDS)[0]}`);
      if ((note.match(/[.!?。]/g) || []).length > 3) fails.push('note is longer than two or three sentences');
      if (/\b(outfit|option)\s*\d|seçenek\s*\d/i.test(note)) fails.push('note mentions an option number');
      if (items.length && cands.some(c => c.some(r => r.owned)) && !chosen.some(r => r.owned)) fails.push('ignored their own pieces');
      if (x.avoid && chosen.some(r => r.item === x.avoid) && cands.some(c => !c.some(r => r.item === x.avoid))) fails.push(`repeated yesterday's "${x.avoid}"`);
      // Today's plans: nothing the occasion rules out, when another option avoided it.
      const occ = x.occasion && OCCASIONS[x.occasion];
      if (occ) {
        const banned = r => occ.avoid.includes(r.kind);
        const bad = chosen.filter(banned);
        if (bad.length && cands.some(c => !c.some(banned))) fails.push(`wrong for ${x.occasion}: ${bad.map(r => r.item).join(', ')}`);
      }
      // Learned taste: no color or kind they keep swapping away from, when there was a choice.
      if (x.avoidColor && Object.values(colors).includes(x.avoidColor)) fails.push(`used ${x.avoidColor} although they avoid it`);
      if (x.wantAccent && !accents.size) fails.push('all neutral although they found the picks too plain');
      if (x.avoidKind && chosen.some(r => r.kind === x.avoidKind) && cands.some(c => !c.some(r => r.kind === x.avoidKind))) fails.push(`picked a ${x.avoidKind} although they avoid it`);
      if (secs > 15) fails.push(`slow: ${secs.toFixed(1)}s`);
    }
    return {
      name, lang, secs: +secs.toFixed(1), pass: !fails.length, fails: fails.join('; '),
      outfit: chosen ? chosen.map(r => `${r.item}${(res.colors || {})[r.slot] && !r.owned && r.colorRule !== 'fixed' ? ` (${res.colors[r.slot]})` : r.key ? ` (${colorName(r.key, 'en').toLowerCase()}${r.owned ? ', own' : ''})` : ''}`).join(' + ') : '',
      note: res && res.note,
    };
  };

  const results = [];
  for (let i = 0; i < SCENARIOS.length; i += 6) {
    results.push(...await Promise.all(SCENARIOS.slice(i, i + 6).map(run)));
  }
  const passed = results.filter(r => r.pass).length;
  console.table(results.map(({ name, pass, secs, fails }) => ({ name, pass, secs, fails })));
  console.log(`Stylist exam: ${passed}/${results.length} passed, average ${(results.reduce((s, r) => s + r.secs, 0) / results.length).toFixed(1)}s`);
  window.__stylistExam = results;
  return results;
})();
