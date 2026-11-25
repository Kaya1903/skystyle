import { colorName, isValidColor } from './colors.js';
import { setSky } from './sky.js';
import { unlockSound, setAmbient, playTap, playToggle, playDice, playChime, playWhoosh, isSoundOn, setSoundOn } from './sound.js';
import { skyKind } from './weather.js';
import { geocodeCity, geocodeSingle, reverseGeocode, fetchForecast, buildDayView, buildWeekView, eveningTip } from './weather.js';
import { loadWardrobe, addOrUpdateItem, removeItem, newItemId, resizePhoto, initPhotoStore, saveWardrobe, cropPrint } from './wardrobe.js';
import { generateOutfit } from './outfit.js';
import { t, LANGS, RTL_LANGS } from './i18n.js';
import { loadProfile, saveProfile, clearProfile, comfortOffset } from './profile.js';
import { getSmartTip, askOutfitChange } from './ai.js';
import { loadFeedback, saveFeedback, markWorn, unmarkWorn, answerDay, clearLearning, pendingQuestion, learnedOffset, findMemory, learningSummary } from './feedback.js';
import { renderTodayScreen, attachTodayHandlers } from './render_today.js';
import { renderWardrobeScreen, attachWardrobeHandlers, renderEditorSheet, attachEditorHandlers } from './render_wardrobe.js';
import { renderWeekScreen, attachWeekHandlers, updateWeekTipRow } from './render_week.js';
import { renderProfileScreen, attachProfileHandlers } from './render_profile.js';
import { renderCitySheet, attachCitySheetHandlers, refreshCityBody } from './render_city.js';
import { renderOnboardingScreen, attachOnboardingHandlers } from './render_onboarding.js';

const CITY_KEY = 'giysem_city_v1';
const LANG_KEY = 'giysem_lang_v1';
const WARDROBE_ONLY_KEY = 'giysem_wardrobe_only_v1'; // older on/off switch, read once
const WARDROBE_MODE_KEY = 'giysem_wardrobe_mode_v1';
const WARDROBE_MODES = ['mix', 'mine', 'ideas'];
const ADJUST_KEY = 'giysem_adjust_v1'; // today's changes to the suggested outfit
const FALLBACK_CITY = 'Warsaw';

const savedProfile = loadProfile();

export const state = {
  activeTab: 'today',
  gender: savedProfile ? savedProfile.gender : 'unisex',
  lang: LANGS.includes(localStorage.getItem(LANG_KEY)) ? localStorage.getItem(LANG_KEY) : 'tr',
  city: null,
  forecastRaw: null,
  loading: true,
  error: null,
  // Pieces saved before the "who is it for" field belong to the profile's gender
  // (saved on the next wardrobe write).
  wardrobe: loadWardrobe().map(i => (i.gender ? i : { ...i, gender: savedProfile && ['kadin', 'erkek'].includes(savedProfile.gender) ? savedProfile.gender : 'unisex' })),
  feedback: loadFeedback(), // worn outfits and how they felt (feedback.js)
  // Today's changes to the suggested outfit: { date, reroll, slotRolls, avoid, tone, vibe, warmth, reply }.
  adjust: (() => { try { return JSON.parse(localStorage.getItem(ADJUST_KEY) || 'null'); } catch { return null; } })(),
  adjustOpen: false,   // the "change it" panel is expanded
  adjustBusy: false,   // waiting for the AI to read a typed request
  // 'mix': own pieces first, suggestions fill the rest; 'mine': only own pieces; 'ideas': only suggestions.
  wardrobeMode: (() => {
    try {
      const m = localStorage.getItem(WARDROBE_MODE_KEY);
      if (WARDROBE_MODES.includes(m)) return m;
      return localStorage.getItem(WARDROBE_ONLY_KEY) === '1' ? 'mine' : 'mix';
    } catch { return 'mix'; }
  })(),
  modeMenuOpen: false,
  wardrobeFilter: 'all',
  wardrobeSearch: '',
  citySheetOpen: false,
  citySheetResults: [],
  citySheetLoading: false,
  citySheetMsg: '',
  citySheetQuery: '',
  citySheetInputFocused: false,
  editorItem: null,
  editorOpen: false,

  profile: savedProfile,
  screen: savedProfile ? 'app' : 'onboarding',
  onboardStep: 'welcome',
  onboardFromCitySheet: false,
  onboardLocating: false,
  onboardLocationMsg: '',
  profileDraft: { name: '', gender: 'unisex', styleVibe: 'casual' },
  profileNameError: false,
  toast: null,
  smartTip: null,
  smartTipLoading: false,
  smartTipKey: null,
  avatarPickerOpen: false,
  weekTips: {},
  weekTipStatus: {},
  langMenuOpen: false,
  soundPanelOpen: false, // the volume panel under the 🔊 button
  outfitLocks: {},     // { slotKey: itemId } pinned by the swap button (today only)
  swappedSlot: null,   // slot whose card should play the swap animation on the next render
  quietRender: false,  // skip entrance animations for in-place updates (swap, gender)
};

let toastTimer = null;
const SMART_TIP_CACHE_KEY = 'giysem_smart_tip_v1';
const WEEK_TIP_CACHE_KEY = 'giysem_week_tip_v1';

