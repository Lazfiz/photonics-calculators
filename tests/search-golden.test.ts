import test from "node:test";
import assert from "node:assert/strict";

import { buildSearchIndex } from "../src/registry/search";
import { editDistance, MAX_QUERY_LENGTH, onlyValues, search, searchTerms } from "../src/lib/site-search";
import { KNOWN_WORDS } from "../src/lib/search-synonyms";
import { findCalculators, rankCalculators } from "../src/mcp/tools";

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
  // Plurals, and a synonym that must not count a typed word twice ("glasses" ~ "optical density" + "optical").
  ["optical glasses", ["materials/optical-glass-catalog"]],
  // Typos (one or two edits), corrected only when the word matches nothing as typed.
  ["gausian beam", ["wave-optics/gaussian-beam"]],
  ["brewstr angle", ["polarization/brewster-polarizer"]],
  ["fiber atenuation", ["fiber-optics/attenuation"]],
  ["depht of field", ["imaging/dof"]],
  ["rayliegh range", ["wave-optics/gaussian-beam"]],
];

// Every query that docs/audit/fable-verify-probes/search/probe-search.ts (verification 2026-11-17, part C) found outside
// the top 3 on main or on this branch before the search fixes, with the probe's expected pages ("<category>/*" = any page
// of that category). Each must now be in the top 3.
const PROBE_CASES: [query: string, expected: string[]][] = [
  // Plurals.
  ["blackbodies", ["spectroscopy/blackbody"]],
  ["quarter wave plates", ["polarization/retarder"]],
  ["lenses", ["imaging/image-distance", "imaging/telecentricity", "imaging/optical-power", "imaging/*"]],
  ["thin lenses", ["imaging/image-distance"]],
  ["fiber splices", ["fiber-optics/splice-loss"]],
  ["optical isolators", ["materials/magneto-optic"]],
  ["etalons", ["spectroscopy/etalon-fsr", "thin-film/fabry-perot-filter"]],
  ["anti reflection coatings", ["thin-film/single-ar", "thin-film/double-layer-ar", "thin-film/dual-band-ar", "thin-film/quarter-wave"]],
  ["AR coatings", ["thin-film/single-ar", "thin-film/double-layer-ar", "thin-film/dual-band-ar", "thin-film/quarter-wave"]],
  ["bandgaps", ["materials/semiconductor-bandgap"]],
  ["gaussian beams", ["wave-optics/gaussian-beam"]],
  ["beam waists", ["wave-optics/gaussian-beam", "wave-optics/mode-matching"]],
  ["photodiodes", ["detectors/silicon-photodiode", "detectors/photodiode-tia-noise", "detectors/photodiode-speed"]],
  ["interferometers", ["spectroscopy/michelson-interferometer", "wave-optics/gires-tournois", "imaging/low-coherence"]],
  ["link budgets", ["fiber-optics/link-budget", "free-space-comms/link-budget", "free-space-comms/lasercom-link"]],
  ["laser classes", ["laser-safety/classification"]],
  ["diffraction gratings", ["spectroscopy/dispersive-element", "spectroscopy/grating-efficiency"]],
  ["beamsplitters", ["thin-film/beamsplitter", "thin-film/dichroic", "polarization/polarizing-beamsplitter", "thin-film/amplitude-splitting"]],
  ["dielectric mirrors", ["thin-film/dielectric-high-reflector", "thin-film/bragg-reflector"]],
  // Spelling, hyphens, joined words, unicode and notation.
  ["optical fibre splice loss", ["fiber-optics/splice-loss"]],
  ["AR-coating", ["thin-film/single-ar", "thin-film/double-layer-ar", "thin-film/dual-band-ar", "thin-film/quarter-wave"]],
  ["fabryperot", ["spectroscopy/etalon-fsr", "thin-film/fabry-perot-filter"]],
  ["Fabry–Perot interferometer", ["spectroscopy/etalon-fsr", "thin-film/fabry-perot-filter"]],
  ["f/2.8", ["imaging/na-fnumber"]],
  ["f-stop", ["imaging/na-fnumber"]],
  ["m squared", ["wave-optics/m2-factor"]],
  ["M^2", ["wave-optics/m2-factor"]],
  ["1/e2", ["laser-safety/beam-diameter-conversion"]],
  ["halfwave plate", ["polarization/retarder"]],
  ["quarterwave plate", ["polarization/retarder"]],
  ["lambda/4 plate", ["polarization/retarder"]],
  ["V parameter", ["fiber-optics/v-number"]],
  ["lockin", ["detectors/lockin-amplifier"]],
  ["C_n^2", ["free-space-comms/scintillation", "free-space-comms/beam-wander"]],
  ["qswitch", ["wave-optics/q-switched-laser"]],
  ["wave-plate", ["polarization/retarder", "polarization/waveplate-order", "polarization/waveplate-thickness", "polarization/retarder-types"]],
  // Abbreviations and synonyms.
  ["QWP", ["polarization/retarder"]],
  ["HWP", ["polarization/retarder"]],
  ["GVD", ["materials/chromatic-dispersion", "fiber-optics/chromatic-dispersion"]],
  ["OPA", ["wave-optics/optical-parametric-amplifier"]],
  ["Cn2", ["free-space-comms/scintillation", "free-space-comms/beam-wander"]],
  ["EOM", ["materials/electro-optic"]],
  ["PCF", ["fiber-optics/photonic-crystal"]],
  ["DOP", ["polarization/degree-polarization"]],
  ["PER", ["polarization/polarizer-extinction"]],
  ["ND filter", ["spectroscopy/optical-density"]],
  ["BPP", ["wave-optics/m2-factor"]],
  ["GRIN", ["thin-film/gradient-index"]],
  ["fiber loss", ["fiber-optics/attenuation"]],
  ["refractive index of glass", ["materials/chromatic-dispersion", "materials/optical-glass-catalog"]],
  ["index of refraction", ["materials/chromatic-dispersion", "materials/optical-glass-catalog"]],
  ["irradiance", ["laser-safety/power-density"]],
  ["wavelength to frequency", ["spectroscopy/wavenumber-converter"]],
  ["eV to nm", ["spectroscopy/wavenumber-converter"]],
  ["lens equation", ["imaging/image-distance"]],
  ["mirror reflectivity", ["thin-film/dielectric-high-reflector", "thin-film/bragg-reflector", "thin-film/enhanced-aluminum", "thin-film/protected-silver"]],
  ["fibre nonlinearity", ["fiber-optics/nonlinear-effects"]],
  // Typos.
  ["q-swtiched laser", ["wave-optics/q-switched-laser"]],
  ["nohd calcualtor", ["laser-safety/nohd"]],
  ["gausian beam", ["wave-optics/gaussian-beam"]],
  ["guassian beam", ["wave-optics/gaussian-beam"]],
  ["gaussain beam", ["wave-optics/gaussian-beam"]],
  ["fiber atenuation", ["fiber-optics/attenuation"]],
  ["fiber attentuation", ["fiber-optics/attenuation"]],
  ["depht of field", ["imaging/dof"]],
  ["rayliegh range", ["wave-optics/gaussian-beam"]],
  ["raleigh range", ["wave-optics/gaussian-beam"]],
  ["fresnell", ["polarization/fresnel-polarization", "wave-optics/diffraction-integral"]],
  ["blakbody", ["spectroscopy/blackbody"]],
  ["blackbdoy", ["spectroscopy/blackbody"]],
  ["sellmeir", ["materials/chromatic-dispersion", "materials/optical-glass-catalog"]],
  ["sellmeyer", ["materials/chromatic-dispersion", "materials/optical-glass-catalog"]],
  ["polarizaton", ["polarization/*", "fiber-optics/polarization-mode-dispersion", "fiber-optics/polarization-controller", "fiber-optics/polarization-maintaining"]],
  ["numercal aperture", ["imaging/na-fnumber"]],
  ["ethalon", ["spectroscopy/etalon-fsr", "thin-film/fabry-perot-filter"]],
  ["diffraction gratting", ["spectroscopy/dispersive-element", "spectroscopy/grating-efficiency"]],
  ["abberation", ["imaging/strehl-ratio", "imaging/adaptive-optics", "imaging/shack-hartmann"]],
  ["tranimpedance amplifier", ["detectors/photodiode-tia-noise"]],
  ["birefringance", ["polarization/birefringence", "polarization/double-refraction", "materials/birefringent-crystals"]],
  ["elipsometry", ["thin-film/ellipsometry-measurement"]],
  ["dielectic mirror", ["thin-film/dielectric-high-reflector", "thin-film/bragg-reflector"]],
  ["focal lenght", ["imaging/image-distance", "imaging/optical-power"]],
  ["thin lense", ["imaging/image-distance"]],
  ["photomultiplyer", ["detectors/pmt"]],
  ["beam qualtiy", ["wave-optics/m2-factor"]],
  ["otrd", ["fiber-optics/otdr-analysis"]],
  ["isolater", ["materials/magneto-optic"]],
  // Questions.
  ["how much power can I put into a single mode fiber before SBS", ["fiber-optics/sbs-threshold", "fiber-optics/nonlinear-effects"]],
  ["laser spot size at 100 m", ["wave-optics/gaussian-beam", "free-space-comms/geometric-loss"]],
  ["eye safe power 1550 nm", ["laser-safety/mpe", "laser-safety/eye-safe-wavelength", "laser-safety/ael-limits", "laser-safety/classification"]],
  ["thickness of quarter wave AR coating at 1064", ["thin-film/quarter-wave", "thin-film/single-ar"]],
  ["photon energy 532 nm", ["spectroscopy/wavenumber-converter"]],
  ["shot noise limited SNR", ["detectors/shot-noise"]],
];

