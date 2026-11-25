const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const GEOCODE_GET_URL = 'https://geocoding-api.open-meteo.com/v1/get';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

const WMO_TEXT = {
  tr: {
    0: 'Açık', 1: 'Çoğunlukla açık', 2: 'Parçalı bulutlu', 3: 'Kapalı',
    45: 'Sisli', 48: 'Sisli, buzlanma riski',
    51: 'Hafif çiseleme', 53: 'Hafif çiseleme', 55: 'Hafif yağmurlu',
    56: 'Çiseleme ve buzlanma riski', 57: 'Yağmurlu, buzlanma riski',
    61: 'Hafif yağmurlu', 63: 'Yağmurlu', 65: 'Kuvvetli yağmur',
    66: 'Yağmurlu, buzlanma riski', 67: 'Kuvvetli yağmur, buzlanma riski',
    71: 'Hafif kar', 73: 'Karlı', 75: 'Yoğun kar',
    77: 'Hafif kar',
    80: 'Sağanak yağmur', 81: 'Kuvvetli sağanak', 82: 'Şiddetli sağanak',
    85: 'Kar sağanağı', 86: 'Yoğun kar sağanağı',
    95: 'Gök gürültülü fırtına', 96: 'Dolulu fırtına', 99: 'Şiddetli dolulu fırtına',
    default: 'Değişken hava',
  },
  en: {
    0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Foggy, icy patches possible',
    51: 'Light drizzle', 53: 'Drizzle', 55: 'Light rain',
    56: 'Drizzle, icy patches possible', 57: 'Rain, icy patches possible',
    61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
    66: 'Rain, icy patches possible', 67: 'Heavy rain, icy patches possible',
    71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
    77: 'Light snow',
    80: 'Rain showers', 81: 'Heavy showers', 82: 'Violent showers',
    85: 'Snow showers', 86: 'Heavy snow showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Severe thunderstorm with hail',
    default: 'Changeable weather',
  },
  es: {
    0: 'Despejado', 1: 'Mayormente despejado', 2: 'Parcialmente nublado', 3: 'Nublado',
    45: 'Niebla', 48: 'Niebla, puede haber hielo',
    51: 'Llovizna', 53: 'Llovizna', 55: 'Lluvia ligera',
    56: 'Llovizna, puede haber hielo', 57: 'Lluvia, puede haber hielo',
    61: 'Lluvia ligera', 63: 'Lluvia', 65: 'Lluvia fuerte',
    66: 'Lluvia, puede haber hielo', 67: 'Lluvia fuerte, puede haber hielo',
    71: 'Nieve ligera', 73: 'Nieve', 75: 'Nieve intensa',
    77: 'Nieve ligera',
    80: 'Chubascos', 81: 'Chubascos fuertes', 82: 'Chubascos muy fuertes',
    85: 'Chubascos de nieve', 86: 'Chubascos de nieve intensos',
    95: 'Tormenta eléctrica', 96: 'Tormenta con granizo', 99: 'Tormenta fuerte con granizo',
    default: 'Tiempo variable',
  },
  pl: {
    0: 'Bezchmurnie', 1: 'Przeważnie bezchmurnie', 2: 'Częściowe zachmurzenie', 3: 'Pochmurno',
    45: 'Mgła', 48: 'Mgła, możliwa gołoledź',
    51: 'Mżawka', 53: 'Mżawka', 55: 'Lekki deszcz',
    56: 'Mżawka, możliwa gołoledź', 57: 'Deszcz, możliwa gołoledź',
    61: 'Lekki deszcz', 63: 'Deszcz', 65: 'Ulewny deszcz',
    66: 'Deszcz, możliwa gołoledź', 67: 'Ulewny deszcz, możliwa gołoledź',
    71: 'Lekki śnieg', 73: 'Śnieg', 75: 'Intensywny śnieg',
    77: 'Lekki śnieg',
    80: 'Przelotne opady', 81: 'Silne przelotne opady', 82: 'Gwałtowne ulewy',
    85: 'Przelotne opady śniegu', 86: 'Silne opady śniegu',
    95: 'Burza', 96: 'Burza z gradem', 99: 'Silna burza z gradem',
    default: 'Zmienna pogoda',
  },
  ar: {
    0: 'صافٍ', 1: 'صافٍ غالبًا', 2: 'غائم جزئيًا', 3: 'غائم',
    45: 'ضباب', 48: 'ضباب مع احتمال تجمّد',
    51: 'رذاذ', 53: 'رذاذ', 55: 'مطر خفيف',
    56: 'رذاذ مع احتمال تجمّد', 57: 'مطر مع احتمال تجمّد',
    61: 'مطر خفيف', 63: 'مطر', 65: 'مطر غزير',
    66: 'مطر مع احتمال تجمّد', 67: 'مطر غزير مع احتمال تجمّد',
    71: 'ثلج خفيف', 73: 'ثلج', 75: 'ثلج كثيف',
    77: 'ثلج خفيف',
    80: 'زخات مطر', 81: 'زخات مطر قوية', 82: 'زخات مطر عنيفة',
    85: 'زخات ثلج', 86: 'زخات ثلج كثيفة',
    95: 'عاصفة رعدية', 96: 'عاصفة رعدية مع برد', 99: 'عاصفة رعدية شديدة مع برد',
    default: 'طقس متقلّب',
  },
  de: {
    0: 'Klar', 1: 'Überwiegend klar', 2: 'Teilweise bewölkt', 3: 'Bedeckt',
    45: 'Neblig', 48: 'Neblig, Glätte möglich',
    51: 'Leichter Nieselregen', 53: 'Nieselregen', 55: 'Leichter Regen',
    56: 'Nieselregen, Glätte möglich', 57: 'Regen, Glätte möglich',
    61: 'Leichter Regen', 63: 'Regen', 65: 'Starker Regen',
    66: 'Regen, Glätte möglich', 67: 'Starker Regen, Glätte möglich',
    71: 'Leichter Schneefall', 73: 'Schneefall', 75: 'Starker Schneefall',
    77: 'Leichter Schneefall',
    80: 'Regenschauer', 81: 'Starke Schauer', 82: 'Heftige Schauer',
    85: 'Schneeschauer', 86: 'Starke Schneeschauer',
    95: 'Gewitter', 96: 'Gewitter mit Hagel', 99: 'Schweres Gewitter mit Hagel',
    default: 'Wechselhaft',
  },
  fr: { 0: "Dégagé", 1: "Plutôt dégagé", 2: "Partiellement nuageux", 3: "Couvert", 45: "Brouillard", 48: "Brouillard, risque de verglas", 51: "Bruine légère", 53: "Bruine", 55: "Pluie faible", 56: "Bruine, risque de verglas", 57: "Pluie, risque de verglas", 61: "Pluie faible", 63: "Pluie", 65: "Forte pluie", 66: "Pluie, risque de verglas", 67: "Forte pluie, risque de verglas", 71: "Neige faible", 73: "Neige", 75: "Forte neige", 77: "Neige faible", 80: "Averses", 81: "Fortes averses", 82: "Averses violentes", 85: "Averses de neige", 86: "Fortes averses de neige", 95: "Orage", 96: "Orage avec grêle", 99: "Violent orage avec grêle", default: "Temps variable" },
  ru: { 0: "Ясно", 1: "Преимущественно ясно", 2: "Переменная облачность", 3: "Пасмурно", 45: "Туман", 48: "Туман, возможна гололедица", 51: "Слабая морось", 53: "Морось", 55: "Небольшой дождь", 56: "Морось, возможна гололедица", 57: "Дождь, возможна гололедица", 61: "Небольшой дождь", 63: "Дождь", 65: "Сильный дождь", 66: "Дождь, возможна гололедица", 67: "Сильный дождь, возможна гололедица", 71: "Небольшой снег", 73: "Снег", 75: "Сильный снег", 77: "Небольшой снег", 80: "Ливень", 81: "Сильный ливень", 82: "Очень сильный ливень", 85: "Снегопад", 86: "Сильный снегопад", 95: "Гроза", 96: "Гроза с градом", 99: "Сильная гроза с градом", default: "Переменная погода" },
  az: { 0: "Açıq", 1: "Əsasən açıq", 2: "Qismən buludlu", 3: "Tutqun", 45: "Dumanlı", 48: "Dumanlı, buzlaşma riski", 51: "Yüngül çiskin", 53: "Çiskin", 55: "Yüngül yağış", 56: "Çiskin və buzlaşma riski", 57: "Yağışlı, buzlaşma riski", 61: "Yüngül yağış", 63: "Yağışlı", 65: "Güclü yağış", 66: "Yağışlı, buzlaşma riski", 67: "Güclü yağış, buzlaşma riski", 71: "Yüngül qar", 73: "Qarlı", 75: "Güclü qar", 77: "Yüngül qar", 80: "Leysan", 81: "Güclü leysan", 82: "Şiddətli leysan", 85: "Qar leysanı", 86: "Güclü qar leysanı", 95: "Tufan", 96: "Dolulu tufan", 99: "Şiddətli dolulu tufan", default: "Dəyişkən hava" },
  zh: { 0: "晴", 1: "晴间多云", 2: "局部多云", 3: "阴", 45: "雾", 48: "雾，路面可能结冰", 51: "小毛毛雨", 53: "毛毛雨", 55: "小雨", 56: "毛毛雨，路面可能结冰", 57: "有雨，路面可能结冰", 61: "小雨", 63: "中雨", 65: "大雨", 66: "有雨，路面可能结冰", 67: "大雨，路面可能结冰", 71: "小雪", 73: "中雪", 75: "大雪", 77: "小雪", 80: "阵雨", 81: "强阵雨", 82: "暴雨", 85: "阵雪", 86: "强阵雪", 95: "雷暴", 96: "雷暴伴有冰雹", 99: "强雷暴伴有冰雹", default: "天气多变" },
  ja: { 0: "晴れ", 1: "おおむね晴れ", 2: "ところどころ曇り", 3: "曇り", 45: "霧", 48: "霧、路面凍結のおそれ", 51: "弱い霧雨", 53: "霧雨", 55: "小雨", 56: "霧雨、路面凍結のおそれ", 57: "雨、路面凍結のおそれ", 61: "小雨", 63: "雨", 65: "強い雨", 66: "雨、路面凍結のおそれ", 67: "強い雨、路面凍結のおそれ", 71: "小雪", 73: "雪", 75: "大雪", 77: "小雪", 80: "にわか雨", 81: "強いにわか雨", 82: "激しいにわか雨", 85: "にわか雪", 86: "強いにわか雪", 95: "雷雨", 96: "ひょうを伴う雷雨", 99: "ひょうを伴う激しい雷雨", default: "変わりやすい天気" },
  ko: { 0: "맑음", 1: "대체로 맑음", 2: "구름 조금", 3: "흐림", 45: "안개", 48: "안개, 결빙 주의", 51: "약한 이슬비", 53: "이슬비", 55: "약한 비", 56: "이슬비, 결빙 주의", 57: "비, 결빙 주의", 61: "약한 비", 63: "비", 65: "강한 비", 66: "비, 결빙 주의", 67: "강한 비, 결빙 주의", 71: "약한 눈", 73: "눈", 75: "많은 눈", 77: "약한 눈", 80: "소나기", 81: "강한 소나기", 82: "매우 강한 소나기", 85: "눈 소나기", 86: "강한 눈 소나기", 95: "뇌우", 96: "우박을 동반한 뇌우", 99: "우박을 동반한 강한 뇌우", default: "변덕스러운 날씨" },
  hi: { 0: "साफ़", 1: "ज़्यादातर साफ़", 2: "आंशिक बादल", 3: "बादल छाए", 45: "कोहरा", 48: "कोहरा, फिसलन का ख़तरा", 51: "हल्की फुहार", 53: "फुहार", 55: "हल्की बारिश", 56: "फुहार और फिसलन का ख़तरा", 57: "बारिश, फिसलन का ख़तरा", 61: "हल्की बारिश", 63: "बारिश", 65: "तेज़ बारिश", 66: "बारिश, फिसलन का ख़तरा", 67: "तेज़ बारिश, फिसलन का ख़तरा", 71: "हल्की बर्फ़बारी", 73: "बर्फ़बारी", 75: "भारी बर्फ़बारी", 77: "हल्की बर्फ़बारी", 80: "बौछारें", 81: "तेज़ बौछारें", 82: "बहुत तेज़ बौछारें", 85: "बर्फ़ की बौछारें", 86: "तेज़ बर्फ़ की बौछारें", 95: "आंधी-तूफ़ान", 96: "ओलों के साथ तूफ़ान", 99: "ओलों के साथ तेज़ तूफ़ान", default: "बदलता मौसम" },
};

