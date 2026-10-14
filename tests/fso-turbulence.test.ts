import test from "node:test";
import assert from "node:assert/strict";

import {
  andrewsApertureFactor, apertureParameter, beamWanderLossDb, beamWanderVariance, diversityOutage, diversityThreshold,
  fittingErrorVariance, friedParameter, gammaGammaCdf, gammaGammaParameters, greenwoodFrequency, irradianceCorrelation,
  isoplanaticAngle, logIrradianceCorrelation, logIrradianceVariances, lognormalFadeProbability, rytovVariance,
  scintillationIndex, servoLagVariance, sphericalRytovVariance, strehlRatio, uncorrectedPhaseVariance, weakApertureFactor,
} from "../src/physics/free-space-comms/turbulence";
import { beamRadius } from "../src/physics/free-space-comms/pointing-loss";
import { besselK, integrateTanhSinh, lnGamma } from "../src/physics/math";
import { covarianceIntegral } from "../scripts/gen-irradiance-covariance";

const close = (actual: number, expected: number, rel: number, msg = "") =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg} ${actual} vs ${expected}`);

const lambda = 1550e-9;

test("r₀ and θ₀ agree with Fried's forms 0.185 λ^(6/5)(C_n²L)^(−3/5) and 0.314 r₀/h̄", () => {
  // Fried (1966) as quoted in Hardy, Adaptive Optics for Astronomical Telescopes: the constant 0.185 is rounded.
  const r0 = friedParameter(1e-14, lambda, 1000);
  close(r0, 0.185 * lambda ** 1.2 * (1e-14 * 1000) ** -0.6, 3e-3);
  close(r0, 0.07848, 1e-3); // hand: (0.423 · 1.6432e13 · 1e-14 · 1000)^(−3/5) = 69.51^(−0.6)
  // Uniform path: h̄ = (∫z^(5/3)dz / L)^(3/5) = (3/8)^(3/5) L, θ₀ = 0.314 r₀/h̄.
  close(isoplanaticAngle(1e-14, lambda, 1000), (0.314 * r0) / ((3 / 8) ** 0.6 * 1000), 2e-3);
});

test("Rytov variance and the unified plane-wave scintillation index (Andrews & Phillips 2005)", () => {
  // Hand: 1.23 · 1.7e-14 · k^(7/6) · L^(11/6), k^(7/6) = 5.1187e7, L^(11/6) = 10^5.5.
  close(rytovVariance(1.7e-14, lambda, 1000), 1.23 * 1.7e-14 * 5.1187e7 * 10 ** 5.5, 1e-4);
  // σ_R² = 1: exp(0.49/2.11^(7/6) + 0.51/1.69^(5/6)) − 1 = exp(0.20487 + 0.32935) − 1 = 0.7064.
  close(scintillationIndex(1, lambda, 1000), 0.7064, 1e-3);
  // Weak limit: σ_I² → σ_R²; strong limit: saturates at 1.
  close(scintillationIndex(1e-3, lambda, 1000), 1e-3, 2e-3);
  close(scintillationIndex(1e6, lambda, 1000), 1, 0.02);
  // Continuous across σ_R² = 1 (the old page jumped from 1 to 1.86 there).
  assert.ok(Math.abs(scintillationIndex(1.001, lambda, 1000) - scintillationIndex(0.999, lambda, 1000)) < 1e-3);
});

test("aperture averaging uses the Fresnel parameter d² = kD²/4L, not D/r₀", () => {
  const L = 1000, sr2 = 0.3;
  const point = scintillationIndex(sr2, lambda, L);
  // d² = 1: D = √(4L/k) = 2√(L/k).
  const D1 = 2 * Math.sqrt(L / ((2 * Math.PI) / lambda));
  // The published expression written out with d² = 1 (1 + 0.65d² = 1.65, 1 + 0.90d² = 1.9, 0.62d² = 0.62):
  const s = 0.3 ** 1.2;
  const expected = Math.expm1((0.49 * sr2) / (1.65 + 1.11 * s) ** (7 / 6) + (0.51 * sr2 * (1 + 0.69 * s) ** (-5 / 6)) / (1.9 + 0.62 * s));
  close(scintillationIndex(sr2, lambda, L, D1), expected, 1e-12);
  assert.ok(scintillationIndex(sr2, lambda, L, D1) < point);
  assert.ok(scintillationIndex(sr2, lambda, L, 10) < 1e-3 * point); // D ≫ Fresnel zone averages it out
});

test("log-normal fade probability: P(I < ⟨I⟩) = Φ(σ_ln/2)", () => {
  // σ_I² = e − 1 → σ_ln = 1 → Φ(0.5) = 0.691462 (normal table).
  close(lognormalFadeProbability(1, Math.E - 1), 0.691462, 1e-6);
  // F = 10^(−1) (−10 dB), σ_ln² = ln 2: Φ((−2.302585 + 0.346574)/0.832555) = Φ(−2.349412) = 0.009402.
  close(lognormalFadeProbability(0.1, 1), 0.009402, 1e-3);
});

test("adaptive optics: Noll variances, Greenwood servo lag without a D/r₀ factor, Parenti-Sasiela Strehl", () => {
  close(uncorrectedPhaseVariance(1, 1), 1.0299, 1e-12);
  close(fittingErrorVariance(100, 2, 1), 0.2944 * 100 ** (-Math.sqrt(3) / 2) * 2 ** (5 / 3), 1e-12);
  // f_G = 0.427 · 10 m/s / 0.1 m = 42.7 Hz; at f_3dB = f_G the servo variance is 1 rad² for any aperture.
  close(greenwoodFrequency(10, 0.1), 42.7, 1e-12);
  assert.equal(servoLagVariance(42.7, 42.7), 1);
  // Hand: D = r₀: e^(−1.0299) + (1 − e^(−1.0299))/2 = 0.35704 + 0.32148 = 0.67852.
  close(strehlRatio(uncorrectedPhaseVariance(1, 1), 1, 1), 0.67852, 1e-4);
  // D = 100 r₀ uncorrected: the seeing-limited (r₀/D)² ≈ 1e-4, not the Maréchal e^(−22) underflow.
  close(strehlRatio(uncorrectedPhaseVariance(100, 1), 100, 1), 1 / (1 + 1e4), 1e-9);
  assert.equal(strehlRatio(0, 0.5, 1), 1);
});

test("all-regime aperture averaging reproduces a published worked example (arXiv:2607.12837 app. D.4)", () => {
  // σ_R² ≈ 2.4 at 750 m, d² = 3.5 for a 50.8 mm aperture: the point σ_I² ≈ 1.04 drops to ≈ 0.20.
  const point = logIrradianceVariances(2.4);
  const dish = logIrradianceVariances(2.4, 3.5);
  close(Math.expm1(point.x + point.y), 1.04, 0.01);
  close(Math.expm1(dish.x + dish.y), 0.20, 0.02);
  // d² = kD²/4L: D = 2√(L/k) gives 1.
  close(apertureParameter(lambda, 1000, 2 * Math.sqrt(1000 / ((2 * Math.PI) / lambda))), 1, 1e-12);
});

test("weak aperture averaging: the Gaussian-aperture integral, its D = 0 prefactors and Andrews' interpolation", () => {
  // At D = 0 the κ integral is ½|Γ(−5/6)| cos(5π/12) b^(5/6), so σ² = 8π²·0.033·½|Γ(−5/6)|cos(5π/12)·∫₀¹ b^(5/6) dξ · C_n²k^(7/6)L^(11/6):
  // ∫ξ^(5/6) = 6/11 gives the plane-wave 1.23 and ∫(ξ(1 − ξ))^(5/6) = B(11/6, 11/6) the spherical 0.496.
  const c = 8 * Math.PI ** 2 * 0.033 * 0.5 * (Math.exp(lnGamma(1 / 6)) / (5 / 6)) * Math.cos((5 * Math.PI) / 12);
  close(c * (6 / 11), 1.23, 2e-3);
  close(c * Math.exp(2 * lnGamma(11 / 6) - lnGamma(11 / 3)), 0.496, 2e-3);
  close(sphericalRytovVariance(1e-14, lambda, 1000) / rytovVariance(1e-14, lambda, 1000), 0.496 / 1.23, 1e-9);
  // Independent check: direct 2-D quadrature of the same integrals (1500 log-spaced κ × 400 ξ, scratch probe):
  // plane 0.4341 / 0.0552, spherical 0.5389 / 0.1451 at d² = 1 / 10.
  close(weakApertureFactor(1, "plane"), 0.4341, 1e-3);
  close(weakApertureFactor(10, "plane"), 0.0552, 2e-3);
  close(weakApertureFactor(1, "spherical"), 0.5389, 1e-3);
  close(weakApertureFactor(10, "spherical"), 0.1451, 1e-3);
  // Andrews (1992): [1 + 1.062 d²]^(−7/6) is within 12 % of the plane-wave integral for d² ≥ 1; at the page defaults
  // (1550 nm, 1 km, D = 10 cm: d² = 10.13) it gives 0.0564. His spherical 0.333 fit runs 25–33 % high at d² = 1–10.
  close(andrewsApertureFactor(apertureParameter(lambda, 1000, 0.1), "plane"), 0.0564, 2e-3);
  for (const d2 of [1, 3, 10, 30, 100]) close(andrewsApertureFactor(d2, "plane"), weakApertureFactor(d2, "plane"), 0.12);
  // Large apertures: A ∝ d^(−7/3).
  close(weakApertureFactor(1e4, "plane") / weakApertureFactor(1e3, "plane"), 10 ** (-7 / 6), 0.02);
  assert.equal(weakApertureFactor(0, "spherical"), 1);
});

test("gamma-gamma α, β (Al-Habash, Andrews & Phillips 2001) and the CDF against closed forms", () => {
  // σ_R² = 1, point receiver: α = 1/expm1(0.49/2.11^(7/6)) = 1/expm1(0.20505) = 4.3939, β = 1/expm1(0.51/1.69^(5/6)) = 2.5638.
  const ab = gammaGammaParameters(1);
  close(ab.alpha, 4.3939, 1e-3);
  close(ab.beta, 2.5638, 1e-3);
  // fade-probability defaults (C_n² 1e-15, 1550 nm, 1 km, point receiver): σ_R² = 0.01991, α/β = 103.2/98.5 (ROADMAP).
  const def = gammaGammaParameters(rytovVariance(1e-15, lambda, 1000));
  close(def.alpha, 103.2, 1e-3);
  close(def.beta, 98.5, 1e-3);
  // σ_I² = 1/α + 1/β + 1/(αβ) equals the scintillation index.
  close(1 / ab.alpha + 1 / ab.beta + 1 / (ab.alpha * ab.beta), scintillationIndex(1, lambda, 1000), 1e-12);
  // β = 1: P(I < t) = 1 − 2(αt)^(α/2) K_α(2√(αt))/Γ(α) (E[e^(−t/X)] for X ~ Γ(α, 1/α)).
  for (const [a, t] of [[4.3, 0.5], [4.3, 0.05], [2.5, 1.7], [30, 0.2]]) {
    const exact = 1 - (2 * (a * t) ** (a / 2) * besselK(a, 2 * Math.sqrt(a * t))) / Math.exp(lnGamma(a));
    close(gammaGammaCdf(t, a, 1), exact, 1e-6, `α=${a} t=${t}`);
  }
  // Deep fades: P → (αβt)^β Γ(α − β)/(Γ(α)Γ(β + 1)) as t → 0.
  close(gammaGammaCdf(1e-6, 4, 1.2), Math.exp(1.2 * Math.log(4 * 1.2 * 1e-6) + lnGamma(2.8) - lnGamma(4) - lnGamma(2.2)), 1e-4);
  // Direct integral of the PDF 2(αβ)^((α+β)/2) I^((α+β)/2 − 1) K_(α−β)(2√(αβI))/(Γ(α)Γ(β)).
  const [a, b, t] = [5.2, 2.1, 0.3];
  const pdf = (I: number) =>
    2 * Math.exp(((a + b) / 2) * Math.log(a * b) - lnGamma(a) - lnGamma(b) + ((a + b) / 2 - 1) * Math.log(I)) * besselK(a - b, 2 * Math.sqrt(a * b * I));
  close(gammaGammaCdf(t, a, b), integrateTanhSinh(pdf, 0, t), 1e-6);
  assert.equal(gammaGammaCdf(0, 4, 2), 0);
});

test("weak plane-wave irradiance correlation: table vs its integral, the 1.23 prefactor and the Fresnel scale", () => {
  const i0 = covarianceIntegral(0);
  close(8 * Math.PI ** 2 * 0.033 * i0, 1.23, 2e-3); // B_I(0) = σ_R²
  const fz = Math.sqrt(1000 / ((2 * Math.PI) / lambda)); // √(L/k)
  for (const r of [0.5, 1.23, 2.5]) {
    assert.ok(Math.abs(irradianceCorrelation(r * fz, lambda, 1000) - covarianceIntegral(r) / i0) < 2e-4, `r=${r}`);
  }
  assert.equal(irradianceCorrelation(0, lambda, 1000), 1);
  assert.equal(irradianceCorrelation(10 * fz, lambda, 1000), 0);
  // Decorrelated (first zero) near 1.75√(L/k) = 0.70√(λL).
  assert.ok(irradianceCorrelation(1.7 * fz, lambda, 1000) > 0 && irradianceCorrelation(1.8 * fz, lambda, 1000) < 0);
  // ln I correlation for log-normal branches: b = 0.5, σ_I² = 1 → ln 1.5/ln 2.
  close(logIrradianceCorrelation(0.5, 1), Math.log(1.5) / Math.log(2), 1e-12);
});

test("diversity outage: orthant probabilities, exact N = 2 combiners and Fenton–Wilkinson for N ≥ 3", () => {
  const sI2 = 0.2;
  const median = Math.exp(-Math.log1p(sI2) / 2); // ln t = μ: each branch is below t with probability ½
  // Sheppard: P(Z₁ < 0, Z₂ < 0) = 1/4 + asin ρ/(2π) = 1/3 at ρ = ½; trivariate equicorrelated: 1/8 + 3 asin ρ/(4π) = 1/4.
  close(diversityOutage(median, 2, sI2, 0.5, "sc"), 1 / 3, 1e-6);
  close(diversityOutage(median, 3, sI2, 0.5, "sc"), 1 / 4, 1e-6);
  close(diversityOutage(0.3, 4, sI2, 0, "sc"), lognormalFadeProbability(0.3, sI2) ** 4, 1e-12);
  for (const c of ["sc", "egc", "mrc"] as const) close(diversityOutage(0.4, 1, sI2, 0, c), lognormalFadeProbability(0.4, sI2), 1e-9, c);
  // N = 2 EGC/MRC against brute-force conditioning (40 000-point trapezoid over ln I₁, scratch probe).
  close(diversityOutage(0.3, 2, 0.2, 0, "egc"), 4.22782e-7, 1e-5);
  close(diversityOutage(0.3, 2, 0.2, 0, "mrc"), 3.366994e-7, 1e-5);
  close(diversityOutage(0.4, 2, 0.1, 0.9, "mrc"), 2.525272e-5, 1e-5);
  // Fully correlated: no diversity, only the √N array gain for EGC and MRC.
  close(diversityOutage(0.5, 3, sI2, 1, "egc"), lognormalFadeProbability(0.5 / Math.sqrt(3), sI2), 1e-9);
  // √(ΣI²) ≥ ΣI/√N and ≥ max I, so the MRC outage never exceeds EGC's or SC's (the raw N ≥ 3 fit did at N = 3, 4).
  for (const n of [2, 3, 4]) {
    const mrc = diversityOutage(0.3, n, 0.3, 0.2, "mrc");
    assert.ok(mrc <= diversityOutage(0.3, n, 0.3, 0.2, "egc") && mrc <= diversityOutage(0.3, n, 0.3, 0.2, "sc"), `N=${n}`);
  }
  // The threshold inverts the outage.
  const t = diversityThreshold(1e-6, 2, sI2, 0.3, "egc");
  close(diversityOutage(t, 2, sI2, 0.3, "egc"), 1e-6, 1e-6);
  // N = 3 EGC: the Fenton–Wilkinson outage vs a seeded Monte Carlo (2e5 runs at P = 1e-2; MC 0.88 %): within 20 %, never optimistic.
  let seed = 99;
  const rnd = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return (((x ^ (x >>> 14)) >>> 0) + 0.5) / 4294967296;
  };
  const s = Math.sqrt(Math.log1p(0.3));
  const tE = diversityThreshold(1e-2, 3, 0.3, 0, "egc");
  let hits = 0;
  const runs = 200000;
  for (let k = 0; k < runs; k++) {
    let sum = 0;
    for (let i = 0; i < 3; i++) sum += Math.exp(-s * s / 2 + s * Math.sqrt(-2 * Math.log(rnd())) * Math.cos(2 * Math.PI * rnd()));
    if (sum / Math.sqrt(3) < tE) hits++;
  }
  assert.ok(hits / runs < 1.03e-2 && hits / runs > 0.8e-2, `MC ${hits / runs}`);
});

test("beam wander: 2.42 C_n² L³ W₀^(−1/3) and the mean on-axis loss 10 log(1 + 2⟨r_c²⟩/W²)", () => {
  // ROADMAP defaults: C_n² = 1e-15, L = 1 km, W₀ = 2 cm: 2.42e-6 · 0.02^(−1/3) = 8.915e-6 m² (rms 2.99 mm).
  const v = beamWanderVariance(1e-15, 1000, 0.02);
  close(v, 8.915e-6, 1e-3);
  // 2.42 = 7.25/3, the collimated case of 7.25 C_n² L³ W₀^(−1/3) ∫₀¹ ξ² dξ (Andrews & Phillips 2005).
  close(7.25 / 3, 2.42, 2e-3);
  // W(L) = 2 cm · √(1 + (L/z_R)²), z_R = πW₀²/λ = 810.7 m → 3.176 cm; loss 10 log(1.01768) = 0.0761 dB.
  const W = beamRadius(0.02, lambda, 1000);
  close(W, 0.03176, 1e-3);
  close(beamWanderLossDb(v, W), 0.0761, 2e-3);
  assert.equal(beamWanderLossDb(0, W), 0);
});

test("numerics at the edges: huge α, β, the large-aperture asymptote, exact N = 3 bounds and the SC tail", () => {
  // α = β → ∞: I → 1, so P(I < ⟨I⟩) → ½ (Cn² 1e-18 over 1 m at 20 µm gives α ≈ 6e11; the old scan returned 0.0085).
  close(gammaGammaCdf(1, 6e11, 6e11), 0.5, 1e-5);
  assert.ok(Math.abs(gammaGammaCdf(1, 7e5, 7e5) - 0.5) < 1e-3);
  // d² → ∞, plane wave: A·d^(7/3) → (5/216)·4^(7/6)/(cos 75°·6/11) = 0.826351 (expanding the kernel to O(τ²)).
  const asym = ((5 / 216) * 4 ** (7 / 6)) / (Math.cos((5 * Math.PI) / 12) * (6 / 11));
  close(weakApertureFactor(1e6, "plane") * 1e7, asym, 1e-4);
  // N = 3, ρ = 0, σ_I² = 0.5, P = 1e-6: exact outage by conditioning on I₁ and the exact N = 2 result. The
  // Fenton–Wilkinson margin must be conservative (exact P ≤ 1e-6 at its threshold) and within 0.35 dB (EGC, exact
  // 5.752 dB vs 6.054) or 0.5 dB (MRC, exact 5.600 dB; capped at the EGC fit).
  const s = Math.sqrt(Math.log1p(0.5));
  const exact3 = (t: number, mrc: boolean) => {
    const zMax = (Math.log(mrc ? t : t * Math.sqrt(3)) + s * s / 2) / s;
    const f = (z: number) => {
      const i1 = Math.exp(-s * s / 2 + s * z);
      const t2 = mrc ? Math.sqrt(Math.max(0, t * t - i1 * i1)) : Math.max(0, (t * Math.sqrt(3) - i1) / Math.SQRT2);
      return t2 > 0 ? Math.exp(-z * z / 2) * diversityOutage(t2, 2, 0.5, 0, mrc ? "mrc" : "egc") : 0;
    };
    return integrateTanhSinh(f, Math.min(zMax - 8, -12), zMax) / Math.sqrt(2 * Math.PI);
  };
  for (const [c, slack] of [["egc", 0.35], ["mrc", 0.5]] as const) {
    const t = diversityThreshold(1e-6, 3, 0.5, 0, c);
    assert.ok(exact3(t, c === "mrc") <= 1e-6, `${c} conservative`);
    assert.ok(exact3(t * 10 ** (slack / 10), c === "mrc") >= 1e-6, `${c} within ${slack} dB`);
  }
  // SC far below the median: the true value is 9e-56; the integral is only claimed to 1e-31 absolute (no Φ(−12) floor).
  assert.ok(diversityOutage(0.05, 2, 0.05, 0.5, "sc") < 1e-31);
});
