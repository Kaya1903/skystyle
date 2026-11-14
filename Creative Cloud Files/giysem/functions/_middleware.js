// Cloudflare Pages: optional password for the whole site (same as SITE_PASSWORD
// in server.py). Leave SITE_PASSWORD unset to keep the site open.

function sameText(a, b) {
  // Compare in constant time so the password can't be guessed from response timing.
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

function passwordFrom(request) {
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Basic ')) return null;
  try {
    const bytes = Uint8Array.from(atob(auth.slice(6)), c => c.charCodeAt(0));
    const decoded = new TextDecoder().decode(bytes);
    return decoded.slice(decoded.indexOf(':') + 1);
  } catch {
    return null;
  }
}

export async function onRequest({ request, env, next }) {
  const password = env.SITE_PASSWORD;
  if (password) {
    const given = passwordFrom(request);
    if (given === null || !sameText(given, password)) {
      return new Response('Password required.', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="SkyStyle"', 'Content-Type': 'text/plain' },
      });
    }
  }
  return next();
}
