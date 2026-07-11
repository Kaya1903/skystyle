import { icons } from './icons.js';
import { t } from './i18n.js';
import { brandHeader, attachHeaderHandlers } from './render_header.js';
import { state, switchTab, setGender, openCitySheet, refetchForecast } from './app.js';

function cityRow(s) {
  const city = s.city;
  const label = city ? (city.admin && city.admin !== city.name ? `${city.name}, ${city.admin}` : city.name) : t(s.lang, 'no_city');
  return `
    <button class="city-name-btn city-row" data-action="open-city">
      ${icons.location}
      <span>${label}</span>
      ${icons.chevron}
    </button>
  `;
}

function heroSection(dayView, s) {
  const h = dayView.hero;
  return `
    <div class="hero fade-slide" style="animation-delay:60ms">
      <div class="hero-temp-row">
        <div class="hero-temp">${h.feelsLike}°</div>
        <div class="hero-temp-meta">
          <span class="hero-temp-label">${t(s.lang, 'hissedilen')}</span>
          ${h.hasActualTemp ? `<span class="hero-thermo">${t(s.lang, 'termometre', h.actualTemp)}</span>` : ''}
        </div>
      </div>
      <div class="hero-condition"><strong>${h.condition}</strong> · ${t(s.lang, 'ruzgar_yagis', h.wind, h.rain)}</div>
    </div>
  `;
}

function daypartCard(parts, s) {
  const order = [['sabah', '08:00'], ['ogle', '13:00'], ['aksam', '19:00']];
  return `
    <div class="daypart-card fade-slide" style="animation-delay:110ms">
      ${order.map(([key, time]) => {
        const p = parts[key];
        if (!p) return `<div class="daypart"><span class="daypart-time">${time}</span><span class="daypart-temp">—</span></div>`;
        return `
          <div class="daypart">
            <span class="daypart-time">${time}</span>
            <span class="daypart-temp">${p.feelsLike}°</span>
            <span class="daypart-sub">${p.wind} ${t(s.lang, 'unit_kmh')}<br>${t(s.lang, 'rain_line', p.rain)}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function genderSelector(s) {
  const opts = [['unisex', 'gender_unisex'], ['kadin', 'gender_kadin'], ['erkek', 'gender_erkek']];
  return `
    <div class="gender-select fade-slide" style="animation-delay:150ms">
      ${opts.map(([key, labelKey]) => `
        <button class="gender-btn ${s.gender === key ? 'active' : ''}" data-gender="${key}">${t(s.lang, labelKey)}</button>
      `).join('')}
    </div>
  `;
}

function outfitCard(outfit, kombinLabel, s) {
  return `
    <div class="section-title fade-slide" style="animation-delay:190ms">${kombinLabel} · ${outfit.bandLabel}</div>
    <div class="outfit-card">
      ${outfit.rows.map((row, i) => `
        <div class="outfit-row fade-slide" style="animation-delay:${210 + i * 50}ms">
          <div class="outfit-icon">${icons[row.icon] || ''}</div>
          <div class="outfit-body">
            <div class="outfit-slot">
              <span>${row.label}</span>
              ${row.fromWardrobe ? `<span class="wardrobe-tag">${t(s.lang, 'gardirobundan')}</span>` : ''}
            </div>
            <div class="outfit-item">${row.item}</div>
            <div class="outfit-reason">${row.reason}</div>
          </div>
        </div>
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
    <div class="tip-box fade-slide" style="animation-delay:${delay}ms">
      <span class="tip-icon">${isLoading ? `<span class="btn-spinner btn-spinner-dark"></span>` : icons.drop}</span>
      <div>
        <div class="tip-title">
          ${t(s.lang, 'gunun_notu')}
          ${smartText && !isLoading ? `<span class="smart-tip-badge">${t(s.lang, 'smart_tip_badge')}</span>` : ''}
        </div>
        <div class="tip-text">${text}</div>
      </div>
    </div>
  `;
}

export function renderTodayScreen({ dayOffset, state: s, data }) {
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
  if (!data) {
    return `${brandHeader(s)}<div class="state-msg">${t(s.lang, 'loading_data')}</div>`;
  }
  const { dayView, outfit, tip } = data;
  const kombinLabel = dayOffset === 0 ? t(s.lang, 'kombin_bugun') : t(s.lang, 'kombin_yarin');
  return `
    ${brandHeader(s)}
    <div class="band-scope" style="--band-color:var(--band-${outfit.bandKey});--band-soft:var(--band-${outfit.bandKey}-soft);">
      ${cityRow(s)}
      ${heroSection(dayView, s)}
      ${daypartCard(dayView.parts, s)}
      ${genderSelector(s)}
      ${outfitCard(outfit, kombinLabel, s)}
      ${tipBox(tip, 210 + outfit.rows.length * 50 + 20, s, dayOffset)}
      <div class="footer-note">${t(s.lang, 'footer')}</div>
    </div>
  `;
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
}