const screenEl = document.getElementById('screen');
const navEl = document.getElementById('bottom-nav');
document.documentElement.lang = state.lang;
document.documentElement.dir = RTL_LANGS.includes(state.lang) ? 'rtl' : 'ltr';

export function setState(patch) {
  Object.assign(state, patch);
}

export function setLang(lang) {
  state.langMenuOpen = false;
  if (state.lang === lang) { render(); return; }
  state.lang = lang;
  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';
  render();
}

export function toggleLangMenu() {
  state.langMenuOpen = !state.langMenuOpen;
  render();
}

export function toggleSoundPanel() {
  state.soundPanelOpen = !state.soundPanelOpen;
  state.langMenuOpen = false;
  state.quietRender = true;
  render();
}

export function closeSoundPanel() {
  if (!state.soundPanelOpen) return;
  state.soundPanelOpen = false;
  state.quietRender = true;
  render();
}

export function closeLangMenu() {
  if (!state.langMenuOpen) return;
  state.langMenuOpen = false;
  render();
}

export async function refetchForecast() {
  if (!state.city) return;
  try {
    state.loading = true;
    state.error = null;
    render();
    const raw = await fetchForecast(state.city.lat, state.city.lon);
    state.forecastRaw = raw;
    state.loading = false;
    render();
  } catch (e) {
    state.loading = false;
    state.error = t(state.lang, 'error_generic');
    render();
  }
}

// ---- Recent city searches ----
const RECENT_KEY = 'giysem_recent_cities_v1';
const RECENT_MAX = 6;

export function loadRecentCities() {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(list) ? list.filter(c => c && typeof c.lat === 'number') : [];
  } catch { return []; }
}

function sameCity(a, b) {
  return Math.abs(a.lat - b.lat) < 0.05 && Math.abs(a.lon - b.lon) < 0.05;
}

function rememberCity(city) {
  if (!city || typeof city.lat !== 'number') return;
  const entry = { name: city.name, admin: city.admin || '', country: city.country || '', countryCode: city.countryCode || '', lat: city.lat, lon: city.lon };
  const next = [entry, ...loadRecentCities().filter(c => !sameCity(c, entry))].slice(0, RECENT_MAX);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* history is a convenience */ }
}

export function removeRecentCity(lat, lon) {
  const next = loadRecentCities().filter(c => !sameCity(c, { lat, lon }));
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  refreshCity();
}

export function clearRecentCities() {
  try { localStorage.removeItem(RECENT_KEY); } catch { /* ignore */ }
  refreshCity();
}

export async function chooseCity(city, persist = true) {
  rememberCity(city);
  if (state.onboardFromCitySheet) {
    state.onboardFromCitySheet = false;
    state.citySheetOpen = false;
    await finishOnboarding(city);
    return;
  }
  state.city = city;
  state.outfitLocks = {};
  if (persist) localStorage.setItem(CITY_KEY, JSON.stringify(city));
  state.citySheetOpen = false;
  await refetchForecast();
}

async function initCity() {
  const saved = localStorage.getItem(CITY_KEY);
  if (saved) {
    try {
      state.city = JSON.parse(saved);
      if (!loadRecentCities().length) rememberCity(state.city);
      await refetchForecast();
      return;
    } catch { /* ignore */ }
  }

  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        state.city = await locateFromCoords(pos.coords.latitude, pos.coords.longitude);
        await refetchForecast();
      },
      async () => {
        await useFallbackCity();
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  } else {
    await useFallbackCity();
  }
}

// Resolves device coordinates to a real place name when possible, falling back
// to a generic "My location" label if reverse geocoding is unavailable/fails.
async function locateFromCoords(lat, lon) {
  const base = { admin: '', lat, lon, isGeo: true };
  try {
    const place = await reverseGeocode(lat, lon, state.lang);
    if (place && place.name) return { ...base, name: place.name, admin: place.admin, country: place.country, countryCode: place.countryCode };
  } catch { /* fall through to generic label */ }
  return { ...base, name: t(state.lang, 'my_location') };
}

async function useFallbackCity() {
  try {
    const c = await geocodeSingle(FALLBACK_CITY, state.lang);
    state.city = { name: c.name, admin: c.admin, country: c.country, countryCode: c.countryCode, lat: c.lat, lon: c.lon };
    await refetchForecast();
  } catch {
    state.loading = false;
    state.error = t(state.lang, 'error_forecast');
    render();
  }
}

export function switchTab(tab) {
  state.historyOpen = false;
  if (state.activeTab === tab) return;
  state.activeTab = tab;
  render();
}

// Where outfits come from: own clothes first with suggestions filling in ('mix'),
// only own clothes with tips ('mine'), or only suggestions ('ideas').
export function setWardrobeMode(mode) {
  state.modeMenuOpen = false;
  if (WARDROBE_MODES.includes(mode) && mode !== state.wardrobeMode) {
    state.wardrobeMode = mode;
    state.outfitLocks = {};
    try { localStorage.setItem(WARDROBE_MODE_KEY, mode); } catch { /* private mode */ }
  }
  state.quietRender = true;
  render();
}

export function toggleModeMenu(open = !state.modeMenuOpen) {
  state.modeMenuOpen = open;
  state.quietRender = true;
  render();
}

// The wardrobe the outfit engine may use in the current mode.
function outfitWardrobe() {
  return state.wardrobeMode === 'ideas' ? [] : state.wardrobe;
}

