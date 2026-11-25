import { pickWardrobeOutfit, slotOptionIds, BAND_WARMTH } from './wardrobe.js';
import { garmentVariant, itemLook, garmentDefaultColor, shade, ONE_PIECE, accessoryArts } from './visuals.js';
import { VARIANTS, EXTRAS, GENDERED, INTENSITY, LAYER_SPLIT } from './outfit_variants.js';
import { REASONS } from './outfit_catalog.js';
import { COLORS, isValidColor, pairScore, colorName } from './colors.js';
import { t } from './i18n.js';
import { tx, fillTemplate } from './outfit_i18n.js';

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
        ust: { item: 'İnce termal içlik, üzerine kalın örgü kazak', reason: c => `Hissedilen ${c.feelsLike}°. Tişörtle çıkmak zor; en alta ince termal giy` },
        ustune: { item: 'Kalın polar hırka', reason: () => `Araya bir kat daha, vücut ısın kaçmasın` },
        dis: { item: 'Diz boyu kalın kapüşonlu mont', reason: c => `Bu soğukta kısa mont yetmez, uzun ve kalın olanı seç` },
        alt: { item: 'Kalın astarlı pantolon', reason: () => `Bu soğukta ince pantolon üşütür, astarlısını giy` },
        ayak: { item: 'Kalın tabanlı bot, yün çorapla', reason: () => `Kalın taban yerden gelen soğuğu keser` },
      },
      kadin: {
        ust: { item: 'İnce termal içlik, üzerine kalın triko kazak', reason: c => `Hissedilen ${c.feelsLike}°. İnce kazak tek başına yetmez, altına termal giy` },
        ustune: { item: 'Kalın örgü hırka', reason: () => `Araya bir kat daha, vücut ısın kaçmasın` },
        dis: { item: 'Diz boyu kalın kapüşonlu mont', reason: c => `Bu soğukta kısa mont yetmez, uzun ve kalın olanı seç` },
        alt: { item: 'Kalın astarlı pantolon (veya kalın tayt üstü uzun yün etek)', reason: () => `Bacaklarını açıkta bırakma, kalın ve astarlı bir şey seç` },
        ayak: { item: 'Su geçirmez kalın tabanlı bot', reason: () => `Kalın taban yerden gelen soğuğu keser` },
      },
      erkek: {
        ust: { item: 'İnce termal içlik, üzerine kalın örgü kazak', reason: c => `Hissedilen ${c.feelsLike}°. Tişörtle çıkmak zor; en alta ince termal giy` },
        ustune: { item: 'Kalın polar hırka', reason: () => `Araya bir kat daha, vücut ısın kaçmasın` },
        dis: { item: 'Diz boyu kalın kapüşonlu mont', reason: c => `Bu soğukta kısa mont yetmez, uzun ve kalın olanı seç` },
        alt: { item: 'Kalın astarlı kumaş pantolon', reason: () => `Bu soğukta ince pantolon üşütür, astarlısını giy` },
        ayak: { item: 'Kalın tabanlı bot, yün çorapla', reason: () => `Kalın taban yerden gelen soğuğu keser` },
      },
    },
    soguk: {
      unisex: {
        ust: { item: 'Kalın kumaşlı düz tişört, üstüne kalın örgü kazak', reason: c => `Hissedilen ${c.feelsLike}°. Tişört tek başına yetmez, üstüne kalın bir kazak al` },
        dis: { item: 'Astarlı kumaş ceket ya da kalın parka', reason: c => `Bu havada ceketsiz üşütür, astarlı bir ceket al` },
        alt: { item: 'Kalın kumaş pantolon', reason: () => `Kalın kumaş bacaklarını soğuktan korur` },
        ayak: { item: 'Kapalı, kalın tabanlı bot', reason: () => `Bu havada kapalı ayakkabı en iyisi` },
      },
      kadin: {
        ust: { item: 'Kalın kumaşlı düz tişört, üstüne kalın triko kazak', reason: c => `Hissedilen ${c.feelsLike}°. Tişört tek başına yetmez, üstüne kalın bir kazak al` },
        dis: { item: 'Astarlı kumaş ceket ya da kısa kaban', reason: c => `Bu havada ceketsiz üşütür, astarlı bir şey giy` },
        alt: { item: 'Kalın pantolon (veya kalın tayt üstü diz altı etek)', reason: () => `Kalın kumaş bacaklarını soğuktan korur` },
        ayak: { item: 'Kapalı, kalın tabanlı bot', reason: () => `Bu havada kapalı ayakkabı en iyisi` },
      },
      erkek: {
        ust: { item: 'Kalın kumaşlı düz tişört, üstüne kalın örgü kazak', reason: c => `Hissedilen ${c.feelsLike}°. Tişört tek başına yetmez, üstüne kalın bir kazak al` },
        dis: { item: 'Astarlı kumaş ceket', reason: c => `Hissedilen ${c.feelsLike}°'de ceketsiz durmak zor; astarlı bir ceket al` },
        alt: { item: 'Kalın kumaş pantolon', reason: () => `Kalın kumaş bacaklarını soğuktan korur` },
        ayak: { item: 'Kapalı, kalın tabanlı bot', reason: () => `Bu havada kapalı ayakkabı en iyisi` },
      },
    },
    serin: {
      unisex: {
        ust: { item: 'Kalın düz tişört (beyaz veya gri)', reason: c => `Hissedilen ${c.feelsLike}°. İnce tişört üşütebilir, kalın kumaşlı olanı seç` },
        ustune: { item: 'Önü açık kalın gömlek', reason: () => `Üşürsen giyersin, ısınırsan çıkarırsın` },
        dis: { item: 'İnce hırka veya hafif ceket (istersen elinde taşı)', reason: () => `Sabah ve akşam serinleyebilir, yanında hafif bir kat dursun` },
        alt: { item: 'Kumaş pantolon', reason: () => `Bu havada kumaş pantolon rahat ve tam kararında` },
        ayak: { item: 'Spor ayakkabı veya kapalı bot', reason: () => `Kapalı ayakkabı bu havada en rahatı` },
      },
      kadin: {
        ust: { item: 'Kalın kumaşlı düz tişört', reason: c => `Hissedilen ${c.feelsLike}°. İnce tişört üşütebilir` },
        ustune: { item: 'Önü açık ince hırka', reason: () => `Üşürsen giyersin, ısınırsan çıkarırsın` },
        dis: { item: 'Hafif trençkot (istersen elinde taşı)', reason: () => `Sabah ve akşam serinleyebilir, yanında hafif bir kat dursun` },
        alt: { item: 'Kumaş pantolon (veya ince tayt üstü diz boyu etek)', reason: () => `Bu havada kumaş pantolon rahat ve tam kararında` },
        ayak: { item: 'Spor ayakkabı veya loafer', reason: () => `Kapalı ayakkabı bu havada en rahatı` },
      },
      erkek: {
        ust: { item: 'Kalın kumaşlı düz tişört', reason: c => `Hissedilen ${c.feelsLike}°. İnce tişört üşütebilir` },
        ustune: { item: 'Önü açık kalın gömlek', reason: () => `Üşürsen giyersin, ısınırsan çıkarırsın` },
        dis: { item: 'Hafif ceket (istersen elinde taşı)', reason: () => `Sabah ve akşam serinleyebilir, yanında hafif bir kat dursun` },
        alt: { item: 'Kumaş pantolon', reason: () => `Bu havada kumaş pantolon rahat ve tam kararında` },
        ayak: { item: 'Loafer veya spor ayakkabı', reason: () => `Kapalı ayakkabı bu havada en rahatı` },
      },
    },
    ilik: {
      unisex: {
        ust: { item: 'İnce pamuklu tişört', reason: c => `Hissedilen ${c.feelsLike}°. İnce bir tişört yeterli` },
        ustune: { item: 'İnce gömlek veya hırka (yanında bulunsun)', reason: () => `Akşamüstü serinlerse üzerine alırsın` },
        alt: { item: 'İnce kumaş pantolon', reason: () => `Bu havada ince kumaş pantolon çok rahat` },
        ayak: { item: 'Spor ayakkabı', reason: () => `Spor ayakkabı bu havada en rahatı` },
      },
      kadin: {
        ust: { item: 'İnce pamuklu tişört veya gömlek', reason: c => `Hissedilen ${c.feelsLike}°. İnce bir tişört yeterli` },
        ustune: { item: 'İnce hırka (yanında bulunsun)', reason: () => `Akşamüstü serinlerse üzerine alırsın` },
        alt: { item: 'İnce kumaş pantolon veya midi elbise', reason: () => `Bu havada ince kumaş çok rahat` },
        ayak: { item: 'Spor ayakkabı veya loafer', reason: () => `Spor ayakkabı bu havada en rahatı` },
      },
      erkek: {
        ust: { item: 'İnce pamuklu tişört', reason: c => `Hissedilen ${c.feelsLike}°. İnce bir tişört yeterli` },
        ustune: { item: 'İnce gömlek (yanında bulunsun)', reason: () => `Akşamüstü serinlerse üzerine alırsın` },
        alt: { item: 'İnce kumaş pantolon', reason: () => `Bu havada ince kumaş pantolon çok rahat` },
        ayak: { item: 'Spor ayakkabı veya loafer', reason: () => `Spor ayakkabı bu havada en rahatı` },
      },
    },
    sicak: {
      unisex: {
        ust: { item: 'İnce, nefes alan tişört (keten veya pamuk)', reason: c => `Hissedilen ${c.feelsLike}°. İnce, nefes alan kumaş bunaltmaz` },
        alt: { item: 'Hafif kumaş şort veya ince pantolon', reason: () => `Hafif kumaş bu sıcakta çok daha rahat` },
        ayak: { item: 'Açık spor ayakkabı veya sandalet', reason: () => `Ayakların nefes alsın, açık bir model iyi gelir` },
      },
      kadin: {
        ust: { item: 'İnce keten gömlek veya tişört', reason: c => `Hissedilen ${c.feelsLike}°. İnce, nefes alan kumaş bunaltmaz` },
        alt: { item: 'Hafif şort veya yazlık elbise', reason: () => `Hafif kumaş bu sıcakta çok daha rahat` },
        ayak: { item: 'Sandalet veya açık spor ayakkabı', reason: () => `Ayakların nefes alsın, açık bir model iyi gelir` },
      },
      erkek: {
        ust: { item: 'İnce keten veya pamuklu tişört', reason: c => `Hissedilen ${c.feelsLike}°. İnce, nefes alan kumaş bunaltmaz` },
        alt: { item: 'Hafif kumaş şort', reason: () => `Hafif kumaş bu sıcakta çok daha rahat` },
        ayak: { item: 'Sandalet veya açık spor ayakkabı', reason: () => `Ayakların nefes alsın, açık bir model iyi gelir` },
      },
    },
    cok_sicak: {
      unisex: {
        ust: { item: 'İnce açık renk keten gömlek veya tişört', reason: c => `Hissedilen ${c.feelsLike}°. Açık renk keten güneşin ısısını daha az tutar` },
        alt: { item: 'Hafif keten şort', reason: () => `Bu sıcakta bacakların rahatça nefes alsın` },
        ayak: { item: 'Sandalet', reason: () => `Kapalı ayakkabı bu sıcakta bunaltır, sandalet daha rahat` },
      },
      kadin: {
        ust: { item: 'İnce açık renk keten gömlek', reason: c => `Hissedilen ${c.feelsLike}°. Açık renk keten güneşin ısısını daha az tutar` },
        alt: { item: 'Hafif keten şort veya yazlık etek', reason: () => `Bu sıcakta bacakların rahatça nefes alsın` },
        ayak: { item: 'Sandalet', reason: () => `Kapalı ayakkabı bu sıcakta bunaltır, sandalet daha rahat` },
      },
      erkek: {
        ust: { item: 'İnce açık renk keten gömlek', reason: c => `Hissedilen ${c.feelsLike}°. Açık renk keten güneşin ısısını daha az tutar` },
        alt: { item: 'Hafif keten şort', reason: () => `Bu sıcakta bacakların rahatça nefes alsın` },
        ayak: { item: 'Sandalet', reason: () => `Kapalı ayakkabı bu sıcakta bunaltır, sandalet daha rahat` },
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
    dondurucu: 'Kalın tabanlı su geçirmez bot',
    soguk: 'Kalın tabanlı su geçirmez bot',
    serin: 'Kapalı, suya dayanıklı hafif ayakkabı',
    ilik: 'Kapalı, suya dayanıklı hafif ayakkabı',
    sicak: 'Kapalı, suya dayanıklı ayakkabı (sandalet ıslanır)',
    cok_sicak: 'Kapalı, suya dayanıklı ayakkabı (sandalet ıslanır)',
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
      rows.dis = { item, reason: c => `${c.wind} km/h wind makes it feel colder than it is. Wear something windproof` };
    } else {
      rows.dis = { item: 'A thin windproof jacket', reason: c => `${c.wind} km/h wind out there. Bring something windproof, even a thin one` };
    }
    return;
  }
  if (rows.dis) {
    // "(rüzgar kesen)" replaces a closing note like "(istersen elinde taşı)", or is added at the end.
    const item = rows.dis.item.includes('rüzgar') ? rows.dis.item : rows.dis.item.replace(/\s*\([^)]*\)$/, '') + ' (rüzgar kesen)';
    rows.dis = { item, reason: c => `${c.wind} km/sa rüzgar var, havayı olduğundan soğuk hissettiriyor. Rüzgar kesen bir parça giy` };
  } else {
    rows.dis = { item: 'İnce rüzgarlık mont', reason: c => `${c.wind} km/sa rüzgar var. İnce olsa da rüzgarı kesen bir şey al` };
  }
}

