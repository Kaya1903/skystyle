// Cloudflare Pages Function: the two AI endpoints of SkyStyle.
//
//   POST /api/analyze-photo   { image: dataURL, lang }  -> clothing item JSON
//   POST /api/style-tip       { lang, city, feelsLike, condition, wind, rain,
//                               gender, styleVibe, wardrobeSummary } -> { tip }
//
// Same behaviour as server.py (which is kept for running the app locally):
// the Anthropic API key stays on the server and never reaches the browser.
// Set ANTHROPIC_API_KEY (secret) and optionally ANTHROPIC_MODEL in the Pages
// project's settings.

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-haiku-5-5';
const LANG_NAMES = { tr: 'Turkish', en: 'English', es: 'Spanish', pl: 'Polish', ar: 'Arabic', de: 'German' };

const ANALYZE_PROMPT =
  'You are looking at a photo of a single clothing item. Reply with ONLY a compact ' +
  'JSON object (no prose, no markdown code fences) matching exactly this schema: ' +
  '{"name": string (short product name in {lang_name}, e.g. "Grey knit sweater" in English or "Gri örgü kazak" in Turkish), ' +
  '"category": one of "ust" | "ustune" | "dis" | "alt" | "ayak" | "yanina" ' +
  '(ust=top, ustune=mid-layer, dis=outerwear, alt=bottom, ayak=shoes, yanina=accessory), ' +
  '"warmth": integer 1-5 (1=very light/summer fabric, 5=thick winter piece), ' +
  '"rainOk": boolean (true if this item is water-resistant or suede/fabric-safe for light rain), ' +
  '"windproof": boolean (true only if this is a windproof outer layer), ' +
  '"color": the dominant color, one of "siyah" | "beyaz" | "gri" | "lacivert" | "bej" | "kahve" | ' +
  '"denim" | "haki" | "yesil" | "mavi" | "kirmizi" | "bordo" | "pembe" | "mor" | "sari" | "turuncu" ' +
  '(black, white, grey, navy, beige, brown, denim-blue, khaki/olive, green, blue, red, burgundy, ' +
  'pink, purple, yellow, orange, pick the closest), ' +
  '"pattern": "duz" | "desenli" (duz=solid, desenli=striped/checked/printed/any visible pattern), ' +
  '"color2": the second most visible color from the same list, or null if the item is basically one color, ' +
  '"patternType": "solid" | "stripes" | "checks" | "dots" | "floral" | "print" ' +
  '(print = a graphic, photo or big logo on the front), ' +
  '"gender": "kadin" | "erkek" | "unisex" (kadin = cut or styled for women, e.g. blouse, skirt, dress, cropped or ' +
  'fitted/belted womenswear; erkek = clearly menswear cut; unisex = plain pieces anyone wears, like a basic tee, ' +
  'hoodie, jeans, sneakers, beanie; when unsure use unisex), ' +
  '"style": the closest drawing for this item; it must match the category: ' +
  'ust -> tee | longsleeve | sweater | sweatshirt | hoodie | shirt | shortshirt | blouse | polo | tank; ' +
  'ustune -> cardigan | fleece | hoodie | sweatshirt | vest | shirt; ' +
  'dis -> jacket | puffer | coat | trench | windbreaker | bomber | blazer | vest | parka | wrapcoat | pufferw | cropjacket | blazerw ' +
  "(wrapcoat = belted women's coat, pufferw = long cinched women's puffer, cropjacket = short fitted women's jacket, blazerw = long women's blazer); " +
  'alt -> trousers | chinos | jeans | leggings | shorts | minishorts | skirt | dress; ' +
  'ayak -> sneaker | boot | sandal | loafer; ' +
  'yanina -> umbrella | bag | beanie | cap | scarf | sunglasses | catglasses, ' +
  '"details": {"hood": boolean, "zip": boolean (front zipper), "buttons": boolean (front buttons), ' +
  '"pocket": boolean (visible front pockets), "logo": boolean (small chest logo)}} ' +
  'The photo may be taken at an angle, folded, on a hanger or in poor light: judge the garment itself, ' +
  'not the background, the hanger or the lighting.';

function json(status, obj) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}

// Joins the text blocks of a Messages API response (the first block is often `thinking`).
function extractText(result) {
  const stop = result.stop_reason;
  if (stop === 'refusal') throw new Error('model declined the request');
  const text = (result.content || []).filter(b => b.type === 'text').map(b => b.text || '').join('').trim();
  if (!text) throw new Error(`no text in model response (stop_reason=${stop})`);
  return text;
}

