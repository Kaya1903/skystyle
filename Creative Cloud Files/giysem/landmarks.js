// Minimal line-art landmark silhouettes for well-known cities, matched by
// coordinates (not name) so they work regardless of the display language the
// geocoder returns the city name in. Purely decorative — unmatched cities
// simply render nothing.
const S = 'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';

const LANDMARK_CITIES = [
  { key: 'istanbul', lat: 41.0082, lon: 28.9784 },
  { key: 'warsaw', lat: 52.2297, lon: 21.0122 },
  { key: 'paris', lat: 48.8566, lon: 2.3522 },
  { key: 'london', lat: 51.5074, lon: -0.1278 },
  { key: 'newyork', lat: 40.7128, lon: -74.0060 },
  { key: 'tokyo', lat: 35.6762, lon: 139.6503 },
  { key: 'rome', lat: 41.9028, lon: 12.4964 },
  { key: 'berlin', lat: 52.5200, lon: 13.4050 },
  { key: 'amsterdam', lat: 52.3676, lon: 4.9041 },
  { key: 'barcelona', lat: 41.3874, lon: 2.1686 },
  { key: 'dubai', lat: 25.2048, lon: 55.2708 },
  { key: 'moscow', lat: 55.7558, lon: 37.6173 },
  { key: 'cairo', lat: 30.0444, lon: 31.2357 },
  { key: 'sydney', lat: -33.8688, lon: 151.2093 },
  { key: 'riodejaneiro', lat: -22.9068, lon: -43.1729 },
];

const ART = {
  istanbul: `
    <path d="M0 70c15-6 25-6 40 0s25 6 40 0 25-6 40 0 25 6 40 0" />
    <path d="M35 68v-8a6 6 0 0 1 12 0v8" />
    <path d="M113 68v-8a6 6 0 0 1 12 0v8" />
    <path d="M55 68V54a15 15 0 0 1 30 0v14" />
    <path d="M50 68V44" /><circle cx="50" cy="41" r="2" />
    <path d="M90 68V44" /><circle cx="90" cy="41" r="2" />
  `,
  warsaw: `
    <path d="M0 68h160" />
    <path d="M62 68V42h6v28" /><path d="M92 68V42h-6v28" />
    <path d="M70 68V30h6l4-8 4 8h6v38" />
  `,
  paris: `
    <path d="M0 68h160" />
    <path d="M80 18l-16 50M80 18l16 50" />
    <path d="M68 55h24" />
    <path d="M72 40h16" />
    <path d="M58 68h44" />
  `,
  london: `
    <path d="M0 68h160" />
    <path d="M74 68V30h12v38" />
    <path d="M72 30h16l-8-10z" />
    <circle cx="80" cy="40" r="3.6" />
    <path d="M60 68h40" />
  `,
  newyork: `
    <path d="M0 68h160" />
    <path d="M40 68V38h10V25h6v13h10v30" />
    <path d="M100 68V50h4v-6l4-4 4 4v6h4v18" />
  `,
  tokyo: `
    <path d="M0 68h160" />
    <path d="M80 18l-14 50M80 18l14 50" />
    <circle cx="80" cy="16" r="1.6" />
    <path d="M70 50h20" />
    <path d="M73 34h14" />
    <path d="M60 68h40" />
  `,
  rome: `
    <path d="M35 68h90" />
    <path d="M40 68V52a10 10 0 0 1 20 0v16" />
    <path d="M60 68V52a10 10 0 0 1 20 0v16" />
    <path d="M80 68V52a10 10 0 0 1 20 0v16" />
    <path d="M100 68V52a10 10 0 0 1 20 0v16" />
  `,
  berlin: `
    <path d="M40 68h80" />
    <path d="M44 38h72v-8H44z" />
    <path d="M48 68V38M58 68V38M68 68V38M92 68V38M102 68V38M112 68V38" />
  `,
  amsterdam: `
    <path d="M35 68h55" />
    <path d="M40 68V45l8-6 8 6v23" />
    <path d="M58 68V40l7-8 7 8v28" />
    <path d="M74 68V48l6-5 6 5v20" />
  `,
  barcelona: `
    <path d="M55 68h55" />
    <path d="M60 68V38l4-10 4 10v30" />
    <path d="M76 68V30l4-12 4 12v38" />
    <path d="M92 68V38l4-10 4 10v30" />
  `,
  dubai: `
    <path d="M65 68h30" />
    <path d="M74 68V45l3-10 3-8 3 8 3 10v23" />
  `,
  moscow: `
    <path d="M45 68h65" />
    <path d="M50 68V55a6 6 0 0 1 12 0v13" /><path d="M56 55c-2-4 0-9 0-9s2 5 0 9" />
    <path d="M70 68V50a8 8 0 0 1 16 0v18" /><path d="M78 50c-2-5 0-11 0-11s2 6 0 11" />
    <path d="M94 68V55a6 6 0 0 1 12 0v13" /><path d="M100 55c-2-4 0-9 0-9s2 5 0 9" />
  `,
  cairo: `
    <path d="M35 68h95" />
    <path d="M45 68l15-26 15 26z" />
    <path d="M70 68l20-34 20 34z" />
    <circle cx="118" cy="26" r="7" />
  `,
  sydney: `
    <path d="M42 68h60" />
    <path d="M50 68V56c0-4 6-8 10-4v16z" />
    <path d="M65 68V50c0-5 8-10 13-5v23z" />
    <path d="M83 68V54c0-4 7-9 11-4v18z" />
  `,
  riodejaneiro: `
    <path d="M40 68l25-30 25 30z" />
    <path d="M65 45v-14M58 34h14" />
    <circle cx="65" cy="27" r="2" />
  `,
};

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getLandmarkArt(city) {
  if (!city || typeof city.lat !== 'number' || typeof city.lon !== 'number') return null;
  let bestKey = null;
  let bestDist = Infinity;
  for (const c of LANDMARK_CITIES) {
    const d = haversineKm(city.lat, city.lon, c.lat, c.lon);
    if (d < bestDist) { bestDist = d; bestKey = c.key; }
  }
  if (bestDist > 45 || !ART[bestKey]) return null;
  return ART[bestKey];
}

export function renderLandmark(city) {
  const art = getLandmarkArt(city);
  if (!art) return '';
  return `<div class="hero-landmark" aria-hidden="true"><svg viewBox="0 0 160 80" ${S}>${art}</svg></div>`;
}
