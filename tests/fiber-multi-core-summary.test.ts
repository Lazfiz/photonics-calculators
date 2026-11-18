// Golden values for multiCoreSummary (src/physics/fiber-optics/multi-core.ts), from an independent script (own Bessel series and
// K_ν integral): Snyder's κ = (NA/(n₁a))(U²/V³)K₀(WΛ/a)/K₁²(W), Koshiba et al. (IEEE Photonics J. 4, 1987, 2012)
// h̄ = 2κ²d Re[1/√((1 + i dΔβ)² + (dβΛ/R_b)²)], Hayashi et al. (Opt. Express 19, 16576, 2011) XT = tanh(h̄L).
import assert from "node:assert/strict";
import { test } from "node:test";

import { coreLayout, multiCoreSummary } from "../src/physics/fiber-optics/multi-core";

const close = (actual: number, expected: number, rel = 1e-8) =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${actual} vs ${expected}`);
const db = (x: number) => 10 * Math.log10(x);

const base = {
  numCores: 7, corePitch_um: 45, coreRadius_um: 4.5, coreIndex: 1.468, claddingIndex: 1.463, wavelength_nm: 1550,
  fiberLength_km: 10, deltaBeta: 0, bendRadius_mm: 100, correlationLength: 0.05, outerCladding_um: 30,
};

test("default 7-core fibre", () => {
  const s = multiCoreSummary(base);
  close(s.V, 2.208277234960632);
  close(s.kappa, 0.004446780189011436);
  close(s.beta, 5940239.709745546);
  close(s.h, 1.4794240693679085e-8);
  close(db(s.pair), -38.29907323026831);
  close(db(s.worst), -30.517560726431874);
  assert.equal(s.rpk, Infinity);
  close(s.claddingDiameter, 150);
});

test("ring of 12 with mismatch", () => {
  const s = multiCoreSummary({
    ...base, numCores: 12, corePitch_um: 35, wavelength_nm: 1310, fiberLength_km: 100, deltaBeta: 500, bendRadius_mm: 50, correlationLength: 0.1,
  });
  close(s.kappa, 0.008908582068785958);
  close(s.h, 3.2418209712466845e-8);
  close(db(s.pair), -24.89212494017763);
  close(db(s.worst), -21.88182498353782);
  close(s.rpk, 0.4921641973596425);
  close(s.claddingDiameter, 195.22961568046958);
});

test("layout fallback, single core, zero length and overlapping cores", () => {
  assert.equal(coreLayout(5).cores, 7);
  assert.equal(coreLayout(19).layout.neighbours, 6);
  assert.equal(multiCoreSummary({ ...base, numCores: 1 }).worst, 0);
  assert.equal(multiCoreSummary({ ...base, fiberLength_km: 0 }).pair, 0);
  assert.ok(Number.isNaN(multiCoreSummary({ ...base, corePitch_um: 8 }).kappa)); // pitch < 2a: the cores overlap
});
