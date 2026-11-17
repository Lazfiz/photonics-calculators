/** Ranking for the site search over `/search-index.json`, shared by the MCP `find_calculator`. Client-safe: no registry import. */
import { KNOWN_WORDS, SYNONYMS } from "./search-synonyms";

export interface SearchItem {
  title: string;
  href: string;
  description: string;
  kind: "page" | "category";
  category: string;
  tags: string[];
  priority: number;
}

/** One query word or phrase: as typed first, then its synonyms. Any of them may match. */
export type Term = readonly string[];

/** Words a question carries that say nothing about which calculator it wants. */
const STOP_WORDS = new Set([
  "a", "about", "after", "an", "and", "are", "at", "be", "before", "by", "calculate", "calculation", "calculator",
  "calculators", "can", "compute", "do", "does", "find", "for", "from", "get", "give", "how", "i", "in", "into", "is",
  "it", "many", "me", "much", "my", "need", "of", "on", "or", "per", "please", "put", "should", "show", "tell", "than",
  "that", "the", "there", "these", "this", "those", "to", "use", "using", "want", "what", "when", "where", "which",
  "why", "will", "with", "would",
]);

/**
 * Stop words that are also abbreviations: they count as a word only when typed in capitals ("PER", the polarization
 * extinction ratio; "dB per km" keeps "per" a stop word).
 */
const ABBREVIATION_STOP_WORDS = new Set(["per"]);

/**
 * Words so common on this site that a page need not contain them to answer the query: "laser spot size" is answered by
 * the Gaussian-beam page, which never says "laser". They add to the score of a page that has them; a query made only
 * of them still needs them.
 */
const SOFT_WORDS = new Set(["laser", "lasers", "optic", "optical", "optics", "light"]);

/** Longer queries are cut here: no question needs more, and scoring cost grows with the length. */
export const MAX_QUERY_LENGTH = 200;

/** Units that follow a number in a query ("80 km", "1550nm"): dropped with it. */
const UNITS = "nm|um|µm|μm|mm|cm|m|km|mw|w|kw|dbm|db|hz|khz|mhz|ghz|thz|s|ms|us|µs|μs|ns|ps|fs|mrad|rad|deg|°|j|mj|uj|µj|μj|nj|%";
const NUMBER = /^[-+]?\d+(?:[.,]\d+)?(?:e[-+]?\d+)?$/;
const NUMBER_WITH_UNIT = new RegExp(`^[-+]?\\d+(?:[.,]\\d+)?(?:e[-+]?\\d+)?(?:${UNITS})$`);
const UNIT = new RegExp(`^(?:${UNITS})$`);

/**
 * Folding and British to American spelling, applied to queries and page text alike, so a rule that also catches a word
 * it shouldn't ("noise" → "noize") changes both sides the same way and still matches. Folding: compatibility forms and
 * accents (µ and μ, ² and 2, ﬁ, é), dashes and hyphens before a letter to spaces ("AR-coating", "Fabry–Perot"), "^" and
 * "_" ("M^2", "C_n^2"), and the notations "f/#", "f/2.8" (f-number) and "λ/4", "lambda/2" (quarter- and half-wave).
 */
