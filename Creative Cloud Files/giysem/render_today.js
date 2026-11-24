import { icons } from './icons.js';
import { t } from './i18n.js';
import { brandHeader, attachHeaderHandlers } from './render_header.js';
import { state, switchTab, setGender, setWardrobeOnly, openCitySheet, refetchForecast, swapOutfitPiece, resetOutfit, wearToday, unwearToday, answerFeedback,
  toggleAdjustPanel, rerollOutfit, swapSuggestedPiece, quickAdjust, askAdjust } from './app.js';
import { dayLabel, sameOutfit } from './feedback.js';
import { renderLandmark } from './landmarks.js';
import { garmentArt, weatherGlyph, tempColor, outfitFigure, figurePartsFromRows, wornPieces } from './visuals.js';

// Turkish writes the percent sign first (%20); German and Spanish leave a space (20 %); others 20%.
const pct = (n, lang) => (lang === 'tr' ? `%${n}` : lang === 'de' || lang === 'es' ? `${n} %` : `${n}%`);

function cityRow(s) {
  const city = s.city;
  const label = city ? (city.admin && city.admin !== city.name ? `${city.name}, ${city.admin}` : city.name) : t(s.lang, 'no_city');
  return `
    <button class="city-chip fade-slide" data-action="open-city">
      ${icons.location}
      <span>${label}</span>
      ${icons.chevron}
    </button>
  `;
}

function heroSection(dayView, s) {
  const h = dayView.hero;
  return `
    <section class="hero">
      <div class="hero-main">
        ${cityRow(s)}
        <div class="hero-row">
          <div class="hero-temp pop-in" style="animation-delay:80ms">
            <span class="count-up" data-to="${h.feelsLike}">${h.feelsLike}</span><span class="hero-deg">°</span>
          </div>
          <div class="hero-glyph pop-in" style="animation-delay:140ms">${weatherGlyph(h.kind, h.isDay)}</div>
        </div>
        <div class="hero-meta fade-slide" style="animation-delay:200ms">
          <span class="hero-temp-label">${t(s.lang, 'hissedilen')}</span>
          ${h.hasActualTemp ? `<span class="hero-thermo">${t(s.lang, 'termometre', h.actualTemp)}</span>` : ''}
        </div>
        <div class="hero-condition fade-slide" style="animation-delay:260ms"><strong>${h.condition}</strong></div>
        <div class="hero-stats fade-slide" style="animation-delay:320ms">
          <span class="stat-pill">${icons.wind}<b>${h.wind}</b> ${t(s.lang, 'unit_kmh')}</span>
          <span class="stat-pill">${icons.drop}<b>${pct(h.rain, s.lang)}</b></span>
        </div>
      </div>
      ${renderLandmark(s.city)}
    </section>
  `;
}

