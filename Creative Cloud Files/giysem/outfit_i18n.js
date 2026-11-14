// Outfit wording for languages other than Turkish and English.
//
// The outfit engine writes its suggestions in English (or Turkish). For every
// other language each finished English sentence is looked up in that
// language's dictionary below. Numbers are kept out of the sentences as
// placeholders ({t} feels-like, {w} wind, {r} rain chance, {n} a piece's name,
// {c} a color), so one translation covers every temperature.
//
// Some sentences are built from pieces (a coat + ", ideally windproof", a
// reason + " Wear thermal leggings underneath."). When the whole sentence isn't
// in the dictionary, it is translated piece by piece from the start.

import ES from './outfit_text_es.js';
import PL from './outfit_text_pl.js';
import AR from './outfit_text_ar.js';
import DE from './outfit_text_de.js';

const PACKS = { es: ES, pl: PL, ar: AR, de: DE };
const KEYS = {};
// '.' before ' ' so a note keeps its own leading space (" Wear thermal leggings underneath.").
const JOINERS = ['.', ', ', ' '];

// Sentences that had no translation (for the language check script).
export const missing = new Set();

function keysFor(lang) {
  if (!KEYS[lang]) KEYS[lang] = Object.keys(PACKS[lang]).sort((a, b) => b.length - a.length);
  return KEYS[lang];
}

function translate(lang, dict, s) {
  if (!s) return s;
  if (Object.prototype.hasOwnProperty.call(dict, s)) return dict[s];
  for (const k of keysFor(lang)) {
    if (k.length < s.length && s.startsWith(k)) {
      const rest = s.slice(k.length);
      if (JOINERS.some(j => rest.startsWith(j))) return dict[k] + translate(lang, dict, rest);
    }
  }
  for (const j of JOINERS) {
    if (s.startsWith(j)) {
      const own = Object.prototype.hasOwnProperty.call(dict, j) ? dict[j] : j;
      return own + translate(lang, dict, s.slice(j.length));
    }
  }
  missing.add(`${lang}: ${s}`);
  return s;
}

// The text in `lang`; Turkish and English pass through unchanged.
export function tx(lang, s) {
  const dict = PACKS[lang];
  if (!dict || typeof s !== 'string') return s;
  return translate(lang, dict, s);
}

export function fillTemplate(s, ctx) {
  if (typeof s !== 'string') return s;
  return s.replaceAll('{t}', ctx.feelsLike).replaceAll('{w}', ctx.wind).replaceAll('{r}', ctx.rainMax);
}

export const OUTFIT_LANGS = Object.keys(PACKS);
