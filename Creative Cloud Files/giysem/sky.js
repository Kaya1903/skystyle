// Full-screen animated sky that mirrors the current weather and time of day.
// Lives outside #screen so it never gets rebuilt by the app's re-renders —
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

function frame(ts) {
  raf = requestAnimationFrame(frame);
  const dt = Math.min(0.05, (ts - (lastTs || ts)) / 1000);
  lastTs = ts;
  const w = window.innerWidth, h = window.innerHeight;
  ctx.clearRect(0, 0, w, h);
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
  if (raf || !mode || reduceMotion.matches || document.hidden) return;
  lastTs = 0;
  nextFlash = performance.now() + 1500;
  raf = requestAnimationFrame(frame);
}

function stop() {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
}

// kind: clear | partly | cloudy | fog | rain | snow | storm
export function setSky({ kind = 'clear', isDay = true } = {}) {
  if (!root && !build()) return;
  const key = `${kind}|${isDay}`;
  if (key === current) return;
  current = key;
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
