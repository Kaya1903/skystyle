import { colorName, isValidColor } from './colors.js';
import { setSky } from './sky.js';
import { skyKind } from './weather.js';
import { geocodeCity, geocodeSingle, reverseGeocode, fetchForecast, buildDayView, buildWeekView, eveningTip } from './weather.js';
import { loadWardrobe, addOrUpdateItem, removeItem, newItemId, resizePhoto, initPhotoStore, saveWardrobe } from './wardrobe.js';
import { generateOutfit } from './outfit.js';
import { t, LANGS, RTL_LANGS } from './i18n.js';
import { loadProfile, saveProfile, clearProfile, comfortOffset } from './profile.js';
import { getSmartTip } from './ai.js';
import { loadFeedback, saveFeedback, markWorn, unmarkWorn, answerDay, clearLearning, pendingQuestion, learnedOffset, findMemory } from './feedback.js';
import { renderTodayScreen, attachTodayHandlers } from './render_today.js';
import { renderWardrobeScreen, attachWardrobeHandlers, renderEditorSheet, attachEditorHandlers } from './render_wardrobe.js';
import { renderWeekScreen, attachWeekHandlers } from './render_week.js';
import { renderProfileScreen, attachProfileHandlers } from './render_profile.js';
import { renderCitySheet, attachCitySheetHandlers } from './render_city.js';
import { renderOnboardingScreen, attachOnboardingHandlers } from './render_onboarding.js';

const CITY_KEY = 'giysem_city_v1';
const LANG_KEY = 'giysem_lang_v1';
const WARDROBE_ONLY_KEY = 'giysem_wardrobe_only_v1';
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
  wardrobeOnly: (() => { try { return localStorage.getItem(WARDROBE_ONLY_KEY) === '1'; } catch { return false; } })(),
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
  const entry = { name: city.name, admin: city.admin || '', country: city.country || '', lat: city.lat, lon: city.lon };
  const next = [entry, ...loadRecentCities().filter(c => !sameCity(c, entry))].slice(0, RECENT_MAX);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* history is a convenience */ }
}

export function removeRecentCity(lat, lon) {
  const next = loadRecentCities().filter(c => !sameCity(c, { lat, lon }));
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  state.quietRender = true;
  render();
}

export function clearRecentCities() {
  try { localStorage.removeItem(RECENT_KEY); } catch { /* ignore */ }
  state.quietRender = true;
  render();
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
    if (place && place.name) return { ...base, name: place.name, admin: place.admin };
  } catch { /* fall through to generic label */ }
  return { ...base, name: t(state.lang, 'my_location') };
}

async function useFallbackCity() {
  try {
    const c = await geocodeSingle(FALLBACK_CITY, state.lang);
    state.city = { name: c.name, admin: c.admin, lat: c.lat, lon: c.lon };
    await refetchForecast();
  } catch {
    state.loading = false;
    state.error = t(state.lang, 'error_forecast');
    render();
  }
}

export function switchTab(tab) {
  if (state.activeTab === tab) return;
  state.activeTab = tab;
  render();
}

// Today's outfit made only from the user's own clothes (with tips), or the usual mix.
export function setWardrobeOnly(on) {
  state.wardrobeOnly = !!on;
  state.outfitLocks = {};
  try { localStorage.setItem(WARDROBE_ONLY_KEY, on ? '1' : '0'); } catch { /* private mode */ }
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

export function resetOutfit() {
  state.outfitLocks = {};
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
    render();
    return;
  }
  state.citySheetLoading = true;
  render();
  try {
    const results = await geocodeCity(query.trim(), state.lang);
    state.citySheetResults = results;
    state.citySheetMsg = results.length ? '' : t(state.lang, 'city_not_found');
  } catch {
    state.citySheetMsg = t(state.lang, 'search_failed');
    state.citySheetResults = [];
  }
  state.citySheetLoading = false;
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
  const outfit = generateOutfit(
    { feelsLike: dayView.hero.feelsLike, wind: dayView.hero.wind, rainMax: dayView.maxRainToday, gender: state.gender, lang: state.lang, comfort: comfortOffset(state.profile) + learned,
      vibe: state.profile ? state.profile.styleVibe : 'casual', seed: dayView.date, kind: dayView.hero.kind, wardrobeOnly: state.wardrobeOnly, memory: memory ? memory.answer : null },
    state.wardrobe,
    dayOffset === 0 ? state.outfitLocks : {}
  );
  const tip = eveningTip(dayView, state.lang);
  const worn = dayOffset === 0 ? state.feedback.days[dayView.date] || null : null;
  const pending = dayOffset === 0 ? pendingQuestion(state.feedback, today) : null;
  return { dayView, outfit, tip, today, memory, worn, pending };
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
    rows: outfit.rows.map(r => ({ slot: r.slotKey, item: r.item, art: r.art, fromWardrobe: r.fromWardrobe })),
  });
  saveFeedback(state.feedback);
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
        vibe: styleVibe, seed: day.date, kind: day.kind, wardrobeOnly: state.wardrobeOnly,
        memory: (findMemory(state.feedback, day.feelsLike, day.date) || {}).answer || null },
      state.wardrobe
    );
    const tipKey = [day.date, cityName, outfit.intensity || outfit.bandKey, state.gender, styleVibe, state.lang].join('|');
    return { day, outfit, tipKey, tip: state.weekTips[tipKey] || null, tipLoading: state.weekTipStatus[tipKey] === 'loading' };
  });
}

function summarizeWardrobe() {
  return state.wardrobe.slice(0, 12)
    .map(i => isValidColor(i.color) ? `${i.name} (${colorName(i.color, 'en').toLowerCase()})` : i.name)
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
  const key = [dayView.date, cityName, outfit.intensity || outfit.bandKey, state.gender, styleVibe, state.lang].join('|');
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
    gender: state.gender,
    styleVibe,
    wardrobeSummary,
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
      feelsLike: day.feelsLike,
      condition: day.condition,
      wind: day.wind,
      rain: day.rain,
      gender: state.gender,
      styleVibe,
      wardrobeSummary,
    }).then(tip => {
      state.weekTips[tipKey] = tip;
      state.weekTipStatus[tipKey] = 'done';
      rememberWeekTip(tipKey, tip);
      render();
    }).catch(() => {
      state.weekTipStatus[tipKey] = 'failed';
      render();
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
  return { kind: skyKind(cur.weather_code), isDay: isDay !== 0 };
}

let lastViewKey = null;

export function render() {
  navEl.style.display = state.screen === 'onboarding' ? 'none' : '';
  setSky(currentSky());
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

  state.swappedSlot = null;
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

navEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.nav-btn');
  if (btn) switchTab(btn.dataset.tab);
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('[data-lang-menu]')) closeLangMenu();
});

if (state.screen === 'app') {
  initCity();
} else {
  state.loading = false;
}
render();
hydratePhotos();