export function toggleSound() {
  setSoundOn(!isSoundOn());
  if (isSoundOn()) playToggle(true);
  state.quietRender = true;
  render();
}

export function setGender(g) {
  if (state.gender === g) return;
  state.gender = g;
  state.quietRender = true;
  render();
}

// Cycles one slot of today's outfit to the next suitable wardrobe piece.
// The other slots are re-picked around it so colors still work together.
export function swapOutfitPiece(slotKey) {
  const data = computeOutfitFor(0);
  const row = data && data.outfit.rows.find(r => r.slotKey === slotKey);
  if (!row || row.options.length < 2) return;
  const idx = row.options.indexOf(row.itemId);
  state.outfitLocks = { ...state.outfitLocks, [slotKey]: row.options[(idx + 1) % row.options.length] };
  state.swappedSlot = slotKey;
  state.quietRender = true;
  render();
}

// ---------------- Changing today's suggested outfit ----------------

const ADJUST_STYLES = ['casual', 'elegant', 'sporty', 'minimal', 'bold'];
const ADJUST_TONES = ['dark', 'bright', 'light'];
const ADJUST_SLOTS = ['ust', 'ustune', 'dis', 'alt', 'ayak', 'yanina'];

function todayDate() {
  return state.forecastRaw ? buildDayView(state.forecastRaw, 0, state.lang).date : null;
}

function todaysAdjust(date = todayDate()) {
  return state.adjust && state.adjust.date === date ? state.adjust : null;
}

function changeAdjust(update) {
  const date = todayDate();
  if (!date) return;
  const cur = todaysAdjust(date) || { date, reroll: 0, slotRolls: {}, avoid: [], want: [], tone: null, vibe: null, warmth: 0, reply: null };
  state.adjust = update({ ...cur, slotRolls: { ...cur.slotRolls }, avoid: [...cur.avoid], want: [...(cur.want || [])] });
  try { localStorage.setItem(ADJUST_KEY, JSON.stringify(state.adjust)); } catch { /* private mode */ }
  state.quietRender = true;
  render();
}

export function toggleAdjustPanel() {
  state.adjustOpen = !state.adjustOpen;
  state.quietRender = true;
  render();
}

// 🎲 A whole new outfit for the same weather.
export function rerollOutfit() {
  state.swappedSlot = 'all';
  state.diceSpin = true;
  changeAdjust(a => ({ ...a, reroll: a.reroll + 1, reply: null }));
}

// Swap just one suggested piece.
export function swapSuggestedPiece(slot) {
  state.swappedSlot = slot;
  changeAdjust(a => ({ ...a, slotRolls: { ...a.slotRolls, [slot]: (a.slotRolls[slot] || 0) + 1 }, reply: null }));
}

// Quick options: warmer, lighter, dark, bright, elegant, casual, sporty, shoes.
export function quickAdjust(kind) {
  state.swappedSlot = kind === 'shoes' ? 'ayak' : 'all';
  changeAdjust(a => {
    const next = { ...a, reply: null };
    // Tapping an active option again turns it off.
    if (kind === 'warmer') next.warmth = a.warmth > 0 ? 0 : 1;
    else if (kind === 'lighter') next.warmth = a.warmth < 0 ? 0 : -1;
    else if (ADJUST_TONES.includes(kind)) next.tone = a.tone === kind ? null : kind;
    else if (ADJUST_STYLES.includes(kind)) next.vibe = a.vibe === kind ? null : kind;
    else if (kind === 'shoes') next.slotRolls = { ...a.slotRolls, ayak: (a.slotRolls.ayak || 0) + 1 };
    return next;
  });
}

// A typed request ("no boots today"): the AI turns it into the same kinds of
// changes as the quick options, so the outfit still follows the weather rules.
export async function askAdjust(text) {
  const data = computeOutfitFor(0);
  if (!data || !text || !text.trim() || state.adjustBusy) return;
  state.adjustBusy = true;
  state.quietRender = true;
  render();
  try {
    const res = await askOutfitChange({
      lang: state.lang,
      text: text.trim().slice(0, 300),
      feelsLike: data.dayView.hero.feelsLike,
      wind: data.dayView.hero.wind,
      rain: data.dayView.maxRainToday,
      gender: state.gender,
      styleVibe: (data.adjust && data.adjust.vibe) || (state.profile ? state.profile.styleVibe : 'casual'),
      rows: data.outfit.rows.map(r => ({ slot: r.slotKey, item: r.item, kind: r.art })),
    });
    state.adjustBusy = false;
    state.swappedSlot = 'all';
    changeAdjust(a => {
      const next = { ...a, reply: typeof res.reply === 'string' ? res.reply.slice(0, 240) : null };
      const w = Number(res.warmth);
      if (w === 1 || w === -1) next.warmth = Math.max(-2, Math.min(2, a.warmth + w));
      if (ADJUST_TONES.includes(res.tone)) next.tone = res.tone;
      if (ADJUST_STYLES.includes(res.vibe)) next.vibe = res.vibe;
      const kinds = v => (Array.isArray(v) ? v : []).filter(x => typeof x === 'string' && /^[a-z]{2,12}$/.test(x));
      const want = kinds(res.want).slice(0, 3);
      // Asking for a piece cancels an earlier "not that one".
      const avoid = kinds(res.avoid).filter(x => !want.includes(x));
      next.want = want.length ? want : (a.want || []);
      next.avoid = [...new Set([...a.avoid.filter(x => !want.includes(x)), ...avoid])];
      const change = new Set((Array.isArray(res.change) ? res.change : []).filter(x => ADJUST_SLOTS.includes(x)));
      // A piece they don't want changes right away, whatever slot it's in.
      data.outfit.rows.forEach(r => { if (avoid.includes(r.art)) change.add(r.slotKey); });
      change.forEach(slot => { next.slotRolls[slot] = (next.slotRolls[slot] || 0) + 1; });
      return next;
    });
    // The app, not the AI, picks the pieces. If an asked-for piece doesn't suit
    // today's weather it isn't in the outfit, so say that instead of the AI's reply.
    const want = (state.adjust && state.adjust.want) || [];
    const after = computeOutfitFor(0);
    if (want.length && after && !after.outfit.rows.some(r => want.includes(r.art))) {
      changeAdjust(a => ({ ...a, want: [], reply: t(state.lang, 'adj_want_unavailable') }));
    }
  } catch (err) {
    state.adjustBusy = false;
    state.quietRender = true;
    render();
    showToast(t(state.lang, 'adj_failed'));
  }
}

