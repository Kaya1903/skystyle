import { pickWardrobeOutfit, slotOptionIds, BAND_WARMTH } from './wardrobe.js';
import { garmentVariant, itemLook } from './visuals.js';
import { VARIANTS, EXTRAS } from './outfit_variants.js';
import { COLORS, isValidColor, pairScore, colorName } from './colors.js';
import { t } from './i18n.js';

const BAND_KEYS = ['dondurucu', 'soguk', 'serin', 'ilik', 'sicak', 'cok_sicak'];
const SLOT_ICON = { ust: 'ust', ustune: 'ustune', dis: 'dis', alt: 'alt', ayak: 'ayak', yanina: 'yanina' };
const SLOT_ORDER = ['ust', 'ustune', 'dis', 'alt', 'ayak', 'yanina'];

export function bandLabel(bandKey, lang) {
  return t(lang, 'band_' + bandKey);
}

export function slotLabel(slotKey, lang) {
  return t(lang, 'cat_' + slotKey);
}

export function getBand(feelsLike) {
  if (feelsLike <= 2) return 'dondurucu';
  if (feelsLike <= 9) return 'soguk';
  if (feelsLike <= 15) return 'serin';
  if (feelsLike <= 21) return 'ilik';
  if (feelsLike <= 27) return 'sicak';
  return 'cok_sicak';
}

