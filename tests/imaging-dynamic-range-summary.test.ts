import assert from "node:assert/strict";
import test from "node:test";

import { DARK_RANGE_WARNING, dynamicRangeSummary } from "../src/physics/imaging/dynamic-range";
import schema from "../src/schemas/imaging/dynamic-range";
import { runSchema } from "../src/schemas/run";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// EMVA Standard 1288 Release 3.1 (2016) Eq. (17), (45)-(48) and Janesick, Photon Transfer (SPIE 2007).
test("dynamicRangeSummary: 30000 e-, 2 e- read, 14 bit", () => {
  // K = 30000/16383, sigma_q^2 = K^2/12, D = 0.05*0.1 = 0.005, floor = sqrt(4 + 0.005 + sigma_q^2) = 2.0698867,
  // DR = 20 log10((30000 - 0.005)/floor) = 83.223492 dB, S = 15000: total^2 = S + D + 4 + sigma_q^2 + 0.25 + (0.01 S)^2
  const r = dynamicRangeSummary({ well: 30000, read: 2, darkRate: 0.05, exposure: 0.1, bits: 14, prnu: 0.01, dsnu: 0.5 });
  assertRel(r.dark, 0.005, 1e-12, "dark");
  assertRel(r.electronsPerDn, 1.8311664530306, 1e-12, "K");
  assertRel(r.floor, 2.0698866832652, 1e-10, "floor");
  assertRel(r.dynamicRangeDb, 83.223492236927, 1e-10, "DR");
  assertRel(r.stops, 13.823122850824, 1e-10, "stops");
  assertRel(r.floorDn, 1.1303651177311, 1e-10, "floor DN");
  assertRel(r.quantization, 0.52861222229411, 1e-10, "quantization");
  assertRel(r.snrHalf, 77.454984208736, 1e-10, "SNR half");
  assertRel(r.snrHalfFlat, 122.45699976941, 1e-10, "SNR half flat");
  assertRel(r.shotReadCrossover, 4, 1e-12, "shot = read");
  assertRel(r.shotPrnuCrossover, 1e4, 1e-12, "shot = PRNU");
});

test("dynamicRangeSummary: dark charge filling the well has no dynamic range; PRNU 0 never crosses", () => {
  const r = dynamicRangeSummary({ well: 1000, read: 2, darkRate: 1000, exposure: 1, bits: 12, prnu: 0, dsnu: 0 });
  assert.ok(Number.isNaN(r.dynamicRangeDb));
  assert.ok(Number.isNaN(r.stops));
  assert.equal(r.shotPrnuCrossover, Infinity);
});

test("warning when dark charge leaves less than one noise floor of range", () => {
  // FW 100, D = 99 × 1 = 99 e⁻: FW − D = 1; floor = √(10² + 99 + K²/12) with K = 100/4095 (12 bit): ≈ 14.1 > 1
  const low = dynamicRangeSummary({ well: 100, read: 10, darkRate: 99, exposure: 1, bits: 12, prnu: 0, dsnu: 0 });
  assert.deepEqual(low.warnings, [DARK_RANGE_WARNING]);
  assert.ok(low.dynamicRangeDb < 0);
  // no warning at the defaults, and none when the dark charge fills the well (NaN range has its own message)
  assert.deepEqual(dynamicRangeSummary({ well: 30000, read: 2, darkRate: 0.05, exposure: 0.1, bits: 14, prnu: 0.01, dsnu: 0.5 }).warnings, []);
  assert.deepEqual(dynamicRangeSummary({ well: 1000, read: 2, darkRate: 1000, exposure: 1, bits: 12, prnu: 0, dsnu: 0 }).warnings, []);
  // through the API path, page units: exposure 1000 ms = 1 s, so D = 99 e⁻ and FW − D = 1 e⁻ < σ_floor
  const run = runSchema(schema, { fullWellCapacity: 100, readNoise: 10, darkCurrent: 99, exposureTime: 1000, bitDepth: 12, prnu: 0, dsnuE: 0 });
  assert.ok(run.warnings.includes(DARK_RANGE_WARNING));
});
