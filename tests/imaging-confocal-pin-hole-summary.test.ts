import test from "node:test";
import assert from "node:assert/strict";

import { confocalPinholeSummary, WILHELM_MIN_PINHOLE_AU } from "../src/physics/imaging/confocal-pin-hole";

const nm = 1e-9;
const close = (actual: number, expected: number, tol: number, label: string) =>
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);

test("confocal pinhole summary, 488 nm NA 1.4 n 1.515 M 60, 2 AU (Born & Wolf §8.5.2; Wilhelm et al. 2003)", () => {
  // Hand (scratch script, independent series for J0, J1): 1 AU = 1.22 λ/NA = 425.2571429 nm; at the pinhole × 60 = 25.51542857 µm;
  // throughput 1 − J0²(v) − J1²(v), v = 3.83170597·2: 91.18078556 %; Wilhelm hypot(0.88589 λ/Δ, √2 n PH/NA) = 1381.127850 nm.
  const s = confocalPinholeSummary(488 * nm, 1.4, 60, 1.515, 2);
  close(s.airyObject, 425.25714285714287 * nm, 1e-9, "Airy unit");
  close(s.airyPinhole, 25.515428571428576e-6, 1e-9, "Airy unit at the pinhole");
  close(s.pinholeDiameter, 51.03085714285715e-6, 1e-9, "pinhole diameter");
  close(s.throughput, 0.91180785559358, 1e-8, "throughput");
  close(s.wilhelm, 1381.1278501664094 * nm, 1e-9, "Wilhelm");
  assert.ok(s.wilhelmExcess > 0);
});

test("confocal pinhole summary: Wilhelm's formula is withheld below its range, and a closed pinhole passes no light", () => {
  const s = confocalPinholeSummary(488 * nm, 1.4, 60, 1.515, WILHELM_MIN_PINHOLE_AU / 2);
  assert.ok(Number.isNaN(s.wilhelm) && Number.isNaN(s.wilhelmExcess));
  assert.equal(confocalPinholeSummary(488 * nm, 1.4, 60, 1.515, 0).throughput, 0);
});