function applyRain(rows, bandKey, rainMax, lang) {
  if (lang === 'en') {
    rows.ayak = { item: RAIN_SHOE.en[bandKey], reason: c => `${c.rainMax}% chance of rain. Suede and fabric shoes will get soaked, wear waterproof ones` };
    rows.yanina = { item: 'A small umbrella', reason: c => `${c.rainMax}% chance of rain. Take a small umbrella with you` };
    return;
  }
  rows.ayak = { item: RAIN_SHOE.tr[bandKey], reason: c => `Yağmur ihtimali %${c.rainMax}. Süet ve kumaş ıslanır; suya dayanıklı bir şey seç` };
  rows.yanina = { item: 'Ufak şemsiye', reason: c => `Yağmur ihtimali %${c.rainMax}. Yanına ufak bir şemsiye al` };
}

// Layers the base outfit doesn't suggest for a band but that still make sense
// there: they only appear when the user owns a piece that fits the weather
// (a vest at 6°, a light jacket at 18°), so default suggestions stay simple.
const OPTIONAL_SLOTS = { soguk: ['ustune'], ilik: ['dis'] };
const UPPER = ['ust', 'ustune', 'dis'];
// Warm layers: one of these per outfit.
const MID_ARTS = ['sweater', 'sweatshirt', 'hoodie', 'fleece', 'cardigan'];
const COLD_BANDS = ['dondurucu', 'soguk'];
const WARM_BANDS = ['ilik', 'sicak', 'cok_sicak'];

