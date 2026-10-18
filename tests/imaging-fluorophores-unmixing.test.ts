import test from "node:test";
import assert from "node:assert/strict";

import { erf, integrateTanhSinh, largestSymmetricEigenvalue, symmetricEigenvalues } from "../src/physics/math";
import { cameraSnr } from "../src/physics/detectors/camera-snr";
import { createRng } from "../src/physics/random";
import {
  FLUOROPHORES, FORSTER_PREFACTOR_NM, bandAtWavelength, emissionFraction, fluorophoreByName, forsterOverlap, forsterRadius,
  fretEfficiency, integrateSpectrum, logNormalBand, relativeSignal,
} from "../src/physics/imaging/fluorophores";
import { conditionNumber, fcls, nnls, ols, olsCovariance, shareStdDev, simulateMixture } from "../src/physics/imaging/linear-unmixing";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}
function assertAbs(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual - expected) < tol, `${label}: ${actual} vs ${expected}`);
}
const nm = 1e-9;

test("Siano–Metzler band: half maximum at the two half-widths, Gaussian limit at ρ = 1", () => {
  // High-ν half-width ρH/(1 + ρ), low-ν half-width H/(1 + ρ) (Siano & Metzler 1969).
  for (const f of FLUOROPHORES) {
    for (const b of [f.ex, f.em]) {
      assertAbs(logNormalBand(b, b.peak_cm1), 1, 1e-12, `${f.name} peak`);
      assertAbs(logNormalBand(b, b.peak_cm1 + (b.fwhm_cm1 * b.skew) / (1 + b.skew)), 0.5, 1e-12, `${f.name} high half`);
      assertAbs(logNormalBand(b, b.peak_cm1 - b.fwhm_cm1 / (1 + b.skew)), 0.5, 1e-12, `${f.name} low half`);
    }
  }
  const g = { peak_cm1: 20000, fwhm_cm1: 1000, skew: 1 };
  assertAbs(logNormalBand(g, 20300), Math.exp(-4 * Math.LN2 * 0.09), 1e-15, "Gaussian");
  assertAbs(logNormalBand({ ...g, skew: 1 + 1e-6 }, 20300), logNormalBand(g, 20300), 1e-6, "ρ → 1 continuity");
  assert.ok(Number.isNaN(logNormalBand({ ...g, fwhm_cm1: 0 }, 20000)), "zero width");
});

test("FPbase catalogue: fitted maxima within 10 nm of the listed peaks", () => {
  for (const f of FLUOROPHORES) {
    assert.ok(Math.abs(1e7 / f.ex.peak_cm1 - f.exPeak_nm) <= 10, `${f.name} ex`);
    assert.ok(Math.abs(1e7 / f.em.peak_cm1 - f.emPeak_nm) <= 10, `${f.name} em`);
  }
  // EGFP on FPbase: 488/507 nm, ε 55 900 M⁻¹cm⁻¹, Φ 0.60, brightness 33.54.
  const egfp = fluorophoreByName("EGFP");
  assert.equal(egfp.extinction * egfp.quantumYield / 1000, 33.54);
  assert.equal(fluorophoreByName("unknown").name, FLUOROPHORES[0].name);
});

test("Spectral integration: a Gaussian over ±HWHM holds erf(√ln2) = 0.760968", () => {
  const sigma = 10 * nm;
  const fwhm = 2 * Math.sqrt(2 * Math.LN2) * sigma;
  const g = (l: number) => Math.exp(-((l - 500 * nm) ** 2) / (2 * sigma * sigma));
  const frac = integrateSpectrum(g, 500 * nm - fwhm / 2, 500 * nm + fwhm / 2) / integrateSpectrum(g);
  assertAbs(frac, erf(Math.sqrt(Math.LN2)), 1e-8, "Gaussian window");
  assertAbs(erf(Math.sqrt(Math.LN2)), 0.760968, 1e-6, "erf(√ln2)");
});

