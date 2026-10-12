import test from "node:test";
import assert from "node:assert/strict";

import {
  SMF28_THERMAL_COEFFICIENT, braggShift, braggWavelength, chirpedBandwidth, chirpedGratingDispersion,
  couplingCoefficient, defaultSectionCount, detuning, effectivePhotoelastic, maxChirp, firstZeroBandwidth, gratingSections, peakReflectance,
  phaseStrainSensitivity, phaseTemperatureSensitivity, spectrumFwhm, strainGaugeFactor, transferMatrixReflectance,
  uniformFwhm, uniformGratingReflectance, uniformReflectance, wavelengthAtDetuning,
} from "../src/physics/fiber-optics/fiber-bragg-grating";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Erdogan, J. Lightwave Technol. 15, 1277 (1997), doi:10.1109/50.618322, uniform grating:
// Δn 1e-4, L 10 mm, n_eff 1.468, λ_B 1550 nm → κL = π·1e-4·0.01/1550e-9 = 2.026834.
const G = { lambdaB: 1550e-9, nEff: 1.468, length: 0.01, deltaN: 1e-4 };
const KAPPA_L = couplingCoefficient(G.deltaN, G.lambdaB) * G.length;

test("uniform grating: peak, band edge and the closed form against Erdogan eq. 20", () => {
  assertRel(KAPPA_L, 2.026834, 1e-6, "κL");
  // tanh²(2.026834) = 0.932915.
  assertRel(peakReflectance(KAPPA_L), 0.932915, 1e-6, "R₀");
  assertRel(uniformReflectance(KAPPA_L, 0), 0.932915, 1e-6, "R(σ̂ = 0)");
  // Band edge γ = 0: R = (κL)²/(1 + (κL)²) = 4.10805/5.10805 = 0.804231 (the old page gave 0.008).
  assertRel(uniformReflectance(KAPPA_L, KAPPA_L), 0.804231, 1e-5, "R(σ̂ = κ)");
  // Eq. 20 typed directly, inside and outside the band.
  for (const sL of [0.7, 1.9, 2.5, 6]) {
    const gSq = KAPPA_L ** 2 - sL ** 2;
    const eq20 = gSq > 0
      ? Math.sinh(Math.sqrt(gSq)) ** 2 / (Math.cosh(Math.sqrt(gSq)) ** 2 - sL ** 2 / KAPPA_L ** 2)
      : Math.sin(Math.sqrt(-gSq)) ** 2 / (sL ** 2 / KAPPA_L ** 2 - Math.cos(Math.sqrt(-gSq)) ** 2); // sinh(iθ) = i sin θ
    assertRel(uniformReflectance(KAPPA_L, sL), eq20, 1e-12, `eq. 20 at σ̂L = ${sL}`);
  }
  // First zero γL = iπ and the weak/strong limits.
  assert.ok(uniformReflectance(KAPPA_L, Math.hypot(KAPPA_L, Math.PI)) < 1e-30, "first zero");
  assert.equal(uniformReflectance(0, 1), 0);
  assert.equal(uniformReflectance(800, 0), 1, "κL = 800 doesn't overflow");
  assert.ok(Number.isNaN(uniformReflectance(-1, 0)));
});

test("uniform grating: first-zero width and FWHM", () => {
  // Erdogan: Δλ₀ = λ(Δn/n_eff)√(1 + (λ/(ΔnL))²) = 1550·(1e-4/1.468)·√(1 + 1.55²) nm = 0.194762 nm.
  assertRel(firstZeroBandwidth(G), 0.19476222e-9, 1e-6, "Δλ₀");
  // FWHM: a 0.2 fm scan of eq. 20 for R ≥ R₀/2 gives 0.1477758 nm (the old page printed 0.195 nm as "FWHM").
  assertRel(uniformFwhm(G), 0.1477758e-9, 1e-5, "FWHM");
  assertRel(uniformGratingReflectance(G, wavelengthAtDetuning(0, G.lambdaB, G.nEff)), 0.932915, 1e-6, "R at λ_B");
  // detuning and its inverse round-trip.
  const s = detuning(1550.07e-9, G.lambdaB, G.nEff);
  assertRel(wavelengthAtDetuning(s, G.lambdaB, G.nEff), 1550.07e-9, 1e-14, "λ(σ̂(λ))");
  assert.ok(Number.isNaN(uniformFwhm({ ...G, deltaN: 0 })));
});

/**
 * Independent model: RK4 integration of Erdogan's coupled-mode equations dR/dz = iσ̂R + iκS, dS/dz = −iσ̂S − iκR
 * from z = L/2 (R = 1, S = 0) back to −L/2, r = S/R, with κ(z) and λ_B(z) continuous (no sections).
 */