// Collapses a WMO weather code into the handful of sky "moods" the UI animates.
export function skyKind(code) {
  if (code == null) return 'clear';
  if (code >= 95) return 'storm';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if (code === 45 || code === 48) return 'fog';
  if (code === 3) return 'cloudy';
  if (code === 2) return 'partly';
  return 'clear';
}

export function wmoToText(code, lang = 'tr') {
  const dict = WMO_TEXT[lang] || WMO_TEXT.tr;
  return dict[code] || dict.default;
}

// The geocoder only knows a city by the names used in the language it is
// asked in, so "Warszawa" searched in Turkish finds just a park in Ohio.
// First search in the app's language; if that has no real town whose name
// matches what was typed, also search in a few common languages and show
// what was found under its name in the app's language ("Varşova").
const SEARCH_LANGS = ['en', 'de', 'fr', 'es', 'it', 'pl', 'pt', 'ru', 'nl', 'tr'];
const fold = str => String(str || '').toLocaleLowerCase('en').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i').replace(/ł/g, 'l');
const isTown = r => /^PPL/.test(r.feature_code || '');

// Countries are left out: a whole country has no single weather ("Roma" → Romania).
async function searchRaw(name, lang, count) {
  const url = `${GEOCODE_URL}?name=${encodeURIComponent(name)}&count=${count}&language=${lang}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('geocode failed');
  return ((await res.json()).results || []).filter(r => !/^PCL/.test(r.feature_code || ''));
}

const toCity = r => ({
  name: r.name,
  admin: r.admin1 || r.country || '',
  country: r.country || '',
  countryCode: r.country_code || '',
  lat: r.latitude,
  lon: r.longitude,
});

export async function geocodeCity(name, lang = 'tr') {
  const first = await searchRaw(name, lang, 5);
  const q = fold(name);
  const exact = r => fold(r.name) === q;
  // The geocoder's own order is good once it knows the place (it finds Prague for
  // "Praha"). If its top answer is a real city, keep its order and
  // only move a city with exactly the typed name to the top (Kars over Karşıyaka).
  const big = r => isTown(r) && ((r.population || 0) >= 100000 || /^PPL(C|A)$/.test(r.feature_code || ''));
  if (first.length && big(first[0])) {
    const top = first.filter(r => big(r) && exact(r));
    return [...top, ...first.filter(r => !top.includes(r))].map(toCity);
  }

  const others = await Promise.all(SEARCH_LANGS.filter(l => l !== lang).map(l => searchRaw(name, l, 5).catch(() => [])));
  const byId = new Map(first.map(r => [r.id, { r, mine: true }]));
  for (const list of others) for (const r of list) if (!byId.has(r.id)) byId.set(r.id, { r, mine: false });
  // A place counts as an exact match if its name in any of the languages is what was typed ("Warsaw" for Varşova).
  const exactIds = new Set([first, ...others].flat().filter(exact).map(r => r.id));
  // Real towns first; among them bigger places first, with an exact name
  // counting as fifty times the size, and as at least a mid-size town when the
  // geocoder has no population for it (Kars beats Karşıyaka, Vienna still beats Wien, Texas).
  const weight = r => (exactIds.has(r.id) ? Math.max(r.population || 0, 50000) * 50 : (r.population || 1));
  const ranked = [...byId.values()].sort((a, b) =>
    (isTown(b.r) - isTown(a.r)) || (weight(b.r) - weight(a.r)));
  const top = ranked.slice(0, 5);
  // Places found through another language: fetch their names in the app's language.
  const local = await Promise.all(top.map(async ({ r, mine }) => {
    if (mine) return r;
    try {
      const res = await fetch(`${GEOCODE_GET_URL}?id=${r.id}&language=${lang}`);
      return res.ok ? { ...r, ...(await res.json()) } : r;
    } catch { return r; }
  }));
  return local.map(toCity);
}

const REVERSE_GEOCODE_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

// Resolves GPS coordinates to a real place name (no API key required).
// Returns null if the lookup fails or the response is unusable, callers should
// fall back to a generic "my location" label rather than surfacing an error.
// "Varşova, Polonya": the city with its country in the app's language. The
// country name comes from the browser (Intl), not from the geocoder, so it's
// short and localized. Older saved cities without a country code fall back to
// the stored country, or a short region name, or just the city.
export function cityLabel(city, lang = 'tr') {
  if (!city || !city.name) return '';
  let country = '';
  if (city.countryCode) {
    try { country = new Intl.DisplayNames([lang], { type: 'region' }).of(String(city.countryCode).toUpperCase()) || ''; } catch { country = ''; }
  }
  if (!country) country = city.country || '';
  if (!country && city.admin) {
    const parts = String(city.admin).split(',').map(x => x.trim()).filter(Boolean);
    const last = parts[parts.length - 1] || '';
    if (parts.length > 1 || last.length <= 18) country = last;
  }
  return country && country !== city.name ? `${city.name}, ${country}` : city.name;
}

export async function reverseGeocode(lat, lon, lang = 'tr') {
  const url = `${REVERSE_GEOCODE_URL}?latitude=${lat}&longitude=${lon}&localityLanguage=${lang}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('reverse geocode failed');
  const data = await res.json();
  const name = data.city || data.locality || data.principalSubdivision;
  if (!name) return null;
  const admin = [data.principalSubdivision, data.countryName].filter(v => v && v !== name).join(', ');
  return { name, admin, country: data.countryName || '', countryCode: data.countryCode || '' };
}