// Base outfits per language per band per gender. Each slot: { item, reason(ctx) }
const BASE = {
  tr: {
    dondurucu: {
      unisex: {
        ust: { item: 'İnce termal içlik, üzerine kalın örgü kazak', reason: c => `Hissedilen ${c.feelsLike}°. Tişörtle çıkılmaz, en alta ince bir termal giy` },
        ustune: { item: 'Kalın polar hırka', reason: () => `Araya bir kat daha, vücut ısın kaçmasın` },
        dis: { item: 'Dizüstü kalın mont, kapüşonlu', reason: c => `Bu soğukta kısa mont yetmez, uzun ve kalın olanı giy` },
        alt: { item: 'Astarlı kalın pantolon', reason: () => `Bu soğukta ince pantolon üşütür, astarlı olanı giy` },
        ayak: { item: 'Kalın tabanlı bot, yün çorapla', reason: () => `Kalın taban, yerden gelen soğuğu keser` },
      },
      kadin: {
        ust: { item: 'İnce termal içlik, üzerine kalın triko kazak', reason: c => `Hissedilen ${c.feelsLike}°. İnce kazak tek başına yetmez, altına termal giy` },
        ustune: { item: 'Kalın örgü hırka', reason: () => `Araya bir kat daha, vücut ısın kaçmasın` },
        dis: { item: 'Dizüstü kalın mont, kapüşonlu', reason: c => `Bu soğukta kısa mont yetmez, uzun ve kalın olanı giy` },
        alt: { item: 'Astarlı kalın pantolon (ya da kalın tayt üstüne uzun yünlü etek)', reason: () => `Bacaklarını açıkta bırakma, kalın ve astarlı bir şey giy` },
        ayak: { item: 'Kalın tabanlı, su geçirmez bot', reason: () => `Kalın taban, yerden gelen soğuğu keser` },
      },
      erkek: {
        ust: { item: 'İnce termal içlik, üzerine kalın örgü kazak', reason: c => `Hissedilen ${c.feelsLike}°. Tişörtle çıkılmaz, en alta ince bir termal giy` },
        ustune: { item: 'Kalın polar hırka', reason: () => `Araya bir kat daha, vücut ısın kaçmasın` },
        dis: { item: 'Dizüstü kalın mont, kapüşonlu', reason: c => `Bu soğukta kısa mont yetmez, uzun ve kalın olanı giy` },
        alt: { item: 'Astarlı kalın kumaş pantolon', reason: () => `Bu soğukta ince pantolon üşütür, astarlı olanı giy` },
        ayak: { item: 'Kalın tabanlı bot, yün çorapla', reason: () => `Kalın taban, yerden gelen soğuğu keser` },
      },
    },
    soguk: {
      unisex: {
        ust: { item: 'Kalın kumaşlı düz tişört, üstüne kalın örgü kazak', reason: c => `Hissedilen ${c.feelsLike}°. Tişört tek başına yetmez, üstüne kalın bir kazak giy` },
        dis: { item: 'Astarlı kumaş ceket ya da kalın parka', reason: c => `Bu havada ceketsiz çıkılmaz, astarlı bir ceket giy` },
        alt: { item: 'Kalın kumaş pantolon', reason: () => `Kalın kumaş bacaklarını soğuktan korur` },
        ayak: { item: 'Kapalı, kalın tabanlı bot', reason: () => `Bu havada kapalı ayakkabı şart` },
      },
      kadin: {
        ust: { item: 'Kalın kumaşlı düz tişört, üstüne kalın triko kazak', reason: c => `Hissedilen ${c.feelsLike}°. Tişört tek başına yetmez, üstüne kalın bir kazak giy` },
        dis: { item: 'Astarlı kumaş ceket ya da kısa kaban', reason: c => `Bu havada ceketsiz çıkılmaz, astarlı bir şey giy` },
        alt: { item: 'Kalın kumaş pantolon (ya da kalın tayt üstüne diz altı etek)', reason: () => `Kalın kumaş bacaklarını soğuktan korur` },
        ayak: { item: 'Kapalı, kalın tabanlı bot', reason: () => `Bu havada kapalı ayakkabı şart` },
      },
      erkek: {
        ust: { item: 'Kalın kumaşlı düz tişört, üstüne kalın örgü kazak', reason: c => `Hissedilen ${c.feelsLike}°. Tişört tek başına yetmez, üstüne kalın bir kazak giy` },
        dis: { item: 'Astarlı kumaş ceket', reason: c => `${c.feelsLike}° hissedilende ceketsiz durmak zor, astarlı bir ceket al` },
        alt: { item: 'Kalın kumaş pantolon', reason: () => `Kalın kumaş bacaklarını soğuktan korur` },
        ayak: { item: 'Kapalı, kalın tabanlı bot', reason: () => `Bu havada kapalı ayakkabı şart` },
      },
    },
    serin: {
      unisex: {
        ust: { item: 'Kalın kumaşlı düz tişört (beyaz ya da gri)', reason: c => `Hissedilen ${c.feelsLike}°. İnce tişört üşütebilir, kalın kumaşlı olanı seç` },
        ustune: { item: 'Önü açık kalın gömlek', reason: () => `Üşürsen giyersin, ısınırsan çıkarırsın` },
        dis: { item: 'İnce hırka ya da hafif ceket, istersen elinde taşı', reason: () => `Sabah ve akşam serinleyebilir, yanında hafif bir şey olsun` },
        alt: { item: 'Kumaş pantolon', reason: () => `Bu sıcaklıkta kumaş pantolon rahat ve yeterli` },
        ayak: { item: 'Spor ayakkabı ya da kapalı bot', reason: () => `Kapalı ayakkabı bu sıcaklıkta en rahatı` },
      },
      kadin: {
        ust: { item: 'Kalın kumaşlı düz tişört', reason: c => `Hissedilen ${c.feelsLike}°. İnce tişört üşütebilir` },
        ustune: { item: 'Önü açık ince hırka', reason: () => `Üşürsen giyersin, ısınırsan çıkarırsın` },
        dis: { item: 'Hafif trençkot, istersen elinde taşı', reason: () => `Sabah ve akşam serinleyebilir, yanında hafif bir şey olsun` },
        alt: { item: 'Kumaş pantolon (ya da ince tayt üstüne diz boyu etek)', reason: () => `Bu sıcaklıkta kumaş pantolon rahat ve yeterli` },
        ayak: { item: 'Spor ayakkabı ya da makosen', reason: () => `Kapalı ayakkabı bu sıcaklıkta en rahatı` },
      },
      erkek: {
        ust: { item: 'Kalın kumaşlı düz tişört', reason: c => `Hissedilen ${c.feelsLike}°. İnce tişört üşütebilir` },
        ustune: { item: 'Önü açık kalın gömlek', reason: () => `Üşürsen giyersin, ısınırsan çıkarırsın` },
        dis: { item: 'İnce, hafif ceket, istersen elinde taşı', reason: () => `Sabah ve akşam serinleyebilir, yanında hafif bir şey olsun` },
        alt: { item: 'Kumaş pantolon', reason: () => `Bu sıcaklıkta kumaş pantolon rahat ve yeterli` },
        ayak: { item: 'Makosen ya da spor ayakkabı', reason: () => `Kapalı ayakkabı bu sıcaklıkta en rahatı` },
      },
    },
    ilik: {
      unisex: {
        ust: { item: 'İnce pamuklu tişört', reason: c => `Hissedilen ${c.feelsLike}°. İnce bir tişört yeterli` },
        ustune: { item: 'İnce gömlek ya da hırka (yanında dursun)', reason: () => `Akşamüstü serinlerse üstüne giyersin` },
        alt: { item: 'İnce kumaş pantolon', reason: () => `Bu ılık havada ince kumaş pantolon rahat eder` },
        ayak: { item: 'Spor ayakkabı', reason: () => `Spor ayakkabı bu sıcaklıkta en rahatı` },
      },
      kadin: {
        ust: { item: 'İnce pamuklu tişört ya da gömlek', reason: c => `Hissedilen ${c.feelsLike}°. İnce bir tişört yeterli` },
        ustune: { item: 'İnce hırka (yanında dursun)', reason: () => `Akşamüstü serinlerse üstüne giyersin` },
        alt: { item: 'İnce kumaş pantolon ya da midi elbise', reason: () => `Bu ılık havada ince kumaş rahat eder` },
        ayak: { item: 'Spor ayakkabı ya da makosen', reason: () => `Spor ayakkabı bu sıcaklıkta en rahatı` },
      },
      erkek: {
        ust: { item: 'İnce pamuklu tişört', reason: c => `Hissedilen ${c.feelsLike}°. İnce bir tişört yeterli` },
        ustune: { item: 'İnce gömlek (yanında dursun)', reason: () => `Akşamüstü serinlerse üstüne giyersin` },
        alt: { item: 'İnce kumaş pantolon', reason: () => `Bu ılık havada ince kumaş pantolon rahat eder` },
        ayak: { item: 'Spor ayakkabı ya da makosen', reason: () => `Spor ayakkabı bu sıcaklıkta en rahatı` },
      },
    },
    sicak: {
      unisex: {
        ust: { item: 'İnce, nefes alan tişört (keten ya da pamuklu)', reason: c => `Hissedilen ${c.feelsLike}°. İnce ve nefes alan kumaş seni terletmez` },
        alt: { item: 'İnce kumaş şort ya da hafif pantolon', reason: () => `Hafif kumaş bu sıcakta çok daha rahat` },
        ayak: { item: 'Açık spor ayakkabı ya da sandalet', reason: () => `Ayakların nefes alsın, açık ayakkabı iyi gelir` },
      },
      kadin: {
        ust: { item: 'İnce keten gömlek ya da tişört', reason: c => `Hissedilen ${c.feelsLike}°. İnce ve nefes alan kumaş seni terletmez` },
        alt: { item: 'Hafif kumaş şort ya da yazlık elbise', reason: () => `Hafif kumaş bu sıcakta çok daha rahat` },
        ayak: { item: 'Sandalet ya da açık spor ayakkabı', reason: () => `Ayakların nefes alsın, açık ayakkabı iyi gelir` },
      },
      erkek: {
        ust: { item: 'İnce keten ya da pamuklu tişört', reason: c => `Hissedilen ${c.feelsLike}°. İnce ve nefes alan kumaş seni terletmez` },
        alt: { item: 'Hafif kumaş şort', reason: () => `Hafif kumaş bu sıcakta çok daha rahat` },
        ayak: { item: 'Sandalet ya da açık spor ayakkabı', reason: () => `Ayakların nefes alsın, açık ayakkabı iyi gelir` },
      },
    },
    cok_sicak: {
      unisex: {
        ust: { item: 'Çok ince, açık renk keten gömlek ya da tişört', reason: c => `Hissedilen ${c.feelsLike}°. Açık renk keten, güneşin sıcağını daha az tutar` },
        alt: { item: 'Hafif keten şort', reason: () => `Bu sıcakta bacakların rahat nefes alsın` },
        ayak: { item: 'Sandalet', reason: () => `Kapalı ayakkabı bu sıcakta bunaltır, sandalet en iyisi` },
      },
      kadin: {
        ust: { item: 'Çok ince, açık renk keten gömlek', reason: c => `Hissedilen ${c.feelsLike}°. Açık renk keten, güneşin sıcağını daha az tutar` },
        alt: { item: 'Hafif keten şort ya da yazlık etek', reason: () => `Bu sıcakta bacakların rahat nefes alsın` },
        ayak: { item: 'Sandalet', reason: () => `Kapalı ayakkabı bu sıcakta bunaltır, sandalet en iyisi` },
      },
      erkek: {
        ust: { item: 'Çok ince, açık renk keten gömlek', reason: c => `Hissedilen ${c.feelsLike}°. Açık renk keten, güneşin sıcağını daha az tutar` },
        alt: { item: 'Hafif keten şort', reason: () => `Bu sıcakta bacakların rahat nefes alsın` },
        ayak: { item: 'Sandalet', reason: () => `Kapalı ayakkabı bu sıcakta bunaltır, sandalet en iyisi` },
      },
    },
  },
  en: {
    dondurucu: {
      unisex: {
        ust: { item: 'Thin thermal base layer, thick knit sweater on top', reason: c => `Feels like ${c.feelsLike}°. A sweater alone won't do it, wear a thin thermal underneath` },
        ustune: { item: 'Thick fleece pullover', reason: () => `One more layer in between keeps your body heat in` },
        dis: { item: 'Knee-length puffer coat with a hood', reason: c => `A short jacket won't do in this cold, wear a long, thick one` },
        alt: { item: 'Lined, heavy trousers', reason: () => `Thin trousers will leave you cold, wear a lined pair` },
        ayak: { item: 'Thick-soled boots with wool socks', reason: () => `A thick sole keeps the cold of the ground away` },
      },
      kadin: {
        ust: { item: 'Thin thermal base layer, thick knit sweater on top', reason: c => `Feels like ${c.feelsLike}°. A thin sweater alone won't do, wear a thermal underneath` },
        ustune: { item: 'Thick knit cardigan', reason: () => `One more layer in between keeps your body heat in` },
        dis: { item: 'Knee-length puffer coat with a hood', reason: c => `A short jacket won't do in this cold, wear a long, thick one` },
        alt: { item: 'Lined, heavy trousers (or thick tights under a long wool skirt)', reason: () => `Keep your legs covered with something thick and lined` },
        ayak: { item: 'Thick-soled, waterproof boots', reason: () => `A thick sole keeps the cold of the ground away` },
      },
      erkek: {
        ust: { item: 'Thin thermal base layer, thick knit sweater on top', reason: c => `Feels like ${c.feelsLike}°. A sweater alone won't do it, wear a thin thermal underneath` },
        ustune: { item: 'Thick fleece pullover', reason: () => `One more layer in between keeps your body heat in` },
        dis: { item: 'Knee-length puffer coat with a hood', reason: c => `A short jacket won't do in this cold, wear a long, thick one` },
        alt: { item: 'Lined, heavy trousers', reason: () => `Thin trousers will leave you cold, wear a lined pair` },
        ayak: { item: 'Thick-soled boots with wool socks', reason: () => `A thick sole keeps the cold of the ground away` },
      },
    },
    soguk: {
      unisex: {
        ust: { item: 'Thick, plain t-shirt with a heavy knit sweater on top', reason: c => `Feels like ${c.feelsLike}°. A t-shirt alone isn't enough, put a heavy sweater over it` },
        dis: { item: 'Lined fabric jacket or a heavy parka', reason: c => `It's too cold to go out without a jacket, wear a lined one` },
        alt: { item: 'Heavy fabric trousers', reason: () => `Heavy fabric keeps your legs warm` },
        ayak: { item: 'Closed, thick-soled boots', reason: () => `Closed shoes are a must in this weather` },
      },
      kadin: {
        ust: { item: 'Thick, plain t-shirt with a heavy knit sweater on top', reason: c => `Feels like ${c.feelsLike}°. A t-shirt alone isn't enough, put a heavy sweater over it` },
        dis: { item: 'Lined fabric jacket or a short coat', reason: c => `It's too cold to go out without a jacket, wear a lined one` },
        alt: { item: 'Heavy fabric trousers (or thick tights under a below-the-knee skirt)', reason: () => `Heavy fabric keeps your legs warm` },
        ayak: { item: 'Closed, thick-soled boots', reason: () => `Closed shoes are a must in this weather` },
      },
      erkek: {
        ust: { item: 'Thick, plain t-shirt with a heavy knit sweater on top', reason: c => `Feels like ${c.feelsLike}°. A t-shirt alone isn't enough, put a heavy sweater over it` },
        dis: { item: 'Lined fabric jacket', reason: c => `It's too cold to go out without a jacket, wear a lined one` },
        alt: { item: 'Heavy fabric trousers', reason: () => `Heavy fabric keeps your legs warm` },
        ayak: { item: 'Closed, thick-soled boots', reason: () => `Closed shoes are a must in this weather` },
      },
    },
    serin: {
      unisex: {
        ust: { item: 'Thick, plain t-shirt (white or grey)', reason: c => `Feels like ${c.feelsLike}°. A thin t-shirt may feel chilly, pick a heavier one` },
        ustune: { item: 'A heavy shirt worn open', reason: () => `Put it on if you get cold, take it off if you warm up` },
        dis: { item: 'A light cardigan or jacket, carry it if you don’t need it', reason: () => `Mornings and evenings can get cool, keep something light with you` },
        alt: { item: 'Fabric trousers', reason: () => `Fabric trousers are comfortable and warm enough today` },
        ayak: { item: 'Sneakers or closed boots', reason: () => `Closed shoes are the most comfortable at this temperature` },
      },
      kadin: {
        ust: { item: 'Thick, plain t-shirt', reason: c => `Feels like ${c.feelsLike}°. A thin t-shirt may feel chilly` },
        ustune: { item: 'A thin cardigan worn open', reason: () => `Put it on if you get cold, take it off if you warm up` },
        dis: { item: 'A light trench coat, carry it if you don’t need it', reason: () => `Mornings and evenings can get cool, keep something light with you` },
        alt: { item: 'Fabric trousers (or thin tights under a knee-length skirt)', reason: () => `Fabric trousers are comfortable and warm enough today` },
        ayak: { item: 'Sneakers or loafers', reason: () => `Closed shoes are the most comfortable at this temperature` },
      },
      erkek: {
        ust: { item: 'Thick, plain t-shirt', reason: c => `Feels like ${c.feelsLike}°. A thin t-shirt may feel chilly` },
        ustune: { item: 'A heavy shirt worn open', reason: () => `Put it on if you get cold, take it off if you warm up` },
        dis: { item: 'A light, thin jacket, carry it if you don’t need it', reason: () => `Mornings and evenings can get cool, keep something light with you` },
        alt: { item: 'Fabric trousers', reason: () => `Fabric trousers are comfortable and warm enough today` },
        ayak: { item: 'Loafers or sneakers', reason: () => `Closed shoes are the most comfortable at this temperature` },
      },
    },
    ilik: {
      unisex: {
        ust: { item: 'Thin cotton t-shirt', reason: c => `Feels like ${c.feelsLike}°. A thin t-shirt is enough` },
        ustune: { item: 'Thin shirt or cardigan (keep it with you)', reason: () => `Put it on if it cools off in the evening` },
        alt: { item: 'Light fabric trousers', reason: () => `Light fabric trousers are comfortable in this mild weather` },
        ayak: { item: 'Sneakers', reason: () => `Sneakers are the most comfortable choice at this temperature` },
      },
      kadin: {
        ust: { item: 'Thin cotton t-shirt or blouse', reason: c => `Feels like ${c.feelsLike}°. A thin t-shirt is enough` },
        ustune: { item: 'Thin cardigan (keep it with you)', reason: () => `Put it on if it cools off in the evening` },
        alt: { item: 'Light fabric trousers or a midi dress', reason: () => `Light fabric feels comfortable in this mild weather` },
        ayak: { item: 'Sneakers or loafers', reason: () => `Sneakers are the most comfortable choice at this temperature` },
      },
      erkek: {
        ust: { item: 'Thin cotton t-shirt', reason: c => `Feels like ${c.feelsLike}°. A thin t-shirt is enough` },
        ustune: { item: 'Thin shirt (keep it with you)', reason: () => `Put it on if it cools off in the evening` },
        alt: { item: 'Light fabric trousers', reason: () => `Light fabric trousers are comfortable in this mild weather` },
        ayak: { item: 'Sneakers or loafers', reason: () => `Sneakers are the most comfortable choice at this temperature` },
      },
    },
    sicak: {
      unisex: {
        ust: { item: 'Thin, breathable t-shirt (linen or cotton)', reason: c => `Feels like ${c.feelsLike}°. Thin, breathable fabric keeps you from sweating` },
        alt: { item: 'Light fabric shorts or lightweight trousers', reason: () => `Light fabric is far more comfortable in this heat` },
        ayak: { item: 'Open sneakers or sandals', reason: () => `Let your feet breathe, open shoes feel better` },
      },
      kadin: {
        ust: { item: 'Thin linen shirt or t-shirt', reason: c => `Feels like ${c.feelsLike}°. Thin, breathable fabric keeps you from sweating` },
        alt: { item: 'Light fabric shorts or a summer dress', reason: () => `Light fabric is far more comfortable in this heat` },
        ayak: { item: 'Sandals or open sneakers', reason: () => `Let your feet breathe, open shoes feel better` },
      },
      erkek: {
        ust: { item: 'Thin linen or cotton t-shirt', reason: c => `Feels like ${c.feelsLike}°. Thin, breathable fabric keeps you from sweating` },
        alt: { item: 'Light fabric shorts', reason: () => `Light fabric is far more comfortable in this heat` },
        ayak: { item: 'Sandals or open sneakers', reason: () => `Let your feet breathe, open shoes feel better` },
      },
    },
    cok_sicak: {
      unisex: {
        ust: { item: 'Very thin, light-colored linen shirt or t-shirt', reason: c => `Feels like ${c.feelsLike}°. Light-colored linen holds less of the sun's heat` },
        alt: { item: 'Light linen shorts', reason: () => `Let your legs breathe in this heat` },
        ayak: { item: 'Sandals', reason: () => `Closed shoes get too hot today, sandals are best` },
      },
      kadin: {
        ust: { item: 'Very thin, light-colored linen shirt', reason: c => `Feels like ${c.feelsLike}°. Light-colored linen holds less of the sun's heat` },
        alt: { item: 'Light linen shorts or a summer skirt', reason: () => `Let your legs breathe in this heat` },
        ayak: { item: 'Sandals', reason: () => `Closed shoes get too hot today, sandals are best` },
      },
      erkek: {
        ust: { item: 'Very thin, light-colored linen shirt', reason: c => `Feels like ${c.feelsLike}°. Light-colored linen holds less of the sun's heat` },
        alt: { item: 'Light linen shorts', reason: () => `Let your legs breathe in this heat` },
        ayak: { item: 'Sandals', reason: () => `Closed shoes get too hot today, sandals are best` },
      },
    },
  },
};

