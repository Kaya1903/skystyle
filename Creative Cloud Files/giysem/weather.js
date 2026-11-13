const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

const WMO_TEXT = {
  tr: {
    0: 'Açık', 1: 'Az bulutlu', 2: 'Parçalı bulutlu', 3: 'Kapalı',
    45: 'Sisli', 48: 'Kırağılı sis',
    51: 'Hafif çisenti', 53: 'Çisenti', 55: 'Yoğun çisenti',
    56: 'Dondurucu çisenti', 57: 'Yoğun dondurucu çisenti',
    61: 'Hafif yağmurlu', 63: 'Yağmurlu', 65: 'Kuvvetli yağmurlu',
    66: 'Dondurucu yağmur', 67: 'Kuvvetli dondurucu yağmur',
    71: 'Hafif kar yağışlı', 73: 'Kar yağışlı', 75: 'Kuvvetli kar yağışlı',
    77: 'Kar taneli',
    80: 'Sağanak yağmurlu', 81: 'Kuvvetli sağanak', 82: 'Şiddetli sağanak',
    85: 'Kar sağanağı', 86: 'Kuvvetli kar sağanağı',
    95: 'Gök gürültülü fırtına', 96: 'Dolulu fırtına', 99: 'Şiddetli dolulu fırtına',
    default: 'Değişken hava',
  },
  en: {
    0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Freezing fog',
    51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
    56: 'Freezing drizzle', 57: 'Heavy freezing drizzle',
    61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
    66: 'Freezing rain', 67: 'Heavy freezing rain',
    71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Rain showers', 81: 'Heavy showers', 82: 'Violent showers',
    85: 'Snow showers', 86: 'Heavy snow showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Severe thunderstorm with hail',
    default: 'Changeable weather',
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
// Returns null if the lookup fails or the response is unusable — callers should
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
    if (!eve) return "No separate data for tonight — dress for what's forecast during the day.";
    if (eve.rain >= 50) return `${eve.rain}% chance of rain tonight — don't leave without a small umbrella.`;
    if (eve.wind >= 20) return `Wind picks up to ${eve.wind} km/h tonight — bring something windproof, even a thin one.`;
    if (heroFeels - eve.feelsLike >= 4) return `Feels-like drops to ${eve.feelsLike}° tonight — grab something to put on before you head out.`;
    return "Tonight looks calm — no need for anything extra.";
  }
  if (!eve) {
    return 'Akşam için ayrı bir veri yok, gün içindeki tahmine göre giyin.';
  }
  if (eve.rain >= 50) {
    return `Akşam yağış %${eve.rain} — yanına küçük bir şemsiye almadan çıkma.`;
  }
  if (eve.wind >= 20) {
    return `Akşam rüzgar ${eve.wind} km/s'ye çıkıyor, ince de olsa rüzgar kesen bir şey al yanına.`;
  }
  if (heroFeels - eve.feelsLike >= 4) {
    return `Akşam hissedilen ${eve.feelsLike}°'ye düşüyor, çıkarken üstüne bir şey al.`;
  }
  return 'Akşam hava sakin geçecek gibi, ekstra bir şeye gerek yok.';
}
