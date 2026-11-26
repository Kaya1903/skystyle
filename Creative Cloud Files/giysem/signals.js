// Anonymous usage signals for improving the AI stylist: was the stylist's pick worn,
// re-rolled or changed, and how was it rated. Each install gets a random id (not tied
// to a name, email or device) so we can see how one person's use goes over time.
// Nothing personal is sent: no city, no wardrobe names or photos, no typed text;
// only kinds of pieces and palette colors ("ust:sweater:lacivert").

const ID_KEY = 'giysem_anon_id_v1';
// The owner's own phones and computers: opened once with ?test=1, they stop sending
// signals, and the stats page hides everything they sent before.
const TEST_KEY = 'giysem_test_device_v1';
export function isTestDevice() {
  try { return localStorage.getItem(TEST_KEY) === '1'; } catch { return false; }
}
const MAX_PER_VISIT = 60;
let sent = 0;

function anonId() {
  try {
    let id = localStorage.getItem(ID_KEY);
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now().toString(36)).replace(/-/g, '').slice(0, 16);
      localStorage.setItem(ID_KEY, id);
    }
    return id;
  } catch {
    return 'none';
  }
}

function post(body) {
  try {
    if (navigator.sendBeacon) navigator.sendBeacon('/api/signal', new Blob([body], { type: 'application/json' }));
    else fetch('/api/signal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  } catch { /* signals must never break the app */ }
}

// ?test=1 marks this device as a test device (and tells the stats page to hide it),
// ?test=0 turns it back into a normal one. Returns true/false when it changed, else null.
export function applyTestParam() {
  let flag;
  try { flag = new URLSearchParams(location.search).get('test'); } catch { return null; }
  if (flag !== '1' && flag !== '0') return null;
  try {
    if (flag === '1') {
      localStorage.setItem(TEST_KEY, '1');
      post(JSON.stringify({ type: 'test', anon: anonId() }));
    } else {
      localStorage.removeItem(TEST_KEY);
    }
    const url = new URL(location.href);
    url.searchParams.delete('test');
    history.replaceState(null, '', url.pathname + url.search + url.hash);
  } catch { /* private mode */ }
  return flag === '1';
}

// The same switch from inside the app (an installed iPhone app has no address bar):
// seven quick taps on the "SkyStyle" name. Returns the new state.
export function toggleTestDevice() {
  const on = !isTestDevice();
  try {
    if (on) { localStorage.setItem(TEST_KEY, '1'); post(JSON.stringify({ type: 'test', anon: anonId() })); }
    else localStorage.removeItem(TEST_KEY);
  } catch { /* private mode */ }
  return on;
}

export function sendSignal(data) {
  if (sent >= MAX_PER_VISIT || isTestDevice()) return;
  sent++;
  post(JSON.stringify({ ...data, anon: anonId() }));
}
