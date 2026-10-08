import test from "node:test";
import assert from "node:assert/strict";

import {
  actinicUvWeight, blueLightSmallSourceMaxDuration, blueLightSmallSourceRiskGroup, blueLightWeight,
  uvExposureFraction, uvHazard, uvLaserCornealMpe, uvLaserMaxDuration, uvMaxIrradiance,
} from "../src/physics/laser-safety/hazard-weighting";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const nm = (x: number) => x * 1e-9;

test("S(λ) reproduces ICNIRP 2004 Table 1 and its 30 J/m² / EL column", () => {
  // Health Phys. 87(2), 171 (2004), Table 1: [nm, EL (J/m²), S].
  const rows: [number, number, number][] = [
    [180, 2500, 0.012], [200, 1000, 0.030], [254, 60, 0.500], [270, 30, 1.000],
    [280, 34, 0.880], [297, 65, 0.460], [300, 100, 0.300], [305, 500, 0.060], [313, 5000, 0.006],
    [320, 2.9e4, 0.0010], [365, 2.7e5, 0.00011], [400, 1.0e6, 0.000030],
  ];
  for (const [l, el, s] of rows) {
    assertRel(actinicUvWeight(nm(l)), s, 1e-12, `S(${l} nm)`);
    // The table's own consistency: EL = 30 J/m² / S, within the rounding of its two significant figures.
    assertRel(30 / el, s, 0.05, `30/EL at ${l} nm`);
  }
  // Edges: S is defined only on 180–400 nm.
  assert.equal(actinicUvWeight(nm(179.9)), 0);
  assert.equal(actinicUvWeight(nm(400.1)), 0);
  assert.ok(Number.isNaN(actinicUvWeight(NaN)));
});

test("S(λ) between table points agrees with ICNIRP 2004 eqns 2a–c (Wester 2000)", () => {
  // 2a: 0.959^(270−λ), 210–270 nm; 2b: 1 − 0.36((λ−270)/20)^1.64, 270–300 nm;
  // 2c: 0.3·0.736^(λ−300) + 10^(2−0.0163λ), 300–400 nm. "Reasonable accuracy" per ICNIRP; 3 % here.
  const wester = (l: number) =>
    l <= 270 ? Math.pow(0.959, 270 - l)
      : l <= 300 ? 1 - 0.36 * Math.pow((l - 270) / 20, 1.64)
        : 0.3 * Math.pow(0.736, l - 300) + Math.pow(10, 2 - 0.0163 * l);
  for (const l of [222, 287, 302, 342, 372]) assertRel(actinicUvWeight(nm(l)), wester(l), 0.03, `S(${l} nm)`);
});

test("UV hazard: actinic time, UVA time, the governing limit and the inverse", () => {
  // 300 nm, 1 W/m²: E_eff = 0.3 W/m², t = 30/0.3 = 100 s. (The old page used S = 0.03 and showed 1000 s.)
  const h300 = uvHazard(nm(300), 1);
  assertRel(h300.E_eff, 0.3, 1e-12, "E_eff at 300 nm");
  assertRel(h300.tMax, 100, 1e-12, "t_max at 300 nm");
  assert.equal(h300.tUva, Infinity);
  // 254 nm, 10 mW/cm² = 100 W/m²: t = 30 / 50 = 0.6 s.
  assertRel(uvHazard(nm(254), 100).tMax, 0.6, 1e-12, "t_max at 254 nm");
  // 365 nm, 1 mW/cm² = 10 W/m²: actinic 30/(10·1.1e-4) = 27 273 s, UVA 10⁴/10 = 1000 s governs.
  const h365 = uvHazard(nm(365), 10);
  assertRel(h365.tActinic, 30 / 1.1e-3, 1e-12, "actinic t at 365 nm");
  assertRel(h365.tMax, 1000, 1e-12, "UVA t_max at 365 nm");
  // Fraction of the limit and the max irradiance are the same limits seen from the other side.
  assertRel(uvExposureFraction(nm(365), 10, 1000), 1, 1e-12, "fraction at t_max");
  assertRel(uvExposureFraction(nm(300), 1, 50), 0.5, 1e-12, "fraction at t_max/2");
  assertRel(uvMaxIrradiance(nm(365), 1000), 10, 1e-12, "E_max(365 nm, 1000 s)");
  assertRel(uvMaxIrradiance(nm(254), 0.6), 100, 1e-12, "E_max(254 nm, 0.6 s)");
  // Edges: no exposure never reaches a limit; negative irradiance is invalid.
  assert.equal(uvHazard(nm(254), 0).tMax, Infinity);
  assert.ok(Number.isNaN(uvHazard(nm(254), -1).tMax));
});

