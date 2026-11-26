// City skyline scenes for the Today hero.
//
// Two tiers:
//  1. ~100 cities get a hand-drawn silhouette of their best-known landmark
//     (Eiffel Tower, Palace of Culture, Hagia Sophia, ...), matched by coordinates
//     so it works whatever language the geocoder returns the name in.
//  2. Every other place gets a regional scene (European old town, Ottoman mosque,
//     East Asian pagoda, ...) picked from its latitude/longitude.
// Both sit in front of a generic back skyline that is seeded from the city name,
// so two fallback cities in the same region still look a little different.
//
// Drawings live in a 200x150 box with the ground at y=150. An element is either a
// path string (solid), or { d, eo } (with holes), { d, o } (fainter, for depth),
// { s, w } (stroke only), { text, x, y, size, rot }, or { float: [elements], dur, delay }
// for a group that drifts slowly up and down.

// ---------- shape helpers ----------
const R = (x, y, w, h) => `M${x} ${y}h${w}v${h}h${-w}z`;
const P = pts => 'M' + pts.split(',').map(p => p.trim()).join('L') + 'Z';
const C = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`;
const E = (cx, cy, rx, ry) => `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0z`;
const DOME = (cx, y, rx, ry) => `M${cx - rx} ${y}A${rx} ${ry} 0 0 1 ${cx + rx} ${y}z`;
const SPIRE = (cx, y, w, h) => `M${cx - w / 2} ${y}L${cx} ${y - h}L${cx + w / 2} ${y}z`;
// Arched opening whose bottom sits at y (used as a hole inside an { eo } shape).
const ARCH = (x, y, w, h) => `M${x} ${y}v${-(h - w / 2)}a${w / 2} ${w / 2} 0 0 1 ${w} 0v${h - w / 2}z`;
const ONION = (cx, y, w, h) =>
  `M${cx - w / 2} ${y}C${cx - w / 2 - w * 0.25} ${y - h * 0.45} ${cx - w * 0.15} ${y - h * 0.7} ${cx} ${y - h}` +
  `C${cx + w * 0.15} ${y - h * 0.7} ${cx + w / 2 + w * 0.25} ${y - h * 0.45} ${cx + w / 2} ${y}z`;
const range = (from, to, step) => { const out = []; for (let v = from; v <= to; v += step) out.push(v); return out; };

function palm(x, h, lean = 0) {
  const tx = x + lean, ty = 150 - h;
  const leaf = (dx, dy) => `M${tx} ${ty}Q${tx + dx * 0.5} ${ty + dy * 0.5 - 7} ${tx + dx} ${ty + dy}Q${tx + dx * 0.55} ${ty + dy * 0.5 - 1} ${tx} ${ty}z`;
  return [
    { s: `M${x} 150Q${x + lean * 0.2} ${150 - h * 0.55} ${tx} ${ty}`, w: 2.6 },
    [leaf(-20, 8), leaf(-13, 15), leaf(20, 8), leaf(13, 15), leaf(-6, -9), leaf(8, -8)].join(''),
  ];
}

function tree(x, r = 9) {
  return [R(x - 1.2, 150 - r - 4, 2.4, r + 4), C(x, 150 - r * 1.6, r)];
}

function prang(cx, w, h) {
  const b = 150, L = f => cx - w * f, Rr = f => cx + w * f, Y = f => b - h * f;
  return P([
    `${L(0.5)} ${b}`, `${L(0.5)} ${Y(0.1)}`, `${L(0.42)} ${Y(0.1)}`, `${L(0.42)} ${Y(0.2)}`, `${L(0.36)} ${Y(0.22)}`,
    `${L(0.33)} ${Y(0.4)}`, `${L(0.26)} ${Y(0.55)}`, `${L(0.18)} ${Y(0.7)}`, `${L(0.1)} ${Y(0.82)}`, `${L(0.04)} ${Y(0.9)}`,
    `${cx} ${b - h}`,
    `${Rr(0.04)} ${Y(0.9)}`, `${Rr(0.1)} ${Y(0.82)}`, `${Rr(0.18)} ${Y(0.7)}`, `${Rr(0.26)} ${Y(0.55)}`, `${Rr(0.33)} ${Y(0.4)}`,
    `${Rr(0.36)} ${Y(0.22)}`, `${Rr(0.42)} ${Y(0.2)}`, `${Rr(0.42)} ${Y(0.1)}`, `${Rr(0.5)} ${Y(0.1)}`, `${Rr(0.5)} ${b}`,
  ].join(','));
}

function minaret(x, top) {
  return [R(x - 2.2, top, 4.4, 150 - top), R(x - 3.6, top + 20, 7.2, 2.2), R(x - 3.6, top + 42, 7.2, 2.2), SPIRE(x, top, 4.4, 14)];
}

// Hanging rows of windows punched out of a rect (for { eo } shapes).
function windows(x, y, w, h, cols, rows, ww = 3, wh = 4) {
  let d = '';
  const gx = w / cols, gy = h / rows;
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) d += R(x + gx * c + (gx - ww) / 2, y + gy * r + (gy - wh) / 2, ww, wh);
  return d;
}

// Gentle waves across part of the width.
function waves(y, from = 0, to = 200, step = 20) {
  let d = `M${from} ${y}`;
  for (let x = from; x < to; x += step) d += `Q${x + step / 4} ${y - 3} ${x + step / 2} ${y}T${x + step} ${y}`;
  return d;
}

// A small sailboat sitting on the water line y.
function sailboat(x, y, s = 1) {
  return [
    P(`${x - 14 * s} ${y - 4 * s}, ${x + 14 * s} ${y - 4 * s}, ${x + 10 * s} ${y}, ${x - 10 * s} ${y}`),
    R(x - 0.6 * s, y - 30 * s, 1.2 * s, 26 * s),
    P(`${x + 1.5 * s} ${y - 6 * s}, ${x + 1.5 * s} ${y - 29 * s}, ${x + 13 * s} ${y - 6 * s}`),
    P(`${x - 1.5 * s} ${y - 6 * s}, ${x - 1.5 * s} ${y - 24 * s}, ${x - 10 * s} ${y - 6 * s}`),
  ].join('');
}

// Hot-air balloon centred on (cx, cy): envelope with two gore cut-outs, ropes and a basket.
function balloon(cx, cy, r) {
  const env = `M${cx - r} ${cy}A${r} ${r * 1.05} 0 1 1 ${cx + r} ${cy}Q${cx + r * 0.9} ${cy + r * 0.85} ${cx + r * 0.3} ${cy + r * 1.3}L${cx - r * 0.3} ${cy + r * 1.3}Q${cx - r * 0.9} ${cy + r * 0.85} ${cx - r} ${cy}Z`;
  const gore = k => `M${cx + k * r * 0.42} ${cy - r * 0.95}Q${cx + k * r * 0.72} ${cy} ${cx + k * r * 0.2} ${cy + r * 1.22}Q${cx + k * r * 0.6} ${cy} ${cx + k * r * 0.36} ${cy - r * 0.95}Z`;
  return [
    { d: env + gore(-1) + gore(1), eo: true },
    { s: `M${cx - r * 0.3} ${cy + r * 1.3}L${cx - r * 0.2} ${cy + r * 1.62}M${cx + r * 0.3} ${cy + r * 1.3}L${cx + r * 0.2} ${cy + r * 1.62}`, w: Math.max(0.5, r * 0.06) },
    R(cx - r * 0.24, cy + r * 1.6, r * 0.48, r * 0.38),
  ];
}

// Pointed conifer of height h standing at x on ground y.
function conifer(x, y, h) {
  const w = h * 0.42;
  return P(`${x - w / 2} ${y - h * 0.1}, ${x} ${y - h}, ${x + w / 2} ${y - h * 0.1}`) + R(x - h * 0.04, y - h * 0.12, h * 0.08, h * 0.12);
}

// Classic windmill: tapered tower, conical cap and four sails.
function windmill(x, y, h) {
  const w = h * 0.36;
  const hub = [x, y - h * 0.86];
  const sail = a => {
    const c = Math.cos(a), s = Math.sin(a), L = h * 0.62;
    const tx = hub[0] + c * L, ty = hub[1] + s * L;
    const px = -s * h * 0.09, py = c * h * 0.09;
    return `M${hub[0].toFixed(1)} ${hub[1].toFixed(1)}L${tx.toFixed(1)} ${ty.toFixed(1)}L${(tx + px).toFixed(1)} ${(ty + py).toFixed(1)}L${(hub[0] + c * h * 0.18 + px).toFixed(1)} ${(hub[1] + s * h * 0.18 + py).toFixed(1)}Z`;
  };
  return [
    { d: P(`${x - w / 2} ${y}, ${x - w * 0.36} ${y - h * 0.78}, ${x + w * 0.36} ${y - h * 0.78}, ${x + w / 2} ${y}`) + ARCH(x - w * 0.12, y, w * 0.24, h * 0.22), eo: true },
    P(`${x - w * 0.44} ${y - h * 0.78}, ${x} ${y - h * 0.98}, ${x + w * 0.44} ${y - h * 0.78}`),
    [0.35, 1.92, 3.49, 5.06].map(sail).join(''),
  ];
}

// Fairy chimney: a tapering rock cone with a darker cap and a few cave windows.
function chimney(x, h, w) {
  const top = 150 - h;
  return [
    { d: `M${x - w / 2} 150Q${x - w * 0.36} ${150 - h * 0.45} ${x - w * 0.16} ${top + w * 0.12}L${x + w * 0.16} ${top + w * 0.12}Q${x + w * 0.36} ${150 - h * 0.45} ${x + w / 2} 150Z` +
      ARCH(x - w * 0.12, 150 - h * 0.28, w * 0.18, w * 0.22) + R(x + w * 0.06, 150 - h * 0.52, w * 0.1, w * 0.12), eo: true },
    DOME(x, top + w * 0.14, w * 0.3, w * 0.22),
  ];
}

// Gabled town house: body with windows and a pointed roof.
function gableHouse(x, w, h, roof = 0.5) {
  const top = 150 - h;
  return { d: P(`${x} 150, ${x} ${top}, ${x + w / 2} ${top - w * roof}, ${x + w} ${top}, ${x + w} 150`) + windows(x + 2, top + 4, w - 4, h - 12, Math.max(1, Math.round(w / 9)), Math.max(1, Math.round(h / 12)), 2.4, 3.6), eo: true };
}

// Crenellated top for a tower or wall from x to x + w at height y.
function crenels(x, y, w, n) {
  const step = w / (n * 2 - 1);
  return range(0, n - 1, 1).map(i => R(x + i * step * 2, y - step * 0.9, step, step * 0.9)).join('');
}

// Rounded tree crown with a few fruit cut-outs (apricots, olives).
function fruitTree(x, r) {
  const cy = 150 - r * 1.7;
  return [R(x - r * 0.12, cy, r * 0.24, 150 - cy), { d: C(x, cy, r) + C(x - r * 0.4, cy - r * 0.2, r * 0.12) + C(x + r * 0.35, cy + r * 0.15, r * 0.12) + C(x + r * 0.05, cy - r * 0.5, r * 0.11) + C(x - r * 0.2, cy + r * 0.45, r * 0.11), eo: true }];
}

// Scenes shared by more than one point on the map (a city and its best-known spot).
function uzungol() {
  return [
    { d: 'M0 150V54L22 30L44 60L64 112L76 150Z', o: 0.42 },
    { d: 'M124 150L144 92L166 34L184 22L200 40V150Z', o: 0.42 },
    [[10, 70, 26], [24, 56, 22], [36, 86, 24], [52, 110, 20], [150, 84, 24], [164, 60, 26], [178, 44, 22], [188, 74, 26], [172, 104, 20]]
      .map(([x, y, h]) => conifer(x, y, h)).join(''),
    { d: R(30, 112, 16, 12) + R(156, 116, 18, 12), o: 0.8 }, { d: P('28 112, 38 104, 48 112') + P('154 116, 165 108, 176 116'), o: 0.8 },
    { d: R(84, 104, 34, 26) + ARCH(97, 130, 8, 14) + R(88, 110, 4, 6) + R(110, 110, 4, 6), eo: true }, DOME(101, 104, 11, 10), R(100.4, 88, 1.2, 6),
    R(78, 62, 4, 68), R(77, 82, 6, 2), SPIRE(80, 62, 4, 12), R(120, 62, 4, 68), R(119, 82, 6, 2), SPIRE(122, 62, 4, 12),
    { s: 'M18 136H182M8 142H192M0 148H200', w: 0.8, o: 0.7 },
  ];
}

function cappadocia() {
  return [
    { d: 'M0 150V116Q30 104 60 110Q100 96 140 108Q172 100 200 112V150Z', o: 0.3 },
    ...chimney(18, 58, 24), ...chimney(44, 82, 28), ...chimney(70, 52, 22), ...chimney(128, 68, 26), ...chimney(156, 96, 30), ...chimney(184, 60, 24),
    { d: 'M86 150Q96 128 106 126Q116 130 120 150Z', o: 0.85 },
    { float: balloon(96, 46, 15), dur: 8, delay: 0 },
    { float: balloon(150, 18, 10), dur: 7, delay: -2.5 },
    { float: balloon(36, 26, 9), dur: 9, delay: -4 },
    { float: [{ d: balloon(178, 50, 6)[0].d, eo: true, o: 0.7 }, R(176.6, 59.6, 2.9, 2.3)], dur: 6.5, delay: -1 },
    { float: [{ d: balloon(66, 8, 5)[0].d, eo: true, o: 0.6 }, R(64.8, 16, 2.4, 1.9)], dur: 7.5, delay: -3 },
  ];
}

function aegeanCoast() {
  return [
    { d: 'M0 150V96Q30 80 64 88Q84 92 96 106L110 150Z', o: 0.35 },
    ...windmill(18, 92, 34), ...windmill(46, 86, 30), ...windmill(74, 96, 26),
    { d: R(60, 120, 22, 30) + R(84, 112, 18, 38) + R(104, 124, 20, 26) + R(66, 128, 4, 6) + R(90, 120, 4, 6) + R(110, 132, 4, 6) + ARCH(74, 150, 5, 9) + ARCH(93, 150, 5, 9), eo: true },
    { d: R(150, 64, 22, 74) + R(156, 78, 3, 8) + R(164, 78, 3, 8) + R(130, 108, 70, 30), eo: true }, crenels(150, 64, 22, 4), crenels(130, 108, 20, 3) + crenels(178, 108, 22, 3),
    { s: waves(142, 0, 200) + waves(148, 0, 200), w: 1.3 },
    { d: 'M100 138Q120 144 146 138L142 132H104Z', o: 0.95 }, R(122.4, 104, 1.2, 28), P('124 106, 124 130, 140 130'), P('121 110, 121 130, 108 130'),
  ];
}

// İzmir's Clock Tower: four tiers with horseshoe arches, fountains at its feet, palms and the bay.
function izmir() {
  return [
    R(66, 140, 68, 10),
    { d: R(54, 126, 14, 14) + R(132, 126, 14, 14) + ARCH(58, 140, 6, 9) + ARCH(136, 140, 6, 9), eo: true }, DOME(61, 126, 7, 6) + DOME(139, 126, 7, 6),
    { d: R(78, 104, 44, 36) + ARCH(82, 140, 10, 22) + ARCH(95, 140, 10, 26) + ARCH(108, 140, 10, 22), eo: true }, R(74, 100, 52, 4),
    { d: R(83, 76, 34, 24) + ARCH(88, 98, 9, 16) + ARCH(103, 98, 9, 16), eo: true }, R(79, 72, 42, 4),
    { d: R(87, 50, 26, 22) + C(100, 61, 7.5), eo: true }, { s: 'M100 61V56M100 61L104 63', w: 1.1 }, R(83, 46, 34, 4),
    { d: R(91, 32, 18, 14) + ARCH(96, 46, 8, 11), eo: true }, R(88, 29, 24, 3),
    DOME(100, 29, 9, 9), R(99.4, 12, 1.2, 9), C(100, 11, 2),
    ...palm(30, 78, -4), ...palm(166, 82, 5),
    { s: waves(146, 140, 200), w: 1.2 }, { d: R(178, 132, 20, 6) + R(182, 126, 10, 6), o: 0.85 },
  ];
}

// ---------- featured cities ----------
const CITIES = [
  // Europe
  ['paris', 48.8566, 2.3522, () => [
    'M60 150L78 108H74V102H126V108H122L140 150H120Q100 114 80 150Z',
    'M80 102L92 70H88V65H112V70H108L120 102H108Q100 88 92 102Z',
    'M93 65L99 20H101L107 65Z', R(97, 13, 6, 7), R(99.3, 2, 1.4, 11),
    ...tree(36, 10), ...tree(164, 10), ...tree(20, 8), ...tree(182, 8),
  ]],
  ['london', 51.5074, -0.1278, () => [
    { d: R(8, 112, 100, 38) + windows(12, 118, 92, 26, 12, 2, 3, 6), eo: true },
    range(12, 104, 9).map(x => SPIRE(x, 112, 3, 7)).join(''),
    R(14, 70, 20, 42), SPIRE(15.5, 70, 3, 9), SPIRE(32.5, 70, 3, 9), { s: 'M24 70V56', w: 1.2 },
    R(112, 52, 16, 98), { d: R(109, 36, 22, 17) + C(120, 44.5, 6), eo: true }, R(111, 24, 18, 12),
    P('110 24, 120 4, 130 24'), SPIRE(110.5, 24, 2, 7), SPIRE(129.5, 24, 2, 7),
    { s: E(166, 92, 34, 34), w: 3 },
    { s: range(0, 330, 30).map(a => `M166 92L${(166 + 34 * Math.cos(a * Math.PI / 180)).toFixed(1)} ${(92 + 34 * Math.sin(a * Math.PI / 180)).toFixed(1)}`).join(''), w: 0.8 },
    range(0, 345, 22.5).map(a => C(+(166 + 34 * Math.cos(a * Math.PI / 180)).toFixed(1), +(92 + 34 * Math.sin(a * Math.PI / 180)).toFixed(1), 2.3)).join(''),
    { s: 'M166 92L152 150M166 92L180 150', w: 3 },
  ]],
  ['rome', 41.9028, 12.4964, () => [
    { d: 'M14 150V66Q60 52 110 54L118 60L132 58L140 66L160 66Q176 70 186 74V150Z' +
      range(22, 172, 15).map(x => ARCH(x, 94, 9, 14) + ARCH(x, 118, 9, 14) + ARCH(x, 146, 9, 18)).join(''), eo: true },
  ]],
  ['barcelona', 41.3874, 2.1686, () => {
    const tower = (cx, top, w) => `M${cx - w / 2} 150L${cx - w * 0.32} ${top + 18}Q${cx} ${top - 6} ${cx + w * 0.32} ${top + 18}L${cx + w / 2} 150Z` + C(cx, top - 3, 2.5);
    return [
      { d: R(26, 112, 148, 38) + range(34, 166, 12).map(x => ARCH(x, 146, 6, 18)).join(''), eo: true },
      P('70 112, 100 86, 130 112'),
      tower(48, 40, 14), tower(64, 26, 14), tower(136, 26, 14), tower(152, 40, 14), tower(82, 44, 12), tower(118, 44, 12), tower(100, 6, 18),
    ];
  }],
  ['madrid', 40.4168, -3.7038, () => [
    { d: R(16, 82, 168, 68) + ARCH(63, 150, 22, 42) + ARCH(89, 150, 22, 48) + ARCH(115, 150, 22, 42) + R(28, 114, 14, 36) + R(158, 114, 14, 36), eo: true },
    R(12, 76, 176, 7), { d: R(68, 58, 64, 18) + E(100, 67, 7, 5), eo: true }, P('82 58, 90 46, 100 40, 110 46, 118 58'),
    R(28, 66, 6, 10), R(166, 66, 6, 10),
  ]],
  ['amsterdam', 52.3676, 4.9041, () => {
    const house = (x, w, top, bell) => {
      const g = bell
        ? `M${x} ${top + 14}Q${x + w * 0.1} ${top + 4} ${x + w * 0.3} ${top + 3}L${x + w * 0.35} ${top}H${x + w * 0.65}L${x + w * 0.7} ${top + 3}Q${x + w * 0.9} ${top + 4} ${x + w} ${top + 14}Z`
        : P(`${x} ${top + 14}, ${x} ${top + 10}, ${x + w * 0.2} ${top + 10}, ${x + w * 0.2} ${top + 5}, ${x + w * 0.35} ${top + 5}, ${x + w * 0.35} ${top}, ${x + w * 0.65} ${top}, ${x + w * 0.65} ${top + 5}, ${x + w * 0.8} ${top + 5}, ${x + w * 0.8} ${top + 10}, ${x + w} ${top + 10}, ${x + w} ${top + 14}`);
      return { d: g + R(x, top + 14, w, 136 - top) + windows(x, top + 18, w, 132 - top - 22, 2, Math.max(2, Math.round((132 - top) / 16)), w * 0.2, 7), eo: true };
    };
    return [house(18, 26, 40, false), house(44, 22, 28, true), house(66, 28, 46, false), house(94, 22, 32, true), house(116, 26, 22, false), house(142, 24, 42, true), house(166, 22, 34, false),
      { s: 'M10 146Q30 140 50 146T90 146T130 146T170 146T200 146', w: 1.4 }];
  }],
  ['berlin', 52.52, 13.405, () => [
    R(147, 46, 6, 104), C(150, 40, 11), R(148.5, 22, 3, 10), R(149.3, 0, 1.4, 24),
    { d: R(18, 96, 112, 54) + R(26, 104, 12, 46) + R(46, 104, 12, 46) + R(66, 100, 16, 50) + R(90, 104, 12, 46) + R(110, 104, 12, 46), eo: true },
    R(14, 86, 120, 10), R(44, 74, 60, 12), P('60 74, 64 62, 71 58, 77 61, 82 56, 88 62, 88 74'),
  ]],
  // Palace of Culture and Science, drawn from a straight-on reference photo
  // (1348x2000 px): coordinates below are photo pixels, mapped into the
  // 200x150 box with the spire tip at the top and the ground at the bottom.
  // Tall slim main shaft, two lower flanking towers in front of it, the
  // columned central entrance, long low wings; small pinnacles (not big
  // turrets) on the cornices; arched belvedere, clock stage and a long spire.
  ['warsaw', 52.2297, 21.0122, () => {
    const k = 150 / 1860;
    const X = px => +(100 + (px - 683) * k).toFixed(2);
    const Y = py => +(150 - (1910 - py) * k).toFixed(2);
    const box = (x1, y1, x2, y2) => R(X(x1), Y(y1), +((x2 - x1) * k).toFixed(2), +((y2 - y1) * k).toFixed(2));
    const grid = (x1, x2, xs, y1, y2, ys, w, h) => {
      let d = '';
      for (let x = x1; x <= x2; x += xs) for (let y = y1; y <= y2; y += ys) d += box(x, y, x + w, y + h);
      return d;
    };
    const pin = (px, base, h, w = 12) => SPIRE(X(px), Y(base), +(w * k).toFixed(2), +(h * k).toFixed(2));
    const arch = (x1, x2, y1, y2) => ARCH(X(x1), Y(y2), +((x2 - x1) * k).toFixed(2), +((y2 - y1) * k).toFixed(2));
    return [
      // Warm light behind the palace: invisible by day, at night it shines through every window and the clock.
      { d: box(492, 745, 873, 1640) + box(340, 1245, 1022, 1640) + box(510, 1450, 845, 1910) + box(-255, 1665, 465, 1910) + box(900, 1665, 1621, 1910) + box(608, 530, 758, 688) + box(635, 405, 732, 520), cls: 'wars-glow' },
      // wings (extend past the photo's crop so the base reads as wide and low)
      { d: box(-260, 1660, 465, 1910) + box(900, 1660, 1626, 1910) + box(-270, 1640, 470, 1662) + box(895, 1640, 1636, 1662) +
          grid(-200, 400, 110, 1700, 1800, 80, 34, 46) + grid(960, 1560, 110, 1700, 1800, 80, 34, 46), o: 0.9, eo: true },
      // main shaft (behind the flanking towers), with its window grid and tall arches up top
      { d: box(487, 740, 878, 1640) + box(480, 712, 885, 742) +
          grid(592, 770, 30, 940, 1600, 42, 13, 22) + grid(520, 540, 30, 940, 1600, 42, 12, 22) + grid(822, 842, 30, 940, 1600, 42, 12, 22) +
          arch(518, 548, 800, 870) + arch(815, 845, 800, 870) + grid(588, 770, 30, 790, 790, 1, 14, 60), o: 0.82, eo: true },
      // crown above the shaft: attic, pinnacles, small ornamental gables
      box(495, 688, 870, 712),
      pin(502, 688, 55) + pin(578, 688, 50) + pin(788, 688, 50) + pin(862, 688, 55) + pin(640, 688, 26, 10) + pin(726, 688, 26, 10),
      'M' + X(520) + ' ' + Y(688) + 'Q' + X(540) + ' ' + Y(650) + ' ' + X(560) + ' ' + Y(688) + 'Z' + 'M' + X(806) + ' ' + Y(688) + 'Q' + X(826) + ' ' + Y(650) + ' ' + X(846) + ' ' + Y(688) + 'Z',
      // belvedere with four arched openings, then the clock stage
      { d: box(603, 525, 763, 690) + arch(620, 642, 575, 628) + arch(655, 677, 575, 628) + arch(690, 712, 575, 628) + arch(724, 746, 575, 628), eo: true },
      box(596, 520, 770, 532),
      pin(610, 525, 40, 10) + pin(756, 525, 40, 10),
      { d: box(630, 400, 737, 522) + C(X(683), Y(497), +(26 * k).toFixed(2)), eo: true },
      box(624, 392, 743, 404),
      // lantern and the long spire
      'M' + X(660) + ' ' + Y(392) + 'C' + X(656) + ' ' + Y(360) + ' ' + X(668) + ' ' + Y(330) + ' ' + X(683) + ' ' + Y(318) + 'C' + X(698) + ' ' + Y(330) + ' ' + X(710) + ' ' + Y(360) + ' ' + X(706) + ' ' + Y(392) + 'Z',
      P(`${X(673)} ${Y(320)}, ${X(683)} ${Y(50)}, ${X(693)} ${Y(320)}`),
      // flanking towers in front of the shaft, each with an ornate attic
      { d: box(335, 1240, 552, 1640) + box(813, 1240, 1027, 1640) + box(328, 1232, 559, 1246) + box(806, 1232, 1034, 1246) +
          grid(385, 470, 42, 1385, 1600, 50, 16, 26) + grid(878, 963, 42, 1385, 1600, 50, 16, 26) +
          grid(388, 468, 40, 1285, 1285, 1, 16, 44) + grid(880, 960, 40, 1285, 1285, 1, 16, 44), eo: true },
      [343, 380, 470, 512, 545, 821, 856, 945, 985, 1020].map(px => pin(px, 1232, 50, 10)).join(''),
      'M' + X(410) + ' ' + Y(1232) + 'Q' + X(437) + ' ' + Y(1176) + ' ' + X(464) + ' ' + Y(1232) + 'Z' + 'M' + X(897) + ' ' + Y(1232) + 'Q' + X(922) + ' ' + Y(1176) + ' ' + X(948) + ' ' + Y(1232) + 'Z',
      // central block with its decorated attic and cornice, then the columned portico
      { d: box(505, 1560, 850, 1910) + box(495, 1535, 858, 1562) + box(515, 1445, 840, 1537) +
          grid(605, 740, 64, 1590, 1590, 1, 28, 32) + grid(470, 470, 1, 1600, 1840, 60, 14, 22) + grid(866, 866, 1, 1600, 1840, 60, 14, 22) +
          box(560, 1705, 795, 1900), eo: true },
      box(555, 1648, 800, 1706),
      [570, 633, 697, 760].map(px => box(px, 1706, px + 25, 1900)).join(''),
      'M' + X(640) + ' ' + Y(1445) + 'Q' + X(678) + ' ' + Y(1400) + ' ' + X(716) + ' ' + Y(1445) + 'Z',
      // The crown (clock stage, lantern, spire) again on top: lit in slowly changing colors at night, like the real one.
      { d: box(630, 400, 737, 522) + C(X(683), Y(497), +(26 * k).toFixed(2)) + box(624, 392, 743, 404) +
          'M' + X(660) + ' ' + Y(392) + 'C' + X(656) + ' ' + Y(360) + ' ' + X(668) + ' ' + Y(330) + ' ' + X(683) + ' ' + Y(318) + 'C' + X(698) + ' ' + Y(330) + ' ' + X(710) + ' ' + Y(360) + ' ' + X(706) + ' ' + Y(392) + 'Z' +
          P(`${X(673)} ${Y(320)}, ${X(683)} ${Y(50)}, ${X(693)} ${Y(320)}`), cls: 'wars-crown', eo: true },
    ];
  }],
  ['prague', 50.0755, 14.4378, () => [
    { d: R(0, 124, 64, 26) + ARCH(4, 150, 14, 18) + ARCH(25, 150, 14, 18) + ARCH(46, 150, 14, 18), eo: true },
    R(52, 92, 14, 32), P('50 92, 59 72, 68 92'),
    { d: R(70, 52, 20, 98) + R(112, 52, 20, 98) + ARCH(76, 90, 8, 16) + ARCH(118, 90, 8, 16) + ARCH(76, 120, 8, 16) + ARCH(118, 120, 8, 16), eo: true },
    P('68 52, 80 12, 92 52'), P('110 52, 122 12, 134 52'),
    [70, 90, 112, 132].map(x => SPIRE(x, 52, 4, 16)).join('') + [74, 86, 116, 128].map(x => SPIRE(x, 40, 3, 13)).join(''),
    R(90, 96, 22, 54), P('90 96, 101 76, 112 96'),
  ]],
  ['vienna', 48.2082, 16.3738, () => [
    { s: E(62, 82, 46, 46), w: 3 }, { s: E(62, 82, 40, 40), w: 1.2 },
    { s: range(0, 330, 30).map(a => `M62 82L${(62 + 40 * Math.cos(a * Math.PI / 180)).toFixed(1)} ${(82 + 40 * Math.sin(a * Math.PI / 180)).toFixed(1)}`).join(''), w: 0.8 },
    range(0, 336, 24).map(a => R(+(62 + 46 * Math.cos(a * Math.PI / 180) - 3).toFixed(1), +(82 + 46 * Math.sin(a * Math.PI / 180)).toFixed(1), 6, 5)).join(''),
    { s: 'M62 82L40 150M62 82L84 150M46 128H78', w: 3 },
    P('138 150, 138 72, 144 62, 150 4, 156 62, 162 72, 162 150'),
    { d: R(162, 98, 36, 52) + range(166, 192, 7).map(x => ARCH(x, 140, 4, 14)).join(''), eo: true }, P('160 98, 180 72, 200 98'),
  ]],
  ['budapest', 47.4979, 19.0402, () => [
    { d: R(6, 114, 188, 36) + range(10, 186, 7).map(x => ARCH(x, 142, 3.5, 16)).join(''), eo: true },
    R(84, 86, 32, 28), DOME(100, 86, 18, 22), P('97 66, 100 30, 103 66'),
    SPIRE(76, 114, 6, 42) + SPIRE(124, 114, 6, 42),
    range(12, 70, 9).concat(range(130, 188, 9)).map(x => SPIRE(x, 114, 4, 12)).join(''),
    R(30, 98, 10, 16), SPIRE(35, 98, 9, 18), R(160, 98, 10, 16), SPIRE(165, 98, 9, 18),
  ]],
  ['athens', 37.9838, 23.7275, () => [
    { d: 'M0 150Q22 118 50 112H150Q178 114 200 150Z', o: 0.55 },
    R(48, 104, 104, 8), R(52, 100, 96, 4),
    range(56, 144, 12.5).map(x => R(x, 70, 6, 30)).join(''),
    R(50, 62, 100, 8), P('50 62, 100 48, 150 62'),
  ]],
  ['lisbon', 38.7223, -9.1393, () => [
    { d: R(54, 108, 92, 38) + range(62, 136, 12).map(x => ARCH(x, 132, 6, 12)).join(''), eo: true },
    range(56, 140, 10).map(x => R(x, 102, 6, 6)).join(''),
    { d: R(76, 40, 48, 68) + ARCH(92, 82, 16, 24) + ARCH(94, 58, 12, 14), eo: true },
    range(78, 118, 10).map(x => R(x, 34, 6, 6)).join(''),
    R(48, 92, 8, 16), DOME(52, 92, 4, 5), R(144, 92, 8, 16), DOME(148, 92, 4, 5),
    R(72, 26, 8, 14), DOME(76, 26, 4, 5), R(120, 26, 8, 14), DOME(124, 26, 4, 5),
    { s: 'M30 148H170M50 144H80M120 144H150', w: 1.4 },
  ]],
  ['moscow', 55.7558, 37.6173, () => {
    const tower = (cx, top, w, ow, oh) => R(cx - w / 2, top, w, 112 - top) + ONION(cx, top, ow, oh) + R(cx - 0.6, top - oh - 6, 1.2, 7);
    return [
      { d: R(26, 112, 148, 38) + range(34, 166, 10).map(x => ARCH(x, 146, 5, 14)).join(''), eo: true },
      tower(44, 82, 12, 20, 22) + tower(156, 82, 12, 20, 22),
      tower(68, 72, 14, 24, 28) + tower(132, 72, 14, 24, 28),
      tower(84, 92, 10, 16, 18) + tower(116, 92, 10, 16, 18),
      R(92, 56, 16, 56) + P('90 56, 100 16, 110 56') + ONION(100, 18, 8, 12) + R(99.4, 0, 1.2, 8),
    ];
  }],
  ['milan', 45.4642, 9.19, () => {
    const roofY = x => x < 100 ? 96 - (x - 30) * 32 / 70 : 64 + (x - 100) * 32 / 70;
    return [
      { d: 'M80 150V40H120V150Z', o: 0.5 }, { d: SPIRE(100, 72, 8, 66) + C(100, 4, 2.4), o: 0.9 },
      range(40, 160, 6).map(x => SPIRE(x, roofY(x) - 2, 2, 10 + (x % 12))).join(''),
      { d: P('30 150, 30 96, 100 64, 170 96, 170 150') + ARCH(92, 150, 16, 32) + ARCH(62, 150, 10, 22) + ARCH(128, 150, 10, 22) + ARCH(46, 132, 6, 12) + ARCH(148, 132, 6, 12) + C(100, 96, 7), eo: true },
      [30, 46, 62, 78, 122, 138, 154, 170].map(x => SPIRE(x, roofY(x), 4, 24)).join(''),
    ];
  }],
  ['munich', 48.1351, 11.582, () => [
    { d: R(40, 96, 120, 54) + P('40 96, 100 62, 160 96'), o: 0.6 },
    { d: R(66, 44, 24, 106) + R(110, 44, 24, 106) + ARCH(73, 76, 10, 16) + ARCH(117, 76, 10, 16) + ARCH(73, 110, 10, 18) + ARCH(117, 110, 10, 18), eo: true },
    DOME(78, 44, 12, 16) + R(76, 20, 4, 9) + DOME(78, 20, 3, 4), DOME(122, 44, 12, 16) + R(120, 20, 4, 9) + DOME(122, 20, 3, 4),
    { d: R(90, 92, 20, 58) + ARCH(95, 150, 10, 22), eo: true },
  ]],
  ['brussels', 50.8503, 4.3517, () => {
    const pts = [[100, 22], [138, 44], [138, 88], [100, 110], [62, 88], [62, 44]];
    const edges = pts.map((p, i) => `M${p[0]} ${p[1]}L${pts[(i + 1) % 6][0]} ${pts[(i + 1) % 6][1]}`).join('') + pts.map(p => `M100 66L${p[0]} ${p[1]}`).join('');
    return [
      { s: 'M62 88L48 150M138 88L152 150M100 110V150', w: 3 },
      { s: edges, w: 3.5 },
      [...pts, [100, 66]].map(([x, y]) => C(x, y, 9)).join(''),
    ];
  }],
  ['copenhagen', 55.6761, 12.5683, () => {
    const house = (x, w, top) => ({ d: P(`${x} ${top + 12}, ${x + w / 2} ${top}, ${x + w} ${top + 12}`) + R(x, top + 12, w, 138 - top) + windows(x, top + 16, w, 132 - top - 18, 3, Math.max(2, Math.round((132 - top) / 16)), 3, 6), eo: true });
    return [
      house(78, 22, 70), house(100, 20, 62), house(120, 24, 74), house(144, 20, 58), house(164, 26, 68),
      'M4 136H70L62 146H12Z', { s: 'M22 136V82M42 136V94M22 84L42 96M22 90L4 136M42 98L66 136', w: 1.6 }, P('22 82, 34 86, 22 90'),
      { s: 'M0 148Q20 144 40 148T80 148T120 148T160 148T200 148', w: 1.4 },
    ];
  }],
  ['stockholm', 59.3293, 18.0686, () => [
    { d: R(30, 96, 98, 50) + range(36, 120, 12).map(x => ARCH(x, 146, 7, 16)).join('') + windows(32, 100, 94, 16, 9, 1, 3, 6), eo: true },
    R(28, 92, 102, 4), R(30, 78, 8, 14), SPIRE(34, 78, 8, 12),
    { d: R(128, 34, 26, 112) + windows(130, 44, 22, 90, 3, 6, 3, 6), eo: true },
    R(132, 20, 18, 14), R(137, 10, 8, 10), DOME(141, 10, 4, 4), C(137, 4, 1.5) + C(141, 2, 1.5) + C(145, 4, 1.5),
    { s: 'M0 148H200', w: 2 },
  ]],
  ['dublin', 53.3498, -6.2603, () => [
    { d: R(0, 98, 74, 52) + windows(2, 102, 70, 40, 7, 3, 4, 7), o: 0.45, eo: true },
    { d: R(120, 104, 40, 46) + windows(122, 108, 36, 36, 4, 3, 4, 7), o: 0.45, eo: true },
    P('165 150, 170 2, 175 150'),
    { s: 'M8 132Q84 102 160 132M8 128Q84 98 160 128', w: 2.6 },
    { s: range(20, 150, 10).map(x => { const t = (x - 8) / 152; const y = (1 - t) ** 2 * 128 + 2 * t * (1 - t) * 98 + t * t * 128; return `M${x} ${y.toFixed(1)}V${(y + 4).toFixed(1)}`; }).join(''), w: 1.2 },
    { s: 'M40 115V105M84 113V100M128 115V105', w: 1.4 }, C(40, 104, 2) + C(84, 99, 2) + C(128, 104, 2),
    { s: 'M0 148H200', w: 1.5 },
  ]],
  ['krakow', 50.0647, 19.945, () => [
    { d: R(4, 112, 62, 38) + range(8, 58, 10).map(x => ARCH(x, 150, 7, 20)).join(''), eo: true }, range(5, 63, 6).map(x => R(x, 106, 3, 6)).join(''),
    { d: R(72, 46, 20, 104) + ARCH(78, 80, 8, 16) + ARCH(78, 110, 8, 16), eo: true }, P('70 46, 82 6, 94 46'),
    SPIRE(70, 46, 3, 11) + SPIRE(94, 46, 3, 11) + SPIRE(76, 40, 2.5, 9) + SPIRE(88, 40, 2.5, 9), C(82, 9, 2.2),
    { d: R(112, 64, 18, 86) + ARCH(117, 96, 8, 14), eo: true }, DOME(121, 64, 9, 10), R(119.5, 46, 3, 9), DOME(121, 46, 3, 4),
    R(92, 92, 20, 58), P('92 92, 102 76, 112 92'),
    ...tree(150, 10), ...tree(176, 12),
  ]],
  // Istanbul: the Blue Mosque (central dome, cascading semi-domes, four minarets).
  // The Bosphorus Bridge, the water, a ferry and the seagulls are drawn across the
  // whole hero width by istanbulLayers() (see renderLandmark).
  ['istanbul', 41.0082, 28.9784, () => [
    { d: R(36, 112, 128, 38) + range(42, 156, 10).map(x => ARCH(x, 132, 5, 12)).join(''), eo: true },
    R(68, 98, 64, 14) + DOME(100, 98, 30, 26) + DOME(70, 104, 15, 10) + DOME(130, 104, 15, 10) + DOME(52, 112, 13, 8) + DOME(148, 112, 13, 8),
    R(99.4, 60, 1.2, 12), C(100, 58.5, 1.9),
    ...minaret(30, 36), ...minaret(50, 50), ...minaret(150, 50), ...minaret(170, 36),
    // Minaret balcony lamps (kandil): only lit at night.
    { d: [[30, 36], [50, 50], [150, 50], [170, 36]].map(([x, t]) => C(x - 3, t + 19, 1.3) + C(x + 3, t + 19, 1.3) + C(x - 3, t + 41, 1.3) + C(x + 3, t + 41, 1.3)).join(''), cls: 'ist-lamp' },
  ]],
  ['ankara', 39.9334, 32.8597, () => [
    { d: R(8, 136, 184, 14) + R(8, 140, 184, 1.2) + R(8, 145, 184, 1.2), eo: true },
    { d: R(34, 74, 132, 62) + range(40, 160, 8).map(x => R(x, 82, 4, 50)).join(''), eo: true },
    R(28, 64, 144, 10), R(40, 58, 120, 6),
    { s: 'M186 136V36', w: 1.4 }, P('186 36, 200 42, 186 48'),
  ]],
  ['izmir', 38.4192, 27.1287, izmir],
  // Uludağ behind, the cable car climbing to it, and the Grand Mosque's rows of small domes.
  ['bursa', 40.1885, 29.061, () => [
    { d: 'M0 150V112L36 92L62 76L84 84L110 54L132 68L152 60L200 104V150Z', o: 0.32 },
    { d: 'M102 62L110 54L118 61L112 64L107 61Z M146 64L152 60L158 65L153 66Z', o: 0.55 },
    { s: 'M0 104L200 40', w: 0.8, o: 0.75 },
    { s: 'M44 90V94M150 56V60', w: 0.8 }, R(40, 94, 8, 6), R(146, 60, 8, 6),
    { d: R(30, 112, 140, 38) + range(38, 160, 12).map(x => ARCH(x, 146, 6, 20)).join(''), eo: true },
    R(28, 108, 144, 4),
    [44, 72, 100, 128, 156].map(x => DOME(x, 108, 12, 11)).join(''),
    [44, 72, 100, 128, 156].map(x => R(x - 0.5, 91, 1, 6) + C(x, 90, 1.4)).join(''),
    ...minaret(20, 44), ...minaret(180, 44),
  ]],
  // Hadrian's Gate, the Beydağları behind, palms and a sailboat on the bay.
  ['antalya', 36.8969, 30.7133, () => [
    { d: 'M0 150V104L26 84L48 96L76 72L104 90L132 78L160 94L184 82L200 90V150Z', o: 0.3 },
    { d: R(30, 64, 16, 86) + range(33, 41, 4).map(x => R(x, 72, 2, 6)).join('') + R(118, 64, 16, 86), eo: true },
    crenels(30, 64, 16, 3) + crenels(118, 64, 16, 3),
    { d: R(44, 92, 76, 58) + ARCH(49, 150, 18, 38) + ARCH(73, 150, 18, 38) + ARCH(97, 150, 18, 38), eo: true },
    R(40, 84, 84, 8) + R(44, 80, 76, 4),
    [46, 70, 94, 118].map(x => R(x - 1.5, 92, 3, 58)).join(''),
    ...palm(150, 84, 4), ...palm(14, 66, -3),
    { s: waves(140, 136, 200) + waves(146, 128, 200), w: 1.3 },
    sailboat(176, 136, 0.8),
  ]],
  // The Red Tower by the harbour, castle walls climbing the hill, a beach umbrella.
  ['alanya', 36.5438, 31.9998, () => [
    { d: 'M86 150Q112 92 150 66Q172 54 200 62V150Z', o: 0.4 },
    { s: 'M98 136L118 106L136 86L160 70L186 64', w: 2.6, o: 0.8 },
    { d: R(114, 98, 8, 10) + R(132, 78, 8, 10) + R(156, 62, 8, 10) + R(182, 56, 8, 10), o: 0.8 },
    { d: P('44 150, 44 74, 52 66, 82 66, 90 74, 90 150') + R(56, 84, 3, 9) + R(75, 84, 3, 9) + R(65, 104, 4, 12) + ARCH(60, 150, 14, 20), eo: true },
    crenels(44, 66, 46, 6),
    { s: 'M10 124V146', w: 1.4 }, 'M-2 126Q10 110 22 126Q10 122 -2 126Z',
    { s: waves(140, 0, 200) + waves(146, 0, 200), w: 1.3 },
    sailboat(158, 136, 0.9),
  ]],
  // Uzungöl: steep green slopes full of spruces, wooden houses and the lakeside mosque.
  ['trabzon', 41.0027, 39.7168, uzungol],
  ['trabzon', 40.6189, 40.2906, uzungol],
  // Cappadocia: fairy chimneys and hot-air balloons drifting over them.
  ['nevsehir', 38.6244, 34.7239, cappadocia],
  ['nevsehir', 38.6431, 34.8289, cappadocia],
  ['nevsehir', 38.6305, 34.9118, cappadocia],
  // Mardin: honey-stone houses stacked up the hill, ribbed domes and the old minaret.
  ['mardin', 37.3212, 40.7245, () => [
    { d: 'M0 150V96Q60 70 120 66Q170 64 200 78V150Z', o: 0.3 },
    { d: R(8, 122, 44, 28) + R(54, 116, 40, 34) + R(96, 124, 42, 26) + R(140, 118, 52, 32) +
      range(12, 48, 9).map(x => ARCH(x, 146, 4, 10)).join('') + range(58, 90, 9).map(x => ARCH(x, 140, 4, 10)).join('') +
      range(100, 134, 9).map(x => ARCH(x, 146, 4, 9)).join('') + range(144, 188, 9).map(x => ARCH(x, 142, 4, 10)).join(''), eo: true },
    { d: R(20, 98, 40, 22) + R(62, 94, 46, 20) + R(112, 100, 36, 22) + range(26, 54, 9).map(x => ARCH(x, 116, 4, 9)).join('') + range(68, 102, 9).map(x => ARCH(x, 110, 4, 9)).join('') + range(118, 142, 9).map(x => ARCH(x, 118, 4, 9)).join(''), eo: true },
    { d: R(36, 80, 34, 16) + R(74, 76, 30, 16) + ARCH(44, 94, 5, 9) + ARCH(56, 94, 5, 9) + ARCH(84, 90, 5, 9), eo: true },
    { d: DOME(54, 80, 11, 11) + DOME(88, 76, 10, 10), eo: true }, { s: 'M50 70V80M58 70V80M85 67V76M91 67V76', w: 0.7, o: 0.5 },
    { d: R(158, 46, 12, 72) + R(156, 70, 16, 3) + R(161, 54, 2, 8) + R(165, 54, 2, 8), eo: true }, R(159, 38, 10, 8), DOME(164, 38, 6, 7), R(163.4, 26, 1.2, 6),
  ]],
  // Bodrum and the Muğla coast: windmills on the hill, white cube houses, the castle and a gulet.
  ['mugla', 37.2153, 28.3636, aegeanCoast],
  ['mugla', 37.0344, 27.4305, aegeanCoast],
  ['mugla', 36.855, 28.2707, aegeanCoast],
  ['mugla', 36.6216, 29.1164, aegeanCoast],
  // Konya: the green fluted dome of the Mevlana Museum and two whirling dervishes.
  ['konya', 37.8746, 32.4932, () => {
    const dervish = (x, s) => [
      `M${x - 17 * s} 150Q${x - 12 * s} ${150 - 26 * s} ${x - 4 * s} ${150 - 34 * s}L${x + 4 * s} ${150 - 34 * s}Q${x + 12 * s} ${150 - 26 * s} ${x + 17 * s} 150Z`,
      R(x - 4 * s, 150 - 50 * s, 8 * s, 17 * s), C(x, 150 - 54 * s, 4 * s), R(x - 3 * s, 150 - 70 * s, 6 * s, 13 * s),
      { s: `M${x - 3 * s} ${150 - 46 * s}L${x - 14 * s} ${150 - 60 * s}M${x + 3 * s} ${150 - 46 * s}L${x + 13 * s} ${150 - 40 * s}`, w: 2.6 * s },
    ];
    return [
      { d: R(56, 104, 90, 46) + range(62, 138, 12).map(x => ARCH(x, 146, 7, 18)).join(''), eo: true },
      DOME(74, 104, 12, 10) + DOME(128, 104, 12, 10),
      { d: R(88, 62, 26, 42) + range(92, 110, 5).map(x => R(x, 68, 1.8, 30)).join(''), eo: true },
      { d: P('86 64, 101 14, 116 64') + range(92, 112, 5).map(x => P(`${x} 60, ${x + 1.5} 30, ${x + 2.2} 60`)).join(''), eo: true },
      R(100.4, 4, 1.2, 12), C(101, 4, 1.8),
      ...minaret(156, 50),
      ...dervish(24, 1), ...dervish(184, 0.8),
    ];
  }],
  // Malatya: apricot orchards, the clock tower and the mountains of the Euphrates basin.
  ['malatya', 38.3552, 38.3095, () => [
    { d: 'M0 150V104L34 80L58 94L90 70L124 90L156 72L200 98V150Z', o: 0.3 },
    { d: R(88, 56, 24, 94) + C(100, 72, 6) + ARCH(95, 150, 10, 18) + R(93, 92, 4, 10) + R(103, 92, 4, 10), eo: true },
    R(85, 52, 30, 4), P('86 52, 100 24, 114 52'), R(99.4, 14, 1.2, 10),
    ...fruitTree(24, 15), ...fruitTree(56, 12), ...fruitTree(142, 13), ...fruitTree(176, 16),
  ]],
  // Sivas: the Double Minaret Madrasa, a monumental portal topped by two fluted minarets.
  ['sivas', 39.7477, 37.0179, () => [
    { d: R(12, 110, 54, 40) + R(134, 110, 54, 40), o: 0.55 },
    { d: R(58, 70, 84, 80) + 'M80 150V104Q80 84 100 74Q120 84 120 104V150Z' + range(84, 112, 7).map(x => ARCH(x, 108, 4, 8)).join('') + R(64, 80, 8, 60) + R(128, 80, 8, 60), eo: true },
    R(54, 66, 92, 5),
    { d: R(62, 16, 12, 50) + range(64, 72, 3).map(x => R(x, 22, 1.2, 38)).join('') + R(126, 16, 12, 50) + range(128, 136, 3).map(x => R(x, 22, 1.2, 38)).join(''), eo: true },
    R(60, 30, 16, 3) + R(124, 30, 16, 3), SPIRE(68, 16, 12, 12) + SPIRE(132, 16, 12, 12),
  ]],
  // Çorum: the Lion Gate of Hattusa, two stone lions guarding the Hittite capital.
  ['corum', 40.5506, 34.9556, () => {
    const lion = (x, dir) => [{
      d: `M${x - dir * 8} 150V100Q${x - dir * 8} 84 ${x + dir * 4} 80Q${x + dir * 16} 78 ${x + dir * 20} 88L${x + dir * 22} 96L${x + dir * 16} 98L${x + dir * 18} 104Q${x + dir * 10} 110 ${x + dir * 6} 118L${x + dir * 6} 150Z` +
        C(x + dir * 12, 88, 1.6) + E(x - dir * 1, 96, 1.3, 7) + E(x + dir * 4, 108, 1.1, 5),
      eo: true,
    }];
    return [
      { d: 'M0 150V112Q40 104 70 110L80 104L130 104L140 110Q170 104 200 112V150Z', o: 0.35 },
      { d: R(30, 64, 140, 86) + 'M70 150V106Q70 66 100 60Q130 66 130 106V150Z' + range(34, 166, 22).map(x => R(x, 84, 20, 0.8)).join('') + range(34, 166, 26).map(x => R(x, 112, 24, 0.8)).join(''), eo: true, o: 0.55 },
      ...lion(70, 1), ...lion(130, -1),
      { d: R(30, 58, 140, 6), o: 0.85 },
    ];
  }],
  // Eskişehir: Odunpazarı's bay-windowed Ottoman houses, the stacked-timber museum, the tram.
  ['eskisehir', 39.7767, 30.5206, () => {
    const house = (x, w, h) => ({ d: R(x, 150 - h * 0.45, w, h * 0.45) + R(x - 4, 150 - h, w + 8, h * 0.56) + windows(x - 2, 150 - h + 4, w + 4, h * 0.42, Math.round(w / 7), 2, 3, 5) + ARCH(x + w / 2 - 3, 150, 6, 12), eo: true });
    return [
      house(12, 26, 66), P('4 84, 25 70, 46 84'),
      house(54, 24, 56), P('46 94, 66 82, 86 94'),
      { d: R(112, 120, 30, 30) + R(120, 96, 38, 26) + R(108, 76, 30, 22) + R(130, 58, 26, 20) + R(150, 108, 30, 42) + range(114, 176, 8).map(x => R(x, 124, 1, 22)).join(''), eo: true },
      { d: R(0, 138, 70, 10) + windows(4, 140, 62, 6, 6, 1, 6, 4), eo: true }, { s: 'M30 138L36 130H48M36 130L42 138', w: 1 },
      { s: 'M0 149H200', w: 1.2 },
    ];
  }],
  // Middle East & Africa
  ['dubai', 25.2048, 55.2708, () => [
    { d: R(98, 92, 12, 58) + R(112, 102, 10, 48) + R(20, 100, 14, 50) + R(36, 112, 12, 38), o: 0.5 },
    P('58 150, 58 112, 62 112, 62 84, 65 84, 65 58, 67 58, 67 36, 69 36, 69.5 0, 70.5 0, 71 36, 73 36, 73 58, 75 58, 75 84, 78 84, 78 112, 82 112, 82 150'),
    { d: 'M136 146V38L140 32Q176 66 178 146Z' + 'M142 140V50Q166 78 170 140Z', eo: true },
    { s: 'M136 38V18', w: 2 }, E(172, 96, 7, 2), R(124, 146, 64, 4),
  ]],
  ['cairo', 30.0444, 31.2357, () => [
    { d: P('20 150, 52 104, 84 150') + P('138 150, 170 110, 200 150'), o: 0.65 },
    P('60 150, 112 70, 164 150'),
    'M10 150V138H26L30 128Q34 122 40 124L42 132H62V150Z',
    ...palm(186, 60, -4),
  ]],
  ['marrakech', 31.6295, -7.9811, () => [
    { d: R(0, 136, 200, 14), o: 0.7 }, range(2, 196, 8).map(x => R(x, 131, 4, 5)).join(''),
    { d: R(88, 36, 28, 100) + ARCH(96, 74, 12, 16) + ARCH(96, 108, 12, 16) + R(92, 44, 4, 8) + R(108, 44, 4, 8), eo: true },
    range(88, 112, 6).map(x => R(x, 30, 4, 6)).join(''),
    R(95, 18, 14, 12), DOME(102, 18, 7, 6), R(101.5, 2, 1, 10), C(102, 9, 1.6) + C(102, 5, 1.3),
    ...palm(40, 70, -6), ...palm(62, 52, 4), ...palm(148, 66, 6), ...palm(172, 50, -4),
  ]],
  ['capetown', -33.9249, 18.4241, () => [
    { d: 'M0 150V96L16 82L34 56L44 50H140L156 60L168 72L178 62L186 50L194 62L200 72V150Z', o: 0.55 },
    { d: R(20, 120, 14, 30) + R(36, 110, 12, 40) + R(50, 124, 18, 26) + R(70, 114, 10, 36) + R(82, 126, 22, 24) + R(106, 106, 12, 44) + R(120, 120, 16, 30) + R(138, 128, 22, 22) +
      windows(36, 114, 12, 30, 2, 4, 2, 4) + windows(106, 110, 12, 34, 2, 5, 2, 4), eo: true },
  ]],
  ['riyadh', 24.7136, 46.6753, () => [
    { d: R(20, 104, 16, 46) + R(40, 114, 14, 36) + R(150, 100, 16, 50) + R(170, 112, 14, 38), o: 0.5 },
    { d: 'M78 150V60Q78 26 100 14Q122 26 122 60V150Z' + 'M86 52Q86 30 100 22Q114 30 114 52Z', eo: true },
    R(124, 70, 14, 80), DOME(131, 70, 7, 18), R(130.4, 40, 1.2, 14),
  ]],
  // Asia
  ['tokyo', 35.6762, 139.6503, () => [
    { d: 'M0 150L66 74Q100 56 134 74L200 150Z', o: 0.35 },
    { d: 'M66 74Q100 56 134 74L122 86L110 80L100 88L90 80L78 86Z', o: 0.75 },
    'M118 150L132 104H130V98H150V104H148L162 150H152Q140 128 128 150Z',
    'M133 98L137 60H134V54H146V60H143L147 98Z', 'M138 54L139.4 24H140.6L142 54Z', R(139.5, 4, 1, 21),
    { d: R(10, 116, 16, 34) + R(28, 126, 20, 24) + R(170, 120, 14, 30) + R(186, 110, 14, 40), o: 0.8 },
  ]],
  ['beijing', 39.9042, 116.4074, () => [
    R(30, 140, 140, 10), R(42, 131, 116, 9), R(54, 123, 92, 8),
    R(64, 100, 72, 23), 'M48 103Q60 99 70 92L130 92Q140 99 152 103Z',
    R(72, 80, 56, 12), 'M58 82Q66 78 76 72L124 72Q134 78 142 82Z',
    R(80, 62, 40, 10), 'M66 64Q74 58 84 52L116 52Q126 58 134 64Z',
    'M84 52Q100 34 116 52Z', C(100, 32, 3), R(99.3, 34, 1.4, 3),
  ]],
  ['shanghai', 31.2304, 121.4737, () => [
    { d: P('88 150, 88 64, 91 64, 91 44, 94 44, 94 28, 96 28, 98 8, 100 28, 102 28, 102 44, 105 44, 105 64, 108 64, 108 150'), o: 0.75 },
    { s: 'M46 150L54 112M74 150L66 112M60 150V112', w: 3 }, C(60, 100, 14), R(57, 48, 6, 40), C(60, 40, 9), R(58.5, 14, 3, 18), C(60, 20, 4), R(59.3, 0, 1.4, 16),
    { d: 'M120 150V30L126 14H134L140 30V150Z' + P('125 22, 135 22, 133 28, 127 28'), eo: true },
    'M150 150Q148 80 159 6L165 6Q178 80 176 150Z',
  ]],
  ['hongkong', 22.3193, 114.1694, () => [
    { d: 'M0 150V90Q40 60 80 70Q120 50 160 64Q185 70 200 84V150Z', o: 0.35 },
    { d: R(20, 96, 20, 54) + R(80, 80, 18, 70) + R(138, 92, 12, 58) + R(176, 100, 20, 50), o: 0.7 },
    'M50 150V36L53 30V22L56 18H64L67 22V30L70 36V150Z',
    { d: 'M106 150V60L120 12L134 60V150Z' + P('110 70, 120 60, 130 70, 120 80') + P('110 100, 120 90, 130 100, 120 110'), eo: true },
    R(117, 0, 1.2, 14), R(123, 2, 1.2, 12),
    'M152 150V44L162 28L172 44V150Z', R(161.4, 14, 1.2, 16),
  ]],
  ['singapore', 1.3521, 103.8198, () => [
    'M52 150L54 54H70L74 150Z', 'M90 150L92 54H108L112 150Z', 'M128 150L130 54H146L150 150Z',
    'M44 46H174Q178 46 178 50L174 54H44Z',
    'M6 140Q8 124 14 116Q18 126 20 140ZM18 140Q22 122 30 114Q32 126 30 140ZM30 140Q36 124 42 120Q42 130 38 140Z',
    ...[[182, 52], [196, 40], [166, 36]].map(([x, h]) => `M${x - 1.5} 150L${x - 1} ${150 - h + 10}L${x - 9} ${150 - h}H${x + 9}L${x + 1} ${150 - h + 10}L${x + 1.5} 150Z`),
    { s: 'M0 148H200', w: 1.5 },
  ]],
  ['bangkok', 13.7563, 100.5018, () => [
    R(16, 138, 168, 12),
    { d: prang(28, 16, 46) + prang(172, 16, 46), o: 0.85 },
    prang(52, 24, 74), prang(148, 24, 74), prang(100, 54, 146),
  ]],
  ['seoul', 37.5665, 126.978, () => [
    { d: 'M0 150Q100 66 200 150Z', o: 0.55 },
    R(97.5, 44, 5, 66), 'M90 46H110L107 34H93Z', R(94, 30, 12, 4), R(99.3, 4, 1.4, 26),
    { d: R(10, 124, 14, 26) + R(26, 116, 12, 34) + R(150, 120, 16, 30) + R(170, 112, 12, 38) + R(184, 126, 14, 24) + windows(26, 120, 12, 26, 2, 3, 2, 4), eo: true },
  ]],
  ['mumbai', 19.076, 72.8777, () => [
    { d: R(36, 68, 128, 82) + ARCH(86, 150, 28, 62) + ARCH(48, 150, 14, 36) + ARCH(138, 150, 14, 36) + ARCH(50, 104, 10, 16) + ARCH(140, 104, 10, 16) + windows(70, 74, 60, 8, 8, 1, 3, 4), eo: true },
    R(36, 46, 14, 22), DOME(43, 46, 7, 8), R(150, 46, 14, 22), DOME(157, 46, 7, 8),
    R(64, 54, 12, 14), DOME(70, 54, 6, 7), R(124, 54, 12, 14), DOME(130, 54, 6, 7), R(78, 58, 44, 10),
    SPIRE(43, 38, 2, 6) + SPIRE(157, 38, 2, 6),
    { s: 'M0 148Q20 144 40 148T80 148T120 148T160 148T200 148', w: 1.4 },
  ]],
  ['delhi', 28.6139, 77.209, () => [
    R(40, 140, 120, 10), R(56, 128, 88, 12),
    { d: R(66, 44, 68, 84) + ARCH(86, 128, 28, 60) + R(72, 96, 6, 22) + R(122, 96, 6, 22), eo: true },
    R(72, 34, 56, 10), R(80, 26, 40, 8), 'M88 26Q100 14 112 26Z',
    ...tree(20, 10), ...tree(180, 10),
  ]],
  ['kualalumpur', 3.139, 101.6869, () => {
    const tower = cx => ({ d: `M${cx - 14} 150V70H${cx - 12}V54H${cx - 10}V40H${cx - 7}V28H${cx - 4}Q${cx} 18 ${cx + 4} 28H${cx + 7}V40H${cx + 10}V54H${cx + 12}V70H${cx + 14}V150Z` + range(cx - 10, cx + 8, 5).map(x => R(x, 76, 1.6, 68)).join(''), eo: true });
    return [tower(76), tower(124), R(75.4, 0, 1.2, 22), R(123.4, 0, 1.2, 22), R(90, 82, 20, 4), { s: 'M90 86L96 98M110 86L104 98', w: 1.6 }];
  }],
  ['taipei', 25.033, 121.5654, () => [
    { d: R(20, 116, 18, 34) + R(40, 124, 16, 26) + R(150, 112, 16, 38) + R(168, 124, 22, 26), o: 0.6 },
    R(88, 118, 24, 32),
    range(0, 7, 1).map(i => { const y = 118 - i * 10; return P(`91 ${y}, 87 ${y - 10}, 113 ${y - 10}, 109 ${y}`); }).join(''),
    R(93, 30, 14, 8), R(96, 22, 8, 8), P('98 22, 100 0, 102 22'),
  ]],
  // Americas
  // Statue of Liberty drawn from a straight-on reference photo (1305x2000 px;
  // coordinates below are photo pixels mapped into the box: flame tip at the
  // top, photo bottom on the ground). Torch in her RIGHT hand = viewer's LEFT,
  // tablet in her left arm, seven-ray crown, stone pedestal with the balcony
  // and columned loggia. Empire State and Chrysler stand to the right.
  ['newyork', 40.7128, -74.006, () => {
    const k = 150 / 1905;
    const X = px => +(44 + (px - 645) * k).toFixed(2);
    const Y = py => +(150 - (2000 - py) * k).toFixed(2);
    const pts = list => 'M' + list.map(([x, y]) => `${X(x)} ${Y(y)}`).join('L') + 'Z';
    const box = (x1, y1, x2, y2) => R(X(x1), Y(y1), +((x2 - x1) * k).toFixed(2), +((y2 - y1) * k).toFixed(2));
    const slit = (x1, y1, x2, y2, w = 7) => pts([[x1, y1], [x1 + w, y1], [x2 + w, y2], [x2, y2]]);
    const crownBase = [655, 462];
    const rays = [[560, 456], [582, 400], [661, 372], [740, 396], [776, 440], [782, 482]].map(([tx, ty]) => {
      const a = Math.atan2(ty - crownBase[1], tx - crownBase[0]);
      const bx = crownBase[0] + Math.cos(a) * 46, by = crownBase[1] + Math.sin(a) * 30;
      const nx = -Math.sin(a) * 9, ny = Math.cos(a) * 9;
      return pts([[bx + nx, by + ny], [tx, ty], [bx - nx, by - ny]]);
    }).join('');
    return [
      { d: R(98, 92, 12, 58) + R(170, 96, 16, 54) + R(186, 108, 14, 42), o: 0.5 },
      // pedestal: flared base, shaft with the columned loggia, balcony, cap, plinth
      { d: box(385, 1958, 905, 2000) + box(418, 1600, 870, 1960) + box(540, 1628, 583, 1782) + box(621, 1628, 664, 1782) + box(701, 1628, 746, 1782) +
          box(452, 1880, 836, 1884), eo: true },
      { d: box(406, 1512, 884, 1600) + [430, 490, 550, 610, 670, 730, 790, 850].map(x => box(x, 1512, x + 22, 1528)).join(''), eo: true },
      box(455, 1420, 835, 1512),
      box(470, 1376, 820, 1420),
      // robe, with drapery folds as thin cuts
      { d: pts([[495, 1376], [518, 1250], [522, 1100], [526, 965], [508, 870], [512, 790], [535, 720], [552, 640], [575, 580], [612, 562], [690, 586],
          [752, 640], [792, 722], [818, 860], [822, 900], [812, 1050], [806, 1200], [806, 1376]]) +
          slit(570, 760, 690, 1120) + slit(610, 980, 740, 1330) + slit(545, 980, 560, 1330) + slit(700, 700, 780, 900, 6) + slit(640, 640, 600, 760, 6), eo: true },
      // tablet in the left arm
      pts([[796, 748], [880, 704], [916, 742], [868, 906], [806, 904]]),
      // neck, head, crown band and rays
      pts([[628, 545], [684, 545], [690, 590], [622, 590]]),
      E(X(655), Y(512), +(44 * k).toFixed(2), +(50 * k).toFixed(2)),
      'M' + X(598) + ' ' + Y(478) + 'Q' + X(655) + ' ' + Y(418) + ' ' + X(714) + ' ' + Y(478) + 'Z',
      rays,
      // raised right arm (viewer's left), fist, torch and flame
      pts([[490, 545], [495, 420], [488, 330], [545, 328], [552, 420], [586, 520], [600, 572], [560, 590]]),
      pts([[484, 258], [540, 252], [548, 336], [490, 340]]),
      pts([[497, 208], [528, 208], [522, 262], [503, 262]]),
      pts([[466, 164], [556, 164], [546, 210], [476, 210]]),
      pts([[478, 150], [544, 150], [552, 166], [470, 166]]),
      'M' + X(492) + ' ' + Y(150) + 'C' + X(482) + ' ' + Y(118) + ' ' + X(505) + ' ' + Y(104) + ' ' + X(512) + ' ' + Y(95) + 'C' + X(522) + ' ' + Y(112) + ' ' + X(546) + ' ' + Y(110) + ' ' + X(538) + ' ' + Y(150) + 'Z',
      // Empire State
      { d: R(106, 70, 28, 80) + range(110, 128, 6).map(x => R(x, 76, 2, 70)).join(''), eo: true },
      R(110, 56, 20, 14), R(114, 44, 12, 12), R(116, 34, 8, 10), 'M118 34L119.5 6H120.5L122 34Z',
      // Chrysler
      R(150, 70, 16, 80), 'M150 70Q158 40 166 70Z', 'M156 50L158 16L160 50Z',
    ];
  }],
  ['sanfrancisco', 37.7749, -122.4194, () => {
    const cable = t => [(1 - t) ** 2 * 53 + 2 * t * (1 - t) * 100 + t * t * 153, (1 - t) ** 2 * 30 + 2 * t * (1 - t) * 118 + t * t * 30];
    const hangers = range(0.06, 0.95, 0.06).map(t => { const [x, y] = cable(t); return `M${x.toFixed(1)} ${y.toFixed(1)}V108`; }).join('');
    return [
      { d: 'M0 150V96Q30 80 60 92Q120 74 160 90Q185 84 200 92V150Z', o: 0.3 },
      R(0, 108, 200, 5),
      R(44, 26, 5, 124) + R(57, 26, 5, 124) + R(144, 26, 5, 124) + R(157, 26, 5, 124),
      R(44, 40, 18, 3) + R(44, 62, 18, 3) + R(44, 86, 18, 3) + R(144, 40, 18, 3) + R(144, 62, 18, 3) + R(144, 86, 18, 3),
      { s: 'M53 30Q100 118 153 30M0 92Q30 70 53 30M153 30Q176 70 200 92', w: 2.4 },
      { s: hangers, w: 0.7 },
    ];
  }],
  ['losangeles', 34.0522, -118.2437, () => [
    { d: 'M0 150V96Q30 70 60 80Q100 54 140 72Q170 62 200 80V150Z', o: 0.45 },
    { text: 'HOLLYWOOD', x: 62, y: 80, size: 12, rot: -4 },
    ...palm(26, 92, -6), ...palm(46, 74, 4), ...palm(156, 96, 6), ...palm(178, 80, -4),
    { d: R(70, 124, 20, 26) + R(92, 116, 14, 34) + R(108, 128, 30, 22), o: 0.85 },
  ]],
  ['chicago', 41.8781, -87.6298, () => [
    { d: R(20, 100, 16, 50) + R(38, 110, 14, 40) + R(160, 104, 16, 46) + R(178, 92, 14, 58), o: 0.55 },
    { d: R(66, 60, 30, 90) + R(66, 44, 20, 16) + R(76, 30, 12, 14) + range(70, 92, 6).map(x => R(x, 66, 2, 80)).join(''), eo: true },
    R(78, 6, 2, 24), R(85, 12, 2, 18),
    { d: P('126 150, 130 40, 146 40, 150 150') + P('132 60, 138 52, 144 60, 138 68') + P('132 92, 138 84, 144 92, 138 100'), eo: true },
    R(132, 14, 1.6, 26), R(142.4, 14, 1.6, 26),
    { d: P('104 150, 104 70, 108 70, 108 50, 112 50, 112 34, 114 34, 116 20, 118 34, 120 34, 120 50, 124 50, 124 150'), o: 0.85 },
  ]],
  ['washington', 38.9072, -77.0369, () => [
    P('150 150, 151.5 30, 155 21, 158.5 30, 160 150'),
    { d: R(10, 112, 124, 38) + windows(12, 116, 120, 30, 16, 2, 3, 6), eo: true },
    R(52, 100, 40, 12), P('50 100, 72 90, 94 100'),
    { d: R(56, 80, 32, 20) + range(59, 85, 4).map(x => R(x, 83, 1.6, 15)).join(''), eo: true },
    DOME(72, 80, 18, 26), R(69, 44, 6, 10), DOME(72, 44, 3, 4), R(71.3, 32, 1.4, 9),
  ]],
  ['toronto', 43.6532, -79.3832, () => [
    { d: R(130, 104, 14, 46) + R(146, 92, 16, 58) + R(164, 110, 14, 40) + R(180, 98, 16, 52), o: 0.55 },
    DOME(46, 150, 30, 24), { s: 'M22 136Q46 120 70 136M34 128V150M46 126V150M58 128V150', w: 0.8 },
    P('93 150, 98.4 74, 101.6 74, 107 150'), E(100, 70, 12, 6), R(98.6, 34, 2.8, 36), E(100, 34, 5, 3), 'M99 34L100 0L101 34Z',
  ]],
  ['seattle', 47.6062, -122.3321, () => [
    { d: 'M108 150L160 96Q172 88 184 96L200 112V150Z', o: 0.3 },
    'M82 150Q94 110 96 98Q94 70 92 52H108Q106 70 104 98Q106 110 118 150H110Q101 116 100 104Q99 116 90 150Z',
    'M72 50Q100 40 128 50L120 55H80Z', 'M84 46Q100 32 116 46Z', P('98.5 36, 100 4, 101.5 36'),
    { d: R(10, 120, 16, 30) + R(28, 112, 12, 38) + R(140, 122, 18, 28), o: 0.7 },
  ]],
  ['mexicocity', 19.4326, -99.1332, () => [
    ...tree(40, 12), ...tree(160, 12), ...tree(20, 9), ...tree(180, 9),
    R(76, 126, 48, 24), R(82, 112, 36, 14), R(76, 118, 6, 8), R(118, 118, 6, 8),
    R(95, 34, 10, 78), R(92, 30, 16, 4),
    P('97 30, 99 14, 101 14, 103 30'), P('99 18, 84 10, 92 24'), P('101 18, 116 10, 108 24'), C(100, 12, 2),
    { s: 'M101 14L104 4', w: 1.4 }, C(104.5, 3, 1.8),
  ]],
  ['rio', -22.9068, -43.1729, () => [
    { d: 'M18 150L56 92L82 68L94 62H106L124 78L150 110L168 150Z', o: 0.6 },
    R(96, 58, 8, 4), P('98 60, 99 34, 101 34, 102 60'), R(87, 36, 26, 3), C(100, 31, 2.6),
    { d: 'M150 150Q152 104 170 90Q186 84 196 120L200 150Z', o: 0.9 },
    { d: 'M126 150Q134 124 148 128L154 150Z', o: 0.9 }, { s: 'M148 128L170 92', w: 0.8 }, R(158, 108, 3, 3),
  ]],
  ['buenosaires', -34.6037, -58.3816, () => [
    { d: R(10, 104, 22, 46) + R(34, 112, 18, 38) + R(56, 120, 20, 30) + R(124, 118, 20, 32) + R(146, 106, 18, 44) + R(166, 114, 26, 36) +
      windows(10, 108, 22, 38, 3, 4, 3, 4) + windows(146, 110, 18, 36, 2, 4, 3, 4), o: 0.55, eo: true },
    { d: P('93 150, 93 28, 100 10, 107 28, 107 150') + R(98.5, 34, 3, 4), eo: true },
    ...tree(82, 8), ...tree(118, 8),
  ]],
  // ---- Cities in the app's newer languages ----
  // Baku: the three Flame Towers above the Maiden Tower and the Caspian.
  ['baku', 40.4093, 49.8671, () => {
    const flame = (x, w, h, lean) => ({ d: `M${x - w / 2} 150V${150 - h * 0.5}Q${x - w / 2} ${150 - h * 0.86} ${x + lean} ${150 - h}Q${x + w / 2} ${150 - h * 0.78} ${x + w / 2} ${150 - h * 0.42}V150Z` + range(150 - h * 0.7, 144, 7).map(y => R(x - w / 2 + 3, y, w - 6, 1)).join(''), eo: true });
    return [
      { d: 'M0 150V120Q60 110 120 116Q170 110 200 118V150Z', o: 0.3 },
      flame(116, 26, 124, 4), flame(146, 22, 104, -3), flame(172, 22, 90, 2),
      { d: 'M28 150V74Q28 66 46 64Q64 66 64 74V150Z' + 'M64 150V100Q76 108 80 150Z' + R(42, 84, 3, 9) + R(50, 104, 3, 9) + ARCH(40, 150, 10, 16), eo: true },
      crenels(28, 70, 36, 5),
      { s: waves(146, 0, 200), w: 1.2 },
    ];
  }],
  // St Petersburg: the Peter and Paul needle, a raised bridge over the Neva, onion domes.
  ['stpetersburg', 59.9311, 30.3609, () => [
    { d: R(30, 100, 40, 40) + range(34, 66, 8).map(x => ARCH(x, 132, 4, 14)).join(''), eo: true }, R(36, 82, 28, 18), R(42, 66, 16, 16),
    P('44 66, 50 2, 56 66'), { s: 'M50 2V-4M47 0L53 -2', w: 1 },
    { d: 'M74 132L94 84L99 86L82 136Z' + 'M126 132L106 84L101 86L118 136Z', o: 0.9 }, R(70, 132, 16, 8) + R(114, 132, 16, 8),
    { d: R(136, 104, 54, 36) + ARCH(152, 140, 10, 20) + ARCH(168, 140, 10, 20), eo: true },
    R(156, 84, 14, 20), ONION(163, 84, 16, 22), R(162.4, 56, 1.2, 8),
    R(140, 92, 8, 12) + ONION(144, 92, 10, 14) + R(178, 92, 8, 12) + ONION(182, 92, 10, 14),
    { s: waves(146, 0, 200) + waves(142, 0, 70) + waves(142, 130, 200), w: 1.2 },
  ]],
  // Kazan: the Kul Sharif mosque with its four slender minarets and the leaning Söyembikä tower.
  ['kazan', 55.7887, 49.1221, () => [
    { d: R(12, 82, 22, 68) + R(18, 92, 3, 8) + R(25, 92, 3, 8), eo: true }, R(15, 64, 16, 18), R(18, 50, 10, 14), P('17 50, 23 26, 29 50'),
    { d: R(76, 104, 60, 46) + range(82, 130, 10).map(x => ARCH(x, 146, 5, 18)).join(''), eo: true },
    'M80 104Q80 74 106 60Q132 74 132 104Z', R(105.4, 42, 1.2, 18), C(106, 41, 2),
    [62, 150].map(x => R(x - 2.6, 40, 5.2, 110) + R(x - 4, 72, 8, 2.4) + R(x - 4, 100, 8, 2.4) + SPIRE(x, 40, 5.2, 22)).join(''),
    [86, 126].map(x => R(x - 2, 66, 4, 38) + SPIRE(x, 66, 4, 14)).join(''),
  ]],
  // Osaka: the castle on its stone base and the Tsutenkaku tower.
  ['osaka', 34.6937, 135.5023, () => {
    const roof = (cx, y, w) => `M${cx - w / 2 - 8} ${y + 4}Q${cx - w / 2} ${y + 1} ${cx - w / 2 + 4} ${y - 6}H${cx + w / 2 - 4}Q${cx + w / 2} ${y + 1} ${cx + w / 2 + 8} ${y + 4}Z`;
    return [
      P('40 150, 48 116, 132 116, 140 150'),
      { d: R(56, 98, 68, 18) + windows(60, 102, 60, 10, 6, 1, 4, 5), eo: true }, roof(90, 98, 76),
      { d: R(64, 80, 52, 14) + windows(68, 83, 44, 8, 4, 1, 4, 4), eo: true }, roof(90, 80, 60),
      { d: R(72, 62, 36, 14) + windows(76, 65, 28, 8, 3, 1, 4, 4), eo: true }, roof(90, 62, 44),
      R(78, 48, 24, 12), roof(90, 48, 30), P('84 42, 90 34, 96 42'),
      'M156 150L162 108H184L190 150H182Q173 128 164 150Z', R(165, 58, 16, 50), R(161, 50, 24, 8), R(172.4, 30, 1.2, 20),
    ];
  }],
  // Kyoto: the Yasaka pagoda and a tunnel of torii gates.
  ['kyoto', 35.0116, 135.7681, () => {
    const torii = (x, h, o) => ({ d: R(x - h * 0.34, 150 - h, h * 0.08, h) + R(x + h * 0.26, 150 - h, h * 0.08, h) + R(x - h * 0.42, 150 - h * 0.8, h * 0.84, h * 0.06) +
      `M${x - h * 0.52} ${150 - h * 0.98}Q${x} ${150 - h * 1.02} ${x + h * 0.52} ${150 - h * 0.98}L${x + h * 0.48} ${150 - h * 1.08}Q${x} ${150 - h * 1.12} ${x - h * 0.48} ${150 - h * 1.08}Z`, o });
    const tiers = range(0, 4, 1).map(i => {
      const y = 140 - i * 20, w = 54 - i * 7, cx = 138;
      return R(cx - (w - 18) / 2, y - 10, w - 18, 10) + `M${cx - w / 2 - 6} ${y - 10}Q${cx - w / 2} ${y - 14} ${cx - w / 2 + 6} ${y - 20}H${cx + w / 2 - 6}Q${cx + w / 2} ${y - 14} ${cx + w / 2 + 6} ${y - 10}Z`;
    }).join('');
    return [
      R(114, 140, 48, 10), tiers, R(137.3, 22, 1.4, 22), range(28, 40, 4).map(y => R(135, y, 6, 1.2)).join(''),
      torii(70, 30, 0.45), torii(62, 42, 0.6), torii(52, 58, 0.8), torii(38, 80, 1),
    ];
  }],
  // Busan: the Gwangan Bridge across the bay and Busan Tower on its hill.
  ['busan', 35.1796, 129.0756, () => {
    const cable = (a, b, top, low) => `M${a} ${top}Q${(a + b) / 2} ${low} ${b} ${top}`;
    return [
      { d: 'M120 150Q140 104 168 96Q188 94 200 104V150Z', o: 0.5 },
      R(161, 40, 4, 60), R(156, 34, 14, 6), R(158, 30, 10, 4), R(162.4, 14, 1.2, 16),
      R(0, 112, 150, 3.5),
      R(40, 64, 4, 86) + R(48, 64, 4, 86) + R(96, 64, 4, 86) + R(104, 64, 4, 86), R(40, 72, 12, 2) + R(96, 72, 12, 2),
      { s: cable(46, 102, 66, 108) + cable(-10, 46, 98, 112) + cable(102, 150, 66, 112), w: 1.6 },
      { s: range(54, 96, 6).map(x => { const t = (x - 46) / 56; const y = (1 - t) ** 2 * 66 + 2 * t * (1 - t) * 150 + t * t * 66; return `M${x} ${(y / 2 + 33).toFixed(1)}V112`; }).join(''), w: 0.6 },
      { s: waves(140, 0, 200) + waves(146, 0, 200), w: 1.2 },
    ];
  }],
  // Guangzhou: the twisted lattice of the Canton Tower over the Pearl River.
  ['guangzhou', 23.1291, 113.2644, () => [
    { d: R(10, 104, 18, 46) + R(30, 92, 16, 58) + R(150, 96, 20, 54) + R(172, 108, 18, 42), o: 0.5 },
    { d: 'M78 150Q96 96 90 52L86 30H114L110 52Q104 96 122 150Z' + range(40, 140, 9).map(y => { const k = (y - 30) / 120; const half = 14 - 9 * Math.sin(k * Math.PI * 0.9) + 8 * k; return `M${(100 - half + 2).toFixed(1)} ${y}L${(100 + half - 2).toFixed(1)} ${y + 4}L${(100 + half - 2).toFixed(1)} ${y + 5.2}L${(100 - half + 2).toFixed(1)} ${y + 1.2}Z`; }).join(''), eo: true },
    R(98.6, 0, 2.8, 30), R(88, 28, 24, 3),
    { s: waves(146, 0, 200), w: 1.2 },
  ]],
  // Agra: the Taj Mahal with its four minarets.
  ['agra', 27.1767, 78.0081, () => [
    R(24, 138, 152, 12),
    { d: R(64, 92, 72, 46) + ARCH(88, 138, 24, 40) + ARCH(70, 132, 10, 16) + ARCH(120, 132, 10, 16) + ARCH(70, 112, 10, 14) + ARCH(120, 112, 10, 14), eo: true },
    R(84, 86, 32, 6), 'M80 88Q74 60 100 44Q126 60 120 88Z', R(99.4, 30, 1.2, 14), C(100, 29, 1.8),
    DOME(72, 92, 7, 7) + DOME(128, 92, 7, 7) + R(69, 86, 6, 6) + R(125, 86, 6, 6),
    [36, 164].map(x => R(x - 3, 66, 6, 72) + R(x - 4.5, 84, 9, 2) + R(x - 4.5, 104, 9, 2) + R(x - 4.5, 64, 9, 2) + DOME(x, 64, 5, 6) + R(x - 0.5, 52, 1, 6)).join(''),
  ]],
  // Marseille: Notre-Dame de la Garde on its hill above the Old Port.
  ['marseille', 43.2965, 5.3698, () => [
    { d: 'M30 150Q60 96 100 92Q140 96 176 150Z', o: 0.45 },
    { d: R(82, 70, 40, 24) + ARCH(88, 94, 6, 12) + ARCH(110, 94, 6, 12), eo: true }, DOME(94, 70, 10, 10),
    { d: R(108, 34, 14, 36) + ARCH(112, 56, 6, 12), eo: true }, R(106, 30, 18, 4), R(113, 18, 4, 12), C(115, 15, 3),
    { d: R(10, 110, 24, 32) + R(14, 118, 3, 8), eo: true }, crenels(10, 110, 24, 4),
    [140, 156, 172, 188].map((x, i) => P(`${x - 7} 140, ${x + 7} 140, ${x + 5} 144, ${x - 5} 144`) + R(x - 0.5, 112 + i * 3, 1, 28 - i * 3)).join(''),
    { s: waves(146, 0, 200), w: 1.2 },
  ]],
  // Montreal: the Biosphere's geodesic globe and the leaning Olympic tower.
  ['montreal', 45.5017, -73.5673, () => [
    { s: C(46, 108, 32) + E(46, 108, 32, 12) + E(46, 108, 32, 24) + E(46, 108, 12, 32) + E(46, 108, 24, 32) + 'M14 108H78', w: 1.4 },
    'M80 150Q90 116 132 112Q164 114 172 150Z',
    P('164 150, 182 150, 150 40, 140 42'), P('136 38, 156 34, 158 46, 138 50'),
    { s: 'M146 56L122 112M148 66L104 114M150 78L90 118', w: 0.7 },
  ]],
  // ---- Poland ----
  // Gdańsk: the medieval port crane and narrow gabled houses along the Motława.
  ['gdansk', 54.352, 18.6466, () => [
    { d: R(34, 70, 64, 72) + ARCH(56, 142, 18, 30) + R(42, 82, 4, 10) + R(86, 82, 4, 10), eo: true },
    { d: R(22, 40, 70, 30) + range(26, 88, 6).map(x => R(x, 44, 1, 22)).join(''), eo: true }, P('18 42, 57 12, 96 42'),
    gableHouse(108, 16, 60, 0.7), gableHouse(126, 14, 68, 0.8), gableHouse(142, 16, 56, 0.7), gableHouse(160, 14, 64, 0.8), gableHouse(176, 18, 54, 0.6),
    { s: waves(146, 0, 200), w: 1.2 },
  ]],
  // Wrocław: the Gothic town hall with its stepped gables and tower, and a little bronze dwarf.
  ['wroclaw', 51.1079, 17.0385, () => [
    { d: R(30, 94, 110, 56) + range(36, 134, 12).map(x => ARCH(x, 140, 6, 26)).join(''), eo: true },
    P('30 94, 30 80, 36 80, 36 72, 42 72, 42 64, 48 64, 48 56, 54 56, 54 64, 60 64, 60 72, 66 72, 66 80, 72 80, 72 94'),
    P('98 94, 98 80, 104 80, 104 70, 110 70, 110 60, 116 60, 116 70, 122 70, 122 80, 128 80, 128 94'),
    { d: R(76, 46, 16, 48) + C(84, 60, 4), eo: true }, P('74 46, 84 12, 94 46'), R(83.4, 4, 1.2, 8),
    [36, 66, 104, 134].map(x => SPIRE(x, 94, 3, 10)).join(''),
    P('168 150, 172 132, 182 132, 186 150'), C(177, 128, 5), P('170 126, 177 108, 184 126'), 'M172 130Q177 140 182 130Z',
  ]],
  // Poznań: the Renaissance town hall with its loggias, tower and the two butting goats.
  ['poznan', 52.4064, 16.9252, () => [
    { d: R(36, 82, 128, 68) + range(42, 156, 14).map(x => ARCH(x, 104, 9, 16) + ARCH(x, 126, 9, 16) + ARCH(x, 148, 9, 18)).join(''), eo: true },
    R(34, 76, 132, 6), [40, 72, 128, 160].map(x => R(x - 3, 66, 6, 10) + DOME(x, 66, 3, 3)).join(''),
    R(90, 40, 20, 36), R(88, 36, 24, 4), R(94, 22, 12, 14), DOME(100, 22, 6, 8), R(99.4, 4, 1.2, 10), P('96 6, 100 2, 104 6'),
    'M90 62Q92 58 96 59L98 62L96 66H92Z', 'M110 62Q108 58 104 59L102 62L104 66H108Z',
  ]],
  // Łódź: the red-brick Manufaktura mills and their tall chimneys.
  ['lodz', 51.7592, 19.456, () => [
    { d: R(12, 92, 128, 58) + windows(16, 98, 120, 44, 12, 3, 4, 8), eo: true },
    range(12, 136, 16).map(x => P(`${x} 92, ${x + 8} 84, ${x + 16} 92`)).join(''),
    P('150 150, 152 26, 160 26, 162 150'), R(149, 22, 14, 5),
    P('176 150, 177 50, 183 50, 184 150'), R(175, 46, 10, 4),
    { s: 'M190 150V112M186 112H194', w: 1.4 }, C(190, 110, 2.6),
  ]],
  // Szczecin: the Chrobry Embankment terraces and the port cranes on the Oder.
  ['szczecin', 53.4285, 14.5528, () => [
    { d: R(70, 82, 100, 30) + windows(74, 86, 92, 22, 10, 2, 4, 6), eo: true }, R(124, 40, 20, 42), DOME(134, 40, 10, 10), R(133.4, 24, 1.2, 8),
    R(56, 112, 128, 6), R(46, 118, 148, 4),
    { d: range(60, 180, 10).map(x => R(x, 122, 6, 14)).join(''), o: 0.85 },
    { s: 'M14 150V64M14 64L52 76M14 70L42 60M48 76V96', w: 2 }, R(8, 140, 12, 10),
    { s: waves(146, 0, 200), w: 1.2 },
  ]],
  // Lublin: the castle with its round keep and the baroque Kraków Gate.
  ['lublin', 51.2465, 22.5684, () => [
    { d: R(14, 100, 116, 50) + range(20, 124, 10).map(x => ARCH(x, 132, 5, 14)).join(''), eo: true }, crenels(14, 100, 116, 10),
    { d: R(60, 70, 26, 30) + ARCH(66, 100, 14, 22), eo: true }, crenels(60, 70, 26, 4),
    R(98, 52, 22, 48), crenels(98, 52, 22, 4),
    { d: R(148, 72, 30, 78) + ARCH(155, 150, 16, 26) + R(160, 86, 6, 10), eo: true },
    'M146 72Q148 54 163 46Q178 54 180 72Z', R(159, 32, 8, 14), DOME(163, 32, 5, 5), R(162.4, 20, 1.2, 8),
  ]],
  // Katowice: the flying-saucer Spodek arena and a coal-mine headframe.
  ['katowice', 50.2649, 19.0238, () => [
    'M24 118L58 96H140L174 118L150 126H48Z', { s: 'M50 126L42 150M150 126L158 150M78 126L74 150M122 126L126 150', w: 2.4 },
    { d: R(58, 92, 82, 4), o: 0.8 },
    { d: P('176 150, 184 52, 190 52, 198 150') + P('182 120, 187 70, 192 120'), eo: true },
    { d: C(187, 50, 7) + C(187, 50, 3), eo: true }, R(10, 132, 14, 18), R(28, 138, 12, 12),
  ]],
  // Toruń: Gothic brick churches, the town hall tower, the Vistula and Copernicus.
  ['torun', 53.0138, 18.5984, () => [
    { d: R(16, 92, 56, 58) + range(22, 66, 10).map(x => ARCH(x, 140, 5, 30)).join(''), eo: true }, P('14 94, 44 54, 74 94'),
    R(30, 40, 16, 34), P('28 40, 38 18, 48 40'),
    { d: R(88, 36, 22, 114) + ARCH(94, 72, 10, 18) + ARCH(94, 104, 10, 18), eo: true }, P('86 36, 99 8, 112 36'),
    R(146, 118, 20, 32), R(152, 110, 8, 8), C(156, 104, 4), 'M150 112L156 82L162 112Z', { s: 'M162 96L172 86', w: 1.6 }, C(173, 84, 3),
    { s: waves(146, 0, 140) + waves(146, 170, 200), w: 1.2 },
  ]],
  // ---- Much-visited cities ----
  // Venice: the Rialto Bridge, the San Marco bell tower and a gondola.
  ['venice', 45.4408, 12.3155, () => [
    { d: R(150, 34, 16, 106) + R(153, 42, 3, 10) + R(160, 42, 3, 10), o: 0.55, eo: true }, { d: P('148 34, 158 12, 168 34'), o: 0.55 },
    { d: 'M14 140Q100 92 186 140V146H14Z' + 'M58 146Q100 114 142 146Z', eo: true },
    { d: R(82, 96, 36, 20) + ARCH(94, 116, 12, 16), eo: true }, P('80 96, 100 86, 120 96'),
    R(40, 110, 24, 10) + R(136, 110, 24, 10),
    'M20 146Q50 152 96 142Q78 148 34 150Z', P('96 142, 102 134, 100 142'), R(58, 128, 3, 14), C(59.5, 125, 2.4), { s: 'M60 134L74 150', w: 1.2 },
    { s: waves(148, 0, 200), w: 1 },
  ]],
  // Florence: Brunelleschi's dome, Giotto's bell tower and the cathedral.
  ['florence', 43.7696, 11.2558, () => [
    { d: R(28, 112, 120, 38) + range(34, 142, 12).map(x => ARCH(x, 140, 6, 16)).join(''), eo: true },
    { d: R(68, 88, 64, 24) + range(74, 126, 9).map(x => C(x + 2, 100, 2.4)).join(''), eo: true },
    { d: 'M70 88Q70 52 100 40Q130 52 130 88Z' + 'M84 86Q84 56 98 44L100 44Q88 58 88 86Z' + 'M112 86Q112 56 102 44L100 44Q112 58 116 86Z', eo: true },
    R(95, 28, 10, 12), P('95 28, 100 18, 105 28'), C(100, 16, 2),
    { d: R(156, 34, 22, 116) + ARCH(161, 64, 12, 16) + ARCH(161, 92, 12, 16) + ARCH(161, 120, 12, 16), eo: true }, R(154, 30, 26, 4),
  ]],
  // Seville: the Giralda bell tower, the Torre del Oro on the Guadalquivir and palms.
  ['seville', 37.3891, -5.9845, () => [
    { d: R(76, 46, 28, 104) + R(82, 60, 4, 12) + R(94, 60, 4, 12) + R(82, 90, 4, 12) + R(94, 90, 4, 12), eo: true },
    { d: R(80, 26, 20, 20) + ARCH(83, 44, 6, 12) + ARCH(91, 44, 6, 12), eo: true }, R(83, 18, 14, 8), R(86, 10, 8, 8), DOME(90, 10, 4, 4), R(89.4, 0, 1.2, 6),
    { d: R(136, 92, 30, 50) + R(144, 104, 4, 10) + R(154, 104, 4, 10), eo: true }, crenels(136, 92, 30, 5), R(142, 72, 18, 20), crenels(142, 72, 18, 3), R(146, 60, 10, 12), DOME(151, 60, 5, 5),
    ...palm(30, 70, -4), ...palm(186, 60, 4),
    { s: waves(146, 110, 200), w: 1.2 },
  ]],
  // Porto: the Dom Luís I iron bridge over the Douro, the Clérigos tower and a rabelo boat.
  ['porto', 41.1579, -8.6291, () => [
    { d: 'M0 150V100Q20 90 40 94L50 150Z', o: 0.4 }, { d: 'M150 150L164 92Q184 86 200 92V150Z', o: 0.4 },
    R(20, 58, 8, 36), P('18 58, 24 40, 30 58'), C(24, 38, 2),
    R(0, 60, 200, 4), { s: 'M30 150Q100 20 170 150', w: 5 },
    { s: range(46, 156, 12).map(x => { const t = (x - 30) / 140; const y = (1 - t) ** 2 * 150 + 2 * t * (1 - t) * 20 + t * t * 150; return y > 64 ? `M${x} 64V${(y / 2 + 42).toFixed(1)}` : ''; }).join(''), w: 1 },
    R(0, 120, 200, 3),
    'M72 144Q100 150 128 144L124 138H76Z', R(99.4, 112, 1.2, 26), R(90, 114, 20, 18),
    { s: waves(148, 0, 200), w: 1 },
  ]],
  // Edinburgh: the castle on its volcanic rock and the Gothic spire of the Scott Monument.
  ['edinburgh', 55.9533, -3.1883, () => [
    { d: 'M0 150V112L20 96L34 98L50 84L80 82L96 92L110 150Z', o: 0.75 },
    { d: R(22, 70, 70, 16) + windows(26, 72, 62, 10, 7, 1, 3, 5), eo: true }, crenels(22, 70, 70, 9),
    R(36, 56, 14, 14), crenels(36, 56, 14, 3), R(70, 50, 16, 20), crenels(70, 50, 16, 3), R(77.4, 38, 1.2, 12), P('78 38, 86 42, 78 46'),
    P('132 150, 136 104, 164 104, 168 150'), { d: 'M138 104L142 70H158L162 104Z' + ARCH(145, 104, 10, 22), eo: true },
    P('142 70, 145 46, 155 46, 158 70'), P('145 46, 150 10, 155 46'), [134, 166, 140, 160].map((x, i) => SPIRE(x, i < 2 ? 104 : 70, 3, 14)).join(''),
  ]],
  // Reykjavík: Hallgrímskirkja's basalt-column steps, Mount Esja and the Sun Voyager.
  ['reykjavik', 64.1466, -21.9426, () => {
    const steps = dir => range(1, 7, 1).map(i => R(dir > 0 ? 100 + 8 + (i - 1) * 9 : 100 - 8 - i * 9, 150 - (64 - i * 8), 9, 64 - i * 8)).join('');
    return [
      { d: 'M0 150V110Q40 88 90 96Q140 84 200 104V150Z', o: 0.3 },
      { d: R(92, 20, 16, 130) + R(96, 44, 3, 10) + R(101, 44, 3, 10) + C(100, 64, 3.5), eo: true }, P('92 20, 100 4, 108 20'),
      steps(1), steps(-1),
      { s: 'M150 140Q170 134 192 140M154 140L160 122M166 138L170 118M178 138L180 120M188 140L192 124', w: 1.6 },
    ];
  }],
  // Oslo: the Opera House sloping into the fjord and the Holmenkollen ski jump on the hill.
  ['oslo', 59.9139, 10.7522, () => [
    { d: 'M100 150Q130 80 200 64V150Z', o: 0.35 },
    { s: 'M150 82Q166 74 178 88Q186 100 200 104', w: 2.4 }, R(146, 78, 6, 10),
    'M6 146L58 112H136L170 146Z', { d: R(100, 96, 26, 16) + range(103, 124, 4).map(x => R(x, 99, 1, 11)).join(''), eo: true },
    { s: waves(148, 0, 200), w: 1 },
  ]],
  // Zürich: the Grossmünster's twin towers, the Fraumünster spire, the lake and the Alps.
  ['zurich', 47.3769, 8.5417, () => [
    { d: 'M0 150V96L24 78L40 88L62 62L84 84L110 70L136 90L160 66L184 82L200 74V150Z', o: 0.3 },
    { d: 'M58 66L62 62L66 66Z M156 70L160 66L164 70Z', o: 0.6 },
    { d: R(40, 104, 70, 46) + range(46, 104, 10).map(x => ARCH(x, 142, 5, 16)).join(''), eo: true },
    { d: R(46, 52, 16, 52) + R(86, 52, 16, 52) + ARCH(50, 76, 8, 12) + ARCH(90, 76, 8, 12), eo: true },
    R(44, 48, 20, 4) + R(84, 48, 20, 4), DOME(54, 48, 8, 12) + DOME(94, 48, 8, 12), R(53.4, 28, 1.2, 8) + R(93.4, 28, 1.2, 8),
    R(140, 74, 12, 76), P('138 74, 146 26, 154 74'), R(145.4, 18, 1.2, 8),
    { s: waves(146, 0, 200), w: 1.2 }, sailboat(178, 142, 0.6),
  ]],
  // Dubrovnik: the city walls with the round Minčeta tower, tiled roofs and the Adriatic.
  ['dubrovnik', 42.6507, 18.0944, () => [
    { d: 'M0 150V96Q60 84 120 90L200 100V150Z', o: 0.3 },
    { d: R(30, 52, 30, 64) + R(40, 70, 3, 9) + R(48, 70, 3, 9), eo: true }, crenels(28, 52, 34, 5),
    R(0, 112, 200, 26), crenels(0, 112, 200, 22),
    ...[[68, 16, 18], [86, 14, 22], [102, 18, 16], [122, 14, 20], [138, 16, 14], [156, 18, 18]].map(([x, w, h]) => ({ d: R(x, 112 - h, w, h) + P(`${x - 1} ${112 - h}, ${x + w / 2} ${106 - h}, ${x + w + 1} ${112 - h}`) + R(x + w / 2 - 1.5, 116 - h, 3, 4), eo: true })),
    R(150, 60, 6, 52), P('148 60, 153 46, 158 60'),
    { s: waves(146, 0, 200), w: 1.2 },
  ]],
  // Santorini: white cube houses down the caldera cliff, blue-domed churches and a windmill.
  ['santorini', 36.4168, 25.4317, () => [
    { d: 'M0 150V70Q40 60 90 66L120 110L140 150Z', o: 0.4 },
    { d: R(10, 70, 26, 18) + R(40, 76, 22, 16) + R(22, 92, 28, 16) + R(56, 96, 22, 14) + R(70, 112, 26, 16) + R(36, 112, 30, 18) +
      R(16, 76, 4, 6) + R(46, 82, 4, 6) + R(30, 98, 4, 6) + R(62, 102, 4, 6) + R(80, 118, 4, 6) + R(44, 118, 4, 6), eo: true },
    DOME(52, 76, 8, 8) + DOME(82, 112, 9, 9), R(51.4, 62, 1.2, 6), R(81.4, 96, 1.2, 7),
    { d: R(104, 80, 14, 26) + ARCH(107, 94, 8, 10), eo: true }, P('104 80, 111 72, 118 80'),
    ...windmill(178, 120, 34),
    { s: waves(146, 100, 200), w: 1.2 }, sailboat(140, 144, 0.7),
  ]],
  // Las Vegas: the Strat tower, the famous welcome sign and the Strip.
  ['lasvegas', 36.1699, -115.1398, () => [
    { d: R(20, 90, 18, 60) + R(40, 70, 22, 80) + R(64, 98, 16, 52) + R(170, 84, 20, 66) + windows(42, 74, 18, 70, 3, 9, 3, 4), o: 0.5, eo: true },
    R(146, 30, 8, 120), 'M136 40Q150 26 164 40L160 48H140Z', R(149.4, 4, 1.2, 26),
    { s: 'M96 150V112M120 150V112', w: 2 },
    { d: 'M84 104L108 84L132 104L108 124Z' + 'M92 104L108 91L124 104L108 117Z', eo: true }, P('108 78, 110 82, 114 82, 111 85, 112 89, 108 86, 104 89, 105 85, 102 82, 106 82'),
  ]],
  // Miami: Art Deco hotels with their neon fins, palms and a lifeguard tower on the beach.
  ['miami', 25.7617, -80.1918, () => [
    { d: R(18, 80, 46, 56) + R(20, 76, 42, 4) + R(38, 56, 6, 24) + windows(22, 86, 38, 44, 4, 4, 5, 4), eo: true },
    { d: 'M70 136V88H104Q112 88 112 96V136Z' + R(84, 66, 8, 22) + windows(74, 94, 34, 36, 3, 4, 6, 3), eo: true },
    ...palm(128, 84, 4), ...palm(146, 66, -3),
    P('164 128, 170 116, 190 116, 196 128'), R(166, 128, 28, 4), { s: 'M168 132L164 150M192 132L196 150M178 132V150', w: 1.6 },
    { s: waves(146, 0, 200), w: 1 }, R(0, 136, 160, 2),
  ]],
  // Honolulu: Diamond Head behind Waikiki, the Aloha Tower, palms and surfboards.
  ['honolulu', 21.3069, -157.8583, () => [
    { d: 'M60 150L96 92Q118 80 140 86Q170 96 200 122V150Z', o: 0.45 },
    { d: R(36, 62, 18, 88) + C(45, 74, 4.5), eo: true }, R(33, 58, 24, 4), P('34 58, 45 38, 56 58'), R(44.4, 26, 1.2, 12),
    ...palm(84, 88, -5), ...palm(102, 70, 4),
    E(150, 124, 4, 22) + E(162, 126, 4, 20) + E(174, 122, 4, 24),
    { s: waves(148, 0, 200), w: 1 },
  ]],
  // Vancouver: the North Shore mountains, the Harbour Centre tower and the sails of Canada Place.
  ['vancouver', 49.2827, -123.1207, () => [
    { d: 'M0 150V84L30 56L54 74L84 44L110 66L140 50L170 70L200 58V150Z', o: 0.3 },
    { d: 'M26 60L30 56L34 60L30 62Z M80 48L84 44L88 48L84 50Z M136 54L140 50L144 54Z', o: 0.6 },
    { d: R(40, 96, 16, 54) + R(60, 84, 18, 66) + R(152, 92, 20, 58) + R(176, 104, 18, 46), o: 0.6 },
    R(110, 52, 14, 98), 'M100 54Q117 36 134 54L130 60H104Z', R(116.4, 26, 1.2, 14),
    P('70 138, 82 112, 94 138') + P('88 138, 100 108, 112 138') + P('106 138, 118 114, 130 138') + P('124 138, 134 118, 144 138'), R(66, 138, 82, 4),
    { s: waves(148, 0, 200), w: 1 },
  ]],
  // Havana: El Capitolio's dome, a palm and a classic 1950s car.
  ['havana', 23.1136, -82.3666, () => [
    { d: R(30, 98, 140, 40) + range(36, 164, 10).map(x => R(x, 104, 4, 28)).join(''), eo: true }, R(26, 94, 148, 4), P('76 94, 100 82, 124 94'),
    R(82, 62, 36, 20), 'M82 64Q82 36 100 28Q118 36 118 64Z', R(97, 16, 6, 12), C(100, 14, 2.4),
    ...palm(14, 74, -3),
    'M112 150V140Q114 132 126 132L138 126H160L172 134Q186 134 190 140V150Z', { d: C(128, 149, 5) + C(176, 149, 5), o: 0.95 },
  ]],
  // Cusco and Machu Picchu: Huayna Picchu, stone terraces, ruins and a llama.
  ['cusco', -13.532, -71.9675, () => [
    { d: 'M76 150Q100 70 124 22Q140 36 150 70Q166 110 190 150Z', o: 0.45 },
    { d: 'M0 150V120Q40 112 80 118L110 150Z' + range(122, 146, 6).map(y => `M0 ${y}H${(y - 110) * 2.2}V${y + 1}H0Z`).join(''), eo: true },
    ...[[20, 110], [36, 106], [52, 108]].map(([x, y]) => ({ d: R(x, y, 12, 10) + R(x + 4, y + 3, 3, 4), eo: true })), P('19 110, 26 103, 33 110') + P('35 106, 42 99, 49 106') + P('51 108, 58 101, 65 108'),
    'M146 150V128H144V120Q144 116 148 116Q150 104 152 100L156 100L156 108Q158 112 154 114V124H176Q180 124 180 130V150H176V136H172V150H168V136H154V150Z',
  ]],
  // Doha: the Doha Tower, the Museum of Islamic Art and a dhow on the bay.
  ['doha', 25.2854, 51.531, () => [
    { d: R(150, 88, 16, 62) + R(170, 76, 14, 74), o: 0.5 },
    { d: 'M118 150V50Q118 28 128 22Q138 28 138 50V150Z' + range(34, 146, 8).map(y => R(122, y, 12, 1.2)).join(''), eo: true }, R(127.4, 8, 1.2, 14),
    { d: R(24, 104, 64, 34) + R(36, 84, 40, 20) + R(46, 68, 20, 16) + ARCH(50, 138, 12, 20), eo: true }, P('46 68, 56 60, 66 68'),
    'M60 146Q80 152 108 144L104 140H66Z', { s: 'M84 140V108M72 112Q90 104 104 132', w: 1.4 }, P('84 110, 84 138, 102 136'),
    { s: waves(148, 0, 200), w: 1 },
  ]],
  // Abu Dhabi: the Sheikh Zayed Grand Mosque's white domes and four minarets.
  ['abudhabi', 24.4539, 54.3773, () => [
    { d: R(30, 104, 140, 34) + range(36, 166, 10).map(x => ARCH(x, 134, 5, 16)).join(''), eo: true },
    'M74 104Q74 70 100 60Q126 70 126 104Z', R(99.4, 46, 1.2, 14), C(100, 45, 2),
    DOME(56, 104, 10, 11) + DOME(144, 104, 10, 11) + DOME(40, 104, 6, 7) + DOME(160, 104, 6, 7),
    [22, 178].map(x => R(x - 3, 40, 6, 98) + R(x - 4.5, 70, 9, 2) + R(x - 4.5, 96, 9, 2) + DOME(x, 40, 4, 6) + R(x - 0.5, 28, 1, 8)).join(''),
    R(24, 138, 152, 4), { s: 'M40 146H160', w: 0.8, o: 0.6 },
  ]],
  // Hanoi: the One Pillar Pagoda on its lotus pond and the Turtle Tower on Hoan Kiem Lake.
  ['hanoi', 21.0278, 105.8342, () => [
    R(97, 106, 6, 36), { d: R(80, 82, 40, 24) + R(86, 88, 6, 12) + R(108, 88, 6, 12), eo: true },
    'M68 84Q78 80 84 70H116Q122 80 132 84Z', 'M86 70Q96 60 100 54Q104 60 114 70Z', R(99.4, 46, 1.2, 8),
    { d: R(150, 108, 22, 26) + ARCH(156, 134, 10, 14), eo: true }, R(152, 96, 18, 12), 'M146 98Q150 94 152 90H170Q172 94 176 98Z', R(155, 84, 12, 6), 'M152 86Q160 78 170 86Z',
    E(36, 140, 12, 3) + E(56, 142, 9, 2), { s: 'M36 140V128M56 142V132', w: 1 }, E(36, 126, 4, 2.2),
    { s: waves(146, 0, 200), w: 1.2 },
  ]],
  // Bali: a split temple gate, a tiered meru shrine, palms and rice terraces.
  ['bali', -8.6705, 115.2126, () => {
    const half = dir => {
      const x0 = dir < 0 ? 40 : 84;
      return P(range(0, 5, 1).flatMap(i => {
        const y = 150 - i * 18, w = 36 - i * 6;
        const xa = dir < 0 ? x0 + (36 - w) : x0, xb = xa + w;
        return dir < 0 ? [`${xa} ${y}`, `${xa} ${y - 18}`] : [`${xb} ${y}`, `${xb} ${y - 18}`];
      }).concat(dir < 0 ? ['76 60', '76 150'] : ['84 60', '84 150']).join(','));
    };
    return [
      { s: 'M0 132Q40 126 80 130T200 128M0 140Q50 134 100 138T200 136', w: 1, o: 0.6 },
      half(-1), half(1),
      R(148, 110, 22, 40), range(0, 4, 1).map(i => { const y = 110 - i * 14, w = 40 - i * 7; return `M${159 - w / 2} ${y}Q${159} ${y - 12} ${159 + w / 2} ${y}Z`; }).join(''), R(158.4, 42, 1.2, 14),
      ...palm(14, 82, -4), ...palm(190, 72, 4),
    ];
  }],
  // Oceania
  ['sydney', -33.8688, 151.2093, () => [
    { s: 'M0 96Q56 38 112 96M0 104Q56 62 112 104', w: 3 }, { d: R(0, 104, 124, 4) + R(106, 86, 12, 22), o: 0.65 },
    { s: range(10, 102, 8).map(x => { const t = x / 112; const y = (1 - t) ** 2 * 96 + 2 * t * (1 - t) * 38 + t * t * 96; return `M${x} ${y.toFixed(1)}V104`; }).join(''), w: 0.7 },
    R(66, 130, 132, 10),
    'M80 130Q86 96 108 84Q100 108 102 130Z', 'M100 130Q108 100 130 90Q122 112 122 130Z', 'M122 130Q132 92 158 82Q148 110 146 130Z', 'M148 130Q156 104 176 98Q170 116 170 130Z', 'M166 130Q172 114 188 110Q184 122 186 130Z',
    { s: 'M0 146Q20 142 40 146T80 146T120 146T160 146T200 146', w: 1.4 },
  ]],
];

// ---------- regional fallbacks ----------
const REGIONS = {
  europe: () => [
    { d: P('40 150, 40 96, 52 84, 64 96, 64 150') + windows(42, 100, 20, 44, 2, 3, 4, 7), eo: true },
    { d: P('64 150, 64 104, 76 92, 88 104, 88 150') + windows(66, 108, 20, 36, 2, 3, 4, 7), eo: true },
    { d: R(96, 64, 22, 86) + ARCH(102, 100, 10, 18) + C(107, 76, 5), eo: true }, P('94 64, 107 14, 120 64'), C(107, 12, 2),
    { d: R(118, 100, 48, 50) + ARCH(130, 150, 10, 22) + ARCH(150, 150, 10, 22), eo: true }, P('118 100, 142 80, 166 100'),
    ...tree(24, 10), ...tree(180, 12),
  ],
  turkey: () => [
    { d: R(30, 112, 26, 38) + windows(32, 116, 22, 28, 2, 2, 4, 7), eo: true }, P('28 112, 43 102, 58 112'),
    { d: R(150, 108, 30, 42) + windows(152, 112, 26, 32, 2, 2, 4, 7), eo: true }, P('148 108, 165 96, 182 108'),
    { d: R(70, 112, 70, 38) + range(76, 130, 10).map(x => ARCH(x, 132, 5, 12)).join(''), eo: true },
    DOME(105, 112, 26, 24) + DOME(80, 112, 9, 7) + DOME(130, 112, 9, 7), R(104.4, 78, 1.2, 10), C(105, 77, 1.8),
    ...minaret(64, 42), ...minaret(146, 54),
  ],
  mena: () => [
    { d: R(16, 112, 40, 38) + windows(18, 116, 36, 28, 3, 2, 4, 6), eo: true }, range(16, 52, 6).map(x => R(x, 108, 3, 4)).join(''),
    { d: R(66, 104, 56, 46) + ARCH(86, 150, 16, 26), eo: true }, DOME(94, 104, 20, 22), R(93.4, 74, 1.2, 9),
    { d: R(130, 40, 16, 110) + ARCH(134, 70, 8, 12), eo: true }, R(128, 36, 20, 4), R(133, 22, 10, 14), DOME(138, 22, 5, 6),
    ...palm(170, 70, 4), ...palm(188, 52, -3),
  ],
  africa: () => [
    { s: 'M48 150Q50 120 46 96M46 104L34 92M46 100L60 90', w: 3 }, 'M14 92Q46 70 82 90Q48 98 14 92Z',
    { d: R(96, 92, 18, 58) + R(118, 76, 20, 74) + R(142, 104, 26, 46) + windows(98, 96, 14, 50, 2, 6, 3, 4) + windows(120, 80, 16, 66, 3, 8, 3, 4), eo: true },
    'M176 150V112Q188 100 200 112V150Z',
  ],
  eastAsia: () => {
    const tiers = range(0, 4, 1).map(i => {
      const y = 140 - i * 22, w = 56 - i * 8;
      return R(100 - (w - 16) / 2, y - 12, w - 16, 12) + `M${100 - w / 2 - 6} ${y - 12}Q${100 - w / 2} ${y - 16} ${100 - w / 2 + 6} ${y - 22}H${100 + w / 2 - 6}Q${100 + w / 2} ${y - 16} ${100 + w / 2 + 6} ${y - 12}Z`;
    }).join('');
    return [
      { d: R(14, 96, 18, 54) + R(34, 108, 14, 42) + R(152, 90, 16, 60) + R(170, 104, 20, 46), o: 0.6 },
      R(78, 140, 44, 10), tiers, R(99.3, 30, 1.4, 14),
    ];
  },
  southAsia: () => [
    R(56, 128, 88, 22), R(66, 118, 68, 10),
    'M70 118Q70 84 100 76Q130 84 130 118Z', R(94, 64, 12, 12), P('94 64, 100 30, 106 64'),
    ...palm(30, 70, -4), ...palm(170, 76, 5),
  ],
  northAmerica: () => [
    { d: R(20, 76, 26, 74) + R(50, 44, 28, 106) + R(82, 92, 22, 58) + R(108, 60, 24, 90) + R(136, 100, 20, 50) +
      windows(22, 80, 22, 66, 3, 8, 3, 4) + windows(52, 50, 24, 96, 3, 12, 3, 4) + windows(110, 64, 20, 82, 3, 10, 3, 4), eo: true },
    R(63.4, 26, 1.2, 18), R(140, 84, 12, 10), 'M139 84Q146 76 153 84Z', { s: 'M142 94L140 100M150 94L152 100', w: 1.2 },
    ...tree(172, 10), ...tree(190, 8),
  ],
  latinAmerica: () => [
    { d: 'M0 150V108L40 74L76 98L120 64L164 92L200 76V150Z', o: 0.4 },
    { d: R(66, 96, 68, 54) + ARCH(92, 150, 16, 30) + C(100, 108, 5), eo: true }, P('80 96, 100 82, 120 96'),
    { d: R(62, 60, 16, 36) + R(122, 60, 16, 36) + ARCH(66, 84, 8, 14) + ARCH(126, 84, 8, 14), eo: true },
    DOME(70, 60, 8, 9) + DOME(130, 60, 8, 9), R(69.4, 44, 1.2, 8) + R(129.4, 44, 1.2, 8),
    ...palm(30, 64, -4), ...palm(176, 70, 4),
  ],
  oceania: () => [
    { d: R(30, 86, 20, 64) + R(54, 70, 24, 80) + R(82, 98, 18, 52) + R(104, 80, 22, 70) + windows(54, 76, 24, 70, 3, 9, 3, 4), eo: true },
    'M140 140L156 104V140ZM158 140L172 110V140Z', 'M136 140H178L172 146H142Z',
    { s: 'M0 148Q20 144 40 148T80 148T120 148T160 148T200 148', w: 1.4 },
  ],
  russia: () => [
    { d: R(16, 102, 36, 48) + R(140, 96, 40, 54) + windows(18, 106, 32, 40, 3, 4, 4, 5) + windows(142, 100, 36, 46, 3, 5, 4, 5), eo: true },
    { d: R(76, 96, 48, 54) + ARCH(94, 150, 12, 24), eo: true },
    R(92, 66, 16, 30), ONION(100, 66, 16, 22), R(99.4, 36, 1.2, 9),
    R(78, 84, 8, 12) + ONION(82, 84, 9, 12) + R(116, 84, 8, 12) + ONION(120, 84, 9, 12),
  ],
  default: () => [
    { d: R(20, 96, 24, 54) + R(48, 70, 26, 80) + R(78, 104, 20, 46) + R(102, 82, 22, 68) + R(128, 110, 18, 40) + R(150, 90, 22, 60) +
      windows(48, 76, 26, 70, 3, 9, 3, 4) + windows(102, 88, 22, 58, 3, 7, 3, 4) + windows(150, 96, 22, 50, 3, 6, 3, 4), eo: true },
    R(60.4, 54, 1.2, 16), ...tree(184, 10),
  ],
};

function inTurkey(lat, lon) {
  if (!(lat >= 35.8 && lat <= 42.2 && lon >= 25.6 && lon <= 44.8)) return false;
  if (lon < 26.6 && lat < 40) return false;                // Greek islands (Lesbos, Chios, Samos)
  if (lat < 36.9 && lon > 36.7) return false;              // Syria and northern Iraq (Aleppo, Mosul, Erbil)
  if (lon > 42.6 && lat < 37.2) return false;              // Iraqi Kurdistan
  if (lat > 41.2 && lon > 41.6) return false;              // Georgia (Batumi, Tbilisi)
  if (lon > 43.6 && lat > 40.1) return false;              // Armenia and Georgia (Yerevan, Gyumri)
  return true;
}

function regionFor(lat, lon) {
  if (inTurkey(lat, lon)) return 'turkey';
  if (lat >= 38.8 && lat <= 43.6 && lon >= 40 && lon <= 46.8) return 'europe'; // Georgia and Armenia: old churches
  if (lat >= 35 && lat < 37.5 && lon >= 35.5 && lon <= 48) return 'mena';      // northern Syria and Iraq
  if (lat >= 37.5 && lat <= 46 && lon > 46 && lon < 88) return 'default'; // Caspian and Central Asia: neutral skyline
  if (lat > 45 && lon > 40 && !(lat < 50 && lon > 87 && lon < 120)) return 'russia'; // Mongolia stays out
  if (lon < -150) return 'northAmerica';                   // Hawaii and Alaska
  if (lon < -30 && lat > 24.5 && lon > -98) return 'northAmerica'; // Florida, Gulf coast and the US South
  if (lat >= 35 && lon >= -25 && lon <= 40) return 'europe';
  if (lat >= 12 && lat < 35 && lon >= -18 && lon <= 63) return 'mena';
  if (lat >= 12 && lat <= 42 && lon > 35 && lon <= 63) return 'mena';
  if (lat < 12 && lat >= -36 && lon >= -18 && lon <= 52) return 'africa';
  if (lon >= 60 && lon <= 97 && lat >= 5 && lat < 37) return 'southAsia';
  if (lon > 97 && lon <= 128 && lat > -11 && lat < 20) return 'southAsia';
  if (lon >= 97 && lon <= 150 && lat >= 20 && lat <= 55) return 'eastAsia';
  if (lon < -30 && lat <= 32.5 && lat >= -56 && !(lat > 24 && lon < -97)) return 'latinAmerica';
  if (lon < -30 && lat > 15) return 'northAmerica';
  if (lat < -10 && lon > 110) return 'oceania';
  return 'default';
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const Re = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return Re * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Returns { key, elements } for a city: its own landmark if it's one of the
// featured cities (within ~45 km), otherwise its region's scene.
export function sceneFor(city) {
  if (!city || typeof city.lat !== 'number' || typeof city.lon !== 'number') return { key: 'default', elements: REGIONS.default() };
  let best = null, bestDist = Infinity;
  for (const c of CITIES) {
    const d = haversineKm(city.lat, city.lon, c[1], c[2]);
    if (d < bestDist) { bestDist = d; best = c; }
  }
  if (best && bestDist <= 45) return { key: best[0], elements: best[3]() };
  const region = regionFor(city.lat, city.lon);
  return { key: region, elements: REGIONS[region]() };
}

export const FEATURED_CITY_KEYS = CITIES.map(c => c[0]);
export const REGION_KEYS = Object.keys(REGIONS);
export function sceneByKey(key) {
  const c = CITIES.find(x => x[0] === key);
  if (c) return c[3]();
  return (REGIONS[key] || REGIONS.default)();
}

// ---------- rendering ----------
function seeded(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619) >>> 0;
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296;
}

// Faint generic skyline across the whole width, with windows that light up at night.
function backSkyline(seedStr) {
  const rnd = seeded(seedStr || 'city');
  let x = -4, bodies = '', lights = '';
  while (x < 324) {
    const w = 12 + Math.round(rnd() * 20), h = 26 + Math.round(rnd() * 58);
    bodies += R(x, 160 - h, w, h);
    if (rnd() > 0.7) bodies += R(x + w / 2 - 0.6, 160 - h - 8, 1.2, 8);
    for (let wy = 160 - h + 6; wy < 154; wy += 8) {
      for (let wx = x + 3; wx < x + w - 4; wx += 6) if (rnd() > 0.72) lights += R(wx, wy, 2.4, 3);
    }
    x += w + Math.round(rnd() * 3);
  }
  return `<path class="lm-back" d="${bodies}"/><path class="lm-win" d="${lights}"/>`;
}

function elementSvg(el) {
  if (Array.isArray(el)) return el.map(elementSvg).join('');
  // A group that drifts gently (hot-air balloons, boats): the outer group takes the
  // entrance animation, the inner one floats.
  if (el && el.float) return `<g><g class="lm-float" style="animation-duration:${el.dur || 7}s;animation-delay:${el.delay || 0}s">${el.float.map(elementSvg).join('')}</g></g>`;
  if (typeof el === 'string') return `<path d="${el}"/>`;
  if (el.text) return `<text x="${el.x}" y="${el.y}" font-size="${el.size}" transform="rotate(${el.rot || 0} ${el.x} ${el.y})" class="lm-text">${el.text}</text>`;
  if (el.s) return `<path class="lm-stroke" d="${el.s}" stroke-width="${el.w || 2}"${el.o ? ` stroke-opacity="${el.o}"` : ''}/>`;
  return `<path${el.cls ? ` class="${el.cls}"` : ''} d="${el.d}"${el.eo ? ' fill-rule="evenodd"' : ''}${el.o ? ` fill-opacity="${el.o}"` : ''}/>`;
}

// ---------- Istanbul: the Bosphorus across the whole hero ----------
// In the hero's own 320x160 box. Behind the mosque: the bridge (lights up and slowly
// changes color at night). In front: the blue water with a shimmer, the bridge
// lights' reflections at night, a ferry crossing, and seagulls gliding by day.
function istanbulLayers() {
  const towers = [36, 284], top = 40, deck = 112, mid = 210;
  const cableAt = t => [(1 - t) ** 2 * towers[0] + 2 * t * (1 - t) * 160 + t * t * towers[1], (1 - t) ** 2 * top + 2 * t * (1 - t) * mid + t * t * top];
  const tower = x => R(x - 4.5, top, 3, 160 - top) + R(x + 1.5, top, 3, 160 - top) + R(x - 4.5, top, 9, 3) + R(x - 4.5, 72, 9, 2.4) + R(x - 4.5, 98, 9, 2.4);
  const hangers = range(0.04, 0.97, 0.03).map(t => { const [x, y] = cableAt(t); return y < deck - 1 ? `M${x.toFixed(1)} ${y.toFixed(1)}V${deck}` : ''; }).join('');
  const cables = `M${towers[0]} ${top}Q160 ${mid} ${towers[1]} ${top}M${towers[0]} ${top}L-10 ${deck + 6}M${towers[1]} ${top}L330 ${deck + 6}`;
  // Night lights: dots along the main cable, the side cables and the deck.
  const cableLights = range(0.02, 0.99, 0.035).map(t => { const [x, y] = cableAt(t); return y <= deck ? C(+x.toFixed(1), +y.toFixed(1), 1.25) : ''; }).join('');
  const sideLights = range(0.1, 0.95, 0.15).map(t => C(towers[0] - (towers[0] + 10) * t, top + (deck + 6 - top) * t, 1.25) + C(towers[1] + (330 - towers[1]) * t, top + (deck + 6 - top) * t, 1.25)).join('');
  const deckLights = range(-6, 326, 7).map(x => C(x, deck + 1.4, 0.75)).join('');
  const back = `
    <g class="ist-bridge">
      <path d="${towers.map(tower).join('')}${R(-10, deck, 340, 3.2)}"/>
      <path class="ist-cable" d="${cables}"/>
      <path class="ist-hanger" d="${hangers}"/>
    </g>
    <g class="ist-lights"><path d="${cableLights}${sideLights}"/><path class="ist-deck-lights" d="${deckLights}"/></g>`;
  // Water: a band across the bottom, with a soft shimmer and, at night, light reflections.
  const shimmer = [[24, 149, 22], [96, 154, 30], [176, 147, 18], [236, 155, 26], [292, 150, 20], [140, 158, 16]]
    .map(([x, y, w]) => `M${x} ${y}h${w}`).join('');
  const reflections = range(0.1, 0.92, 0.1).map(t => { const [x] = cableAt(t); return R(+x.toFixed(1) - 0.8, 144, 1.6, 14); }).join('') + R(towers[0] - 1, 144, 2, 15) + R(towers[1] - 1, 144, 2, 15);
  const ferry = `
    <g class="ist-ferry-move"><g class="ist-ferry">
      <path class="ist-ferry-hull" d="M-17 146L17 146L14 150L-14 150Z M-12 146V141H11V146Z M-8 141V137.5H7V141Z M-1.2 137.5V133H1.6V137.5Z"/>
      <path class="ist-ferry-win" d="${range(-10, 8, 3.6).map(x => R(x, 142.5, 2, 2)).join('')}${R(-6, 138.5, 1.8, 1.6)}${R(-2.5, 138.5, 1.8, 1.6)}${R(1, 138.5, 1.8, 1.6)}${R(4.5, 138.5, 1.8, 1.6)}"/>
    </g></g>`;
  const gull = (y, dur, delay, s) => `
    <g class="ist-gull-path" style="animation-duration:${dur}s;animation-delay:${delay}s"><g transform="translate(0 ${y}) scale(${s})">
      <path class="ist-gull" d="M-6 0Q-3.2 -3.4 0 0.4Q3.2 -3.4 6 0" style="animation-delay:${(delay % 1).toFixed(2)}s"/>
    </g></g>`;
  const front = `
    <path class="ist-water" d="M-10 142Q40 140 80 142T160 142T240 142T330 142V170H-10Z"/>
    <path class="ist-shimmer" d="${shimmer}"/>
    <path class="ist-reflect" d="${reflections}"/>
    ${ferry}
    <g class="ist-gulls">${gull(30, 26, -4, 1)}${gull(52, 34, -19, 0.75)}${gull(22, 40, -31, 0.6)}${gull(64, 30, -12, 0.85)}</g>`;
  const defs = `<defs><linearGradient id="istWater" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" class="ist-water-top"/><stop offset="1" class="ist-water-bottom"/></linearGradient></defs>`;
  return { defs, back, front };
}

