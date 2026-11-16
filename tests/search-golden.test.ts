import test from "node:test";
import assert from "node:assert/strict";

import { buildSearchIndex } from "../src/registry/search";
import { search } from "../src/lib/site-search";
import { findCalculators } from "../src/mcp/tools";

// Questions as visitors and agents type them, each with the page(s) that answer it. The upgrades review (2026-11,
// item 1) asks for every case in the top 3 and at least 30 at the top. Several seed cases come from its evidence:
// "beam waist after a lens" and "fibre link budget 80 km" found nothing or the wrong pages before.
const CASES: [query: string, expected: string[]][] = [
  ["beam waist after a lens", ["wave-optics/mode-matching"]],
  ["fibre link budget 80 km", ["fiber-optics/link-budget"]],
  ["focused spot size", ["imaging/airy-disk"]],
  ["sellmeier BK7", ["materials/chromatic-dispersion", "materials/optical-glass-catalog"]],
  ["laser goggles OD", ["laser-safety/optical-density"]],
  ["focus gaussian", ["wave-optics/gaussian-beam"]],
  ["gauss", ["wave-optics/gaussian-beam"]],
  ["brewster angle", ["polarization/brewster-polarizer"]],
  ["polarisation mode dispersion", ["fiber-optics/polarization-mode-dispersion"]],
  ["MPE", ["laser-safety/mpe"]],
  ["nohd", ["laser-safety/nohd"]],
  ["how far can my fibre link go", ["fiber-optics/link-budget"]],
  ["signal to noise photodiode", ["detectors/photodiode-tia-noise"]],
  ["airy disk", ["imaging/airy-disk"]],
  ["depth of field", ["imaging/dof"]],
  ["rayleigh range", ["wave-optics/gaussian-beam"]],
  ["anti-reflection coating", ["thin-film/single-ar"]],
  ["quarter wave plate", ["polarization/retarder"]],
  ["fabry perot etalon finesse", ["spectroscopy/etalon-fsr"]],
  ["dispersion compensation", ["fiber-optics/dispersion-comp"]],
  ["M2 beam quality", ["wave-optics/m2-factor"]],
  ["blackbody", ["spectroscopy/blackbody"]],
  ["laser classification", ["laser-safety/classification"]],
  ["splice loss", ["fiber-optics/splice-loss"]],
  ["bend loss", ["fiber-optics/macro-bending-loss"]],
  ["otdr", ["fiber-optics/otdr-analysis"]],
  ["transimpedance amplifier noise", ["detectors/photodiode-tia-noise"]],
  ["dark current", ["detectors/dark-current"]],
  ["free space optical link budget", ["free-space-comms/link-budget"]],
  ["michelson interferometer", ["spectroscopy/michelson-interferometer"]],
  ["abbe number", ["materials/optical-glass-catalog"]],
  ["mode field diameter", ["fiber-optics/mode-field-diameter"]],
  ["fresnel reflection", ["polarization/fresnel-polarization"]],
  ["accessible emission limit", ["laser-safety/ael-limits"]],
  ["beer lambert absorbance", ["spectroscopy/lambert-beer-law"]],
  ["colour centres", ["materials/color-centers"]],
  ["V number", ["fiber-optics/v-number"]],
  ["f number", ["imaging/na-fnumber"]],
  ["stokes parameters", ["polarization/stokes"]],
  ["faraday rotation", ["materials/magneto-optic"]],
  ["bandgap", ["materials/semiconductor-bandgap"]],
  ["q switched laser", ["wave-optics/q-switched-laser"]],
  ["thin lens", ["imaging/image-distance"]],
  ["optical isolator", ["materials/magneto-optic"]],
  ["rytov variance", ["free-space-comms/scintillation"]],
];

const index = buildSearchIndex();
const slugs = (query: string, limit: number) => search(index, query, limit).results.map((item) => item.href.slice(1));

test("golden queries: the answering page is in the top 3, and at the top for at least 30", () => {
  const misses = CASES.filter(([query, expected]) => !slugs(query, 3).some((slug) => expected.includes(slug)));
  assert.deepEqual(misses.map(([query]) => `${query} → ${slugs(query, 3).join(", ")}`), []);
  const first = CASES.filter(([query, expected]) => expected.includes(slugs(query, 1)[0])).length;
  assert.ok(first >= 30, `${first} of ${CASES.length} at the top`);
  assert.ok(CASES.length >= 40);
});

test("the MCP find_calculator ranks the same way", () => {
  for (const [query, expected] of CASES) {
    const found = findCalculators(query, 3).map((item) => item.href.slice(1));
    assert.ok(found.some((slug) => expected.includes(slug)), `${query} → ${found.join(", ")}`);
  }
});

test("spelling, stop words, numbers and units", () => {
  // British spelling finds the American titles, and both spellings rank alike.
  assert.deepEqual(slugs("polarisation mode dispersion", 3), slugs("polarization mode dispersion", 3));
  assert.deepEqual(slugs("fibre bend loss", 3), slugs("fiber bend loss", 3));
  // Filler words, bare numbers and their units don't narrow the search.
  assert.deepEqual(slugs("fibre link budget 80 km", 3), slugs("fiber link budget", 3));
  assert.deepEqual(slugs("what is the airy disk", 3), slugs("airy disk", 3));
  assert.deepEqual(slugs("splice loss at 1550nm", 3), slugs("splice loss", 3));
});

test("no exact match: the closest pages, labelled; nothing only when no word matches", () => {
  const closest = search(index, "laser xyzzy");
  assert.equal(closest.closest, true);
  assert.ok(closest.results.length > 0);
  assert.ok(closest.results.every((item) => /laser/i.test(`${item.title} ${item.description} ${item.tags.join(" ")} ${item.href}`)));
  assert.deepEqual(search(index, "xyzzy"), { results: [], closest: false });
  assert.equal(search(index, "airy disk").closest, false);
});
