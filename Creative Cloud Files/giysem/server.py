"""Server for SkyStyle: serves the static app and proxies photo analysis /
style-tip requests to the Anthropic API so the API key never reaches the browser.

Usage:
    ANTHROPIC_API_KEY=sk-ant-... python3 server.py

Without ANTHROPIC_API_KEY set, the app still runs normally, only the
AI features (photo suggestions, smart daily tip) are disabled.

Optionally set SITE_PASSWORD to gate the whole site behind a single shared
password (HTTP Basic Auth, the browser will show its own login prompt).
Leave SITE_PASSWORD unset to keep the site open to anyone with the link.
"""

import base64
import functools
import hmac
import http.server
import json
import os
import re
import socketserver
import urllib.error
import urllib.request

PORT = int(os.environ.get('PORT', 8420))
API_KEY = os.environ.get('ANTHROPIC_API_KEY')
MODEL = os.environ.get('ANTHROPIC_MODEL', 'claude-haiku-5-5')
SITE_PASSWORD = os.environ.get('SITE_PASSWORD')
ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

ANALYZE_PROMPT = (
    'You are looking at a photo of a single clothing item. Reply with ONLY a compact '
    'JSON object (no prose, no markdown code fences) matching exactly this schema: '
    '{"name": string (short product name in Turkish, e.g. "Gri örgü kazak"), '
    '"category": one of "ust" | "ustune" | "dis" | "alt" | "ayak" | "yanina" '
    '(ust=top, ustune=mid-layer, dis=outerwear, alt=bottom, ayak=shoes, yanina=accessory), '
    '"warmth": integer 1-5 (1=very light/summer fabric, 5=thick winter piece), '
    '"rainOk": boolean (true if this item is water-resistant or suede/fabric-safe for light rain), '
    '"windproof": boolean (true only if this is a windproof outer layer), '
    '"color": the dominant color, one of "siyah" | "beyaz" | "gri" | "lacivert" | "bej" | "kahve" | '
    '"denim" | "haki" | "yesil" | "mavi" | "kirmizi" | "bordo" | "pembe" | "mor" | "sari" | "turuncu" '
    '(black, white, grey, navy, beige, brown, denim-blue, khaki/olive, green, blue, red, burgundy, '
    'pink, purple, yellow, orange, pick the closest), '
    '"pattern": "duz" | "desenli" (duz=solid, desenli=striped/checked/printed/any visible pattern), '
    '"color2": the second most visible color from the same list, or null if the item is basically one color, '
    '"patternType": "solid" | "stripes" | "checks" | "dots" | "floral" | "print" '
    '(print = a graphic, photo or big logo on the front), '
    '"gender": "kadin" | "erkek" | "unisex" (kadin = cut or styled for women, e.g. blouse, skirt, dress, cropped or '
    'fitted/belted womenswear; erkek = clearly menswear cut; unisex = plain pieces anyone wears, like a basic tee, '
    'hoodie, jeans, sneakers, beanie; when unsure use unisex), '
    '"style": the closest drawing for this item; it must match the category: '
    'ust -> tee | longsleeve | sweater | sweatshirt | hoodie | shirt | shortshirt | blouse | polo | tank; '
    'ustune -> cardigan | fleece | hoodie | sweatshirt | vest | shirt; '
    'dis -> jacket | puffer | coat | trench | windbreaker | bomber | blazer | vest | parka | wrapcoat | pufferw | cropjacket | blazerw '
    '(wrapcoat = belted women\'s coat, pufferw = long cinched women\'s puffer, cropjacket = short fitted women\'s jacket, blazerw = long women\'s blazer); '
    'alt -> trousers | chinos | jeans | leggings | shorts | minishorts | skirt | dress; '
    'ayak -> sneaker | boot | sandal | loafer; '
    'yanina -> umbrella | bag | beanie | cap | scarf | sunglasses | catglasses, '
    '"details": {"hood": boolean, "zip": boolean (front zipper), "buttons": boolean (front buttons), '
    '"pocket": boolean (visible front pockets), "logo": boolean (small chest logo)}} '
    'The photo may be taken at an angle, folded, on a hanger or in poor light: judge the garment itself, '
    'not the background, the hanger or the lighting.'
)


