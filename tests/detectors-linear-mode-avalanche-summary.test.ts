import assert from "node:assert/strict";
import test from "node:test";

import { APD_GAIN_MAX, linearApdIonizationRatio, linearApdSummary } from "../src/physics/detectors/linear-mode-avalanche";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// McIntyre, IEEE Trans. Electron Devices ED-13, 164 (1966), doi:10.1109/T-ED.1966.15651; Personick, Proc. IEEE 65, 1670 (1977),
// doi:10.1109/PROC.1977.10808.
const base = { gain: 100, k: 0.02, qe: 0.8, bandwidth: 100e6, darkCurrent: 2.2e-13, wavelength: 800e-9, power: 1e-9, loadResistance: 1000, temperature: 300 };

test("linearApdSummary: Si receiver, hand-worked", () => {
  // ℛ₀ = 0.8·q·800e-9/(hc) = 0.5161948 A/W, I_p = 5.161948e-10 A, F = 0.02·100 + 0.98·1.99 = 3.9502
  // M_opt solves 0.02·M³ + 0.98·M = 4k_B·T/(q·R·(I_p + I_d)) = 215.45459; SNR = (M·I_p)²/(σ_shot² + σ_th²) = 1.1532701
  const s = linearApdSummary(base);
  assertRel(s.responsivity, 0.5161948, 1e-7, "ℛ₀");
  assertRel(s.excessNoise, 3.9502, 1e-12, "F");
  assertRel(s.r.snr, 1.1532701, 1e-7, "SNR");
  assertRel(s.optimumGain, 215.45459, 1e-7, "M_opt");
  assertRel(s.snrAtOptimum, 1.9120788, 1e-7, "SNR(M_opt)");
  assertRel(s.nep, 7.88597e-10, 1e-6, "NEP");
});

test("linearApdSummary: optimum gain is capped at APD_GAIN_MAX for the SNR, material lookup", () => {
  // 1 Ω load and no light: C = 4k_B·T/(q·R·I_d) is huge, M_opt far above 1e4
  const s = linearApdSummary({ ...base, power: 0, loadResistance: 1, darkCurrent: 1e-15 });
  assert.ok(s.optimumGain > APD_GAIN_MAX);
  assert.equal(s.optimumGainShown, APD_GAIN_MAX);
  assert.equal(linearApdIonizationRatio("ingaas", 0.9), 0.5);
  assert.equal(linearApdIonizationRatio("custom", 0.9), 0.9);
  assert.equal(linearApdSummary({ ...base, power: 0, darkCurrent: 0 }).optimumGain, Infinity);
});
