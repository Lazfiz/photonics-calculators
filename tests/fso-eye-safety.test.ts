import test from "node:test";
import assert from "node:assert/strict";

import { effectiveDiameterAt, nominalOcularHazardDistance, roundBeam } from "../src/physics/laser-safety/hazard-distance";
import { eyeLimits, limitMaxPower } from "../src/physics/laser-safety/eye-exposure-limits";
import { classifyCw } from "../src/physics/laser-safety/laser-classes";

// free-space-comms/eye-safety-fso runs on the laser-safety modules. Limits: ICNIRP, Health Phys. 105(3), 271–295
// (2013), doi:10.1097/HP.0b013e3182983fd4: Table 5 (1500–1800 nm, t ≤ 10 s: H = 10⁴ J/m²; 400–700 nm thermal
// 18·t^0.75 J/m²), Table 8 (1400 nm – 0.1 mm aperture 1.5·t^(3/8) mm for 0.35–10 s, 3.5 mm from 10 s).
// NOHD: ANSI Z136.1-2014 App. B.
// The page used to give 1.8·t^-0.25·1e4 W/m² (18,000 W/m² at 1 s, 1000× the ICNIRP 18 W/m²).

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

test("page default: 1550 nm, 100 mW, 10 mm, 0.5 mrad, 10 s", () => {
  const lambda = 1550e-9, P = 0.1, a = 10e-3, phi = 0.5e-3, t = 10;
  const beam = roundBeam(a, phi);
  const nohd = nominalOcularHazardDistance(lambda, P, beam, t);
  // Hand calculation: E = 10⁴/10 = 1000 W/m² over D = 3.5 mm (the t ≥ 10 s aperture); a Gaussian of 1/e² diameter d puts
  // P(1 − exp(−2D²/d²)) in the aperture, so it is within the limit for d ≥ D·√(2/−ln(1 − q)), q = E·πD²/(4P).
  const E = 1e4 / t;
  const D = 3.5e-3;
  const q = (E * Math.PI * D * D) / (4 * P);
  const dSafe = D * Math.sqrt(2 / -Math.log(1 - q));
  assertRel(nohd.distance, (dSafe - a) / phi, 1e-9, "NOHD (a + rφ growth)");
  assertRel(nohd.distance, 11.125, 1e-3, "NOHD as rendered");
  assert.equal(nohd.limiting, "cornealIr");
  // Large-beam form √(8P/(πE)) of ANSI Z136.1 gives 11.92 m; averaging over the 3.5 mm aperture lowers it.
  assert.ok(nohd.distance < (Math.sqrt((8 * P) / (Math.PI * E)) - a) / phi);
  assert.equal(classifyCw(lambda, P, { d: a, phi }).laserClass, "3R");
  // Margin at 2 m: the largest power within the corneal limit at that beam diameter.
  const pMax = Math.min(...eyeLimits(lambda).map((l) => limitMaxPower(l, effectiveDiameterAt(beam, 2), t)));
  const d2 = a + 2 * phi;
  assertRel(pMax, (E * Math.PI * D * D) / 4 / (1 - Math.exp((-2 * D * D) / (d2 * d2))), 1e-9, "P_max at 2 m");
  assertRel(pMax, 0.05249, 1e-3, "P_max as rendered");
});

test("532 nm point source, 100 mW, 0.5 mrad, 1 s: the far-field NOHD", () => {
  const P = 0.1, phi = 0.5e-3;
  const nohd = nominalOcularHazardDistance(532e-9, P, roundBeam(0, phi), 1);
  // Retinal thermal 18 W/m² at 1 s; the far-field peak 8P/(πd²) = E gives 237.88 m, the 7 mm aperture average ≈ 0.2 % less.
  const farField = Math.sqrt((8 * P) / (Math.PI * 18)) / phi;
  assertRel(farField, 237.883, 1e-5, "analytic far field");
  assert.equal(nohd.limiting, "retinalThermal");
  assertRel(nohd.distance, 237.47, 1e-4, "NOHD");
  assert.ok(nohd.distance < farField && nohd.distance > 0.99 * farField);
});

test("edge: a beam already within every limit at the aperture has NOHD 0", () => {
  const nohd = nominalOcularHazardDistance(1550e-9, 1e-3, roundBeam(10e-3, 0.5e-3), 10);
  assert.equal(nohd.distance, 0);
  assert.equal(nohd.limiting, null);
});
