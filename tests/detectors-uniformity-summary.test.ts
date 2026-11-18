import test from "node:test";
import assert from "node:assert/strict";

import { prnuMap, snrToDb, uniformitySummary } from "../src/physics/detectors/uniformity";
import { prnuPattern } from "../src/physics/detectors/sensor-noise";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// EMVA 1288 Release 3.1 Eq. (45)–(48): σ_total² = S + D + σ_read² + DSNU² + (PRNU·S)²; flat-field leaves √(S + D + σ_read²); shot = PRNU noise at S = 1/PRNU².
// Values re-derived by hand arithmetic in an independent script.
test("uniformitySummary: defaults", () => {
  const u = uniformitySummary({ signal: 50000, dark: 100, read: 5, prnu: 0.01, dsnu: 2 });
  assertRel(u.noise.total, 547.8403051985131, 1e-9, "total");
  assertRel(u.noise.spatial, 500.00399998400013, 1e-9, "spatial");
  assertRel(u.noise.temporal, 223.8861317723811, 1e-9, "temporal");
  assertRel(u.snr, 91.26747251990197, 1e-9, "SNR");
  assertRel(snrToDb(u.snr), 39.20632047464176, 1e-9, "SNR dB");
  assertRel(u.snrFlat, 223.32781224177668, 1e-9, "flat SNR");
  assertRel(u.crossover, 10000, 1e-12, "crossover");
});

test("uniformitySummary: no PRNU has no crossover; zero signal has no dB", () => {
  assert.equal(uniformitySummary({ signal: 1000, dark: 0, read: 1, prnu: 0, dsnu: 0 }).crossover, Infinity);
  const u = uniformitySummary({ signal: 0, dark: 100, read: 5, prnu: 0.01, dsnu: 2 });
  assert.equal(u.snr, 0);
  assert.ok(Number.isNaN(snrToDb(u.snr)));
});

test("prnuMap: spatial rms equals PRNU·S by construction", () => {
  const { z, rms } = prnuMap(50000, 0.01, prnuPattern(20));
  assert.equal(z.length, 20);
  assertRel(rms, 500, 1e-9, "map rms");
});
