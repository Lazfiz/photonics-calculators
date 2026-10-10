import test from "node:test";
import assert from "node:assert/strict";

import { exposureLimit, eyeLimits, limitMaxPower } from "../src/physics/laser-safety/eye-exposure-limits";
import {
  diffuseExposure, diffuseHazardDistance, effectiveDiameterAt, lambertianIrradiance, limitMaxIrradiance,
  limitSafeDiameter, nominalOcularHazardDistance, rangeToDiameter, requiredOpticalDensity, roundBeam,
} from "../src/physics/laser-safety/hazard-distance";

// Limits: ICNIRP, Health Phys. 105(3), 271–295 (2013), doi:10.1097/HP.0b013e3182983fd4, Table 5 (eye), Table 2 (C_E,
// eqn 5 for an open field of view), Table 8 (apertures). NOHD formula: ANSI Z136.1-2014 App. B and IEC TR 60825-14,
// NOHD = (1/φ)(√(4P/(πE)) − a) with 1/e values; OD = log10(H/EL) (ANSI Z136.1, EN 207). Diffuse: Lambertian
// ρP/(πr²); α from the 63 % (1/e) diameter (IEC 60825-1:2014 3.10).

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// 400–700 nm, 0.25 s: 18 t^0.75 J/m² over t, 25.456 W/m² (2.546 mW/cm²).
const E_VIS_025 = 18 * Math.pow(0.25, -0.25);

test("safe diameter inverts limitMaxPower and tends to the standards' √(8P/(πE))", () => {
  const thermal = eyeLimits(532e-9)[0];
  const d = limitSafeDiameter(thermal, 1, 0.25);
  assertRel(limitMaxPower(thermal, d, 0.25), 1, 1e-12, "P_max at the safe diameter is P");
  // Hand calculation: 1 W over the 7 mm aperture is within the limit while 1 − exp(−2D²/d²) ≤ q = E·πD²/(4P).
  const q = (E_VIS_025 * Math.PI * 49e-6) / 4;
  assertRel(d, 7e-3 * Math.sqrt(2 / -Math.log(1 - q)), 1e-12, "closed form");
  // d ≫ D: the 1/e² diameter where the peak 8P/(πd²) equals E; the aperture average lowers it by ≈ q/4.
  assertRel(d, Math.sqrt(8 / (Math.PI * E_VIS_025)), 5e-4, "large-beam limit");
  assert.equal(limitSafeDiameter(thermal, 1e-4, 0.25), 0, "0.1 mW is within the limit even through the aperture");
  // 1.5× the power that is safe with all of it inside 7 mm (q = 2/3): the beam must spread a little.
  const p0 = limitMaxPower(thermal, 0, 0.25);
  const dJust = limitSafeDiameter(thermal, 1.5 * p0, 0.25);
  assertRel(dJust, 7e-3 * Math.sqrt(2 / Math.log(3)), 1e-12, "1 − exp(−2D²/d²) = 2/3");
  assertRel(limitMaxPower(thermal, dJust, 0.25), 1.5 * p0, 1e-12, "inverse near the aperture");
  assert.ok(Number.isNaN(limitSafeDiameter(thermal, 1, 1e5)), "t beyond 30 ks");
});

