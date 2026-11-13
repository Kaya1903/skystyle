import { garmentArt } from './visuals.js';

const PROFILE_KEY = 'giysem_profile_v1';

export function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.name !== 'string' || !parsed.name.trim()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function clearProfile() {
  localStorage.removeItem(PROFILE_KEY);
}

export function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const first = parts[0][0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

// Illustrated avatars: one of the app's own garment drawings on a sky gradient.
// (Replaces the old flat colour swatches; an old `avatarColor` simply falls back
// to the initials avatar.)
export const AVATARS = {
  cap: { bg: 'linear-gradient(160deg, #2f78db, #8cc3ff)', art: 'cap', color: '#ff7a50' },
  beanie: { bg: 'linear-gradient(160deg, #0e1433, #3a3f7a)', art: 'beanie', color: '#ffd166' },
  hoodie: { bg: 'linear-gradient(160deg, #ffb35c, #ff6f7d)', art: 'hoodie', color: '#2f3e5e' },
  trench: { bg: 'linear-gradient(160deg, #5d7393, #c7d2e1)', art: 'trench', color: '#e9d3a5' },
  sneaker: { bg: 'linear-gradient(160deg, #13917f, #8fe0cf)', art: 'sneaker', color: '#ffffff' },
  umbrella: { bg: 'linear-gradient(160deg, #23304a, #5f7391)', art: 'umbrella', color: '#ffc93c' },
};
export const AVATAR_KEYS = Object.keys(AVATARS);
const DEFAULT_AVATAR_BG = 'linear-gradient(160deg, #141a2e, #46507a)';

export function avatarBackground(profile) {
  if (!profile) return DEFAULT_AVATAR_BG;
  if (profile.avatarPhoto) return 'var(--card-border)';
  if (profile.avatar && AVATARS[profile.avatar]) return AVATARS[profile.avatar].bg;
  return DEFAULT_AVATAR_BG;
}

export function avatarContent(profile) {
  if (profile && profile.avatarPhoto) {
    return `<img src="${profile.avatarPhoto}" class="avatar-img" alt="" />`;
  }
  if (profile && profile.avatar && AVATARS[profile.avatar]) {
    const a = AVATARS[profile.avatar];
    return garmentArt(a.art, a.color, {}, 'flat avatar-art');
  }
  return `<span class="avatar-text" style="color:#fff">${initials(profile ? profile.name : '')}</span>`;
}

// How the user runs: shifts which weather band the outfit is picked for
// (never the temperature shown on screen).
export const COMFORT_OFFSETS = { cold: -3, normal: 0, warm: 3 };
export function comfortOffset(profile) {
  return (profile && COMFORT_OFFSETS[profile.comfort]) || 0;
}

export const STYLE_VIBES = ['casual', 'elegant', 'sporty', 'minimal', 'bold'];