export function resetOutfit() {
  state.outfitLocks = {};
  state.adjust = null;
  try { localStorage.removeItem(ADJUST_KEY); } catch { /* private mode */ }
  state.swappedSlot = null;
  state.quietRender = true;
  render();
}

export function openCitySheet() {
  state.citySheetOpen = true;
  state.citySheetQuery = '';
  state.citySheetResults = [];
  state.citySheetMsg = '';
  render();
}

export function closeCitySheet() {
  state.citySheetOpen = false;
  render();
}

export async function searchCity(query) {
  state.citySheetQuery = query;
  if (!query || query.trim().length < 2) {
    state.citySheetResults = [];
    state.citySheetMsg = '';
    refreshCity();
    return;
  }
  try {
    const results = await geocodeCity(query.trim(), state.lang);
    if (state.citySheetQuery !== query) return; // a newer search already started
    state.citySheetResults = results;
    state.citySheetMsg = results.length ? '' : t(state.lang, 'city_not_found');
  } catch {
    if (state.citySheetQuery !== query) return;
    state.citySheetMsg = t(state.lang, 'search_failed');
    state.citySheetResults = [];
  }
  refreshCity();
}

// Updates just the city sheet's list; falls back to a full render if it isn't open.
function refreshCity() {
  if (refreshCityBody(state)) return;
  state.quietRender = true;
  render();
}

export async function useGeolocation() {
  if (!('geolocation' in navigator)) {
    state.citySheetMsg = t(state.lang, 'geo_unsupported');
    render();
    return;
  }
  state.citySheetLoading = true;
  state.citySheetMsg = '';
  render();
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const place = await locateFromCoords(pos.coords.latitude, pos.coords.longitude);
      await chooseCity(place);
    },
    () => {
      state.citySheetLoading = false;
      state.citySheetMsg = t(state.lang, 'location_denied');
      render();
    },
    { timeout: 10000 }
  );
}

export function saveWardrobeItem(item) {
  const { items, ok } = addOrUpdateItem(state.wardrobe, item);
  state.wardrobe = items;
  render();
  if (!ok) showToast(t(state.lang, 'storage_full'));
}

// Moves photos into IndexedDB (first run) and attaches stored photos to items.
// Merges by id so anything edited while this was running is kept.
async function hydratePhotos() {
  const hydrated = await initPhotoStore(state.wardrobe);
  const byId = new Map(hydrated.map(i => [i.id, i]));
  state.wardrobe = state.wardrobe.map(i => (i.photo || !byId.get(i.id)?.photo ? i : { ...i, photo: byId.get(i.id).photo, hasPhoto: true }));
  // Printed pieces saved before the drawing showed the real print: cut it out once.
  for (const item of state.wardrobe.filter(i => i.patternType === 'print' && i.photo && !i.printImg)) {
    const img = await cropPrint(item.photo, item.printBox);
    if (img) state.wardrobe = state.wardrobe.map(i => (i.id === item.id && !i.printImg ? { ...i, printImg: img } : i));
  }
  saveWardrobe(state.wardrobe);
  render();
}

export function deleteWardrobeItem(id) {
  state.wardrobe = removeItem(state.wardrobe, id);
  render();
}

export { newItemId, resizePhoto };

export function openEditor(item) {
  state.editorItem = item;
  state.editorOpen = true;
  render();
}

export function closeEditor() {
  state.editorOpen = false;
  state.editorItem = null;
  render();
}

export function setWardrobeFilter(f) {
  state.wardrobeFilter = f;
  render();
}

export function setWardrobeSearch(q) {
  state.wardrobeSearch = q;
  render();
}

// ---------------- Onboarding ----------------

export function goToOnboardStep(step) {
  state.onboardStep = step;
  state.onboardLocationMsg = '';
  render();
}

export function backToProfileStep() {
  state.onboardStep = 'profile';
  state.onboardLocationMsg = '';
  render();
}