export async function geocodeSingle(name, lang = 'tr') {
  const url = `${GEOCODE_URL}?name=${encodeURIComponent(name)}&count=1&language=${lang}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('geocode failed');
  const data = await res.json();
  const r = (data.results || [])[0];
  if (!r) throw new Error('city not found');
  return { name: r.name, admin: r.admin1 || r.country || '', country: r.country || '', countryCode: r.country_code || '', lat: r.latitude, lon: r.longitude };
}

export async function fetchForecast(lat, lon) {
  const url = `${FORECAST_URL}?latitude=${lat}&longitude=${lon}`
    + `&current=temperature_2m,apparent_temperature,wind_speed_10m,precipitation_probability,weather_code,is_day`
    + `&hourly=apparent_temperature,wind_speed_10m,precipitation_probability`
    + `&daily=weather_code,apparent_temperature_max,apparent_temperature_min,precipitation_probability_max,wind_speed_10m_max,uv_index_max`
    + `&forecast_days=7&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('forecast failed');
  return res.json();
}

function localDateFromISO(iso) {
  // "2026-07-10T14:00" -> { date: '2026-07-10', hour: 14 }
  const [datePart, timePart] = iso.split('T');
  return { date: datePart, hour: parseInt(timePart.split(':')[0], 10) };
}

