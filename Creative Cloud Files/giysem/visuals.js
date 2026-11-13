// Big flat illustrations: clothing pieces tinted with the item's real color,
// and animated weather glyphs. Pure SVG strings so they slot into the
// template-literal renderers.

// Fallback colors for suggestions that don't come from the user's wardrobe.
const DEFAULT_GARMENT_COLOR = {
  ust: '#f3eee4',
  ustune: '#c8895a',
  dis: '#3f5f86',
  alt: '#2f3e5e',
  ayak: '#f4f2ee',
  yanina: '#e2564c',
};

function clamp(n) { return Math.max(0, Math.min(255, Math.round(n))); }

// Mix a hex color toward black (amt < 0) or white (amt > 0).
export function shade(hex, amt) {
  const h = hex.replace('#', '');
  const num = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  let r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
  const target = amt < 0 ? 0 : 255;
  const p = Math.abs(amt);
  r = clamp(r + (target - r) * p);
  g = clamp(g + (target - g) * p);
  b = clamp(b + (target - b) * p);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

function isLight(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 > 170;
}

let uid = 0;

// Each garment: main silhouette path(s) + optional detail markup that uses {D} (darker) / {L} (lighter).
const GARMENTS = {
  ust: {
    body: 'M40 22 L17 35 L26 54 L37 49 V99 Q37 102 40 102 H80 Q83 102 83 99 V49 L94 54 L103 35 L80 22 C76 30 69 34 60 34 C51 34 44 30 40 22 Z',
    detail: '<path d="M40 22 C44 30 51 34 60 34 C69 34 76 30 80 22" fill="none" stroke="{D}" stroke-width="3" stroke-linecap="round"/><path d="M37 49 V60 M83 49 V60" stroke="{D}" stroke-width="2" opacity=".35" stroke-linecap="round"/>',
  },
  ustune: {
    body: 'M40 19 L19 30 L12 92 Q12 95 15 95 H26 Q29 95 29 92 L33 52 V102 Q33 105 36 105 H84 Q87 105 87 102 V52 L91 92 Q91 95 94 95 H105 Q108 95 108 92 L101 30 L80 19 L60 62 Z',
    detail: '<path d="M40 19 L60 62 L80 19 C74 25 67 27 60 27 C53 27 46 25 40 19 Z" fill="{L}"/><path d="M60 62 V105" stroke="{D}" stroke-width="2.5"/><circle cx="64.5" cy="72" r="2.4" fill="{D}"/><circle cx="64.5" cy="84" r="2.4" fill="{D}"/><circle cx="64.5" cy="96" r="2.4" fill="{D}"/><path d="M40 19 L60 62 M80 19 L60 62" stroke="{D}" stroke-width="2.5" fill="none"/>',
  },
  dis: {
    body: 'M42 15 L21 26 L11 96 Q11 99 14 99 H26 Q29 99 29 96 L33 56 V108 Q33 111 36 111 H84 Q87 111 87 108 V56 L91 96 Q91 99 94 99 H106 Q109 99 109 96 L99 26 L78 15 C74 22 67 25 60 25 C53 25 46 22 42 15 Z',
    detail: '<path d="M42 15 L50 42 L60 25 Z M78 15 L70 42 L60 25 Z" fill="{D}" opacity=".55"/><path d="M60 25 V111" stroke="{D}" stroke-width="2.5"/><path d="M41 78 H52 M68 78 H79" stroke="{D}" stroke-width="3" stroke-linecap="round"/><path d="M33 56 H87" stroke="{D}" stroke-width="2" opacity=".25"/>',
  },
  alt: {
    body: 'M35 14 H85 L92 104 Q92 107 89 107 H68 Q65 107 65 104 L60 48 L55 104 Q55 107 52 107 H31 Q28 107 28 104 Z',
    detail: '<path d="M35 14 H85 L85.8 24 H34.2 Z" fill="{D}" opacity=".45"/><path d="M60 24 V44" stroke="{D}" stroke-width="2.5" stroke-linecap="round"/><path d="M42 30 Q44 38 50 40 M78 30 Q76 38 70 40" fill="none" stroke="{D}" stroke-width="2" opacity=".5" stroke-linecap="round"/>',
  },
  ayak: {
    body: 'M13 80 C13 63 21 52 30 50 L45 47 C51 56 61 61 75 63 L98 67 C106 69 109 75 109 81 V88 H13 Z',
    detail: '<path d="M11 86 H111 V93 Q111 99 105 99 H17 Q11 99 11 93 Z" fill="{L}" stroke="{D}" stroke-width="2"/><path d="M47 56 L55 52 M53 60 L61 56 M59 63 L67 59" stroke="{D}" stroke-width="2.5" stroke-linecap="round"/><path d="M13 76 Q40 72 62 76" fill="none" stroke="{D}" stroke-width="2" opacity=".35"/>',
  },
  yanina: {
    body: 'M12 62 C12 36 34 18 60 18 C86 18 108 36 108 62 C102 56 94 56 88 62 C82 56 74 56 68 62 C64 57 56 57 52 62 C46 56 38 56 32 62 C26 56 18 56 12 62 Z',
    detail: '<path d="M60 18 V12" stroke="{D}" stroke-width="3" stroke-linecap="round"/><path d="M60 18 C50 30 46 46 52 62 M60 18 C70 30 74 46 68 62 M60 18 C40 26 30 44 32 62 M60 18 C80 26 90 44 88 62" fill="none" stroke="{D}" stroke-width="2" opacity=".4"/><path d="M60 60 V96 Q60 104 52 104 Q45 104 45 97" fill="none" stroke="#5b4636" stroke-width="4.5" stroke-linecap="round"/>',
  },
};

export function garmentArt(slot, color, patterned = false, extraClass = '') {
  const g = GARMENTS[slot] || GARMENTS.ust;
  const fill = color || DEFAULT_GARMENT_COLOR[slot] || '#cccccc';
  const dark = shade(fill, isLight(fill) ? -0.32 : -0.38);
  const light = shade(fill, 0.55);
  const id = `gp${++uid}`;
  const pattern = patterned ? `
    <defs><pattern id="${id}" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
      <rect width="4" height="10" fill="${isLight(fill) ? dark : light}" opacity=".45"/>
    </pattern></defs>` : '';
  const detail = g.detail.replaceAll('{D}', dark).replaceAll('{L}', light);
  return `
    <svg class="garment ${extraClass}" viewBox="0 0 120 120" aria-hidden="true">
      ${pattern}
      <ellipse cx="60" cy="114" rx="34" ry="4" fill="rgba(20,24,40,.16)"/>
      <path d="${g.body}" fill="${fill}" stroke="${dark}" stroke-width="2.5" stroke-linejoin="round"/>
      ${patterned ? `<path d="${g.body}" fill="url(#${id})"/>` : ''}
      ${detail}
    </svg>`;
}

const CLOUD = 'M30 86 H90 A19 19 0 0 0 88 48 A27 27 0 0 0 36 52 A17 17 0 0 0 30 86 Z';
const CLOUD_SM = 'M58 60 H96 A12 12 0 0 0 95 36 A17 17 0 0 0 62 39 A11 11 0 0 0 58 60 Z';

function sun(cx = 60, cy = 60, r = 20) {
  const rays = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    const r1 = r + 8, r2 = r + 17;
    return `<path d="M${(cx + Math.cos(a) * r1).toFixed(1)} ${(cy + Math.sin(a) * r1).toFixed(1)} L${(cx + Math.cos(a) * r2).toFixed(1)} ${(cy + Math.sin(a) * r2).toFixed(1)}"/>`;
  }).join('');
  return `
    <g class="g-sun-rays" style="transform-origin:${cx}px ${cy}px" stroke="#ffd25e" stroke-width="5" stroke-linecap="round">${rays}</g>
    <circle class="g-sun-core" cx="${cx}" cy="${cy}" r="${r}" fill="url(#gSun)" style="transform-origin:${cx}px ${cy}px"/>`;
}

