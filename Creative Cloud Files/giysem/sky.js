// Full-screen animated sky that mirrors the current weather and time of day.
// Lives outside #screen so it never gets rebuilt by the app's re-renders -
// setSky() only toggles classes and (re)starts the particle loop when the mood changes.

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let root = null;
let canvas = null;
let ctx = null;
let flashEl = null;
let current = '';
let particles = [];
let mode = null; // null | 'rain' | 'snow' | 'storm'
let raf = 0;
let lastTs = 0;
let nextFlash = 0;
// Scene extras drawn on the same canvas: birds (clear days), shooting stars
// (clear nights), wind streaks and leaves (windy days).
let scene = { kind: 'clear', isDay: true, wind: 0 };
let birds = [];
let stars = [];
let streaks = [];
let leaves = [];
let nextBirds = 0;
let nextStar = 0;
let dirty = false;     // something is on the canvas that needs clearing
let wakeTimer = 0;    // idle: wake up when the next bird/star is due

function build() {
  root = document.getElementById('sky');
  if (!root) return false;
  const clouds = Array.from({ length: 7 }, (_, i) => `<div class="cloud cloud-${i + 1}"><span></span><span></span><span></span></div>`).join('');
  root.innerHTML = `
    <div class="sky-grad"></div>
    <div class="sky-stars"></div>
    <div class="sky-sun"><div class="sun-glow"></div><div class="sun-rays"></div><div class="sun-core"></div></div>
    <div class="sky-moon"><div class="moon-glow"></div><div class="moon-core"></div></div>
    <div class="sky-clouds">${clouds}</div>
    <div class="sky-haze"></div>
    <canvas class="sky-fx"></canvas>
    <div class="sky-flash"></div>
    <div class="sky-ground"></div>
  `;
  canvas = root.querySelector('.sky-fx');
  ctx = canvas.getContext('2d');
  flashEl = root.querySelector('.sky-flash');
  buildStars(root.querySelector('.sky-stars'));
  window.addEventListener('resize', resize);
  // (A pointer/scroll parallax used to live here. It forced every glass panel
  // to re-blur the sky on each mouse move, which made the app stutter.)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else start();
  });
  resize();
  return true;
}

function buildStars(el) {
  // Deterministic pseudo-random star field so it doesn't reshuffle on reload.
  let seed = 7;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const shadows = [];
  for (let i = 0; i < 90; i++) {
    const x = (rnd() * 100).toFixed(2);
    const y = (rnd() * 70).toFixed(2);
    const a = (0.35 + rnd() * 0.65).toFixed(2);
    shadows.push(`${x}vw ${y}vh 0 ${rnd() > 0.85 ? 1 : 0}px rgba(255,255,255,${a})`);
  }
  el.style.boxShadow = shadows.join(',');
}

function resize() {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  seedParticles();
}

function seedParticles() {
  const w = window.innerWidth, h = window.innerHeight;
  particles = [];
  if (!mode) return;
  const area = (w * h) / (1280 * 800);
  if (mode === 'snow') {
    const n = Math.round(140 * Math.max(0.5, area));
    for (let i = 0; i < n; i++) {
      particles.push({ x: Math.random() * w, y: Math.random() * h, r: 1 + Math.random() * 3.2, vy: 20 + Math.random() * 45, sway: Math.random() * Math.PI * 2, swaySpeed: 0.6 + Math.random() * 1.2 });
    }
  } else {
    const n = Math.round((mode === 'storm' ? 260 : 170) * Math.max(0.5, area));
    for (let i = 0; i < n; i++) {
      particles.push({ x: Math.random() * w, y: Math.random() * h, len: 10 + Math.random() * 18, vy: 650 + Math.random() * 450, a: 0.18 + Math.random() * 0.35 });
    }
  }
}

function calmSky() {
  return scene.kind === 'clear' || scene.kind === 'partly';
}

function windy() {
  return scene.wind >= 20 && scene.kind !== 'snow';
}