export function normalizeSpelling(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\bf\s*\/\s*(?:#|\d+(?:\.\d+)?)/g, "f number")
    .replace(/(?:λ|\blambda)\s*\/\s*4\b/g, "quarter wave")
    .replace(/(?:λ|\blambda)\s*\/\s*2\b/g, "half wave")
    .replace(/[\^_]/g, "")
    .replace(/(?<=[\p{L}\p{N}])[-‐‑‒–—―−](?=\p{L})/gu, " ")
    .replace(/fibre/g, "fiber")
    .replace(/(cent|met|lit)re/g, "$1er")
    .replace(/(col|vap|behavi|flav|harb|neighb|arm)our/g, "$1or")
    .replace(/grey/g, "gray")
    .replace(/aluminium/g, "aluminum")
    .replace(/(\w)is(e|ed|es|ing|er|ers|ation|ations)\b/g, "$1iz$2")
    .replace(/(\w)ys(e|ed|es|ing|er|ers)\b/g, "$1yz$2")
    .replace(/modelling/g, "modeling");
}

/** The synonym groups, folded as the text they are matched against. */
let groups: string[][] | undefined;
function synonymGroups(): string[][] {
  groups ??= SYNONYMS.map((group) => [...new Set(group.map(normalizeSpelling))]);
  return groups;
}

/**
 * Splits a query into terms: folded and spelling normalised, numbers and their units dropped, synonym phrases grouped
 * (they may hold stop words: "signal to noise", "index of refraction"), then the remaining stop words dropped and
 * synonyms and singulars attached.
 */
export function searchTerms(query: string): Term[] {
  const capped = query.slice(0, MAX_QUERY_LENGTH);
  const capitals = new Set((capped.match(/\b[A-Z]{2,}\b/g) ?? []).map((word) => word.toLowerCase()));
  const raw = normalizeSpelling(capped)
    .split(/\s+/)
    .map((word) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}%°]+$/gu, ""))
    .filter(Boolean);
  const words: string[] = [];
  for (let i = 0; i < raw.length; i++) {
    if (NUMBER.test(raw[i])) {
      if (i + 1 < raw.length && UNIT.test(raw[i + 1])) i++;
      continue;
    }
    if (!NUMBER_WITH_UNIT.test(raw[i])) words.push(raw[i]);
  }
  // A lone short word still being typed ("in" on the way to "interferometer") is kept.
  const typing = words.length === 1 && !/\s$/.test(query);
  const stop = (word: string) => STOP_WORDS.has(word) && !(ABBREVIATION_STOP_WORDS.has(word) && capitals.has(word));
  const terms: Term[] = [];
  for (let i = 0; i < words.length; ) {
    const group = !typing && stop(words[i]) ? null : longestPhrase(words, i);
    if (group) {
      terms.push([group.phrase, ...group.synonyms, ...singulars(group.phrase)]);
      i += group.length;
    } else {
      if (typing || !stop(words[i])) terms.push([words[i], ...singulars(words[i])]);
      i++;
    }
  }
  // A synonym phrase that borrows another term's word and adds words nobody typed would count that word twice and
  // drift: "optical glasses" must not read as "optical" + "optical density". Synonyms made only of typed words
  // ("focused spot size" → "spot size"; "fabry perot etalon") are kept.
  const typed = new Set(terms.flatMap((term) => term[0].split(" ")));
  return terms.map((term) => {
    const own = new Set(term[0].split(" "));
    return term.filter((alt, k) => {
      if (k === 0) return true;
      const words = alt.split(" ");
      return !(words.some((word) => typed.has(word) && !own.has(word)) && words.some((word) => !typed.has(word)));
    });
  });
}

/**
 * The singular of a plural one-word term, as an extra alternative: "glasses" → "glass", "lenses" → "lens", "fibers" →
 * "fiber", "blackbodies" → "blackbody". Only where it is safe as a substring: "-ies" after a consonant, "-es" after s,
 * x, z, ch or sh, and "-s" leaving at least 4 letters that don't end in s, u or i ("lens", "focus", "gauss" stay).
 */
function singulars(word: string): string[] {
  if (word.includes(" ")) return [];
  if (/[^aeiou]ies$/.test(word) && word.length > 5 && word !== "series" && word !== "species") return [`${word.slice(0, -3)}y`];
  if (/(s|x|z|ch|sh)es$/.test(word) && word.length > 4) return [word.slice(0, -2)];
  if (/[^sui]s$/.test(word) && word.length > 4) return [word.slice(0, -1)];
  return [];
}

/** The synonyms of a word or phrase: every other entry of every group that holds it ("refractive index" is in two). */
function synonymsOf(phrase: string): string[] {
  const found = new Set<string>();
  for (const group of synonymGroups()) if (group.includes(phrase)) for (const other of group) if (other !== phrase) found.add(other);
  return [...found];
}

