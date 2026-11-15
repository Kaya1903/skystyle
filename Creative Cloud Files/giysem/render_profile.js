import { icons } from './icons.js';
import { t } from './i18n.js';
import { avatarBackground, avatarContent, AVATARS, AVATAR_KEYS, STYLE_VIBES } from './profile.js';
import { brandHeader, attachHeaderHandlers } from './render_header.js';
import { CATEGORIES } from './wardrobe.js';
import { itemLook, garmentArt, wornPieces } from './visuals.js';
import {
  updateProfileGender, updateProfileStyleVibe, saveProfileName, resetProfile, openCitySheet,
  toggleAvatarPicker, setAvatar, setAvatarPhotoFile, removeAvatarPhoto, setComfort,
  switchTab, loadRecentCities, chooseCity, resetLearning, state, render,
} from './app.js';
import { learningSummary, wornHistory, dayLabel } from './feedback.js';

function avatarPicker(s) {
  const profile = s.profile;
  if (!s.avatarPickerOpen) return '';
  return `
    <div class="glass avatar-picker fade-slide">
      <div class="field-label">${t(s.lang, 'avatar_title')}</div>
      <div class="avatar-options">
        ${AVATAR_KEYS.map(key => `
          <button type="button" class="avatar-option ${!profile.avatarPhoto && profile.avatar === key ? 'active' : ''}" data-avatar="${key}" style="background:${AVATARS[key].bg}" aria-label="${key}">
            ${garmentArt(AVATARS[key].art, AVATARS[key].color, {}, 'flat avatar-art')}
          </button>
        `).join('')}
      </div>
      <div class="avatar-picker-actions">
        <button type="button" class="photo-btn" id="avatar-photo-btn">${icons.camera}<span>${t(s.lang, 'upload_photo')}</span></button>
        <input type="file" accept="image/*" id="avatar-photo-input" style="display:none" />
        ${profile.avatarPhoto ? `<button type="button" class="btn-ghost avatar-remove-btn" data-action="remove-avatar-photo">${t(s.lang, 'remove_photo')}</button>` : ''}
      </div>
    </div>
  `;
}

// "Your wardrobe" card: how many pieces, how they split by category, and the
// colours the user actually owns (most common first).
function wardrobeCard(s) {
  const items = s.wardrobe || [];
  const counts = CATEGORIES.map(c => [c, items.filter(i => i.category === c).length]);
  const colorCount = new Map();
  for (const i of items) {
    const hex = itemLook(i).color;
    if (hex) colorCount.set(hex, (colorCount.get(hex) || 0) + 1);
  }
  const palette = [...colorCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([hex]) => hex);
  return `
    <section class="glass panel profile-card rise-in" style="animation-delay:150ms">
      <div class="profile-card-head">
        <h3>${t(s.lang, 'profile_wardrobe_title')}</h3>
        <button type="button" class="link-btn" data-action="go-wardrobe">${t(s.lang, 'go_wardrobe')} ${icons.chevron}</button>
      </div>
      ${items.length ? `
        <div class="stat-big"><b>${items.length}</b> ${t(s.lang, 'pieces_label')}</div>
        <div class="cat-bars">
          ${counts.map(([c, n]) => `
            <div class="cat-bar" title="${t(s.lang, 'cat_' + c)}">
              <span class="cat-bar-icon">${icons[c] || ''}</span>
              <span class="cat-bar-label">${t(s.lang, 'cat_' + c)}</span>
              <span class="cat-bar-track"><span class="cat-bar-fill" style="width:${items.length ? (n / items.length) * 100 : 0}%"></span></span>
              <span class="cat-bar-n">${n}</span>
            </div>`).join('')}
        </div>
        ${palette.length ? `
          <div class="field-label palette-label">${t(s.lang, 'your_colors')}</div>
          <div class="palette-strip">${palette.map(hex => `<span style="background:${hex}"></span>`).join('')}</div>` : ''}
      ` : `<p class="profile-empty">${t(s.lang, 'profile_wardrobe_empty')}</p>`}
    </section>`;
}

function citiesCard(s, cityLabel) {
  const recent = loadRecentCities().filter(c => !(s.city && Math.abs(c.lat - s.city.lat) < 0.05 && Math.abs(c.lon - s.city.lon) < 0.05));
  return `
    <section class="glass panel profile-card rise-in" style="animation-delay:190ms">
      <div class="profile-card-head"><h3>${t(s.lang, 'profile_cities_title')}</h3></div>
      <button class="city-name-btn city-row profile-city-row" data-action="open-city" type="button">
        ${icons.location}
        <span>${cityLabel}</span>
        <span class="profile-city-change">${t(s.lang, 'change_city')}</span>
      </button>
      ${recent.length ? `
        <div class="recent-chips">
          ${recent.map(c => `<button type="button" class="chip recent-chip" data-city="${escapeAttr(JSON.stringify(c))}">${icons.clock}${escapeHtml(c.name)}</button>`).join('')}
        </div>` : ''}
    </section>`;
}