// Probe queries the site has no page for: the search must say so (closest) or return nothing, not pose as an answer.
const NO_PAGE = ["convert dBm to mW", "LIDAR range equation", "(n-1)"];

const index = buildSearchIndex();
const slugs = (query: string, limit: number) => search(index, query, limit).results.map((item) => item.href.slice(1));

const hits = (slug: string, expected: string[]) =>
  expected.some((e) => (e.endsWith("/*") ? slug === e.slice(0, -2) || slug.startsWith(e.slice(0, -1)) : slug === e));

test("probe queries: the answering page is in the top 3, on the site and through MCP", () => {
  const misses = PROBE_CASES.filter(([query, expected]) => !slugs(query, 3).some((slug) => hits(slug, expected)));
  assert.deepEqual(misses.map(([query]) => `${query} → ${slugs(query, 3).join(", ")}`), []);
  const viaMcp = PROBE_CASES.filter(([query, expected]) =>
    !findCalculators(query, 3).some((item) => hits(item.href.slice(1), expected)));
  assert.deepEqual(viaMcp.map(([query]) => `${query} → ${findCalculators(query, 3).map((i) => i.href.slice(1)).join(", ")}`), []);
  assert.ok(PROBE_CASES.length >= 90);
  for (const query of NO_PAGE) {
    const { results, closest } = search(index, query);
    assert.ok(results.length === 0 || closest, `${query} → ${results.map((item) => item.href).join(", ")}`);
  }
});

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