test("NOHD of a round beam: linear and Gaussian spread", () => {
  // 532 nm, 1 W, 1 mm, 1 mrad (1/e²), 0.25 s. Standards (1/e values a/√2, φ/√2): (√(4P/(πE)) − a)/φ = 315.28 m.
  const standard = (Math.sqrt(4 / (Math.PI * E_VIS_025)) - 1e-3 / Math.SQRT2) / (1e-3 / Math.SQRT2);
  const n = nominalOcularHazardDistance(532e-9, 1, roundBeam(1e-3, 1e-3), 0.25);
  assertRel(standard, 315.28, 1e-4, "standard formula");
  assertRel(n.distance, standard, 5e-4, "NOHD vs the standard formula");
  assertRel(n.distance, 315.206, 1e-5, "pinned");
  assert.equal(n.limiting, "retinalThermal");
  // The nohd page's defaults (100 mW, 2 mm, 1 mrad): 97.77 m (98.02 m with the peak irradiance).
  const d = limitSafeDiameter(eyeLimits(532e-9)[0], 0.1, 0.25);
  const linear = nominalOcularHazardDistance(532e-9, 0.1, roundBeam(2e-3, 1e-3), 0.25).distance;
  assertRel(linear, (d - 2e-3) / 1e-3, 1e-12, "linear: (d − a)/φ");
  assertRel(linear, 97.772, 1e-5, "pinned");
  // A Gaussian beam with its waist at the aperture: √(a² + (rφ)²) = d gives r = √(d² − a²)/φ, a little farther.
  const gaussian = nominalOcularHazardDistance(532e-9, 0.1, roundBeam(2e-3, 1e-3, "gaussian"), 0.25).distance;
  assertRel(gaussian, Math.sqrt(d * d - 4e-6) / 1e-3, 1e-12, "Gaussian");
  assertRel(gaussian, 99.752, 1e-5, "pinned");
  assertRel(effectiveDiameterAt(roundBeam(2e-3, 1e-3, "gaussian"), gaussian), d, 1e-12, "√(a² + (rφ)²) = d there");
});

test("NOHD of an elliptical diode beam and of a CO₂ beam on the cornea", () => {
  // 808 nm, 0.5 W, 1 mm, φ = 10 × 30 mrad, 0.25 s. (a + 0.01r)(a + 0.03r) = d² solved by the quadratic formula.
  const beam = { d: [1e-3, 1e-3], phi: [10e-3, 30e-3], growth: "linear" } as const;
  const n = nominalOcularHazardDistance(808e-9, 0.5, beam, 0.25);
  const d = limitSafeDiameter(eyeLimits(808e-9)[0], 0.5, 0.25);
  const [A, B, C] = [3e-4, 4e-5, 1e-6 - d * d];
  assertRel(n.distance, (-B + Math.sqrt(B * B - 4 * A * C)) / (2 * A), 1e-10, "quadratic root");
  assertRel(effectiveDiameterAt(beam, n.distance), d, 1e-12, "√(d_x d_y) = d there");
  // Hand: C_A = 10^0.216 = 1.644, E = 41.86 W/m², d ≈ √(8P/(πE)) = 0.1744 m, r ≈ 10.0 m.
  assertRel(n.distance, 9.9946, 1e-4, "pinned");
  // 10.6 µm, 10 W, 5 mm, 2 mrad, 10 s. Binding: the end of the 5.6×10³ t^0.25 piece at 10 s (995.8 W/m², aperture
  // 1.5 × 10^0.375 = 3.557 mm), just below the 1 kW/m² that follows: d = 0.15988 m, NOHD = (d − 5 mm)/2 mrad = 77.44 m.
  const co2 = nominalOcularHazardDistance(10.6e-6, 10, roundBeam(5e-3, 2e-3), 10);
  const D = 1.5e-3 * Math.pow(10, 0.375);
  const qq = (5.6e3 * Math.pow(10, 0.25) * Math.PI * D * D) / (4 * 10 * 10);
  assertRel(co2.distance, (D * Math.sqrt(2 / -Math.log(1 - qq)) - 5e-3) / 2e-3, 1e-12, "corneal hand calculation");
  assertRel(co2.distance, 77.435, 1e-5, "pinned");
  assert.equal(co2.limiting, "cornealIr");
});

