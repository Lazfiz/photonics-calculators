import assert from "node:assert/strict";
import test from "node:test";

import { temporalNoiseSummary } from "../src/physics/detectors/temporal-noise";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Density (σ²/B)(1 + f_c/f) over f_L…B (Motchenbacher & Connelly 1993) integrates to σ_1/f² = σ²(f_c/B)·ln(B/f_L).
test("temporalNoiseSummary: hand-worked", () => {
  // σ = 4 e⁻, 2 e⁻/s for 3 s, f_c 1000 Hz, B 1e5 Hz, f_L 10 Hz, 3 μV/e⁻: σ_dark √6 = 2.44948974; σ_1/f = 4·√(0.01·ln 1e4) = 1.21394170;
  // total √(16 + 6 + 16·0.01·9.21034037) = 4.84496176 e⁻ → 14.5348853 μV
  const r = temporalNoiseSummary({ readNoise: 4, darkCurrent: 2, exposureTime: 3, kneeFreq: 1000, bandwidth: 1e5, fLow: 10, conversionGain: 3e-6 });
  assertRel(r.darkShotNoise, 2.44948974, 1e-8, "dark");
  assertRel(r.flickerNoise, 1.2139417, 1e-7, "1/f");
  assertRel(r.totalNoise, 4.84496176, 1e-8, "total");
  assertRel(r.totalNoiseVoltage, 14.5348853e-6, 1e-7, "voltage");
});

test("temporalNoiseSummary: an empty band gives no 1/f or total", () => {
  const r = temporalNoiseSummary({ readNoise: 4, darkCurrent: 2, exposureTime: 3, kneeFreq: 1000, bandwidth: 10, fLow: 10, conversionGain: 3e-6 });
  assert.ok(Number.isNaN(r.flickerNoise) && Number.isNaN(r.totalNoise) && Number.isNaN(r.totalNoiseVoltage));
  assertRel(r.darkShotNoise, 2.44948974, 1e-8, "dark");
});
