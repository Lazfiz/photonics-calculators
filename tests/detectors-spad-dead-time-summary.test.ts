import assert from "node:assert/strict";
import test from "node:test";

import { spadDeadTimeSummary } from "../src/physics/detectors/spad-dead-time";

const rel = (a: number, e: number, tol: number, label: string) => assert.ok(Math.abs(a / e - 1) < tol, `${label}: ${a} vs ${e}`);

// Knoll, Radiation Detection and Measurement, 4th ed., ch. 4; Müller, Nucl. Instrum. Methods 112, 47 (1973), doi:10.1016/0029-554X(73)90773-8.
test("spadDeadTimeSummary: non-paralyzable τ = 25 ns, R = 10 Mcps (Rτ = 0.25)", () => {
  const r = spadDeadTimeSummary(25e-9, 10e6, "nonparalyzable");
  rel(r.measured, 8e6, 1e-12, "m");
  rel(r.loss, 0.2, 1e-12, "loss");
  rel(r.correction, 1.25, 1e-12, "R/m");
  rel(r.rateAtLoss, 0.1 / (0.9 * 25e-9), 1e-12, "R at 10 % loss");
  rel(r.peakRate, 1 / (Math.E * 25e-9), 1e-12, "peak");
  assert.equal(r.pastPeak, false);
});

test("spadDeadTimeSummary: paralyzable past the peak, and underflow gives a non-finite correction", () => {
  // Rτ = 2: m = R·e^(−2)
  const r = spadDeadTimeSummary(25e-9, 80e6, "paralyzable");
  rel(r.measured, 80e6 * Math.exp(-2), 1e-12, "m");
  assert.equal(r.pastPeak, true);
  assert.ok(!Number.isFinite(spadDeadTimeSummary(1e-4, 1e10, "paralyzable").correction));
});