test("typo correction: an edit or two, only for words that match nothing as typed", () => {
  assert.equal(editDistance("gausian", "gaussian", 1), 1);
  assert.equal(editDistance("rayliegh", "rayleigh", 2), 1); // one transposition
  assert.equal(editDistance("brewster", "lobster", 1), 2); // past the cap: max + 1
  // A real word is never "corrected": "lens" stays lens, not "less" or "lena".
  assert.ok(search(index, "thermal lens").results.every((item) => /lens/i.test(`${item.title} ${item.description} ${item.tags.join(" ")}`)));
  // A corrected match is never reported as exact: the site flags it closest and names the correction, MCP too.
  const corrected = search(index, "gausian beam");
  assert.equal(corrected.closest, true);
  assert.equal(corrected.exact, 0);
  assert.deepEqual(corrected.corrected, [{ from: "gausian", to: ["gaussian"] }]);
  const { results, terms, exactMatches, closest, corrections } = rankCalculators("gausian beam", 3);
  assert.equal(terms, 2);
  assert.equal(results[0].item.href, "/wave-optics/gaussian-beam");
  assert.equal(exactMatches, 0);
  assert.equal(closest, true);
  assert.equal(corrections[0].from, "gausian");
});

test("typo correction leaves real words alone (W12): no word of the index or of the site's word list is replaced", () => {
  // Words the correction used to rewrite: tower → power, lower → power, wake → wave, fairy → airy.
  for (const word of ["tower", "lower", "wake", "fairy"]) {
    assert.ok(KNOWN_WORDS.has(word), word);
    assert.deepEqual(search(index, word), { results: [], closest: false, exact: 0, corrected: [] }, word);
  }
  // With a real word beside it, the real word still finds its pages, labelled closest, with nothing corrected.
  const tower = search(index, "tower power");
  assert.deepEqual(tower.corrected, []);
  assert.equal(tower.closest, true);
  // Each listed word matches nothing as typed (else it would not need listing) and is never corrected.
  for (const word of KNOWN_WORDS) {
    const found = search(index, `${word} `);
    assert.deepEqual([found.results.length, found.corrected.length], [0, 0], word);
  }
  // Index words are never corrected either: "thermal lens", "grin lens" (GRIN is a synonym of gradient index).
  assert.deepEqual(search(index, "thermal lens").corrected, []);
  assert.equal(search(index, "grin lens").results[0].href, "/thin-film/gradient-index");
  // A word nearest to a stop word is dropped as one: "nohd calcualtor" is the NOHD page, not pages titled "Calculator".
  const nohd = search(index, "nohd calcualtor");
  assert.equal(nohd.results[0].href, "/laser-safety/nohd");
  assert.deepEqual(nohd.corrected, [{ from: "calcualtor", to: ["calculator"] }]);
  // Misspelt plurals are corrected through their singular (W13).
  assert.match(search(index, "lazers").results[0].href, /laser/);
  assert.match(search(index, "wavelenghts").results[0].title, /wavelength/i);
});

