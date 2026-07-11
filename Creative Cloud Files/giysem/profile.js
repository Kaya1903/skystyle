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

export const AVATAR_COLORS = {
  sage: '#3f9173',
  clay: '#c17a54',
  sky: '#4f86bf',
  plum: '#8b6bab',
  sand: '#b98a1e',
  ink: '#4a4740',
};
export const AVATAR_COLOR_KEYS = Object.keys(AVATAR_COLORS);

export function avatarBackground(profile) {
  if (!profile) return 'var(--brand-soft)';
  if (profile.avatarPhoto) return 'var(--card-border)';
  if (profile.avatarColor && AVATAR_COLORS[profile.avatarColor]) return AVATAR_COLORS[profile.avatarColor];
  return 'var(--brand-soft)';
}

export function avatarContent(profile) {
  if (profile && profile.avatarPhoto) {
    return `<img src="${profile.avatarPhoto}" class="avatar-img" alt="" />`;
  }
  const hasColor = !!(profile && profile.avatarColor && AVATAR_COLORS[profile.avatarColor]);
  return `<span class="avatar-text" style="color:${hasColor ? '#fff' : 'var(--brand)'}">${initials(profile ? profile.name : '')}</span>`;
}

export const STYLE_VIBES = ['casual', 'elegant', 'sporty', 'minimal', 'bold'];