function findHourIndex(times, dateStr, hour) {
  for (let i = 0; i < times.length; i++) {
    const d = localDateFromISO(times[i]);
    if (d.date === dateStr && d.hour === hour) return i;
  }
  return -1;
}

const CONDITION_HEURISTIC = {
  tr: { high: 'Yağış ihtimali yüksek', mid: 'Parçalı bulutlu geçebilir', low: 'Açık ve yağışsız görünüyor' },
  en: { high: 'High chance of rain', mid: 'Could be partly cloudy', low: 'Looks clear and dry' },
  es: { high: 'Alta probabilidad de lluvia', mid: 'Puede estar parcialmente nublado', low: 'Parece despejado y seco' },
  pl: { high: 'Duża szansa na deszcz', mid: 'Możliwe częściowe zachmurzenie', low: 'Zapowiada się pogodnie i sucho' },
  ar: { high: 'احتمال كبير للمطر', mid: 'قد يكون غائمًا جزئيًا', low: 'يبدو صافيًا وجافًا' },
  de: { high: 'Hohe Regenwahrscheinlichkeit', mid: 'Möglicherweise teilweise bewölkt', low: 'Sieht klar und trocken aus' },
  fr: { high: "Fort risque de pluie", mid: "Peut-être partiellement nuageux", low: "Temps sec et dégagé" },
  ru: { high: "Высокая вероятность осадков", mid: "Возможна переменная облачность", low: "Похоже, будет ясно и сухо" },
  az: { high: "Yağış ehtimalı yüksəkdir", mid: "Qismən buludlu ola bilər", low: "Açıq və quraq görünür" },
  zh: { high: "降雨概率高", mid: "可能局部多云", low: "看起来晴朗干燥" },
  ja: { high: "雨の可能性が高い", mid: "ところどころ曇りそう", low: "晴れて乾いた天気になりそう" },
  ko: { high: "비 올 확률 높음", mid: "구름이 조금 낄 수 있음", low: "맑고 건조할 것 같아요" },
  hi: { high: "बारिश की संभावना ज़्यादा", mid: "आंशिक बादल हो सकते हैं", low: "साफ़ और सूखा लग रहा है" },
};

