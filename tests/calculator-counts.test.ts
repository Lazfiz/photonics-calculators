import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

import calculatorCounts from "../src/generated/calculator-counts.json";
import { homeCategories, totalCalculatorCount } from "../src/lib/home-categories";

const appDir = path.join(process.cwd(), "src", "app");

/** Pages per category straight from the file system: src/app/<category>/<slug>/page.tsx. */
function countPages(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const category of readdirSync(appDir, { withFileTypes: true })) {
    if (!category.isDirectory() || /^[_(]/.test(category.name)) continue;
    const slugs = readdirSync(path.join(appDir, category.name), { withFileTypes: true });
    const n = slugs.filter(
      (slug) => slug.isDirectory() && existsSync(path.join(appDir, category.name, slug.name, "page.tsx"))
    ).length;
    if (n > 0) counts[category.name] = n;
  }
  return counts;
}

// The site used to say "541 calculators" with 524 pages. The counts are generated at predev/prebuild;
// if this fails, run `node scripts/generate-search-index.mjs` and commit calculator-counts.json.
test("calculator-counts.json matches the pages in src/app", () => {
  const counts = countPages();
  assert.deepEqual(calculatorCounts.byCategory, counts);
  assert.equal(
    calculatorCounts.total,
    Object.values(counts).reduce((sum, n) => sum + n, 0)
  );
});

test("the home page lists every category, with the generated counts", () => {
  const counts = countPages();
  assert.deepEqual(homeCategories.map((c) => c.id).sort(), Object.keys(counts).sort());
  for (const category of homeCategories) assert.equal(category.count, counts[category.id], category.id);
  assert.equal(totalCalculatorCount, calculatorCounts.total);
});
