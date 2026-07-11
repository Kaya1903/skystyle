import { findWardrobeMatch } from './wardrobe.js';
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
        ust: { item: 'İnce termal içlik, üzerine kalın örgü kazak', reason: c => `Hissedilen ${c.feelsLike}° — çıplak tişörtle olmaz, önce ince bir termal al` },
        ustune: { item: 'Kalın polar hırka', reason: () => `Kazağın üstüne bir şey al, sıcak içeride kalsın` },
        dis: { item: 'Dizüstü kalın mont, kapüşonlu', reason: c => `${c.feelsLike}° hissedilende kısa mont yetmez, uzun ve kalın olanı giy` },
        alt: { item: 'Astarlı kalın pantolon', reason: () => `İnce pantolon bu soğukta hiç iyi gelmez, astarlı olan lazım` },
        ayak: { item: 'Kalın tabanlı bot, yün çorapla', reason: () => `Zeminden gelen soğuğu kesmesi lazım` },
      },
      kadin: {
        ust: { item: 'İnce termal içlik, üzerine kalın triko kazak', reason: c => `Hissedilen ${c.feelsLike}° — ince kazak tek başına yetmez, altına termal giy` },
        ustune: { item: 'Kalın örgü hırka', reason: () => `Kazağın üstüne bir şey al, sıcak içeride kalsın` },
        dis: { item: 'Dizüstü kalın mont, kapüşonlu', reason: c => `${c.feelsLike}° hissedilende kısa mont yetmez, uzun ve kalın olanı giy` },
        alt: { item: 'Astarlı kalın pantolon (ya da kalın tayt üstüne uzun yünlü etek)', reason: () => `Bacakların açıkta kalmasın, kalın ve astarlı olsun` },
        ayak: { item: 'Kalın tabanlı, su geçirmez bot', reason: () => `Zeminden gelen soğuğu kesmesi lazım` },
      },
      erkek: {
        ust: { item: 'İnce termal içlik, üzerine kalın örgü kazak', reason: c => `Hissedilen ${c.feelsLike}° — çıplak tişörtle olmaz, önce ince bir termal al` },
        ustune: { item: 'Kalın polar hırka', reason: () => `Kazağın üstüne bir şey al, sıcak içeride kalsın` },
        dis: { item: 'Dizüstü kalın mont, kapüşonlu', reason: c => `${c.feelsLike}° hissedilende kısa mont yetmez, uzun ve kalın olanı giy` },
        alt: { item: 'Astarlı kalın kumaş pantolon', reason: () => `İnce pantolon bu soğukta hiç iyi gelmez, astarlı olan lazım` },
        ayak: { item: 'Kalın tabanlı bot, yün çorapla', reason: () => `Zeminden gelen soğuğu kesmesi lazım` },
      },
    },
    soguk: {
      unisex: {
        ust: { item: 'Kalın kumaşlı düz tişört, üstüne kalın örgü kazak', reason: c => `Hissedilen ${c.feelsLike}° — ince tişört tek başına yetmez, üstüne kalın kazak giy` },
        dis: { item: 'Astarlı kumaş ceket ya da kalın parka', reason: c => `${c.feelsLike}° hissedilende dışarıda ceketsiz durmak zor, astarlı bir ceket al` },
        alt: { item: 'Kalın kumaş pantolon', reason: () => `Kalın kumaş bacaklarını soğuktan korur` },
        ayak: { item: 'Kapalı, kalın tabanlı bot', reason: () => `Ayakların açıkta kalmasın, kapalı ayakkabı şart` },
      },
      kadin: {
        ust: { item: 'Kalın kumaşlı düz tişört, üstüne kalın triko kazak', reason: c => `Hissedilen ${c.feelsLike}° — ince tişört tek başına yetmez, üstüne kalın kazak giy` },
        dis: { item: 'Astarlı kumaş ceket ya da kısa kaban', reason: c => `${c.feelsLike}° hissedilende ceketsiz durmak zor, astarlı olsun` },
        alt: { item: 'Kalın kumaş pantolon (ya da kalın tayt üstüne diz altı etek)', reason: () => `Kalın kumaş bacaklarını soğuktan korur` },
        ayak: { item: 'Kapalı, kalın tabanlı bot', reason: () => `Ayakların açıkta kalmasın, kapalı ayakkabı şart` },
      },
      erkek: {
        ust: { item: 'Kalın kumaşlı düz tişört, üstüne kalın örgü kazak', reason: c => `Hissedilen ${c.feelsLike}° — ince tişört tek başına yetmez, üstüne kalın kazak giy` },
        dis: { item: 'Astarlı kumaş ceket', reason: c => `${c.feelsLike}° hissedilende ceketsiz durmak zor, astarlı bir ceket al` },
        alt: { item: 'Kalın kumaş pantolon', reason: () => `Kalın kumaş bacaklarını soğuktan korur` },
        ayak: { item: 'Kapalı, kalın tabanlı bot', reason: () => `Ayakların açıkta kalmasın, kapalı ayakkabı şart` },
      },
    },
    serin: {
      unisex: {
        ust: { item: 'Kalın kumaşlı düz tişört (beyaz ya da gri)', reason: c => `Hissedilen ${c.feelsLike}° — ince tişört tek başına serin gelir, kalın olanı seç` },
        ustune: { item: 'Tişörtün üstüne önü açık kalın gömlek', reason: () => `Üstüne bir şey al, canın isterse çıkarırsın` },
        dis: { item: 'İnce hırka ya da hafif ceket, istersen elinde taşı', reason: () => `Sabah-akşam serin olabilir, yanına hafif bir şey almakta fayda var` },
        alt: { item: 'Kumaş pantolon', reason: () => `Bu sıcaklıkta kumaş pantolon rahat ve yeterli` },
        ayak: { item: 'Spor ayakkabı ya da kapalı bot', reason: () => `Kapalı ayakkabı bu sıcaklıkta en rahatı` },
      },
      kadin: {
        ust: { item: 'Kalın kumaşlı düz tişört', reason: c => `Hissedilen ${c.feelsLike}° — ince tişört tek başına serin gelir` },
        ustune: { item: 'Üstüne önü açık ince hırka', reason: () => `Üstüne bir şey al, canın isterse çıkarırsın` },
        dis: { item: 'Hafif trençkot, istersen elinde taşı', reason: () => `Sabah-akşam serin olabilir, yanına hafif bir şey almakta fayda var` },
        alt: { item: 'Kumaş pantolon (ya da ince tayt üstüne diz boyu etek)', reason: () => `Bu sıcaklıkta kumaş pantolon rahat ve yeterli` },
        ayak: { item: 'Spor ayakkabı ya da makosen', reason: () => `Kapalı ayakkabı bu sıcaklıkta en rahatı` },
      },
      erkek: {
        ust: { item: 'Kalın kumaşlı düz tişört', reason: c => `Hissedilen ${c.feelsLike}° — ince tişört tek başına serin gelir` },
        ustune: { item: 'Tişörtün üstüne önü açık kalın gömlek', reason: () => `Üstüne bir şey al, canın isterse çıkarırsın` },
        dis: { item: 'İnce, hafif ceket, istersen elinde taşı', reason: () => `Sabah-akşam serin olabilir, yanına hafif bir şey almakta fayda var` },
        alt: { item: 'Kumaş pantolon', reason: () => `Bu sıcaklıkta kumaş pantolon rahat ve yeterli` },
        ayak: { item: 'Makosen ya da spor ayakkabı', reason: () => `Kapalı ayakkabı bu sıcaklıkta en rahatı` },
      },
    },
    ilik: {
      unisex: {
        ust: { item: 'İnce pamuklu tişört', reason: c => `Hissedilen ${c.feelsLike}° — ince tişört tek başına yeterli` },
        ustune: { item: 'Yanına ince bir gömlek ya da hırka al, isteğe bağlı', reason: () => `Akşamüstü serinlerse üstüne bir şey al diye yanında bulunsun` },
        alt: { item: 'İnce kumaş pantolon', reason: () => `Bu ılık havada ince kumaş pantolon rahat eder` },
        ayak: { item: 'Spor ayakkabı', reason: () => `Spor ayakkabı bu sıcaklıkta en rahatı` },
      },
      kadin: {
        ust: { item: 'İnce pamuklu tişört ya da gömlek', reason: c => `Hissedilen ${c.feelsLike}° — ince tişört tek başına yeterli` },
        ustune: { item: 'Yanına ince bir hırka al, isteğe bağlı', reason: () => `Akşamüstü serinlerse üstüne bir şey al diye yanında bulunsun` },
        alt: { item: 'İnce kumaş pantolon ya da midi elbise', reason: () => `Bu ılık havada ince kumaş rahat eder` },
        ayak: { item: 'Spor ayakkabı ya da makosen', reason: () => `Spor ayakkabı bu sıcaklıkta en rahatı` },
      },
      erkek: {
        ust: { item: 'İnce pamuklu tişört', reason: c => `Hissedilen ${c.feelsLike}° — ince tişört tek başına yeterli` },
        ustune: { item: 'Yanına ince bir gömlek al, isteğe bağlı', reason: () => `Akşamüstü serinlerse üstüne bir şey al diye yanında bulunsun` },
        alt: { item: 'İnce kumaş pantolon', reason: () => `Bu ılık havada ince kumaş pantolon rahat eder` },
        ayak: { item: 'Spor ayakkabı ya da makosen', reason: () => `Spor ayakkabı bu sıcaklıkta en rahatı` },
      },
    },
    sicak: {
      unisex: {
        ust: { item: 'İnce, nefes alan tişört (keten ya da pamuklu)', reason: c => `Hissedilen ${c.feelsLike}° — ince ve nefes alan kumaş terletmez` },
        alt: { item: 'İnce kumaş şort ya da hafif pantolon', reason: () => `Hafif kumaş bu sıcakta çok daha rahat` },
        ayak: { item: 'Açık spor ayakkabı ya da sandalet', reason: () => `Ayakların nefes alsın, açık ayakkabı iyi gelir` },
      },
      kadin: {
        ust: { item: 'İnce keten gömlek ya da tişört', reason: c => `Hissedilen ${c.feelsLike}° — ince ve nefes alan kumaş terletmez` },
        alt: { item: 'Hafif kumaş şort ya da yazlık elbise', reason: () => `Hafif kumaş bu sıcakta çok daha rahat` },
        ayak: { item: 'Sandalet ya da açık spor ayakkabı', reason: () => `Ayakların nefes alsın, açık ayakkabı iyi gelir` },
      },
      erkek: {
        ust: { item: 'İnce keten ya da pamuklu tişört', reason: c => `Hissedilen ${c.feelsLike}° — ince ve nefes alan kumaş terletmez` },
        alt: { item: 'Hafif kumaş şort', reason: () => `Hafif kumaş bu sıcakta çok daha rahat` },
        ayak: { item: 'Sandalet ya da açık spor ayakkabı', reason: () => `Ayakların nefes alsın, açık ayakkabı iyi gelir` },
      },
    },
    cok_sicak: {
      unisex: {
        ust: { item: 'Çok ince, açık renk keten gömlek ya da tişört', reason: c => `Hissedilen ${c.feelsLike}° — açık renk ve keten güneşi daha az çeker` },
        alt: { item: 'Hafif keten şort', reason: () => `Bu sıcakta bacakların rahat nefes alsın` },
        ayak: { item: 'Sandalet', reason: () => `Kapalı ayakkabı bu sıcakta bunaltır, sandalet en iyisi` },
      },
      kadin: {
        ust: { item: 'Çok ince, açık renk keten gömlek', reason: c => `Hissedilen ${c.feelsLike}° — açık renk ve keten güneşi daha az çeker` },
        alt: { item: 'Hafif keten şort ya da yazlık etek', reason: () => `Bu sıcakta bacakların rahat nefes alsın` },
        ayak: { item: 'Sandalet', reason: () => `Kapalı ayakkabı bu sıcakta bunaltır, sandalet en iyisi` },
      },
      erkek: {
        ust: { item: 'Çok ince, açık renk keten gömlek', reason: c => `Hissedilen ${c.feelsLike}° — açık renk ve keten güneşi daha az çeker` },
        alt: { item: 'Hafif keten şort', reason: () => `Bu sıcakta bacakların rahat nefes alsın` },
        ayak: { item: 'Sandalet', reason: () => `Kapalı ayakkabı bu sıcakta bunaltır, sandalet en iyisi` },
      },
    },
  },
  en: {
    dondurucu: {
      unisex: {
        ust: { item: 'Thin thermal base layer, thick knit sweater on top', reason: c => `Feels like ${c.feelsLike}° — bare skin under a sweater won't cut it, start with a thin thermal` },
        ustune: { item: 'Thick fleece pullover', reason: () => `Put something over the sweater to keep the warmth in` },
        dis: { item: 'Knee-length puffer coat with a hood', reason: c => `At ${c.feelsLike}° a short jacket isn't enough — go long and thick` },
        alt: { item: 'Lined, heavy trousers', reason: () => `Thin trousers do nothing in this cold, you need a lined pair` },
        ayak: { item: 'Thick-soled boots with wool socks', reason: () => `You need something that blocks the cold coming up from the ground` },
      },
      kadin: {
        ust: { item: 'Thin thermal base layer, thick knit sweater on top', reason: c => `Feels like ${c.feelsLike}° — a thin sweater alone won't do, wear a thermal underneath` },
        ustune: { item: 'Thick knit cardigan', reason: () => `Put something over the sweater to keep the warmth in` },
        dis: { item: 'Knee-length puffer coat with a hood', reason: c => `At ${c.feelsLike}° a short jacket isn't enough — go long and thick` },
        alt: { item: 'Lined, heavy trousers (or thick tights under a long wool skirt)', reason: () => `Don't leave your legs exposed — go lined and heavy` },
        ayak: { item: 'Thick-soled, waterproof boots', reason: () => `You need something that blocks the cold coming up from the ground` },
      },
      erkek: {
        ust: { item: 'Thin thermal base layer, thick knit sweater on top', reason: c => `Feels like ${c.feelsLike}° — bare skin under a sweater won't cut it, start with a thin thermal` },
        ustune: { item: 'Thick fleece pullover', reason: () => `Put something over the sweater to keep the warmth in` },
        dis: { item: 'Knee-length puffer coat with a hood', reason: c => `At ${c.feelsLike}° a short jacket isn't enough — go long and thick` },
        alt: { item: 'Lined, heavy trousers', reason: () => `Thin trousers do nothing in this cold, you need a lined pair` },
        ayak: { item: 'Thick-soled boots with wool socks', reason: () => `You need something that blocks the cold coming up from the ground` },
      },
    },
    soguk: {
      unisex: {
        ust: { item: 'Thick, plain t-shirt with a heavy knit sweater on top', reason: c => `Feels like ${c.feelsLike}° — a thin t-shirt alone isn't enough, put a heavy sweater over it` },
        dis: { item: 'Lined fabric jacket or a heavy parka', reason: c => `At ${c.feelsLike}° going out without a jacket is rough, get a lined one` },
        alt: { item: 'Heavy fabric trousers', reason: () => `Heavy fabric keeps your legs from the cold` },
        ayak: { item: 'Closed, thick-soled boots', reason: () => `Don't leave your feet exposed, closed shoes are a must` },
      },
      kadin: {
        ust: { item: 'Thick, plain t-shirt with a heavy knit sweater on top', reason: c => `Feels like ${c.feelsLike}° — a thin t-shirt alone isn't enough, put a heavy sweater over it` },
        dis: { item: 'Lined fabric jacket or a short coat', reason: c => `At ${c.feelsLike}° going out without a jacket is rough, make it a lined one` },
        alt: { item: 'Heavy fabric trousers (or thick tights under a below-the-knee skirt)', reason: () => `Heavy fabric keeps your legs from the cold` },
        ayak: { item: 'Closed, thick-soled boots', reason: () => `Don't leave your feet exposed, closed shoes are a must` },
      },
      erkek: {
        ust: { item: 'Thick, plain t-shirt with a heavy knit sweater on top', reason: c => `Feels like ${c.feelsLike}° — a thin t-shirt alone isn't enough, put a heavy sweater over it` },
        dis: { item: 'Lined fabric jacket', reason: c => `At ${c.feelsLike}° going out without a jacket is rough, get a lined one` },
        alt: { item: 'Heavy fabric trousers', reason: () => `Heavy fabric keeps your legs from the cold` },
        ayak: { item: 'Closed, thick-soled boots', reason: () => `Don't leave your feet exposed, closed shoes are a must` },
      },
    },
    serin: {
      unisex: {
        ust: { item: 'Thick, plain t-shirt (white or grey)', reason: c => `Feels like ${c.feelsLike}° — a thin t-shirt alone feels cool, pick the heavier one` },
        ustune: { item: 'A heavy shirt worn open over the t-shirt', reason: () => `Bring something to put on, you can take it off if you warm up` },
        dis: { item: 'A light cardigan or jacket, carry it if you don’t need it', reason: () => `Mornings and evenings can be cool, worth bringing something light` },
        alt: { item: 'Fabric trousers', reason: () => `Fabric trousers are comfortable and enough at this temperature` },
        ayak: { item: 'Sneakers or closed boots', reason: () => `Closed shoes are the most comfortable at this temperature` },
      },
      kadin: {
        ust: { item: 'Thick, plain t-shirt', reason: c => `Feels like ${c.feelsLike}° — a thin t-shirt alone feels cool` },
        ustune: { item: 'A thin cardigan worn open on top', reason: () => `Bring something to put on, you can take it off if you warm up` },
        dis: { item: 'A light trench coat, carry it if you don’t need it', reason: () => `Mornings and evenings can be cool, worth bringing something light` },
        alt: { item: 'Fabric trousers (or thin tights under a knee-length skirt)', reason: () => `Fabric trousers are comfortable and enough at this temperature` },
        ayak: { item: 'Sneakers or loafers', reason: () => `Closed shoes are the most comfortable at this temperature` },
      },
      erkek: {
        ust: { item: 'Thick, plain t-shirt', reason: c => `Feels like ${c.feelsLike}° — a thin t-shirt alone feels cool` },
        ustune: { item: 'A heavy shirt worn open over the t-shirt', reason: () => `Bring something to put on, you can take it off if you warm up` },
        dis: { item: 'A light, thin jacket, carry it if you don’t need it', reason: () => `Mornings and evenings can be cool, worth bringing something light` },
        alt: { item: 'Fabric trousers', reason: () => `Fabric trousers are comfortable and enough at this temperature` },
        ayak: { item: 'Loafers or sneakers', reason: () => `Closed shoes are the most comfortable at this temperature` },
      },
    },
    ilik: {
      unisex: {
        ust: { item: 'Thin cotton t-shirt', reason: c => `Feels like ${c.feelsLike}° — a thin t-shirt is enough on its own` },
        ustune: { item: 'Bring a thin shirt or cardigan along, just in case', reason: () => `If it cools off in the evening you'll want something to put on` },
        alt: { item: 'Light fabric trousers', reason: () => `Light fabric trousers are comfortable in this mild weather` },
        ayak: { item: 'Sneakers', reason: () => `Sneakers are the most comfortable choice at this temperature` },
      },
      kadin: {
        ust: { item: 'Thin cotton t-shirt or blouse', reason: c => `Feels like ${c.feelsLike}° — a thin t-shirt is enough on its own` },
        ustune: { item: 'Bring a thin cardigan along, just in case', reason: () => `If it cools off in the evening you'll want something to put on` },
        alt: { item: 'Light fabric trousers or a midi dress', reason: () => `Light fabric feels comfortable in this mild weather` },
        ayak: { item: 'Sneakers or loafers', reason: () => `Sneakers are the most comfortable choice at this temperature` },
      },
      erkek: {
        ust: { item: 'Thin cotton t-shirt', reason: c => `Feels like ${c.feelsLike}° — a thin t-shirt is enough on its own` },
        ustune: { item: 'Bring a thin shirt along, just in case', reason: () => `If it cools off in the evening you'll want something to put on` },
        alt: { item: 'Light fabric trousers', reason: () => `Light fabric trousers are comfortable in this mild weather` },
        ayak: { item: 'Sneakers or loafers', reason: () => `Sneakers are the most comfortable choice at this temperature` },
      },
    },
    sicak: {
      unisex: {
        ust: { item: 'Thin, breathable t-shirt (linen or cotton)', reason: c => `Feels like ${c.feelsLike}° — thin, breathable fabric won't leave you sweaty` },
        alt: { item: 'Light fabric shorts or lightweight trousers', reason: () => `Light fabric is far more comfortable in this heat` },
        ayak: { item: 'Open sneakers or sandals', reason: () => `Let your feet breathe, open shoes feel better` },
      },
      kadin: {
        ust: { item: 'Thin linen shirt or t-shirt', reason: c => `Feels like ${c.feelsLike}° — thin, breathable fabric won't leave you sweaty` },
        alt: { item: 'Light fabric shorts or a summer dress', reason: () => `Light fabric is far more comfortable in this heat` },
        ayak: { item: 'Sandals or open sneakers', reason: () => `Let your feet breathe, open shoes feel better` },
      },
      erkek: {
        ust: { item: 'Thin linen or cotton t-shirt', reason: c => `Feels like ${c.feelsLike}° — thin, breathable fabric won't leave you sweaty` },
        alt: { item: 'Light fabric shorts', reason: () => `Light fabric is far more comfortable in this heat` },
        ayak: { item: 'Sandals or open sneakers', reason: () => `Let your feet breathe, open shoes feel better` },
      },
    },
    cok_sicak: {
      unisex: {
        ust: { item: 'Very thin, light-colored linen shirt or t-shirt', reason: c => `Feels like ${c.feelsLike}° — light color and linen pull in less heat` },
        alt: { item: 'Light linen shorts', reason: () => `Let your legs breathe in this heat` },
        ayak: { item: 'Sandals', reason: () => `Closed shoes get unbearable in this heat, sandals are the way to go` },
      },
      kadin: {
        ust: { item: 'Very thin, light-colored linen shirt', reason: c => `Feels like ${c.feelsLike}° — light color and linen pull in less heat` },
        alt: { item: 'Light linen shorts or a summer skirt', reason: () => `Let your legs breathe in this heat` },
        ayak: { item: 'Sandals', reason: () => `Closed shoes get unbearable in this heat, sandals are the way to go` },
      },
      erkek: {
        ust: { item: 'Very thin, light-colored linen shirt', reason: c => `Feels like ${c.feelsLike}° — light color and linen pull in less heat` },
        alt: { item: 'Light linen shorts', reason: () => `Let your legs breathe in this heat` },
        ayak: { item: 'Sandals', reason: () => `Closed shoes get unbearable in this heat, sandals are the way to go` },
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
      const item = /wind/i.test(rows.dis.item) ? rows.dis.item : rows.dis.item + ', make it windproof fabric';
      rows.dis = { item, reason: () => `${wind} km/h wind is dragging the feels-like temperature down, you need something windproof` };
    } else {
      rows.dis = { item: 'A thin windproof jacket', reason: () => `${wind} km/h wind out there, bring something that blocks it, even a thin one` };
    }
    return;
  }
  if (rows.dis) {
    const item = rows.dis.item.includes('rüzgar') ? rows.dis.item : rows.dis.item + ', rüzgar geçirmez kumaştan olsun';
    rows.dis = { item, reason: () => `${wind} km/s rüzgar hissedileni düşürüyor, rüzgar geçirmez bir şey lazım` };
  } else {
    rows.dis = { item: 'İnce rüzgar geçirmez mont', reason: () => `${wind} km/s rüzgar var, ince de olsa rüzgar kesen bir şey al` };
  }
}

