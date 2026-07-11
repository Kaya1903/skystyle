import { icons } from './icons.js';
import { t } from './i18n.js';
import { brandHeader, attachHeaderHandlers } from './render_header.js';
import { generateOutfit } from './outfit.js';
import { refetchForecast } from './app.js';

function weekDayRow(day, index, s) {
  const outfit = generateOutfit(
    { feelsLike: day.feelsLike, wind: day.wind, rainMax: day.rain, gender: s.gender, lang: s.lang },
    s.wardrobe
  );
  const top = outfit.rows[0];
  const d = new Date(day.date + 'T00:00:00');
  const weekdayName = index === 0 ? t(s.lang, 'week_today') : t(s.lang, 'weekdays')[d.getDay()];
  const dateNum = d.getDate();
  return `
    <div class="week-row fade-slide" style="animation-delay:${60 + index * 40}ms;--band-color:var(--band-${outfit.bandKey});--band-soft:var(--band-${outfit.bandKey}-soft);">
      <div class="week-row-day">
        <span class="week-day-name">${weekdayName}</span>
        <span class="week-day-num">${dateNum}</span>
      </div>
      <div class="week-row-icon">${icons[top.icon] || icons.ust}</div>
      <div class="week-row-body">
        <div class="week-row-condition">${day.condition} · ${outfit.bandLabel}</div>
        <div class="week-row-tip">${top.item}</div>
      </div>
      <div class="week-row-temps">
        <span class="week-temp-max">${day.feelsMax}°</span>
        <span class="week-temp-min">${day.feelsMin}°</span>
      </div>
    </div>
  `;
}

export function renderWeekScreen(s) {
  if (s.loading) {
    return `
      ${brandHeader(s)}
      <div class="state-msg"><div class="spinner"></div>${t(s.lang, 'loading_weather')}</div>
    `;
  }
  if (s.error) {
    return `
      ${brandHeader(s)}
      <div class="state-msg">${s.error}<br><br>
        <button class="btn-primary" data-action="retry">${t(s.lang, 'retry')}</button>
      </div>
    `;
  }
  const week = s.weekView || [];
  if (!week.length) {
    return `${brandHeader(s)}<div class="state-msg">${t(s.lang, 'loading_data')}</div>`;
  }
  return `
    ${brandHeader(s)}
    <div class="section-title fade-slide">${t(s.lang, 'week_title')}</div>
    <div class="week-list">
      ${week.map((day, i) => weekDayRow(day, i, s)).join('')}
    </div>
    <div class="footer-note">${t(s.lang, 'footer')}</div>
  `;
}

export function attachWeekHandlers(root) {
  attachHeaderHandlers(root);
  const retryBtn = root.querySelector('[data-action="retry"]');
  if (retryBtn) retryBtn.addEventListener('click', refetchForecast);
}