function coupledModeReflectance(kappa: (z: number) => number, lambdaB: (z: number) => number, lambda: number) {
  const L = G.length, N = 20000, h = -L / N;
  const f = (z: number, y: number[]) => {
    const sg = detuning(lambda, lambdaB(z), G.nEff), k = kappa(z);
    const [rr, ri, sr, si] = y;
    return [-sg * ri - k * si, sg * rr + k * sr, sg * si + k * ri, -sg * sr - k * rr];
  };
  let y = [1, 0, 0, 0], z = L / 2;
  const axpy = (a: number[], b: number[], t: number) => a.map((v, i) => v + t * b[i]);
  for (let i = 0; i < N; i++) {
    const k1 = f(z, y), k2 = f(z + h / 2, axpy(y, k1, h / 2)), k3 = f(z + h / 2, axpy(y, k2, h / 2)), k4 = f(z + h, axpy(y, k3, h));
    y = y.map((v, j) => v + (h / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
    z += h;
  }
  return (y[2] ** 2 + y[3] ** 2) / (y[0] ** 2 + y[1] ** 2);
}

test("transfer matrices match the closed form and an RK4 coupled-mode integration", () => {
  const k0 = couplingCoefficient(G.deltaN, G.lambdaB);
  for (const lam of [1550e-9, 1550.05e-9, 1550.1e-9, 1550.3e-9]) {
    const closed = uniformGratingReflectance(G, lam);
    const one = transferMatrixReflectance([{ length: G.length, kappa: k0, lambdaB: G.lambdaB }], G.nEff, lam);
    const many = transferMatrixReflectance(gratingSections({ ...G, apodization: "uniform" }), G.nEff, lam);
    assertRel(one, closed, 1e-9, `1 section at ${lam}`);
    assertRel(many, closed, 1e-9, `200 sections at ${lam}`);
  }
  // Gaussian apodization, FWHM L/2: 200 sections vs the continuous profile (RK4 values 0.616520, 0.476241, 0.124602).
  const gauss = gratingSections({ ...G, apodization: "gaussian" });
  const kz = (z: number) => k0 * Math.exp((-4 * Math.LN2 * z * z) / (G.length / 2) ** 2);
  for (const lam of [1550e-9, 1550.05e-9, 1550.1e-9]) {
    assertRel(transferMatrixReflectance(gauss, G.nEff, lam), coupledModeReflectance(kz, () => G.lambdaB, lam), 2e-4, `gauss ${lam}`);
  }
  // Linear chirp 0.1 nm/mm (1e-7 m/m) over 10 mm.
  const chirped = gratingSections({ ...G, apodization: "uniform", chirp: 1e-7 });
  for (const lam of [1550e-9, 1550.3e-9, 1549.6e-9]) {
    const ode = coupledModeReflectance(() => k0, (z) => G.lambdaB + 1e-7 * z, lam);
    assertRel(transferMatrixReflectance(chirped, G.nEff, lam), ode, 1e-5, `chirp ${lam}`);
  }
  // Apodization narrows the peak but removes the side lobes: R(λ_B) 0.6165, FWHM 0.1482 nm.
  assertRel(spectrumFwhm((l) => transferMatrixReflectance(gauss, G.nEff, l), 1549e-9, 1551e-9), 0.148243e-9, 1e-3, "gauss FWHM");
  // Second side lobe of the uniform grating, +0.21 nm: R ≈ 0.056 uniform, < 1e-3 apodized.
  assert.ok(uniformGratingReflectance(G, 1550.21e-9) > 0.04, "uniform side lobe");
  assert.ok(transferMatrixReflectance(gauss, G.nEff, 1550.21e-9) < 1e-3, "apodized side lobe suppressed");
});

test("chirped grating: Landau–Zener plateau and section count", () => {
  // A long linear chirp sweeps σ̂ through the band at dσ̂/dz = 2πn_eff·chirp/λ², so mid-band light is reflected with the
  // Landau–Zener probability 1 − exp(−πκ²/(dσ̂/dz)). Δn 3e-4, 1 nm/mm, L 100 mm, n_eff 1.447:
  // κ = 608.04 1/m, dσ̂/dz = 3.7843e6 1/m², πκ²/(dσ̂/dz) = 0.30690 → R = 0.26430.
  const p = { lambdaB: 1550e-9, nEff: 1.447, length: 0.1, deltaN: 3e-4, apodization: "uniform" as const, chirp: 1e-6 };
  const kappa = couplingCoefficient(p.deltaN, p.lambdaB);
  const rate = (2 * Math.PI * p.nEff * p.chirp) / p.lambdaB ** 2;
  const lz = 1 - Math.exp((-Math.PI * kappa * kappa) / rate);
  assertRel(lz, 0.26430, 1e-4, "Landau–Zener");
  // 4L√(n·chirp)/λ = 310.4 → 311 sections.
  assert.equal(defaultSectionCount(p), 311);
  const sections = gratingSections(p);
  let sum = 0;
  for (let i = 0; i <= 400; i++) sum += transferMatrixReflectance(sections, p.nEff, 1550e-9 + (-30 + (60 * i) / 400) * 1e-9);
  assertRel(sum / 401, lz, 0.005, "mean R over the central 60 % of the band");
  // Chirp limit |chirp|·L ≤ 0.1 λ_B: 1.55e-6 m/m for 100 mm.
  assertRel(maxChirp(1550e-9, 0.1), 1.55e-6, 1e-12, "max chirp");
});

test("transfer matrices: very strong sections don't overflow", () => {
  // κ = π·1e-2/200e-9 = 1.5708e5 1/m; 200 sections of 5 mm give κΔz = 785 (cosh would overflow at 710).
  const g = { lambdaB: 200e-9, nEff: 1.447, length: 1, deltaN: 1e-2 };
  const sections = gratingSections({ ...g, apodization: "uniform" });
  for (const lam of [200e-9, 200.5e-9, 201e-9, 202e-9]) {
    const R = transferMatrixReflectance(sections, g.nEff, lam);
    assert.ok(Number.isFinite(R), `finite at ${lam}`);
    assert.ok(Math.abs(R - uniformGratingReflectance(g, lam)) < 1e-9, `closed form at ${lam}`);
  }
});

test("chirped grating: bandwidth and dispersion (Ouellette 1987)", () => {
  assertRel(chirpedBandwidth(1e-7, 0.01), 1e-9, 1e-12, "Δλ_chirp");
  // 2·1.468/(c·1e-7) = 9.79344e-11 s/m = 97.934 ps/nm: the 2n_eff L/c round trip spread over 1 nm.
  assertRel(chirpedGratingDispersion(1.468, 1e-7) * 1e3, 97.9344, 1e-5, "D ps/nm");
  assert.equal(chirpedGratingDispersion(1.468, 0), Infinity);
});

test("strain and temperature response (Kersey 1997; Bertholds & Dändliker 1988; Cosme et al. 2026)", () => {
  // p_e = (1.447²/2)(0.252 − 0.16·0.365) = 1.0469045·0.1936 = 0.202681; 1 − p_e = 0.797319.
  assertRel(effectivePhotoelastic(1.447), 0.2026807, 1e-6, "p_e");
  assertRel(strainGaugeFactor(1.447), 0.7973193, 1e-7, "1 − p_e");
  // At 1550 nm: 1.23584 pm/µε and K_T·λ = 6.165e-6·1550 nm = 9.5558 pm/K (Cosme et al.: 9.31–9.63 pm/K at ≈ 1540 nm).
  const gauge = strainGaugeFactor(1.447);
  assertRel(braggShift(1550e-9, 1e-6, 0, gauge, SMF28_THERMAL_COEFFICIENT), 1.235845e-12, 1e-6, "pm/µε");
  assertRel(braggShift(1550e-9, 0, 1, gauge, SMF28_THERMAL_COEFFICIENT), 9.55575e-12, 1e-6, "pm/K");
  assertRel(braggShift(1550e-9, 500e-6, 20, gauge, SMF28_THERMAL_COEFFICIENT), 500 * 1.235845e-12 + 20 * 9.55575e-12, 1e-6, "sum");
  // Bragg wavelength of a 535.6 nm period at n_eff 1.447: 1550.026 nm.
  assertRel(braggWavelength(1.447, 535.6e-9), 1550.0264e-9, 1e-8, "λ_B");
});

test("interferometer arm: phase per microstrain and per kelvin", () => {
  // 2π·1.447·0.01·0.797319/1550e-9 = 46768.0 rad per unit strain → 0.046768 rad/µε (old page: 0 rad/µε).
  const gauge = strainGaugeFactor(1.447);
  assertRel(phaseStrainSensitivity(1550e-9, 1.447, 0.01, gauge) * 1e-6, 0.0467680, 1e-5, "rad/µε");
  // 2π·1.447·0.01·6.165e-6/1550e-9 = 0.361618 rad/K.
  assertRel(phaseTemperatureSensitivity(1550e-9, 1.447, 0.01, SMF28_THERMAL_COEFFICIENT), 0.361618, 1e-5, "rad/K");
});