// Suggested pieces are drawn in a women's or men's cut when a gender is chosen.
const GENDER_ART = {
  kadin: { shirt: 'blouse', shortshirt: 'blouse', shorts: 'minishorts', sunglasses: 'catglasses',
    coat: 'wrapcoat', puffer: 'pufferw', parka: 'pufferw', jacket: 'cropjacket', blazer: 'blazerw' },
  erkek: { blouse: 'shirt', minishorts: 'shorts', catglasses: 'sunglasses', leggings: 'trousers',
    wrapcoat: 'coat', pufferw: 'puffer', cropjacket: 'jacket', blazerw: 'blazer' },
};
// Suggested pieces get colors typical for each wardrobe, rotating by day.
const GENDER_PALETTE = {
  kadin: {
    wrapcoat: ['#c8a27a', '#7a2e3b', '#efe6da', '#9c6b5a'], pufferw: ['#efe6da', '#c9a9a6', '#2f3e5e', '#8b5a3c'],
    cropjacket: ['#d8b4a0', '#f0e2d0', '#6b4a7a', '#2b2b33'], blazerw: ['#e9dccb', '#2b2b33', '#b7473b'],
    trench: ['#cdb07c', '#efe6da'], bomber: ['#c9a9a6', '#4e5a3a'], windbreaker: ['#c9a9a6', '#2f8f8a'],
    sweater: ['#e8c4c4', '#efe6da', '#b9a3c9', '#c94f4f'], cardigan: ['#e8d5c4', '#f2c6cf', '#b9a3c9'],
    fleece: ['#efe6da', '#c9a9a6'], hoodie: ['#c9a9a6', '#b9a3c9', '#efe6da'], sweatshirt: ['#e8c4c4', '#c8d6e8'],
    longsleeve: ['#f3e6e8', '#e6ddcb'], tee: ['#f6efe6', '#f4d6dc'], tank: ['#f6efe6', '#f4d6dc'],
    blouse: ['#f4d6dc', '#f6efe6', '#cfe0ee'], dress: ['#7a2e3b', '#2b2b33', '#b9a3c9', '#e79bb3'], skirt: ['#6b4a7a', '#c8a27a', '#2b2b33'],
    trousers: ['#efe6da', '#2b2b33', '#c8a27a'], chinos: ['#e9dccb', '#c8b48f'], jeans: ['#8fb3d9', '#3f6496'],
    leggings: ['#2b2b33', '#4a3a4a'], minishorts: ['#8fb3d9', '#efe6da'],
    boot: ['#6b4a32', '#2b2b33', '#c8a27a'], sneaker: ['#f4f2ee', '#f2c6cf'], loafer: ['#7a2e3b', '#2b2b33'], sandal: ['#c8a27a', '#e9dccb'],
    beanie: ['#efe6da', '#c9a9a6', '#c94f4f'], scarf: ['#c9a9a6', '#efe6da', '#7a2e3b'],
  },
  erkek: {
    coat: ['#2f3e5e', '#3a3f4b', '#4e5a3a', '#6b4a32'], puffer: ['#23262d', '#2f3e5e', '#4e5a3a'], parka: ['#4e5a3a', '#2f3e5e', '#23262d'],
    jacket: ['#3f5f86', '#3a3f4b', '#6b4a32'], blazer: ['#2f3e5e', '#3a3f4b', '#6b5a48'], trench: ['#b89a68', '#3a3f4b'],
    bomber: ['#4e5a3a', '#23262d'], windbreaker: ['#2f3e5e', '#2f8f8a'],
    sweater: ['#2f3e5e', '#6b6f73', '#4e5a3a', '#7a2e3b'], cardigan: ['#6b6f73', '#3a3f4b'], fleece: ['#4e5a3a', '#3a3f4b'],
    hoodie: ['#5b6b7d', '#3a3f4b', '#4e5a3a'], sweatshirt: ['#8a9bb0', '#6b6f73'], longsleeve: ['#dfe3e8', '#3a3f4b'],
    shirt: ['#d7e6f5', '#f2f2f2', '#9fb4c9'], shortshirt: ['#dbe8f2', '#e9dccb', '#4e5a3a'], polo: ['#2f3e5e', '#2f6f5e', '#f2f2f2'],
    tee: ['#f2f2f2', '#2f3e5e', '#6b6f73'], tank: ['#f2f2f2', '#3a3f4b'],
    trousers: ['#2f3e5e', '#3a3f4b', '#6b6f73'], chinos: ['#c8b48f', '#4e5a3a'], jeans: ['#3f6496', '#2a3a5a'], shorts: ['#c8b48f', '#2f3e5e', '#4e5a3a'],
    boot: ['#6b4a32', '#23262d'], sneaker: ['#f4f2ee', '#3a3f4b'], loafer: ['#4a3426', '#23262d'], sandal: ['#6b4a32'],
    beanie: ['#3a3f4b', '#4e5a3a', '#2f3e5e'], scarf: ['#3a3f4b', '#6b6f73'],
  },
};
const GLASSES = ['sunglasses', 'catglasses'];
// Today's plans: the style they call for and the drawings that don't fit them.
export const OCCASIONS = {
  work: { vibe: 'elegant', formality: [2, 3], sport: 'no', avoid: ['hoodie', 'sweatshirt', 'tank', 'shorts', 'minishorts', 'slide', 'cap', 'bucket', 'leggings'] },
  school: { vibe: 'casual', formality: [1, 2], avoid: ['heel', 'blazerw', 'slide'] },
  date: { vibe: 'elegant', formality: [2, 3], sport: 'no', avoid: ['hoodie', 'sweatshirt', 'fleece', 'slide', 'cap', 'leggings'] },
  event: { vibe: 'elegant', formality: [3, 3], sport: 'no', avoid: ['hoodie', 'sweatshirt', 'fleece', 'tank', 'shorts', 'minishorts', 'slide', 'sneaker', 'cap', 'bucket', 'tote', 'leggings', 'windbreaker'] },
  sport: { vibe: 'sporty', sport: 'only', avoid: ['heel', 'flat', 'loafer', 'chelsea', 'espadrille', 'blazer', 'blazerw', 'shirt', 'blouse', 'dress', 'skirt', 'jumpsuit', 'coat', 'wrapcoat', 'trench'] },
  walk: { vibe: null, formality: [1, 2], avoid: ['heel', 'flat', 'loafer', 'slide'], want: ['sneaker'] },
};
export const OCCASION_KEYS = Object.keys(OCCASIONS);
// Spare reasons per slot for when two pieces would say the same thing.
const SLOT_REASONS = {
  ust: ['soft_comfy', 'collar_neat', 'texture_detail', 'minimal_clean'],
  ustune: ['layer_easy', 'wool_warm', 'fleece_light', 'knit_warm'],
  dis: ['jacket_mid', 'lined_warm', 'puffer_warm', 'classic_smart'],
  alt: ['jogger_comfy', 'classic_smart', 'denim_classic', 'minimal_clean'],
  ayak: ['sneaker_easy', 'boot_grip', 'shoe_smart', 'boot_smart'],
};
// Color words in Turkish and English item names (the stylist keeps these colors).
const COLOR_WORD = /siyah|beyaz|gri\b|lacivert|\bbej\b|kahve|haki|yeşil|mavi|kırmızı|bordo|pembe|\bmor\b|sarı|turuncu|krem|pastel|açık renk|koyu renk|\bblack|\bwhite|\bgr[ae]y\b|\bnavy|\bbeige|\bbrown|khaki|\bgreen|\bblue|\bred\b|burgundy|\bpink|purple|yellow|orange|cream|light-colored|dark|denim|\bkot\b/i;
const ACCENT_WORD = /renkli|canlı|colorful|bright/i;
// The first color an item's text names, as a garment tone. "Dark"/"light" on
// jeans mean dark or light denim; on anything else a deep or a pale neutral.
const TEXT_COLORS = [
  [/siyah|\bblack/i, '#23262d'], [/beyaz|\bwhite/i, '#f4f2ee'], [/\bgri\b|\bgr[ae]y\b/i, '#8a8f96'],
  [/lacivert|\bnavy/i, '#2f3e5e'], [/\bbej\b|\bbeige|krem|cream/i, '#e9dccb'], [/kahve|\bbrown/i, '#6b4a32'],
  [/haki|khaki/i, '#6f6f47'], [/yeşil|\bgreen/i, '#4e7a5a'], [/mavi|\bblue/i, '#5b8fc9'], [/kırmızı|\bred\b/i, '#c0453b'],
  [/bordo|burgundy/i, '#7a2e3b'], [/pembe|\bpink/i, '#e8a7b8'], [/\bmor\b|purple/i, '#7a5a9e'], [/sarı|yellow/i, '#e8c45a'],
  [/turuncu|orange/i, '#e07a3f'], [/pastel/i, '#cfe0ee'],
];
function namedColor(text, art) {
  const t = String(text || '');
  if (/koyu renk|\bdark/i.test(t)) return art === 'jeans' ? '#2a3a5a' : null;
  if (/açık renk|light-colored|\blight (?:wash|jeans)/i.test(t)) return art === 'jeans' ? '#8fb3d9' : '#efe6da';
  let best = null, pos = Infinity;
  for (const [re, hex] of TEXT_COLORS) { const m = t.match(re); if (m && m.index < pos) { pos = m.index; best = hex; } }
  return best;
}

