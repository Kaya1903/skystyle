export async function analyzePhoto(dataUrl, lang = 'tr') {
  const res = await fetch('/api/analyze-photo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: dataUrl, lang }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'AI analysis failed');
  }
  return res.json();
}

export async function getSmartTip(context) {
  const res = await fetch('/api/style-tip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(context),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Style tip request failed');
  }
  const data = await res.json();
  return data.tip;
}

// Turns a typed request about today's outfit into changes the app understands
// ({ warmth, tone, vibe, change, avoid, reply }).
export async function askOutfitChange(context) {
  const res = await fetch('/api/adjust-outfit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(context),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Outfit change request failed');
  }
  return res.json();
}

// The AI stylist: picks the best of a few weather-safe outfits, may choose colors
// for suggested pieces and writes a short styling note ({ pick, colors, note }).
export async function askStylist(context) {
  const res = await fetch('/api/stylist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(context),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Stylist request failed');
  }
  return res.json();
}
