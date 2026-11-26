// What the wardrobe is missing for the coming week's weather and today's plans.
// Rule-based and instant: each gap names one piece, why it would help, and how to
// pre-fill the editor if the user already owns it and just hasn't added it.
import { itemLook } from './visuals.js';
import { itemFormality } from './wardrobe.js';

const RAIN_DAY = 50;   // precipitation chance (%) that counts as a rainy day
const WINDY_DAY = 30;  // km/h peak wind that counts as a windy day
const COLD_ACC = ['beanie', 'scarf', 'gloves'];
const WARM_BOTTOMS = ['shorts', 'minishorts', 'skirt', 'dress', 'jumpsuit'];
const OPEN_SHOES = ['sandal', 'slide', 'espadrille'];
const SMART_PLANS = ['work', 'date', 'event'];

// `week`: buildWeekView rows. Returns gaps, most useful first:
// { key, n, piece: { category, art, warmth, rainOk, windproof, formality } }
export function wardrobeGaps(items, week, { gender = 'unisex', occasion = null } = {}) {
  if (!items.length || !week.length) return [];
  const mine = items.filter(i => !i.gender || i.gender === 'unisex' || gender === 'unisex' || i.gender === gender);
  const art = i => itemLook(i).art;
  const of = cat => mine.filter(i => i.category === cat);
  const tops = of('ust'), mids = of('ustune'), outer = of('dis'), bottoms = of('alt'), shoes = of('ayak'), accs = of('yanina');

  const minFeel = Math.min(...week.map(d => d.feelsMin));
  const maxFeel = Math.max(...week.map(d => d.feelsMax));
  const rainDays = week.filter(d => d.rain >= RAIN_DAY).length;
  const windyDays = week.filter(d => d.wind >= WINDY_DAY).length;
  const strongSun = week.some(d => typeof d.uvMax === 'number' && d.uvMax >= 6);
  // The warmth the week's typical day calls for (1 summer ... 5 deep winter).
  const midFeel = week.reduce((s, d) => s + d.feelsLike, 0) / week.length;
  const want = midFeel <= 2 ? 5 : midFeel <= 9 ? 4 : midFeel <= 15 ? 3 : midFeel <= 21 ? 2 : 1;
  const cold = minFeel <= 9, freezing = minFeel <= 2;
  const female = gender === 'kadin';

  const gaps = [];
  const add = (score, key, piece, n = null) => gaps.push({ score, key, n, piece: { warmth: 3, rainOk: false, windproof: false, ...piece } });

  if (!shoes.length) add(100, 'no_shoes', { category: 'ayak', art: 'sneaker' });
  if (!bottoms.length) add(98, 'no_bottoms', { category: 'alt', art: 'jeans' });
  if (!tops.length) add(97, 'no_tops', { category: 'ust', art: want >= 4 ? 'sweater' : want >= 3 ? 'longsleeve' : 'tee', warmth: Math.max(1, want - 1) });
  if (cold && !outer.length) add(96, 'no_outer', { category: 'dis', art: freezing ? (female ? 'pufferw' : 'puffer') : 'coat', warmth: freezing ? 5 : 4 });

  if (rainDays && shoes.length && !shoes.some(i => i.rainOk)) add(90, 'rain_shoes', { category: 'ayak', art: cold ? 'boot' : 'chelsea', rainOk: true, warmth: cold ? 4 : 3 }, rainDays);
  if (freezing && outer.length && !outer.some(i => (i.warmth || 3) >= 5)) add(88, 'warm_coat', { category: 'dis', art: female ? 'pufferw' : 'puffer', warmth: 5 });
  else if (cold && outer.length && !outer.some(i => (i.warmth || 3) >= 4)) add(86, 'warm_coat', { category: 'dis', art: 'coat', warmth: 4 });
  if (maxFeel >= 22 && tops.length && !tops.some(i => (i.warmth || 3) <= 2)) add(85, 'light_top', { category: 'ust', art: 'tee', warmth: 1 });

  const smartPlan = SMART_PLANS.includes(occasion);
  const smartTop = tops.some(i => itemFormality(i) === 3);
  if (!smartTop && tops.length) add(smartPlan ? 92 : 55, 'smart_top', { category: 'ust', art: female ? 'blouse' : 'shirt', warmth: Math.min(3, Math.max(1, want - 1)), formality: 3 });

  if (rainDays && !outer.some(i => i.rainOk) && !accs.some(i => art(i) === 'umbrella')) add(80, 'rain_coat', { category: 'dis', art: cold ? 'parka' : 'trench', rainOk: true, windproof: true, warmth: cold ? 4 : 2 }, rainDays);
  if (maxFeel >= 24 && bottoms.length && !bottoms.some(i => WARM_BOTTOMS.includes(art(i)))) add(75, 'warm_bottom', { category: 'alt', art: female ? 'skirt' : 'shorts', warmth: 1 });
  if (freezing && !accs.some(i => COLD_ACC.includes(art(i)))) add(70, 'cold_acc', { category: 'yanina', art: 'beanie', warmth: 4 });
  if (windyDays >= 2 && outer.length && !outer.some(i => i.windproof)) add(65, 'wind_jacket', { category: 'dis', art: 'windbreaker', windproof: true, warmth: 2 }, windyDays);
  if (minFeel <= 15 && !mids.length && tops.length) add(60, 'mid_layer', { category: 'ustune', art: 'cardigan', warmth: 3 });
  if (maxFeel >= 27 && shoes.length && !shoes.some(i => OPEN_SHOES.includes(art(i)))) add(50, 'open_shoes', { category: 'ayak', art: 'sandal', warmth: 1 });

  // Enough tops for the week's weather that one shirt doesn't repeat every day.
  const fittingTops = tops.filter(i => Math.abs((i.warmth || 3) - want) <= 1).length;
  if (tops.length && fittingTops < 3) add(45, 'more_tops', { category: 'ust', art: want >= 4 ? 'sweater' : want >= 3 ? 'longsleeve' : 'tee', warmth: want });
  if (strongSun && !accs.some(i => ['sunglasses', 'catglasses'].includes(art(i)))) add(40, 'sunglasses', { category: 'yanina', art: 'sunglasses', warmth: 1 });

  return gaps.sort((a, b) => b.score - a.score);
}
