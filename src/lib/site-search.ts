/** Ranking for the site search over `/search-index.json`, shared by the MCP `find_calculator`. Client-safe: no registry import. */
import { SYNONYMS } from "./search-synonyms";

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
  "a", "about", "after", "an", "and", "are", "at", "be", "by", "calculate", "calculation", "calculator", "calculators",
  "can", "compute", "do", "does", "find", "for", "from", "get", "how", "i", "in", "into", "is", "it", "me", "my", "of",
  "on", "or", "should", "the", "to", "what", "which", "with",
]);

/** Units that follow a number in a query ("80 km", "1550nm"): dropped with it. */
const UNITS = "nm|um|µm|mm|cm|m|km|mw|w|kw|dbm|db|hz|khz|mhz|ghz|thz|s|ms|us|µs|ns|ps|fs|mrad|rad|deg|°|j|mj|uj|µj|nj|%";
const NUMBER = /^[-+]?\d+(?:[.,]\d+)?(?:e[-+]?\d+)?$/;
const NUMBER_WITH_UNIT = new RegExp(`^[-+]?\\d+(?:[.,]\\d+)?(?:e[-+]?\\d+)?(?:${UNITS})$`);
const UNIT = new RegExp(`^(?:${UNITS})$`);

/**
 * British to American spelling, applied to queries and page text alike, so a rule that also catches a word it shouldn't
 * ("noise" → "noize") changes both sides the same way and still matches.
 */
export function normalizeSpelling(text: string): string {
  return text
    .toLowerCase()
    .replace(/fibre/g, "fiber")
    .replace(/(cent|met|lit)re/g, "$1er")
    .replace(/(col|vap|behavi|flav|harb|neighb|arm)our/g, "$1or")
    .replace(/grey/g, "gray")
    .replace(/aluminium/g, "aluminum")
    .replace(/(\w)is(e|ed|es|ing|er|ers|ation|ations)\b/g, "$1iz$2")
    .replace(/(\w)ys(e|ed|es|ing|er|ers)\b/g, "$1yz$2")
    .replace(/modelling/g, "modeling");
}

