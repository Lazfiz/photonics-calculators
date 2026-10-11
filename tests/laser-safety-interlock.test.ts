import test from "node:test";
import assert from "node:assert/strict";

import { interlockTiming } from "../src/physics/laser-safety/interlock";

// ICNIRP, Health Phys. 105(3), 271–295 (2013), doi:10.1097/HP.0b013e3182983fd4, Table 5: retinal thermal limit at
// 1050–1400 nm, 10 ps – 13 µs, 20 C_C C_E mJ/m² over the 7 mm aperture (C_C = 1 at 1064 nm). ISO 13855:2010:
// separation distance S = K·T with the approach speed K. Expected values are hand calculations.

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// 5 W at 1064 nm in a 5 mm beam: E = P(1 − exp(−2·7²/5²)) / (π·3.5² mm²) = 1.2734×10⁵ W/m² over 7 mm, so the
// 0.02 J/m² limit is reached after 157.1 ns.
const E = (5 * -Math.expm1((-2 * 49) / 25)) / (Math.PI * 3.5e-3 * 3.5e-3);
const tMax = 0.02 / E;

test("Nd:YAG behind a guard: the hand arrives after the emission stops", () => {
  // 50 cm at 2 m/s: 250 ms; a 50 ms interlock leaves no exposure.
  const r = interlockTiming(1064e-9, 5, 5e-3, 0.05, 0.5, 2);
  assertRel(r.tMax, tMax, 1e-9, "t_max");
  assertRel(r.tMax, 1.5705e-7, 1e-4, "t_max = 157 ns");
  assert.equal(r.limiting, "retinalThermal");
  assertRel(r.accessTime, 0.25, 1e-12, "S/K");
  assert.equal(r.exposure, 0);
  assert.equal(r.within, true);
  assertRel(r.latestStop, 0.25 + tMax, 1e-12, "latest stop");
  // ISO 13855's S = K·T, less the 157 ns the eye may spend in the beam: 10 cm.
  assertRel(r.minDistance, 2 * (0.05 - tMax), 1e-12, "min distance");
});

test("the beam just behind the opening", () => {
  // 5 cm at 2 m/s: 25 ms; with a 50 ms interlock the eye is in the beam for 25 ms ≫ 157 ns.
  const r = interlockTiming(1064e-9, 5, 5e-3, 0.05, 0.05, 2);
  assertRel(r.exposure, 0.025, 1e-12, "exposure");
  assert.equal(r.within, false);
  assertRel(r.latestStop, 0.025 + tMax, 1e-12, "latest stop");
});

test("edge cases: a beam within the limits for 30 ks, one exceeding them within 1 ns, bad input", () => {
  // 0.1 mW at 532 nm: below 10 W/m² over 7 mm (0.39 mW) and the photochemical limit; never exceeded.
  const low = interlockTiming(532e-9, 1e-4, 1e-3, 1, 0, 2);
  assert.equal(low.tMax, Infinity);
  assert.equal(low.within, true);
  assert.equal(low.latestStop, Infinity);
  assert.equal(low.minDistance, 0);
  // 1 kW in 1 mm at 1064 nm: 0.02 J/m² is reached in 0.77 ns, under the tables' 1 ns: t_max counts as 0.
  const high = interlockTiming(1064e-9, 1000, 1e-3, 0.01, 0.1, 2);
  assert.ok(Number.isNaN(high.tMax));
  assert.equal(high.limiting, "retinalThermal");
  assertRel(high.latestStop, 0.05, 1e-12, "latest stop = S/K");
  assertRel(high.minDistance, 0.02, 1e-12, "S = K·T");
  assert.equal(high.within, true);
  assert.equal(interlockTiming(1064e-9, 1000, 1e-3, 0.1, 0.1, 2).within, false);
  assert.ok(Number.isNaN(interlockTiming(1064e-9, 5, 5e-3, 0.05, 0.5, 0).accessTime));
  assert.ok(Number.isNaN(interlockTiming(100e-9, 5, 5e-3, 0.05, 0.5, 2).accessTime));
});