test("Emission fraction agrees with an independent tanh-sinh quadrature", () => {
  for (const [name, lo, hi] of [["EGFP", 500, 550], ["mCherry", 572.5, 647.5], ["mTagBFP2", 425, 475]] as const) {
    const em = fluorophoreByName(name).em;
    const f = (l: number) => bandAtWavelength(em, l);
    // The band is zero above ν_c = ν_m − ρH/(ρ² − 1); tanh-sinh needs the support, not the flat zero part.
    const cutoff = 0.01 / (em.peak_cm1 - (em.skew * em.fwhm_cm1) / (em.skew ** 2 - 1));
    const ref = integrateTanhSinh(f, lo * nm, hi * nm) / integrateTanhSinh(f, Math.max(300 * nm, cutoff), 1000 * nm);
    assertRel(emissionFraction(em, lo * nm, hi * nm), ref, 1e-8, name);
  }
  assert.ok(Number.isNaN(emissionFraction(fluorophoreByName("EGFP").em, 550 * nm, 500 * nm)), "inverted window");
});

test("Model spectra against the raw FPbase spectra (direct integration, 2026-10-18)", () => {
  // Raw FPbase spectra, trapezoid on 300–1000 nm: EGFP → mCherry R₀ = 5.109 nm (κ² = 2/3, n = 1.4);
  // fraction of EGFP emission in 500–550 nm 0.7065, of mCherry in 572.5–647.5 nm 0.6627.
  const egfp = fluorophoreByName("EGFP");
  const mcherry = fluorophoreByName("mCherry");
  assertRel(forsterRadius(forsterOverlap(egfp, mcherry), egfp.quantumYield), 5.109 * nm, 0.02, "R₀ EGFP → mCherry");
  assertAbs(emissionFraction(egfp.em, 500 * nm, 550 * nm), 0.7065, 0.06, "EGFP 525/50");
  assertAbs(emissionFraction(mcherry.em, 572.5 * nm, 647.5 * nm), 0.6627, 0.01, "mCherry 610/75");
  // FPbase EGFP excitation at 405 nm is 0.173 of its peak; the fit gives 0.14.
  assertAbs(bandAtWavelength(egfp.ex, 405 * nm), 0.173, 0.04, "EGFP at 405 nm");
});

test("Förster prefactor 0.02108 nm and FRET efficiency (Lakowicz §13.2; Braslavsky et al. 2008)", () => {
  assertRel(FORSTER_PREFACTOR_NM, 0.02108, 3e-4, "prefactor");
  // R₀ = 0.02108·(κ² Φ n⁻⁴ J)^(1/6) nm: J = 1e15, κ² = 2/3, Φ = 1, n = 1.4 → (1.7354e14)^(1/6) = 236.0 → 4.976 nm.
  assertRel(forsterRadius(1e15, 1), 0.021084 * ((2 / 3) * 1e15 / 1.4 ** 4) ** (1 / 6) * nm, 1e-4, "R₀");
  assertRel(forsterRadius(1e15, 1), 4.976 * nm, 1e-3, "R₀ value");
  const r0 = 5 * nm;
  assertAbs(fretEfficiency(r0, r0), 0.5, 1e-15, "E(R₀)");
  assertAbs(fretEfficiency(2 * r0, r0), 1 / 65, 1e-15, "E(2R₀)");
  assert.equal(fretEfficiency(0, r0), 1);
  assert.ok(Number.isNaN(forsterRadius(-1, 0.5)), "negative J");
  // J of a narrow donor band under a flat acceptor ε₀: ε₀·⟨λ⁴⟩ ≈ ε₀ λ_D⁴.
  const flat = { ...fluorophoreByName("EGFP"), extinction: 1e5, ex: { peak_cm1: 19000, fwhm_cm1: 1e6, skew: 1 } };
  const narrow = { ...fluorophoreByName("EGFP"), em: { peak_cm1: 19000, fwhm_cm1: 20, skew: 1 } };
  assertRel(forsterOverlap(narrow, flat), 1e5 * (1e7 / 19000) ** 4, 1e-3, "flat acceptor");
});