export function submitProfileStep(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) {
    state.profileNameError = true;
    render();
    return;
  }
  state.profileDraft.name = trimmed;
  state.profileNameError = false;
  goToOnboardStep('location');
}

export function openCityFromOnboarding() {
  state.onboardFromCitySheet = true;
  openCitySheet();
}

export async function useLocationForOnboarding() {
  if (!('geolocation' in navigator)) {
    state.onboardLocationMsg = t(state.lang, 'geo_unsupported');
    render();
    return;
  }
  state.onboardLocating = true;
  state.onboardLocationMsg = '';
  render();
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const place = await locateFromCoords(pos.coords.latitude, pos.coords.longitude);
      await finishOnboarding(place);
    },
    () => {
      state.onboardLocating = false;
      state.onboardLocationMsg = t(state.lang, 'location_denied');
      render();
    },
    { timeout: 10000 }
  );
}

async function finishOnboarding(city) {
  const profile = { name: state.profileDraft.name, gender: state.profileDraft.gender, styleVibe: state.profileDraft.styleVibe || 'casual' };
  saveProfile(profile);
  state.profile = profile;
  state.gender = profile.gender;
  state.city = city;
  rememberCity(city);
  localStorage.setItem(CITY_KEY, JSON.stringify(city));
  state.screen = 'app';
  state.activeTab = 'today';
  state.onboardLocating = false;
  await refetchForecast();
}

export function showToast(message) {
  // Only the overlay layer changes, so don't rebuild the screen underneath.
  state.toast = message;
  renderOverlays();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    state.toast = null;
    renderOverlays();
  }, 2200);
}

export function updateProfileGender(g) {
  if (!state.profile || state.profile.gender === g) return;
  state.profile = { ...state.profile, gender: g };
  state.gender = g;
  saveProfile(state.profile);
  render();
}

export function saveProfileName(name) {
  const trimmed = (name || '').trim();
  if (!trimmed || !state.profile) return;
  state.profile = { ...state.profile, name: trimmed };
  saveProfile(state.profile);
  state.quietRender = true;
  render();
  scrollToTop();
  showToast(t(state.lang, 'profile_saved'));
}

export function updateProfileStyleVibe(vibe) {
  if (!state.profile || state.profile.styleVibe === vibe) return;
  state.profile = { ...state.profile, styleVibe: vibe };
  saveProfile(state.profile);
  render();
}

export function toggleAvatarPicker() {
  state.avatarPickerOpen = !state.avatarPickerOpen;
  render();
}

export function setAvatar(key) {
  if (!state.profile) return;
  state.profile = { ...state.profile, avatar: key, avatarPhoto: null };
  saveProfile(state.profile);
  state.quietRender = true;
  render();
}

export function setComfort(level) {
  if (!state.profile || state.profile.comfort === level) return;
  state.profile = { ...state.profile, comfort: level };
  saveProfile(state.profile);
  state.quietRender = true;
  render();
  showToast(t(state.lang, 'profile_saved'));
}

function scrollToTop() {
  screenEl.scrollTop = 0;
  window.scrollTo(0, 0);
}

export async function setAvatarPhotoFile(file) {
  if (!state.profile || !file) return;
  const dataUrl = await resizePhoto(file, 240);
  state.profile = { ...state.profile, avatarPhoto: dataUrl };
  saveProfile(state.profile);
  render();
}

export function removeAvatarPhoto() {
  if (!state.profile) return;
  state.profile = { ...state.profile, avatarPhoto: null };
  saveProfile(state.profile);
  render();
}

export function resetProfile() {
  clearProfile();
  localStorage.removeItem(CITY_KEY);
  state.profile = null;
  state.city = null;
  state.forecastRaw = null;
  state.loading = true;
  state.profileDraft = { name: '', gender: 'unisex', styleVibe: 'casual' };
  state.avatarPickerOpen = false;
  state.screen = 'onboarding';
  state.onboardStep = 'welcome';
  render();
}

// ---------------- Render orchestration ----------------

function computeOutfitFor(dayOffset) {
  if (!state.forecastRaw) return null;
  const dayView = buildDayView(state.forecastRaw, dayOffset, state.lang);
  const today = dayOffset === 0 ? dayView.date : buildDayView(state.forecastRaw, 0, state.lang).date;
  // What we learned from this person's answers on days like this one.
  const learned = learnedOffset(state.feedback, dayView.hero.feelsLike, dayView.hero.wind, dayView.date);
  const memory = findMemory(state.feedback, dayView.hero.feelsLike, dayView.date);
  // The user's own changes apply to today's outfit only. "Warmer" = dress for 3° colder.
  const adjust = dayOffset === 0 ? todaysAdjust(dayView.date) : null;
  // From 18:00 local time there's no sun left to dress for. A day already
  // marked "I'm wearing this" keeps its outfit as it was.
  const nowIso = state.forecastRaw.current && state.forecastRaw.current.time;
  const hour = nowIso ? parseInt(nowIso.slice(11, 13), 10) : new Date().getHours();
  const late = dayOffset === 0 && hour >= 18 && !state.feedback.days[dayView.date];
  const outfit = generateOutfit(
    { feelsLike: dayView.hero.feelsLike, wind: dayView.hero.wind, rainMax: dayView.maxRainToday, gender: state.gender, lang: state.lang,
      comfort: comfortOffset(state.profile) + learned, shift: -3 * (adjust ? adjust.warmth : 0),
      vibe: (adjust && adjust.vibe) || (state.profile ? state.profile.styleVibe : 'casual'), seed: dayView.date, kind: dayView.hero.kind,
      wardrobeOnly: state.wardrobeMode === 'mine', memory: memory ? memory.answer : null, adjust, late, uv: dayView.uvMax },
    outfitWardrobe(),
    dayOffset === 0 ? state.outfitLocks : {}
  );
  const tip = eveningTip(dayView, state.lang);
  const worn = dayOffset === 0 ? state.feedback.days[dayView.date] || null : null;
  const pending = dayOffset === 0 ? pendingQuestion(state.feedback, today) : null;
  return { dayView, outfit, tip, today, memory, worn, pending, adjust };
}

