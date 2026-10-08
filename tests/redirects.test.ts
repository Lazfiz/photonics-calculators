import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

import nextConfig from "../next.config.mjs";
import { findCalculator } from "../src/registry";
import calculatorRedirects from "../src/registry/redirects.json";
import { CATEGORY_IDS } from "../src/registry/types";

const HREF = new RegExp(`^/(${CATEGORY_IDS.join("|")})/[a-z0-9]+(-[a-z0-9]+)*$`);
const ANY_HREF = new RegExp(`/(${CATEGORY_IDS.join("|")})/[a-z0-9-]+`, "g");
const entries = Object.entries(calculatorRedirects as Record<string, string>);

test("each redirect goes from a removed page to a registered calculator, in one hop", () => {
  assert.ok(entries.length > 0);
  for (const [source, destination] of entries) {
    assert.match(source, HREF);
    assert.equal(findCalculator(source), undefined, `${source} is still registered`);
    assert.ok(!existsSync(`src/app${source}`), `src/app${source} still exists`);
    assert.ok(findCalculator(destination), `${source} → ${destination}: not a calculator`);
    assert.ok(!(destination in calculatorRedirects), `${source} → ${destination} chains`);
  }
});

test("next.config.mjs serves every redirect as permanent", async () => {
  const served = await nextConfig.redirects!();
  assert.deepEqual(
    served,
    entries.map(([source, destination]) => ({ source, destination, permanent: true })),
  );
});

test("nothing in src/ links to a redirected href", () => {
  const files = execFileSync("git", ["ls-files", "src"], { encoding: "utf8" })
    .split("\n")
    .filter((file) => /\.(tsx?|json|md)$/.test(file) && !file.endsWith("redirects.json"));
  const sources = new Set(entries.map(([source]) => source));
  const stale: string[] = [];
  for (const file of files) {
    for (const match of readFileSync(file, "utf8").matchAll(ANY_HREF)) {
      if (sources.has(match[0])) stale.push(`${file}: ${match[0]}`);
    }
  }
  assert.deepEqual(stale, []);
});