const RAIN_SHOE = {
  tr: {
    dondurucu: 'Su geçirmez, kalın tabanlı bot',
    soguk: 'Su geçirmez, kalın tabanlı bot',
    serin: 'Su geçirmez, kapalı hafif ayakkabı',
    ilik: 'Su geçirmez, kapalı hafif ayakkabı',
    sicak: 'Su geçirmez, kapalı hafif ayakkabı (sandalet bugün ıslanır)',
    cok_sicak: 'Su geçirmez, kapalı hafif ayakkabı (sandalet bugün ıslanır)',
  },
  en: {
    dondurucu: 'Waterproof, thick-soled boots',
    soguk: 'Waterproof, thick-soled boots',
    serin: 'Waterproof, light closed shoes',
    ilik: 'Waterproof, light closed shoes',
    sicak: 'Waterproof, light closed shoes (sandals will get soaked today)',
    cok_sicak: 'Waterproof, light closed shoes (sandals will get soaked today)',
  },
};

function clone(obj) {
  const out = {};
  for (const k in obj) out[k] = { ...obj[k] };
  return out;
}

function applyWind(rows, wind, lang) {
  if (lang === 'en') {
    if (rows.dis) {
      const item = /wind/i.test(rows.dis.item) ? rows.dis.item : rows.dis.item + ', ideally windproof';
      rows.dis = { item, reason: () => `${wind} km/h wind makes it feel colder than it is. Wear something windproof` };
    } else {
      rows.dis = { item: 'A thin windproof jacket', reason: () => `${wind} km/h wind out there. Bring something windproof, even a thin one` };
    }
    return;
  }
  if (rows.dis) {
    const item = rows.dis.item.includes('rüzgar') ? rows.dis.item : rows.dis.item + ', tercihen rüzgar geçirmez';
    rows.dis = { item, reason: () => `Saatte ${wind} km rüzgar var, havayı olduğundan soğuk hissettiriyor. Rüzgar geçirmez bir şey giy` };
  } else {
    rows.dis = { item: 'İnce rüzgar geçirmez mont', reason: () => `Saatte ${wind} km rüzgar var. İnce de olsa rüzgarı kesen bir şey giy` };
  }
}

