import test from "node:test";
import assert from "node:assert/strict";

import { detectivitySummary, type DetectivityParams } from "../src/physics/detectors/detectivity";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// E. L. Dereniak, G. D. Boreman, Infrared Detectors and Systems (Wiley 1996), ch. 5: ℛ = η·q·λ/(h·c), NEP = i_n/(ℛ·M),
// D* = √(A·Δf)/NEP; detector D* = ℛ·M/√(2q·J_d·M²·F + 4k_BT/R₀A) (A. Rogalski, Prog. Quantum Electron. 27, 59, 2003).
// Values re-derived with an independent script (own constants).
const base: DetectivityParams = {
  wavelength_nm: 850, cutoff_nm: 1100, qe: 0.7, darkCurrent: 1e-9, area_cm2: 0.01, bandwidth: 1e6, temperature: 293,
  loadResistance: 50, r0a: 1e7, gain: 1, excessNoiseFactor: 1,
};

test("detectivitySummary: Si-like defaults", () => {
  const s = detectivitySummary(base);
  assertRel(s.responsivity, 0.4798998642722781, 1e-9, "R");
  assertRel(s.bandGap_eV, 1.127129076665457, 1e-9, "E_g");
  assertRel(s.detectorDStar, 2615669725299.011, 1e-9, "D* detector");
  assertRel(s.systemDStar, 2667656868.791927, 1e-9, "D* system");
  assertRel(s.nepSpectral, 3.748608045130104e-11, 1e-9, "NEP");
  assertRel(s.shotNoise, 1.790070743853438e-11, 1e-9, "shot");
  assertRel(s.thermalNoise, 1.7989556014532433e-8, 1e-9, "thermal");
  assertRel(s.jd, 1e-7, 1e-12, "J_d");
});

test("detectivitySummary: gain with excess noise; no response beyond the cutoff", () => {
  const s = detectivitySummary({
    ...base, wavelength_nm: 1550, cutoff_nm: 1700, qe: 0.8, darkCurrent: 5e-9, area_cm2: 0.005, bandwidth: 1e7, temperature: 250,
    loadResistance: 1000, r0a: 1e5, gain: 10, excessNoiseFactor: 5,
  });
  assertRel(s.detectorDStar, 789792685395.0676, 1e-9, "D* detector");
  assertRel(s.systemDStar, 185033872032.1375, 1e-9, "D* system");
  const beyond = detectivitySummary({ ...base, wavelength_nm: 1200 });
  assert.equal(beyond.responsivity, 0);
  assert.ok(Number.isNaN(beyond.systemDStar) && Number.isNaN(beyond.nepSpectral));
});