/** Splits a query into terms: spelling normalised, stop words, numbers and their units dropped, synonyms attached. */
export function searchTerms(query: string): Term[] {
  const raw = normalizeSpelling(query)
    .split(/\s+/)
    .map((word) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}%°²³]+$/gu, ""))
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
  const kept = typing ? words : words.filter((word) => !STOP_WORDS.has(word));
  const terms: Term[] = [];
  for (let i = 0; i < kept.length; ) {
    const group = longestPhrase(kept, i);
    if (group) {
      terms.push([group.phrase, ...group.synonyms, ...singulars(group.phrase)]);
      i += group.length;
    } else {
      terms.push([kept[i], ...singulars(kept[i])]);
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
 * "fiber". Only where it is safe as a substring: "-es" after s, x, z, ch or sh, and "-s" leaving at least 4 letters
 * that don't end in s, u or i ("lens", "focus", "gauss" stay as they are).
 */
function singulars(word: string): string[] {
  if (word.includes(" ")) return [];
  if (/(s|x|z|ch|sh)es$/.test(word) && word.length > 4) return [word.slice(0, -2)];
  if (/[^sui]s$/.test(word) && word.length > 4) return [word.slice(0, -1)];
  return [];
}

/** The longest synonym phrase starting at word i, if any. */
function longestPhrase(words: readonly string[], i: number) {
  let best: { phrase: string; synonyms: string[]; length: number } | null = null;
  for (const group of SYNONYMS) {
    for (const phrase of group) {
      const parts = phrase.split(" ");
      if (best && parts.length <= best.length) continue;
      if (parts.every((part, k) => words[i + k] === part)) {
        best = { phrase, synonyms: group.filter((p) => p !== phrase), length: parts.length };
      }
    }
  }
  return best;
}

interface Prepared {
  title: string;
  titleWords: string[];
  description: string;
  descriptionWords: string[];
  href: string;
  category: string;
  tags: string[];
  tagWords: string[];
}

const prepared = new WeakMap<SearchItem, Prepared>();
const wordsOf = (text: string) => text.split(/[^\p{L}\p{N}]+/u).filter(Boolean);

function prepare(item: SearchItem): Prepared {
  let p = prepared.get(item);
  if (!p) {
    const title = normalizeSpelling(item.title);
    const description = normalizeSpelling(item.description);
    const tags = item.tags.map(normalizeSpelling);
    p = {
      title, titleWords: wordsOf(title), description, descriptionWords: wordsOf(description),
      href: item.href.toLowerCase(), category: item.category.toLowerCase(), tags, tagWords: tags.flatMap(wordsOf),
    };
    prepared.set(item, p);
  }
  return p;
}

/** How well one word or phrase matches: title above tags (keywords) above category, URL and description. */
function wordScore(p: Prepared, word: string): number {
  if (word.length <= 2) {
    // Short words and abbreviations ("na", "od"): whole words or word starts only, not any substring; one letter ("f"
    // of "f number") whole words only.
    const starts = (w: string) => word.length > 1 && w.startsWith(word);
    let match = 0;
    if (p.titleWords.includes(word)) match += 240;
    else if (p.titleWords.some(starts)) match += 80;
    if (p.tagWords.includes(word)) match += 110;
    else if (p.tagWords.some(starts)) match += 40;
    if (p.descriptionWords.includes(word)) match += 50;
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
  /** Terms matched, of `terms`. */
  matched: number;
  score: number;
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

/**
 * Typo tolerance: a one-word term that matches no item at all ("gausian", "brewstr") takes the nearest words of the
 * items as alternatives, within 1 edit (2 from 8 letters). Words that match something are left alone.
 */
function correctTypos(items: readonly SearchItem[], terms: Term[]): Term[] {
  return terms.map((term) => {
    const word = term[0];
    if (term.length > 1 || word.includes(" ") || word.length < 4 || /\d/.test(word)) return term;
    if (items.some((item) => termScore(prepare(item), term) > 0)) return term;
    const max = word.length >= 8 ? 2 : 1;
    let best = max + 1;
    let nearest: string[] = [];
    for (const candidate of vocabulary(items)) {
      const d = editDistance(word, candidate, max);
      if (d < best) [best, nearest] = [d, [candidate]];
      else if (d === best) nearest.push(candidate);
    }
    return best <= max ? [word, ...nearest] : term;
  });
}

/** Every item that matches at least one term: most terms matched first, then by score. */
export function rankItems(items: readonly SearchItem[], query: string): { ranked: Ranked[]; terms: number } {
  const terms = correctTypos(items, searchTerms(query));
  if (terms.length === 0) return { ranked: [], terms: 0 };
  const ranked = items
    .map((item) => {
      const p = prepare(item);
      const scores = terms.map((term) => termScore(p, term));
      const matched = scores.filter((s) => s > 0).length;
      return { item, matched, score: scores.reduce((a, b) => a + b, 0) + (matched > 0 ? item.priority : 0) };
    })
    .filter((r) => r.matched > 0)
    .sort((a, b) => b.matched - a.matched || b.score - a.score);
  return { ranked, terms: terms.length };
}

/**
 * The `limit` best items for the query. When no item matches every term, the items matching the most terms, with
 * `closest` set; empty only when no term matches anything.
 */
export function search(items: readonly SearchItem[], query: string, limit = 12): { results: SearchItem[]; closest: boolean } {
  const { ranked, terms } = rankItems(items, query);
  const exact = ranked.filter((r) => r.matched === terms);
  const closest = exact.length === 0 && ranked.length > 0;
  return { results: (closest ? ranked : exact).slice(0, limit).map((r) => r.item), closest };
}

/** The `limit` best items for the query, best first (see `search`). */
export function searchItems(items: readonly SearchItem[], query: string, limit = 12): SearchItem[] {
  return search(items, query, limit).results;
}
