import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { GET, generateStaticParams } from "../src/app/og/[...path]/route";
import { calculators, categories } from "../src/registry";

const og = (...path: string[]) => GET(new Request(`https://example.test/og/${path.join("/")}`), { params: Promise.resolve({ path }) });

test("/og: a 1200×630 PNG for a calculator and a category; 404 for anything else", async () => {
  for (const path of [["laser-safety", "nohd"], ["fiber-optics"]]) {
    const response = await og(...path);
    assert.equal(response.status, 200, path.join("/"));
    assert.equal(response.headers.get("content-type"), "image/png");
    assert.match(response.headers.get("cache-control") ?? "", /s-maxage=/);
    const png = Buffer.from(await response.arrayBuffer());
    assert.deepEqual([...png.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], "PNG signature");
    assert.equal(png.toString("latin1", 12, 16), "IHDR");
    assert.equal(png.readUInt32BE(16), 1200);
    assert.equal(png.readUInt32BE(20), 630);
  }
  for (const path of [["no-such-category"], ["laser-safety", "no-such-page"], ["laser-safety", "nohd", "extra"]]) {
    assert.equal((await og(...path)).status, 404, path.join("/"));
  }
});

test("/og: one static image per category and per calculator", () => {
  const params = generateStaticParams().map(({ path }) => path.join("/"));
  assert.equal(params.length, categories.length + calculators.length);
  assert.equal(new Set(params).size, params.length);
  assert.ok(params.includes("laser-safety/nohd") && params.includes("fiber-optics"));
});

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

test("gray-500 text: AA contrast on the dark cards, and still a step below gray-400", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  const color = css.match(/\.text-gray-500\s*\{\s*color:\s*(#[0-9a-f]{6});/i)?.[1];
  assert.ok(color, "globals.css overrides .text-gray-500 with a hex colour");
  const gray400 = "#99a1af"; // Tailwind v4 gray-400, oklch(70.7% 0.022 261.325)
  for (const background of ["#030712", "#101828", "#1e2939"]) { // gray-950, gray-900, gray-800
    assert.ok(contrast(color, background) >= 4.5, `${color} on ${background}: ${contrast(color, background).toFixed(2)}`);
  }
  // Distinct: gray-400 is visibly brighter (WCAG ratio between the two at least 1.15).
  assert.ok(contrast(gray400, color) >= 1.15, `${contrast(gray400, color).toFixed(3)}`);
  assert.doesNotMatch(css, /\.text-gray-500\s*\{\s*color:\s*var\(--color-gray-400/);
});