test("Relative signal: ε·f_ex·Φ·fraction, additive over laser lines", () => {
  const egfp = fluorophoreByName("EGFP");
  const s = relativeSignal(egfp, [488 * nm], 500 * nm, 550 * nm);
  assertRel(s, egfp.extinction * bandAtWavelength(egfp.ex, 488 * nm) * egfp.quantumYield * emissionFraction(egfp.em, 500 * nm, 550 * nm), 1e-12, "one line");
  const two = relativeSignal(egfp, [488 * nm, 405 * nm], 500 * nm, 550 * nm);
  assertRel(two - s, relativeSignal(egfp, [405 * nm], 500 * nm, 550 * nm), 1e-9, "two lines");
});

test("Jacobi eigenvalues: 2×2 closed form, 3×3 against Smith (1961), trace and determinant", () => {
  const ev2 = symmetricEigenvalues([[2, 1], [1, 2]]);
  assertAbs(ev2[0], 1, 1e-14, "λ₁");
  assertAbs(ev2[1], 3, 1e-14, "λ₂");
  const A = [[4, 1, 2], [1, 3, 0], [2, 0, 5]];
  const ev = symmetricEigenvalues(A);
  assertAbs(ev[2], largestSymmetricEigenvalue(A.flat()), 1e-12, "λ_max");
  assertAbs(ev[0] + ev[1] + ev[2], 12, 1e-12, "trace");
  assertAbs(ev[0] * ev[1] * ev[2], 43, 1e-10, "det");
  assert.deepEqual(symmetricEigenvalues([[5]]), [5]);
});

test("OLS and NNLS: MATLAB lsqnonneg documentation example", () => {
  // MathWorks lsqnonneg reference page: C\d = [−2.5627; 3.1108], lsqnonneg(C, d) = [0; 0.6929].
  const C = [[0.0372, 0.2869], [0.6861, 0.7071], [0.6233, 0.6245], [0.6344, 0.617]];
  const d = [0.8587, 0.1781, 0.0747, 0.8405];
  const x = ols(C, d);
  assertAbs(x[0], -2.5627, 5e-5, "OLS x₁");
  assertAbs(x[1], 3.1108, 5e-5, "OLS x₂");
  const xn = nnls(C, d);
  assert.equal(xn[0], 0);
  // With x₁ = 0, x₂ = c₂·d/c₂·c₂ = 0.937527/1.353000 = 0.692925.
  assertAbs(xn[1], 0.692925, 1e-5, "NNLS x₂");
  // An interior solution: NNLS = OLS.
  const E = [[1, 0], [0, 1], [1, 1]];
  assert.deepEqual(nnls(E, [1, 2, 3]).map((v) => +v.toFixed(12)), [1, 2]);
  assert.ok(ols([[1, 1], [2, 2]], [1, 2]).every(Number.isNaN), "rank deficient");
  assert.ok(nnls([[1, NaN], [0, 1]], [1, 1]).every(Number.isNaN), "NaN in E");
  assert.ok(nnls(E, [1, NaN, 3]).every(Number.isNaN), "NaN in y");
});

test("FCLS: equality-constrained closed form when no bound is active (Heinz & Chang 2001)", () => {
  // E = [[1,0],[0,1],[1,1]], y = [1,2,2]: x_OLS = [2/3, 5/3]; Σx = 2.5 adds G⁻¹1·(2.5 − 7/3)/(1ᵀG⁻¹1) = [1/12, 1/12].
  const x = fcls([[1, 0], [0, 1], [1, 1]], [1, 2, 2], 2.5);
  assertAbs(x[0], 0.75, 1e-5, "x₁");
  assertAbs(x[1], 1.75, 1e-5, "x₂");
  const C = [[0.0372, 0.2869], [0.6861, 0.7071], [0.6233, 0.6245], [0.6344, 0.617]];
  const xc = fcls(C, [0.8587, 0.1781, 0.0747, 0.8405], 1);
  assertAbs(xc[0] + xc[1], 1, 1e-5, "sum to one");
  assert.ok(xc.every((v) => v >= 0), "non-negative");
});

