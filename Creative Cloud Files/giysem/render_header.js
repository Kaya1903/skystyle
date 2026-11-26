import { icons } from './icons.js';
import { t } from './i18n.js';
import { avatarBackground, avatarContent } from './profile.js';
import { switchTab, toggleSound, toggleSoundPanel, acceptSoundHint, soundHintDone } from './app.js';
import { isSoundOn, getVolumes, setVolume, playTap } from './sound.js';
import { langMenu, attachLangMenuHandlers } from './render_lang_menu.js';
import { installBannerShowing } from './install.js';

export function brandHeader(state) {
  return `
    <div class="brand">
      <span class="brand-name">SkyStyle</span>
      <div class="brand-right">
        ${soundMenu(state)}
        ${langMenu(state)}
        <button type="button" class="brand-mark" data-action="open-profile" aria-label="${t(state.lang, 'profile_edit_title')}" style="background:${avatarBackground(state.profile)}">
          ${state.profile ? avatarContent(state.profile) : icons.hanger}
        </button>
      </div>
    </div>
  `;
}

const SOUND_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>';
const SOUND_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>';

// 🔊 button with a small panel: effects volume, ambience volume, mute.
// The bubble pops in once; later re-renders show it straight away instead of popping again.
let hintIntroDone = false;
function soundMenu(state) {
  if (hintIntroDone === false) setTimeout(() => { hintIntroDone = true; }, 1600);
  const on = isSoundOn();
  const v = getVolumes();
  const open = state.soundPanelOpen;
  return `
    <div class="sound-menu" data-sound-menu>
      <button type="button" class="sound-btn ${on ? 'on' : ''}" data-action="toggle-sound-panel" aria-expanded="${open}" aria-label="${t(state.lang, 'sound_title')}" title="${t(state.lang, 'sound_title')}">
        ${on ? SOUND_ON : SOUND_OFF}
      </button>
      ${!open && !soundHintDone() && state.screen === 'app' && state.activeTab === 'today' && !installBannerShowing() ? `<button type="button" class="sound-hint ${hintIntroDone ? 'settled' : ''}" data-action="sound-hint">${SOUND_ON}<span>${t(state.lang, 'sound_unmute')}</span></button>` : ''}
      ${open ? `
      <div class="sound-panel ${on ? '' : 'muted'}" role="dialog" aria-label="${t(state.lang, 'sound_title')}">
        <div class="sound-panel-title">${t(state.lang, 'sound_title')}</div>
        <label class="sound-row"><span>${t(state.lang, 'sound_effects')}</span>
          <input type="range" min="0" max="100" step="5" value="${Math.round(v.effects * 100)}" data-volume="effects" ${on ? '' : 'disabled'} /></label>
        <label class="sound-row"><span>${t(state.lang, 'sound_ambient')}</span>
          <input type="range" min="0" max="100" step="5" value="${Math.round(v.ambient * 100)}" data-volume="ambient" ${on ? '' : 'disabled'} /></label>
        <button type="button" class="sound-mute" data-action="toggle-sound">${on ? SOUND_OFF : SOUND_ON}<span>${t(state.lang, on ? 'sound_mute' : 'sound_unmute')}</span></button>
      </div>` : ''}
    </div>`;
}

export function attachHeaderHandlers(root) {
  attachLangMenuHandlers(root);
  const panelBtn = root.querySelector('[data-action="toggle-sound-panel"]');
  if (panelBtn) panelBtn.addEventListener('click', toggleSoundPanel);
  const hintBtn = root.querySelector('[data-action="sound-hint"]');
  if (hintBtn) hintBtn.addEventListener('click', acceptSoundHint);
  const muteBtn = root.querySelector('[data-action="toggle-sound"]');
  if (muteBtn) muteBtn.addEventListener('click', toggleSound);
  root.querySelectorAll('[data-volume]').forEach(input => {
    input.addEventListener('input', () => setVolume(input.dataset.volume, Number(input.value) / 100));
    // Let them hear the new effects level right away.
    if (input.dataset.volume === 'effects') input.addEventListener('change', playTap);
  });
  const profileBtn = root.querySelector('[data-action="open-profile"]');
  if (profileBtn) profileBtn.addEventListener('click', () => switchTab('profile'));
}
