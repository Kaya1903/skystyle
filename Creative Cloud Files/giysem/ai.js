export async function analyzePhoto(dataUrl) {
  const res = await fetch('/api/analyze-photo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: dataUrl }),
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
