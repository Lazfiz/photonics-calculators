import test from "node:test";
import assert from "node:assert/strict";

import { exposureLimit, eyeLimits, limitMaxPower } from "../src/physics/laser-safety/eye-exposure-limits";
import {
  diffuseExposure, diffuseHazardDistance, effectiveDiameterAt, lambertianIrradiance, lambertianSpotIrradiance, limitMaxIrradiance,
  limitSafeDiameter, nominalOcularHazardDistance, rangeToDiameter, requiredOpticalDensity, roundBeam,
} from "../src/physics/laser-safety/hazard-distance";

// Limits: ICNIRP, Health Phys. 105(3), 271–295 (2013), doi:10.1097/HP.0b013e3182983fd4, Table 5 (eye), Table 2 (C_E,
// eqn 5 for an open field of view), Table 8 (apertures). NOHD formula: ANSI Z136.1-2014 App. B and IEC TR 60825-14,
// NOHD = (1/φ)(√(4P/(πE)) − a) with 1/e values; OD = log10(H/EL) (ANSI Z136.1, EN 207). Diffuse: Lambertian
// ρP/(πr²); α from the 63 % (1/e) diameter (IEC 60825-1:2014 3.10); retinal limits from the 10 cm near point (ICNIRP p. 275).

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
  // Point-like spot, 532 nm, 5 W reflected, 0.25 s: r = √(ρP/(πE)) = 0.2500 m.
  const point = diffuseHazardDistance(532e-9, 5, 0, 0.25);
  assertRel(point.distance, Math.sqrt(5 / (Math.PI * E_VIS_025)), 1e-12, "point source");
  // 0.5 W gives 0.0791 m, nearer than the eye focuses: assessed at 10 cm, where 0.5/(π·0.01) = 15.9 W/m² < 25.5, none (the
  // anterior-segment limit still binds within millimetres).
  assert.equal(diffuseHazardDistance(532e-9, 0.5, 0, 0.25).limits.find((l) => l.kind === "retinalThermal")?.distance, 0);
  // 1064 nm, 120 W reflected from a 5 mm spot, 10 s. Hand: α = 3.536 mm / r; E_max = 90 C_E 10^−0.25 with
  // C_E = α/α_min (T₂ = 12.5 s > 10 s), so 120/(πr²) = 119.29/r: r = 0.3202 m (α = 11 mrad).
  const ext = diffuseHazardDistance(1064e-9, 120, 5e-3, 10);
  const k = 90 * Math.pow(10, -0.25) * (5e-3 / Math.SQRT2) / 1.5e-3;
  assertRel(ext.distance, 120 / (Math.PI * k), 1e-9, "extended source");
  const at = diffuseExposure(1064e-9, 120, 5e-3, ext.distance, 10);
  assertRel(at.limits[0].ratio, 1, 1e-9, "ratio 1 at the diffuse NOHD");
  // 0.5 W: no retinal hazard from 10 cm on. Only the anterior eye's 2 × skin limit (Table 5 note d),
  // E = 2 · 1.1×10⁴ C_A 10^0.25 J/m² / 10 s = 19 563 W/m², is exceeded, within millimetres: below the point range
  // √(ρP/(πE)) = 2.85 mm, as the spot's peak exitance is 8ρP/(πd²) = 50 930 W/m². Hand: at r = 1.8604 mm, x = 8r²/d²
  // = 1.1076, eˣE₁(x) = 0.5560 (A&S Table 5.1), F = x(1 − x eˣE₁) = 0.4255, E = 45 983 · 0.4255 = 19 566 W/m².
  const weak = diffuseHazardDistance(1064e-9, 0.5, 5e-3, 10);
  const eAnterior = (2 * 1.1e4 * 5 * Math.pow(10, 0.25)) / 10;
  assert.equal(weak.limits.find((l) => l.kind === "retinalThermal")?.distance, 0);
  assert.equal(weak.limiting, "anteriorSegment");
  assertRel(weak.distance, 1.8604e-3, 1e-4, "1.86 mm");
  assertRel(lambertianSpotIrradiance(0.5, 5e-3, weak.distance), eAnterior, 1e-9, "E = limit at the distance");
  // Nearer than 10 cm the retinal ratio is the one at 10 cm; the anterior-segment one keeps rising.
  const near = diffuseExposure(1064e-9, 0.5, 5e-3, 0.05, 10);
  const nearPoint = diffuseExposure(1064e-9, 0.5, 5e-3, 0.1, 10);
  assert.equal(near.limits[0].ratio, nearPoint.limits[0].ratio);
  assert.ok(near.limits[1].ratio > 3.9 * nearPoint.limits[1].ratio);
  // A 50 mm spot: above α_max (100 mrad from 0.25 s) C_E ∝ α² like the irradiance, so the ratio is flat with range.
  assertRel(diffuseExposure(1064e-9, 0.5, 50e-3, 0.15, 10).limits[0].ratio, diffuseExposure(1064e-9, 0.5, 50e-3, 0.3, 10).limits[0].ratio, 1e-12, "plateau");
});

