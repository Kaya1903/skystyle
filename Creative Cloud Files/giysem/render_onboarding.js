import { icons } from './icons.js';
import { t } from './i18n.js';
import { STYLE_VIBES } from './profile.js';
import {
  state, setLang, goToOnboardStep, submitProfileStep, useLocationForOnboarding,
  openCityFromOnboarding, backToProfileStep,
} from './app.js';

function langToggle(s) {
  return `
    <div class="lang-toggle onboard-lang" data-lang-toggle>
      <button type="button" class="lang-btn ${s.lang === 'tr' ? 'active' : ''}" data-lang="tr">TR</button>
      <button type="button" class="lang-btn ${s.lang === 'en' ? 'active' : ''}" data-lang="en">EN</button>
    </div>
  `;
}

function stepDots(step) {
  const steps = ['profile', 'location'];
  const idx = steps.indexOf(step);
  return `
    <div class="onboard-dots">
      ${steps.map((_, i) => `<span class="onboard-dot ${i === idx ? 'active' : ''}"></span>`).join('')}
    </div>
  `;
}

function renderWelcome(s) {
  return `
    <div class="onboard onboard-welcome fade-slide">
      ${langToggle(s)}
      <div class="onboard-hero">
        <div class="onboard-mark">${icons.hanger}</div>
        <h1 class="onboard-title">SkyStyle</h1>
        <p class="onboard-tag">${t(s.lang, 'onboard_tagline')}</p>
      </div>
      <div class="onboard-chips">
        <span class="onboard-chip">${icons.drop}<span>${t(s.lang, 'toggle_rain')}</span></span>
        <span class="onboard-chip">${icons.wind}<span>${t(s.lang, 'toggle_wind')}</span></span>
        <span class="onboard-chip">${icons.location}<span>${t(s.lang, 'my_location')}</span></span>
      </div>
      <button class="btn-primary onboard-cta" data-action="onboard-start">${t(s.lang, 'onboard_start')}</button>
    </div>
  `;
}

function renderProfileStep(s) {
  const name = s.profileDraft.name || '';
  const gender = s.profileDraft.gender || 'unisex';
  const styleVibe = s.profileDraft.styleVibe || 'casual';
  const opts = [['unisex', 'gender_unisex'], ['kadin', 'gender_kadin'], ['erkek', 'gender_erkek']];
  return `
    <div class="onboard onboard-profile fade-slide">
      ${langToggle(s)}
      ${stepDots('profile')}
      <div class="onboard-step-label">${t(s.lang, 'onboard_step', 1, 2)}</div>
      <h2 class="onboard-title-sm">${t(s.lang, 'profile_title')}</h2>
      <p class="onboard-sub">${t(s.lang, 'profile_sub')}</p>

      <div class="field-group">
        <label class="field-label">${t(s.lang, 'field_name')}</label>
        <input class="field-input" id="profile-name-input" type="text" placeholder="${t(s.lang, 'name_placeholder_profile')}" value="${escapeAttr(name)}" autocomplete="name" />
        ${s.profileNameError ? `<div class="field-error">${t(s.lang, 'profile_name_required')}</div>` : ''}
      </div>

      <div class="field-group">
        <label class="field-label">${t(s.lang, 'field_gender')}</label>
        <div class="gender-select onboard-gender">
          ${opts.map(([key, labelKey]) => `
            <button type="button" class="gender-btn ${gender === key ? 'active' : ''}" data-profile-gender="${key}">${t(s.lang, labelKey)}</button>
          `).join('')}
        </div>
      </div>

      <div class="field-group">
        <label class="field-label">${t(s.lang, 'field_style')}</label>
        <div class="chip-row style-vibe-row">
          ${STYLE_VIBES.map(key => `
            <button type="button" class="chip ${styleVibe === key ? 'active' : ''}" data-profile-style="${key}">${t(s.lang, 'style_' + key)}</button>
          `).join('')}
        </div>
        <p class="onboard-style-hint">${t(s.lang, 'onboard_style_hint')}</p>
      </div>

      <button class="btn-primary onboard-cta" data-action="profile-continue">${t(s.lang, 'continue')}</button>
    </div>
  `;
}

