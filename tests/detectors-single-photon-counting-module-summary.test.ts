import assert from "node:assert/strict";
import test from "node:test";

import { MAX_MODEL_LOSS, MIN_GATE_COUNTS, spcmSummary } from "../src/physics/detectors/single-photon-counting-module";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Knoll, Radiation Detection and Measurement, 4th ed. (2010), ch. 4 §VII: m = R/(1 + Rτ). Müller, Nucl. Instrum. Methods 112, 47 (1973),
// doi:10.1016/0029-554X(73)90773-8: renewal count variance 1/(1 + Rτ)².
test("spcmSummary: SPCM-AQRH defaults, hand-worked", () => {
  // Φ = 1e-12·650e-9/(hc) = 3272175.769 /s; R = 0.65Φ + 100 = 2127014.2498 /s; Rτ = 0.0467943135 (τ = 22 ns); m = 2031931.4142 /s;
  // loss = Rτ/(1 + Rτ) = 0.0447024911; afterpulses 0.005·m = 10159.6571 /s; SNR = (R_s/R)·√(mT)/√(1 + (1 + Rτ)²·P(1 − P)/(1 + P)²) = 1421.5601;
  // SNR without dead time or afterpulses = R_s·T/√(R·T) = 1458.3601.
  const r = spcmSummary({ deadTime: 22e-9, darkRate: 100, pde: 0.65, power: 1e-12, wavelength: 650e-9, afterpulseProb: 0.005, gate: 1 });
  assertRel(r.photons, 3272175.7689027614, 1e-8, "photons");
  assertRel(r.rate, 2127014.249786795, 1e-8, "R");
  assertRel(r.recorded, 2031931.4141902109, 1e-8, "m");
  assertRel(r.loss, 0.04470249111218464, 1e-8, "loss");
  assertRel(r.correction, 1.0467943134953095, 1e-8, "1 + R tau");
  assertRel(r.afterpulseRate, 10159.657070951054, 1e-8, "afterpulse rate");
  assertRel(r.totalOutput, 2042091.071261162, 1e-8, "total");
  assertRel(r.snr, 1421.5601070125836, 1e-8, "SNR");
  assertRel(r.snrIdeal, 1458.36012510224, 1e-8, "ideal SNR");
  assert.deepEqual(r.warnings, []);
});

test("spcmSummary: warns for a short gate and for heavy dead-time loss; thresholds are exported", () => {
  assert.equal(MIN_GATE_COUNTS, 10);
  assert.equal(MAX_MODEL_LOSS, 0.1);
  // R = 100 /s, T = 0.01 s: 1 recorded count in the gate (< 10).
  const few = spcmSummary({ deadTime: 22e-9, darkRate: 100, pde: 0.65, power: 0, wavelength: 650e-9, afterpulseProb: 0.005, gate: 0.01 });
  assert.equal(few.warnings.length, 1);
  assert.match(few.warnings[0], /Fewer than 10 counts/);
  // R = 5e6 /s, τ = 100 ns: Rτ = 0.5, loss = 1/3 (> 10 %).
  const lossy = spcmSummary({ deadTime: 100e-9, darkRate: 5e6, pde: 0.65, power: 0, wavelength: 650e-9, afterpulseProb: 0, gate: 1 });
  assertRel(lossy.loss, 1 / 3, 1e-12, "loss");
  assert.equal(lossy.warnings.length, 1);
  assert.match(lossy.warnings[0], /33 % of the avalanches/);
});
