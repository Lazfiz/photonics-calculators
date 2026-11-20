import test from "node:test";
import assert from "node:assert/strict";

import { E_BAND, G652D_MAX, lowWaterPeakSummary } from "../src/physics/fiber-optics/low-water-peak";

const assertRel = (actual: number, expected: number, tol: number, msg: string) =>
  assert.ok(Math.abs(actual - expected) <= tol * Math.abs(expected), `${msg}: ${actual} vs ${expected}`);

// Golden values from an independent scratch re-implementation of the model in silica-attenuation.ts (Keiser 2010 §3.1 infrared and
// ultraviolet tails, Agrawal 2010 §2.5 Rayleigh A/λ⁴, OH Gaussians at 943/1246/1383/2212/2722 nm with Humbach et al.,
// J. Non-Cryst. Solids 203, 19 (1996) Table 3 strengths, the 1383 nm band as the Table 2 four-Gaussian fit), A = 0.85, x = 0.04, 40 km, E-band trapezoid rule with 200 intervals.
const p = { rayleighA: 0.85, geO2Fraction: 0.04 };

test("low-water-peak fibre (α_OH 0.05 dB/km): 1310/1383 nm loss, E-band mean, worst CWDM channel", () => {
  const s = lowWaterPeakSummary({ ...p, ohPeakDbPerKm: 0.05 }, 40);
  assertRel(s.at1310, 0.3231848466946394, 1e-9, "α(1310)");
  assertRel(s.at1383, 0.3111651205402913, 1e-9, "α(1383)");
  assertRel(s.eBandMean, 0.25913097315081524, 1e-9, "E-band mean");
  assert.equal(s.channels.length, 18);
  assert.equal(s.worst, 0); // 1271 nm
  assertRel(s.channels[s.worst], 14.553752126463198, 1e-9, "worst channel loss");
  assert.ok(s.at1383 <= G652D_MAX && s.at1383 <= s.at1310);
});

test("older fibre (α_OH 1 dB/km): the water peak makes the 1391 nm channel the worst", () => {
  const s = lowWaterPeakSummary({ ...p, ohPeakDbPerKm: 1 }, 40);
  assertRel(s.at1383, 1.2611651205402912, 1e-9, "α(1383)");
  assertRel(s.eBandMean, 0.5507169656306147, 1e-9, "E-band mean");
  assert.equal(s.worst, 6); // 1271 + 20·6 = 1391 nm
  assertRel(s.channels[s.worst], 40.452684586711314, 1e-9, "worst channel loss");
  assert.ok(s.at1383 > G652D_MAX);
});

test("E-band is 1360–1460 nm; invalid parameters give NaN", () => {
  assert.deepEqual(E_BAND, [1360e-9, 1460e-9]);
  const s = lowWaterPeakSummary({ rayleighA: -1, geO2Fraction: 0.04, ohPeakDbPerKm: 0 }, 40);
  assert.ok(Number.isNaN(s.at1310) && Number.isNaN(s.eBandMean));
});