function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619) >>> 0;
  return h;
}

// Picks today's wording for a suggested (non-wardrobe) slot: options that fit
// the user's style first, rotating by date; never the same kind of garment
// the user is already wearing from their own wardrobe in another upper slot.
// What the engine knows about a piece: its styles, formality (1 relaxed, 2
// everyday, 3 smart) and whether it's sportswear. Catalog pieces say so
// themselves (outfit_catalog.js); older entries are read from their style tag.
const STYLE_FORMALITY = { sporty: 1, casual: 2, bold: 2, minimal: 2, elegant: 3 };
function pieceOption(v, item, reason, gendered, meta) {
  return {
    vibe: v, item, reason, gendered,
    styles: meta ? meta.styles : [v],
    formality: meta ? meta.formality : STYLE_FORMALITY[v] || 2,
    sport: meta ? meta.sport : v === 'sporty',
  };
}
// Whether a piece fits today's plans (OCCASIONS): formality range and sportswear.
function fitsOccasion(o, occ) {
  if (!occ) return true;
  if (occ.formality && (o.formality < occ.formality[0] || o.formality > occ.formality[1])) return false;
  if (occ.sport === 'only' && !o.sport) return false;
  if (occ.sport === 'no' && o.sport) return false;
  return true;
}

function chooseVariant(base, { language, bandKey, slot, genderKey, vibe, seed, avoidArts, wantArts = [], warmth, feelsLike, roll = 0, occ = null }) {
  const list = ((VARIANTS[language] || VARIANTS.tr)[bandKey] || {})[slot] || [];
  const gList = genderKey === 'unisex' ? []
    : ((((GENDERED[language] || GENDERED.tr)[genderKey] || {})[bandKey] || {})[slot] || []);
  // `key` is the piece's place in the lists, the same in every language (names can repeat).
  const options = [{ ...pieceOption('casual', base.item, base.reason, genderKey !== 'unisex'), base: true, key: 'base' }]
    .concat(gList.map(([v, item, reason, , m], i) => ({ ...pieceOption(v, item, reason, true, m), key: 'g' + i })))
    .concat(list.map(([v, item, reason, g, m], i) => ({ ...pieceOption(v, item, reason, !!g, m), key: 'v' + i, g })).filter(o => !o.g || o.g === genderKey));
  const allowed = options.filter(o => !avoidArts.includes(garmentVariant(slot, o.item, warmth)));
  // Pieces that suit today's plans, when there are any.
  const fitting = allowed.filter(o => fitsOccasion(o, occ));
  const usable0 = fitting.length ? fitting : allowed;
  // A piece they asked for ("I want to wear sandals") wins when this weather
  // has one; otherwise the usual choice stays and the app says so.
  let asked = wantArts.length ? usable0.filter(o => wantArts.includes(garmentVariant(slot, o.item, warmth))) : [];
  // Not among today's pieces? A neighbouring band's version is still fine for the
  // weather (boots on a mild day); two bands away (sandals in the cold) is not.
  if (wantArts.length && !asked.length) {
    const i = BAND_KEYS.indexOf(bandKey);
    for (const nb of [BAND_KEYS[i - 1], BAND_KEYS[i + 1]].filter(Boolean)) {
      const near = (((VARIANTS[language] || VARIANTS.tr)[nb] || {})[slot] || [])
        .filter(([, , , g]) => !g || g === genderKey)
        .map(([v, item, reason]) => ({ vibe: v, item, reason, gendered: false }))
        .filter(o => wantArts.includes(garmentVariant(slot, o.item, warmth)) && !avoidArts.includes(garmentVariant(slot, o.item, warmth)));
      if (near.length) { asked = near; break; }
    }
  }
  const usable = asked.length ? asked : usable0;
  const pool0 = usable.length ? usable : options;
  const wanted = vibe === 'minimal' ? ['minimal', 'elegant'] : [vibe || 'casual'];
  let pool = pool0.filter(o => o.styles.some(st => wanted.includes(st)));
  // A style with only a few pieces in this weather borrows the everyday ones too,
  // its own pieces still counting double, so the week doesn't repeat itself.
  if (new Set(pool.map(o => o.key)).size < 4) {
    const extra = pool0.filter(o => !pool.includes(o) && o.styles.includes('casual'));
    pool = pool.flatMap(o => [o, o]).concat(extra);
  }
  if (!pool.length) pool = pool0.filter(o => o.styles.includes('casual'));
  if (!pool.length) pool = pool0;
  // Women's and men's picks lean on their own pieces: gendered options count
  // three times, so the two lists rarely land on the same neutral suggestion.
  if (genderKey !== 'unisex') pool = pool.flatMap(o => (o.gendered ? [o, o, o] : [o]));
  // A fixed shuffle per slot and weather, so stepping one day ahead lands on a
  // different piece (the copies above don't sit next to each other).
  // Keyed by position, not by name, so every language lands on the same piece.
  pool = pool.map((o, i) => [hashStr(`${i}|${slot}|${bandKey}|${genderKey}`), o]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  // The pick walks forward one step per day and one step per 2°, so -1° and
  // -23° (same band) or two neighbouring days don't give the same outfit.
  const dayNum = Math.floor(Date.parse(seed) / 86400000);
  const day = Number.isFinite(dayNum) ? dayNum : hashStr(String(seed));
  const tempStep = Number.isFinite(feelsLike) ? Math.floor(feelsLike / 2) : 0;
  const idx = (((day + tempStep + hashStr(`${slot}|${bandKey}|${genderKey}`)) % pool.length) + pool.length) % pool.length;
  let pick = pool[idx];
  // "Change this piece" / "another outfit": step through the other suitable
  // pieces, the user's style first, never landing on the same piece twice in a row.
  if (roll > 0) {
    const uniq = [];
    for (const o of [...pool, ...pool0]) if (!uniq.some(u => u.key === o.key)) uniq.push(o);
    const start = Math.max(0, uniq.findIndex(u => u.key === pick.key));
    pick = uniq[(start + roll) % uniq.length];
  }
  return pick.base ? base : { item: pick.item, reason: c => pick.reason.replace('{t}', c.feelsLike) };
}

// The user's own changes to today's outfit (app.js `state.adjust`):
//   reroll: whole-outfit dice count, slotRolls: { slot: n } single-piece changes,
//   avoid: drawing kinds they don't want (e.g. ['boot']), want: kinds they asked for (e.g. ['sandal']),
//   tone: 'dark' | 'bright' | 'light'.
// A piece the user doesn't want is avoided in its women's/men's versions too.
const AVOID_GROUPS = [['puffer', 'pufferw', 'parka'], ['coat', 'wrapcoat'], ['jacket', 'cropjacket'], ['blazer', 'blazerw'],
  ['shirt', 'shortshirt', 'blouse'], ['shorts', 'minishorts'], ['sunglasses', 'catglasses']];
function expandAvoid(list) {
  const out = new Set(list || []);
  for (const a of list || []) for (const g of AVOID_GROUPS) if (g.includes(a)) g.forEach(x => out.add(x));
  return [...out];
}
const BRIGHT_COLORS = ['#e2564c', '#2f8f8a', '#e9b44c', '#3e8fee', '#b7473b', '#7b4fa3', '#ff8a4c'];
function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
}
function saturation(hex) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return Math.max(...c) - Math.min(...c);
}
function toneColor(tone, color, palette, hash) {
  if (tone === 'dark') {
    const dark = (palette || []).filter(c => luminance(c) < 110);
    if (dark.length) return dark[hash % dark.length];
    return luminance(color) < 110 ? color : shade(color, -0.55);
  }
  if (tone === 'light') {
    const light = (palette || []).filter(c => luminance(c) > 190);
    if (light.length) return light[hash % light.length];
    return luminance(color) > 190 ? color : shade(color, 0.6);
  }
  if (tone === 'bright') {
    const vivid = (palette || []).filter(c => saturation(c) > 90);
    return vivid.length ? vivid[hash % vivid.length] : BRIGHT_COLORS[hash % BRIGHT_COLORS.length];
  }
  return color;
}