def extract_text(result):
    """Joins the text blocks of a Messages API response.

    Current models (e.g. Haiku 5.5) think by default, so the first content block
    is often a `thinking` block, not text; pick text blocks by type instead of
    assuming content[0]."""
    stop = result.get('stop_reason')
    if stop == 'refusal':
        raise ValueError('model declined the request')
    texts = [b.get('text', '') for b in result.get('content', []) if b.get('type') == 'text']
    text = ''.join(texts).strip()
    if not text:
        raise ValueError(f'no text in model response (stop_reason={stop})')
    return text


def extract_json_object(text):
    """Pulls the JSON object out of a reply even if it came wrapped in prose or fences."""
    start, end = text.find('{'), text.rfind('}')
    if start == -1 or end <= start:
        raise ValueError('no JSON object in model reply')
    return json.loads(text[start:end + 1])


# Only the app's own front-end files are served: the root page and top-level
# .html/.css/.js files. Everything else in the folder (this server's source,
# dotfiles, spreadsheets, directory listings) gets a 404.
PUBLIC_FILE = re.compile(r'^/[A-Za-z0-9_-]+\.(?:html|css|js)$')
PRIVATE_FILES = {'/server.py'}


def is_public_path(raw_path):
    path = raw_path.split('?', 1)[0].split('#', 1)[0]
    if path == '/':
        return True
    return bool(PUBLIC_FILE.match(path)) and path not in PRIVATE_FILES


