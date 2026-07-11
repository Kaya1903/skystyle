import { icons } from './icons.js';
import { CATEGORIES } from './wardrobe.js';
import { t } from './i18n.js';
import { brandHeader, attachHeaderHandlers } from './render_header.js';
import { analyzePhoto } from './ai.js';
import {
  state, openEditor, closeEditor, saveWardrobeItem, deleteWardrobeItem,
  setWardrobeFilter, setWardrobeSearch, newItemId, resizePhoto,
} from './app.js';

function catLabel(cat, lang) {
  return t(lang, 'cat_' + cat);
}

function matchesFilter(item, filter) {
  return filter === 'all' || item.category === filter;
}
function matchesSearch(item, q) {
  if (!q) return true;
  return item.name.toLowerCase().includes(q.toLowerCase());
}

export function renderWardrobeScreen(s) {
  const items = s.wardrobe.filter(i => matchesFilter(i, s.wardrobeFilter) && matchesSearch(i, s.wardrobeSearch));
  const chips = [['all', t(s.lang, 'chip_all')], ...CATEGORIES.map(c => [c, catLabel(c, s.lang)])];

  if (s.wardrobe.length === 0) {
    return `
      ${brandHeader(s)}
      <div class="empty-state fade-slide">
        ${icons.hanger}
        <p>${t(s.lang, 'empty_wardrobe')}</p>
        <button class="btn-primary" data-action="add-item">${icons.plus}<span>${t(s.lang, 'add')}</span></button>
      </div>
    `;
  }

  return `
    ${brandHeader(s)}
    <div class="wardrobe-search search-wrap fade-slide" style="animation-delay:60ms">
      ${icons.search}
      <input class="field-input" id="wardrobe-search-input" type="text" placeholder="${t(s.lang, 'wardrobe_search_placeholder')}" value="${escapeAttr(s.wardrobeSearch)}" autocomplete="off" />
    </div>
    <div class="chip-row fade-slide" style="animation-delay:100ms">
      ${chips.map(([key, label]) => `
        <button class="chip ${s.wardrobeFilter === key ? 'active' : ''}" data-filter="${key}">${label}</button>
      `).join('')}
    </div>
    <div class="wardrobe-grid">
      <button class="add-card fade-slide" style="animation-delay:130ms" data-action="add-item">
        ${icons.plus}
        <span>${t(s.lang, 'add')}</span>
      </button>
      ${items.map((item, i) => wardrobeCard(item, i, s.lang)).join('')}
    </div>
  `;
}

function wardrobeCard(item, i, lang) {
  return `
    <button class="wardrobe-card fade-slide" style="animation-delay:${150 + i * 40}ms" data-item-id="${item.id}">
      <div class="wardrobe-thumb">
        ${item.photo ? `<img src="${item.photo}" alt="${escapeAttr(item.name)}" />` : icons[item.category] || icons.ust}
        <div class="wardrobe-badges">
          ${item.rainOk ? `<span class="badge-dot badge-rain" title="${t(lang, 'toggle_rain')}">${icons.drop}</span>` : ''}
          ${item.windproof ? `<span class="badge-dot badge-wind" title="${t(lang, 'toggle_wind')}">${icons.wind}</span>` : ''}
        </div>
      </div>
      <div class="wardrobe-info">
        <div class="wardrobe-name">${item.name}</div>
        <div class="wardrobe-cat">${catLabel(item.category, lang)}</div>
      </div>
    </button>
  `;
}

function escapeAttr(str) {
  return String(str || '').replace(/"/g, '&quot;');
}

let searchDebounce = null;

export function attachWardrobeHandlers(root) {
  attachHeaderHandlers(root);
  root.querySelectorAll('[data-action="add-item"]').forEach(btn => {
    btn.addEventListener('click', () => openEditor(null));
  });
  root.querySelectorAll('[data-item-id]').forEach(card => {
    card.addEventListener('click', () => {
      const item = state.wardrobe.find(i => i.id === card.dataset.itemId);
      if (item) openEditor(item);
    });
  });
  root.querySelectorAll('[data-filter]').forEach(chip => {
    chip.addEventListener('click', () => setWardrobeFilter(chip.dataset.filter));
  });
  const searchInput = root.querySelector('#wardrobe-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounce);
      const val = e.target.value;
      searchDebounce = setTimeout(() => setWardrobeSearch(val), 250);
    });
  }
}