function renderLocationStep(s) {
  return `
    <div class="onboard onboard-location fade-slide">
      ${langToggle(s)}
      ${stepDots('location')}
      <div class="onboard-step-label">${t(s.lang, 'onboard_step', 2, 2)}</div>
      <div class="onboard-hero onboard-hero-sm">
        <div class="onboard-mark">${icons.location}</div>
        <h2 class="onboard-title-sm">${t(s.lang, 'location_title')}</h2>
        <p class="onboard-sub">${t(s.lang, 'location_sub')}</p>
      </div>

      <button class="btn-primary onboard-cta" data-action="onboard-use-location" ${s.onboardLocating ? 'disabled' : ''}>
        ${s.onboardLocating ? `<span class="btn-spinner"></span>${t(s.lang, 'getting_location')}` : `${icons.location}<span>${t(s.lang, 'use_location')}</span>`}
      </button>
      <button class="btn-ghost onboard-cta" data-action="onboard-choose-city">${t(s.lang, 'choose_city_instead')}</button>
      ${s.onboardLocationMsg ? `<div class="sheet-msg onboard-msg">${s.onboardLocationMsg}</div>` : ''}

      <button class="onboard-back" data-action="onboard-back" type="button">${icons.chevron}<span>${t(s.lang, 'back')}</span></button>
    </div>
  `;
}

export function renderOnboardingScreen(s) {
  if (s.onboardStep === 'welcome') return renderWelcome(s);
  if (s.onboardStep === 'profile') return renderProfileStep(s);
  return renderLocationStep(s);
}

function escapeAttr(str) {
  return String(str || '').replace(/"/g, '&quot;');
}

export function attachOnboardingHandlers(root) {
  root.querySelectorAll('[data-lang]').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });

  const startBtn = root.querySelector('[data-action="onboard-start"]');
  if (startBtn) startBtn.addEventListener('click', () => goToOnboardStep('profile'));

  const nameInput = root.querySelector('#profile-name-input');
  if (nameInput) {
    if (root.__profileNameFocused) {
      nameInput.focus();
      const len = nameInput.value.length;
      nameInput.setSelectionRange(len, len);
    }
    nameInput.addEventListener('focus', () => { root.__profileNameFocused = true; });
    nameInput.addEventListener('blur', () => { root.__profileNameFocused = false; });
    nameInput.addEventListener('input', (e) => {
      state.profileDraft.name = e.target.value;
      if (state.profileNameError && e.target.value.trim()) state.profileNameError = false;
    });
  }

  root.querySelectorAll('[data-profile-gender]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.profileDraft.gender = btn.dataset.profileGender;
      const wasFocused = root.__profileNameFocused;
      root.innerHTML = renderProfileStep(state);
      root.__profileNameFocused = wasFocused;
      attachOnboardingHandlers(root);
    });
  });

  root.querySelectorAll('[data-profile-style]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.profileDraft.styleVibe = btn.dataset.profileStyle;
      const wasFocused = root.__profileNameFocused;
      root.innerHTML = renderProfileStep(state);
      root.__profileNameFocused = wasFocused;
      attachOnboardingHandlers(root);
    });
  });

  const continueBtn = root.querySelector('[data-action="profile-continue"]');
  if (continueBtn) continueBtn.addEventListener('click', () => {
    const val = nameInput ? nameInput.value : state.profileDraft.name;
    submitProfileStep(val);
  });

  const useLocBtn = root.querySelector('[data-action="onboard-use-location"]');
  if (useLocBtn) useLocBtn.addEventListener('click', useLocationForOnboarding);

  const chooseCityBtn = root.querySelector('[data-action="onboard-choose-city"]');
  if (chooseCityBtn) chooseCityBtn.addEventListener('click', openCityFromOnboarding);

  const backBtn = root.querySelector('[data-action="onboard-back"]');
  if (backBtn) backBtn.addEventListener('click', backToProfileStep);
}
