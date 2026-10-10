import test from "node:test";
import assert from "node:assert/strict";

import { roundBeam } from "../src/physics/laser-safety/hazard-distance";
import { ICAO_LEVELS, peakIrradiance, rangeToIrradiance } from "../src/physics/laser-safety/visual-interference";

// Levels: ICAO Annex 11 and Doc 9815 (2003): 100 µW/cm², 5 µW/cm², 50 nW/cm². Range: the standards' NOHD form
// r = (√(4P/(πE)) − a)/φ with 1/e values (ANSI Z136.1, IEC TR 60825-14), here with 1/e² values: √(8P/(πE)).

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

test("ICAO levels in W/m²", () => {
  assert.equal(ICAO_LEVELS.sensitive, 100e-6 * 1e4);
  assertRel(ICAO_LEVELS.critical, 5e-6 * 1e4, 1e-12, "critical");
  assertRel(ICAO_LEVELS.laserFree, 50e-9 * 1e4, 1e-12, "laser-free");
});

test("5 mW green pointer, 1 mm, 1 mrad", () => {
  const P = 5e-3;
  const beam = roundBeam(1e-3, 1e-3);
  // Glare (5 µW/cm² = 0.05 W/m²): √(8 · 0.005 / (π · 0.05)) = 0.5046 m, less 1 mm, over 1 mrad: 503.6 m.
  assertRel(rangeToIrradiance(P, beam, ICAO_LEVELS.critical), (Math.sqrt(0.04 / (Math.PI * 0.05)) - 1e-3) / 1e-3, 1e-9, "glare");
  assertRel(rangeToIrradiance(P, beam, ICAO_LEVELS.critical), 503.6, 1e-3, "glare, value");
  // Distraction (50 nW/cm²): 10× farther in diameter, 5045 m.
  assertRel(rangeToIrradiance(P, beam, ICAO_LEVELS.laserFree), (Math.sqrt(0.04 / (Math.PI * 5e-4)) - 1e-3) / 1e-3, 1e-9, "distraction");
  // Peak irradiance at the output: 8P/(πd²) = 1.27×10⁴ W/m².
  assertRel(peakIrradiance(P, 1e-3), 0.04 / (Math.PI * 1e-6), 1e-12, "peak");
});

test("edges", () => {
  const beam = roundBeam(1e-3, 1e-3);
  assert.equal(rangeToIrradiance(0, beam, 1), 0, "no power");
  assert.equal(rangeToIrradiance(1e-3, roundBeam(1e-3, 0), 1), Infinity, "collimated beam never drops");
  assert.ok(Number.isNaN(rangeToIrradiance(1e-3, beam, 0)), "E = 0");
});