test("OLS covariance: σ²(EᵀE)⁻¹, the sandwich form, and a seeded Monte Carlo", () => {
  const E = [[1, 0], [0, 1], [1, 1]];
  const c4 = olsCovariance(E, [4, 4, 4]);
  assertAbs(c4[0][0], 8 / 3, 1e-12, "σ²·2/3");
  assertAbs(c4[0][1], -4 / 3, 1e-12, "σ²·(−1/3)");
  // v = [1, 2, 3]: G⁻¹ EᵀVE G⁻¹ = [[1, −1/3], [−1/3, 4/3]] by hand.
  const cv = olsCovariance(E, [1, 2, 3]);
  assertAbs(cv[0][0], 1, 1e-12, "C₁₁");
  assertAbs(cv[0][1], -1 / 3, 1e-12, "C₁₂");
  assertAbs(cv[1][1], 4 / 3, 1e-12, "C₂₂");
  assertAbs(conditionNumber(E), Math.sqrt(3), 1e-12, "κ");
  // Shares of x = [1, 3] with Cov = I: g₁ = [3, −1]/16, Var p₁ = 10/256, σ = √10/16 = 0.19764.
  const sd = shareStdDev([1, 3], [[1, 0], [0, 1]]);
  assertAbs(sd[0], Math.sqrt(10) / 16, 1e-12, "σ(p₁)");
  assertAbs(sd[1], Math.sqrt(10) / 16, 1e-12, "σ(p₂)");
  assert.ok(Number.isNaN(shareStdDev([0, 0], [[1, 0], [0, 1]])[0]), "zero total");
  assert.equal(conditionNumber([[1, 1], [2, 2]]), Infinity);
  // EGFP + mCherry in 8 bands, 10⁴ photons: the sample variance of 4000 OLS estimates within 6 % of the prediction.
  const egfp = fluorophoreByName("EGFP").em;
  const mch = fluorophoreByName("mCherry").em;
  const B = Array.from({ length: 8 }, (_, b) => [490 + 25 * b, 515 + 25 * b]);
  const tot = [egfp, mch].map((s) => integrateSpectrum((l) => bandAtWavelength(s, l), 490 * nm, 690 * nm));
  const M = B.map(([lo, hi]) => [egfp, mch].map((s, j) => integrateSpectrum((l) => bandAtWavelength(s, l), lo * nm, hi * nm) / tot[j]));
  const xTrue = [6000, 4000];
  const rng = createRng(7);
  const draws = Array.from({ length: 4000 }, () => ols(M, simulateMixture(M, xTrue, 2, rng).y)[0]);
  const mean = draws.reduce((s, v) => s + v, 0) / draws.length;
  const variance = draws.reduce((s, v) => s + (v - mean) ** 2, 0) / (draws.length - 1);
  const predicted = olsCovariance(M, simulateMixture(M, xTrue, 2, createRng(1)).variance)[0][0];
  assertRel(variance, predicted, 0.06, "Monte Carlo variance");
  assertAbs(mean, 6000, 4 * Math.sqrt(predicted / draws.length), "unbiased");
});

test("Multicolor own-dye SNR at the page defaults: 21.16 (Janesick photon transfer)", () => {
  // 25 000 photons/pixel/s × 20 ms × QE 0.9 = 450 e⁻; dark 0.01 e⁻/s × 20 ms; read 1.5 e⁻:
  // 450/√(450 + 0.0002 + 2.25) = 21.160.
  assertAbs(cameraSnr({ signal: 25000 * 0.02 * 0.9, read: 1.5, dark: 0.01 * 0.02 }), 21.160, 5e-4, "SNR");
});