test("B(λ) reproduces ICNIRP 2013 Table 2 and the 10^((450−λ)/50) tail", () => {
  // Health Phys. 105(1), 74 (2013), Table 2; IEC 62471:2006 Table 4.2 for 500–600 nm.
  const rows: [number, number][] = [
    [300, 0.01], [350, 0.01], [385, 0.0125], [400, 0.1], [435, 1], [450, 0.94], [480, 0.45], [500, 0.1],
    [532, Math.pow(10, -1.64)], [560, Math.pow(10, -2.2)], [600, 0.001], [650, 0.001], [700, 0.001],
  ];
  for (const [l, b] of rows) assertRel(blueLightWeight(nm(l)), b, 1e-12, `B(${l} nm)`);
  // The ICNIRP table lists the tail rounded: 530 nm → 0.025, 560 nm → 0.006.
  assertRel(blueLightWeight(nm(530)), 0.025, 0.01, "B(530 nm) vs table");
  assertRel(blueLightWeight(nm(560)), 0.006, 0.06, "B(560 nm) vs table");
  assert.equal(blueLightWeight(nm(299)), 0);
  assert.equal(blueLightWeight(nm(701)), 0);
});

test("Blue light, small source: limits and IEC 62471 risk groups", () => {
  // 1 mW over a 2 mm beam at 560 nm: E = 1e-3 / (π·(1 mm)²) = 318.31 W/m², E_B = E·10^(−2.2) = 2.008 W/m².
  // Above 1 W/m², so RG2 and t_max = 100 J/m² / E_B = 49.8 s. (The old page said "Exempt".)
  const E = 1e-3 / (Math.PI * 1e-6);
  const EB = E * blueLightWeight(nm(560));
  assertRel(EB, 2.00838, 1e-5, "E_B");
  assert.equal(blueLightSmallSourceRiskGroup(EB), "RG2");
  assertRel(blueLightSmallSourceMaxDuration(EB), 100 / 2.00838, 1e-5, "t_max");
  // 1 W over 2 mm at 450 nm: E_B = 2.992e5 W/m², RG3, t_max = 0.33 ms.
  assert.equal(blueLightSmallSourceRiskGroup((1 / (Math.PI * 1e-6)) * 0.94), "RG3");
  // Boundaries, IEC 62471:2006 Table 6.1: Exempt ≤ 1 W/m², RG2 ≤ 400 W/m².
  assert.equal(blueLightSmallSourceRiskGroup(1), "Exempt");
  assert.equal(blueLightSmallSourceRiskGroup(1.0001), "RG2");
  assert.equal(blueLightSmallSourceRiskGroup(400), "RG2");
  assert.equal(blueLightSmallSourceRiskGroup(400.01), "RG3");
  assert.equal(blueLightSmallSourceMaxDuration(1), Infinity);
  assertRel(blueLightSmallSourceMaxDuration(400), 0.25, 1e-12, "t_max at the RG2 limit");
});

test("UV laser MPE at the cornea, IEC 60825-1:2014 Table A.1", () => {
  assert.equal(uvLaserCornealMpe(nm(254), 1), 30);
  // 310 nm: C₂ = 10^(0.2·15) = 1000 J/m², T₁ = 10^(0.8·15)·1e-15 = 1 ms; C₁(1 µs) = 5.6e3·10^(−1.5) = 177.1 J/m².
  assertRel(uvLaserCornealMpe(nm(310), 1e-6), 5.6e3 * Math.pow(10, -1.5), 1e-12, "C₁ at 310 nm, 1 µs");
  assertRel(uvLaserCornealMpe(nm(310), 1), 1000, 1e-12, "C₂ at 310 nm");
  // 350 nm: C₁ to 10 s, 10⁴ J/m² to 1000 s, then 10 W/m² (ANSI Z136.1: 0.56 t^0.25 J/cm², 1 J/cm², 1 mW/cm²).
  assertRel(uvLaserCornealMpe(nm(350), 1), 5600, 1e-12, "350 nm, 1 s");
  assert.equal(uvLaserCornealMpe(nm(350), 100), 1e4);
  assert.equal(uvLaserCornealMpe(nm(350), 1e4), 1e5);
  // Max duration: E·t = MPE(t).
  assertRel(uvLaserMaxDuration(nm(254), 100), 0.3, 1e-12, "254 nm, 100 W/m²");
  assertRel(uvLaserMaxDuration(nm(350), 1e3), Math.pow(5.6, 4 / 3), 1e-12, "350 nm, 1 kW/m² (C₁)");
  assertRel(uvLaserMaxDuration(nm(350), 100), 100, 1e-12, "350 nm, 100 W/m² (10⁴ J/m²)");
  assertRel(uvLaserMaxDuration(nm(310), 1e4), 0.1, 1e-12, "310 nm, 10 kW/m² (C₂)");
  assertRel(uvLaserMaxDuration(nm(310), 10), 100, 1e-12, "310 nm, 10 W/m²");
  for (const [l, E] of [[254, 100], [310, 1e4], [350, 1e3], [350, 100]]) {
    const t = uvLaserMaxDuration(nm(l), E);
    assertRel(E * t, uvLaserCornealMpe(nm(l), t), 1e-9, `E·t = MPE at ${l} nm`);
  }
  // Edges: within the MPE for the whole 3×10⁴ s, or outside the table.
  assert.equal(uvLaserMaxDuration(nm(350), 5), Infinity);
  assert.equal(uvLaserMaxDuration(nm(254), 1e-4), Infinity);
  assert.ok(Number.isNaN(uvLaserCornealMpe(nm(179), 1)));
  assert.ok(Number.isNaN(uvLaserCornealMpe(nm(254), 4e4)));
  assert.ok(Number.isNaN(uvLaserMaxDuration(nm(254), 1e12)));
});
