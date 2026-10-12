import test from "node:test";
import assert from "node:assert/strict";

import {
  WATER_DN_DT, WATER_INDEX_1550, cavityReflectance, evanescentDecay, freeSpectralRange, penetrationDepth,
  penetrationDepthSensitivity,
} from "../src/physics/fiber-optics/fiber-sensors";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

test("extrinsic Fabry-Pérot cavity: FSR and Airy reflectance (Born & Wolf §7.6.1)", () => {
  // Air gap 20 µm at 1550 nm: FSR = (1550e-9)²/(2·20e-6) = 60.0625 nm.
  assertRel(freeSpectralRange(1550e-9, 1, 20e-6), 60.0625e-9, 1e-12, "FSR");
  // Bare silica ends, R = 0.033: F = 4·0.033/0.967² = 0.141163; peak R = F/(1 + F) = 0.123701 at δ/2 = π/2.
  const quarter = 1550e-9 / 4; // n·d = λ/4 → δ/2 = π/2
  assertRel(cavityReflectance(1550e-9, 1, quarter, 0.033), 0.123701, 1e-5, "peak");
  // Independent amplitude form: summing the multiple reflections (Stokes relations, lossless mirrors of amplitude
  // reflectance ρ = √R) gives r = ρ(1 − e^{iδ})/(1 − ρ²e^{iδ}).
  for (const d of [20e-6, 20.1e-6, 20.2e-6]) {
    const rho = Math.sqrt(0.033), delta = (4 * Math.PI * d) / 1550e-9;
    const nr = rho * (1 - Math.cos(delta)), ni = -rho * Math.sin(delta);
    const dr = 1 - rho * rho * Math.cos(delta), di = -rho * rho * Math.sin(delta);
    const amp = (nr * nr + ni * ni) / (dr * dr + di * di);
    assertRel(cavityReflectance(1550e-9, 1, d, 0.033), amp, 1e-9, `amplitude sum at ${d}`);
  }
  // At resonance (nd = mλ/2) the reflection vanishes; out of range mirror reflectance gives NaN.
  assert.ok(cavityReflectance(1550e-9, 1, 1550e-9 * 10, 0.033) < 1e-20);
  assert.ok(Number.isNaN(cavityReflectance(1550e-9, 1, 20e-6, 1)));
});

test("evanescent field: decay constant and penetration depth (Harrick ch. 2)", () => {
  // n_eff 1.447 against water 1.318 at 1550 nm: √(1.447² − 1.318²) = √0.356685 = 0.597231;
  // γ = 2π·0.597231/1550e-9 = 2.42099e6 1/m, d_p = 413.05 nm.
  assertRel(evanescentDecay(1550e-9, 1.447, WATER_INDEX_1550), 2.42099e6, 1e-5, "γ");
  assertRel(penetrationDepth(1550e-9, 1.447, WATER_INDEX_1550), 413.054e-9, 1e-5, "d_p");
  // d(d_p)/dn = 413.054 nm·1.318/0.356685 = 1526.3 nm/RIU; checked by a central difference.
  const h = 1e-6;
  const numeric = (penetrationDepth(1550e-9, 1.447, 1.318 + h) - penetrationDepth(1550e-9, 1.447, 1.318 - h)) / (2 * h);
  assertRel(penetrationDepthSensitivity(1550e-9, 1.447, 1.318), numeric, 1e-6, "sensitivity");
  assertRel(penetrationDepthSensitivity(1550e-9, 1.447, 1.318), 1526.3e-9, 1e-4, "sensitivity value");
  // Not guided: NaN, not a fake depth.
  assert.ok(Number.isNaN(penetrationDepth(1550e-9, 1.447, 1.447)));
  assert.ok(Number.isNaN(penetrationDepth(1550e-9, 1.4, 1.5)));
});

test("water index falls with temperature", () => {
  // Sodium-D indices of water, 1.33299 at 20 °C and 1.33250 at 25 °C (Thormählen et al. 1985 tables): −0.98e-4 /K.
  // The old page had +1e-3 /K.
  assert.ok(WATER_DN_DT < 0);
  assertRel(WATER_DN_DT, (1.3325 - 1.33299) / 5, 0.03, "dn/dT");
});