// Pulls the JSON object out of a reply even if it came wrapped in prose or fences.
function extractJsonObject(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('no JSON object in model reply');
  return JSON.parse(text.slice(start, end + 1));
}

class UpstreamError extends Error {
  constructor(status, detail) { super(`anthropic api error ${status}`); this.status = status; this.detail = detail; }
}

async function callClaude(env, payload, timeoutMs) {
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new UpstreamError(res.status, (await res.text()).slice(0, 300));
  return extractText(await res.json());
}

// Returns an error Response if the key can't be used, else null.
function checkApiKey(env) {
  const key = env.ANTHROPIC_API_KEY;
  if (!key) return json(503, { error: 'ANTHROPIC_API_KEY not set on the server' });
  if (/[^\x00-\xff]/.test(key)) {
    return json(400, {
      error: "ANTHROPIC_API_KEY contains characters an HTTP header can't carry. This usually means a masked/partial key " +
        'was copied instead of the full key, which console.anthropic.com only shows once, right when you create it. ' +
        'Create a new key and copy it immediately.',
    });
  }
  return null;
}

async function styleTip(ctx, env) {
  const langName = LANG_NAMES[ctx.lang] || 'Turkish';
  const wardrobeSummary = ctx.wardrobeSummary || 'no saved wardrobe items';
  const v = k => (ctx[k] === undefined || ctx[k] === null ? '' : ctx[k]);
  const prompt =
    'You are a warm, concise personal stylist writing inside a weather app. ' +
    `Reply in ${langName} only, in ONE short tip of at most two short sentences. ` +
    'No greeting, no signature, no markdown, no surrounding quotes. ' +
    'Never use em dashes or en dashes; use commas or periods instead. ' +
    'Write natural, everyday language a friend would use, not literal or translated-sounding phrases. ' +
    `Context, city: ${v('city')}; feels-like temperature: ${v('feelsLike')}°C; ` +
    `condition: ${v('condition')}; wind: ${v('wind')} km/h; ` +
    `rain chance: ${v('rain')}%; clothing fit preference: ${ctx.gender || 'unisex'}; ` +
    `personal style vibe: ${ctx.styleVibe || 'casual'}; their wardrobe: ${wardrobeSummary}. ` +
    'Let the style vibe shape your wording and suggestion, casual favors relaxed easy layers, ' +
    'elegant favors polished refined pieces, sporty favors performance/athletic fabrics, minimal ' +
    'favors clean simple silhouettes, bold favors color and statement pieces. ' +
    'If a wardrobe item genuinely fits today, mention it by name naturally. Otherwise give ' +
    'one specific, actionable styling or comfort tip (fabric, layering, footwear). ' +
    "Do not just restate the temperature number, add something the person wouldn't already see on screen.";
  const payload = {
    model: env.ANTHROPIC_MODEL || DEFAULT_MODEL,
    // Thinking tokens count toward max_tokens; keep headroom so the tip isn't cut off.
    max_tokens: 1500,
    output_config: { effort: 'low' },
    messages: [{ role: 'user', content: prompt }],
  };
  return json(200, { tip: await callClaude(env, payload, 20000) });
}

async function analyzePhoto(body, env) {
  const dataUrl = body.image || '';
  if (!dataUrl.startsWith('data:') || !dataUrl.includes(',')) throw new Error('missing or invalid "image" data URL');
  const comma = dataUrl.indexOf(',');
  const header = dataUrl.slice(0, comma);
  const b64data = dataUrl.slice(comma + 1);
  const mediaType = header.includes('image/png') ? 'image/png' : 'image/jpeg';
  const payload = {
    model: env.ANTHROPIC_MODEL || DEFAULT_MODEL,
    max_tokens: 3000,
    output_config: { effort: 'low' },
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: b64data } },
        { type: 'text', text: ANALYZE_PROMPT.replace('{lang_name}', LANG_NAMES[body.lang] || 'Turkish') },
      ],
    }],
  };
  return json(200, extractJsonObject(await callClaude(env, payload, 45000)));
}

export async function onRequestPost({ request, env, params }) {
  const route = (params.path || []).join('/');
  if (route !== 'analyze-photo' && route !== 'style-tip') return json(404, { error: 'not found' });
  const keyError = checkApiKey(env);
  if (keyError) return keyError;
  try {
    const body = await request.json().catch(() => ({}));
    return route === 'style-tip' ? await styleTip(body, env) : await analyzePhoto(body, env);
  } catch (e) {
    if (e instanceof UpstreamError) return json(502, { error: e.message, detail: e.detail });
    return json(500, { error: String(e && e.message ? e.message : e) });
  }
}

export function onRequest() {
  return json(405, { error: 'use POST' });
}