/** The longest synonym phrase starting at word i, if any. */
function longestPhrase(words: readonly string[], i: number) {
  let best: { phrase: string; synonyms: string[]; length: number } | null = null;
  for (const group of synonymGroups()) {
    for (const phrase of group) {
      const parts = phrase.split(" ");
      if (best && parts.length <= best.length) continue;
      if (parts.every((part, k) => words[i + k] === part)) best = { phrase, synonyms: [], length: parts.length };
    }
  }
  if (best) best.synonyms = synonymsOf(best.phrase);
  return best;
}

interface Prepared {
  title: string;
  titleWords: string[];
  /** The title with its spaces removed, so a joined query word ("fabryperot", "lockin") matches a split title. */
  flatTitle: string;
  description: string;
  descriptionWords: string[];
  href: string;
  category: string;
  tags: string[];
  tagWords: string[];
  flatTags: string[];
}

const prepared = new WeakMap<SearchItem, Prepared>();
const wordsOf = (text: string) => text.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
const flat = (text: string) => text.replace(/[^\p{L}\p{N}]+/gu, "");

function prepare(item: SearchItem): Prepared {
  let p = prepared.get(item);
  if (!p) {
    const title = normalizeSpelling(item.title);
    const description = normalizeSpelling(item.description);
    const tags = item.tags.map(normalizeSpelling);
    p = {
      title, titleWords: wordsOf(title), flatTitle: flat(title), description, descriptionWords: wordsOf(description),
      href: item.href.toLowerCase(), category: item.category.toLowerCase(), tags, tagWords: tags.flatMap(wordsOf),
      flatTags: tags.map(flat),
    };
    prepared.set(item, p);
  }
  return p;
}

/** How well one word or phrase matches: title above tags (keywords) above category, URL and description. */
function wordScore(p: Prepared, word: string): number {
  if (word.length <= 3 && !word.includes(" ")) {
    // Short words and abbreviations ("na", "od", "eom"): whole words only, not any substring, so "eom" doesn't find
    // "geometric" nor "per" "permissible". Two letters may also start a word ("na" of "nanometer"); three letters may
    // take a plural "s" ("leds").
    const starts = (w: string) => word.length === 2 && w.startsWith(word);
    const whole = (w: string) => w === word || (word.length === 3 && w === `${word}s`);
    let match = 0;
    if (p.titleWords.some(whole)) match += 240;
    else if (p.titleWords.some(starts)) match += 80;
    if (p.tagWords.some(whole)) match += 110;
    else if (p.tagWords.some(starts)) match += 40;
    if (p.descriptionWords.some(whole)) match += 50;
    return match;
  }
  let match = 0;
  if (p.title === word) match += 400;
  if (p.title.startsWith(word)) match += 220;
  if (p.title.includes(word)) match += 120;
  if (p.titleWords.some((w) => w === word)) match += 120;
  if (p.titleWords.some((w) => w.startsWith(word))) match += 80;
  if (p.category.includes(word)) match += 70;
  if (p.tags.some((tag) => tag === word)) match += 110;
  if (p.tags.some((tag) => tag.includes(word))) match += 70;
  if (p.href.includes(word.replace(/ /g, "-"))) match += 60;
  if (p.description.includes(word)) match += 50;
  // Joined or split differently from the page: "fabryperot", "lockin", "halfwave" against "Fabry-Perot", "Lock-in".
  const joined = flat(word);
  if (joined.length >= 5) {
    if (!p.title.includes(word) && p.flatTitle.includes(joined)) {
      // As a title holding the word as typed would score: start 220, inside 120, whole words ("lock" "in") 120 more.
      match += p.flatTitle.startsWith(joined) ? 340 : 120;
      if (p.titleWords.some((_, i) => p.titleWords.slice(i).some((__, j) => p.titleWords.slice(i, i + j + 1).join("") === joined))) {
        match += 120;
      }
    }
    if (!p.tags.some((tag) => tag.includes(word)) && p.flatTags.some((tag) => tag.includes(joined))) match += 70;
  }
  // A phrase not found as such still counts a little when each of its words is a word of the title or description
  // ("quarter wave ar coating"). Keywords are left out: a category's keywords are on all its pages.
  if (match === 0 && word.includes(" ")) {
    const parts = word.split(" ").filter((part) => !STOP_WORDS.has(part));
    if (parts.every((part) => p.titleWords.includes(part) || p.descriptionWords.includes(part))) match += 40;
  }
  return match;
}