test("Lambertian Gaussian spot: on-axis irradiance near and far", () => {
  // E = M₀ eˣE₂(x), M₀ = 8ρP/(πd²), x = 8r²/d². r = w = d/2: x = 2, 1 − 2e²E₁(2) = 1 − 2 · 0.3613286169 = 0.2773428
  // (A&S Table 5.1, E₁(2) = 0.04890051071).
  const d = 5e-3;
  const m0 = 8 / (Math.PI * d * d);
  assertRel(lambertianSpotIrradiance(1, d, d / 2) / m0, 1 - 2 * Math.exp(2) * 0.04890051071, 1e-9, "r = w");
  // r = 10 d: x = 800, F = 1 − 2/x + 6/x² − 24/x³ + 120/x⁴ = 0.99750933 of ρP/(πr²) (next term 2e-12).
  assertRel(lambertianSpotIrradiance(1, d, 10 * d) / lambertianIrradiance(1, 10 * d), 1 - 2 / 800 + 6 / 800 ** 2 - 24 / 800 ** 3 + 120 / 800 ** 4, 1e-11, "r = 10 d");
  // x = 1: F = 1 − e E₁(1) = 1 − 0.5963473623 (A&S Table 5.1).
  assertRel(lambertianSpotIrradiance(1, d, d / Math.sqrt(8)) / lambertianIrradiance(1, d / Math.sqrt(8)), 0.4036526377, 1e-9, "x = 1");
  // Edges: contact gives the peak exitance, a point spot gives ρP/(πr²), and the series meets 1 − x eˣE₁ at x = 50.
  assertRel(lambertianSpotIrradiance(1, d, 0), m0, 1e-15, "r = 0");
  assertRel(lambertianSpotIrradiance(1, 0, 0.3), lambertianIrradiance(1, 0.3), 1e-15, "d = 0");
  const r50 = Math.sqrt(50 / 8) * d;
  assertRel(lambertianSpotIrradiance(1, d, r50 * (1 - 1e-12)), lambertianSpotIrradiance(1, d, r50 * (1 + 1e-12)), 1e-10, "x = 50");
  assert.ok(Number.isNaN(lambertianSpotIrradiance(1, 0, 0)));
});

test("uniform-irradiance limit", () => {
  const thermal = eyeLimits(532e-9)[0];
  assertRel(limitMaxIrradiance(thermal, 0.25), E_VIS_025, 1e-12, "18 t^−0.25");
  // From 10 s: 10 W/m², below the 18 × 10^−0.25 = 10.12 W/m² just before.
  assert.equal(limitMaxIrradiance(thermal, 100), 10);
  assertRel(limitMaxIrradiance(thermal, 10), Math.min(10, exposureLimit(thermal, 9.999999) / 9.999999), 1e-6, "joint");
});

test("OD with ICNIRP Table 5 note c: a beam under 1 mm for under 0.35 s counts by its peak", () => {
  // 10 W at 10.6 µm in a 0.2 mm spot, 0.25 s: the peak radiant exposure 8Pt/(πd²) = 1.59 × 10⁸ J/m² against
  // 5.6 × 10³ t^0.25 = 3.96 × 10³ J/m² (Table 5): OD 4.604. The 1 mm average gives 2.905.
  const peak = (8 * 10 * 0.25) / (Math.PI * 4e-8);
  assertRel(requiredOpticalDensity(10.6e-6, 10, 0.2e-3, 0.25, { actualExposure: true }).od, Math.log10(peak / (5.6e3 * Math.pow(0.25, 0.25))), 1e-9, "note c");
  assertRel(requiredOpticalDensity(10.6e-6, 10, 0.2e-3, 0.25).od, 2.9051770981, 1e-9, "aperture average");
  // Not applied from 0.35 s, nor to a beam of 1 mm or more.
  assert.equal(requiredOpticalDensity(10.6e-6, 10, 0.2e-3, 0.5, { actualExposure: true }).od, requiredOpticalDensity(10.6e-6, 10, 0.2e-3, 0.5).od);
  assert.equal(requiredOpticalDensity(10.6e-6, 10, 2e-3, 0.25, { actualExposure: true }).od, requiredOpticalDensity(10.6e-6, 10, 2e-3, 0.25).od);
  // The 1 mm is the 1/e diameter (ICNIRP p. 288): a 1.2 mm 1/e² beam (d₆₃ 0.85 mm) counts by its peak, raised over the
  // 1 mm average by 2(D/d)²/(1 − exp(−2D²/d²)) = 1.3889/0.7512 = 1.849 (OD + 0.267); a 1.5 mm one (d₆₃ 1.06 mm) doesn't.
  const od12 = (opts = {}) => requiredOpticalDensity(1550e-9, 1, 1.2e-3, 0.25, opts).od;
  assertRel(od12({ actualExposure: true }) - od12(), Math.log10(2 / 1.44 / (1 - Math.exp(-2 / 1.44))), 1e-9, "d₆₃ < 1 mm");
  assert.equal(requiredOpticalDensity(1550e-9, 1, 1.5e-3, 0.25, { actualExposure: true }).od, requiredOpticalDensity(1550e-9, 1, 1.5e-3, 0.25).od);
});
