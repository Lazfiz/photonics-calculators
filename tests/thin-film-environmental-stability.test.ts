import test from "node:test";
import assert from "node:assert/strict";

import {
  CC1246_AREA,
  accelerationFactor,
  cc1246Count,
  cc1246Obscuration,
  centreShift,
  filmIndex,
  poreIndex,
  solidIndex,
  wetIndex,
  type CoatingMaterial,
} from "../src/physics/thin-film/environmental-stability";

const assertRel = (actual: number, expected: number, tol: number, msg: string) =>
  assert.ok(Math.abs(actual - expected) <= tol * Math.abs(expected), `${msg}: ${actual} vs ${expected}`);

const FT2 = 0.09290304;

test("Moisture in pores: Macleod 1988 linear (eq. 3) and Bragg–Pippard (eq. 4) laws, n_v = 1 + 0.333 f (eq. 5)", () => {
  assertRel(poreIndex(1), 1.333, 1e-12, "water-filled pore");
  assert.equal(poreIndex(0), 1);
  // Linear, p = 0.85: Δn = (1 − p) f (n_w − 1) = 0.15 · 0.333 = 0.04995 (hand calculation).
  assertRel(wetIndex(1.45, 0.85, 1, "linear"), 1.49995, 1e-12, "SiO₂ linear, filled");
  assertRel(wetIndex(2.35, 0.85, 0.5, "linear"), 2.35 + 0.024975, 1e-12, "TiO₂ linear, half filled");
  // Bragg–Pippard, n = 2.35, p = 0.85: n_s² = (1.85·5.5225 − 0.15)/(1.85 − 0.15·5.5225) = 9.85355; with
  // n_v² = 1.776889: n² = (0.15·3.157334 + 1.85·9.85355·1.776889)/(1.85·1.776889 + 0.15·9.85355) = 6.896682.
  assertRel(solidIndex(2.35, 0.85, "bragg-pippard") ** 2, 9.85355, 1e-5, "BP solid index²");
  assertRel(wetIndex(2.35, 0.85, 1, "bragg-pippard"), Math.sqrt(6.896682), 1e-5, "BP filled");
  // Limits: a dense film (p = 1) doesn't move; both laws return the solid at p = 1 and the pore at p → 0.
  assert.equal(wetIndex(1.45, 1, 1, "linear"), 1.45);
  assertRel(wetIndex(2.35, 1, 1, "bragg-pippard"), 2.35, 1e-12, "BP dense");
  assertRel(filmIndex(2.5, 1.333, 1e-12, "bragg-pippard"), 1.333, 1e-9, "BP all pore");
  // Bragg–Pippard can't reach n² ≥ (1 + p)/(1 − p): 2.35² > 1.5/0.5 at p = 0.5.
  assert.ok(Number.isNaN(solidIndex(2.35, 0.5, "bragg-pippard")));
  assert.ok(Number.isNaN(solidIndex(0.9, 0.85, "linear")));
});

test("Quarter-wave stack band centre: λ₀(Σn′d′/Σnd − 1) for moisture and temperature (hand calculation)", () => {
  const H: CoatingMaterial = { n: 2.35, p: 0.85, law: "linear", dnDT: 20e-6, cte: 8e-6 };
  const L: CoatingMaterial = { n: 1.45, p: 0.85, law: "linear", dnDT: 12.9e-6, cte: 0.55e-6 };
  const lambda0 = 550e-9;
  // Filled pores: (2.39995/2.35 + 1.49995/1.45)/2 − 1 = 0.0278517 → 15.318 nm.
  assertRel(centreShift(H, L, lambda0, 0, 1), 550e-9 * ((2.39995 / 2.35 + 1.49995 / 1.45) / 2 - 1), 1e-12, "moisture");
  assertRel(centreShift(H, L, lambda0, 0, 1) * 1e9, 15.318, 1e-4, "moisture, nm");
  // ΔT = 50 K, dry: ((2.351/2.35)(1.0004) + (1.450645/1.45)(1.0000275))/2 − 1 = 6.4903e-4 → 0.35697 nm.
  const hand = ((2.351 / 2.35) * 1.0004 + (1.450645 / 1.45) * 1.0000275) / 2 - 1;
  assertRel(centreShift(H, L, lambda0, 50, 0), lambda0 * hand, 1e-9, "temperature");
  assertRel(centreShift(H, L, lambda0, 50, 0) * 1e9, 0.35697, 1e-4, "temperature, nm");
  assert.equal(centreShift(H, L, lambda0, 0, 0), 0);
});

test("CC1246 particles: counts from log N = 0.926(log²L − log²x), obscuration vs Ma, Fong & Lee 1990 eq. 17a", () => {
  assertRel(cc1246Count(1, 100), 10 ** (0.926 * 4), 1e-12, "level 100, ≥ 1 µm");
  assert.equal(cc1246Count(100, 100), 1);
  assert.equal(cc1246Count(150, 100), 0);
  // Ma et al. eq. 17a (spheres, per ft²): log₁₀(%Obs) = −7.245 + 0.926 log₁₀² L, a closed-form fit to this integral:
  // 12.27 % at level 1000 and 0.02736 % at level 300.
  const ma = (L: number) => 10 ** (-7.245 + 0.926 * Math.log10(L) ** 2) / 100;
  assertRel(cc1246Obscuration(1000, 1, FT2), ma(1000), 1e-3, "level 1000");
  assertRel(cc1246Obscuration(300, 1, FT2), ma(300), 5e-3, "level 300");
  // The 0.1 m² basis of CC1246D/E lowers the fraction by 0.0929.
  assertRel(cc1246Obscuration(300), cc1246Obscuration(300, 1, FT2) * FT2 / CC1246_AREA, 1e-12, "area basis");
  assert.equal(cc1246Obscuration(1), 0);
  assert.ok(Number.isNaN(cc1246Obscuration(0.5)));
});

test("Arrhenius–Peck acceleration factor (PR #155 golden value and hand calculation)", () => {
  // Eₐ = 0.7 eV, 25 °C use vs 85 °C test: exp(0.7/8.617333e-5 · (1/298.15 − 1/358.15)) = 96.0.
  assertRel(accelerationFactor(0.7, 298.15, 358.15), 96.0, 1e-3, "Arrhenius");
  // Peck humidity term, n = 3, 85 % vs 50 % RH: × 1.7³ = 4.913.
  assertRel(accelerationFactor(0.7, 298.15, 358.15, 50, 85, 3) / accelerationFactor(0.7, 298.15, 358.15), 4.913, 1e-12, "Peck");
  assert.equal(accelerationFactor(0, 298.15, 358.15), 1);
  assert.equal(accelerationFactor(0.7, 300, 300), 1);
  assert.ok(Number.isNaN(accelerationFactor(0.7, 0, 358.15)));
});
