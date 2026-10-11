// Find calculators by concept from the registry: one line per hit instead of grepping 470 pages.
//   node --import tsx scripts/find.ts <words…>        # top 8 pages that match all the words (npx tsx works too)
//   node --import tsx scripts/find.ts -n 20 <words…>  # more hits
// Matches word prefixes in the slug, title, heading, keywords, description, model note, known issue, references and
// the names of the physics modules the page imports. Hidden pages are included and marked.
// Output: <category>/<slug> | tier | title | physics modules. The page is src/app/<category>/<slug>/page-client.tsx.
import { readFileSync } from "node:fs";
import { calculators } from "../src/registry/index";
import type { Calculator } from "../src/registry/types";

const STOP = new Set(["a", "an", "and", "the", "of", "for", "in", "on", "to", "with", "calculator", "calculators"]);

function words(text: string | undefined): string[] {
  return (text ?? "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

/** The `src/physics/**` and `src/lib/**` modules a page imports, as `physics/<category>/<name>`. */
function modulesOf(calculator: Calculator): string[] {
  let source: string;
  try {
    source = readFileSync(`src/app/${calculator.category}/${calculator.slug}/page-client.tsx`, "utf8");
  } catch {
    return [];
  }
  const found = [...source.matchAll(/from\s+"(?:\.\.\/)+((?:physics|lib)\/[^"]+)"/g)].map((m) => m[1]);
  return [...new Set(found)];
}

// Each field's words and how much a term found there is worth.
const FIELDS: [weight: number, pick: (c: Calculator, modules: string[]) => string[]][] = [
  [6, (c) => [...words(c.slug), ...words(c.title), ...words(c.heading)]],
  [4, (c) => (c.keywords ?? []).flatMap(words)],
  [3, (_c, modules) => modules.flatMap(words)],
  [2, (c) => [...words(c.description), ...words(c.lede), ...words(c.category)]],
  [1, (c) => [...words(c.modelNote), ...words(c.knownIssue), ...(c.references ?? []).flatMap((r) => words(r.citation))]],
];

function score(calculator: Calculator, modules: string[], terms: string[]): { hits: number; points: number } {
  const fields = FIELDS.map(([weight, pick]) => [weight, pick(calculator, modules)] as const);
  let hits = 0;
  let points = 0;
  for (const term of terms) {
    // A crude stem, so "scrambler" finds "scrambling" and "depolarizer" finds "depolarization"; it scores half.
    const stem = term.slice(0, Math.max(4, term.length - 3));
    let best = 0;
    for (const [weight, list] of fields) {
      if (list.includes(term)) best = Math.max(best, weight + 1);
      else if (list.some((word) => word.startsWith(term))) best = Math.max(best, weight);
      else if (list.some((word) => word.startsWith(stem))) best = Math.max(best, weight / 2);
    }
    if (best > 0) hits++;
    points += best;
  }
  return { hits, points };
}

const args = process.argv.slice(2);
let limit = 8;
const nAt = args.indexOf("-n");
if (nAt >= 0) {
  limit = Number(args[nAt + 1]) || limit;
  args.splice(nAt, 2);
}
const terms = [...new Set(args.flatMap(words).filter((term) => !STOP.has(term)))];
if (terms.length === 0) {
  console.error("Usage: node --import tsx scripts/find.ts [-n 20] <words…>");
  process.exit(1);
}

const ranked = calculators
  .map((calculator) => {
    const modules = modulesOf(calculator);
    return { calculator, modules, ...score(calculator, modules, terms) };
  })
  .filter((row) => row.hits > 0)
  .sort(
    (a, b) =>
      b.hits - a.hits ||
      b.points - a.points ||
      (b.calculator.priority ?? 50) - (a.calculator.priority ?? 50) ||
      a.calculator.href.localeCompare(b.calculator.href, "en"),
  );

if (ranked.length === 0) {
  console.log(`No page matches ${terms.join(" ")}.`);
  process.exit(1);
}
const complete = ranked.filter((row) => row.hits === terms.length).length;
console.log(
  complete
    ? `${complete} pages match all of: ${terms.join(" ")}`
    : `No page matches all of: ${terms.join(" ")}; best partial matches:`,
);
for (const { calculator: c, modules } of ranked.slice(0, complete ? Math.min(limit, complete) : limit)) {
  const tier = c.knownIssue ? "KNOWN ISSUE" : (c.tier ?? "untiered");
  const flags = c.hidden ? " (hidden)" : "";
  const physics = modules.length ? modules.map((m) => m.replace(/^physics\//, "")).join(", ") : "inline";
  console.log(`${c.category}/${c.slug}${flags} | ${tier} | ${c.title} | ${physics}`);
}