// How far past the band edge the day really is. Bands are wide (everything
// at or below 2° is "dondurucu"), so very cold days get extra layers on top.
function coldLevel(temp) {
  if (temp <= -18) return 3;
  if (temp <= -12) return 2;
  if (temp <= -6) return 1;
  return 0;
}

export function generateOutfit({ feelsLike, wind, rainMax, gender, lang, comfort = 0, vibe = 'casual', seed = '', kind = null, wardrobeOnly = false, memory = null, adjust = null, shift = 0, late = false, uv = null, occasion = null }, allItems = [], locks = {}) {
  // What they're doing today sets the style (unless they picked one themselves)
  // and rules out pieces that don't belong (no slides at work, no heels at the gym).
  const occ = OCCASIONS[occasion] || null;
  const adj0 = adjust || {};
  const adj = occ ? { ...adj0, avoid: [...(adj0.avoid || []), ...occ.avoid], want: [...(adj0.want || []), ...(occ.want || [])] } : adj0;
  if (occ && occ.vibe && !adj0.vibe) vibe = occ.vibe;
  // Turkish and English have their own wording; every other language runs on
  // the English rules and is translated on the way out (outfit_i18n.js).
  const outLang = lang || 'tr';
  const language = outLang === 'tr' ? 'tr' : 'en';
  const L = s => tx(outLang, s);
  // Reasons are rendered as templates first ({t} feels-like, {w} wind, {r} rain),
  // so they can be translated whole and the numbers dropped in afterwards.
  const PH = { feelsLike: '{t}', wind: '{w}', rainMax: '{r}' };
  const X = EXTRAS[language];
  // `comfort` shifts the band for people who run cold (-3) or warm (+3); the
  // temperatures quoted in the reasons stay the real ones.
  const feltWeather = feelsLike + comfort;
  // A day like this one went badly before (feedback.js): dress for a band colder
  // (they were cold) or warmer (they were too warm). The label keeps the real weather.
  const memoryShift = memory === 'cold' ? -4 : memory === 'warm' ? 4 : 0;
  // `shift`: the user asked for warmer/lighter today (-3 per "warmer"); the label keeps the real weather.
  const felt = feltWeather + memoryShift + shift;
  const bandKey = getBand(felt);
  const coldWeather = coldLevel(feltWeather);
  const cold = coldLevel(felt);
  const extremeHeat = felt >= 35;
  const I = INTENSITY[language];
  const genderKey = ['unisex', 'kadin', 'erkek'].includes(gender) ? gender : 'unisex';
  const rows = clone(BASE[language][bandKey][genderKey]);
  // Only pieces meant for this gender (or for anyone) are used from the wardrobe.
  const wardrobeItems = genderKey === 'unisex' ? allItems.slice()
    : allItems.filter(i => !i.gender || i.gender === 'unisex' || i.gender === genderKey);
  const onlyMine = wardrobeOnly && wardrobeItems.length > 0;
  // With suggestions to fall back on, an owned piece that doesn't fit today's plans stays in the wardrobe.
  if (occ && !onlyMine) {
    const off = new Set(expandAvoid(occ.avoid));
    for (let i = wardrobeItems.length - 1; i >= 0; i--) if (off.has(itemLook(wardrobeItems[i]).art)) wardrobeItems.splice(i, 1);
  }

  // Below -3° precipitation falls as snow: snow boots instead of an umbrella.
  const snowFall = rainMax >= 50 && feelsLike <= -3;
  const snowy = kind === 'snow' || snowFall;
  const rainy = rainMax >= 50 && !snowFall;
  const freezing = bandKey === 'dondurucu' || snowy;
  // `late`: it's already evening where they are, so no sunglasses or sun hat.
  // The day's UV index decides the sun gear when we have it: 3+ means sunglasses,
  // 6+ (or 3+ in a heatwave) a hat as well. Without it, the sky and heat decide.
  const hasUv = typeof uv === 'number' && isFinite(uv);
  const sunny = !late && !rainy && (hasUv
    ? uv >= 6 || (bandKey === 'cok_sicak' && uv >= 3)
    : bandKey === 'cok_sicak' || (bandKey === 'sicak' && (kind === 'clear' || kind === 'partly')));
  const lightSun = !late && !rainy && !sunny && (hasUv ? uv >= 3 : kind === 'clear' && (bandKey === 'serin' || bandKey === 'ilik'));
  const fixed = new Set(); // slots whose text the weather rules set; variants don't override them

  // Wind: with no jacket in the base outfit, add a thin windproof one. If there
  // is one, it's still chosen like any other piece and gets the wind note afterwards.
  const windOnJacket = wind >= 20 && !!rows.dis;
  if (wind >= 20 && !rows.dis) { applyWind(rows, wind, language); fixed.add('dis'); }
  // Rain and snow decide the shoes, but there's more than one safe choice.
  const shoeRoll = (adj.reroll || 0) + ((adj.slotRolls || {}).ayak || 0);
  const pickShoe = list => {
    const art = it => garmentVariant('ayak', it, BAND_WARMTH[bandKey]);
    const ok = list.filter(it => !expandAvoid(adj.avoid).includes(art(it)));
    const asked = ok.filter(it => (adj.want || []).includes(art(it)));
    const pool = asked.length ? asked : ok.length ? ok : list;
    return pool[shoeRoll % pool.length];
  };
  if (rainy) {
    applyRain(rows, bandKey, rainMax, language); fixed.add('ayak'); fixed.add('yanina');
    const alts = COLD_BANDS.includes(bandKey) ? X.rain_shoes_cold : WARM_BANDS.includes(bandKey) && bandKey !== 'ilik' ? X.rain_shoes_hot : X.rain_shoes_mild;
    rows.ayak = { ...rows.ayak, item: pickShoe(alts), swappable: true };
  }
  if (snowy) { rows.ayak = { item: pickShoe(X.snow_shoes), reason: () => X.snow_shoe[1], swappable: true }; fixed.add('ayak'); }
  // One accessory from a pool: the user's style first (minimal borrows elegant),
  // only pieces for their gender, changing by day; the swap button steps through all.
  const pickAccessory = pool => {
    const wantVibe = vibe === 'minimal' ? 'elegant' : vibe || 'casual';
    // After dark a style pick is never a hat.
    const fits = (pool || []).filter(([, item, , g]) => (!g || g === genderKey) && !(late && accessoryArts(item).some(a => ['cap', 'bucket', 'strawhat'].includes(a))));
    const mine = fits.filter(([v]) => v === wantVibe);
    const ordered = mine.concat(fits.filter(e => !mine.includes(e)));
    if (!ordered.length) return null;
    const roll = (adj.reroll || 0) + ((adj.slotRolls || {}).yanina || 0);
    const start = mine.length ? hashStr(`${seed}|acc`) % mine.length : 0;
    const [, item, reason] = ordered[(start + roll) % ordered.length];
    return { item, reason: () => reason, swappable: true };
  };
  // Accessories for the conditions: umbrella (rain), beanie/scarf/gloves (freezing), cap (strong sun).
  let accKinds = null;
  if (freezing && rainy) { rows.yanina = { item: X.cold_rain_acc[0], reason: () => X.cold_rain_acc[1] }; accKinds = ['umbrella']; }
  else if (rainy) accKinds = ['umbrella'];
  else if (freezing) { rows.yanina = { item: X.cold_acc[0], reason: () => X.cold_acc[1] }; fixed.add('yanina'); accKinds = ['beanie', 'scarf']; }
  else if (sunny) { rows.yanina = pickAccessory(X.sun_accs); fixed.add('yanina'); accKinds = ['sunglasses', 'catglasses', 'cap', 'bucket', 'strawhat']; }
  // Sun that's bright but not strong: sunglasses, with a bag or belt on warm days.
  // On cooler days it's the low, glaring sun: just sunglasses (dark frame).
  else if (lightSun && !rows.yanina && (WARM_BANDS.includes(bandKey) || bandKey === 'serin')) {
    rows.yanina = bandKey === 'serin' ? { item: X.cool_sun_acc[0], reason: () => X.cool_sun_acc[1] } : pickAccessory(X.sun_light);
    fixed.add('yanina'); accKinds = ['sunglasses', 'catglasses'];
  }
  // Otherwise on a mild or warm day: one accessory that finishes the look.
  else if (WARM_BANDS.includes(bandKey) && !rows.yanina) {
    rows.yanina = pickAccessory(X.style_acc); fixed.add('yanina'); accKinds = ['bag', 'tote', 'crossbody', 'belt', 'watch', 'cap', 'bucket'];
  }

  const ctx = { feelsLike, wind, rainMax };
  const needsRain = rainy || snowy;
  const needsWind = wind >= 20;
  const pickOpts = { bandKey, needsRain, needsWind, allowArts: { yanina: accKinds || ['__none__'] }, relaxed: onlyMine, seed: String(seed || '') + (adj.reroll ? `#${adj.reroll}` : '') };
  const optional = (OPTIONAL_SLOTS[bandKey] || []).filter(k => !rows[k]);
  const picks = pickWardrobeOutfit(wardrobeItems, SLOT_ORDER.filter(k => rows[k] || optional.includes(k)), pickOpts, locks);
  for (const k of optional) if (picks[k]) rows[k] = { item: picks[k].name, reason: '' };
  // A mild day has room for one light layer over the top. Wind or rain keep
  // the jacket; otherwise an owned piece wins over a suggestion, and if both
  // are owned the cardigan stays and the jacket goes.
  if (bandKey === 'ilik' && rows.ustune && rows.dis) {
    if (needsWind || needsRain || (picks.dis && !picks.ustune)) { delete rows.ustune; delete picks.ustune; }
    else { delete rows.dis; delete picks.dis; }
  }
  const pickedItems = Object.values(picks);
  // Wardrobe-only: drop every suggested slot; what's missing or off becomes a tip.
  const tips = onlyMine ? wardrobeTips({ rows, picks, bandKey, needsRain, needsWind, language, L }) : [];
  if (onlyMine) for (const k of SLOT_ORDER) if (!picks[k]) delete rows[k];

  // Today's wording for every suggested slot (style + date), avoiding repeats of owned pieces.
  const ownedUpperArts = UPPER.filter(k => picks[k]).map(k => itemLook(picks[k]).art);
  for (const key of SLOT_ORDER) {
    if (!rows[key] || picks[key] || fixed.has(key)) continue;
    const roll = (adj.reroll || 0) + ((adj.slotRolls || {})[key] || 0);
    rows[key] = { ...chooseVariant(rows[key], { language, bandKey, slot: key, genderKey, vibe, seed, avoidArts: ownedUpperArts.concat(expandAvoid(adj.avoid)), wantArts: adj.want || [], warmth: BAND_WARMTH[bandKey], feelsLike, roll, occ }), swappable: true };
  }
  if (windOnJacket && rows.dis && !picks.dis) {
    const swappable = rows.dis.swappable;
    applyWind(rows, wind, language);
    rows.dis.swappable = swappable;
  }

  // ---- Layers: one base layer (ust) and at most one warm layer (ustune) ----
  // "Thermal under a sweater" becomes two rows; a sweater top never gets a
  // cardigan on top of it (on freezing days the sweater moves up a layer and a
  // thin thermal goes underneath instead).
  const isMid = (slot, item) => MID_ARTS.includes(garmentVariant(slot, item, BAND_WARMTH[bandKey]));
  const split = rows.ust && !picks.ust ? (LAYER_SPLIT[language] || {})[rows.ust.item] : null;
  if (split) {
    const { reason: comboReason, swappable } = rows.ust;
    const thermal = /termal|thermal|içlik/i.test(split[0]);
    rows.ust = { item: split[0], reason: () => (thermal ? X.base_thermal[1] : X.base_plain_reason), swappable };
    if (!picks.ustune) rows.ustune = { item: split[1], reason: comboReason, stripLead: true, swappable };
  } else if (rows.ust && !picks.ust && rows.ustune && !picks.ustune && isMid('ust', rows.ust.item)) {
    if (bandKey === 'dondurucu') {
      rows.ustune = { ...rows.ust, stripLead: true };
      rows.ust = { item: X.base_thermal[0], reason: () => X.base_thermal[1], swappable: rows.ustune.swappable };
    } else {
      delete rows.ustune;
    }
  }
  // An owned sweater/hoodie as the top already is the warm layer.
  if (picks.ust && rows.ustune && !picks.ustune && MID_ARTS.includes(itemLook(picks.ust).art)) delete rows.ustune;
  // A cold day with a light suggested top (a shirt, a tee): add one warm layer over it.
  if (bandKey === 'soguk' && rows.ust && !picks.ust && !rows.ustune && !isMid('ust', rows.ust.item)) {
    const roll = (adj.reroll || 0) + ((adj.slotRolls || {}).ustune || 0);
    rows.ustune = { ...chooseVariant({ item: language === 'tr' ? 'İnce yün hırka' : 'Fine wool cardigan', reason: () => REASONS.wool_warm[language === 'tr' ? 0 : 1] }, { language, bandKey, slot: 'ustune', genderKey, vibe, seed, avoidArts: expandAvoid(adj.avoid), wantArts: adj.want || [], warmth: BAND_WARMTH[bandKey], feelsLike, roll, occ }), swappable: true, stripLead: false };
  }

  // ---- Keep suggestions consistent with what the user is actually wearing ----
  const ownBottom = picks.alt ? itemLook(picks.alt).art : null;
  const bottomArt = ownBottom || (rows.alt ? garmentVariant('alt', rows.alt.item, BAND_WARMTH[bandKey]) : null);
  // A dress is a whole look: no top with it when it's mild or warm (owned or
  // suggested), and in the cold the top becomes the layer worn under the dress.
  if (ONE_PIECE.includes(bottomArt) && rows.ust) {
    if (WARM_BANDS.includes(bandKey) || bandKey === 'serin') { delete rows.ust; delete picks.ust; }
    // Only for an owned dress: a suggested winter dress already comes with its tights.
    else if (ownBottom === 'dress' && !picks.ust) rows.ust = { item: X.dress_cold_top[0], reason: () => X.dress_cold_top[1] };
  }
  // A suggested mid layer that would be the same garment as an owned top, or
  // an extra layer under an already very warm owned coat, is dropped/softened.
  if (rows.ustune && !picks.ustune) {
    const midArt = garmentVariant('ustune', rows.ustune.item, BAND_WARMTH[bandKey]);
    if (ownedUpperArts.includes(midArt)) delete rows.ustune;
    else if (bandKey === 'dondurucu' && picks.dis && (picks.dis.warmth || 3) >= 5) { const sm = X['soft_mid_' + genderKey] || X.soft_mid; rows.ustune = { item: sm[0], reason: () => sm[1] }; }
  }

  // ---- Extra protection for very cold and very hot days ----
  if (cold >= 2 && rows.dis && !picks.dis) {
    const windNote = (fixed.has('dis') || windOnJacket) && typeof rows.dis.reason === 'function' ? rows.dis.reason(PH) : '';
    rows.dis = { item: I.deep_coat[0], reason: () => I.deep_coat[1] + (windNote ? `. ${windNote}` : '') };
  }
  if (!picks.yanina && !rainy && !onlyMine) {
    if (cold >= 3) rows.yanina = { item: I.l3_acc[0], reason: () => I.l3_acc[1] };
    else if (cold >= 2) rows.yanina = { item: I.l2_acc[0], reason: () => I.l2_acc[1] };
    else if (extremeHeat && !late) rows.yanina = { item: I.heat_acc[0], reason: () => I.heat_acc[1] };
  }
  // ---- What this person told us about a day like this (feedback.js) ----
  // Cold last time: one more layer (a mid layer if there's none, plus a thin
  // base layer under the top). Too warm last time: drop the extra mid layer.
  let learnNote = '';
  if (memory === 'cold' && !['sicak', 'cok_sicak'].includes(bandKey)) {
    if (!rows.ustune && !onlyMine) {
      if (rows.ust && !picks.ust && isMid('ust', rows.ust.item)) {
        // The top is already a sweater: the extra layer goes underneath it.
        rows.ustune = { ...rows.ust, stripLead: true };
        rows.ust = { item: X.base_thermal[0], reason: () => X.base_thermal[1], swappable: rows.ustune.swappable };
      } else if (!(picks.ust && MID_ARTS.includes(itemLook(picks.ust).art))) {
        rows.ustune = { item: X.learn_mid[0], reason: () => X.learn_mid[1] };
      }
    }
    // Only suggest a thin base layer if the top doesn't already have one.
    if (rows.ust && !/termal|thermal|içlik/i.test(rows.ust.item)) learnNote = X.learn_cold_note;
  } else if (memory === 'warm') {
    if (rows.ustune && !picks.ustune) delete rows.ustune;
    learnNote = X.learn_warm_note;
  }
  const notes = {};
  if (learnNote && rows.ust) notes.ust = learnNote;
  if (cold >= 1) { notes.alt = I.thermal_legs; notes.ayak = I.wool_socks; }
  if (cold >= 3) notes.ust = (notes.ust || '') + I.l3_layers;
  if (wind >= 50 && COLD_BANDS.includes(bandKey)) notes.dis = I.gale;

  const output = [];
  const usedReasons = new Set();
  for (const key of SLOT_ORDER) {
    const r = rows[key];
    if (!r) continue;
    let item = r.item;
    let reason = typeof r.reason === 'function' ? r.reason(PH) : r.reason;
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
      reason = wardrobeReason(match, PH, needsRain, needsWind, key, language, pickedItems, BAND_WARMTH[bandKey], outLang);
      // In the freezing cold one owned scarf or hat isn't the whole job.
      if (key === 'yanina' && freezing && !rainy) {
        const accArt = itemLook(match).art;
        reason += L(accArt === 'beanie' ? X.acc_rest_scarf : accArt === 'scarf' ? X.acc_rest_hat : X.acc_rest_all);
      }
      // Bare legs in the cold: remind about tights under the user's own skirt/shorts/dress.
      if (key === 'alt' && ['skirt', 'shorts', 'minishorts', 'dress'].includes(itemLook(match).art)) {
        if (COLD_BANDS.includes(bandKey)) reason += L(X.tights_cold);
        else if (bandKey === 'serin') reason += L(X.tights_cool);
      }
    }

    // Skip a note the suggestion already covers (e.g. "...altına termal tayt").
    if (notes[key] && !(key === 'alt' && /termal|thermal|tayt|tights|leggings/i.test(item + reason)) && !(key === 'ayak' && /yün çorap|wool socks/i.test(item + reason))) reason = (reason && !/[.!?。！？।]$/.test(reason) ? reason + (match ? L('.') : '.') : reason) + (match ? L(notes[key]) : notes[key]);

    // Wardrobe pieces draw from their own stored look; suggestions guess from the text.
    let look = match ? itemLook(match) : { art: garmentVariant(key, item, BAND_WARMTH[bandKey]), color: null, color2: null, patternType: 'solid', details: {} };
    if (!match && GENDER_ART[genderKey] && GENDER_ART[genderKey][look.art]) look.art = GENDER_ART[genderKey][look.art];
    const pal = GENDER_PALETTE[genderKey] && GENDER_PALETTE[genderKey][look.art];
    const colorHash = hashStr(`${seed}|${key}|${look.art}|${adj.reroll || 0}|${(adj.slotRolls || {})[key] || 0}`);
    if (!match && pal) look.color = pal[colorHash % pal.length];
    if (!match && adj.tone && !GLASSES.includes(look.art)) look.color = toneColor(adj.tone, look.color || garmentDefaultColor(look.art), pal, colorHash);
    // Glasses follow the weather: light frame and warm tint in the heat, dark otherwise.
    if (GLASSES.includes(look.art)) look = { ...look, lens: WARM_BANDS.includes(bandKey) && bandKey !== 'ilik' ? 'light' : 'dark' };
    // Whether a stylist may recolor a suggested piece: not when the text names its
    // color ("white linen shirt"), only a bright color when it says "colorful".
    const colorRule = match ? 'fixed' : COLOR_WORD.test(item) ? 'fixed' : ACCENT_WORD.test(item) ? 'accent' : 'free';
    // A suggestion that names its color is drawn in that color ("Beyaz ince tişört", "Koyu renk kot").
    if (!match && colorRule === 'fixed' && !GLASSES.includes(look.art)) {
      const named = namedColor(item, look.art);
      if (named) look = { ...look, color: named };
    }
    // A suggested accessory row can name two things ("sunglasses and a straw hat"): draw both.
    if (key === 'yanina' && !match) {
      const g = GENDER_ART[genderKey] || {};
      look = { ...look, accArts: accessoryArts(item).map(a => g[a] || a) };
    }
    if (match) color = look.color;
    const art = look.art;
    // Suggestions: translate the finished English/Turkish text, then fill in the numbers.
    // (A wardrobe row's reason is already in the user's language.)
    // Two pieces with the same short reason read like a template: the second one
    // gets another fitting sentence for its slot.
    if (!match && usedReasons.has(reason)) {
      const alt = (SLOT_REASONS[key] || []).map(k => REASONS[k][language === 'tr' ? 0 : 1]).find(x => !usedReasons.has(x));
      if (alt) reason = alt;
    }
    usedReasons.add(reason);
    if (!match) { item = L(item); reason = L(reason); }
    // A warm layer split off a combined top keeps its reason without the
    // "Feels like {t}°." opening (that stays on the first row).
    if (r.stripLead) reason = reason.replace(/^[^.]*\{t\}°\.\s*/, '');
    reason = fillTemplate(reason, ctx);
    output.push({ slotKey: key, art, look, icon: SLOT_ICON[key], label: slotLabel(key, outLang), item, reason, fromWardrobe, color, patterned, itemId, options, colorRule, locked: !!(match && locks[key] === match.id), swappable: !match && !!r.swappable });
  }

  const labelKey = coldWeather >= 2 ? 'extreme_cold' : coldWeather === 1 ? 'very_cold' : feltWeather >= 35 ? 'extreme_hot' : getBand(feltWeather);
  return { bandKey, intensity: labelKey, bandLabel: bandLabel(labelKey, outLang), rows: output, tips, wardrobeOnly: onlyMine };
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