/** A term's score: its best alternative, a synonym at 90 % of the word typed. */
function termScore(p: Prepared, term: string | Term): number {
  const alternatives = typeof term === "string" ? [term] : term;
  return Math.max(...alternatives.map((word, k) => (k === 0 ? 1 : 0.9) * wordScore(p, word)));
}

/**
 * Relevance of an item: the sum over terms plus `priority`, which only breaks ties. 0 unless every term matches, so a
 * nonsense word doesn't leave the list to `priority`.
 */
export function scoreItem(item: SearchItem, terms: readonly (string | Term)[]): number {
  const p = prepare(item);
  let score = 0;
  for (const term of terms) {
    const match = termScore(p, term);
    if (match === 0) return 0;
    score += match;
  }
  return terms.length > 0 ? score + item.priority : 0;
}

export interface Ranked {
  item: SearchItem;
  /** Required terms matched, of `terms` (soft words such as "laser" are not counted either way). */
  matched: number;
  score: number;
  /** Each term's score on this item, in query order; 0 for a term it doesn't match. */
  termScores: number[];
}

/** A query word that matched nothing and was read as the nearest index word(s) instead. */
export interface Correction {
  from: string;
  to: string[];
}

const vocabularies = new WeakMap<readonly SearchItem[], string[]>();

/** The distinct title, keyword and description words of the items, 4 letters or more: what a misspelt word is corrected to. */
function vocabulary(items: readonly SearchItem[]): string[] {
  let words = vocabularies.get(items);
  if (!words) {
    const all = new Set<string>();
    for (const item of items) {
      const p = prepare(item);
      for (const word of [...p.titleWords, ...p.tagWords, ...p.descriptionWords]) if (word.length >= 4 && !/\d/.test(word)) all.add(word);
    }
    words = [...all];
    vocabularies.set(items, words);
  }
  return words;
}

/** Optimal string alignment distance (Damerau–Levenshtein without repeated edits), stopping early past `max`. */
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev2: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let d = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d = Math.min(d, prev2[j - 2] + 1);
      row.push(d);
      best = Math.min(best, d);
    }
    if (best > max) return max + 1;
    prev2 = prev;
    prev = row;
  }
  return prev[b.length];
}

const LONG_STOP_WORDS = [...STOP_WORDS].filter((word) => word.length >= 4);

/** `KNOWN_WORDS` as queries are spelt after `normalizeSpelling` ("promises" → "promizes"). */
let known: Set<string> | undefined;
function knownWords(): Set<string> {
  known ??= new Set([...KNOWN_WORDS].map(normalizeSpelling));
  return known;
}

/**
 * Typo tolerance: a one-word term that matches no item at all ("gausian", "lazers") takes the nearest words of the
 * items as alternatives, within 1 edit (2 from 8 letters), trying its singular too. Never touched: a word that matches
 * something (it is in the index), a real word from the site's list of English words that are not in the index
 * (`KNOWN_WORDS`: "tower" is not "power"), and words of under 4 letters. A word nearest to a stop word
 * ("calcualtor") is dropped as one.
 */
function correctTypos(items: readonly SearchItem[], terms: Term[]): { terms: Term[]; corrections: Correction[] } {
  const corrections: Correction[] = [];
  const out: Term[] = [];
  for (const term of terms) {
    const word = term[0];
    const plain = term.slice(1).every((alt) => singulars(word).includes(alt));
    if (!plain || word.includes(" ") || word.length < 4 || /\d/.test(word) || term.some((form) => knownWords().has(form)) ||
      items.some((item) => termScore(prepare(item), term) > 0)) {
      out.push(term);
      continue;
    }
    let best = Infinity;
    let nearest: string[] = [];
    for (const form of term) {
      if (form.length < 4) continue;
      const max = form.length >= 8 ? 2 : 1;
      for (const candidate of [...vocabulary(items), ...LONG_STOP_WORDS]) {
        const d = editDistance(form, candidate, max);
        if (d > max || d > best) continue;
        if (d < best) [best, nearest] = [d, []];
        if (!nearest.includes(candidate)) nearest.push(candidate);
      }
    }
    if (nearest.length === 0) {
      out.push(term);
      continue;
    }
    const words = nearest.filter((candidate) => !STOP_WORDS.has(candidate));
    corrections.push({ from: word, to: words.length > 0 ? words : nearest });
    // The corrected word brings its synonyms, as if typed ("tranimpedance" → "transimpedance" → "tia").
    if (words.length > 0) out.push([...new Set([word, ...words, ...words.flatMap(synonymsOf)])]);
  }
  return { terms: out, corrections };
}