function applyRain(rows, bandKey, rainMax, lang) {
  if (lang === 'en') {
    rows.ayak = { item: RAIN_SHOE.en[bandKey], reason: () => `${rainMax}% chance of rain. Suede and fabric shoes will get soaked, wear waterproof ones` };
    rows.yanina = { item: 'A small umbrella', reason: () => `${rainMax}% chance of rain. Take a small umbrella with you` };
    return;
  }
  rows.ayak = { item: RAIN_SHOE.tr[bandKey], reason: () => `Yağmur ihtimali %${rainMax}. Süet ve kumaş ayakkabı ıslanır, su geçirmez bir şey giy` };
  rows.yanina = { item: 'Küçük bir şemsiye', reason: () => `Yağmur ihtimali %${rainMax}. Yanına küçük bir şemsiye al` };
}

// Layers the base outfit doesn't suggest for a band but that still make sense
// there: they only appear when the user owns a piece that fits the weather
// (a vest at 6°, a light jacket at 18°), so default suggestions stay simple.
const OPTIONAL_SLOTS = { soguk: ['ustune'], ilik: ['dis'] };
const UPPER = ['ust', 'ustune', 'dis'];
const COLD_BANDS = ['dondurucu', 'soguk'];
const WARM_BANDS = ['ilik', 'sicak', 'cok_sicak'];