// Builds a normalized view of the forecast for a given day offset (0 = today, 1 = tomorrow)
export function buildDayView(raw, dayOffset, lang = 'tr') {
  const times = raw.hourly.time;
  // dates present in hourly.time, in order, deduped
  const uniqueDates = [...new Set(times.map(t => localDateFromISO(t).date))];
  const targetDate = uniqueDates[dayOffset] || uniqueDates[uniqueDates.length - 1];

  const partHours = { sabah: 8, ogle: 13, aksam: 19 };
  const parts = {};
  for (const [key, hour] of Object.entries(partHours)) {
    const idx = findHourIndex(times, targetDate, hour);
    parts[key] = idx >= 0 ? {
      feelsLike: Math.round(raw.hourly.apparent_temperature[idx]),
      wind: Math.round(raw.hourly.wind_speed_10m[idx]),
      rain: raw.hourly.precipitation_probability[idx] ?? 0,
    } : null;
  }

  // all hours belonging to target day, for rain-anywhere-today and evening insight
  const dayIdxs = [];
  for (let i = 0; i < times.length; i++) {
    if (localDateFromISO(times[i]).date === targetDate) dayIdxs.push(i);
  }
  const maxRain = dayIdxs.reduce((m, i) => Math.max(m, raw.hourly.precipitation_probability[i] ?? 0), 0);
  const maxWind = dayIdxs.reduce((m, i) => Math.max(m, raw.hourly.wind_speed_10m[i] ?? 0), 0);

  let hero;
  if (dayOffset === 0 && raw.current) {
    hero = {
      feelsLike: Math.round(raw.current.apparent_temperature),
      actualTemp: Math.round(raw.current.temperature_2m),
      wind: Math.round(raw.current.wind_speed_10m),
      rain: raw.current.precipitation_probability ?? 0,
      condition: wmoToText(raw.current.weather_code, lang),
      kind: skyKind(raw.current.weather_code),
      isDay: raw.current.is_day !== 0,
      hasActualTemp: true,
    };
  } else {
    const ref = parts.ogle || parts.sabah || parts.aksam || { feelsLike: 0, wind: 0, rain: 0 };
    const h = CONDITION_HEURISTIC[lang] || CONDITION_HEURISTIC.tr;
    let condition;
    if (ref.rain >= 50) condition = h.high;
    else if (ref.rain >= 20) condition = h.mid;
    else condition = h.low;
    hero = {
      feelsLike: ref.feelsLike,
      actualTemp: null,
      wind: ref.wind,
      rain: maxRain,
      condition,
      kind: ref.rain >= 50 ? 'rain' : ref.rain >= 20 ? 'partly' : 'clear',
      isDay: true,
      hasActualTemp: false,
    };
  }

  // The day's peak UV index (sunglasses from 3, a hat from 6), or null if unknown.
  const di = raw.daily && raw.daily.time ? raw.daily.time.indexOf(targetDate) : -1;
  const uvRaw = di >= 0 && raw.daily.uv_index_max ? raw.daily.uv_index_max[di] : null;
  return {
    date: targetDate,
    uvMax: typeof uvRaw === 'number' ? uvRaw : null,
    hero,
    parts,
    maxRainToday: maxRain,
    maxWindToday: maxWind,
    eveningWindow: parts.aksam,
  };
}

