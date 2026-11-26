// Sends a short note to the server when something breaks in someone's browser,
// so problems on testers' phones show up even when nobody reports them.
// Only the error message, the file and line, the open screen, the language and the
// device type are sent: no wardrobe, no city, no personal data.
// Imported first in app.js so it is listening before anything else runs.

const MAX_PER_VISIT = 5;
const seen = new Set();
let sent = 0;
let context = () => ({});

// app.js tells us which screen and language are open, once its state exists.
export function setErrorContext(fn) { context = fn; }

function device() {
  const ua = navigator.userAgent || '';
  const os = /iPhone|iPad|iPod/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Mac/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : 'other';
  const browser = /CriOS|Chrome/.test(ua) ? 'Chrome' : /FxiOS|Firefox/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : 'other';
  const app = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true ? ' app' : '';
  return `${os} ${browser}${app}`;
}

function report(message, where) {
  message = String(message || '').slice(0, 300);
  // Noise that isn't ours to fix: extensions, cross-origin scripts, a lost connection.
  if (!message || /^Script error\.?$/.test(message) || /ResizeObserver loop/.test(message)) return;
  const key = message + '|' + where;
  if (seen.has(key) || sent >= MAX_PER_VISIT) return;
  seen.add(key);
  sent++;
  let ctx = {};
  try { ctx = context() || {}; } catch { /* state not ready */ }
  const body = JSON.stringify({ message, where: String(where || '').slice(0, 200), screen: ctx.screen || '', lang: ctx.lang || '', device: device(), version: ctx.version || '' });
  try {
    if (navigator.sendBeacon) navigator.sendBeacon('/api/client-error', new Blob([body], { type: 'application/json' }));
    else fetch('/api/client-error', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  } catch { /* reporting must never break the app */ }
}

const shortFile = f => String(f || '').split('/').pop().split('?')[0];

window.addEventListener('error', (e) => {
  report(e.message || (e.error && e.error.message), `${shortFile(e.filename)}:${e.lineno || 0}`);
});
window.addEventListener('unhandledrejection', (e) => {
  const r = e.reason;
  const msg = r && r.message ? r.message : String(r);
  // A failed network request (offline, timeout) isn't a bug in the app.
  if (/Failed to fetch|NetworkError|Load failed|network connection/i.test(msg)) return;
  const stack = r && r.stack ? String(r.stack).split('\n').find(l => /\.js/.test(l)) || '' : '';
  report(msg, stack.trim().replace(/^at\s+/, '').replace(/https?:\/\/[^/]+\//, ''));
});