function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619) >>> 0;
  return h;
}

// Picks today's wording for a suggested (non-wardrobe) slot: options that fit
// the user's style first, rotating by date; never the same kind of garment
// the user is already wearing from their own wardrobe in another upper slot.
function chooseVariant(base, { language, bandKey, slot, genderKey, vibe, seed, avoidArts, warmth }) {
  const list = ((VARIANTS[language] || VARIANTS.tr)[bandKey] || {})[slot] || [];
  const options = [{ vibe: 'casual', item: base.item, reason: base.reason, base: true }]
    .concat(list.filter(([, , , g]) => !g || g === genderKey).map(([v, item, reason]) => ({ vibe: v, item, reason })));
  const usable = options.filter(o => !avoidArts.includes(garmentVariant(slot, o.item, warmth)));
  const pool0 = usable.length ? usable : options;
  const wanted = vibe === 'minimal' ? ['minimal', 'elegant'] : [vibe || 'casual'];
  const preferred = pool0.filter(o => wanted.includes(o.vibe));
  const pool = preferred.length ? preferred : pool0.filter(o => o.vibe === 'casual');
  const list2 = pool.length ? pool : pool0;
  // Consecutive days walk through the options in order (offset per slot), so
  // the same suggestion doesn't come back the next day.
  const dayNum = Math.floor(Date.parse(seed) / 86400000);
  const step = Number.isFinite(dayNum) ? dayNum : hashStr(String(seed));
  const pick = list2[(step + hashStr(`${slot}|${bandKey}`)) % list2.length];
  return pick.base ? base : { item: pick.item, reason: c => pick.reason.replace('{t}', c.feelsLike) };
}