function moon(cx = 60, cy = 56) {
  return `
    <path class="g-moon" d="M${cx + 6} ${cy - 30} A30 30 0 1 0 ${cx + 28} ${cy + 16} A24 24 0 1 1 ${cx + 6} ${cy - 30} Z" fill="#f3efff"/>
    <g class="g-twinkle" fill="#fff"><circle cx="24" cy="26" r="2.2"/><circle cx="98" cy="20" r="1.8"/><circle cx="102" cy="58" r="2.4"/><circle cx="20" cy="74" r="1.6"/></g>`;
}

const GLYPH_DEFS = `
  <defs>
    <radialGradient id="gSun" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="#fff3b0"/><stop offset=".6" stop-color="#ffc93c"/><stop offset="1" stop-color="#ff9f1c"/></radialGradient>
    <linearGradient id="gCloud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dfe7f3"/></linearGradient>
    <linearGradient id="gCloudDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c3cbd9"/><stop offset="1" stop-color="#8d98ad"/></linearGradient>
  </defs>`;

export function weatherGlyph(kind, isDay = true, extraClass = '') {
  let body = '';
  const darkCloud = kind === 'rain' || kind === 'storm';
  const cloudFill = darkCloud ? 'url(#gCloudDark)' : 'url(#gCloud)';
  switch (kind) {
    case 'clear':
      body = isDay ? sun() : moon();
      break;
    case 'partly':
      body = `<g transform="translate(-10 -12)">${isDay ? sun(54, 50, 17) : moon(48, 44)}</g>
        <path class="g-cloud g-drift" d="${CLOUD}" fill="${cloudFill}" transform="translate(6 10) scale(.92)"/>`;
      break;
    case 'cloudy':
      body = `<path class="g-cloud g-drift-slow" d="${CLOUD_SM}" fill="#c9d2e0" transform="translate(-6 -6)"/>
        <path class="g-cloud g-drift" d="${CLOUD}" fill="${cloudFill}"/>`;
      break;
    case 'fog':
      body = `<path class="g-cloud" d="${CLOUD}" fill="${cloudFill}" transform="translate(0 -14)"/>
        <g class="g-fog" stroke="#e8edf5" stroke-width="5" stroke-linecap="round"><path d="M22 88 H78"/><path d="M40 100 H100"/><path d="M18 112 H70"/></g>`;
      break;
    case 'rain':
    case 'storm': {
      const drops = [[40, 92], [56, 98], [72, 92], [88, 98], [48, 108], [80, 108]]
        .map(([x, y], i) => `<path class="g-drop" style="animation-delay:${i * 0.18}s" d="M${x} ${y} l-4 10" stroke="#8fc1ff" stroke-width="4" stroke-linecap="round"/>`).join('');
      const bolt = kind === 'storm' ? '<path class="g-bolt" d="M62 78 L50 100 H62 L54 120 L78 92 H66 L74 78 Z" fill="#ffd84d" stroke="#f2a900" stroke-width="2" stroke-linejoin="round"/>' : '';
      body = `${drops}${bolt}<path class="g-cloud g-drift" d="${CLOUD}" fill="${cloudFill}" transform="translate(0 -14)"/>`;
      break;
    }
    case 'snow': {
      const flakes = [[40, 96], [60, 104], [80, 96], [50, 114], [72, 116]]
        .map(([x, y], i) => `<g class="g-flake" style="animation-delay:${i * 0.4}s;transform-origin:${x}px ${y}px"><path d="M${x - 5} ${y} H${x + 5} M${x} ${y - 5} V${y + 5} M${x - 3.5} ${y - 3.5} L${x + 3.5} ${y + 3.5} M${x + 3.5} ${y - 3.5} L${x - 3.5} ${y + 3.5}" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></g>`).join('');
      body = `${flakes}<path class="g-cloud g-drift" d="${CLOUD}" fill="url(#gCloud)" transform="translate(0 -14)"/>`;
      break;
    }
    default:
      body = sun();
  }
  return `<svg class="wglyph ${extraClass}" viewBox="0 0 120 120" aria-hidden="true">${GLYPH_DEFS}${body}</svg>`;
}

// Temperature → color for range bars / accents (cold blue → hot red).
export function tempColor(t) {
  const stops = [[-10, [91, 141, 239]], [5, [86, 182, 230]], [14, [72, 199, 160]], [20, [168, 214, 84]], [27, [255, 176, 59]], [35, [240, 84, 79]]];
  if (t <= stops[0][0]) return `rgb(${stops[0][1].join(',')})`;
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [t0, c0] = stops[i - 1], [t1, c1] = stops[i];
      const k = (t - t0) / (t1 - t0);
      return `rgb(${c0.map((c, j) => Math.round(c + (c1[j] - c) * k)).join(',')})`;
    }
  }
  return `rgb(${stops[stops.length - 1][1].join(',')})`;
}