// ---------------- Outfit feedback (feedback.js) ----------------

// "I'm wearing this today": remember today's weather and outfit, ask later how it went.
export function wearToday() {
  const data = computeOutfitFor(0);
  if (!data) return;
  const { dayView, outfit } = data;
  state.feedback = markWorn(state.feedback, {
    date: dayView.date,
    city: state.city ? state.city.name : '',
    feelsLike: dayView.hero.feelsLike,
    wind: dayView.hero.wind,
    rain: dayView.maxRainToday,
    gender: state.gender || null,
    rows: outfit.rows.map(r => ({
      slot: r.slotKey, item: r.item, art: r.art, fromWardrobe: r.fromWardrobe,
      color: r.color || (r.look && r.look.color) || null,
      look: r.look ? { patternType: r.look.patternType, color2: r.look.color2, lens: r.look.lens, printImg: r.look.printImg || null } : null,
    })),
  });
  saveFeedback(state.feedback);
  state.celebrate = true;
  state.quietRender = true;
  render();
}

export function unwearToday() {
  const data = computeOutfitFor(0);
  if (!data) return;
  state.feedback = unmarkWorn(state.feedback, data.dayView.date);
  saveFeedback(state.feedback);
  state.quietRender = true;
  render();
}

// answer: 'cold' | 'ok' | 'warm' | 'skip'
export function answerFeedback(date, answer) {
  state.feedback = answerDay(state.feedback, date, answer);
  saveFeedback(state.feedback);
  state.quietRender = true;
  render();
  if (answer !== 'skip') showToast(t(state.lang, 'fb_thanks_' + answer));
}

export function resetLearning() {
  state.feedback = clearLearning();
  saveFeedback(state.feedback);
  state.quietRender = true;
  render();
  showToast(t(state.lang, 'fb_reset_done'));
}

function computeWeekView() {
  if (!state.forecastRaw) return [];
  return buildWeekView(state.forecastRaw, state.lang);
}

// Pairs each week day with its rule-based outfit plus a per-day AI tip cache key,
// so the AI tip and its loading state can be looked up without re-deriving the key
// in the render layer.
function computeWeekOutfits() {
  const week = computeWeekView();
  const cityName = state.city ? state.city.name : 'unknown';
  const styleVibe = state.profile ? (state.profile.styleVibe || 'casual') : 'casual';
  return week.map(day => {
    const outfit = generateOutfit(
      { feelsLike: day.feelsLike, wind: day.wind, rainMax: day.rain, gender: state.gender, lang: state.lang,
        comfort: comfortOffset(state.profile) + learnedOffset(state.feedback, day.feelsLike, day.wind, day.date),
        vibe: styleVibe, seed: day.date, kind: day.kind, wardrobeOnly: state.wardrobeMode === 'mine', uv: day.uvMax,
        memory: (findMemory(state.feedback, day.feelsLike, day.date) || {}).answer || null },
      outfitWardrobe()
    );
    const tipKey = [day.date, cityName, outfit.intensity || outfit.bandKey, state.gender, styleVibe, state.lang, outfitSig(outfit)].join('|');
    return { day, outfit, tipKey, tip: state.weekTips[tipKey] || null, tipLoading: state.weekTipStatus[tipKey] === 'loading' };
  });
}

// What the AI gets to know about the person besides the weather (see ai.js).
function aiPersonal() {
  const sum = learningSummary(state.feedback);
  const lean = { cold: 'they usually felt cold', warm: 'they usually felt too warm', ok: 'our outfits usually felt right' };
  return {
    comfort: (state.profile && state.profile.comfort) || 'normal',
    learned: sum.count ? `${sum.count} answers, ${lean[sum.lean]}` : '',
  };
}
const aiOutfit = outfit => outfit.rows.map(r => ({ slot: r.slotKey, item: r.item }));
const outfitSig = outfit => outfit.rows.map(r => r.art).join(',');

function summarizeWardrobe() {
  return state.wardrobe.slice(0, 20)
    .map(i => {
      const bits = [isValidColor(i.color) ? colorName(i.color, 'en').toLowerCase() : null, i.category, i.warmth ? `warmth ${i.warmth}/5` : null].filter(Boolean);
      return bits.length ? `${i.name} (${bits.join(', ')})` : i.name;
    })
    .join(', ');
}