function wardrobeReason(item, ctx, needsRain, needsWind, slotKey, lang, picked = [], desired = 3, outLang = lang) {
  const partner = colorPartner(item, picked);
  const diff = (item.warmth || 3) - desired;
  const isAcc = slotKey === 'yanina';
  if (lang === 'en') {
    const L = s => tx(outLang, s);
    const bits = [L(isAcc ? 'Goes with today' : diff < -1 ? 'A bit thin for {t}°' : diff > 1 ? 'A bit warm for {t}°' : 'Right warmth for {t}°')];
    if (needsRain && slotKey === 'ayak') bits.push(L(item.rainOk ? 'handles rain' : 'not waterproof'));
    if (needsWind && slotKey === 'dis' && item.windproof) bits.push(L('blocks wind'));
    if (partner) bits.push(L('{c} pairs well with your {n}').replace('{c}', colorName(item.color, outLang).toLocaleLowerCase(outLang)).replace('{n}', partner.name));
    return bits.join(L(', ')) + L('.');
  }
  const bits = [isAcc ? 'Bugüne uygun' : diff < -1 ? `Hissedilen ${ctx.feelsLike}° için biraz ince kalabilir` : diff > 1 ? `Hissedilen ${ctx.feelsLike}° için biraz kalın` : `Hissedilen ${ctx.feelsLike}° için kalınlığı tam`];
  if (needsRain && slotKey === 'ayak') bits.push(item.rainOk ? 'yağmura dayanıklı' : 'su geçirmez değil');
  if (needsWind && slotKey === 'dis' && item.windproof) bits.push('rüzgar kesiyor');
  // The color note follows a semicolon: "Bugüne uygun; kırmızı, Siyah bere ile iyi gider."
  const color = partner ? `${colorName(item.color, 'tr').toLocaleLowerCase('tr')}, ${partner.name} ile iyi gider` : '';
  return bits.join(', ') + (color ? `; ${color}` : '') + '.';
}

