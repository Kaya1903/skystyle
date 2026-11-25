import { icons } from './icons.js';
import { t } from './i18n.js';
import { closeCitySheet, searchCity, useGeolocation, chooseCity, loadRecentCities, removeRecentCity, clearRecentCities } from './app.js';

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
        <div class="city-body" id="city-body">${cityBody(s)}</div>
      </div>
    </div>
  `;
}

// Everything under the search box: message, recent cities and results.
function cityBody(s) {
  return `
    ${s.citySheetMsg ? `<div class="sheet-msg">${s.citySheetMsg}</div>` : ''}
    ${recentSection(s)}
    <div class="city-results">
      ${s.citySheetResults.map(r => cityButton(r)).join('')}
    </div>`;
}

// While typing, only the part under the search box changes. Redrawing the
// whole page on every letter made it flash and shake like a reload.
export function refreshCityBody(state) {
  const body = document.getElementById('city-body');
  if (!body) return false;
  body.innerHTML = cityBody(state);
  attachCityBodyHandlers(body);
  return true;
}

function cityButton(r, extraClass = '', inner = '') {
  return `
    <button class="city-result ${extraClass}" data-lat="${r.lat}" data-lon="${r.lon}" data-name="${escapeAttr(r.name)}" data-admin="${escapeAttr(r.admin)}" data-country="${escapeAttr(r.country)}" data-cc="${escapeAttr(r.countryCode || '')}">
      ${inner}<span class="city-text">${escapeHtml(r.name)}
      <span class="sub">${escapeHtml([r.admin, r.country].filter((v, i, a) => v && a.indexOf(v) === i).join(', '))}</span></span>
    </button>`;
}

// Shown while the search box is empty: the last cities the user picked.
function recentSection(s) {
  if ((s.citySheetQuery || '').trim()) return '';
  const recent = loadRecentCities();
  if (!recent.length) return '';
  const cur = s.city;
  return `
    <div class="recent-head">
      <span>${t(s.lang, 'recent_cities')}</span>
      <button type="button" class="recent-clear" data-action="clear-recent">${t(s.lang, 'clear_history')}</button>
    </div>
    <div class="city-results recent-list">
      ${recent.map(r => {
        const isCurrent = cur && Math.abs(cur.lat - r.lat) < 0.05 && Math.abs(cur.lon - r.lon) < 0.05;
        return `<div class="recent-row">
          ${cityButton(r, isCurrent ? 'is-current' : '', `<span class="recent-icon">${isCurrent ? icons.check : icons.clock}</span>`)}
          <button type="button" class="recent-remove" data-remove-lat="${r.lat}" data-remove-lon="${r.lon}" aria-label="${t(s.lang, 'remove_city')}: ${escapeAttr(r.name)}">${icons.close}</button>
        </div>`;
      }).join('')}
    </div>`;
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
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
  const body = root.querySelector('#city-body');
  if (body) attachCityBodyHandlers(body);
}

function attachCityBodyHandlers(root) {
  root.querySelectorAll('.city-result').forEach(btn => {
    btn.addEventListener('click', () => {
      chooseCity({
        name: btn.dataset.name,
        admin: btn.dataset.admin,
        country: btn.dataset.country || '',
        countryCode: btn.dataset.cc || '',
        lat: parseFloat(btn.dataset.lat),
        lon: parseFloat(btn.dataset.lon),
      });
    });
  });
  root.querySelectorAll('[data-remove-lat]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeRecentCity(parseFloat(btn.dataset.removeLat), parseFloat(btn.dataset.removeLon));
    });
  });
  const clearBtn = root.querySelector('[data-action="clear-recent"]');
  if (clearBtn) clearBtn.addEventListener('click', clearRecentCities);
}