function applyRain(rows, bandKey, rainMax, lang) {
  if (lang === 'en') {
    rows.ayak = { item: RAIN_SHOE.en[bandKey], reason: () => `${rainMax}% chance of rain — suede and fabric shoes will get soaked today, wear waterproof ones` };
    rows.yanina = { item: 'A small umbrella', reason: () => `${rainMax}% chance of rain — don't leave without a small umbrella` };
    return;
  }
  rows.ayak = { item: RAIN_SHOE.tr[bandKey], reason: () => `Yağış %${rainMax} — süet ve kumaş ayakkabı bugün ıslanır, su geçirmezi giy` };
  rows.yanina = { item: 'Küçük bir şemsiye', reason: () => `Yağış %${rainMax} — yanına küçük bir şemsiye almadan çıkma` };
}

export function generateOutfit({ feelsLike, wind, rainMax, gender, lang }, wardrobeItems = []) {
  const language = lang === 'en' ? 'en' : 'tr';
  const bandKey = getBand(feelsLike);
  const genderKey = ['unisex', 'kadin', 'erkek'].includes(gender) ? gender : 'unisex';
  const rows = clone(BASE[language][bandKey][genderKey]);

  if (wind >= 20) applyWind(rows, wind, language);
  if (rainMax >= 50) applyRain(rows, bandKey, rainMax, language);

  const ctx = { feelsLike, wind, rainMax };
  const output = [];
  for (const key of SLOT_ORDER) {
    const r = rows[key];
    if (!r) continue;
    let item = r.item;
    let reason = typeof r.reason === 'function' ? r.reason(ctx) : r.reason;
    let fromWardrobe = false;

    const match = findWardrobeMatch(wardrobeItems, {
      category: key,
      bandKey,
      needsRain: rainMax >= 50,
      needsWind: wind >= 20,
    });
    if (match) {
      item = match.name;
      fromWardrobe = true;
      reason = wardrobeReason(match, ctx, rainMax >= 50, wind >= 20, key, language);
    }

    output.push({ slotKey: key, icon: SLOT_ICON[key], label: slotLabel(key, language), item, reason, fromWardrobe });
  }

  return { bandKey, bandLabel: bandLabel(bandKey, language), rows: output };
}

function wardrobeReason(item, ctx, needsRain, needsWind, slotKey, lang) {
  if (lang === 'en') {
    const bits = [`right warmth for ${ctx.feelsLike}° feels-like`];
    if (needsRain && slotKey === 'ayak' && item.rainOk) bits.push('handles rain');
    if (needsWind && slotKey === 'dis' && item.windproof) bits.push('blocks wind');
    return bits.join(', ') + '.';
  }
  const bits = [`Hissedilen ${ctx.feelsLike}° için sıcaklığı uygun`];
  if (needsRain && slotKey === 'ayak' && item.rainOk) bits.push('yağmura dayanıklı');
  if (needsWind && slotKey === 'dis' && item.windproof) bits.push('rüzgar geçirmiyor');
  return bits.join(', ') + '.';
}
