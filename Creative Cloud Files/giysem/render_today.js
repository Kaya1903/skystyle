import { icons } from './icons.js';
import { t } from './i18n.js';
import { brandHeader, attachHeaderHandlers } from './render_header.js';
import { state, switchTab, setGender, openCitySheet, refetchForecast, swapOutfitPiece, resetOutfit } from './app.js';
import { renderLandmark } from './landmarks.js';
import { garmentArt, weatherGlyph, tempColor, outfitFigure, figurePartsFromRows } from './visuals.js';

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
          <span class="stat-pill">${icons.drop}<b>%${h.rain}</b></span>
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
            ${p ? `<span class="daypart-sub">${icons.wind}${p.wind} · ${icons.drop}%${p.rain}</span>` : ''}
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
      <div class="board">${figure}</div>
    </article>`;
}

function outfitSection(outfit, kombinLabel, s) {
  return `
    <div class="section-head fade-slide" style="animation-delay:280ms">
      <h2 class="section-big">${kombinLabel}</h2>
      <div class="section-actions">
        ${Object.keys(s.outfitLocks || {}).length ? `<button class="reset-chip" data-action="reset-outfit">${t(s.lang, 'reset_outfit')}</button>` : ''}
        <span class="band-chip">${outfit.bandLabel}</span>
      </div>
    </div>
    <div class="look-grid">
      ${boardCard(outfit, s)}
      ${outfit.rows.map((row, i) => `
        <article class="glass look-card ${i === 0 ? 'lead' : ''} ${row.fromWardrobe ? 'is-mine' : ''} ${s.swappedSlot === row.slotKey ? 'swapped' : ''} rise-in" style="animation-delay:${320 + i * 90}ms">
          <div class="look-art" style="--float-delay:${i * -0.7}s">
            ${garmentArt(row.art, row.color, row.look)}
          </div>
          ${row.options && row.options.length > 1 ? `
            <button class="swap-btn" data-swap="${row.slotKey}" aria-label="${t(s.lang, 'swap_piece')}: ${row.label}">
              ${icons.swap}<span>${row.options.indexOf(row.itemId) + 1}/${row.options.length}</span>
            </button>` : ''}
          <div class="look-body">
            <div class="look-slot">
              <span>${row.label}</span>
              ${row.fromWardrobe ? `<span class="wardrobe-tag">${icons.hanger}${t(s.lang, 'gardirobundan')}</span>` : ''}
            </div>
            <div class="look-item">${row.color ? `<span class="color-dot ${row.patterned ? 'patterned' : ''}" style="background:${row.color}"></span>` : ''}${row.item}</div>
            <div class="look-reason">${row.reason}</div>
          </div>
        </article>
      `).join('')}
    </div>
  `;
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
  const { dayView, outfit, tip } = data;
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
      ${outfitSection(outfit, kombinLabel, s)}
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
  const resetBtn = root.querySelector('[data-action="reset-outfit"]');
  if (resetBtn) resetBtn.addEventListener('click', resetOutfit);
  animateCounts(root);
}
