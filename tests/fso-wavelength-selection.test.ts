import test from "node:test";
import assert from "node:assert/strict";

import {
  CANDIDATES, atmosphereScore, eyeSafetyScore, scoreWavelengths,
} from "../src/physics/free-space-comms/wavelength-selection";

const close = (actual: number, expected: number, rel: number, msg = "") =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg} ${actual} vs ${expected}`);
const W = { eyeSafety: 0.3, atmosphere: 0.35, components: 0.2, cost: 0.15 };

test("1550 nm over 1 km at V = 2 km loses 4.263 dB (Kim q = 0.66, hand)", () => {
  // (3.91202/2 − 0.01150) · 2.81818^−0.66 = 1.94451 · 0.50466 = 0.98132, + σ_R 1.8e-4 → 0.98150 km⁻¹ × 4.34294.
  const s = scoreWavelengths(1000, 2000, W).find((x) => x.lambda === 1550e-9)!;
  close(s.lossDb, 4.2626, 5e-4);
  close(s.atmosphere, 100 - 5 * 4.2626, 1e-3);
});

test("Class 1 CW point-source limits (IEC 60825-1:2014) and the eye-safety order", () => {
  const [s850, s1064, s1310, s1550] = scoreWavelengths(1000, 2000, W);
  // 1550 nm: 1000 W/m² over the 3.5 mm stop = 9.621 mW.
  close(s1550.classOneLimit, 1000 * Math.PI * 3.5e-3 ** 2 / 4, 1e-3);
  // 1310 nm: 3.9e-4 · C4 (5) · C7 (8 + 10^(0.04·60) = 259.19) W = 0.505 W, capped at the
  // 0.5 W Class 3B limit; 0.499 W rebuilt from the MPE.
  close(s1310.classOneLimit, 0.505, 0.015);
  // The old page scored 1310 nm like 1064 nm (60); C7 puts it first.
  assert.ok(s1310.eyeSafety > s1550.eyeSafety && s1550.eyeSafety > s1064.eyeSafety && s1064.eyeSafety > s850.eyeSafety);
  close(eyeSafetyScore(1e-2), 50, 1e-12);
  assert.equal(eyeSafetyScore(1e-5), 0); // clamped
  assert.equal(atmosphereScore(25), 0);
});

test("the total is a weighted mean: scaling the weights changes nothing, unequal sums are normalised", () => {
  const a = scoreWavelengths(1000, 2000, W);
  const b = scoreWavelengths(1000, 2000, { eyeSafety: 0.6, atmosphere: 0.7, components: 0.4, cost: 0.3 });
  a.forEach((s, i) => close(b[i].total, s.total, 1e-12));
  const low = { ...W, eyeSafety: 0.05 }; // sums to 0.75; the old page let the total fall to 80 %
  const s = scoreWavelengths(1000, 2000, low)[0];
  close(s.total, (0.05 * s.eyeSafety + 0.35 * s.atmosphere + 0.2 * CANDIDATES[0].components + 0.15 * CANDIDATES[0].cost) / 0.75, 1e-12);
  assert.ok(scoreWavelengths(1000, 0, W).every((x) => Number.isNaN(x.total))); // V = 0
});
