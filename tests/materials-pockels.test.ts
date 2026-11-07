import test from "node:test";
import assert from "node:assert/strict";

import {
  POCKELS, balancedGratingPeriod, crossedPolarizerTransmission, cubicCoefficients, cubicHalfWaveVoltage, diffusionField, eWaveEffectiveCoefficient,
  extraordinaryIndex, gratingPeriod, gratingPermittivity, gyrotropicTransmission, longitudinalHalfWaveVoltage, phaseHalfWaveVoltage, pockelsIndexChange, spaceChargeField, transverseCoefficients, transverseHalfWaveVoltage, trapLimitedField, twoBeamCouplingGain, twoBeamSignalGain,
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

test("KD*P and ADP n_o: Kirby & DeShazer 1987 and Zernike 1964 fits, with V_π at 1064 nm by hand", () => {
  const kdpd = POCKELS["kdp-d"], adp = POCKELS.adp;
  // KD*P n_o = 1.4931 at 1.06 µm, measured (EKSMA Optics KDP/DKDP data sheet); vendor table (United Crystals,
  // "Properties of KDP, DKDP and ADP") 1.5074, 1.5257, 1.5539 at 532, 355, 266 nm.
  assertRel(kdpd.indices(1064e-9).no, 1.4931, 1e-4, "KD*P 1064 nm");
  assertRel(kdpd.indices(532e-9).no, 1.5074, 5e-4, "KD*P 532 nm");
  assertRel(kdpd.indices(355e-9).no, 1.5257, 5e-4, "KD*P 355 nm");
  assertRel(kdpd.indices(266e-9).no, 1.5539, 5e-4, "KD*P 266 nm");
  // ADP: Zhu et al., Chin. Opt. Lett. 13, 041601 (2015), Table 1 (A 2.29933, B 0.61290, C 18.52848, D 0.01143,
  // E 0.01245, n² = A + Bλ²/(λ² − C) + D/(λ² − E)) gives 1.50654 at 1064 nm; United Crystals 1.5280 at 532 nm.
  assertRel(adp.indices(1064e-9).no, 1.50654, 1e-4, "ADP 1064 nm");
  assertRel(adp.indices(532e-9).no, 1.5280, 5e-4, "ADP 532 nm");
  // λ/(2 n_o³ r₆₃) at 1064 nm: 1.064e-6 / (2 · 1.49311³ · 26.4e-12) = 6054 V for KD*P, and 1.50663 → 18 301 V for ADP.
  assertRel(longitudinalHalfWaveVoltage(1064e-9, kdpd.indices(1064e-9).no, kdpd.r.r63!), 6054, 1e-3, "KD*P V_π");
  assertRel(longitudinalHalfWaveVoltage(1064e-9, adp.indices(1064e-9).no, adp.r.r63!), 18301, 1e-3, "ADP V_π");
  // Both ranges now reach the Nd:YAG line.
  assert.ok(kdpd.range[0] <= 266e-9 && kdpd.range[1] >= 1064e-9 && adp.range[1] >= 1064e-9);
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

test("LiTaO₃: Casson et al. 2004 Table 2 r(λ), Bond 1965 indices and a 1558 nm modulator by hand", () => {
  const c = POCKELS.litao3;
  // Table 2: λ (nm), n_e, r₃₃, n_o, r₁₃ (pm/V). Its indices are Gervais & Fonseca's (Palik), independent of Bond's table.
  const table = [[632.8, 2.1809, 30.5, 2.1763, 7.62], [980, 2.1443, 29.6, 2.1402, 6.96], [1330, 2.1296, 27.7, 2.1259, 6.55], [1558, 2.1224, 27.4, 2.1186, 6.92]];
  for (const [l, ne, r33, no, r13] of table) {
    const n = c.indices(l * 1e-9);
    assert.ok(Math.abs(n.ne - ne) < 3e-4 && Math.abs(n.no - no) < 3e-4, `${l} nm: ${n.no}, ${n.ne}`);
    const r = transverseCoefficients(c, l * 1e-9);
    assertRel(r.r33, r33 * 1e-12, 1e-12, `r₃₃ ${l}`);
    assertRel(r.r13, r13 * 1e-12, 1e-12, `r₁₃ ${l}`);
  }
  // Linear in λ at 800 nm: 30.5 − 0.9 · 167.2/347.2 = 30.066590, 7.62 − 0.66 · 167.2/347.2 = 7.302166 pm/V.
  const r800 = transverseCoefficients(c, 800e-9);
  assertRel(r800.r33, 30.06659e-12, 1e-6, "r₃₃ 800");
  assertRel(r800.r13, 7.302166e-12, 1e-6, "r₁₃ 800");
  // Bond's 800 nm row: n_o 2.1538, n_e 2.1578 (a table node, so exact).
  assertRel(c.indices(800e-9).ne, 2.1578, 1e-12, "n_e 800");
  // 1558 nm, d = 1 mm, L = 20 mm: n_e = 2.122371, n_o = 2.118507 (1/λ² between Bond's 1.4 and 1.6 µm rows), so
  // n_e³r₃₃ − n_o³r₁₃ = 9.560132 · 27.4 − 9.508010 · 6.92 = 196.1522 pm/V and V_π = 1558e-9 · 1e-3 / (196.1522e-12 · 0.02) = 397.14 V.
  const n = c.indices(1558e-9);
  assertRel(transverseHalfWaveVoltage(1558e-9, n.no, n.ne, 27.4e-12, 6.92e-12, 1e-3, 20e-3), 397.14, 1e-4, "V_π 1558");
  // The coefficients exist only between the measured wavelengths; the other crystals keep their single r.
  assert.ok(Number.isNaN(transverseCoefficients(c, 620e-9).r33) && Number.isNaN(transverseCoefficients(c, 1600e-9).r13));
  assert.deepEqual(transverseCoefficients(POCKELS.linbo3, 1550e-9), { r33: 30.8e-12, r13: 8.6e-12 });
});

test("crossed polarizers: T = sin²(Γ/2) is 0 at Γ = 0, ½ at π/2 and 1 at π", () => {
  assert.equal(crossedPolarizerTransmission(0), 0);
  assertRel(crossedPolarizerTransmission(Math.PI / 2), 0.5, 1e-12, "π/2");
  assertRel(crossedPolarizerTransmission(Math.PI), 1, 1e-12, "π");
});

test("BSO: Efremidis et al. 2009 Fig. 3 r₄₁, n and ρ, and a 633 nm modulator by hand", () => {
  const c = POCKELS.bso;
  // Their text: r₄₁ 4.2–2.0 pm/V over 500–800 nm (average error 0.1 pm/V) and optical activity 40–12 °/mm.
  const at = (nm: number) => cubicCoefficients(c, nm * 1e-9);
  const degPerMm = (rho: number) => (rho * 1e-3) / deg;
  assert.ok(Math.abs(at(500).r41 * 1e12 - 4.2) <= 0.1 && Math.abs(at(800).r41 * 1e12 - 2.0) <= 0.1, "r₄₁ ends");
  assert.ok(Math.abs(degPerMm(at(500).rotation) - 40) <= 0.1 && Math.abs(degPerMm(at(800).rotation) - 12) <= 0.2, "ρ ends");
  // 633 nm, linear between the 620 and 640 nm nodes (weight 0.65): r₄₁ = 2.93 − 0.31 · 0.65 = 2.7285 pm/V,
  // n = 2.5667 − 0.0103 · 0.65 = 2.560005, ρ = 22.32 − 1.75 · 0.65 = 21.1825 °/mm.
  const { r41, rotation } = at(633);
  const n = c.indices(633e-9).no;
  assertRel(r41, 2.7285e-12, 1e-9, "r₄₁ 633");
  assertRel(n, 2.560005, 1e-9, "n 633");
  assertRel(degPerMm(rotation), 21.1825, 1e-9, "ρ 633");
  // d = 1 mm, L = 10 mm: n³ = 16.777314, V_π = 633e-9 · 1e-3 / (2 · 16.777314 · 2.7285e-12 · 0.01) = 691.397 V.
  assertRel(cubicHalfWaveVoltage(633e-9, n, r41, 1e-3, 10e-3), 691.397, 1e-5, "V_π 633");
  assertRel(phaseHalfWaveVoltage(633e-9, n, r41, 1e-3, 10e-3), 2 * 691.397, 1e-5, "phase V_π");
  // The table spans 500–800 nm only; the other crystals have no cubic coefficients.
  assert.ok(Number.isNaN(at(499).r41) && Number.isNaN(at(801).rotation) && Number.isNaN(c.indices(801e-9).no));
  assert.ok(Number.isNaN(cubicCoefficients(POCKELS.linbo3, 633e-9).r41));
  assert.ok(Number.isNaN(cubicHalfWaveVoltage(633e-9, n, 0, 1e-3, 1e-2)), "r₄₁ = 0");
});

test("optically active crystal: closed-form Jones transmission equals a thin-slab product, with the limits", () => {
  // Independent check: N symmetric slices (half rotation, retarder, half rotation) of the same crystal, analyzer at 90° + ρL.
  function slices(G: number, b: number, N: number): number {
    const a = G / 2 / N, h = b / 2 / N;
    let [xr, xi, yr, yi] = [1, 0, 0, 0];
    const rotate = (t: number) => {
      [xr, xi, yr, yi] = [Math.cos(t) * xr - Math.sin(t) * yr, Math.cos(t) * xi - Math.sin(t) * yi, Math.sin(t) * xr + Math.cos(t) * yr, Math.sin(t) * xi + Math.cos(t) * yi];
    };
    for (let k = 0; k < N; k++) {
      rotate(h);
      // [[cos a, −i sin a], [−i sin a, cos a]]
      [xr, xi, yr, yi] = [Math.cos(a) * xr + Math.sin(a) * yi, Math.cos(a) * xi - Math.sin(a) * yr, Math.cos(a) * yr + Math.sin(a) * xi, Math.cos(a) * yi - Math.sin(a) * xr];
      rotate(h);
    }
    return (-Math.sin(b) * xr + Math.cos(b) * yr) ** 2 + (-Math.sin(b) * xi + Math.cos(b) * yi) ** 2;
  }
  for (const [G, b] of [[1.3, 0.9], [Math.PI, 2.5], [0.2, 7.4], [Math.PI, 3.697]]) {
    assert.ok(Math.abs(gyrotropicTransmission(G, b) - slices(G, b, 4000)) < 1e-6, `Γ ${G}, ρL ${b}`);
  }
  // No rotation: sin²(Γ/2). No field: the analyzer blocks the rotated light. Γ → 0 uses the sinc series.
  assertRel(gyrotropicTransmission(Math.PI / 2, 0), 0.5, 1e-12, "ρ = 0");
  assert.ok(gyrotropicTransmission(0, 3) < 1e-30, "Γ = 0");
  assert.ok(gyrotropicTransmission(1e-9, 0) < 1e-18, "Γ, ρ → 0");
  assert.ok(Number.isNaN(gyrotropicTransmission(NaN, 1)));
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