/**
 * A lone three-letter word still being typed ("gau") that is a whole word nowhere: the index words it starts, so the
 * list fills while typing even though three letters otherwise match whole words only.
 */
function completeTyping(items: readonly SearchItem[], query: string, terms: Term[]): Term[] {
  if (terms.length !== 1 || terms[0].length !== 1 || /\s$/.test(query)) return terms;
  const word = terms[0][0];
  if (word.length !== 3 || word.includes(" ") || items.some((item) => termScore(prepare(item), word) > 0)) return terms;
  const completions = vocabulary(items).filter((candidate) => candidate.startsWith(word)).slice(0, 40);
  return completions.length > 0 ? [[word, ...completions]] : terms;
}

/** The parsed query against the items: each term's alternatives, whether it is soft, and the corrections made. */
function prepareQuery(items: readonly SearchItem[], query: string) {
  const corrected = correctTypos(items, searchTerms(query));
  const terms = completeTyping(items, query, corrected.terms);
  const soft = terms.map((term) => term[0].split(" ").every((word) => SOFT_WORDS.has(word)));
  // A query of soft words only ("laser", "optics") still needs them.
  const required = soft.every(Boolean) ? soft.map(() => true) : soft.map((isSoft) => !isSoft);
  return { terms, required, corrections: corrected.corrections };
}

/**
 * Every item that matches at least one required term: most required terms matched first, then by score. `terms`
 * counts the required terms, `corrections` the misspelt words read as others.
 */
export function rankItems(
  items: readonly SearchItem[], query: string,
): { ranked: Ranked[]; terms: number; required: boolean[]; corrections: Correction[] } {
  const { terms, required, corrections } = prepareQuery(items, query);
  const first = rankWith(items, terms, required);
  // The required words match nothing at all ("laser xyzzy"): the soft words then count, for the closest pages.
  if (first.length === 0 && required.some((isRequired) => !isRequired)) {
    const all = required.map(() => true);
    return { ranked: rankWith(items, terms, all), terms: all.length, required: all, corrections };
  }
  return { ranked: first, terms: required.filter(Boolean).length, required, corrections };
}

function rankWith(items: readonly SearchItem[], terms: Term[], required: boolean[]): Ranked[] {
  if (!required.some(Boolean)) return [];
  return items
    .map((item) => {
      const p = prepare(item);
      // A soft word only nudges: a fifth of its score.
      const scores = terms.map((term, k) => (required[k] ? 1 : 0.2) * termScore(p, term));
      const matched = scores.filter((s, k) => s > 0 && required[k]).length;
      // A phrase the item has only some words of ("signal to noise" on a "… Noise" page) doesn't count as matched, but
      // ranks it above items with none of them: a quarter of its best word's score.
      const partial = terms.reduce((sum, term, k) => {
        if (scores[k] > 0 || !term[0].includes(" ")) return sum;
        const words = term[0].split(" ").filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
        return sum + 0.25 * Math.max(0, ...words.map((word) => wordScore(p, word)));
      }, 0);
      const score = scores.reduce((a, b) => a + b, 0) + partial + (matched > 0 ? item.priority : 0);
      return { item, matched, score, termScores: scores };
    })
    .filter((r) => r.matched > 0)
    .sort((a, b) => b.matched - a.matched || b.score - a.score);
}

