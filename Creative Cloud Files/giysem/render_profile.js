import { icons } from './icons.js';
import { t } from './i18n.js';
import { avatarBackground, avatarContent, AVATAR_COLOR_KEYS, AVATAR_COLORS, STYLE_VIBES } from './profile.js';
import { brandHeader, attachHeaderHandlers } from './render_header.js';
import {
  updateProfileGender, updateProfileStyleVibe, saveProfileName, resetProfile, openCitySheet,
  toggleAvatarPicker, setAvatarColor, setAvatarPhotoFile, removeAvatarPhoto,
} from './app.js';

function avatarPicker(s) {
  const profile = s.profile;
  if (!s.avatarPickerOpen) return '';
  return `
    <div class="avatar-picker fade-slide">
      <div class="avatar-swatches">
        ${AVATAR_COLOR_KEYS.map(key => `
          <button type="button" class="avatar-swatch ${!profile.avatarPhoto && profile.avatarColor === key ? 'active' : ''}" data-avatar-color="${key}" style="background:${AVATAR_COLORS[key]}" aria-label="${key}"></button>
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

export function renderProfileScreen(s) {
  const profile = s.profile || { name: '', gender: 'unisex', styleVibe: 'casual' };
  const genderOpts = [['unisex', 'gender_unisex'], ['kadin', 'gender_kadin'], ['erkek', 'gender_erkek']];
  const cityLabel = s.city ? (s.city.admin && s.city.admin !== s.city.name ? `${s.city.name}, ${s.city.admin}` : s.city.name) : t(s.lang, 'no_city');

  return `
    ${brandHeader(s)}
    <div class="profile-hero fade-slide" style="animation-delay:40ms">
      <button type="button" class="profile-avatar-lg" data-action="toggle-avatar-picker" style="background:${avatarBackground(profile)}" aria-label="${t(s.lang, 'upload_photo')}">
        ${avatarContent(profile)}
      </button>
      ${avatarPicker(s)}
      <div class="profile-hero-name">${escapeHtml(profile.name)}</div>
      <div class="profile-hero-sub">${t(s.lang, 'profile_screen_sub')}</div>
    </div>

    <div class="field-group fade-slide" style="animation-delay:90ms">
      <label class="field-label">${t(s.lang, 'field_name')}</label>
      <input class="field-input" id="profile-tab-name" type="text" value="${escapeAttr(profile.name)}" data-original="${escapeAttr(profile.name)}" placeholder="${t(s.lang, 'name_placeholder_profile')}" autocomplete="name" />
    </div>

    <div class="field-group fade-slide" style="animation-delay:130ms">
      <label class="field-label">${t(s.lang, 'field_gender')}</label>
      <div class="gender-select">
        ${genderOpts.map(([key, labelKey]) => `
          <button type="button" class="gender-btn ${profile.gender === key ? 'active' : ''}" data-gender="${key}">${t(s.lang, labelKey)}</button>
        `).join('')}
      </div>
    </div>

    <div class="field-group fade-slide" style="animation-delay:160ms">
      <label class="field-label">${t(s.lang, 'field_style')}</label>
      <div class="chip-row style-vibe-row">
        ${STYLE_VIBES.map(key => `
          <button type="button" class="chip ${profile.styleVibe === key ? 'active' : ''}" data-style-vibe="${key}">${t(s.lang, 'style_' + key)}</button>
        `).join('')}
      </div>
    </div>

    <div class="field-group fade-slide" style="animation-delay:190ms">
      <label class="field-label">${t(s.lang, 'field_city')}</label>
      <button class="city-name-btn city-row profile-city-row" data-action="open-city" type="button">
        ${icons.location}
        <span>${cityLabel}</span>
        <span class="profile-city-change">${t(s.lang, 'change_city')}</span>
      </button>
    </div>

    <button class="btn-primary profile-save-btn fade-slide" style="animation-delay:220ms" data-action="save-profile" type="button" hidden>${t(s.lang, 'save')}</button>
    <div class="delete-link fade-slide" style="animation-delay:240ms">
      <button data-action="reset-profile" type="button">${t(s.lang, 'logout_reset')}</button>
    </div>
  `;
}

function escapeAttr(str) {
  return String(str || '').replace(/"/g, '&quot;');
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

  root.querySelectorAll('[data-avatar-color]').forEach(btn => {
    btn.addEventListener('click', () => setAvatarColor(btn.dataset.avatarColor));
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