export function renderProfileScreen(s) {
  const profile = s.profile || { name: '', gender: 'unisex', styleVibe: 'casual' };
  const genderOpts = [['unisex', 'gender_unisex'], ['kadin', 'gender_kadin'], ['erkek', 'gender_erkek']];
  const comfortOpts = ['cold', 'normal', 'warm'];
  const comfort = profile.comfort || 'normal';
  const cityLabel = s.city ? (s.city.admin && s.city.admin !== s.city.name ? `${s.city.name}, ${s.city.admin}` : s.city.name) : t(s.lang, 'no_city');

  return `
    ${brandHeader(s)}
    <button type="button" class="back-btn fade-slide" data-action="go-today">${icons.chevron}<span>${t(s.lang, 'tab_today')}</span></button>

    <div class="profile-hero fade-slide" style="animation-delay:40ms">
      <button type="button" class="profile-avatar-lg" data-action="toggle-avatar-picker" style="background:${avatarBackground(profile)}" aria-label="${t(s.lang, 'avatar_title')}">
        ${avatarContent(profile)}
        <span class="avatar-edit">${icons.camera}</span>
      </button>
      <div class="profile-hero-name">${escapeHtml(profile.name)}</div>
      <div class="profile-hero-sub">${icons.location}${escapeHtml(cityLabel)} · ${t(s.lang, 'style_' + (profile.styleVibe || 'casual'))}</div>
    </div>
    ${avatarPicker(s)}

    <div class="profile-grid">
      <section class="glass panel profile-card rise-in" style="animation-delay:90ms">
        <div class="profile-card-head"><h3>${t(s.lang, 'profile_about_title')}</h3></div>
        <div class="field-group">
          <label class="field-label">${t(s.lang, 'field_name')}</label>
          <div class="name-row">
            <input class="field-input" id="profile-tab-name" type="text" value="${escapeAttr(profile.name)}" data-original="${escapeAttr(profile.name)}" placeholder="${t(s.lang, 'name_placeholder_profile')}" autocomplete="name" />
            <button class="btn-save profile-save-btn" data-action="save-profile" type="button" hidden>${t(s.lang, 'save')}</button>
          </div>
        </div>
        <div class="field-group">
          <label class="field-label">${t(s.lang, 'field_gender')}</label>
          <div class="gender-select">
            ${genderOpts.map(([key, labelKey]) => `
              <button type="button" class="gender-btn ${profile.gender === key ? 'active' : ''}" data-gender="${key}">${t(s.lang, labelKey)}</button>
            `).join('')}
          </div>
        </div>
        <div class="field-group">
          <label class="field-label">${t(s.lang, 'field_style')}</label>
          <div class="chip-row style-vibe-row">
            ${STYLE_VIBES.map(key => `
              <button type="button" class="chip ${profile.styleVibe === key ? 'active' : ''}" data-style-vibe="${key}">${t(s.lang, 'style_' + key)}</button>
            `).join('')}
          </div>
        </div>
      </section>

      <section class="glass panel profile-card rise-in" style="animation-delay:120ms">
        <div class="profile-card-head"><h3>${t(s.lang, 'comfort_title')}</h3></div>
        <p class="profile-hint">${t(s.lang, 'comfort_hint')}</p>
        <div class="comfort-options">
          ${comfortOpts.map(c => `
            <button type="button" class="comfort-opt ${comfort === c ? 'active' : ''}" data-comfort="${c}">
              <span class="comfort-emoji">${COMFORT_ICON[c]}</span>
              <span>${t(s.lang, 'comfort_' + c)}</span>
            </button>`).join('')}
        </div>
        ${learnBlock(s)}
      </section>

      ${historyCard(s)}
      ${wardrobeCard(s)}
      ${citiesCard(s, cityLabel)}
    </div>

    <div class="delete-link profile-reset">
      <button data-action="reset-profile" type="button">${t(s.lang, 'logout_reset')}</button>
    </div>
  `;
}

// What SkyStyle learned from the user's "how was it?" answers (feedback.js).
function learnBlock(s) {
  const sum = learningSummary(s.feedback || { days: {} });
  const text = sum.count ? t(s.lang, 'fb_learn_' + sum.lean, sum.count) : t(s.lang, 'fb_learn_none');
  return `
    <div class="learn-block">
      <p class="profile-hint learn-text">${text}</p>
      ${sum.count ? `<button type="button" class="learn-reset" data-action="reset-learning">${t(s.lang, 'fb_reset')}</button>` : ''}
    </div>`;
}

