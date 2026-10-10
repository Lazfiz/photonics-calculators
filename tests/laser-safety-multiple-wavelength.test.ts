import test from "node:test";
import assert from "node:assert/strict";

import { eyeLimits, limitMaxPower } from "../src/physics/laser-safety/eye-exposure-limits";
import { multipleWavelengthExposure } from "../src/physics/laser-safety/multiple-wavelength";

// Limits: ICNIRP, Health Phys. 105(3), 271–295 (2013), doi:10.1097/HP.0b013e3182983fd4, Table 5 (eye) and Table 8
// (apertures). Additivity: ibid. p. 279, "Multiple wavelengths": same tissue → additive; different tissues →
// independent.

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// 400–700 nm, 0.25 s, all the power inside the 7 mm aperture: 18 t^0.75 J/m² / t × π(3.5 mm)² = 0.97966 mW.
const P_VIS_025 = 18 * Math.pow(0.25, -0.25) * Math.PI * 3.5e-3 * 3.5e-3;

test("visible lines add at the retina", () => {
  const lines = [450e-9, 520e-9, 638e-9].map((lambda) => ({ lambda, P: 0.4e-3 }));
  const x = multipleWavelengthExposure(lines, 0, 0.25);
  assertRel(P_VIS_025, 0.97966e-3, 1e-4, "hand value");
  // C_A = 1 below 700 nm and no photochemical limit before 10 s: three equal shares of 0.4/0.97966.
  for (const l of x.lines) assertRel(l.sites.retina, 0.4e-3 / P_VIS_025, 1e-12, "one line's share");
  assertRel(x.sites.retina, 1.2e-3 / P_VIS_025, 1e-12, "sum");
  assert.ok(x.ratio > 1 && x.lines.every((l) => l.sites.retina < 1), "each line alone is within the limit, together not");
  assert.equal(x.limiting, "retina");
  assert.equal(x.sites.anteriorEye, 0);
});

test("retina and cornea count independently", () => {
  // 1550 nm, 0.25 s, 1 mm beam: 10⁴ J/m² over the 1 mm aperture, 1 − e⁻² of the power inside it (hand calculation).
  const p1550 = ((1e4 / 0.25) * Math.PI * 0.25e-6) / -Math.expm1(-2);
  const x = multipleWavelengthExposure([{ lambda: 532e-9, P: 0.5e-3 }, { lambda: 1550e-9, P: 10e-3 }], 1e-3, 0.25);
  assertRel(x.lines[1].sites.anteriorEye, 10e-3 / p1550, 1e-12, "1550 nm share");
  assertRel(x.lines[1].sites.anteriorEye, 0.2753, 1e-3, "1550 nm share, value");
  assertRel(x.sites.anteriorEye, 10e-3 / p1550, 1e-12, "not added to the retina");
  assertRel(x.sites.retina, 0.5e-3 / limitMaxPower(eyeLimits(532e-9)[0], 1e-3, 0.25), 1e-12, "532 nm share");
  assert.equal(x.ratio, Math.max(x.sites.retina, x.sites.anteriorEye));
  // 0.1 mW at 532 nm and 30 mW at 1550 nm: the cornea governs.
  const y = multipleWavelengthExposure([{ lambda: 532e-9, P: 0.1e-3 }, { lambda: 1550e-9, P: 30e-3 }], 1e-3, 0.25);
  assert.equal(y.limiting, "anteriorEye");
  assertRel(y.ratio, 30e-3 / p1550, 1e-12, "cornea sum");
});

test("one line's dual retinal limits are met separately; the same limit adds across lines", () => {
  // 450 nm at 100 s: thermal 10 W/m², photochemical 100 C_B J/m² / 100 s = 1 W/m² (C_B = 1) → photochemical binds.
  const x = multipleWavelengthExposure([{ lambda: 450e-9, P: 20e-6 }, { lambda: 650e-9, P: 200e-6 }], 0, 100);
  const area = Math.PI * 3.5e-3 * 3.5e-3;
  const [blue, red] = x.lines;
  assertRel(blue.sites.retina, 20e-6 / (1 * area), 1e-12, "450 nm: photochemical share");
  // Thermal at 100 s: least H/t over the piece ends, 10 W/m² from 10 s (Table 5's rounded value).
  assertRel(red.sites.retina, 200e-6 / (10 * area), 1e-12, "650 nm: thermal share");
  assertRel(x.sites.retina, blue.sites.retina + red.sites.retina, 1e-12, "site sum");
  assertRel(x.limits.retinalThermal!, 20e-6 / (10 * area) + 200e-6 / (10 * area), 1e-12, "thermal sum over both lines");
  assert.equal(x.limits.retinalPhotochemical, blue.sites.retina, "only 450 nm has a photochemical limit");
});

test("1064 nm at 1 ms uses 90 C_C t^0.75 (the old page had a flat 0.01 J/cm², 198× higher)", () => {
  const x = multipleWavelengthExposure([{ lambda: 1064e-9, P: 1e-3 }], 0, 1e-3);
  const H = 90 * Math.pow(1e-3, 0.75); // 0.506 J/m²
  assertRel(100 / H, 197.6, 1e-3, "ratio to the old value");
  assertRel(x.ratio, 1e-3 / ((H / 1e-3) * Math.PI * 3.5e-3 * 3.5e-3), 1e-12, "share");
});

test("invalid lines", () => {
  assert.ok(Number.isNaN(multipleWavelengthExposure([{ lambda: 100e-9, P: 1e-3 }], 1e-3, 1).ratio), "below 180 nm");
  assert.ok(Number.isNaN(multipleWavelengthExposure([{ lambda: 532e-9, P: -1 }], 1e-3, 1).ratio), "negative power");
  assert.ok(Number.isNaN(multipleWavelengthExposure([], 1e-3, 1).ratio), "no lines");
  assert.ok(Number.isNaN(multipleWavelengthExposure([{ lambda: 532e-9, P: 1e-3 }], 1e-3, 1e5).ratio), "t beyond 30 ks");
  assert.equal(multipleWavelengthExposure([{ lambda: 532e-9, P: 0 }], 1e-3, 1).limiting, null, "no power");
});