// Advice for an outfit made only from the user's own clothes: what to add,
// what may be too warm, what won't handle the weather.
const TIP_TEXT = {
  tr: {
    add_layer: 'Bu hava için üstün ince kalıyor. Üstüne hırka veya kalın bir kat daha al.',
    add_coat: 'Dolabında bu soğuğa uygun bir mont yok. Dışarıda uzun kalacaksan kalın bir mont şart.',
    add_mid: 'Montunun altına bir hırka ya da polar eklersen daha sıcak olur.',
    thin_top: '{n} bu soğuk için ince. Altına termal ya da üstüne bir kazak giy.',
    thin_bottom: 'Altın bu hava için ince kalıyor. Altına tayt veya termal giyebilirsin.',
    no_bottom: 'Dolabında bu havaya uygun bir alt yok.',
    no_shoe: 'Dolabında bu havaya uygun bir ayakkabı yok.',
    thin_shoe: 'Ayakkabın bu soğuk için ince, kalın çorap giy.',
    open_shoe: '{n} bu soğukta olmaz, kapalı bir ayakkabı ya da bot giy.',
    too_warm: '{n} bugün için kalın, bunaltabilir. Daha ince bir şey varsa onu seç.',
    wet_shoe: '{n} su geçirmez değil, yağmurda ıslanabilir.',
    wind: '{n} rüzgarı kesmiyor, altına bir kat daha al.',
    umbrella: 'Yağmur bekleniyor, yanına bir şemsiye al.',
    cold_acc: 'Bere, atkı ve eldiven de al.',
    all_good: 'Dolabındakiler bu havaya gayet uygun, ekstra bir şeye gerek yok.',
  },
  en: {
    add_layer: 'Your top is thin for this weather. Add a cardigan or another warm layer on top.',
    add_coat: "There's no coat in your wardrobe for this cold. If you'll be out long, you need a warm one.",
    add_mid: "A cardigan or fleece under your coat would keep you warmer.",
    thin_top: '{n} is thin for this cold. Wear thermals under it or a sweater over it.',
    thin_bottom: 'Your bottoms are thin for this weather. Wear leggings or thermals underneath.',
    no_bottom: 'Nothing in your wardrobe fits as bottoms for this weather.',
    no_shoe: 'No shoes in your wardrobe fit this weather.',
    thin_shoe: 'Your shoes are light for this cold, wear thick socks.',
    open_shoe: "{n} won't work in this cold, wear closed shoes or boots.",
    too_warm: '{n} is warm for today and may make you sweat. Pick something thinner if you have it.',
    wet_shoe: "{n} isn't waterproof and may get wet in the rain.",
    wind: "{n} doesn't block the wind, add a layer underneath.",
    umbrella: 'Rain is expected, take an umbrella.',
    cold_acc: 'Take a beanie, scarf and gloves too.',
    all_good: 'Your clothes suit this weather well, nothing else needed.',
  },
};