function spawnBirds(w, h) {
  const n = 3 + Math.floor(Math.random() * 4);
  const dir = Math.random() < 0.5 ? 1 : -1;
  const y = h * (0.08 + Math.random() * 0.25);
  const speed = 45 + Math.random() * 30;
  const size = 7 + Math.random() * 4;
  for (let i = 0; i < n; i++) {
    birds.push({
      x: dir > 0 ? -40 - i * 26 - Math.random() * 12 : w + 40 + i * 26 + Math.random() * 12,
      y: y + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 9 + Math.random() * 4,
      vx: speed * dir, size, flap: Math.random() * Math.PI * 2, flapSpeed: 7 + Math.random() * 3,
    });
  }
}

function drawExtras(ts, dt, w, h) {
  // Birds: a loose V that flaps across a clear daytime sky now and then.
  if (calmSky() && scene.isDay && !windy()) {
    if (ts > nextBirds) { spawnBirds(w, h); nextBirds = ts + 14000 + Math.random() * 16000; }
  }
  if (birds.length) {
    ctx.strokeStyle = scene.isDay ? 'rgba(30,40,70,0.55)' : 'rgba(220,230,255,0.4)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (const b of birds) {
      b.x += b.vx * dt;
      b.flap += b.flapSpeed * dt;
      const lift = Math.sin(b.flap) * b.size * 0.55;
      ctx.beginPath();
      ctx.moveTo(b.x - b.size, b.y - lift);
      ctx.quadraticCurveTo(b.x - b.size * 0.4, b.y - b.size * 0.25, b.x, b.y);
      ctx.quadraticCurveTo(b.x + b.size * 0.4, b.y - b.size * 0.25, b.x + b.size, b.y - lift);
      ctx.stroke();
    }
    birds = birds.filter(b => b.x > -120 && b.x < w + 120);
  }

  // Shooting stars on clear nights.
  if (calmSky() && !scene.isDay && ts > nextStar) {
    nextStar = ts + 6000 + Math.random() * 9000;
    const x = w * (0.15 + Math.random() * 0.7), y = h * (0.04 + Math.random() * 0.25);
    const ang = (Math.random() < 0.5 ? 1 : -1) * (0.35 + Math.random() * 0.3);
    stars.push({ x, y, vx: Math.cos(ang) * 620 * (ang > 0 ? 1 : -1), vy: Math.abs(Math.sin(ang)) * 620, life: 0, max: 0.8 + Math.random() * 0.4 });
  }
  for (const st of stars) {
    st.life += dt;
    st.x += st.vx * dt; st.y += st.vy * dt;
    const k = 1 - st.life / st.max;
    const tail = 0.09;
    const g = ctx.createLinearGradient(st.x, st.y, st.x - st.vx * tail, st.y - st.vy * tail);
    g.addColorStop(0, `rgba(255,255,255,${0.9 * k})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(st.x, st.y); ctx.lineTo(st.x - st.vx * tail, st.y - st.vy * tail); ctx.stroke();
  }
  stars = stars.filter(st => st.life < st.max);

  // Wind: long, thin streaks sliding across, and a few leaves tumbling by.
  if (windy()) {
    const strength = Math.min(1, (scene.wind - 15) / 35);
    if (Math.random() < dt * (1.5 + strength * 4)) {
      streaks.push({ x: -260, y: h * (0.08 + Math.random() * 0.8), len: 120 + Math.random() * 180, vx: 650 + Math.random() * 450 + strength * 400, a: 0.2 + Math.random() * 0.22, wave: Math.random() * 6 });
    }
    if (scene.kind !== 'rain' && scene.kind !== 'storm' && leaves.length < 6 && Math.random() < dt * (0.25 + strength * 0.6)) {
      const hue = [28, 36, 18, 45][Math.floor(Math.random() * 4)];
      leaves.push({ x: -30, y: h * (0.3 + Math.random() * 0.6), vx: 220 + Math.random() * 220, vy: -20 + Math.random() * 40, rot: Math.random() * 6, vr: 3 + Math.random() * 5, size: 8 + Math.random() * 5, color: `hsla(${hue},70%,${48 + Math.random() * 12}%,0.85)`, sway: Math.random() * 6 });
    }
  }
  if (streaks.length) {
    ctx.lineCap = 'round'; ctx.lineWidth = 1.7;
    for (const sk of streaks) {
      sk.x += sk.vx * dt;
      sk.wave += dt * 2;
      ctx.strokeStyle = `rgba(255,255,255,${sk.a})`;
      ctx.beginPath();
      ctx.moveTo(sk.x, sk.y);
      ctx.bezierCurveTo(sk.x + sk.len * 0.33, sk.y + Math.sin(sk.wave) * 6, sk.x + sk.len * 0.66, sk.y - Math.sin(sk.wave) * 6, sk.x + sk.len, sk.y);
      ctx.stroke();
    }
    streaks = streaks.filter(sk => sk.x < w + 40);
  }
  for (const lf of leaves) {
    lf.sway += dt * 2.2;
    lf.x += lf.vx * dt; lf.y += (lf.vy + Math.sin(lf.sway) * 40) * dt; lf.rot += lf.vr * dt;
    ctx.save(); ctx.translate(lf.x, lf.y); ctx.rotate(lf.rot);
    ctx.fillStyle = lf.color;
    ctx.beginPath(); ctx.ellipse(0, 0, lf.size, lf.size * 0.45, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  leaves = leaves.filter(lf => lf.x < w + 40 && lf.y > -40 && lf.y < h + 40);
}

function frame(ts) {
  const w = window.innerWidth, h = window.innerHeight;
  // Nothing to animate right now (no rain/snow, no birds or stars in flight,
  // no wind): leave the canvas alone so the glass panels don't keep
  // re-blurring the sky, and sleep until the next bird or star is due.
  const busy = mode || windy() || birds.length || stars.length || streaks.length || leaves.length
    || (calmSky() && ts >= (scene.isDay ? nextBirds : nextStar));
  if (!busy) {
    if (dirty) { ctx.clearRect(0, 0, w, h); dirty = false; }
    raf = 0;
    lastTs = 0;
    if (calmSky()) {
      const due = (scene.isDay ? nextBirds : nextStar) - performance.now();
      clearTimeout(wakeTimer);
      wakeTimer = setTimeout(start, Math.max(100, due));
    }
    return;
  }
  raf = requestAnimationFrame(frame);
  const dt = Math.min(0.05, (ts - (lastTs || ts)) / 1000);
  lastTs = ts;
  ctx.clearRect(0, 0, w, h);
  dirty = true;
  drawExtras(ts, dt, w, h);
  if (mode === 'snow') {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (const p of particles) {
      p.sway += p.swaySpeed * dt;
      p.y += p.vy * dt;
      p.x += Math.sin(p.sway) * 18 * dt;
      if (p.y > h + 5) { p.y = -5; p.x = Math.random() * w; }
      ctx.globalAlpha = 0.45 + p.r / 7;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else if (mode) {
    const slant = 0.18;
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.3;
    for (const p of particles) {
      p.y += p.vy * dt;
      p.x += p.vy * slant * dt;
      if (p.y > h + 20) { p.y = -20; p.x = Math.random() * (w + 200) - 200; }
      ctx.strokeStyle = `rgba(220,232,255,${p.a})`;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.len * slant, p.y - p.len);
      ctx.stroke();
    }
    if (mode === 'storm' && ts > nextFlash) {
      nextFlash = ts + 3500 + Math.random() * 6000;
      flashEl.classList.remove('flash');
      void flashEl.offsetWidth;
      flashEl.classList.add('flash');
    }
  }
}

function start() {
  if (raf || reduceMotion.matches || document.hidden) return;
  clearTimeout(wakeTimer);
  lastTs = 0;
  nextFlash = performance.now() + 1500;
  raf = requestAnimationFrame(frame);
}

function stop() {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  clearTimeout(wakeTimer);
}

// kind: clear | partly | cloudy | fog | rain | snow | storm
export function setSky({ kind = 'clear', isDay = true, wind = 0 } = {}) {
  if (!root && !build()) return;
  scene = { kind, isDay, wind };
  start();
  const key = `${kind}|${isDay}`;
  if (key === current) return;
  current = key;
  birds = []; stars = []; streaks = []; leaves = [];
  nextBirds = performance.now() + 2500;
  nextStar = performance.now() + 2000;
  root.className = `sky k-${kind} ${isDay ? 'is-day' : 'is-night'}`;
  document.documentElement.dataset.sky = kind;
  document.documentElement.dataset.daytime = isDay ? 'day' : 'night';

  const nextMode = kind === 'rain' || kind === 'snow' || kind === 'storm' ? kind : null;
  if (nextMode !== mode) {
    mode = nextMode;
    stop();
    seedParticles();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    start();
  }
}
