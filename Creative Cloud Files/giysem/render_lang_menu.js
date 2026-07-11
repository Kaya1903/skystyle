import { icons } from './icons.js';
import { LANGS, langLabel, langShort } from './i18n.js';
import { setLang, toggleLangMenu } from './app.js';

export function langMenu(s, extraClass = '') {
  const open = !!s.langMenuOpen;
  return `
    <div class="lang-menu ${extraClass}" data-lang-menu>
      <button type="button" class="lang-menu-btn ${open ? 'open' : ''}" data-lang-menu-toggle aria-expanded="${open}">
        <span>${langShort(s.lang)}</span>
        ${icons.chevron}
      </button>
      <div class="lang-menu-list ${open ? 'lang-menu-list-open' : ''}">
        ${LANGS.map(code => `
          <button type="button" class="lang-menu-item ${s.lang === code ? 'active' : ''}" data-lang="${code}">
            <span>${langLabel(code)}</span>
            <span class="lang-code">${langShort(code)}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

export function attachLangMenuHandlers(root) {
  const toggleBtn = root.querySelector('[data-lang-menu-toggle]');
  if (toggleBtn) toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleLangMenu();
  });
  root.querySelectorAll('[data-lang]').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });
}