/** How far a page missing one word must outscore the best page that has every word to be listed beside it. */
const DOMINANCE = 2;
/** A term score no better than a description match (50), or a phrase's words found apart (40). */
const IN_PASSING = 60;

export interface Selection {
  results: Ranked[];
  /** True when the list is not a plain exact match: a word was corrected, or some result misses a word. */
  closest: boolean;
  /** How many results at the head of `results` match every word (0 when they are ranked together with others). */
  exactFirst: number;
  /** Pages matching every required word as typed, in the whole index (not capped by any limit; 0 after a correction). */
  exactMatches: number;
  terms: number;
  corrections: Correction[];
}

/**
 * What to show for a query: the pages matching every word, best first. One extra word must not hide the page that
 * answers the rest: with three words or more, a page missing one word is ranked among them when it outscores the best
 * exact page {@link DOMINANCE} times over ("shot noise limited SNR": the Shot Noise page has no "limited"); otherwise
 * pages missing one word follow the exact ones only when they outscore all of them. Exact pages are never padded with
 * weaker partial ones; with no exact page, the pages matching most words are listed. Any partial page in the list, or a
 * corrected typo, sets `closest`: a corrected match is never reported as exact.
 */
export function selectResults(items: readonly SearchItem[], query: string): Selection {
  const { ranked, terms, required, corrections } = rankItems(items, query);
  const exact = ranked.filter((r) => r.matched === terms);
  const corrected = corrections.length > 0;
  const exactMatches = corrected ? 0 : exact.length;
  if (exact.length === 0) {
    return { results: ranked, closest: ranked.length > 0, exactFirst: 0, exactMatches, terms, corrections };
  }
  const nearMiss = terms >= 2 ? ranked.filter((r) => r.matched === terms - 1) : [];
  const best = exact.reduce((max, r) => Math.max(max, r.score), 0);
  // Only when the exact pages have the missing word in passing (no better than a description match), not when they
  // are about it: "what lens to couple into fiber" keeps Mode Matching above the Fiber Coupler page that lacks "lens".
  const strong = terms >= 3
    ? nearMiss.filter((r) => {
      if (r.score < DOMINANCE * best) return false;
      const missing = required.flatMap((isRequired, k) => (isRequired && r.termScores[k] === 0 ? [k] : []));
      return missing.every((k) => exact.every((e) => e.termScores[k] <= IN_PASSING));
    })
    : [];
  if (strong.length > 0) {
    const results = [...exact, ...strong].sort((a, b) => b.score - a.score);
    return { results, closest: true, exactFirst: 0, exactMatches, terms, corrections };
  }
  // Pages missing one word that still outscore every exact page follow them, after the divider `exactFirst` marks
  // ("signal to noise photodiode": the Photodiode TIA Noise page has no "signal").
  const after = nearMiss.filter((r) => r.score > best);
  return {
    results: [...exact, ...after],
    closest: after.length > 0 || corrected,
    exactFirst: corrected ? 0 : exact.length,
    exactMatches,
    terms,
    corrections,
  };
}

/**
 * The `limit` best items for the query (see `selectResults`). `closest` is set when they are not all exact matches;
 * the first `exact` of them are (0 when the order mixes them or a word was corrected); `corrected` lists the misspelt
 * words read as others, so the page can say so. Empty only when no word matches anything.
 */
export function search(
  items: readonly SearchItem[], query: string, limit = 12,
): { results: SearchItem[]; closest: boolean; exact: number; corrected: Correction[] } {
  const selection = selectResults(items, query);
  const results = selection.results.slice(0, limit).map((r) => r.item);
  return {
    results,
    closest: selection.closest,
    exact: Math.min(selection.exactFirst, results.length),
    corrected: selection.corrections,
  };
}

/** The `limit` best items for the query, best first (see `search`). */
export function searchItems(items: readonly SearchItem[], query: string, limit = 12): SearchItem[] {
  return search(items, query, limit).results;
}

/** True for a query of values only ("1550 nm", "5 W"): it names no topic, so the page and MCP say to add one. */
export function onlyValues(query: string): boolean {
  return /\d/.test(query) && searchTerms(query).length === 0;
}
