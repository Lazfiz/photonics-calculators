import test from "node:test";
import assert from "node:assert/strict";

import {
  POCKELS, balancedGratingPeriod, crossedPolarizerTransmission, diffusionField, eWaveEffectiveCoefficient, extraordinaryIndex, gratingPeriod,
  gratingPermittivity, longitudinalHalfWaveVoltage, phaseHalfWaveVoltage, pockelsIndexChange, spaceChargeField, transverseHalfWaveVoltage, trapLimitedField, twoBeamCouplingGain, twoBeamSignalGain,
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

test("transverse KTP modulator at 632.8 nm: r₃₃ 36.3, r₂₃ 15.7 pm/V (Cheng et al. 1994 via Xie & Pfister 2005)", () => {
  // Kato & Takaoka 2002 at 632.8 nm: n_y 1.77129, n_z 1.86480. n_z³r₃₃ − n_y³r₂₃ = 235.400 − 87.251 = 148.149 pm/V
  // (the composite coefficient of Xie & Pfister), d = 1 mm, L = 20 mm: 632.8e-12 / (148.149e-12 · 0.02) = 213.57 V.
  const { no: ny, ne: nz } = POCKELS.ktp.indices(632.8e-9);
  assertRel(ny, 1.77129, 1e-5, "n_y");
  assertRel(nz, 1.8648, 1e-5, "n_z");
  const { r33, r13: r23 } = POCKELS.ktp.r;
  assertRel(transverseHalfWaveVoltage(632.8e-9, ny, nz, r33!, r23!, 1e-3, 0.02), 213.57, 1e-4, "retardation V_π");
  // z polarization alone: 632.8e-12 / (235.400e-12 · 0.02) = 134.41 V.
  assertRel(phaseHalfWaveVoltage(632.8e-9, nz, r33!, 1e-3, 0.02), 134.41, 1e-4, "phase V_π");
  assert.ok(Number.isNaN(POCKELS.ktp.indices(5e-6).ne), "outside Kato's 0.43–3.54 µm");
});

test("transverse BaTiO₃ modulator at 632.8 nm: Zgonik et al. 1994 r (Tables II, III), Wemple 1968 indices", () => {
  // Wemple et al. 1968, n² − 1 = Bλ²/(λ² − λ₀²): n_o = √(1 + 4.187 · 0.40044/(0.40044 − 0.049729)) = 2.40431,
  // n_e = √(1 + 4.064 · 0.40044/(0.40044 − 0.044521)) = 2.36059. Independent check: Nikogosyan's 2.412 and 2.360 at 20 °C
  // (quoted by Petraru, §2.3) within 0.01.
  const { no, ne } = POCKELS.batio3.indices(632.8e-9);
  assertRel(no, 2.40431, 1e-5, "n_o");
  assertRel(ne, 2.36059, 1e-5, "n_e");
  assert.ok(Math.abs(no - 2.412) < 0.01 && Math.abs(ne - 2.36) < 0.01);
  // Zgonik et al. 1994: stress-free r₁₃ 8, r₃₃ 105 (Table III); clamped 10.2, 40.6 pm/V (Table II).
  assert.deepEqual([POCKELS.batio3.r.r13! * 1e12, POCKELS.batio3.r.r33! * 1e12], [8, 105]);
  assert.deepEqual([POCKELS["batio3-clamped"].r.r13! * 1e12, POCKELS["batio3-clamped"].r.r33! * 1e12], [10.2, 40.6]);
  // Unclamped: n_e³r₃₃ − n_o³r₁₃ = 1381.173 − 111.189 = 1269.985 pm/V; d = 1 mm, L = 20 mm: 632.8e-12/(1269.985e-12 · 0.02)
  // = 24.914 V; z polarization alone 632.8e-12/(1381.173e-12 · 0.02) = 22.908 V.
  const u = POCKELS.batio3.r;
  assertRel(transverseHalfWaveVoltage(632.8e-9, no, ne, u.r33!, u.r13!, 1e-3, 0.02), 24.9137, 1e-4, "unclamped retardation V_π");
  assertRel(phaseHalfWaveVoltage(632.8e-9, ne, u.r33!, 1e-3, 0.02), 22.9081, 1e-4, "unclamped phase V_π");
  // Clamped: 534.054 − 141.766 = 392.288 pm/V → 80.655 V, about 3.2× the unclamped value.
  const c = POCKELS["batio3-clamped"].r;
  assertRel(transverseHalfWaveVoltage(632.8e-9, no, ne, c.r33!, c.r13!, 1e-3, 0.02), 80.655, 1e-4, "clamped retardation V_π");
  // Wemple's fit covers 0.4–0.7 µm only.
  assert.deepEqual(POCKELS.batio3.range, [400e-9, 700e-9]);
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

// ------------------------------------------------------------------ anisotropic grating (Feinberg et al. 1980)

/**
 * Independent check of eWaveEffectiveCoefficient: Feinberg et al. 1980 eqs. 13 and 19, |ê₁·ε_ω(R·K̂)ε_ω·ê₂ (ê₁·ê₂)| / n⁴,
 * summed over the full 4mm tensor (r_xxz = r_yyz = r₁₃, r_zzz = r₃₃, r_xzx = r_zxx = r_yzy = r_zyy = r₄₂) for beams at
 * ψ ∓ θ from c in the x–z plane, ψ = 90° − β, ê = (cos a, 0, −sin a), K = k₂ − k₁.
 */
function tensorSum(no: number, ne: number, r13: number, r33: number, r42: number, beta: number, theta: number): number {
  const r = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => [0, 0, 0]));
  r[0][0][2] = r[1][1][2] = r13;
  r[2][2][2] = r33;
  r[0][2][0] = r[2][0][0] = r[1][2][1] = r[2][1][1] = r42;
  const eps = [no ** 2, no ** 2, ne ** 2];
  const psi = Math.PI / 2 - beta;
  const k = (a: number) => [Math.sin(a), 0, Math.cos(a)];
  const e = (a: number) => [Math.cos(a), 0, -Math.sin(a)];
  const K = k(psi + theta).map((v, i) => v - k(psi - theta)[i]);
  const Kn = Math.hypot(...K);
  const [e1, e2] = [e(psi - theta), e(psi + theta)];
  let sum = 0;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let l = 0; l < 3; l++) sum += eps[i] * eps[j] * r[i][j][l] * (K[l] / Kn) * e1[i] * e2[j];
  const contrast = e1[0] * e2[0] + e1[2] * e2[2];
  return Math.abs(sum * contrast) / extraordinaryIndex(no, ne, psi) ** 4;
}

