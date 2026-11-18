import test from "node:test";
import assert from "node:assert/strict";

import { flickerSummary } from "../src/physics/detectors/flicker-noise";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// S_I = K_f·I^α/f (F. N. Hooge, Phys. Lett. A 29, 139, 1969, doi:10.1016/0375-9601(69)90076-0, SPICE KF/AF form):
// σ_1/f = √(K_f·I^α·ln(f_H/f_L)), f_c = K_f·I^α/(2qI); shot σ = √(2qI·Δf) (Schottky 1918). Hand-worked at
// K_f = 3e-10, I = 1 µA, α = 2, 1 Hz…1 MHz: √(3e-22·13.815511) = 6.437898e-11 A; f_c = 3e-16/(2q) = 936.2264 Hz.
test("flickerSummary: defaults", () => {
  const s = flickerSummary({ kf: 3e-10, current: 1e-6, alpha: 2, fLow: 1, fHigh: 1e6 });
  assertRel(s.flickerRms, 6.437898078868042e-11, 1e-9, "1/f");
  assertRel(s.shotRms, 5.66069789305765e-10, 1e-9, "shot");
  assertRel(s.totalRms, 5.697189302911239e-10, 1e-9, "total");
  assertRel(s.cornerFreq, 936.2263611691144, 1e-9, "corner");
});

test("flickerSummary: α = 1.5 corner, and an empty band gives NaN", () => {
  const s = flickerSummary({ kf: 2e-12, current: 1e-4, alpha: 1.5, fLow: 0.1, fHigh: 1e4 });
  assertRel(s.cornerFreq, 62415.09074460763, 1e-9, "corner"); // 2e-12·(1e-4)^0.5/(2q)
  const empty = flickerSummary({ kf: 3e-10, current: 1e-6, alpha: 2, fLow: 10, fHigh: 10 });
  assert.ok(Number.isNaN(empty.flickerRms) && Number.isNaN(empty.shotRms) && Number.isNaN(empty.totalRms));
});
