// SkyStyle sounds, all made in the browser with the Web Audio API (no audio
// files): soft taps for buttons, a dice rattle, a chime, a whoosh between tabs,
// and a quiet weather ambience (rain, wind, birds by day, crickets at night,
// distant thunder in storms).
//
// Browsers only allow audio after the user has touched the page, so nothing
// plays until the first tap. The on/off choice is remembered.

const KEY = 'giysem_sound_v1';
const VOL_KEY = 'giysem_sound_vol_v1';
// Loudest each bus can get; the user's sliders (0..1) scale these. Defaults are
// on the quiet side so the app never gets annoying.
const UI_MAX = 0.6;
const AMBIENT_MAX = 0.22;
const DEFAULT_VOLUMES = { effects: 0.5, ambient: 0.35 };
let volumes = (() => {
  try {
    const v = JSON.parse(localStorage.getItem(VOL_KEY) || 'null');
    if (v && typeof v.effects === 'number' && typeof v.ambient === 'number') return { effects: clamp01(v.effects), ambient: clamp01(v.ambient) };
  } catch { /* fall through */ }
  return { ...DEFAULT_VOLUMES };
})();
function clamp01(x) { return Math.max(0, Math.min(1, x)); }

let ctx = null;
let master = null;
let uiBus = null;
let ambientBus = null;
let noiseBuf = null;
let enabled = (() => { try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; } })();
let wantedAmbient = null;  // { kind, isDay, wind } last requested
let ambient = null;        // { key, nodes, timers, gain }

export function isSoundOn() {
  return enabled;
}

export function getVolumes() {
  return { ...volumes };
}

// kind: 'effects' | 'ambient', level 0..1 (from the sound panel's sliders).
export function setVolume(kind, level) {
  if (!(kind in volumes)) return;
  volumes = { ...volumes, [kind]: clamp01(level) };
  try { localStorage.setItem(VOL_KEY, JSON.stringify(volumes)); } catch { /* private mode */ }
  if (!ctx) return;
  const bus = kind === 'effects' ? uiBus : ambientBus;
  const max = kind === 'effects' ? UI_MAX : AMBIENT_MAX;
  bus.gain.setTargetAtTime(max * volumes[kind], ctx.currentTime, 0.05);
}

function ensure() {
  if (ctx) return true;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = enabled ? 1 : 0;
  master.connect(ctx.destination);
  uiBus = ctx.createGain();
  uiBus.gain.value = UI_MAX * volumes.effects;
  uiBus.connect(master);
  ambientBus = ctx.createGain();
  ambientBus.gain.value = AMBIENT_MAX * volumes.ambient;
  ambientBus.connect(master);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else if (enabled) ctx.resume();
  });
  return true;
}

// Call on the first user gesture: creates/resumes audio and starts the ambience.
export function unlockSound() {
  if (!enabled) return;
  if (!ensure()) return;
  if (ctx.state === 'suspended') ctx.resume();
  if (wantedAmbient && !ambient) startAmbient(wantedAmbient);
}

export function setSoundOn(on) {
  enabled = !!on;
  try { localStorage.setItem(KEY, enabled ? 'on' : 'off'); } catch { /* private mode */ }
  if (!enabled) {
    if (master) master.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
    stopAmbient();
    return;
  }
  if (!ensure()) return;
  ctx.resume();
  master.gain.setTargetAtTime(1, ctx.currentTime, 0.05);
  if (wantedAmbient) startAmbient(wantedAmbient);
}

function live() {
  return enabled && ctx && ctx.state === 'running';
}

function effectsOn() {
  return live() && volumes.effects > 0.01;
}

// ---------- building blocks ----------

