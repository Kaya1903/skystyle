const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

const WMO_TEXT = {
  tr: {
    0: 'Açık', 1: 'Çoğunlukla açık', 2: 'Parçalı bulutlu', 3: 'Kapalı',
    45: 'Sisli', 48: 'Sisli, yer buz tutabilir',
    51: 'Yağmur çiseliyor', 53: 'Yağmur çiseliyor', 55: 'Hafif yağmurlu',
    56: 'Çiseliyor, yer buz tutabilir', 57: 'Yağmurlu, yer buz tutabilir',
    61: 'Hafif yağmurlu', 63: 'Yağmurlu', 65: 'Kuvvetli yağmur',
    66: 'Yağmurlu, yer buz tutabilir', 67: 'Kuvvetli yağmur, yer buz tutabilir',
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

export async function geocodeCity(name, lang = 'tr') {
  const url = `${GEOCODE_URL}?name=${encodeURIComponent(name)}&count=5&language=${lang}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('geocode failed');
  const data = await res.json();
  return (data.results || []).map(r => ({
    name: r.name,
    admin: r.admin1 || r.country || '',
    country: r.country || '',
    lat: r.latitude,
    lon: r.longitude,
  }));
}

const REVERSE_GEOCODE_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

// Resolves GPS coordinates to a real place name (no API key required).
// Returns null if the lookup fails or the response is unusable, callers should
// fall back to a generic "my location" label rather than surfacing an error.
export async function reverseGeocode(lat, lon, lang = 'tr') {
  const url = `${REVERSE_GEOCODE_URL}?latitude=${lat}&longitude=${lon}&localityLanguage=${lang}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('reverse geocode failed');
  const data = await res.json();
  const name = data.city || data.locality || data.principalSubdivision;
  if (!name) return null;
  const admin = [data.principalSubdivision, data.countryName].filter(v => v && v !== name).join(', ');
  return { name, admin };
}

export async function geocodeSingle(name, lang = 'tr') {
  const url = `${GEOCODE_URL}?name=${encodeURIComponent(name)}&count=1&language=${lang}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('geocode failed');
  const data = await res.json();
  const r = (data.results || [])[0];
  if (!r) throw new Error('city not found');
  return { name: r.name, admin: r.admin1 || r.country || '', country: r.country || '', lat: r.latitude, lon: r.longitude };
}

export async function fetchForecast(lat, lon) {
  const url = `${FORECAST_URL}?latitude=${lat}&longitude=${lon}`
    + `&current=temperature_2m,apparent_temperature,wind_speed_10m,precipitation_probability,weather_code,is_day`
    + `&hourly=apparent_temperature,wind_speed_10m,precipitation_probability`
    + `&daily=weather_code,apparent_temperature_max,apparent_temperature_min,precipitation_probability_max,wind_speed_10m_max`
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
  tr: { high: 'Yağmur ihtimali yüksek', mid: 'Parçalı bulutlu olabilir', low: 'Açık ve kuru görünüyor' },
  en: { high: 'High chance of rain', mid: 'Could be partly cloudy', low: 'Looks clear and dry' },
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

  return {
    date: targetDate,
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
    };
  });
}

export function eveningTip(dayView, lang = 'tr') {
  const eve = dayView.eveningWindow;
  const heroFeels = dayView.hero.feelsLike;
  if (lang === 'en') {
    if (!eve) return "No separate forecast for tonight, so dress for the daytime weather.";
    if (eve.rain >= 50) return `${eve.rain}% chance of rain tonight. Take a small umbrella with you.`;
    if (eve.wind >= 20) return `Wind picks up to ${eve.wind} km/h tonight. Bring something windproof, even a thin one.`;
    if (heroFeels - eve.feelsLike >= 4) return `It will feel like ${eve.feelsLike}° tonight. Take an extra layer when you head out.`;
    return "Tonight looks calm. You won't need anything extra.";
  }
  if (!eve) {
    return 'Akşam için ayrı tahmin yok, gündüz havasına göre giyin.';
  }
  if (eve.rain >= 50) {
    return `Akşam yağmur ihtimali %${eve.rain}. Yanına küçük bir şemsiye al.`;
  }
  if (eve.wind >= 20) {
    return `Akşam rüzgar saatte ${eve.wind} km'ye çıkıyor. İnce de olsa rüzgarı kesen bir şey al.`;
  }
  if (heroFeels - eve.feelsLike >= 4) {
    return `Akşam hissedilen sıcaklık ${eve.feelsLike}° olacak. Çıkarken yanına bir kat daha al.`;
  }
  return 'Akşam hava sakin görünüyor, fazladan bir şeye gerek yok.';
}
