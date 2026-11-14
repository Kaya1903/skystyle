import { icons } from './icons.js';
import { CATEGORIES } from './wardrobe.js';
import { t } from './i18n.js';
import { brandHeader, attachHeaderHandlers } from './render_header.js';
import { analyzePhoto } from './ai.js';
import { COLORS, COLOR_KEYS, colorName, isValidColor, nearestColorKey } from './colors.js';
import { garmentArt, itemLook, STYLE_OPTIONS, PATTERN_TYPES, DETAIL_KEYS, styleLabel } from './visuals.js';
import { photoColors } from './wardrobe.js';
import {
  state, openEditor, closeEditor, saveWardrobeItem, deleteWardrobeItem,
  setWardrobeFilter, setWardrobeSearch, newItemId, resizePhoto,
} from './app.js';

// The item's drawing: built from its stored look (style, exact color, pattern, details).
function itemArt(item, extraClass = '') {
  const look = itemLook(item);
  return garmentArt(look.art, look.color, look, extraClass);
}

// Categories where hood/zip/buttons/pocket/logo make sense.
const DETAIL_CATEGORIES = ['ust', 'ustune', 'dis'];

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
      <div class="empty-state glass fade-slide">
        <div class="empty-art">
          ${garmentArt('puffer', '#3f5f86')}${garmentArt('sweater', '#e2564c', true)}${garmentArt('skirt', '#d9c7a7')}
        </div>
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
      <button class="add-card rise-in" style="animation-delay:130ms" data-action="add-item">
        ${icons.plus}
        <span>${t(s.lang, 'add')}</span>
      </button>
      ${items.map((item, i) => wardrobeCard(item, i, s.lang)).join('')}
    </div>
  `;
}

function wardrobeCard(item, i, lang) {
  return `
    <button class="glass wardrobe-card rise-in" style="animation-delay:${150 + i * 50}ms" data-item-id="${item.id}">
      <div class="wardrobe-thumb is-art" style="--tint:${itemLook(item).color || '#b9c6dc'}">
        ${itemArt(item)}
        ${item.photo ? `<img class="photo-badge" src="${item.photo}" alt="${escapeAttr(item.name)}" />` : ''}
        <div class="wardrobe-badges">
          ${item.rainOk ? `<span class="badge-dot badge-rain" title="${t(lang, 'toggle_rain')}">${icons.drop}</span>` : ''}
          ${item.windproof ? `<span class="badge-dot badge-wind" title="${t(lang, 'toggle_wind')}">${icons.wind}</span>` : ''}
        </div>
      </div>
      <div class="wardrobe-info">
        <div class="wardrobe-name">${item.name}</div>
        <div class="wardrobe-cat">${itemLook(item).color ? `<span class="color-dot ${itemLook(item).patternType !== 'solid' ? 'patterned' : ''}" style="background:${itemLook(item).color}"></span>` : ''}${catLabel(item.category, lang)}</div>
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
      color: null,
      pattern: 'duz',
      patternType: 'solid',
      art: null,
      details: {},
      photo: null,
      // New pieces default to the gender the user is looking at.
      gender: ['kadin', 'erkek'].includes(state.gender) ? state.gender : 'unisex',
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
            ${item.photo ? `<div class="photo-thumb"><img src="${item.photo}" alt="" /></div><span class="photo-arrow">${icons.chevron}</span>` : ''}
            <div class="art-preview ${draftAiState === 'loading' ? 'is-loading' : ''}">${itemArt(item, 'flat')}</div>
            <button class="photo-btn" id="photo-pick-btn" type="button">${icons.camera}<span>${t(lang, 'choose_photo')}</span></button>
            <input type="file" accept="image/*" id="photo-input" style="display:none" />
          </div>
          ${!item.photo ? `<div class="photo-tip">${t(lang, 'photo_tip')}</div>` : ''}
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
          <label class="field-label">${t(lang, 'field_for')}</label>
          <div class="chip-row pattern-row">
            ${['unisex', 'kadin', 'erkek'].map(g => `<button type="button" class="chip ${(item.gender || 'unisex') === g ? 'active' : ''}" data-item-gender="${g}">${t(lang, 'gender_' + g)}</button>`).join('')}
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

        ${styleField(item, lang)}

        <div class="field-group">
          <label class="field-label">${t(lang, 'field_color')}${item.hex && item.hex === item.photoHex ? ` · <span class="color-current">${t(lang, 'photo_color')}</span>` : isValidColor(item.color) ? ` · <span class="color-current">${colorName(item.color, lang)}</span>` : ''}</label>
          <div class="swatch-grid">
            ${item.photoHex ? `<button type="button" class="swatch swatch-photo ${item.hex === item.photoHex ? 'active' : ''}" data-photo-color="1" style="background:${item.photoHex}" aria-label="${t(lang, 'photo_color')}" title="${t(lang, 'photo_color')}">${icons.camera}</button>` : ''}
            ${COLOR_KEYS.map(key => `
              <button type="button" class="swatch ${!item.hex && item.color === key ? 'active' : ''}" data-color="${key}" style="background:${COLORS[key].hex}" aria-label="${colorName(key, lang)}" title="${colorName(key, lang)}"></button>
            `).join('')}
          </div>
        </div>

        <div class="field-group">
          <label class="field-label">${t(lang, 'field_pattern')}</label>
          <div class="chip-row pattern-row">
            ${PATTERN_TYPES.map(pt => `<button type="button" class="chip ${itemLook(item).patternType === pt ? 'active' : ''}" data-pattern-type="${pt}">${t(lang, 'pat_' + pt)}</button>`).join('')}
          </div>
        </div>

        ${DETAIL_CATEGORIES.includes(item.category) ? `
        <div class="field-group">
          <label class="field-label">${t(lang, 'field_details')}</label>
          <div class="chip-row pattern-row">
            ${DETAIL_KEYS.map(k => `<button type="button" class="chip ${item.details && item.details[k] ? 'active' : ''}" data-detail="${k}">${t(lang, 'det_' + k)}</button>`).join('')}
          </div>
        </div>` : ''}

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
      if (!(STYLE_OPTIONS[draftItem.category] || []).includes(draftItem.art)) draftItem.art = null;
      rerenderEditor(root);
    });
  });

  root.querySelectorAll('[data-item-gender]').forEach(btn => {
    btn.addEventListener('click', () => {
      draftItem.gender = btn.dataset.itemGender;
      rerenderEditor(root);
    });
  });

  root.querySelectorAll('[data-warmth]').forEach(btn => {
    btn.addEventListener('click', () => {
      draftItem.warmth = parseInt(btn.dataset.warmth, 10);
      rerenderEditor(root);
    });
  });

  root.querySelectorAll('[data-color]').forEach(btn => {
    btn.addEventListener('click', () => {
      const same = !draftItem.hex && draftItem.color === btn.dataset.color;
      draftItem.color = same ? null : btn.dataset.color;
      draftItem.hex = null;
      rerenderEditor(root);
    });
  });
  const photoSwatch = root.querySelector('[data-photo-color]');
  if (photoSwatch) photoSwatch.addEventListener('click', () => {
    draftItem.hex = draftItem.photoHex;
    draftItem.color = nearestColorKey(draftItem.photoHex);
    rerenderEditor(root);
  });
  root.querySelectorAll('[data-style]').forEach(btn => {
    btn.addEventListener('click', () => {
      draftItem.art = btn.dataset.style;
      rerenderEditor(root);
    });
  });
  root.querySelectorAll('[data-pattern-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      draftItem.patternType = btn.dataset.patternType;
      draftItem.pattern = draftItem.patternType === 'solid' ? 'duz' : 'desenli';
      rerenderEditor(root);
    });
  });
  root.querySelectorAll('[data-detail]').forEach(btn => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.detail;
      draftItem.details = { ...(draftItem.details || {}), [k]: !(draftItem.details && draftItem.details[k]) };
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
      const colorsPromise = photoColors(dataUrl);
      try {
        const [suggestion, measured] = await Promise.all([analyzePhoto(dataUrl), colorsPromise]);
        // Bail out if the user switched items or closed the sheet while we were waiting.
        if (draftItem !== itemAtSelection) return;
        if (CATEGORIES.includes(suggestion.category)) draftItem.category = suggestion.category;
        if (typeof suggestion.warmth === 'number') {
          draftItem.warmth = Math.min(5, Math.max(1, Math.round(suggestion.warmth)));
        }
        if (typeof suggestion.rainOk === 'boolean') draftItem.rainOk = suggestion.rainOk;
        if (typeof suggestion.windproof === 'boolean') draftItem.windproof = suggestion.windproof;
        applySuggestion(draftItem, suggestion, measured);
        draftAiState = 'done';
      } catch (err) {
        console.error('[SkyStyle] AI photo analysis failed:', err.message || err);
        if (draftItem !== itemAtSelection) return;
        // Even without the AI, the photo's own colors are still useful.
        applySuggestion(draftItem, {}, await colorsPromise);
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
  const scroll = backdrop.querySelector('.sheet')?.scrollTop || 0;
  backdrop.outerHTML = renderEditorSheet(state);
  root.__nameFocused = wasNameFocused;
  const sheet = root.querySelector('#editor-backdrop .sheet');
  if (sheet) sheet.scrollTop = scroll;
  attachEditorHandlers(root);
}

// Style picker: every drawing that fits the category, drawn in the item's own colors.
function styleField(item, lang) {
  const options = STYLE_OPTIONS[item.category] || [];
  if (options.length < 2) return '';
  const look = itemLook(item);
  return `
    <div class="field-group">
      <label class="field-label">${t(lang, 'field_look')} · <span class="color-current">${styleLabel(look.art, lang)}</span></label>
      <div class="style-row">
        ${options.map(name => `
          <button type="button" class="style-opt ${look.art === name ? 'active' : ''}" data-style="${name}" title="${styleLabel(name, lang)}" aria-label="${styleLabel(name, lang)}">
            ${garmentArt(name, look.color, look, 'flat')}
          </button>`).join('')}
      </div>
    </div>`;
}

// Merges what the AI read and what we measured from the pixels into the draft.
function applySuggestion(item, sug, measured) {
  if (CATEGORIES.includes(sug.category)) item.category = sug.category;
  if (typeof sug.warmth === 'number') item.warmth = Math.min(5, Math.max(1, Math.round(sug.warmth)));
  if (typeof sug.rainOk === 'boolean') item.rainOk = sug.rainOk;
  if (typeof sug.windproof === 'boolean') item.windproof = sug.windproof;
  if (sug.name && !item.name.trim()) item.name = sug.name;
  if (['unisex', 'kadin', 'erkek'].includes(sug.gender)) item.gender = sug.gender;
  if ((STYLE_OPTIONS[item.category] || []).includes(sug.style)) item.art = sug.style;
  else if (!(STYLE_OPTIONS[item.category] || []).includes(item.art)) item.art = null;
  if (PATTERN_TYPES.includes(sug.patternType)) item.patternType = sug.patternType;
  else if (sug.pattern === 'desenli') item.patternType = 'stripes';
  item.pattern = item.patternType && item.patternType !== 'solid' ? 'desenli' : 'duz';
  if (sug.details && typeof sug.details === 'object') {
    item.details = Object.fromEntries(DETAIL_KEYS.map(k => [k, sug.details[k] === true]));
  }
  // Exact color from the pixels; palette key from the AI (it ignores lighting) or the nearest swatch.
  if (measured && measured.hex) {
    item.photoHex = measured.hex;
    item.hex = measured.hex;
    item.color = isValidColor(sug.color) ? sug.color : nearestColorKey(measured.hex);
  } else if (isValidColor(sug.color)) {
    item.color = sug.color;
  }
  if (item.patternType !== 'solid') {
    // Thin stripes/checks blend with the main color in the pixels, so the AI's read wins here.
    item.hex2 = isValidColor(sug.color2) ? COLORS[sug.color2].hex : (measured && measured.hex2) || null;
  } else {
    item.hex2 = null;
  }
  item.color2 = isValidColor(sug.color2) ? sug.color2 : null;
}
