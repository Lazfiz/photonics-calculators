import assert from "node:assert/strict";
import { test } from "node:test";
import { multiphotonDepthSummary, twoPhotonDepthAtFraction } from "../src/physics/imaging/multiphoton-depth";

const close = (actual: number, expected: number, rel = 1e-9) =>
  assert.ok(Math.abs(actual / expected - 1) <= rel, `${actual} vs ${expected}`);

const base = {
  na: 0.8, lambda: 800e-9, n: 1.33, pulseWidth: 100e-15, repRate: 80e6, avgPower: 20e-3, absorption: 0.02e3, scattering: 6e3,
};

// Independent hand work: E = 20 mW/80 MHz = 0.25 nJ; Gaussian pulse P = 2√(ln 2/π) E/τ = 0.939437·0.25 nJ/100 fs = 2.348593 kW.
// Zipfel et al. 2003: lateral FWHM = 2√(ln 2)·0.325λ/(√2 NA^0.91) = 375.0500 nm (NA > 0.7),
// axial FWHM = 2√(ln 2)·0.532λ/(√2 (n − √(n² − NA²))) = 1.873272 µm.
// Beer–Lambert (Theer & Denk 2006): µ = 6.02 mm⁻¹ → 1/µ = 166.1130 µm; 2P signal exp(−2µz) = 1 % at ln(100)/(2µ) = 382.4892 µm.
test("multiphoton depth summary matches hand-worked values", () => {
  const s = multiphotonDepthSummary(base);
  close(s.lateral, 375.05001585897213e-9);
  close(s.axial, 1.8732717605687288e-6);
  close(s.pulseEnergy, 0.25e-9);
  close(s.peakPower, 2.3485931967491283e3);
  close(s.attenuationLength, 166.11295681063123e-6);
  close(s.depth1e2, 382.4892181053233e-6);
  close(s.depth1e3, 573.7338271579848e-6);
});

test("no attenuation gives an infinite depth; bad fractions are NaN", () => {
  const s = multiphotonDepthSummary({ ...base, absorption: 0, scattering: 0 });
  assert.equal(s.attenuationLength, Infinity);
  assert.equal(s.depth1e2, Infinity);
  assert.ok(Number.isNaN(twoPhotonDepthAtFraction(1.5, 1000)));
  assert.ok(Number.isNaN(twoPhotonDepthAtFraction(0.01, -1)));
});
