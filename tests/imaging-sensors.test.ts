import test from "node:test";
import assert from "node:assert/strict";

import { binnedReadNoise, cameraNoise, cameraSnr, dynamicRangeDb, framesForSnr } from "../src/physics/detectors/camera-snr";
import { darkCurrentDensity, darkReadCrossoverTemperature, doublingLawRatio } from "../src/physics/detectors/dark-current";
import { sensorNoise } from "../src/physics/detectors/sensor-noise";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Hand calculations from Janesick, Photon Transfer (SPIE 2007, doi:10.1117/3.725073), ch. 5, and EMVA 1288 Rel. 3.1 Eq. (48).
test("sensor-cmos: dynamic range, pixel SNR, cooling and dark-current density", () => {
  // 20·log₁₀(25000/1.5) = 84.437 dB.
  assertRel(dynamicRangeDb(25000, 1.5), 84.43697, 1e-6, "DR");
  // √(700 + 0.1 + 1.5²) = 26.502, SNR 26.413.
  const n = sensorNoise({ signal: 700, read: 1.5, dark: 0.1 });
  assertRel(n.total, 26.50189, 1e-6, "total noise");
  assertRel(700 / n.total, 26.41321, 1e-6, "SNR");
  // Page defaults: 2 e⁻/s at 25 °C cooled to 0 °C (2^(−25/6)), 100 ms, K = 0.5 e⁻/DN (σ_q² = 0.25/12).
  const dark = 2 * doublingLawRatio(0, 25, 6) * 0.1;
  assertRel(dark, 0.2 * 2 ** (-25 / 6), 1e-12, "dark charge");
  const floor = sensorNoise({ signal: 0, read: 1.5, dark, electronsPerDn: 0.5 }).temporal;
  assertRel(floor, Math.sqrt(2.25 + dark + 0.25 / 12), 1e-12, "noise floor");
  assertRel(700 / sensorNoise({ signal: 700, read: 1.5, dark, electronsPerDn: 0.5 }).temporal, 26.41449, 1e-6, "page SNR");
  // Doubling every 6 K from 25 °C to −70 °C: 2^(−95/6) = 1.713e-5.
  assertRel(doublingLawRatio(-70, 25, 6), 1.712741e-5, 1e-6, "doubling");
  // √D = σ_r at T* = 25 + 6·log₂(64/200) = 15.14 °C (CCD preset, 1 s); 25 + 6·log₂(2.25/0.2) = 45.95 °C (sCMOS).
  assertRel(darkReadCrossoverTemperature(8, 200, 25, 6), 15.13686, 1e-6, "CCD crossover");
  assertRel(darkReadCrossoverTemperature(1.5, 0.2, 25, 6), 45.95112, 1e-6, "sCMOS crossover");
  assert.ok(Number.isNaN(darkReadCrossoverTemperature(1.5, 0, 25, 6)), "no dark charge, no crossover");
  // q·200/(16 µm)² = 1.2517e-7 A/m² = 12.52 pA/cm².
  assertRel(darkCurrentDensity(200, 16e-6), 1.2517005e-7, 1e-6, "dark current density");
});

test("dynamic-range: PRNU in %, DSNU in e⁻ and the ADC step (EMVA 1288 Eq. 48)", () => {
  // Half of a 30 ke⁻ well, 2 e⁻ read, 0.05 e⁻/s × 100 ms dark, PRNU 1 %: 15000/√(15000 + 0.005 + 4 + 150²) = 77.456.
  const half = sensorNoise({ signal: 15000, read: 2, dark: 0.005, prnu: 0.01 });
  assertRel(15000 / half.total, 77.45553, 1e-6, "SNR at half well");
  // The old page read 1 % as 0.01 %: 122.45, as the knownIssue said.
  assertRel(15000 / sensorNoise({ signal: 15000, read: 2, dark: 0.005, prnu: 1e-4 }).total, 122.44896, 1e-6, "0.01 % PRNU");
  // 14-bit ADC across the well: K = 30000/16383, floor √(4 + 0.005 + K²/12) = 2.0699 e⁻, DR 83.22 dB.
  const K = 30000 / 16383;
  const floor = sensorNoise({ signal: 0, read: 2, dark: 0.005, dsnu: 0.5, electronsPerDn: K }).temporal;
  assertRel(floor, 2.069887, 1e-6, "temporal floor");
  assertRel(dynamicRangeDb(30000, floor), 83.22349, 1e-6, "DR");
  // Flat-field correction leaves the temporal noise: 15000/√(15000 + 4.005 + K²/12) = 122.457.
  const page = sensorNoise({ signal: 15000, read: 2, dark: 0.005, prnu: 0.01, dsnu: 0.5, electronsPerDn: K });
  assertRel(15000 / page.temporal, 122.457, 1e-5, "flat-fielded SNR");
  assertRel(15000 / page.total, 77.45498, 1e-6, "page SNR");
});

test("signal-to-noise: background, binning and the CCD equation", () => {
  // Defaults: 5000 and 500 photons at QE 0.7, 0.1 e⁻/s × 100 ms, 1.5 e⁻: 3500/√(3500 + 350 + 0.01 + 2.25) = 56.391.
  assertRel(cameraSnr({ signal: 3500, background: 350, dark: 0.01, read: 1.5 }), 56.39106, 1e-6, "default SNR");
  // 2×2 binning: charge binning reads once, a digital sum adds 4 reads (σ = 2·1.5 e⁻).
  assert.equal(binnedReadNoise(1.5, 2, "charge"), 1.5);
  assert.equal(binnedReadNoise(1.5, 2, "digital"), 3);
  assertRel(14000 / cameraNoise({ signal: 14000, background: 1400, dark: 0.04, read: 1.5 }), 112.8068, 1e-6, "charge 2×2");
  assertRel(14000 / cameraNoise({ signal: 14000, background: 1400, dark: 0.04, read: 3 }), 112.7821, 1e-6, "digital 2×2");
  // Read-noise limit: no light, no dark → SNR 0; no noise at all → NaN.
  assert.equal(cameraSnr({ signal: 0, read: 1.5 }), 0);
  assert.ok(Number.isNaN(cameraSnr({ signal: 0, read: 0 })));
  assert.ok(Number.isNaN(cameraNoise({ signal: 1, read: 1, background: -1 })));
});

test("signal-to-noise: frames to average for a target SNR", () => {
  // √N gain: SNR₁ = 10 needs exactly (100/10)² = 100 frames for SNR 100, not 101.
  assert.equal(framesForSnr(10, 100), 100);
  // Page defaults: SNR₁ 56.391 → (100/56.391)² = 3.145 → 4 frames.
  assert.equal(framesForSnr(56.39106, 100), 4);
  // Already above the target: one frame. No signal: NaN.
  assert.equal(framesForSnr(200, 100), 1);
  assert.ok(Number.isNaN(framesForSnr(0, 100)));
});