test("NOHD edge cases", () => {
  assert.equal(rangeToDiameter(roundBeam(2e-3, 0), 0.1), Infinity, "a beam that doesn't spread");
  assert.equal(rangeToDiameter(roundBeam(2e-3, 1e-3), 1e-3), 0, "already wider");
  const weak = nominalOcularHazardDistance(532e-9, 1e-5, roundBeam(2e-3, 1e-3), 0.25);
  assert.equal(weak.distance, 0);
  assert.equal(weak.limiting, null);
  assert.ok(Number.isNaN(nominalOcularHazardDistance(100e-9, 1, roundBeam(2e-3, 1e-3), 1).distance), "below 180 nm");
  assert.ok(Number.isNaN(rangeToDiameter(roundBeam(-1, 1e-3), 0.1)), "negative diameter");
});

test("optical density: log10(P / P_max)", () => {
  // 532 nm, 1 W, 2 mm, 0.25 s: the whole beam enters 7 mm, so P_max = E·π(3.5 mm)² = 0.9797 mW and OD = 3.009 (the
  // shared CW suite's 2.598 W/cm² over 2.546 mW/cm²).
  const od = requiredOpticalDensity(532e-9, 1, 2e-3, 0.25);
  const pMax = (E_VIS_025 * Math.PI * 49e-6) / 4 / -Math.expm1(-2 * 49 / 4);
  assertRel(od.od, Math.log10(1 / pMax), 1e-12, "hand");
  assertRel(od.od, 3.0089, 1e-4, "pinned");
  assert.equal(od.limiting, "retinalThermal");
  assert.equal(requiredOpticalDensity(532e-9, 1e-5, 2e-3, 0.25).od, 0, "no filter needed");
});

test("diffuse reflection: Lambertian irradiance, open field of view", () => {
  assertRel(lambertianIrradiance(1, 1), 1 / Math.PI, 1e-15, "ρP/(πr²)");
  // Point-like spot, 532 nm, 0.5 W reflected, 0.25 s: r = √(ρP/(πE)) = 0.07907 m.
  const point = diffuseHazardDistance(532e-9, 0.5, 0, 0.25);
  assertRel(point.distance, Math.sqrt(0.5 / (Math.PI * E_VIS_025)), 1e-12, "point source");
  // 1064 nm, 120 W reflected from a 5 mm spot, 10 s. Hand: α = 3.536 mm / r; E_max = 90 C_E 10^−0.25 with
  // C_E = α/α_min (T₂ = 12.5 s > 10 s), so 120/(πr²) = 119.29/r: r = 0.3202 m (α = 11 mrad).
  const ext = diffuseHazardDistance(1064e-9, 120, 5e-3, 10);
  const k = 90 * Math.pow(10, -0.25) * (5e-3 / Math.SQRT2) / 1.5e-3;
  assertRel(ext.distance, 120 / (Math.PI * k), 1e-9, "extended source");
  const at = diffuseExposure(1064e-9, 120, 5e-3, ext.distance, 10);
  assertRel(at.limits[0].ratio, 1, 1e-9, "ratio 1 at the diffuse NOHD");
  // 0.5 W: above α_max the limit grows as α² like the irradiance; the ratio stays at 0.038, so no hazard at any range.
  const weak = diffuseHazardDistance(1064e-9, 0.5, 5e-3, 10);
  assert.equal(weak.distance, 0);
  assert.equal(weak.limiting, null);
  assertRel(diffuseExposure(1064e-9, 0.5, 5e-3, 5e-3, 10).limits[0].ratio, 0.0377, 2e-3, "plateau");
});

test("uniform-irradiance limit", () => {
  const thermal = eyeLimits(532e-9)[0];
  assertRel(limitMaxIrradiance(thermal, 0.25), E_VIS_025, 1e-12, "18 t^−0.25");
  // From 10 s: 10 W/m², below the 18 × 10^−0.25 = 10.12 W/m² just before.
  assert.equal(limitMaxIrradiance(thermal, 100), 10);
  assertRel(limitMaxIrradiance(thermal, 10), Math.min(10, exposureLimit(thermal, 9.999999) / 9.999999), 1e-6, "joint");
});
