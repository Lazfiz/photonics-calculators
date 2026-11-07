import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import robots, { AI_CRAWLERS } from "../src/app/robots";
import { INDEXNOW_KEY, SITE_URL } from "../src/lib/site";
import { calculators, categories } from "../src/registry";
import { buildLlmsTxt } from "../src/registry/llms";

test("robots.txt allows everything, names the AI crawlers and points at the sitemap", () => {
  const { rules, sitemap } = robots();
  assert.deepEqual(rules, [
    { userAgent: "*", allow: "/" },
    { userAgent: AI_CRAWLERS, allow: "/" },
  ]);
  for (const bot of ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "Bytespider", "Baiduspider"]) {
    assert.ok(AI_CRAWLERS.includes(bot), bot);
  }
  assert.equal(sitemap, `${SITE_URL}/sitemap.xml`);
});

test("llms.txt links every listed calculator once, with its tier, under its category", () => {
  const text = buildLlmsTxt();
  assert.match(text, /^# Photonics Calculators\n\n> \d+ free, open-source/);
  assert.match(text, /\/about#verification/);
  const links = [...text.matchAll(/^- \[[^\]]+\]\((https:[^)]+)\): .+ \((Exact|Textbook approximation|Illustrative|Not yet reviewed)\)$/gm)];
  const listed = calculators.filter((calculator) => !calculator.hidden);
  assert.deepEqual(
    links.map((match) => match[1]).sort(),
    listed.map((calculator) => `${SITE_URL}${calculator.href}`).sort(),
  );
  // Categories in home-page order, each calculator under its own.
  const headings = [...text.matchAll(/^## (.+)$/gm)].map((match) => match[1]);
  assert.deepEqual(headings, categories.map((category) => category.label));
  const fiber = text.slice(text.indexOf("## Fiber Optics"), text.indexOf("## Thin Film"));
  assert.match(fiber, /\/fiber-optics\/chromatic-dispersion\)/);
});

test("the IndexNow key file in public/ holds the key", () => {
  assert.match(INDEXNOW_KEY, /^[0-9a-f]{32}$/);
  assert.equal(readFileSync(`public/${INDEXNOW_KEY}.txt`, "utf8"), INDEXNOW_KEY);
});