class Handler(http.server.SimpleHTTPRequestHandler):
    def _site_authorized(self):
        if not SITE_PASSWORD:
            return True
        auth = self.headers.get('Authorization', '')
        if not auth.startswith('Basic '):
            return False
        try:
            decoded = base64.b64decode(auth[6:]).decode('utf-8')
        except Exception:
            return False
        _, _, password = decoded.partition(':')
        return hmac.compare_digest(password, SITE_PASSWORD)

    def _send_auth_challenge(self):
        body = b'Password required.'
        self.send_response(401)
        self.send_header('WWW-Authenticate', 'Basic realm="SkyStyle"')
        self.send_header('Content-Type', 'text/plain')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self):
        # Make browsers revalidate static files (cheap 304s via Last-Modified) so a
        # deploy never leaves them mixing cached old JS modules with new ones.
        if self.command in ('GET', 'HEAD'):
            self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def do_GET(self):
        if not self._site_authorized():
            self._send_auth_challenge()
            return
        if not is_public_path(self.path):
            self.send_error(404)
            return
        super().do_GET()

    def do_HEAD(self):
        if not self._site_authorized():
            self._send_auth_challenge()
            return
        if not is_public_path(self.path):
            self.send_error(404)
            return
        super().do_HEAD()

    def do_POST(self):
        if not self._site_authorized():
            self._send_auth_challenge()
            return
        if self.path == '/api/analyze-photo':
            self._handle_analyze()
        elif self.path == '/api/style-tip':
            self._handle_style_tip()
        else:
            self.send_error(404)

    def _check_api_key(self):
        """Returns True if the key is usable. Otherwise writes the error response and returns False."""
        if not API_KEY:
            self._send_json(503, {'error': 'ANTHROPIC_API_KEY not set on the server'})
            return False
        try:
            API_KEY.encode('latin-1')
        except UnicodeEncodeError:
            self._send_json(400, {
                'error': (
                    'ANTHROPIC_API_KEY contains characters an HTTP header can\'t carry. '
                    'This usually means a masked/partial key was copied (e.g. from the API '
                    'keys list page, which only shows dots for the hidden part) instead of '
                    'the full key, which console.anthropic.com only shows once, right when '
                    'you create it. Create a new key and copy it immediately.'
                ),
            })
            return False
        return True

    def _call_claude(self, payload, timeout=30):
        req = urllib.request.Request(
            ANTHROPIC_URL,
            data=json.dumps(payload).encode('utf-8'),
            headers={
                'content-type': 'application/json',
                'x-api-key': API_KEY,
                'anthropic-version': '2023-06-01',
            },
            method='POST',
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            result = json.loads(resp.read())
        return extract_text(result)

    def _handle_style_tip(self):
        if not self._check_api_key():
            return
        try:
            length = int(self.headers.get('Content-Length', 0))
            ctx = json.loads(self.rfile.read(length) or b'{}')
            lang_name = {'tr': 'Turkish', 'en': 'English', 'es': 'Spanish', 'pl': 'Polish', 'ar': 'Arabic'}.get(ctx.get('lang'), 'Turkish')
            wardrobe_summary = ctx.get('wardrobeSummary') or 'no saved wardrobe items'
            prompt = (
                f'You are a warm, concise personal stylist writing inside a weather app. '
                f'Reply in {lang_name} only, in ONE short tip of at most two short sentences. '
                f'No greeting, no signature, no markdown, no surrounding quotes. '
                f'Never use em dashes or en dashes; use commas or periods instead. '
                f'Write natural, everyday language a friend would use, not literal or translated-sounding phrases. '
                f'Context, city: {ctx.get("city", "")}; feels-like temperature: {ctx.get("feelsLike", "")}°C; '
                f'condition: {ctx.get("condition", "")}; wind: {ctx.get("wind", "")} km/h; '
                f'rain chance: {ctx.get("rain", "")}%; clothing fit preference: {ctx.get("gender", "unisex")}; '
                f'personal style vibe: {ctx.get("styleVibe", "casual")}; their wardrobe: {wardrobe_summary}. '
                f'Let the style vibe shape your wording and suggestion, casual favors relaxed easy layers, '
                f'elegant favors polished refined pieces, sporty favors performance/athletic fabrics, minimal '
                f'favors clean simple silhouettes, bold favors color and statement pieces. '
                f'If a wardrobe item genuinely fits today, mention it by name naturally. Otherwise give '
                f'one specific, actionable styling or comfort tip (fabric, layering, footwear). '
                f'Do not just restate the temperature number, add something the person wouldn\'t already see on screen.'
            )
            payload = {
                'model': MODEL,
                # Thinking tokens count toward max_tokens; keep headroom so the tip isn't cut off.
                'max_tokens': 1500,
                'output_config': {'effort': 'low'},
                'messages': [{'role': 'user', 'content': prompt}],
            }
            text = self._call_claude(payload, timeout=20)
            self._send_json(200, {'tip': text})
        except urllib.error.HTTPError as e:
            detail = e.read().decode('utf-8', 'ignore')
            self._send_json(502, {'error': f'anthropic api error {e.code}', 'detail': detail[:300]})
        except Exception as e:
            self._send_json(500, {'error': str(e)})

    def _handle_analyze(self):
        if not self._check_api_key():
            return
        try:
            length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(length) or b'{}')
            data_url = body.get('image', '')
            if not data_url.startswith('data:') or ',' not in data_url:
                raise ValueError('missing or invalid "image" data URL')
            header, b64data = data_url.split(',', 1)
            media_type = 'image/png' if 'image/png' in header else 'image/jpeg'

            payload = {
                'model': MODEL,
                'max_tokens': 3000,
                'output_config': {'effort': 'low'},
                'messages': [{
                    'role': 'user',
                    'content': [
                        {'type': 'image', 'source': {'type': 'base64', 'media_type': media_type, 'data': b64data}},
                        {'type': 'text', 'text': ANALYZE_PROMPT},
                    ],
                }],
            }
            text = self._call_claude(payload, timeout=45)
            self._send_json(200, extract_json_object(text))
        except urllib.error.HTTPError as e:
            detail = e.read().decode('utf-8', 'ignore')
            self._send_json(502, {'error': f'anthropic api error {e.code}', 'detail': detail[:300]})
        except Exception as e:
            self._send_json(500, {'error': str(e)})

    def _send_json(self, status, obj):
        body = json.dumps(obj).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        # Keep default access logging but never let it choke on odd bytes.
        super().log_message(fmt, *args)


if __name__ == '__main__':
    directory = os.path.dirname(os.path.abspath(__file__))
    handler_cls = functools.partial(Handler, directory=directory)
    # Threaded so the browser's parallel module requests don't queue behind each
    # other (or behind a slow AI call) and overflow the listen backlog.
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    socketserver.ThreadingTCPServer.daemon_threads = True
    with socketserver.ThreadingTCPServer(('', PORT), handler_cls) as httpd:
        status = 'enabled' if API_KEY else 'disabled, set ANTHROPIC_API_KEY to turn on AI photo suggestions'
        auth_status = 'password-protected' if SITE_PASSWORD else 'open to anyone with the link'
        print(f'SkyStyle serving on http://localhost:{PORT}  (AI: {status}, access: {auth_status})')
        httpd.serve_forever()
