import test from "node:test";
import assert from "node:assert/strict";

import { eyeLimits, exposureLimit, limitingAperture, limitMaxPower } from "../src/physics/laser-safety/eye-exposure-limits";
import { skinLimit, type SkinLimit } from "../src/physics/laser-safety/skin-exposure-limits";

// Limits: ICNIRP, Health Phys. 105(3), 271–295 (2013), doi:10.1097/HP.0b013e3182983fd4, Table 7 (skin) and Table 8.

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const nm = (x: number) => x * 1e-9;
const skin = (l: number, A = 0): SkinLimit => {
  const s = skinLimit(nm(l), A);
  assert.ok(s, `no skin limit at ${l} nm`);
  return s;
};

test("400–1400 nm: Table 7's three pieces with C_A", () => {
  assertRel(exposureLimit(skin(800), 1e-8), 200 * Math.pow(10, 0.2), 1e-12, "800 nm, 10 ns: 200 C_A J/m²");
  assertRel(exposureLimit(skin(532), 1), 1.1e4, 1e-12, "532 nm, 1 s: 1.1 J/cm²");
  assertRel(exposureLimit(skin(532), 5e-7), 1.1e4 * Math.pow(5e-7, 0.25), 1e-12, "532 nm, 0.5 µs: 293 J/m²");
  assertRel(exposureLimit(skin(1064), 100) / 100, 1e4, 1e-12, "1064 nm CW: 2 C_A kW/m² = 1 W/cm²");
  assertRel(exposureLimit(skin(1064), 1e-3), 1.1e4 * 5 * Math.pow(1e-3, 0.25), 1e-12, "1064 nm, 1 ms");
  // The rounded joints step by 2 % (1.1e4 · (100 ns)^0.25 = 196 vs 200; 1.1e4 · 10^0.25 = 19.6 kJ/m² vs 20).
  for (const t of [1e-7, 10]) {
    assertRel(exposureLimit(skin(650), t), exposureLimit(skin(650), t * (1 - 1e-12)), 0.025, `joint at ${t} s`);
  }
  // The anterior eye limit is twice this one (Table 5 note d).
  const anterior = eyeLimits(nm(1300)).find((l) => l.kind === "anteriorSegment");
  assert.ok(anterior);
  for (const t of [1e-8, 1, 100]) assertRel(exposureLimit(anterior, t), 2 * exposureLimit(skin(1300), t), 1e-12, `2 × skin at ${t} s`);
});

test("UV and far IR: the eye limit, but over 3.5 mm at every duration (Table 8)", () => {
  // The old skin-mpe page: 0.003 t^0.75 J/cm² at 250 nm, 30 ks = 68 kJ/m², 2300 × ICNIRP's 30 J/m².
  assertRel(exposureLimit(skin(250), 3e4), 30, 1e-12, "250 nm, 30 ks");
  assertRel(exposureLimit(skin(310), 1e-3), 5.6e3 * Math.pow(1e-3, 0.25), 1e-12, "310 nm, 1 ms: 'not to exceed' law");
  assertRel(exposureLimit(skin(310), 100), 1.6e3, 1e-12, "310 nm step");
  assertRel(exposureLimit(skin(1550), 1), 1e4, 1e-12, "1550 nm, 1 s: 1 J/cm²");
  assertRel(exposureLimit(skin(1450), 1), 5.6e3, 1e-12, "1450 nm, 1 s: 5.6 t^0.25 kJ/m², not 1.1e4 C_A");
  assertRel(exposureLimit(skin(1399), 1), 5.5e4, 1e-12, "1399 nm: 1.1e4 C_A with C_A = 5");
  assertRel(exposureLimit(skin(10600), 1), 5.6e3, 1e-12, "10.6 µm, 1 s: 5.6 t^0.25 kJ/m²");
  for (const l of [250, 350, 532, 1550, 10600]) {
    for (const t of [1e-6, 1, 100]) assert.equal(limitingAperture(skin(l), t), 3.5e-3, `${l} nm, ${t} s`);
  }
  assert.equal(limitingAperture(skin(5e5), 1), 11e-3, "500 µm");
  // Same limit as the eye's cornea, which averages over 1 mm at 1 ms instead of 3.5 mm.
  assert.deepEqual(skin(10600).pieces, eyeLimits(nm(10600))[0].pieces);
  assert.equal(limitingAperture(eyeLimits(nm(10600))[0], 1e-3), 1e-3);
});

test("large exposed area above 1400 nm beyond 10 s (Table 7 note c)", () => {
  assertRel(exposureLimit(skin(1550, 0.005), 100) / 100, 1000, 1e-12, "0.005 m²: no change");
  assertRel(exposureLimit(skin(1550, 0.05), 100) / 100, 200, 1e-12, "0.05 m²: 10/A W/m²");
  assertRel(exposureLimit(skin(10600, 0.2), 1000) / 1000, 100, 1e-12, "0.2 m²: 100 W/m²");
  assertRel(exposureLimit(skin(1550, 0.2), 5), 1e4, 1e-12, "below 10 s: unchanged");
  assertRel(exposureLimit(skin(1064, 0.2), 100) / 100, 1e4, 1e-12, "below 1400 nm: unchanged");
});

test("max power and edges", () => {
  // 1064 nm, 100 s, a beam much narrower than 3.5 mm. The CW piece alone allows 1e4 W/m² · π(3.5 mm)²/4 = 96.2 mW,
  // but the rounded t^0.25 piece just before 10 s is 2 % lower: 5.5e4 · 10^0.25 / 10 s = 9.78 kW/m², 94.1 mW.
  assertRel(limitMaxPower(skin(1064), 0, 100), 5.5e4 * Math.pow(10, 0.25) / 10 * Math.PI * 3.5e-3 ** 2 / 4, 1e-12, "94.1 mW");
  assertRel(limitMaxPower(skin(1064), 0, 5), 5.5e4 * Math.pow(5, -0.75) * Math.PI * 3.5e-3 ** 2 / 4, 1e-12, "5 s");
  assert.equal(skinLimit(nm(179)), null);
  assert.equal(skinLimit(1.1e-3), null);
  assert.equal(skinLimit(nm(1064), -1), null);
  assert.ok(skinLimit(1e-3), "1 mm is inside");
});