export function generateOutfit({ feelsLike, wind, rainMax, gender, lang, comfort = 0, vibe = 'casual', seed = '', kind = null }, wardrobeItems = [], locks = {}) {
  const language = lang === 'en' ? 'en' : 'tr';
  const X = EXTRAS[language];
  // `comfort` shifts the band for people who run cold (-3) or warm (+3); the
  // temperatures quoted in the reasons stay the real ones.
  const bandKey = getBand(feelsLike + comfort);
  const genderKey = ['unisex', 'kadin', 'erkek'].includes(gender) ? gender : 'unisex';
  const rows = clone(BASE[language][bandKey][genderKey]);

  const snowy = kind === 'snow';
  const rainy = rainMax >= 50;
  const freezing = bandKey === 'dondurucu' || snowy;
  const sunny = !rainy && (bandKey === 'cok_sicak' || (bandKey === 'sicak' && (kind === 'clear' || kind === 'partly')));
  const fixed = new Set(); // slots whose text the weather rules set; variants don't override them

  if (wind >= 20) { applyWind(rows, wind, language); fixed.add('dis'); }
  if (rainy) { applyRain(rows, bandKey, rainMax, language); fixed.add('ayak'); fixed.add('yanina'); }
  if (snowy) { rows.ayak = { item: X.snow_shoe[0], reason: () => X.snow_shoe[1] }; fixed.add('ayak'); }
  // Accessories for the conditions: umbrella (rain), beanie/scarf/gloves (freezing), cap (strong sun).
  let accKinds = null;
  if (freezing && rainy) { rows.yanina = { item: X.cold_rain_acc[0], reason: () => X.cold_rain_acc[1] }; accKinds = ['umbrella']; }
  else if (rainy) accKinds = ['umbrella'];
  else if (freezing) { rows.yanina = { item: X.cold_acc[0], reason: () => X.cold_acc[1] }; fixed.add('yanina'); accKinds = ['beanie', 'scarf']; }
  else if (sunny) { rows.yanina = { item: X.sun_acc[0], reason: () => X.sun_acc[1] }; fixed.add('yanina'); accKinds = ['cap']; }

  const ctx = { feelsLike, wind, rainMax };
  const needsRain = rainy || snowy;
  const needsWind = wind >= 20;
  const pickOpts = { bandKey, needsRain, needsWind, allowArts: { yanina: accKinds || ['__none__'] } };
  const optional = (OPTIONAL_SLOTS[bandKey] || []).filter(k => !rows[k]);
  const picks = pickWardrobeOutfit(wardrobeItems, SLOT_ORDER.filter(k => rows[k] || optional.includes(k)), pickOpts, locks);
  for (const k of optional) if (picks[k]) rows[k] = { item: picks[k].name, reason: '' };
  const pickedItems = Object.values(picks);

  // Today's wording for every suggested slot (style + date), avoiding repeats of owned pieces.
  const ownedUpperArts = UPPER.filter(k => picks[k]).map(k => itemLook(picks[k]).art);
  for (const key of SLOT_ORDER) {
    if (!rows[key] || picks[key] || fixed.has(key)) continue;
    rows[key] = chooseVariant(rows[key], { language, bandKey, slot: key, genderKey, vibe, seed, avoidArts: ownedUpperArts, warmth: BAND_WARMTH[bandKey] });
  }

  // ---- Keep suggestions consistent with what the user is actually wearing ----
  const ownBottom = picks.alt ? itemLook(picks.alt).art : null;
  // A dress is a whole look: no suggested top over it when it's warm, and in
  // the cold the top becomes the layer worn under the dress.
  if (ownBottom === 'dress' && rows.ust && !picks.ust) {
    if (WARM_BANDS.includes(bandKey) || bandKey === 'serin') delete rows.ust;
    else rows.ust = { item: X.dress_cold_top[0], reason: () => X.dress_cold_top[1] };
  }
  // A suggested mid layer that would be the same garment as an owned top, or
  // an extra layer under an already very warm owned coat, is dropped/softened.
  if (rows.ustune && !picks.ustune) {
    const midArt = garmentVariant('ustune', rows.ustune.item, BAND_WARMTH[bandKey]);
    if (ownedUpperArts.includes(midArt)) delete rows.ustune;
    else if (bandKey === 'dondurucu' && picks.dis && (picks.dis.warmth || 3) >= 5) rows.ustune = { item: X.soft_mid[0], reason: () => X.soft_mid[1] };
  }

  const output = [];
  for (const key of SLOT_ORDER) {
    const r = rows[key];
    if (!r) continue;
    let item = r.item;
    let reason = typeof r.reason === 'function' ? r.reason(ctx) : r.reason;
    let fromWardrobe = false;
    let color = null;
    let patterned = false;
    let itemId = null;
    let options = [];

    const match = picks[key];
    if (match) {
      item = match.name;
      fromWardrobe = true;
      color = isValidColor(match.color) ? COLORS[match.color].hex : null;
      patterned = match.pattern === 'desenli';
      itemId = match.id;
      options = slotOptionIds(wardrobeItems, key, pickOpts);
      reason = wardrobeReason(match, ctx, needsRain, needsWind, key, language, pickedItems);
      // Bare legs in the cold: remind about tights under the user's own skirt/shorts/dress.
      if (key === 'alt' && ['skirt', 'shorts', 'dress'].includes(itemLook(match).art)) {
        if (COLD_BANDS.includes(bandKey)) reason += X.tights_cold;
        else if (bandKey === 'serin') reason += X.tights_cool;
      }
    }

    // Wardrobe pieces draw from their own stored look; suggestions guess from the text.
    const look = match ? itemLook(match) : { art: garmentVariant(key, item, BAND_WARMTH[bandKey]), color: null, color2: null, patternType: 'solid', details: {} };
    if (match) color = look.color;
    const art = look.art;
    output.push({ slotKey: key, art, look, icon: SLOT_ICON[key], label: slotLabel(key, language), item, reason, fromWardrobe, color, patterned, itemId, options, locked: !!(match && locks[key] === match.id) });
  }

  return { bandKey, bandLabel: bandLabel(bandKey, language), rows: output };
}

