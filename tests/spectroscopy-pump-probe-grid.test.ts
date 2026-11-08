import assert from "node:assert/strict";
import { test } from "node:test";
import { deltaA, kineticTimes, peakIndex, type TransientBands } from "../src/physics/spectroscopy/pump-probe";

// Hand-worked grid (a definition of the page, not a published value): IRF 100 fs and tMax 20 ps give
// tStart = −max(0.3 ps, 1 ps) = −1 ps, so 401 points span −1 ps .. 20 ps in steps of 21/400 ps.
test("kineticTimes spans −max(3 IRF, 5 % tMax) to tMax", () => {
  const t = kineticTimes(100e-15, 20e-12);
  assert.equal(t.length, 401);
  assert.ok(Math.abs(t[0] - -1e-12) < 1e-24);
  assert.ok(Math.abs(t[400] - 20e-12) < 1e-24);
  assert.ok(Math.abs(t[1] - t[0] - 0.0525e-12) < 1e-24);
});

test("kineticTimes uses 3 IRF when it exceeds 5 % of tMax; irf = 0 still gets a negative lead", () => {
  assert.ok(Math.abs(kineticTimes(1e-12, 10e-12)[0] - -3e-12) < 1e-24);
  assert.ok(Math.abs(kineticTimes(0, 10e-12)[0] - -0.5e-12) < 1e-24);
});

test("peakIndex picks the largest |ΔA| (negative wins) and the first of equal values", () => {
  const mk = (total: number) => ({ bleach: 0, esaA: 0, se: 0, esaB: 0, total });
  assert.equal(peakIndex([mk(0.1), mk(-0.5), mk(0.3)]), 1);
  assert.equal(peakIndex([mk(0.5), mk(-0.5)]), 0);
  // A pure bleach at its band centre is −f · A_GS · n_bleach = −0.01 · 0.5 · 1.
  const band = { centre: 5e-7, fwhm: 6e-8, strength: 1 };
  const bands: TransientBands = { groundState: band, se: { ...band, strength: 0 }, esaA: { ...band, strength: 0 }, esaB: { ...band, strength: 0 } };
  const p = deltaA(5e-7, { a: 1, b: 0, bleach: 1 }, bands, 0.01, 0.5);
  assert.ok(Math.abs(p.total - -0.005) < 1e-15);
});
