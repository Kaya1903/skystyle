import { icons } from './icons.js';
import { t } from './i18n.js';
import { brandHeader, attachHeaderHandlers } from './render_header.js';
import { refetchForecast } from './app.js';
import { garmentArt, weatherGlyph, tempColor } from './visuals.js';

// The piece that best "headlines" the day's look: outerwear if needed, else the top.
function headlinePiece(outfit) {
  return outfit.rows.find(r => r.slotKey === 'dis') || outfit.rows[0];
}

// A day's tip shows two lines; a tap on the day shows all of it (and another tap folds it).
const openDays = new Set();

function weekDayRow({ day, outfit, tip, tipLoading, tipKey }, index, s, range) {
  const d = new Date(day.date + 'T00:00:00');
  const weekdayName = index === 0 ? t(s.lang, 'week_today') : t(s.lang, 'weekdays')[d.getDay()];
  const piece = headlinePiece(outfit);
  const text = tipLoading ? t(s.lang, 'smart_tip_loading') : (tip || piece.item);
  const span = Math.max(1, range.max - range.min);
  const left = ((day.feelsMin - range.min) / span) * 100;
  const width = Math.max(6, ((day.feelsMax - day.feelsMin) / span) * 100);
  return `
    <article class="glass week-row rise-in ${openDays.has(day.date) ? 'open' : ''}" style="animation-delay:${80 + index * 70}ms" data-tip-key="${escapeAttr(tipKey)}" data-day="${day.date}" aria-expanded="${openDays.has(day.date)}">
      <div class="week-row-day">
        <span class="week-day-name">${weekdayName}</span>
        <span class="week-day-num">${d.getDate()}</span>
      </div>
      <div class="week-glyph">${weatherGlyph(day.kind, true, 'wglyph-sm')}</div>
      <div class="week-row-body">
        <div class="week-row-condition">
          ${day.condition}
          ${tip || tipLoading ? `<span class="smart-tip-badge ${tipLoading ? 'is-waiting' : ''}">${t(s.lang, 'smart_tip_badge')}</span>` : ''}
        </div>
        <div class="week-range">
          <span class="week-temp-min">${day.feelsMin}°</span>
          <span class="range-track">
            <span class="range-fill" style="left:${left}%;width:${width}%;background:linear-gradient(90deg, ${tempColor(day.feelsMin)}, ${tempColor(day.feelsMax)});animation-delay:${200 + index * 70}ms"></span>
          </span>
          <span class="week-temp-max">${day.feelsMax}°</span>
        </div>
        <div class="week-row-tip" data-fallback="${escapeAttr(piece.item)}">${tipLoading ? `<span class="btn-spinner btn-spinner-dark"></span>` : ''}${escapeHtml(text)}</div>
      </div>
      <div class="week-piece">${garmentArt(piece.art, piece.color || (piece.look && piece.look.color), piece.look)}</div>
    </article>
  `;
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}
function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, '&quot;');
}

// A day's AI tip arrived: update just that row instead of rebuilding the week
// (eight tips arrive one by one on the first visit). Returns false if the row isn't on screen.
export function updateWeekTipRow(root, tipKey, tip, lang) {
  const row = [...root.querySelectorAll('[data-tip-key]')].find(el => el.dataset.tipKey === tipKey);
  if (!row) return false;
  const tipEl = row.querySelector('.week-row-tip');
  if (tipEl) { tipEl.textContent = tip || tipEl.dataset.fallback || ''; tipEl.classList.add('tip-in'); markClipped(row); }
  // The badge's place was kept while loading, so showing it (or dropping it) doesn't move anything.
  const badge = row.querySelector('.smart-tip-badge');
  if (badge) {
    if (tip) badge.classList.remove('is-waiting');
    else badge.style.visibility = 'hidden';
  } else if (tip) {
    const cond = row.querySelector('.week-row-condition');
    const b = document.createElement('span');
    b.className = 'smart-tip-badge';
    b.textContent = t(lang, 'smart_tip_badge');
    if (cond) cond.appendChild(b);
  }
  return true;
}

export function renderWeekScreen(s) {
  if (s.loading) {
    return `
      ${brandHeader(s)}
      <div class="state-msg"><div class="loader-orb">${weatherGlyph('partly', true)}</div>${t(s.lang, 'loading_weather')}</div>
    `;
  }
  if (s.error) {
    return `
      ${brandHeader(s)}
      <div class="state-msg glass">${s.error}<br><br>
        <button class="btn-primary" data-action="retry">${t(s.lang, 'retry')}</button>
      </div>
    `;
  }
  const weekOutfits = s.weekOutfits || [];
  if (!weekOutfits.length) {
    return `${brandHeader(s)}<div class="state-msg">${t(s.lang, 'loading_data')}</div>`;
  }
  const range = {
    min: Math.min(...weekOutfits.map(w => w.day.feelsMin)),
    max: Math.max(...weekOutfits.map(w => w.day.feelsMax)),
  };
  return `
    ${brandHeader(s)}
    <div class="section-head fade-slide">
      <h2 class="section-big">${t(s.lang, 'week_title')}</h2>
      <span class="band-chip">${range.min}° / ${range.max}°</span>
    </div>
    <div class="week-list">
      ${weekOutfits.map((wo, i) => weekDayRow(wo, i, s, range)).join('')}
    </div>
    <div class="footer-note">${t(s.lang, 'footer')}</div>
  `;
}

// Marks the days whose tip is cut off, so they show a small "more" arrow.
function markClipped(row) {
  const tip = row.querySelector('.week-row-tip');
  row.classList.toggle('clipped', !!tip && tip.scrollHeight > tip.clientHeight + 1);
}

export function attachWeekHandlers(root) {
  attachHeaderHandlers(root);
  requestAnimationFrame(() => root.querySelectorAll('.week-row[data-day]').forEach(markClipped));
  root.querySelectorAll('.week-row[data-day]').forEach(row => row.addEventListener('click', () => {
    // Nothing to open when the whole tip already fits.
    if (!row.classList.contains('open') && !row.classList.contains('clipped')) return;
    const open = !openDays.has(row.dataset.day);
    if (open) openDays.add(row.dataset.day); else openDays.delete(row.dataset.day);
    row.classList.toggle('open', open);
    row.setAttribute('aria-expanded', String(open));
  }));
  const retryBtn = root.querySelector('[data-action="retry"]');
  if (retryBtn) retryBtn.addEventListener('click', refetchForecast);
}