// ---------- Warsaw: the Old Town, Syrenka, a tram and the Vistula ----------
// In the hero's 320x160 box, in front of the Palace of Culture: the colorful Old Town
// houses of the Market Square on the left, the Mermaid of Warsaw on the riverbank,
// a red and yellow tram crossing, the Vistula, and birds by day. At night the house
// windows glow and the palace's lights reflect in the river.
const WARS_HOUSES = [
  // [x, width, height, gable: 't' triangle | 'r' rounded | 's' stepped, color]
  [-4, 15, 27, 't', '#e7b450'], [11, 13, 33, 'r', '#cf6a52'], [24, 14, 25, 's', '#82b08f'], [38, 13, 31, 't', '#efd389'],
  [51, 15, 24, 'r', '#b97393'], [66, 13, 29, 's', '#e39a5c'], [79, 14, 22, 't', '#7ea6d3'], [93, 12, 26, 'r', '#e8c26a'],
];
function warsawLayers() {
  const base = 146;
  let houses = '', shades = '', wins = '';
  for (const [x, w, h, g, color] of WARS_HOUSES) {
    const top = base - h, gh = 7;
    const gable = g === 't' ? P(`${x} ${top}, ${x + w / 2} ${top - gh}, ${x + w} ${top}`)
      : g === 'r' ? `M${x} ${top}Q${x + w / 2} ${top - gh * 1.6} ${x + w} ${top}Z`
      : `M${x} ${top}h${w * 0.2}v${-gh * 0.45}h${w * 0.2}v${-gh * 0.5}h${w * 0.2}v${gh * 0.5}h${w * 0.2}v${gh * 0.45}h${w * 0.2}Z`;
    const body = R(x, top, w, h) + gable;
    houses += `<path class="wars-house" style="fill:${color}" d="${body}"/>`;
    shades += body;
    for (let wy = top + 4; wy < base - 5; wy += 6) for (const wx of [x + w * 0.22, x + w * 0.6]) wins += R(+wx.toFixed(1), wy, 2.4, 3);
  }
  // The Mermaid of Warsaw (Syrenka), as on the city's arms: sword raised over her head,
  // round shield in front, a thick fish tail curling down and up into a fin, on a pedestal.
  // Drawn in its own 40x64 box, then placed on the riverbank.
  const syrenka = `
    <g class="wars-syrenka" transform="translate(102 101) scale(0.7)">
      <path d="${R(6, 54, 26, 10)}${R(4, 50.6, 30, 3.6)}"/>
      <path d="M14 30C9.6 38 10 46.8 18 50.6C24.6 53.6 31.4 50.6 33.6 44.2L35.6 38.2L30.8 39.6C29 43.2 25.2 44.6 21.6 42.8C18.4 41 18.4 35.4 22.2 30Z"/>
      <path d="M32.2 41.4L37.4 29.6L36.8 37L41.8 33.6L35.8 43.8Z"/>
      <path d="M15 30.4L14.4 20.4Q15 16 18.6 15.4Q22.2 16 22.8 20.4L22.2 30.4Z"/>
      <path d="${C(18.6, 11.4, 3.3)}${C(15.4, 12.8, 1.7)}"/>
      <path fill-rule="evenodd" d="${C(14.6, 25.4, 6.2)}${C(14.6, 25.4, 4.4)}${C(14.6, 25.4, 1.9)}"/>
      <path class="wars-stroke" d="M21.6 17.6L23.8 10L20.8 5.4" stroke-width="2.4"/>
      <path class="wars-stroke" d="M18.4 7.2L22.8 3.8" stroke-width="1.5"/>
      <path class="wars-stroke" d="M21 5.2L38.6 -1.4" stroke-width="2.4"/>
    </g>`;
  const tram = `
    <g class="wars-tram-move"><g class="wars-tram">
      <path class="wars-tram-red" d="${R(-17, 136.5, 34, 8)}"/>
      <path class="wars-tram-yellow" d="${R(-17, 136.5, 34, 3.4)}"/>
      <path class="wars-tram-win" d="${range(-15, 12, 5.2).map(x => R(x, 137.2, 3.8, 2.4)).join('')}"/>
      <path class="wars-tram-roof" d="${R(-15, 135.3, 30, 1.3)}"/>
      <path class="wars-stroke wars-panto" d="M-2 135.3L1 131L-2 128.5" stroke-width="0.7"/>
    </g></g>`;
  const bird = (y, dur, delay, s) => `
    <g class="ist-gull-path" style="animation-duration:${dur}s;animation-delay:${delay}s"><g transform="translate(0 ${y}) scale(${s})">
      <path class="ist-gull" d="M-5 0Q-2.6 -2.8 0 0.3Q2.6 -2.8 5 0" style="animation-delay:${(delay % 1).toFixed(2)}s;animation-duration:0.8s"/>
    </g></g>`;
  const shimmer = [[20, 151, 18], [90, 155, 26], [170, 150, 20], [232, 156, 24], [286, 152, 18]].map(([x, y, w]) => `M${x} ${y}h${w}`).join('');
  // Night reflections: the palace's light (center ~206), its colored crown, and the house windows.
  const reflect = R(194, 148, 3, 11) + R(201, 147, 2, 13) + R(206, 148, 3, 12) + R(213, 147, 2, 11) + R(218, 148, 3, 10);
  const houseReflect = WARS_HOUSES.map(([x, w]) => R(x + w * 0.3, 149, 1.4, 6)).join('');
  const defs = `<defs><linearGradient id="warsWater" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" class="wars-water-top"/><stop offset="1" class="wars-water-bottom"/></linearGradient></defs>`;
  const front = `
    <g class="wars-houses">${houses}<path class="wars-house-shade" d="${shades}"/><path class="wars-win" d="${wins}"/></g>
    ${syrenka}
    <path class="wars-rail" d="M-10 145.2H330"/>
    ${tram}
    <path class="wars-water" d="M-10 146Q40 144.5 80 146T160 146T240 146T330 146V172H-10Z"/>
    <path class="ist-shimmer" d="${shimmer}"/>
    <path class="wars-reflect" d="${reflect}"/>
    <path class="wars-reflect-warm" d="${houseReflect}"/>
    <g class="ist-gulls">${bird(26, 24, -6, 0.9)}${bird(40, 30, -15, 0.7)}${bird(18, 36, -27, 0.55)}</g>`;
  return { defs, back: '', front };
}

export function renderLandmark(city) {
  const { key, elements } = sceneFor(city);
  const seed = city ? `${city.name || ''}${city.lat}` : 'city';
  // Istanbul and Warsaw get their own full-width scenes around the landmark (most of our users are there).
  const ist = key === 'istanbul' ? istanbulLayers() : key === 'warsaw' ? warsawLayers() : null;
  const lift = key === 'istanbul' ? -10 : key === 'warsaw' ? -9 : 0;
  return `
    <div class="hero-landmark" data-scene="${key}" aria-hidden="true">
      <svg viewBox="0 0 320 160" preserveAspectRatio="xMidYMax meet">
        ${ist ? ist.defs : ''}
        <g class="lm-back-wrap">${backSkyline(seed)}</g>
        ${ist && ist.back ? `<g class="lm-back-wrap">${ist.back}</g>` : ''}
        <svg class="lm-front" x="100" y="${lift}" width="213" height="160" viewBox="0 0 200 150">${elements.map(elementSvg).join('')}</svg>
        ${ist ? `<g class="ist-front">${ist.front}</g>` : ''}
      </svg>
    </div>`;
}
