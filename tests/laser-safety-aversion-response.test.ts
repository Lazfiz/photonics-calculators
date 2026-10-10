import test from "node:test";
import assert from "node:assert/strict";

import {
  AVERSION_LAMBDA_MAX, AVERSION_LAMBDA_MIN, AVERSION_TIME, aversionLimit,
} from "../src/physics/laser-safety/aversion-response";

// Limits: ICNIRP, Health Phys. 105(3), 271–295 (2013), Tables 3, 5 and 8: 400–700 nm retinal thermal H = 18 t^0.75 J/m²
// (5 µs – 10 s, C_A = 1), then 10 W/m²; photochemical 100 C_B J/m² from 10 s at 400–600 nm; 7 mm aperture.
// IEC 60825-1: the Class 2 AEL is 1 mW (the 0.25 s limit, rounded). Numbers below are hand calculations.

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const nm = (x: number) => x * 1e-9;
const area7 = (Math.PI * 7e-3 ** 2) / 4;

test("632.8 nm, 0.25 s: H = 6.36396 J/m², E = 25.4558 W/m², 7 mm, P = 0.979656 mW", () => {
  const r = aversionLimit(nm(632.8), AVERSION_TIME);
  assert.ok(r);
  // 18·0.25^0.75 = 18/2^1.5 = 6.36396 J/m²; /0.25 s = 25.4558 W/m²; × π(3.5 mm)² = 3.84845e-5 m² → 0.979656 mW.
  assertRel(r.radiantExposure, 6.36396, 1e-6, "H");
  assertRel(r.irradiance, 25.4558, 1e-5, "E");
  assert.equal(r.aperture, 7e-3);
  assertRel(r.maxPower, 0.979656e-3, 1e-6, "P");
  // Class 2 AEL is 1 mW; the page's former beam-diameter bug used the 7 mm diameter as a radius: 4× too high.
  assertRel(r.maxPower, 1e-3, 0.025, "Class 2 AEL");
  assertRel(r.irradiance * Math.PI * 7e-3 ** 2, 4 * r.maxPower, 1e-12, "diameter as radius is 4×");
  assertRel(r.maxPower, r.irradiance * area7, 1e-12, "P = E·π(D/2)²");
});

test("the default time is 0.25 s, and 532 nm gives the same visible limit (C_A = 1)", () => {
  assert.equal(AVERSION_TIME, 0.25);
  const green = aversionLimit(nm(532));
  assert.ok(green);
  assertRel(green.maxPower, 0.979656e-3, 1e-6, "532 nm");
  assertRel(green.radiantExposure, 6.36396, 1e-6, "532 nm H");
  const edges = [aversionLimit(AVERSION_LAMBDA_MIN), aversionLimit(AVERSION_LAMBDA_MAX), aversionLimit(700 * 1e-9)];
  for (const e of edges) assertRel(e?.maxPower ?? NaN, 0.979656e-3, 1e-6, "400 and 700 nm");
});

test("outside 400–700 nm there is no aversion response: null", () => {
  for (const l of [800, 1064, 399.9, 700.1, 350, 1550]) assert.equal(aversionLimit(nm(l)), null, `${l} nm`);
  assert.equal(aversionLimit(NaN), null);
  assert.equal(aversionLimit(0), null);
});

test("other exposure times: the thermal limit scales as t^0.75, and at 10 s the photochemical limit joins at 450 nm", () => {
  // 18 t^0.75 / t · area: P ∝ t^−0.25. At 1 s: 18 J/m² → 18 W/m² → 0.692721 mW; at 0.01 s: 18·0.0316228/0.01 = 56.921 W/m².
  assertRel(aversionLimit(nm(550), 1)?.maxPower ?? NaN, 18 * area7, 1e-12, "1 s");
  assertRel(aversionLimit(nm(550), 0.01)?.irradiance ?? NaN, 18 * Math.pow(0.01, -0.25), 1e-12, "10 ms");
  // 450 nm, 10 s: thermal 10 W/m² × 10 s = 100 J/m² (from 10 s) and photochemical 100 C_B = 100 J/m² (C_B = 1): both 100.
  const r10 = aversionLimit(nm(450), 10);
  assert.ok(r10);
  assertRel(r10.radiantExposure, 100, 1e-12, "450 nm, 10 s");
  assertRel(r10.maxPower, 10 * area7, 1e-12, "10 W/m² over 7 mm");
  // 450 nm, 100 s: photochemical 100 J/m² (1 W/m²) is below the thermal 1000 J/m², so it sets the limit.
  assertRel(aversionLimit(nm(450), 100)?.radiantExposure ?? NaN, 100, 1e-12, "photochemical at 100 s");
  // 500 nm, 100 s: C_B = 10 → photochemical 1000 J/m² = thermal 1000 J/m².
  assertRel(aversionLimit(nm(500), 100)?.radiantExposure ?? NaN, 1000, 1e-9, "500 nm, 100 s");
});

test("edges: no limit defined at t gives null", () => {
  assert.equal(aversionLimit(nm(550), 0), null);
  assert.equal(aversionLimit(nm(550), -1), null);
  assert.equal(aversionLimit(nm(550), NaN), null);
  assert.equal(aversionLimit(nm(550), 1e-10), null, "below 1 ns");
  assert.equal(aversionLimit(nm(550), 4e4), null, "above 30 ks");
});
