import { icons } from './icons.js';
import { t } from './i18n.js';
import { avatarBackground, avatarContent } from './profile.js';
import { setLang, switchTab } from './app.js';

export function brandHeader(state) {
  return `
    <div class="brand">
      <span class="brand-name">SkyStyle</span>
      <div class="brand-right">
        <div class="lang-toggle" data-lang-toggle>
          <button type="button" class="lang-btn ${state.lang === 'tr' ? 'active' : ''}" data-lang="tr">TR</button>
          <button type="button" class="lang-btn ${state.lang === 'en' ? 'active' : ''}" data-lang="en">EN</button>
        </div>
        <button type="button" class="brand-mark" data-action="open-profile" aria-label="${t(state.lang, 'profile_edit_title')}" style="background:${avatarBackground(state.profile)}">
          ${state.profile ? avatarContent(state.profile) : icons.hanger}
        </button>
      </div>
    </div>
  `;
}

export function attachHeaderHandlers(root) {
  root.querySelectorAll('[data-lang]').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });
  const profileBtn = root.querySelector('[data-action="open-profile"]');
  if (profileBtn) profileBtn.addEventListener('click', () => switchTab('profile'));
}