function noise(dest, { type = 'bandpass', freq = 1000, q = 1, gain = 0.3, attack = 0.005, hold = 0, release = 0.08, at = 0 } = {}) {
  const t0 = ctx.currentTime + at;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + attack);
  g.gain.setValueAtTime(gain, t0 + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + hold + release);
  src.connect(f); f.connect(g); g.connect(dest);
  src.start(t0, Math.random() * 1.5);
  src.stop(t0 + attack + hold + release + 0.05);
  return f;
}

function tone(dest, { freq = 600, to = null, type = 'sine', gain = 0.2, attack = 0.004, release = 0.12, at = 0 } = {}) {
  const t0 = ctx.currentTime + at;
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + attack + release);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + release);
  o.connect(g); g.connect(dest);
  o.start(t0);
  o.stop(t0 + attack + release + 0.05);
}

// ---------- interface sounds ----------

export function playTap() {
  if (!effectsOn()) return;
  tone(uiBus, { freq: 820, to: 560, gain: 0.12, release: 0.06 });
  noise(uiBus, { freq: 3200, q: 2, gain: 0.05, release: 0.03 });
}

export function playToggle(on) {
  if (!effectsOn()) return;
  const [a, b] = on ? [620, 930] : [930, 620];
  tone(uiBus, { freq: a, gain: 0.11, release: 0.07 });
  tone(uiBus, { freq: b, gain: 0.11, release: 0.09, at: 0.06 });
}

export function playDice() {
  if (!effectsOn()) return;
  let at = 0;
  for (let i = 0; i < 6; i++) {
    noise(uiBus, { freq: 1600 + Math.random() * 1800, q: 6, gain: 0.32 - i * 0.04, release: 0.04, at });
    tone(uiBus, { freq: 300 + Math.random() * 200, type: 'triangle', gain: 0.07, release: 0.04, at });
    at += 0.045 + Math.random() * 0.05 + i * 0.012;
  }
}

export function playChime() {
  if (!effectsOn()) return;
  [1046.5, 1318.5, 1568].forEach((f, i) => {
    tone(uiBus, { freq: f, gain: 0.11, release: 0.9, at: i * 0.09 });
    tone(uiBus, { freq: f * 2, gain: 0.025, release: 0.5, at: i * 0.09 });
  });
}

export function playWhoosh() {
  if (!effectsOn()) return;
  const f = noise(uiBus, { type: 'bandpass', freq: 500, q: 0.9, gain: 0.12, attack: 0.08, release: 0.22 });
  f.frequency.exponentialRampToValueAtTime(2200, ctx.currentTime + 0.28);
}

// ---------- weather ambience ----------

function ambientKey({ kind, isDay, wind }) {
  const windy = wind >= 25 ? 'w' : '';
  return `${kind}|${isDay ? 'd' : 'n'}|${windy}`;
}

// kind: clear | partly | cloudy | fog | rain | snow | storm
export function setAmbient(next) {
  wantedAmbient = next;
  if (!live()) return;
  if (ambient && ambient.key === ambientKey(next)) return;
  startAmbient(next);
}

function stopAmbient() {
  if (!ambient) return;
  const old = ambient;
  ambient = null;
  old.timers.alive = false;
  old.timers.forEach(clearTimeout);
  old.timers.forEach(clearInterval);
  if (ctx) {
    old.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
    setTimeout(() => old.nodes.forEach(n => { try { n.stop(); } catch { /* already stopped */ } }), 2500);
  }
}

function loopNoise(dest, type, freq, q) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf; src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  src.connect(f); f.connect(dest);
  src.start(0, Math.random() * 1.5);
  return { src, f };
}

