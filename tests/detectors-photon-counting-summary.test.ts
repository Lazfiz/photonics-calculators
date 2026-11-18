import assert from "node:assert/strict";
import test from "node:test";

import { photonCountingSummary } from "../src/physics/detectors/photon-counting";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Poisson counts: SNR = √μ. Non-paralyzable dead time m = R/(1 + Rτ) (Knoll, Radiation Detection and Measurement, 4th ed., ch. 4 §VII);
// Fano factor 1/(1 + Rτ)² (Müller, Nucl. Instrum. Methods 112, 47 (1973), doi:10.1016/0029-554X(73)90773-8).
test("photonCountingSummary: hand-worked", () => {
  // μ = 100: SNR 10, 20 dB, 1/√μ = 0.1; Rτ = 1e6·50e-9 = 0.05: m = 1e6/1.05 = 952380.952, loss 0.05/1.05 = 0.047619048,
  // N = m·1 s, Fano = 1/1.05² = 0.907029478, corrected SNR = √N = 975.90007
  const r = photonCountingSummary({ meanCounts: 100, deadTime: 50e-9, countRate: 1e6, integrationTime: 1 });
  assertRel(r.snr, 10, 1e-12, "SNR");
  assertRel(r.snrDb, 20, 1e-12, "dB");
  assertRel(r.relativeError, 0.1, 1e-12, "1/√μ");
  assertRel(r.measured, 952380.952381, 1e-9, "m");
  assertRel(r.loss, 0.047619048, 1e-8, "loss");
  assertRel(r.fano, 0.907029478, 1e-8, "Fano");
  assertRel(r.correctedSnr, 975.90007, 1e-8, "corrected SNR");
});

test("photonCountingSummary: zero dead time loses nothing and keeps Poisson statistics", () => {
  const r = photonCountingSummary({ meanCounts: 4, deadTime: 0, countRate: 1e6, integrationTime: 0.01 });
  assert.equal(r.loss, 0);
  assert.equal(r.fano, 1);
  assertRel(r.recordedCounts, 1e4, 1e-12, "N");
  assertRel(r.correctedSnr, 100, 1e-12, "√N");
});