test("BaTiO₃ static permittivities: Zgonik et al. 1994 ε^T (Table III) and ε^S (Table II); ε_K along K (Feinberg eq. 7)", () => {
  assert.deepEqual([POCKELS.batio3.epsilon11, POCKELS.batio3.epsilon], [4400, 129]);
  assert.deepEqual([POCKELS["batio3-clamped"].epsilon11, POCKELS["batio3-clamped"].epsilon], [2200, 56]);
  assert.deepEqual([POCKELS.batio3.r.r42! * 1e12, POCKELS["batio3-clamped"].r.r42! * 1e12], [1300, 730]);
  // ε₁₁ sin²β + ε₃₃ cos²β: K ∥ c gives ε₃₃, K ⟂ c gives ε₁₁, 45° the mean (4400 + 129)/2 = 2264.5.
  assert.equal(gratingPermittivity(4400, 129, 0), 129);
  assertRel(gratingPermittivity(4400, 129, Math.PI / 2), 4400, 1e-12, "K ⟂ c");
  assertRel(gratingPermittivity(4400, 129, 45 * deg), 2264.5, 1e-12, "45°");
  // e-index: n_o along c, n_e across it; at 45°, 1/n² = ½(1/2.404309² + 1/2.360585²) = 0.1762235 → n = 2.382146.
  assertRel(extraordinaryIndex(2.404309, 2.360585, 0), 2.404309, 1e-12, "along c");
  assertRel(extraordinaryIndex(2.404309, 2.360585, Math.PI / 2), 2.360585, 1e-12, "across c");
  assertRel(extraordinaryIndex(2.404309, 2.360585, 45 * deg), 2.382146, 1e-6, "45°");
});

test("e-wave r_eff(β, θ): closed form equals the full 4mm tensor sum (Feinberg et al. 1980 eqs. 13, 19)", () => {
  const { no, ne } = POCKELS.batio3.indices(632.8e-9);
  const { r13, r33, r42 } = POCKELS.batio3.r;
  for (const b of [0, 10, 30, 45, 54.7, 70, 89]) {
    for (const t of [0.5, 3, 10, 20, -15]) { // θ = 0 leaves K = k₂ − k₁ undefined in the sum; the hand test covers it
      const closed = eWaveEffectiveCoefficient(no, ne, r13!, r33!, r42!, b * deg, t * deg);
      assertRel(closed, tensorSum(no, ne, r13!, r33!, r42!, b * deg, t * deg), 1e-10, `β ${b}°, θ ${t}°`);
    }
  }
});