test("plural rules: the singular is added as an alternative only where it is safe as a substring", () => {
  const alternatives = (word: string) => searchTerms(word)[0];
  assert.deepEqual(alternatives("prisms"), ["prisms", "prism"]);
  assert.deepEqual(alternatives("lenses"), ["lenses", "lens"]);
  assert.deepEqual(alternatives("fibers"), ["fibers", "fiber"]);
  assert.deepEqual(alternatives("switches"), ["switches", "switch"]);
  assert.deepEqual(alternatives("blackbodies"), ["blackbodies", "blackbody"]);
  // No bad singular: "len", "focu", "gaus", "sery", "specy".
  for (const [word, bad] of [["lens", "len"], ["focus", "focu"], ["gauss", "gaus"], ["series", "sery"], ["species", "specy"]]) {
    assert.ok(!alternatives(word).includes(bad), word);
  }
  assert.deepEqual(slugs("thin lenses", 1), slugs("thin lens", 1));
  assert.deepEqual(slugs("etalons", 1), slugs("etalon", 1));
});

test("abbreviations of three letters match whole words only (E2)", () => {
  // EOM is not inside "geometric", OPA not inside "propagation", DOP not the start of "doped".
  assert.ok(!slugs("EOM", 10).includes("free-space-comms/geometric-loss"), slugs("EOM", 10).join(", "));
  assert.equal(slugs("EOM", 3).includes("materials/electro-optic"), true);
  assert.ok(slugs("OPA", 10).every((slug) => !/propagation/.test(slug)));
  assert.equal(slugs("OPA", 1)[0], "wave-optics/optical-parametric-amplifier");
  assert.ok(!slugs("DOP", 10).includes("fiber-optics/rare-earth-doped"));
  assert.equal(slugs("DOP", 1)[0], "polarization/degree-polarization");
  // PER in capitals is the polarization extinction ratio, not "permissible"; "per" in a sentence stays a stop word.
  assert.equal(slugs("PER", 1)[0], "polarization/polarizer-extinction");
  assert.ok(!slugs("PER", 3).includes("laser-safety/mpe"));
  assert.deepEqual(searchTerms("loss in dB per km").map((term) => term[0]), ["loss", "db", "km"]);
  // Three letters still complete while typing a lone word.
  assert.equal(slugs("gau", 1)[0], "wave-optics/gaussian-beam");
});

