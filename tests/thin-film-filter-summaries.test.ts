import assert from "node:assert/strict";
import test from "node:test";
import { cavityFilterSummary } from "../src/physics/thin-film/cavity-filter";
import { blockingFilterResponse, MAX_TOTAL_PERIODS } from "../src/physics/thin-film/edge-filter";

const close = (a: number, b: number, rel: number) => assert.ok(Math.abs(a - b) <= rel * Math.abs(b), `${a} vs ${b}`);

// Independent 2×2 characteristic-matrix program (Macleod, Thin-Film Optical Filters, 4th ed., ch. 2) for both.
test("cavityFilterSummary: single half-wave cavity leaves the bare substrate, T = 4 n_s/(1 + n_s)^2", () => {
  const s = cavityFilterSummary({ nH: 2.35, nL: 1.45, nSub: 1.52, nSpacer: 2.1, mirrorPairs: 3, cavities: 1, lambda0: 1550e-9 });
  assert.ok(s);
  close(s.T0, (4 * 1.52) / (2.52 * 2.52), 1e-9);
  assert.equal(s.layerCount, 13);
});

test("cavityFilterSummary: two cavities, FWHM and peak T of the independent program", () => {
  const s = cavityFilterSummary({ nH: 2.35, nL: 1.45, nSub: 1.52, nSpacer: 2.1, mirrorPairs: 3, cavities: 2, lambda0: 1550e-9 });
  assert.ok(s);
  close(s.band.long - s.band.short, 19.137645312e-9, 1e-9);
  close(s.band.peakT, 0.98891525620, 1e-9);
});

test("cavityFilterSummary: no index contrast or bad indices give null", () => {
  const base = { nH: 2.35, nL: 1.45, nSub: 1.52, nSpacer: 2.1, mirrorPairs: 3, cavities: 2, lambda0: 1550e-9 };
  assert.equal(cavityFilterSummary({ ...base, nH: 1.45 }), null);
  assert.equal(cavityFilterSummary({ ...base, nSub: 0 }), null);
  assert.equal(cavityFilterSummary({ ...base, lambda0: 0 }), null);
});

const cold = { type: "long-pass" as const, nH: 2.35, nL: 1.45, nSub: 1.52, nInc: 1, blockFrom: 400e-9, blockTo: 700e-9, passFrom: 800e-9, passTo: 1200e-9, periods: 10 };

test("blockingFilterResponse: cold-mirror defaults against the independent program", () => {
  const r = blockingFilterResponse(cold);
  assert.ok(r.results);
  assert.equal(r.centres.length, 2);
  assert.equal(r.stack.layers.length, 41);
  close(r.results.block.mean, 0.9948884291272677, 1e-9);
  close(r.results.pass.min, 0.9025438189843416, 1e-9);
  close(r.results.edge, 710.6387647478873e-9, 1e-9);
  assert.equal(r.overlap, false);
});

test("blockingFilterResponse: overlap, too many periods and bad bands", () => {
  assert.equal(blockingFilterResponse({ ...cold, passFrom: 650e-9 }).overlap, true);
  const big = blockingFilterResponse({ ...cold, nH: 1.6, blockFrom: 300e-9, blockTo: 3000e-9, periods: 40 });
  assert.equal(big.tooBig, true);
  assert.equal(big.results, null);
  assert.ok(big.centres.length * 40 > MAX_TOTAL_PERIODS);
  const bad = blockingFilterResponse({ ...cold, blockTo: 300e-9 });
  assert.equal(bad.bandsOk, false);
  assert.equal(bad.results, null);
});
