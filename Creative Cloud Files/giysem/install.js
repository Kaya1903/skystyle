// Installing SkyStyle on a phone (it's a PWA: manifest.webmanifest + sw.js).
//
// Android Chrome offers its own install prompt, which we keep and show as a
// button. iPhone Safari has no prompt, so we show the two steps instead
// (Share, then "Add to Home Screen"). Once it runs from the home screen,
// none of this is shown.

import { t } from './i18n.js';

const DISMISS_KEY = 'giysem_install_dismissed_v1';
let deferredPrompt = null;
let onChange = () => {};

export function initInstall(changed) {
  onChange = changed || onChange;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    onChange();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    onChange();
  });
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => console.warn('[SkyStyle] Service worker not registered:', err && err.message));
  }
}

export function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function platform() {
  const ua = navigator.userAgent || '';
  if (/Android/i.test(ua)) return 'android';
  // iPads report themselves as a Mac with a touch screen.
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  return 'other';
}

// 'prompt' (one-tap install), 'ios' (Share steps), 'menu' (browser menu), or null.
function installMode() {
  if (isStandalone()) return null;
  if (deferredPrompt) return 'prompt';
  const p = platform();
  if (p === 'ios') return 'ios';
  if (p === 'android') return 'menu';
  return null;
}

// Safari 26 moved Share into the menu behind the three-line button, and
// "Add to Home Screen" is often under "View More" in the share sheet.
function safariMajor() {
  const m = /Version\/(\d+)/.exec(navigator.userAgent || '');
  return m ? +m[1] : 0;
}

// Whether the closable install card is on Today right now (other hints stay out of its way).
export function installBannerShowing() {
  return !!installMode() && platform() !== 'other' && !dismissed();
}

function dismissed() {
  try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
}

const SHARE_ICON = '<svg class="install-share" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3"/><path d="M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>';
const MENU_ICON = '<svg class="install-share" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 7h14M5 12h14M5 17h14"/></svg>';
const PLUS_ICON = '<svg class="install-share" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/></svg>';

// The card: `banner` on Today (phones only, can be closed), otherwise the Profile version.
export function installCard(s, { banner = false } = {}) {
  const mode = installMode();
  if (!mode) return '';
  if (banner && (platform() === 'other' || dismissed())) return '';
  const body = mode === 'prompt'
    ? `<button type="button" class="btn-primary install-btn" data-install="prompt">${t(s.lang, 'install_btn')}</button>`
    : mode === 'ios'
      ? `<ol class="install-steps">${(safariMajor() >= 26
        ? [[MENU_ICON, 'install_ios26_1'], [PLUS_ICON, 'install_ios26_2']]
        : [[SHARE_ICON, 'install_ios_1'], [PLUS_ICON, 'install_ios_2']])
        .map(([icon, key], i) => `<li><span class="install-num">${i + 1}</span>${icon}<span>${t(s.lang, key)}</span></li>`).join('')}</ol>`
      : `<p class="install-why">${t(s.lang, 'install_menu')}</p>`;
  return `
    <section class="glass install-card ${banner ? 'is-banner' : ''}">
      <img class="install-icon" src="icon-192.png" alt="" width="44" height="44" />
      <div class="install-text">
        <div class="install-title">${t(s.lang, 'install_title')}</div>
        <p class="install-why">${t(s.lang, 'install_why')}</p>
        ${body}
      </div>
      ${banner ? `<button type="button" class="install-close" data-install="close" aria-label="${t(s.lang, 'install_close')}">×</button>` : ''}
    </section>`;
}

export function attachInstallHandlers(root) {
  root.querySelectorAll('[data-install="prompt"]').forEach(btn => btn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try { await deferredPrompt.userChoice; } catch { /* closed */ }
    deferredPrompt = null;
    onChange();
  }));
  root.querySelectorAll('[data-install="close"]').forEach(btn => btn.addEventListener('click', () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* private mode */ }
    onChange();
  }));
}