// For an accent-colored piece, the other picked piece it goes best with (if any).
function colorPartner(item, others) {
  if (!isValidColor(item.color) || COLORS[item.color].neutral) return null;
  let best = null, bestScore = 0.8;
  for (const o of others) {
    if (o === item || !isValidColor(o.color)) continue;
    const sc = pairScore(item.color, o.color);
    if (sc >= bestScore) { best = o; bestScore = sc; }
  }
  return best;
}

function wardrobeReason(item, ctx, needsRain, needsWind, slotKey, lang, picked = []) {
  const partner = colorPartner(item, picked);
  if (lang === 'en') {
    const bits = [`right warmth for ${ctx.feelsLike}° feels-like`];
    if (needsRain && slotKey === 'ayak' && item.rainOk) bits.push('handles rain');
    if (needsWind && slotKey === 'dis' && item.windproof) bits.push('blocks wind');
    if (partner) bits.push(`${colorName(item.color, 'en').toLowerCase()} pairs well with your ${partner.name}`);
    return bits.join(', ') + '.';
  }
  const bits = [`Hissedilen ${ctx.feelsLike}° için kalınlığı tam`];
  if (needsRain && slotKey === 'ayak' && item.rainOk) bits.push('yağmura dayanıklı');
  if (needsWind && slotKey === 'dis' && item.windproof) bits.push('rüzgar geçirmiyor');
  if (partner) bits.push(`${colorName(item.color, 'tr').toLocaleLowerCase('tr')} rengi ${partner.name} ile iyi gider`);
  return bits.join(', ') + '.';
}