// "What I wore": the days marked with "I'm wearing this", newest first.
const HISTORY_SHOWN = 7;
const ANSWER_EMOJI = { cold: '🥶', ok: '👌', warm: '🥵' };
function historyCard(s) {
  const all = wornHistory(s.feedback || { days: {} });
  const today = new Date().toLocaleDateString('en-CA');
  const list = s.historyAll ? all : all.slice(0, HISTORY_SHOWN);
  const rows = list.map(r => {
    const answer = ANSWER_EMOJI[r.answer]
      ? `<span class="hist-answer" title="${t(s.lang, 'fb_' + r.answer)}">${ANSWER_EMOJI[r.answer]} <span>${t(s.lang, 'fb_' + r.answer)}</span></span>`
      : r.answer === 'skip' ? `<span class="hist-answer muted">${t(s.lang, 'fb_skip')}</span>`
      : `<span class="hist-answer muted">${t(s.lang, 'fb_history_waiting')}</span>`;
    return `
      <li class="hist-row">
        <div class="hist-top">
          <span class="hist-day">${dayLabel(r.date, today, s.lang, t)}</span>
          <span class="hist-meta">${r.city ? escapeHtml(r.city) + ' · ' : ''}${Math.round(r.feelsLike)}°</span>
          ${answer}
        </div>
        ${wornPieces(r.rows)}
        <div class="hist-names">${r.rows.map(x => escapeHtml(x.item)).join(' · ')}</div>
      </li>`;
  }).join('');
  return `
    <section class="glass panel profile-card history-card rise-in" style="animation-delay:150ms">
      <div class="profile-card-head"><h3>${t(s.lang, 'fb_history_title')}</h3></div>
      ${all.length ? `<ul class="hist-list">${rows}</ul>` : `<p class="profile-hint">${t(s.lang, 'fb_history_empty')}</p>`}
      ${all.length > HISTORY_SHOWN ? `<button type="button" class="learn-reset hist-more" data-action="history-more">${t(s.lang, s.historyAll ? 'fb_history_less' : 'fb_history_more')}</button>` : ''}
    </section>`;
}

const COMFORT_ICON = {
  cold: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 2v20M4 6l16 12M20 6L4 18M9 3l3 3 3-3M9 21l3-3 3 3"/></svg>',
  normal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><path d="M8.5 14.5c1 1.3 2.2 2 3.5 2s2.5-.7 3.5-2M9 10h.01M15 10h.01"/></svg>',
  warm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
};

function escapeAttr(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}
function escapeHtml(str) {
  return String(str || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

export function attachProfileHandlers(root) {
  attachHeaderHandlers(root);

  root.querySelectorAll('[data-gender]').forEach(btn => {
    btn.addEventListener('click', () => updateProfileGender(btn.dataset.gender));
  });

  root.querySelectorAll('[data-style-vibe]').forEach(btn => {
    btn.addEventListener('click', () => updateProfileStyleVibe(btn.dataset.styleVibe));
  });

  const nameInput = root.querySelector('#profile-tab-name');
  const saveBtn = root.querySelector('[data-action="save-profile"]');
  if (saveBtn) saveBtn.addEventListener('click', () => saveProfileName(nameInput ? nameInput.value : ''));
  if (nameInput && saveBtn) {
    const syncSaveVisibility = () => {
      const dirty = nameInput.value.trim() !== (nameInput.dataset.original || '').trim();
      saveBtn.hidden = !dirty;
    };
    nameInput.addEventListener('input', syncSaveVisibility);
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveProfileName(nameInput.value);
    });
  }

  const cityBtn = root.querySelector('[data-action="open-city"]');
  if (cityBtn) cityBtn.addEventListener('click', openCitySheet);

  const avatarBtn = root.querySelector('[data-action="toggle-avatar-picker"]');
  if (avatarBtn) avatarBtn.addEventListener('click', toggleAvatarPicker);

  root.querySelectorAll('[data-avatar]').forEach(btn => {
    btn.addEventListener('click', () => setAvatar(btn.dataset.avatar));
  });
  root.querySelectorAll('[data-comfort]').forEach(btn => {
    btn.addEventListener('click', () => setComfort(btn.dataset.comfort));
  });
  const histMore = root.querySelector('[data-action="history-more"]');
  if (histMore) histMore.addEventListener('click', () => { state.historyAll = !state.historyAll; state.quietRender = true; render(); });
  const resetLearnBtn = root.querySelector('[data-action="reset-learning"]');
  if (resetLearnBtn) resetLearnBtn.addEventListener('click', resetLearning);
  const backBtn = root.querySelector('[data-action="go-today"]');
  if (backBtn) backBtn.addEventListener('click', () => switchTab('today'));
  const wardrobeBtn = root.querySelector('[data-action="go-wardrobe"]');
  if (wardrobeBtn) wardrobeBtn.addEventListener('click', () => switchTab('wardrobe'));
  root.querySelectorAll('[data-city]').forEach(btn => {
    btn.addEventListener('click', () => { try { chooseCity(JSON.parse(btn.dataset.city)); } catch { /* ignore */ } });
  });

  const avatarPhotoBtn = root.querySelector('#avatar-photo-btn');
  const avatarPhotoInput = root.querySelector('#avatar-photo-input');
  if (avatarPhotoBtn && avatarPhotoInput) {
    avatarPhotoBtn.addEventListener('click', () => avatarPhotoInput.click());
    avatarPhotoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) setAvatarPhotoFile(file);
    });
  }

  const removePhotoBtn = root.querySelector('[data-action="remove-avatar-photo"]');
  if (removePhotoBtn) removePhotoBtn.addEventListener('click', removeAvatarPhoto);

  const resetBtn = root.querySelector('[data-action="reset-profile"]');
  if (resetBtn) resetBtn.addEventListener('click', resetProfile);
}