// Smooth temperature curve through morning / noon / evening.
function daypartCard(parts, s) {
  const order = [['sabah', '08:00'], ['ogle', '13:00'], ['aksam', '19:00']];
  const pts = order.map(([key, time]) => ({ key, time, p: parts[key] }));
  const temps = pts.filter(x => x.p).map(x => x.p.feelsLike);
  if (!temps.length) return '';
  const min = Math.min(...temps), max = Math.max(...temps);
  const span = Math.max(4, max - min);
  const W = 300, H = 70, xs = [50, 150, 250];
  const ys = pts.map(x => x.p ? 14 + (1 - (x.p.feelsLike - min) / span) * (H - 28) : null);
  const valid = pts.map((x, i) => x.p ? [xs[i], ys[i]] : null).filter(Boolean);
  let d = '';
  valid.forEach(([x, y], i) => {
    if (i === 0) { d = `M${x} ${y}`; return; }
    const [px, py] = valid[i - 1];
    const cx = (px + x) / 2;
    d += ` C${cx} ${py} ${cx} ${y} ${x} ${y}`;
  });
  const area = valid.length > 1 ? `${d} L${valid[valid.length - 1][0]} ${H} L${valid[0][0]} ${H} Z` : '';
  return `
    <section class="glass daypart-card fade-slide" style="animation-delay:180ms">
      <svg class="daypart-curve" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="dpStroke" x1="0" x2="1">
            ${pts.map((x, i) => `<stop offset="${i / 2}" stop-color="${tempColor(x.p ? x.p.feelsLike : min)}"/>`).join('')}
          </linearGradient>
          <linearGradient id="dpFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="${tempColor(max)}" stop-opacity=".28"/><stop offset="1" stop-color="${tempColor(max)}" stop-opacity="0"/>
          </linearGradient>
        </defs>
        ${area ? `<path d="${area}" fill="url(#dpFill)"/>` : ''}
        <path class="draw-line" d="${d}" fill="none" stroke="url(#dpStroke)" stroke-width="4" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
      </svg>
      <div class="daypart-cols">
        ${pts.map(({ time, p }, i) => `
          <div class="daypart" style="--dot-y:${ys[i] != null ? ys[i].toFixed(1) : 35}">
            ${p ? `<span class="daypart-dot" style="background:${tempColor(p.feelsLike)}"></span>` : ''}
            <span class="daypart-temp">${p ? p.feelsLike + '°' : '?'}</span>
            <span class="daypart-time">${time}</span>
            ${p ? `<span class="daypart-sub">${icons.wind}${p.wind} · ${icons.drop}${pct(p.rain, s.lang)}</span>` : ''}
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function genderSelector(s) {
  const opts = [['unisex', 'gender_unisex'], ['kadin', 'gender_kadin'], ['erkek', 'gender_erkek']];
  const idx = Math.max(0, opts.findIndex(([k]) => k === s.gender));
  return `
    <div class="seg fade-slide" style="--i:${idx};--n:${opts.length};animation-delay:240ms">
      <span class="seg-thumb"></span>
      ${opts.map(([key, labelKey]) => `
        <button class="seg-btn ${s.gender === key ? 'active' : ''}" data-gender="${key}">${t(s.lang, labelKey)}</button>
      `).join('')}
    </div>
  `;
}

// The outfit drawn as one figure (layer rules live in figurePartsFromRows).
function boardCard(outfit, s) {
  const figure = outfitFigure(figurePartsFromRows(outfit.rows));
  return `
    <article class="glass look-card board-card rise-in" style="animation-delay:300ms" aria-label="${t(s.lang, 'board_title')}">
      <div class="look-slot board-title"><span>${t(s.lang, 'board_title')}</span></div>
      <div class="board ${s.swappedSlot ? 'bump' : ''}">${figure}</div>
    </article>`;
}

function outfitSection(outfit, kombinLabel, s, fb = {}) {
  return `
    <div class="section-head fade-slide" style="animation-delay:280ms">
      <h2 class="section-big">${kombinLabel}</h2>
      <div class="section-actions">
        ${s.wardrobe && s.wardrobe.length ? `<button class="mine-toggle ${s.wardrobeOnly ? 'on' : ''}" data-action="toggle-mine" aria-pressed="${s.wardrobeOnly ? 'true' : 'false'}">${icons.hanger}<span>${t(s.lang, 'only_mine')}</span></button>` : ''}
        ${Object.keys(s.outfitLocks || {}).length || fb.adjust ? `<button class="reset-chip" data-action="reset-outfit">${t(s.lang, 'reset_outfit')}</button>` : ''}
        <span class="band-chip">${outfit.bandLabel}</span>
      </div>
    </div>
    <div class="outfit-layout">
      <div class="board-col">${boardCard(outfit, s)}</div>
      <div class="glass pieces-card rise-in" style="animation-delay:340ms">
        ${memoryNote(fb, s)}
        ${outfit.rows.map((row, i) => `
          <article class="piece-row ${row.fromWardrobe ? 'is-mine' : ''} ${s.swappedSlot === row.slotKey || s.swappedSlot === 'all' ? 'swapped' : ''}" style="--stag:${s.swappedSlot === 'all' ? i : 0}">
            <div class="piece-art" style="--float-delay:${i * -0.8}s">
              ${garmentArt(row.art, row.color || (row.look && row.look.color), row.look, 'flat')}
            </div>
            <div class="piece-body">
              <div class="look-slot">
                <span>${row.label}</span>
                ${row.fromWardrobe ? `<span class="wardrobe-tag">${icons.hanger}${t(s.lang, 'gardirobundan')}</span>` : ''}
              </div>
              <div class="look-item">${row.color ? `<span class="color-dot ${row.patterned ? 'patterned' : ''}" style="background:${row.color}"></span>` : ''}${row.item}</div>
              <div class="look-reason">${row.reason}</div>
            </div>
            ${row.options && row.options.length > 1 ? `
              <button class="swap-btn" data-swap="${row.slotKey}" aria-label="${t(s.lang, 'swap_piece')}: ${row.label}">
                ${icons.swap}<span>${row.options.indexOf(row.itemId) + 1}/${row.options.length}</span>
              </button>` : row.swappable && fb.isToday ? `
              <button class="swap-btn swap-suggest" data-swap-suggest="${row.slotKey}" aria-label="${t(s.lang, 'swap_piece')}: ${row.label}" title="${t(s.lang, 'swap_piece')}">
                ${icons.swap}
              </button>` : ''}
          </article>
        `).join('')}
        ${tipsList(outfit, s)}
        ${wearRow(fb, s)}
        ${adjustPanel(fb, s)}
      </div>
    </div>
  `;
}

// "Last Tuesday felt like today and you were cold": why today's outfit is warmer/lighter.
function memoryNote(fb, s) {
  const m = fb.memory;
  if (!m) return '';
  const day = dayLabel(m.date, fb.date, s.lang, t);
  return `<div class="memory-note">${SPARKLE}<span>${t(s.lang, 'fb_memory_' + m.answer, day, m.feelsLike)}</span></div>`;
}

// "I'm wearing this today" (only for today's outfit).
function wearRow(fb, s) {
  if (!fb.isToday) return '';
  if (fb.worn && !fb.wornSame) {
    // Today is marked, but with a different outfit than the one on screen
    // (gender, city or pieces changed since). Show which one, and let them switch.
    return `<div class="wear-row is-other">
      <div class="wear-other"><span class="wear-other-text">${t(s.lang, 'fb_worn_other')}</span>${wornPieces(fb.worn.rows)}</div>
      <button type="button" class="wear-btn wear-switch" data-action="wear">${icons.hanger}<span>${t(s.lang, 'fb_wear_this')}</span></button></div>`;
  }
  if (fb.worn) {
    // A small confetti burst right after "I'm wearing this".
    const confetti = s.celebrate ? `<div class="confetti" aria-hidden="true">${Array.from({ length: 16 }, (_, i) => `<i style="--a:${(i * 360 / 16 + (i % 3) * 7).toFixed(0)}deg;--d:${48 + (i % 4) * 14}px;--c:${CONFETTI[i % CONFETTI.length]};--r:${(i * 47) % 360}deg"></i>`).join('')}</div>` : '';
    return `<div class="wear-row is-worn">${confetti}<span class="wear-done">${icons.check || '✓'}<span>${t(s.lang, 'fb_wearing')}</span></span>
      <button type="button" class="wear-undo" data-action="unwear">${t(s.lang, 'fb_undo')}</button></div>`;
  }
  return `<div class="wear-row"><button type="button" class="wear-btn" data-action="wear">${icons.hanger}<span>${t(s.lang, 'fb_wear')}</span></button></div>`;
}

// "Not feeling it? Change it": a new outfit, quick options, or a typed request.
const CONFETTI = ['#ffd166', '#ff9f5a', '#ff6f7d', '#3e8fee', '#2f9e6e', '#b9a3c9'];
const SEND_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M13 6l6 6-6 6"/></svg>';
const QUICK = [['warmer', '🧥'], ['lighter', '👕'], ['dark', '🌑'], ['bright', '🌈'], ['elegant', '✨'], ['casual', '🛋️'], ['sporty', '🏃'], ['shoes', '👟']];
function quickActive(kind, a) {
  if (!a) return false;
  if (kind === 'warmer') return a.warmth > 0;
  if (kind === 'lighter') return a.warmth < 0;
  if (kind === 'dark' || kind === 'bright') return a.tone === kind;
  if (['elegant', 'casual', 'sporty'].includes(kind)) return a.vibe === kind;
  return false;
}
function adjustPanel(fb, s) {
  if (!fb.isToday) return '';
  if (!s.adjustOpen) {
    return `<div class="adjust"><button type="button" class="adjust-toggle" data-action="toggle-adjust">🎲 <span>${t(s.lang, 'adj_toggle')}</span></button></div>`;
  }
  const a = fb.adjust;
  return `
    <div class="adjust open">
      <div class="adjust-head">
        <button type="button" class="dice-btn ${s.diceSpin ? 'spin' : ''}" data-action="reroll"><span class="dice">🎲</span><span>${t(s.lang, 'adj_dice')}</span></button>
        <button type="button" class="adjust-close" data-action="toggle-adjust" aria-label="${t(s.lang, 'cancel')}">✕</button>
      </div>
      <div class="adjust-grid">
        ${QUICK.map(([k, e]) => `<button type="button" class="adjust-tile ${quickActive(k, a) ? 'active' : ''}" data-adjust="${k}" aria-pressed="${quickActive(k, a)}"><span class="tile-emoji">${e}</span><span class="tile-label">${t(s.lang, 'adj_' + k)}</span></button>`).join('')}
      </div>
      <form class="adjust-ask" data-action="ask-adjust">
        <input id="adjust-input" type="text" maxlength="300" autocomplete="off" placeholder="${escapeHtml(t(s.lang, 'adj_ask_placeholder'))}" aria-label="${escapeHtml(t(s.lang, 'adj_ask_placeholder'))}" ${s.adjustBusy ? 'disabled' : ''} />
        <button type="submit" class="adjust-send" aria-label="${t(s.lang, 'adj_send')}" ${s.adjustBusy ? 'disabled' : ''}>${s.adjustBusy ? '<span class="btn-spinner btn-spinner-dark"></span>' : SEND_ICON}</button>
      </form>
      ${s.adjustBusy ? `<div class="adjust-reply">${t(s.lang, 'adj_thinking')}</div>` : a && a.reply ? `<div class="adjust-reply">${SPARKLE}<span>${escapeHtml(a.reply)}</span></div>` : ''}
    </div>`;
}
function escapeHtml(str) {
  return String(str || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// "How was it?" for a day the user wore our outfit.
function feedbackCard(pending, today, s) {
  if (!pending) return '';
  const day = dayLabel(pending.date, today, s.lang, t);
  const opts = [['cold', '🥶'], ['ok', '👌'], ['warm', '🥵']];
  return `
    <section class="glass fb-card rise-in" style="animation-delay:200ms" aria-live="polite">
      <div class="fb-q">${pending.date === today ? t(s.lang, 'fb_question_today', pending.feelsLike) : t(s.lang, 'fb_question', day, pending.feelsLike)}</div>
      ${pending.rows && pending.rows.length ? wornPieces(pending.rows, true) : ''}
      <div class="fb-opts">
        ${opts.map(([k, e]) => `<button type="button" class="fb-opt" data-fb="${k}" data-fb-date="${pending.date}"><span class="fb-emoji">${e}</span><span>${t(s.lang, 'fb_' + k)}</span></button>`).join('')}
      </div>
      <button type="button" class="fb-skip" data-fb="skip" data-fb-date="${pending.date}">${t(s.lang, 'fb_skip')}</button>
    </section>`;
}

// Wardrobe-only mode: what to add or watch out for with the user's own clothes.
function tipsList(outfit, s) {
  if (s.wardrobeOnly && !outfit.wardrobeOnly) return `<div class="mine-tips"><div class="mine-tips-text">${t(s.lang, 'only_mine_empty')}</div></div>`;
  if (!outfit.wardrobeOnly || !outfit.tips || !outfit.tips.length) return '';
  return `
    <div class="mine-tips">
      <div class="look-slot"><span>${t(s.lang, 'tips_title')}</span></div>
      <ul>${outfit.tips.map(x => `<li>${x}</li>`).join('')}</ul>
    </div>`;
}

function tipBox(tip, delay, s, dayOffset) {
  const useSmartTip = dayOffset === 0;
  const isLoading = useSmartTip && s.smartTipLoading;
  const smartText = useSmartTip ? s.smartTip : null;
  const text = isLoading ? t(s.lang, 'smart_tip_loading') : (smartText || tip);
  return `
    <section class="tip-card fade-slide" style="animation-delay:${delay}ms">
      <span class="tip-orb">${isLoading ? `<span class="btn-spinner"></span>` : SPARKLE}</span>
      <div>
        <div class="tip-title">
          ${t(s.lang, 'gunun_notu')}
          ${smartText && !isLoading ? `<span class="smart-tip-badge">${t(s.lang, 'smart_tip_badge')}</span>` : ''}
        </div>
        <div class="tip-text">${text}</div>
      </div>
    </section>
  `;
}

const SPARKLE = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.2 6.3 6.3 2.2-6.3 2.2L12 19.5l-2.2-6.3L3.5 11l6.3-2.2z"/><path d="M19 15.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z" opacity=".7"/></svg>';

function loadingState(s) {
  return `
    ${brandHeader(s)}
    <div class="state-msg">
      <div class="loader-orb">${weatherGlyph('partly', true)}</div>
      ${t(s.lang, 'loading_weather')}
    </div>
  `;
}

export function renderTodayScreen({ dayOffset, state: s, data }) {
  if (s.loading) return loadingState(s);
  if (s.error) {
    return `
      ${brandHeader(s)}
      <div class="state-msg glass">${s.error}<br><br>
        <button class="btn-primary" data-action="retry">${t(s.lang, 'retry')}</button>
      </div>
    `;
  }
  if (!data) {
    return `${brandHeader(s)}<div class="state-msg">${t(s.lang, 'loading_data')}</div>`;
  }
  const { dayView, outfit, tip, memory, worn, pending, today, adjust } = data;
  const fb = { memory, worn, wornSame: !!worn && sameOutfit(worn.rows, outfit.rows), isToday: dayOffset === 0, date: dayView.date, adjust };
  const kombinLabel = dayOffset === 0 ? t(s.lang, 'kombin_bugun') : t(s.lang, 'kombin_yarin');
  return `
    ${brandHeader(s)}
    <div class="today-layout" style="--band-color:var(--band-${outfit.bandKey});--band-soft:var(--band-${outfit.bandKey}-soft);">
      <div class="today-top">
        ${heroSection(dayView, s)}
        <div class="today-side">
          ${daypartCard(dayView.parts, s)}
          ${genderSelector(s)}
        </div>
      </div>
      ${dayOffset === 0 ? feedbackCard(pending, today, s) : ''}
      ${outfitSection(outfit, kombinLabel, s, fb)}
      ${tipBox(tip, 320 + outfit.rows.length * 90, s, dayOffset)}
      <div class="footer-note">${t(s.lang, 'footer')}</div>
    </div>
  `;
}

// Counts the big temperature up from the previously shown value, so it only
// animates when the number actually changes (not on every app re-render).
let lastShownTemp = null;
function animateCounts(root) {
  const el = root.querySelector('.count-up');
  if (!el) return;
  const to = parseInt(el.dataset.to, 10);
  const from = lastShownTemp == null ? (to > 0 ? 0 : to + 10) : lastShownTemp;
  lastShownTemp = to;
  if (from === to || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const start = performance.now(), dur = 900;
  const step = (now) => {
    const k = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - k, 3);
    el.textContent = Math.round(from + (to - from) * eased);
    if (k < 1 && el.isConnected) requestAnimationFrame(step);
  };
  el.textContent = from;
  requestAnimationFrame(step);
}

export function attachTodayHandlers(root) {
  attachHeaderHandlers(root);
  root.querySelectorAll('[data-gender]').forEach(btn => {
    btn.addEventListener('click', () => setGender(btn.dataset.gender));
  });
  const cityBtn = root.querySelector('[data-action="open-city"]');
  if (cityBtn) cityBtn.addEventListener('click', openCitySheet);
  const retryBtn = root.querySelector('[data-action="retry"]');
  if (retryBtn) retryBtn.addEventListener('click', refetchForecast);
  root.querySelectorAll('[data-swap]').forEach(btn => {
    btn.addEventListener('click', () => swapOutfitPiece(btn.dataset.swap));
  });
  root.querySelectorAll('[data-action="toggle-adjust"]').forEach(b => b.addEventListener('click', toggleAdjustPanel));
  const rerollBtn = root.querySelector('[data-action="reroll"]');
  if (rerollBtn) rerollBtn.addEventListener('click', rerollOutfit);
  root.querySelectorAll('[data-swap-suggest]').forEach(btn => {
    btn.addEventListener('click', () => swapSuggestedPiece(btn.dataset.swapSuggest));
  });
  root.querySelectorAll('[data-adjust]').forEach(btn => {
    btn.addEventListener('click', () => quickAdjust(btn.dataset.adjust));
  });
  const askForm = root.querySelector('[data-action="ask-adjust"]');
  if (askForm) askForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = askForm.querySelector('#adjust-input');
    askAdjust(input ? input.value : '');
  });
  const wearBtn = root.querySelector('[data-action="wear"]');
  if (wearBtn) wearBtn.addEventListener('click', wearToday);
  const unwearBtn = root.querySelector('[data-action="unwear"]');
  if (unwearBtn) unwearBtn.addEventListener('click', unwearToday);
  root.querySelectorAll('[data-fb]').forEach(btn => {
    btn.addEventListener('click', () => answerFeedback(btn.dataset.fbDate, btn.dataset.fb));
  });
  const mineBtn = root.querySelector('[data-action="toggle-mine"]');
  if (mineBtn) mineBtn.addEventListener('click', () => setWardrobeOnly(!state.wardrobeOnly));
  const resetBtn = root.querySelector('[data-action="reset-outfit"]');
  if (resetBtn) resetBtn.addEventListener('click', resetOutfit);
  animateCounts(root);
}
