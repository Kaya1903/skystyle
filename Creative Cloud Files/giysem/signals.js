// Anonymous usage signals for improving the AI stylist: was the stylist's pick worn,
// re-rolled or changed, and how was it rated. Each install gets a random id (not tied
// to a name, email or device) so we can see how one person's use goes over time.
// Nothing personal is sent: no city, no wardrobe names or photos, no typed text;
// only kinds of pieces and palette colors ("ust:sweater:lacivert").

const ID_KEY = 'giysem_anon_id_v1';
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

export function sendSignal(data) {
  if (sent >= MAX_PER_VISIT) return;
  sent++;
  const body = JSON.stringify({ ...data, anon: anonId() });
  try {
    if (navigator.sendBeacon) navigator.sendBeacon('/api/signal', new Blob([body], { type: 'application/json' }));
    else fetch('/api/signal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  } catch { /* signals must never break the app */ }
}
