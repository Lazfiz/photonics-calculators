import test from "node:test";
import assert from "node:assert/strict";

import {
  POCKELS, balancedGratingPeriod, crossedPolarizerTransmission, diffusionField, gratingPeriod, longitudinalHalfWaveVoltage, phaseHalfWaveVoltage,
  pockelsIndexChange, spaceChargeField, transverseHalfWaveVoltage, trapLimitedField, twoBeamCouplingGain, twoBeamSignalGain,
} from "../src/physics/materials/pockels";

const deg = Math.PI / 180;

function assertRel(actual: number, expected: number, rel: number, label: string) {
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${label}: ${actual} vs ${expected}`);
}

// ------------------------------------------------------------------ Pockels modulators

test("KDP longitudinal half-wave voltage: Wilson & Hawkes Example 3.2 and the 546 nm value", () => {
  // Example 3.2: n_o = 1.51, r63 = 10.6 pm/V at 1.06 µm gives 14 522.4 V.
  assertRel(longitudinalHalfWaveVoltage(1.06e-6, 1.51, 10.6e-12), 14522.4, 1e-5, "W&H 3.2");
  // λ/(2 n_o³ r63) at 546 nm: 546e-9 / (2 · 3.442951 · 10.6e-12) = 7480 V (materials audit, PR #155).
  assertRel(longitudinalHalfWaveVoltage(546e-9, 1.51, 10.6e-12), 7480.4, 1e-4, "KDP 546 nm");
  // Zernike's n_o(546 nm) = 1.5116 (Yariv & Yeh list 1.5115) through the table entry.
  const { no } = POCKELS.kdp.indices(546e-9);
  assertRel(no, 1.5115, 1e-4, "KDP n_o 546 nm");
  assertRel(longitudinalHalfWaveVoltage(546e-9, no, POCKELS.kdp.r.r63!), 7457, 1e-3, "KDP table");
});

test("a single polarization needs twice the retardation half-wave voltage in a longitudinal cell", () => {
  const Vret = longitudinalHalfWaveVoltage(633e-9, 1.51, 26.4e-12);
  assertRel(phaseHalfWaveVoltage(633e-9, 1.51, 26.4e-12, 1e-2, 1e-2), 2 * Vret, 1e-12, "phase vs retardation");
});

test("LiNbO₃ index change ½ n³ r₃₃ E = 1.64e-4 at 1 MV/m (n 2.2, r₃₃ 30.8 pm/V, Weis & Gaylord 1985)", () => {
  // 0.5 · 10.648 · 30.8e-12 · 1e6 = 1.63979e-4, negative for a positive field.
  assertRel(pockelsIndexChange(2.2, 30.8e-12, 1e6), -1.63979e-4, 1e-5, "Δn");
});

test("transverse LiNbO₃ modulator: phase and retardation half-wave voltages by hand", () => {
  // λ d / (n_e³ r33 L), n_e = 2.2, 1550 nm, d = 10 µm, L = 20 mm: 1.55e-6 · 1e-5 / (10.648 · 30.8e-12 · 0.02) = 2.3631 V.
  assertRel(phaseHalfWaveVoltage(1.55e-6, 2.2, 30.8e-12, 10e-6, 0.02), 2.3631, 1e-4, "phase V_π");
  // r_c = n_e³ r33 − n_o³ r13 with n_o 2.286, n_e 2.200: 327.96 − 102.73 = 225.23 pm/V → 1.55e-11 / (225.23e-12 · 0.02) = 3.4409 V.
  assertRel(transverseHalfWaveVoltage(1.55e-6, 2.286, 2.2, 30.8e-12, 8.6e-12, 10e-6, 0.02), 3.4409, 1e-3, "retardation V_π");
  assert.ok(Number.isNaN(transverseHalfWaveVoltage(1.55e-6, 2.2, 2.2, 8.6e-12, 8.6e-12, 10e-6, 0.02)), "no net coefficient");
  assert.ok(Number.isNaN(phaseHalfWaveVoltage(1.55e-6, 2.2, 30.8e-12, 0, 0.02)), "zero gap");
});

test("crossed polarizers: T = sin²(Γ/2) is 0 at Γ = 0, ½ at π/2 and 1 at π", () => {
  assert.equal(crossedPolarizerTransmission(0), 0);
  assertRel(crossedPolarizerTransmission(Math.PI / 2), 0.5, 1e-12, "π/2");
  assertRel(crossedPolarizerTransmission(Math.PI), 1, 1e-12, "π");
});

// ------------------------------------------------------------------ photorefractive grating

test("diffusion field k_B T K / q: 0.025852 V · 2π / 1 µm = 1.6243e5 V/m at 300 K", () => {
  assertRel(diffusionField(1e-6, 300), 1.62433e5, 1e-5, "E_D");
  // Two 532 nm beams crossing at 2θ = 30.85° (θ = 15.425°, sin θ = 0.2660) write Λ = λ / (2 sin θ) = 1.0000 µm.
  assertRel(gratingPeriod(532e-9, 15.425 * deg), 1.0e-6, 1e-4, "Λ");
  assert.ok(Number.isNaN(gratingPeriod(532e-9, 0)), "parallel beams");
});

test("space-charge field saturates: E_D / 2 when E_D = E_q, E_D when E_q ≫ E_D", () => {
  assert.equal(spaceChargeField(1e5, 1e5), 5e4);
  assertRel(spaceChargeField(1e5, 1e12), 1e5, 1e-6, "E_q ≫ E_D");
  // E_q = q N Λ / (2π ε₀ ε): 1.602177e-19 · 1e23 · 1e-6 / (2π · 8.854188e-12 · 28) = 1.02855e7 V/m.
  assertRel(trapLimitedField(1e-6, 1e23, 28), 1.02855e7, 1e-4, "E_q");
});

test("two-beam coupling gain Γ = 2π n³ r E_sc / (λ cos θ) (Yeh 1989) by hand", () => {
  // n 2.2, r 30.8 pm/V, E_sc 1e5 V/m, 532 nm, normal incidence: 2π · 10.648 · 30.8e-12 · 1e5 / 532e-9 = 387.34 m⁻¹.
  assertRel(twoBeamCouplingGain(532e-9, 2.2, 30.8e-12, 1e5, 0), 387.34, 1e-4, "Γ");
  assertRel(twoBeamCouplingGain(532e-9, 2.2, 30.8e-12, 1e5, 60 * deg), 2 * 387.34, 1e-4, "1/cos θ");
  assert.ok(Number.isNaN(twoBeamCouplingGain(532e-9, 2.2, 30.8e-12, 1e5, Math.PI / 2)), "grazing");
});

test("balanced grating period 2π√(ε₀εk_BT/(q²N)) makes E_D = E_q", () => {
  // ε 28, 300 K, N 1e23 m⁻³: ε₀εk_BT = 1.02687e-30, q²N = 2.56697e-15 → √(4.0003e-16) = 2.0001e-8 m, × 2π = 1.2567e-7 m.
  const L = balancedGratingPeriod(1e23, 28, 300);
  assertRel(L, 1.2567e-7, 1e-4, "Λ");
  assertRel(diffusionField(L, 300), trapLimitedField(L, 1e23, 28), 1e-12, "E_D = E_q");
});

test("two-beam signal gain: e^(ΓL) for an undepleted pump, 1 + β at depletion, 1 without coupling", () => {
  assertRel(twoBeamSignalGain(2, 1e12), Math.exp(2), 1e-9, "undepleted");
  assertRel(twoBeamSignalGain(50, 100), 101, 1e-9, "depleted");
  assert.equal(twoBeamSignalGain(0, 100), 1);
  // ΓL = ln 2, β = 1: 2 / (1 + 0.5) = 4/3.
  assertRel(twoBeamSignalGain(Math.LN2, 1), 4 / 3, 1e-12, "ΓL = ln 2");
});