test("e-wave r_eff by hand: BaTiO₃ at 45°, LiNbO₃ along c, and the limits", () => {
  // BaTiO₃ unclamped at 632.8 nm (n_o 2.404309, n_e 2.360585), β = 45°, θ = 0: n_o⁴ = 33.41652, n_o²n_e² = 32.21215,
  // n_e⁴ = 31.05120; bracket = 33.41652·8·½ + 2·32.21215·1300·½ + 31.05120·105·½ = 43639.6 pm/V; × cos 45° = 30857.6;
  // ÷ n⁴ = 32.20116 (n = 2.382146 along the bisector) = 958.28 pm/V.
  const { no, ne } = POCKELS.batio3.indices(632.8e-9);
  const u = POCKELS.batio3.r;
  assertRel(eWaveEffectiveCoefficient(no, ne, u.r13!, u.r33!, u.r42!, 45 * deg, 0), 958.28e-12, 2e-5, "BaTiO₃ 45°");
  // θ = 10°: sin²θ = 0.0301537, bracket 125.60 + 41875.8 + 1531.88 = 43533.3, × cos 45° × cos 20° ÷ 32.20116 = 898.29 pm/V.
  assertRel(eWaveEffectiveCoefficient(no, ne, u.r13!, u.r33!, u.r42!, 45 * deg, 10 * deg), 898.29e-12, 2e-5, "BaTiO₃ 45°, θ 10°");
  // Edge: K ∥ c and collinear beams leave r₃₃ alone; K ⟂ c gives no coupling.
  assertRel(eWaveEffectiveCoefficient(no, ne, u.r13!, u.r33!, u.r42!, 0, 0), 105e-12, 1e-12, "β = 0");
  assert.ok(eWaveEffectiveCoefficient(no, ne, u.r13!, u.r33!, u.r42!, Math.PI / 2, 5 * deg) < 1e-24, "β = 90°");
  // LiNbO₃-like, K ∥ c, n_o = n_e = 2.2, θ = 10°: cos 20° (30.8 cos²10° − 8.6 sin²10°) = 0.9396926 · 29.611945 = 27.8261 pm/V,
  // 9.7 % below r₃₃ (the page's former fixed-r₃₃ model).
  assertRel(eWaveEffectiveCoefficient(2.2, 2.2, 8.6e-12, 30.8e-12, 0, 0, 10 * deg), 27.8261e-12, 1e-5, "K ∥ c");
  assert.ok(Number.isNaN(eWaveEffectiveCoefficient(no, ne, u.r13!, u.r33!, u.r42!, 100 * deg, 0)), "β outside [0, 90°]");
});

test("BaTiO₃ two-beam gain, 632.8 nm, 2θ = 20° outside, β = 45°, 295 K, N_eff 1e22 m⁻³ (page chain)", () => {
  // Λ = 632.8 nm/(2 sin 10°) = 1.822075 µm; E_D = 2π k_BT/(qΛ) = 87.661 kV/m; ε_K = 2264.5 (unclamped) gives
  // E_q = qNΛ/(2πε₀ε_K) = 23.173 kV/m, E_sc = 18.328 kV/m; θ_in = asin(sin 10°/2.382146) = 4.1803°;
  // r_eff = 947.69 pm/V; Γ = 2π · 2.382146³ · 947.69e-12 · 18328 / (632.8e-9 · cos 4.1803°) = 23.375 cm⁻¹.
  const c = POCKELS.batio3;
  const { no, ne } = c.indices(632.8e-9);
  const beta = 45 * deg;
  const n = extraordinaryIndex(no, ne, Math.PI / 2 - beta);
  const thetaIn = Math.asin(Math.sin(10 * deg) / n);
  const period = gratingPeriod(632.8e-9, 10 * deg);
  const Eq = trapLimitedField(period, 1e22, gratingPermittivity(c.epsilon11!, c.epsilon, beta));
  assertRel(Eq, 23172.7, 1e-5, "E_q");
  const Esc = spaceChargeField(diffusionField(period, 295), Eq);
  const rEff = eWaveEffectiveCoefficient(no, ne, c.r.r13!, c.r.r33!, c.r.r42!, beta, thetaIn);
  assertRel(rEff, 947.69e-12, 1e-5, "r_eff");
  assertRel(twoBeamCouplingGain(632.8e-9, n, rEff, Esc, thetaIn) / 100, 23.375, 1e-4, "Γ");
});
