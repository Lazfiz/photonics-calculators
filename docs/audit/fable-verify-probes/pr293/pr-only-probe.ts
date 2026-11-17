// PR #293 verification probe: edit distance correctness, typo-correction targets, performance, MCP field consistency,
// rate limiter. Run ONLY on the PR tree (feat/fable-upgrades worktree), from the tree root:
//   npx tsx docs/audit/fable-verify-probes/pr293/pr-only-probe.ts
import { buildSearchIndex } from "../../../../src/registry/search";
import { editDistance, normalizeSpelling, search, searchTerms, rankItems } from "../../../../src/lib/site-search";
import { tools } from "../../../../src/mcp/tools";
import { RateLimiter, rateLimitHeaders } from "../../../../src/lib/report";

// 1. Reference optimal-string-alignment distance (full matrix, no cap).
function osa(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    const c = a[i - 1] === b[j - 1] ? 0 : 1;
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
  }
  return d[a.length][b.length];
}
let seed = 12345;
const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const word = () => Array.from({ length: Math.floor(rnd() * 9) }, () => "abc"[Math.floor(rnd() * 3)]).join("");
let bad = 0, n = 0, over = 0;
for (let k = 0; k < 200000; k++) {
  const a = word(), b = word();
  for (const max of [1, 2]) {
    n++;
    const want = Math.min(osa(a, b), max + 1), got = editDistance(a, b, max);
    // A functional mismatch: within the cap the value must be exact, past it anything > max. `over` counts returns above max + 1.
    if (got > max + 1) over++;
    if ((want <= max ? got !== want : got <= max) && bad++ < 10) console.log("MISMATCH", JSON.stringify(a), JSON.stringify(b), max, "want", want, "got", got);
  }
}
console.log(`editDistance vs reference OSA: ${bad} functional mismatches of ${n}; ${over} returns above max + 1 (doc says "max + 1")`);
for (const [a, b, m] of [["ab", "ba", 1], ["rayliegh", "rayleigh", 2], ["ca", "abc", 2], ["", "abc", 2], ["abc", "", 1], ["nodh", "nohd", 1], ["wavelegnth", "wavelength", 2]] as [string, string, number][])
  console.log(`  d(${a},${b},max ${m}) = ${editDistance(a, b, m)}`);

// 2. What a non-matching word is corrected to (re-implements the PR's rule from the outside).
const index = buildSearchIndex();
const vocab = new Set<string>();
const wordsOf = (t: string) => normalizeSpelling(t).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
for (const it of index) for (const w of [...wordsOf(it.title), ...it.tags.flatMap(wordsOf), ...wordsOf(it.description)]) if (w.length >= 4 && !/\d/.test(w)) vocab.add(w);
console.log("index items", index.length, "vocabulary", vocab.size);
function nearest(w: string) {
  const max = w.length >= 8 ? 2 : 1; let best = max + 1; let near: string[] = [];
  for (const c of vocab) { const d = editDistance(w, c, max); if (d < best) { best = d; near = [c]; } else if (d === best) near.push(c); }
  return best <= max ? `${near.join(",")} (d=${best})` : "-";
}
for (const w of ["status", "axes", "mouse", "horse", "london", "home", "zoom", "smell", "shell", "tower", "sink", "grin", "fairy", "hairy", "wake", "bean", "rung",
  "nose", "purse", "phrase", "angel", "filed", "case", "tame", "lime", "colon", "grass", "radio", "peek", "night", "crustal", "thermos", "kern", "brags",
  "abbey", "park", "shoe", "shop", "dolor", "collimator", "colimation", "nodh", "odtr", "turbulance", "finese", "paris", "later", "lend", "node", "weather"]) {
  const n0 = search(index, w, 500).results.length;
  console.log(`  ${w}: results=${n0} nearest-vocab=${nearest(w)}`);
}
// misspelt plural: has a singular alternative, so term.length > 1 and correction is skipped?
for (const q of ["gausians", "gausian", "photodides", "photodide", "wavelenghts", "wavelenght", "atenuations", "interferometrs", "lazers", "lazer", "lasr"])
  console.log(`  ${q}: terms=${JSON.stringify(searchTerms(q))} results=${search(index, q, 500).results.length}`);