function wardrobeTips({ rows, picks, bandKey, needsRain, needsWind, language, L = s => s }) {
  const T0 = TIP_TEXT[language] || TIP_TEXT.tr;
  const T = Object.fromEntries(Object.entries(T0).map(([k, v]) => [k, L(v)]));
  const desired = BAND_WARMTH[bandKey];
  const w = it => (it ? it.warmth || 3 : 0);
  const tips = [];
  const cold = COLD_BANDS.includes(bandKey);
  const uppers = UPPER.map(k => picks[k]).filter(Boolean);
  const warmestUpper = Math.max(0, ...uppers.map(w));
  if (cold && rows.dis && !picks.dis) tips.push(T.add_coat);
  else if (uppers.length && warmestUpper < desired - 1) tips.push(T.add_layer);
  else if (cold && picks.dis && !picks.ustune && w(picks.dis) < desired) tips.push(T.add_mid);
  if (cold && picks.ust && !picks.ustune && w(picks.ust) < desired - 2 && warmestUpper >= desired - 1) tips.push(T.thin_top.replace('{n}', picks.ust.name));
  if (rows.alt && !picks.alt) tips.push(T.no_bottom);
  else if (picks.alt && w(picks.alt) < desired - 1) tips.push(T.thin_bottom);
  if (rows.ayak && !picks.ayak) tips.push(T.no_shoe);
  else if (picks.ayak && (cold || bandKey === 'serin') && itemLook(picks.ayak).art === 'sandal') tips.push(T.open_shoe.replace('{n}', picks.ayak.name));
  else if (picks.ayak && cold && w(picks.ayak) < desired - 1) tips.push(T.thin_shoe);
  for (const k of SLOT_ORDER) {
    const it = picks[k];
    if (it && k !== 'yanina' && w(it) > desired + 1) tips.push(T.too_warm.replace('{n}', it.name));
  }
  if (needsRain && picks.ayak && !picks.ayak.rainOk) tips.push(T.wet_shoe.replace('{n}', picks.ayak.name));
  if (needsWind && !WARM_BANDS.includes(bandKey) && picks.dis && !picks.dis.windproof) tips.push(T.wind.replace('{n}', picks.dis.name));
  if (needsRain && rows.yanina && !picks.yanina && bandKey !== 'dondurucu') tips.push(T.umbrella);
  if (bandKey === 'dondurucu' && !picks.yanina) tips.push(T.cold_acc);
  if (!tips.length) tips.push(T.all_good);
  return tips;
}

// Every English sentence the engine can show, as templates. The language check
// (tests/check_outfits.html) uses this to make sure each one is translated.
export function englishTemplates() {
  const PH = { feelsLike: '{t}', wind: '{w}', rainMax: '{r}' };
  const out = new Set();
  const add = v => { if (typeof v === 'string' && v.trim()) out.add(v); };
  const reasonOf = r => (typeof r === 'function' ? r(PH) : r);
  for (const band of Object.values(BASE.en)) for (const g of Object.values(band)) for (const slot of Object.values(g)) { add(slot.item); add(reasonOf(slot.reason)); }
  for (const band of Object.values(VARIANTS.en)) for (const list of Object.values(band)) for (const [, item, reason] of list) { add(item); add(reason); }
  for (const g of Object.values(GENDERED.en)) for (const band of Object.values(g)) for (const list of Object.values(band)) for (const [, item, reason] of list) { add(item); add(reason); }
  for (const v of Object.values(EXTRAS.en)) (Array.isArray(v) ? v : [v]).forEach(add);
  for (const v of Object.values(INTENSITY.en)) (Array.isArray(v) ? v : [v]).forEach(add);
  Object.values(RAIN_SHOE.en).forEach(add);
  Object.values(LAYER_SPLIT.en).forEach(pair => pair.forEach(add));
  Object.values(TIP_TEXT.en).forEach(add);
  // Weather rules and wardrobe reasons (built in code).
  const rows = { dis: { item: 'x' } };
  applyWind(rows, 0, 'en'); add(reasonOf(rows.dis.reason));
  const rows2 = {}; applyWind(rows2, 0, 'en'); add(rows2.dis.item); add(reasonOf(rows2.dis.reason));
  const rows3 = {}; applyRain(rows3, 'serin', 0, 'en'); add(reasonOf(rows3.ayak.reason)); add(rows3.yanina.item); add(reasonOf(rows3.yanina.reason));
  [', ideally windproof', 'Goes with today', 'A bit thin for {t}°', 'A bit warm for {t}°', 'Right warmth for {t}°',
    'handles rain', 'not waterproof', 'blocks wind', '{c} pairs well with your {n}'].forEach(add);
  return [...out];
}

