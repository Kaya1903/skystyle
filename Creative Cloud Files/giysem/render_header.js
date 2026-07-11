import { icons } from './icons.js';
import { t } from './i18n.js';
import { avatarBackground, avatarContent } from './profile.js';
import { switchTab } from './app.js';
import { langMenu, attachLangMenuHandlers } from './render_lang_menu.js';

export function brandHeader(state) {
  return `
    <div class="brand">
      <span class="brand-name">SkyStyle</span>
      <div class="brand-right">
        ${langMenu(state)}
        <button type="button" class="brand-mark" data-action="open-profile" aria-label="${t(state.lang, 'profile_edit_title')}" style="background:${avatarBackground(state.profile)}">
          ${state.profile ? avatarContent(state.profile) : icons.hanger}
        </button>
      </div>
    </div>
  `;
}

export function attachHeaderHandlers(root) {
  attachLangMenuHandlers(root);
  const profileBtn = root.querySelector('[data-action="open-profile"]');
  if (profileBtn) profileBtn.addEventListener('click', () => switchTab('profile'));
}
