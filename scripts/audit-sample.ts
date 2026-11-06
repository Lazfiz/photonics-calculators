// Draws the blind-audit sample (ROADMAP 9b): N random tiered pages per category, from a fixed seed, so anyone can
// redraw the same sample and check that it was not picked by hand.
// Usage: npx tsx scripts/audit-sample.ts [seed=20261106] [perCategory=3]
import { calculators } from "../src/registry/index";

const seed = Number(process.argv[2] ?? 20261106);
const perCategory = Number(process.argv[3] ?? 3);

// mulberry32: a small, well-known 32-bit PRNG.
function mulberry32(a: number): () => number {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(seed);
const byCategory = new Map<string, string[]>();
for (const calculator of calculators) {
  if (calculator.hidden || !calculator.tier) continue;
  const hrefs = byCategory.get(calculator.category) ?? [];
  hrefs.push(calculator.href);
  byCategory.set(calculator.category, hrefs);
}

const tierOf = new Map(calculators.map((calculator) => [calculator.href, calculator]));
for (const category of [...byCategory.keys()].sort()) {
  const hrefs = byCategory.get(category)!.sort();
  // Partial Fisher–Yates: the first perCategory slots become the sample.
  for (let i = 0; i < Math.min(perCategory, hrefs.length); i++) {
    const j = i + Math.floor(random() * (hrefs.length - i));
    [hrefs[i], hrefs[j]] = [hrefs[j], hrefs[i]];
  }
  for (const href of hrefs.slice(0, perCategory)) {
    const calculator = tierOf.get(href)!;
    console.log(`${href}  ${calculator.tier}  refs=${calculator.references?.length ?? 0}`);
  }
}