// ---------------- Item editor sheet ----------------

let draftItem = null;
let draftPhotoPending = false;
let draftAiState = null; // null | 'loading' | 'done' | 'error'

function ensureDraft(state) {
  if (state.editorItem) {
    if (!draftItem || draftItem.id !== state.editorItem.id) {
      draftItem = { ...state.editorItem };
      draftAiState = null;
    }
  } else if (!draftItem || draftItem.__new !== true) {
    draftItem = {
      id: newItemId(),
      name: '',
      category: 'ust',
      warmth: 3,
      rainOk: false,
      windproof: false,
      photo: null,
      __new: true,
    };
    draftAiState = null;
  }
  return draftItem;
}

export function renderEditorSheet(state) {
  const lang = state.lang;
  if (!state.editorOpen) {
    draftItem = null;
    draftAiState = null;
    return `<div class="sheet-backdrop editor-sheet" id="editor-backdrop"></div>`;
  }
  const item = ensureDraft(state);
  return `
    <div class="sheet-backdrop editor-sheet open" id="editor-backdrop">
      <div class="sheet">
        <div class="sheet-handle"></div>
        <div class="sheet-title">${item.__new ? t(lang, 'editor_add_title') : t(lang, 'editor_edit_title')}</div>

        <div class="field-group">
          <label class="field-label">${t(lang, 'field_photo')}</label>
          <div class="photo-picker">
            <div class="photo-thumb">
              ${item.photo ? `<img src="${item.photo}" alt="" />` : (icons[item.category] || icons.ust)}
            </div>
            <button class="photo-btn" id="photo-pick-btn" type="button">${icons.camera}<span>${t(lang, 'choose_photo')}</span></button>
            <input type="file" accept="image/*" id="photo-input" style="display:none" />
          </div>
          ${draftAiState === 'loading' ? `<div class="ai-status ai-status-loading"><span class="btn-spinner btn-spinner-dark"></span>${t(lang, 'ai_analyzing')}</div>` : ''}
          ${draftAiState === 'done' ? `<div class="ai-status ai-status-done">${icons.check || ''}${t(lang, 'ai_suggested')}</div>` : ''}
          ${draftAiState === 'error' ? `<div class="ai-status ai-status-error">${t(lang, 'ai_failed')}</div>` : ''}
        </div>

        <div class="field-group">
          <label class="field-label">${t(lang, 'field_name')}</label>
          <input class="field-input" id="item-name-input" type="text" placeholder="${t(lang, 'name_placeholder')}" value="${escapeAttr(item.name)}" autocomplete="off" />
        </div>

        <div class="field-group">
          <label class="field-label">${t(lang, 'field_category')}</label>
          <div class="cat-grid">
            ${CATEGORIES.map(cat => `
              <button type="button" class="cat-btn ${item.category === cat ? 'active' : ''}" data-cat="${cat}">
                ${icons[cat] || ''}
                <span>${catLabel(cat, lang)}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <div class="field-group">
          <label class="field-label">${t(lang, 'field_warmth')}</label>
          <div class="warmth-row">
            <span class="warmth-end">${t(lang, 'warmth_thin')}</span>
            <div class="warmth-dots">
              ${[1, 2, 3, 4, 5].map(n => `
                <button type="button" class="warmth-dot ${n <= item.warmth ? 'filled' : ''}" data-warmth="${n}" aria-label="${t(lang, 'field_warmth')} ${n}"></button>
              `).join('')}
            </div>
            <span class="warmth-end right">${t(lang, 'warmth_winter')}</span>
          </div>
        </div>

        <div class="field-group">
          <div class="toggle-row">
            <span class="toggle-label">${t(lang, 'toggle_rain')}</span>
            <button type="button" class="switch switch-rain ${item.rainOk ? 'on' : ''}" id="toggle-rain"></button>
          </div>
          <div class="toggle-row">
            <span class="toggle-label">${t(lang, 'toggle_wind')}</span>
            <button type="button" class="switch switch-wind ${item.windproof ? 'on' : ''}" id="toggle-wind"></button>
          </div>
        </div>

        <div class="sheet-actions">
          <button class="btn-ghost" id="editor-cancel" type="button">${t(lang, 'cancel')}</button>
          <button class="btn-save" id="editor-save" type="button">${t(lang, 'save')}</button>
        </div>
        ${!item.__new ? `<div class="delete-link"><button id="editor-delete" type="button">${t(lang, 'delete_item')}</button></div>` : ''}
      </div>
    </div>
  `;
}

export function attachEditorHandlers(root) {
  const backdrop = root.querySelector('#editor-backdrop');
  if (!backdrop || !state.editorOpen) return;

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeEditor();
  });

  const nameInput = root.querySelector('#item-name-input');
  if (nameInput) {
    if (root.__nameFocused) {
      nameInput.focus();
      const len = nameInput.value.length;
      nameInput.setSelectionRange(len, len);
    }
    nameInput.addEventListener('focus', () => { root.__nameFocused = true; });
    nameInput.addEventListener('blur', () => { root.__nameFocused = false; });
    nameInput.addEventListener('input', (e) => {
      draftItem.name = e.target.value;
    });
  }

  root.querySelectorAll('[data-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      draftItem.category = btn.dataset.cat;
      rerenderEditor(root);
    });
  });

  root.querySelectorAll('[data-warmth]').forEach(btn => {
    btn.addEventListener('click', () => {
      draftItem.warmth = parseInt(btn.dataset.warmth, 10);
      rerenderEditor(root);
    });
  });

  const rainToggle = root.querySelector('#toggle-rain');
  if (rainToggle) rainToggle.addEventListener('click', () => {
    draftItem.rainOk = !draftItem.rainOk;
    rerenderEditor(root);
  });
  const windToggle = root.querySelector('#toggle-wind');
  if (windToggle) windToggle.addEventListener('click', () => {
    draftItem.windproof = !draftItem.windproof;
    rerenderEditor(root);
  });

  const photoBtn = root.querySelector('#photo-pick-btn');
  const photoInput = root.querySelector('#photo-input');
  if (photoBtn && photoInput) {
    photoBtn.addEventListener('click', () => photoInput.click());
    photoInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const itemAtSelection = draftItem;
      draftPhotoPending = true;
      const dataUrl = await resizePhoto(file);
      itemAtSelection.photo = dataUrl;
      draftPhotoPending = false;
      draftAiState = 'loading';
      rerenderEditor(root);
      try {
        const suggestion = await analyzePhoto(dataUrl);
        // Bail out if the user switched items or closed the sheet while we were waiting.
        if (draftItem !== itemAtSelection) return;
        if (CATEGORIES.includes(suggestion.category)) draftItem.category = suggestion.category;
        if (typeof suggestion.warmth === 'number') {
          draftItem.warmth = Math.min(5, Math.max(1, Math.round(suggestion.warmth)));
        }
        if (typeof suggestion.rainOk === 'boolean') draftItem.rainOk = suggestion.rainOk;
        if (typeof suggestion.windproof === 'boolean') draftItem.windproof = suggestion.windproof;
        if (suggestion.name && !draftItem.name.trim()) draftItem.name = suggestion.name;
        draftAiState = 'done';
      } catch (err) {
        console.error('[SkyStyle] AI photo analysis failed:', err.message || err);
        if (draftItem !== itemAtSelection) return;
        draftAiState = 'error';
      }
      rerenderEditor(root);
    });
  }

  const cancelBtn = root.querySelector('#editor-cancel');
  if (cancelBtn) cancelBtn.addEventListener('click', closeEditor);

  const saveBtn = root.querySelector('#editor-save');
  if (saveBtn) saveBtn.addEventListener('click', () => {
    if (!draftItem.name || !draftItem.name.trim()) {
      nameInput && nameInput.focus();
      return;
    }
    const { __new, ...clean } = draftItem;
    saveWardrobeItem(clean);
    closeEditor();
  });

  const deleteBtn = root.querySelector('#editor-delete');
  if (deleteBtn) deleteBtn.addEventListener('click', () => {
    deleteWardrobeItem(draftItem.id);
    closeEditor();
  });
}

function rerenderEditor(root) {
  const backdrop = root.querySelector('#editor-backdrop');
  if (!backdrop) return;
  const wasNameFocused = root.__nameFocused;
  backdrop.outerHTML = renderEditorSheet(state);
  root.__nameFocused = wasNameFocused;
  attachEditorHandlers(root);
}