function loadTipCache() {
  try {
    return JSON.parse(localStorage.getItem(SMART_TIP_CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

function rememberTip(key, tip) {
  const cache = loadTipCache();
  cache[key] = tip;
  const keys = Object.keys(cache);
  if (keys.length > 20) delete cache[keys[0]];
  localStorage.setItem(SMART_TIP_CACHE_KEY, JSON.stringify(cache));
}

// Fetches (or reuses a cached) AI styling tip for today's exact context. Cheap to
// call on every render, it's a no-op once the tip for the current key is loaded
// or already in flight, so it only ever hits the network once per day/city/band/style.
function ensureSmartTip(dayView, outfit) {
  const cityName = state.city ? state.city.name : 'unknown';
  const styleVibe = state.profile ? (state.profile.styleVibe || 'casual') : 'casual';
  // The note talks about the outfit on screen, so a different outfit gets its own note.
  const key = [dayView.date, cityName, outfit.intensity || outfit.bandKey, state.gender, styleVibe, state.lang, outfitSig(outfit)].join('|');
  if (state.smartTipKey === key) return;
  state.smartTipKey = key;

  const cache = loadTipCache();
  if (cache[key]) {
    state.smartTip = cache[key];
    state.smartTipLoading = false;
    return;
  }

  state.smartTip = null;
  state.smartTipLoading = true;
  const wardrobeSummary = summarizeWardrobe();
  getSmartTip({
    lang: state.lang,
    city: cityName,
    feelsLike: dayView.hero.feelsLike,
    condition: dayView.hero.condition,
    wind: dayView.hero.wind,
    rain: dayView.hero.rain,
    evening: eveningTip(dayView, state.lang),
    gender: state.gender,
    styleVibe,
    wardrobeSummary,
    outfit: aiOutfit(outfit),
    ...aiPersonal(),
  }).then(tip => {
    if (state.smartTipKey !== key) return;
    state.smartTip = tip;
    state.smartTipLoading = false;
    rememberTip(key, tip);
    render();
  }).catch(() => {
    if (state.smartTipKey !== key) return;
    state.smartTip = null;
    state.smartTipLoading = false;
    render();
  });
}

function loadWeekTipCache() {
  try {
    return JSON.parse(localStorage.getItem(WEEK_TIP_CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

function rememberWeekTip(key, tip) {
  const cache = loadWeekTipCache();
  cache[key] = tip;
  const keys = Object.keys(cache);
  if (keys.length > 40) delete cache[keys[0]];
  localStorage.setItem(WEEK_TIP_CACHE_KEY, JSON.stringify(cache));
}

// Kicks off one AI tip request per week day that hasn't been attempted yet, so days
// sharing similar weather still get distinct AI-written text instead of the same
// fixed rule-based template string. Once a key has been attempted (loading/done/failed)
// it's never retried, render() runs on every state change, so without this a failed
// request (e.g. no API key configured) would refire on every single re-render.
function ensureWeekTips(weekOutfits) {
  const cache = loadWeekTipCache();
  const cityName = state.city ? state.city.name : 'unknown';
  const styleVibe = state.profile ? (state.profile.styleVibe || 'casual') : 'casual';
  const wardrobeSummary = summarizeWardrobe();

  weekOutfits.forEach(({ day, outfit, tipKey }) => {
    if (state.weekTipStatus[tipKey]) return;
    if (cache[tipKey]) {
      state.weekTips[tipKey] = cache[tipKey];
      state.weekTipStatus[tipKey] = 'done';
      return;
    }
    state.weekTipStatus[tipKey] = 'loading';
    getSmartTip({
      lang: state.lang,
      city: cityName,
      day: day.date,
      feelsLike: day.feelsLike,
      condition: day.condition,
      wind: day.wind,
      rain: day.rain,
      gender: state.gender,
      styleVibe,
      wardrobeSummary,
      outfit: aiOutfit(outfit),
      ...aiPersonal(),
    }).then(tip => {
      state.weekTips[tipKey] = tip;
      state.weekTipStatus[tipKey] = 'done';
      rememberWeekTip(tipKey, tip);
      // Only that day's row changes; the week view isn't rebuilt for each tip.
      if (state.activeTab === 'week') updateWeekTipRow(screenEl, tipKey, tip, state.lang);
    }).catch(() => {
      state.weekTipStatus[tipKey] = 'failed';
      if (state.activeTab === 'week') updateWeekTipRow(screenEl, tipKey, null, state.lang);
    });
  });
}

// Rebuilding a container's innerHTML destroys and recreates any focused <input>
// inside it, which fires a synchronous native blur on the old node, that made
// per-component focus/blur flag tracking unreliable (the flag got cleared by the
// very blur the rebuild caused, before the new input could reclaim it). Capturing
// activeElement right before the rebuild and restoring it by id afterwards sidesteps
// that race entirely.
function withFocusPreserved(container, updateFn) {
  const active = document.activeElement;
  const isInside = active && container.contains(active);
  const id = isInside ? active.id : null;
  const selStart = isInside && typeof active.selectionStart === 'number' ? active.selectionStart : null;

  updateFn();

  if (id) {
    const el = container.querySelector('#' + CSS.escape(id));
    if (el) {
      el.focus();
      if (selStart != null && typeof el.setSelectionRange === 'function') {
        try { el.setSelectionRange(selStart, selStart); } catch { /* not a text-selectable input */ }
      }
    }
  }
}

function currentSky() {
  const cur = state.forecastRaw && state.forecastRaw.current;
  if (state.screen === 'onboarding' || !cur) return { kind: 'partly', isDay: true };
  let isDay = cur.is_day;
  if (isDay == null) {
    const hour = parseInt(String(cur.time || '').split('T')[1] || '12', 10);
    isDay = hour >= 7 && hour < 19 ? 1 : 0;
  }
  return { kind: skyKind(cur.weather_code), isDay: isDay !== 0, wind: Math.round(cur.wind_speed_10m || 0) };
}

let lastViewKey = null;

export function render() {
  navEl.style.display = state.screen === 'onboarding' ? 'none' : '';
  const sky = currentSky();
  setSky(sky);
  setAmbient({ kind: sky.kind, isDay: sky.isDay, wind: sky.wind || 0 });
  screenEl.dataset.tab = state.screen === 'onboarding' ? 'onboarding' : state.activeTab;

  // Entrance animations only play when the view itself changes (tab, screen,
  // onboarding step, city, data arriving). Background updates such as an AI tip
  // landing, photos loading or a toast closing re-render quietly; replaying the
  // whole entrance on those made the page look like it was reloading.
  const viewKey = [state.screen, state.screen === 'onboarding' ? state.onboardStep : state.activeTab,
    state.loading ? 'loading' : state.error ? 'error' : 'ready', state.city ? state.city.name : ''].join('|');
  const quiet = state.quietRender || viewKey === lastViewKey;
  lastViewKey = viewKey;
  state.quietRender = false;
  screenEl.classList.toggle('quiet', quiet);
  if (!quiet) {
    screenEl.classList.remove('screen-enter');
    void screenEl.offsetWidth;
    screenEl.classList.add('screen-enter');
  }

  if (state.screen === 'onboarding') {
    withFocusPreserved(screenEl, () => {
      screenEl.innerHTML = renderOnboardingScreen(state);
      attachOnboardingHandlers(screenEl);
    });
    renderOverlays();
    return;
  }

  navEl.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === state.activeTab);
    const label = btn.querySelector('span');
    const text = t(state.lang, 'tab_' + btn.dataset.tab);
    if (label) label.textContent = text;
    btn.setAttribute('aria-label', text);
  });

  withFocusPreserved(screenEl, () => {
    if (state.activeTab === 'today') {
      const data = computeOutfitFor(0);
      if (data) ensureSmartTip(data.dayView, data.outfit);
      screenEl.innerHTML = renderTodayScreen({ dayOffset: 0, state, data });
      attachTodayHandlers(screenEl);
    } else if (state.activeTab === 'week') {
      const weekOutfits = computeWeekOutfits();
      ensureWeekTips(weekOutfits);
      screenEl.innerHTML = renderWeekScreen({ ...state, weekOutfits });
      attachWeekHandlers(screenEl);
    } else if (state.activeTab === 'wardrobe') {
      screenEl.innerHTML = renderWardrobeScreen(state);
      attachWardrobeHandlers(screenEl);
    } else if (state.activeTab === 'profile') {
      screenEl.innerHTML = renderProfileScreen(state);
      attachProfileHandlers(screenEl);
    }
  });

  // One-shot animations (piece swap, dice spin, confetti) only play on the render that asked for them.
  state.swappedSlot = null;
  state.diceSpin = false;
  state.celebrate = false;
  renderOverlays();
}

function renderOverlays() {
  let overlayRoot = document.getElementById('overlay-root');
  if (!overlayRoot) {
    overlayRoot = document.createElement('div');
    overlayRoot.id = 'overlay-root';
    document.getElementById('phone').appendChild(overlayRoot);
  }
  withFocusPreserved(overlayRoot, () => {
    let html = '';
    html += renderCitySheet(state);
    html += renderEditorSheet(state);
    html += `<div class="toast ${state.toast ? 'toast-show' : ''}">${state.toast || ''}</div>`;
    overlayRoot.innerHTML = html;
    attachCitySheetHandlers(overlayRoot);
    attachEditorHandlers(overlayRoot);
  });
}

// Sounds: audio may only start after the first touch; then a soft tap for
// buttons, and its own sound for the dice, "I'm wearing this", options and tabs.
document.addEventListener('pointerdown', unlockSound, { capture: true });
document.addEventListener('keydown', unlockSound, { capture: true });
document.addEventListener('click', (e) => {
  const el = e.target.closest('button, [role="button"], a');
  if (!el || el.disabled) return;
  const action = el.dataset.action;
  if (action === 'toggle-sound' || action === 'toggle-sound-panel') return;
  if (action === 'reroll' || el.dataset.swapSuggest || el.dataset.swap) playDice();
  else if (action === 'wear' || el.dataset.fb) playChime();
  else if (el.dataset.adjust) playToggle(!el.classList.contains('active'));
  else if (el.classList.contains('nav-btn')) playWhoosh();
  else playTap();
}, { capture: true });

navEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.nav-btn');
  if (btn) switchTab(btn.dataset.tab);
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('[data-lang-menu]')) closeLangMenu();
  if (!e.target.closest('[data-sound-menu]')) closeSoundPanel();
  if (state.modeMenuOpen && !e.target.closest('[data-mode-menu]')) toggleModeMenu(false);
});

if (state.screen === 'app') {
  initCity();
} else {
  state.loading = false;
}
render();
hydratePhotos();
