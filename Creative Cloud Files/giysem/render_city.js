import { icons } from './icons.js';
import { t } from './i18n.js';
import { closeCitySheet, searchCity, useGeolocation, chooseCity } from './app.js';

let debounceTimer = null;

export function renderCitySheet(state) {
  const s = state;
  return `
    <div class="sheet-backdrop ${s.citySheetOpen ? 'open' : ''}" id="city-backdrop">
      <div class="sheet">
        <div class="sheet-handle"></div>
        <div class="sheet-title">${t(s.lang, 'city_sheet_title')}</div>
        <div class="search-wrap">
          ${icons.search}
          <input class="field-input" id="city-input" type="text" placeholder="${t(s.lang, 'city_search_placeholder')}" autocomplete="off" value="${escapeAttr(s.citySheetQuery)}" />
        </div>
        <button class="locate-btn" id="use-location-btn">
          ${icons.location}
          <span>${s.citySheetLoading ? t(s.lang, 'getting_location') : t(s.lang, 'use_location')}</span>
        </button>
        ${s.citySheetMsg ? `<div class="sheet-msg">${s.citySheetMsg}</div>` : ''}
        <div class="city-results">
          ${s.citySheetResults.map(r => `
            <button class="city-result" data-lat="${r.lat}" data-lon="${r.lon}" data-name="${escapeAttr(r.name)}" data-admin="${escapeAttr(r.admin)}">
              ${r.name}
              <span class="sub">${[r.admin, r.country].filter(Boolean).join(', ')}</span>
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function escapeAttr(str) {
  return String(str || '').replace(/"/g, '&quot;');
}

export function attachCitySheetHandlers(root) {
  const backdrop = root.querySelector('#city-backdrop');
  if (!backdrop) return;
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeCitySheet();
  });
  const input = root.querySelector('#city-input');
  if (input) {
    input.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const val = e.target.value;
      debounceTimer = setTimeout(() => searchCity(val), 350);
    });
  }
  const locBtn = root.querySelector('#use-location-btn');
  if (locBtn) locBtn.addEventListener('click', useGeolocation);

  root.querySelectorAll('.city-result').forEach(btn => {
    btn.addEventListener('click', () => {
      chooseCity({
        name: btn.dataset.name,
        admin: btn.dataset.admin,
        lat: parseFloat(btn.dataset.lat),
        lon: parseFloat(btn.dataset.lon),
      });
    });
  });
}