// Builds a 7-day summary from the daily block of the forecast response.
export function buildWeekView(raw, lang = 'tr') {
  const d = raw.daily;
  if (!d || !d.time) return [];
  return d.time.map((date, i) => {
    const feelsMax = Math.round(d.apparent_temperature_max[i]);
    const feelsMin = Math.round(d.apparent_temperature_min[i]);
    return {
      date,
      feelsMax,
      feelsMin,
      feelsLike: Math.round((feelsMax + feelsMin) / 2),
      condition: wmoToText(d.weather_code[i], lang),
      kind: skyKind(d.weather_code[i]),
      rain: d.precipitation_probability_max[i] ?? 0,
      wind: Math.round(d.wind_speed_10m_max[i] ?? 0),
      uvMax: d.uv_index_max && typeof d.uv_index_max[i] === 'number' ? d.uv_index_max[i] : null,
    };
  });
}

// The evening note under today's outfit, in every language.
const EVENING = {
  tr: {
    none: 'Akşam için ayrı tahmin yok, gündüz havasına göre hazırlanabilirsin.',
    snow: r => `Akşam kar ihtimali %${r}. Kaymaz tabanlı ve su geçirmez bir bot iyi olur.`,
    rain: r => `Akşam yağmur ihtimali %${r}. Yanına küçük bir şemsiye almayı unutma.`,
    wind: w => `Akşam rüzgar ${w} km/sa hızına çıkıyor. İnce de olsa rüzgar kesen bir şey al.`,
    colder: t => `Akşam hissedilen sıcaklık ${t}° olacak. Çıkarken yanına ekstra bir kat al.`,
    calm: 'Akşam hava sakin, ekstra bir şey almana gerek yok.',
  },
  en: {
    none: 'No separate forecast for tonight, so dress for the daytime weather.',
    snow: r => `${r}% chance of snow tonight. Waterproof boots with a grippy sole are the safest bet.`,
    rain: r => `${r}% chance of rain tonight. Take a small umbrella with you.`,
    wind: w => `Wind picks up to ${w} km/h tonight. Bring something windproof, even a thin one.`,
    colder: t => `It will feel like ${t}° tonight. Take an extra layer when you head out.`,
    calm: "Tonight looks calm. You won't need anything extra.",
  },
  es: {
    none: 'No hay un pronóstico aparte para la noche, vístete según el tiempo de día.',
    snow: r => `Probabilidad de nieve esta noche del ${r} %. Lo más seguro son botas impermeables con buena suela.`,
    rain: r => `Probabilidad de lluvia esta noche del ${r} %. Llévate un paraguas pequeño.`,
    wind: w => `Esta noche el viento sube a ${w} km/h. Lleva algo que corte el viento, aunque sea fino.`,
    colder: t => `Esta noche la sensación será de ${t}°. Llévate una capa más al salir.`,
    calm: 'La noche se presenta tranquila, no necesitas nada más.',
  },
  pl: {
    none: 'Brak osobnej prognozy na wieczór, ubierz się według pogody w dzień.',
    snow: r => `Szansa na śnieg wieczorem ${r}%. Najbezpieczniejsze są wodoodporne buty z dobrym bieżnikiem.`,
    rain: r => `Szansa na deszcz wieczorem ${r}%. Weź ze sobą mały parasol.`,
    wind: w => `Wieczorem wiatr wzmoże się do ${w} km/h. Weź coś wiatroszczelnego, nawet cienkiego.`,
    colder: t => `Wieczorem odczuwalnie będzie ${t}°. Weź dodatkową warstwę, gdy wychodzisz.`,
    calm: 'Wieczór zapowiada się spokojnie, nic więcej nie potrzebujesz.',
  },
  ar: {
    none: 'لا توجد توقعات منفصلة للمساء، البس حسب طقس النهار.',
    snow: r => `احتمال الثلج مساءً ${r}%. الأكثر أمانًا حذاء مقاوم للماء بنعل ثابت.`,
    rain: r => `احتمال المطر مساءً ${r}%. خذ معك مظلة صغيرة.`,
    wind: w => `تشتد الرياح مساءً إلى ${w} كم/س. خذ شيئًا يصد الريح ولو كان خفيفًا.`,
    colder: t => `ستكون الحرارة المحسوسة مساءً ${t}°. خذ طبقة إضافية عند خروجك.`,
    calm: 'المساء يبدو هادئًا، لا تحتاج إلى شيء إضافي.',
  },
  de: {
    none: 'Keine eigene Vorhersage für den Abend, zieh dich nach dem Wetter am Tag an.',
    snow: r => `Schneewahrscheinlichkeit heute Abend ${r} %. Am sichersten sind wasserdichte Stiefel mit griffiger Sohle.`,
    rain: r => `Regenwahrscheinlichkeit heute Abend ${r} %. Nimm einen kleinen Schirm mit.`,
    wind: w => `Heute Abend frischt der Wind auf ${w} km/h auf. Nimm etwas Winddichtes mit, auch wenn es dünn ist.`,
    colder: t => `Heute Abend fühlt es sich wie ${t}° an. Nimm eine Schicht mehr mit, wenn du rausgehst.`,
    calm: 'Der Abend sieht ruhig aus, du brauchst nichts extra.',
  },
  fr: {
    none: "Pas de prévision séparée pour ce soir, habille-toi selon la météo de la journée.",
    snow: r => `Risque de neige ce soir : ${r} %. Des bottes imperméables à semelle antidérapante, c’est le plus sûr.`,
    rain: r => `Risque de pluie ce soir : ${r} %. Prends un petit parapluie avec toi.`,
    wind: w => `Ce soir, le vent monte à ${w} km/h. Prends quelque chose de coupe-vent, même fin.`,
    colder: t => `Ce soir, il fera ${t}° ressentis. Prends une couche de plus en sortant.`,
    calm: "La soirée s’annonce calme, rien de plus à prévoir.",
  },
  ru: {
    none: "Отдельного прогноза на вечер нет, одевайся по дневной погоде.",
    snow: r => `Вечером вероятность снега ${r}%. Лучше всего непромокаемые ботинки с нескользящей подошвой.`,
    rain: r => `Вечером вероятность дождя ${r}%. Возьми с собой небольшой зонт.`,
    wind: w => `Вечером ветер усилится до ${w} км/ч. Возьми что-нибудь непродуваемое, пусть даже тонкое.`,
    colder: t => `Вечером будет ощущаться как ${t}°. Возьми с собой ещё один слой.`,
    calm: "Вечер обещает быть спокойным, ничего дополнительно брать не нужно.",
  },
  az: {
    none: "Axşam üçün ayrıca proqnoz yoxdur, gündüz havasına görə hazırlaşa bilərsən.",
    snow: r => `Axşam qar ehtimalı %${r}. Sürüşməyən altlıqlı, su keçirməyən çəkmə yaxşı olar.`,
    rain: r => `Axşam yağış ehtimalı %${r}. Yanına kiçik bir çətir götürməyi unutma.`,
    wind: w => `Axşam külək ${w} km/saata çatır. Nazik olsa da, külək kəsən bir şey götür.`,
    colder: t => `Axşam hiss olunan temperatur ${t}° olacaq. Çıxanda yanına əlavə bir qat götür.`,
    calm: "Axşam hava sakitdir, əlavə bir şey götürməyə ehtiyac yoxdur.",
  },
  zh: {
    none: "没有单独的晚间预报，按白天的天气穿就好。",
    snow: r => `晚上降雪概率 ${r}%。防水、防滑鞋底的靴子最稳妥。`,
    rain: r => `晚上降雨概率 ${r}%。记得带把小伞。`,
    wind: w => `晚上风力增强到 ${w} km/h。带件防风的外套，薄的也行。`,
    colder: t => `晚上体感 ${t}°。出门时多带一层。`,
    calm: "晚上天气平稳，不用额外带东西。",
  },
  ja: {
    none: "夜の予報は特にないので、日中の天気に合わせて大丈夫です。",
    snow: r => `夜の降雪確率は ${r}%。防水で滑りにくい靴底のブーツが安心です。`,
    rain: r => `夜の降水確率は ${r}%。小さな傘を持っていきましょう。`,
    wind: w => `夜は風が ${w} km/h まで強まります。薄手でもいいので風を防げるものを持っていきましょう。`,
    colder: t => `夜は体感 ${t}° になります。出かけるときは一枚多めに持っていきましょう。`,
    calm: "夜は穏やかそうなので、特に何もいりません。",
  },
  ko: {
    none: "저녁 예보가 따로 없어요. 낮 날씨에 맞춰 입으면 돼요.",
    snow: r => `저녁 눈 올 확률 ${r}%. 미끄럼 방지 밑창의 방수 부츠가 가장 안전해요.`,
    rain: r => `저녁 비 올 확률 ${r}%. 작은 우산을 챙기세요.`,
    wind: w => `저녁엔 바람이 ${w} km/h까지 강해져요. 얇더라도 바람을 막아 줄 옷을 챙기세요.`,
    colder: t => `저녁 체감 온도는 ${t}°예요. 나갈 때 한 겹 더 챙기세요.`,
    calm: "저녁은 잔잔할 것 같아요. 따로 챙길 건 없어요.",
  },
  hi: {
    none: "शाम का अलग पूर्वानुमान नहीं है, दिन के मौसम के हिसाब से तैयार हो जाओ।",
    snow: r => `शाम को बर्फ़ की संभावना ${r}% है। फिसलन-रोधी तले वाले वॉटरप्रूफ़ बूट सबसे सुरक्षित रहेंगे।`,
    rain: r => `शाम को बारिश की संभावना ${r}% है। एक छोटा छाता साथ रख लो।`,
    wind: w => `शाम को हवा ${w} किमी/घं तक तेज़ हो जाएगी। कुछ हवा रोकने वाला साथ रखो, भले ही पतला हो।`,
    colder: t => `शाम को तापमान ${t}° जैसा महसूस होगा। निकलते समय एक परत और साथ रखो।`,
    calm: "शाम शांत लग रही है, कुछ अलग से लेने की ज़रूरत नहीं।",
  },
};

export function eveningTip(dayView, lang = 'tr') {
  const E = EVENING[lang] || EVENING.en;
  const eve = dayView.eveningWindow;
  const heroFeels = dayView.hero.feelsLike;
  if (!eve) return E.none;
  if (eve.rain >= 50 && eve.feelsLike <= -3) return E.snow(eve.rain);
  if (eve.rain >= 50) return E.rain(eve.rain);
  if (eve.wind >= 20) return E.wind(eve.wind);
  if (heroFeels - eve.feelsLike >= 4) return E.colder(eve.feelsLike);
  return E.calm;
}