function startAmbient(cfg) {
  if (!ensure() || !enabled || ctx.state !== 'running') return;
  stopAmbient();
  const g = ctx.createGain();
  g.gain.value = 0;
  g.connect(ambientBus);
  g.gain.setTargetAtTime(1, ctx.currentTime, 0.8);
  const nodes = [];
  const timers = [];
  timers.alive = true; // recurring sounds stop rescheduling once this scene is replaced
  const { kind, isDay, wind } = cfg;
  const windy = wind >= 25;

  if (kind === 'rain' || kind === 'storm') {
    const heavy = kind === 'storm';
    const r = loopNoise(g, 'lowpass', heavy ? 1800 : 1400, 0.4);
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 350;
    r.f.disconnect(); r.f.connect(hp);
    const rg = ctx.createGain(); rg.gain.value = heavy ? 0.9 : 0.6;
    hp.connect(rg); rg.connect(g);
    nodes.push(r.src);
    // Single drops on a window sill.
    timers.push(setInterval(() => {
      if (!live() || Math.random() < 0.4) return;
      tone(g, { freq: 1800 + Math.random() * 1600, to: 900, gain: 0.03, release: 0.05 });
    }, 180));
    if (heavy) {
      const thunder = () => {
        if (live()) {
          noise(g, { type: 'lowpass', freq: 110, q: 0.7, gain: 1.4, attack: 0.25, hold: 0.4, release: 2.8 });
          noise(g, { type: 'lowpass', freq: 260, q: 0.5, gain: 0.5, attack: 0.05, hold: 0.1, release: 1.2, at: 0.15 });
        }
        if (timers.alive) timers.push(setTimeout(thunder, 9000 + Math.random() * 9000));
      };
      timers.push(setTimeout(thunder, 3000));
    }
  }

  if (windy || kind === 'snow' || kind === 'fog' || kind === 'cloudy') {
    // Wind: band-passed noise whose loudness and pitch drift slowly.
    const strength = windy ? 0.9 : kind === 'snow' ? 0.35 : 0.25;
    const w = loopNoise(g, 'bandpass', windy ? 420 : 300, 0.8);
    const wg = ctx.createGain(); wg.gain.value = strength;
    w.f.disconnect(); w.f.connect(wg); wg.connect(g);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.13;
    const lfoAmp = ctx.createGain(); lfoAmp.gain.value = strength * 0.6;
    lfo.connect(lfoAmp); lfoAmp.connect(wg.gain);
    const lfo2 = ctx.createOscillator(); lfo2.frequency.value = 0.07;
    const lfo2Amp = ctx.createGain(); lfo2Amp.gain.value = 140;
    lfo2.connect(lfo2Amp); lfo2Amp.connect(w.f.frequency);
    lfo.start(); lfo2.start();
    nodes.push(w.src, lfo, lfo2);
  }

  if ((kind === 'clear' || kind === 'partly') && !windy) {
    if (isDay) {
      // Birds: short, quick-rising chirps in little phrases.
      const birds = () => {
        if (live()) {
          const n = 2 + Math.floor(Math.random() * 4);
          const base = 2600 + Math.random() * 1400;
          for (let i = 0; i < n; i++) tone(g, { freq: base, to: base * (1.3 + Math.random() * 0.4), gain: 0.05, attack: 0.01, release: 0.07, at: i * (0.09 + Math.random() * 0.05) });
        }
        if (timers.alive) timers.push(setTimeout(birds, 1800 + Math.random() * 4200));
      };
      timers.push(setTimeout(birds, 800));
    } else {
      // Crickets: a high tone pulsed in threes.
      const crickets = () => {
        if (live()) for (let i = 0; i < 3; i++) tone(g, { freq: 4400, gain: 0.018, attack: 0.008, release: 0.03, at: i * 0.055 });
        if (timers.alive) timers.push(setTimeout(crickets, 700 + Math.random() * 900));
      };
      timers.push(setTimeout(crickets, 600));
    }
    // A barely-there air bed so the scene isn't silent between sounds.
    const bed = loopNoise(g, 'lowpass', 500, 0.3);
    const bg = ctx.createGain(); bg.gain.value = 0.08;
    bed.f.disconnect(); bed.f.connect(bg); bg.connect(g);
    nodes.push(bed.src);
  }

  ambient = { key: ambientKey(cfg), nodes, timers, gain: g };
}