// 3. Performance.
const qs = ["gausian beam", "brewstr angle", "fiber atenuation", "xyzzy quantum banana", "optical glasses", "depht of field", "asdfgh", "wavelegnth divison multiplexing"];
rankItems(index, "warm up");
let t = performance.now();
for (let k = 0; k < 200; k++) rankItems(index, qs[k % qs.length]);
console.log(`200 queries: ${(performance.now() - t).toFixed(0)} ms`);
const junk = Array.from({ length: 300 }, (_, i) => "zq" + i.toString(36).replace(/\d/g, "x") + "abcdefgh".slice(0, 2 + (i % 7))).join(" ");
t = performance.now(); let r = rankItems(index, junk);
console.log(`300 nonsense words: ${(performance.now() - t).toFixed(0)} ms, terms ${r.terms}, ranked ${r.ranked.length}`);
const typos = Array.from({ length: 300 }, (_, i) => ["gausian", "atenuation", "wavelenght", "polarizaton", "difraction", "interferometre", "scintilation"][i % 7]).join(" ");
t = performance.now(); r = rankItems(index, typos);
console.log(`300 misspelt words: ${(performance.now() - t).toFixed(0)} ms, terms ${r.terms}, ranked ${r.ranked.length}`);
const long = "x".repeat(5000);
t = performance.now(); r = rankItems(index, long + " " + long.slice(1));
console.log(`two 5000-char words: ${(performance.now() - t).toFixed(0)} ms`);

// 4. MCP find_calculator: matchedTerms / queryTerms / exactMatches consistency.
async function main() {
  const find = tools.find((x) => x.name === "find_calculator")!;
  for (const q of ["gaussian beam", "gaussian xyzzy", "gausian beam", "optical glasses", "xyzzy quantum banana", "asdfgh", "the of", "mouse", "fiber link budget 80 km", "laser goggles OD", "heat sink", "1550 nm"]) {
    for (const limit of [3, 25]) {
      const out = (await find.call({ query: q, limit }, { ip: "192.0.2.1", origin: "http://localhost" } as never)) as { ok: boolean; data?: { queryTerms: number; exactMatches: number; results: { slug: string; matchedTerms: number }[]; note?: string }; error?: string };
      if (!out.ok || !out.data) { console.log(`  [${q}] limit ${limit}: FAIL ${JSON.stringify(out).slice(0, 200)}`); continue; }
      const d = out.data;
      const full = d.results.filter((x) => x.matchedTerms === d.queryTerms).length;
      const sorted = d.results.every((x, i) => i === 0 || d.results[i - 1].matchedTerms >= x.matchedTerms);
      const ui = search(index.filter((i2) => i2.kind === "page" && i2.href !== "/about"), q, limit);
      console.log(`  [${q}] limit ${limit}: queryTerms=${d.queryTerms} exactMatches=${d.exactMatches} fullCount=${full} n=${d.results.length} matched=[${d.results.slice(0, 6).map((x) => x.matchedTerms).join(",")}] sorted=${sorted} uiClosest=${ui.closest} uiN=${ui.results.length} top=${d.results[0]?.slug ?? "-"}${d.note ? " NOTE" : ""}`);
    }
  }
  // 5. Rate limiter in-process.
  const lim = new RateLimiter(60, 60000);
  let last; const t0 = 1_000_000;
  for (let i = 0; i < 62; i++) { last = lim.check("k", t0 + i * 100); if (i === 0 || i === 59 || i === 60 || i === 61) console.log(`  hit ${i + 1}:`, JSON.stringify(last), JSON.stringify(rateLimitHeaders(last))); }
  console.log("  after window:", JSON.stringify(lim.check("k", t0 + 60000)));
  console.log("  allow() still boolean:", lim.allow("z"), new RateLimiter(1, 1000).allow("a"), (() => { const l = new RateLimiter(1, 1000); l.allow("a", 0); return l.allow("a", 1); })());
}
main();