test("hyphenated, joined and split words; unicode and notation (E3, W9)", () => {
  assert.deepEqual(slugs("AR-coating", 3), slugs("AR coating", 3));
  assert.equal(slugs("antireflection", 1)[0].startsWith("thin-film/"), true);
  assert.deepEqual(slugs("anti-reflection coating", 12).sort(), slugs("ar coating", 12).sort()); // W13: no synonym lost
  assert.ok(slugs("anti-reflection coating", 12).length >= 4);
  assert.ok(["spectroscopy/etalon-fsr", "thin-film/fabry-perot-filter"].includes(slugs("fabryperot", 1)[0]));
  assert.equal(slugs("lockin", 1)[0], "detectors/lockin-amplifier");
  assert.equal(slugs("halfwave plate", 1)[0], "polarization/retarder");
  // En dash, micro sign against Greek mu, superscripts, ligatures, accents.
  assert.deepEqual(slugs("Fabry–Perot", 3), slugs("Fabry-Perot", 3));
  assert.deepEqual(searchTerms("μm to wavenumber"), searchTerms("µm to wavenumber"));
  assert.deepEqual(slugs("ﬁber attenuation", 3), slugs("fiber attenuation", 3));
  assert.deepEqual(slugs("fabry-pérot", 3), slugs("fabry-perot", 3));
  for (const query of ["1/e2", "1/e²", "1/e^2 beam diameter"]) {
    assert.equal(slugs(query, 1)[0], "laser-safety/beam-diameter-conversion", query);
  }
  for (const query of ["f/#", "f/2.8", "f-stop", "fnumber"]) assert.equal(slugs(query, 1)[0], "imaging/na-fnumber", query);
  for (const query of ["M^2", "m squared", "M²"]) assert.equal(slugs(query, 1)[0], "wave-optics/m2-factor", query);
  for (const query of ["C_n^2", "Cn2", "Cn²"]) {
    assert.ok(["free-space-comms/scintillation", "free-space-comms/beam-wander"].includes(slugs(query, 1)[0]), query);
  }
});

test("one extra word doesn't hide the page that answers the rest; it is shown, flagged closest (W10)", () => {
  const snr = search(index, "shot noise limited SNR");
  assert.equal(snr.results[0].href, "/detectors/shot-noise");
  assert.equal(snr.closest, true);
  // A generic word ("laser", "optical") is never required: the Splice Loss page doesn't say "optical".
  assert.equal(slugs("optical fibre splice loss", 1)[0], "fiber-optics/splice-loss");
  assert.ok(slugs("laser spot size at 100 m", 3).includes("wave-optics/gaussian-beam"));
  // But a page about every word stays first: Mode Matching answers "lens … couple … fiber".
  assert.ok(slugs("what lens do I need to couple into fiber", 3).includes("wave-optics/mode-matching"));
  // An exact page that is the answer keeps the list unflagged.
  assert.equal(search(index, "airy disk").closest, false);
  // Exact pages are not padded with weaker partial ones (W8): "airy disk" lists its two exact pages only. Pages missing
  // a word that outscore every exact page follow them, flagged, after the divider `exact` marks.
  assert.deepEqual(search(index, "airy disk"), {
    results: ["/imaging/airy-disk", "/imaging/spinning-disk"].map((href) => index.find((item) => item.href === href)),
    closest: false, exact: 2, corrected: [],
  });
  const zernike = search(index, "zernike mode");
  assert.equal(zernike.results[0].href, "/imaging/adaptive-optics");
  assert.deepEqual([zernike.closest, zernike.exact], [true, 1]);
  const snrPhotodiode = search(index, "signal to noise photodiode");
  assert.deepEqual([snrPhotodiode.closest, snrPhotodiode.exact], [true, 2]);
  assert.equal(snrPhotodiode.results[2].href, "/detectors/photodiode-tia-noise");
});

test("query length is capped and value-only queries are recognised (M13)", () => {
  const long = "laser ".repeat(2000);
  const started = performance.now();
  const results = search(index, long);
  assert.ok(performance.now() - started < 500, "a 12 000-character query is cut before scoring");
  assert.deepEqual(results, search(index, long.slice(0, MAX_QUERY_LENGTH)));
  assert.equal(onlyValues("1550 nm"), true);
  assert.equal(onlyValues("5 W"), true);
  assert.equal(onlyValues("photon energy 532 nm"), false);
  assert.equal(onlyValues("xyzzy"), false);
});

test("no exact match: the closest pages, labelled; nothing only when no word matches", () => {
  const closest = search(index, "laser xyzzy");
  assert.equal(closest.closest, true);
  assert.ok(closest.results.length > 0);
  assert.ok(closest.results.every((item) => /laser/i.test(`${item.title} ${item.description} ${item.tags.join(" ")} ${item.href}`)));
  assert.deepEqual(search(index, "xyzzy"), { results: [], closest: false, exact: 0, corrected: [] });
  assert.equal(search(index, "airy disk").closest, false);
});
