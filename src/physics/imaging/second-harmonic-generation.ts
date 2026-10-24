/**
 * Second-harmonic generation by a focused Gaussian beam in a uniform slab: no walk-off, focus at the slab centre,
 * no absorption, undepleted pump. SI units in and out. Model tier: textbook approximation (paraxial, so only
 * indicative at microscope NAs above ≈ 0.5).
 *
 * G. D. Boyd, D. A. Kleinman, "Parametric interaction of focused Gaussian light beams", J. Appl. Phys. 39, 3597
 * (1968), in SI units:
 *   P_2ω = K P_ω²,  K = 16π² d_eff² L h(σ, ξ) / (ε₀ c n_ω n_2ω λ³)
 *   h(σ, ξ) = (1/(4ξ)) |∫_{−ξ}^{ξ} e^{iστ}/(1 + iτ) dτ|²
 * with λ the fundamental wavelength, b = k_ω w₀² = 2π n_ω w₀²/λ the confocal parameter, ξ = L/b and
 * σ = bΔk/2, Δk = 2k_ω − k_2ω = −4π(n_2ω − n_ω)/λ.
 * - ξ ≪ 1: h → ξ sinc²(ΔkL/2), the plane-wave result 8π² d² L² I/(ε₀ c n_ω² n_2ω λ²) averaged over the beam
 *   (Boyd, Nonlinear Optics, §2.7), i.e. P_2ω ∝ L² sinc²(ΔkL/2).
 * - Optimum h = 1.068 at ξ = 2.84, σ = 0.57 (Boyd & Kleinman 1968).
 * - ξ ≫ 1: h → π² e^{−2σ}/ξ for σ > 0 and → 0 for σ < 0 (Δk < 0, normal dispersion): the Gouy phase cancels the
 *   harmonic generated before and after a tight focus, as for THG (Boyd §2.10). σ = 0 gives exactly arctan²ξ/ξ.
 *
 * Pulses (Gaussian in time, FWHM τ): ⟨P_2ω⟩ = K g ⟨P_ω⟩²/(f τ), g = √(2 ln 2/π) = 0.664 (Xu & Webb, JOSA B 13,
 * 481 (1996), g_p for a Gaussian pulse).
 *
 * Sum-frequency generation ω₃ = ω₁ + ω₂ (1/λ₃ = 1/λ₁ + 1/λ₂), plane waves, from Boyd's coupled-amplitude equation
 * dA₃/dz = (2i d_eff ω₃²/(k₃c²)) A₁A₂ e^{iΔkz} (Nonlinear Optics, 3rd ed., eq. 2.2.10) with I = 2nε₀c|A|²:
 *   I₃ = 2 d_eff² ω₃² I₁ I₂ L² sinc²(ΔkL/2)/(n₁n₂n₃ ε₀ c³) = 8π² d_eff² I₁ I₂ L² sinc²(ΔkL/2)/(ε₀ c n₁n₂n₃ λ₃²).
 * With ω₁ = ω₂ and I₁ = I₂ = I it is 4× the SHG result above (the degeneracy factor of P(ω₃) = 4ε₀ d A₁A₂).
 * Thin slab (L ≪ both confocal parameters), Gaussian beams of 1/e² radii w₁, w₂: ∫I₁I₂ dA = 2P₁P₂/(π(w₁² + w₂²)).
 * Here n₁ = n₂ = n and n₃ = n + Δn, so Δk = k₁ + k₂ − k₃ = −2πΔn/λ₃. Synchronised Gaussian pulses of equal FWHM τ:
 * ⟨P₁P₂⟩ = g ⟨P₁⟩⟨P₂⟩/(fτ), with the same g as for SHG.
 */

import { epsilon_0, c } from "../constants";
import { sinc } from "../math";

/** ⟨P²⟩/(⟨P⟩²/(fτ)) for Gaussian pulses of FWHM τ at repetition rate f. */
export const GAUSSIAN_PULSE_G2 = Math.sqrt((2 * Math.LN2) / Math.PI);

/** Boyd–Kleinman focusing function h(σ, ξ) for B = 0 and the focus at the centre (Simpson's rule). */
export function boydKleinmanH(sigma: number, xi: number): number {
  if (!Number.isFinite(sigma) || !(Number.isFinite(xi) && xi > 0)) return NaN;
  // ≥ 10 points per unit τ (the 1/(1 + iτ) scale) and per radian of e^{iστ}; capped for very thick slabs.
  const perUnit = 10 * Math.max(1, Math.abs(sigma));
  let n = Math.min(400_000, Math.max(200, Math.ceil(2 * xi * perUnit)));
  if (n % 2) n += 1;
  const step = (2 * xi) / n;
  let re = 0, im = 0;
  for (let i = 0; i <= n; i++) {
    const t = -xi + i * step;
    const weight = i === 0 || i === n ? 1 : i % 2 ? 4 : 2;
    const cs = Math.cos(sigma * t), sn = Math.sin(sigma * t), den = 1 + t * t;
    // e^{iσt}/(1 + it) = e^{iσt}(1 − it)/(1 + t²)
    re += (weight * (cs + t * sn)) / den;
    im += (weight * (sn - t * cs)) / den;
  }
  re *= step / 3;
  im *= step / 3;
  return (re * re + im * im) / (4 * xi);
}

/** Confocal parameter b = 2π n w₀²/λ of a Gaussian beam with 1/e² waist w₀ in a medium of index n, m. */
export function confocalParameter(lambda: number, n: number, w0: number): number {
  if (!(lambda > 0 && n > 0 && w0 > 0)) return NaN;
  return (2 * Math.PI * n * w0 * w0) / lambda;
}

export interface ShgInput {
  /** Fundamental vacuum wavelength, m. */
  lambda: number;
  /** Slab thickness, m. */
  length: number;
  /** Effective nonlinear coefficient d_eff, m/V. */
  deff: number;
  /** Index at the fundamental. */
  nOmega: number;
  /** n(2ω) − n(ω); positive for normal dispersion. */
  deltaN: number;
  /** 1/e² intensity radius of the focus, m. */
  w0: number;
}

export interface ShgResult {
  /** P_2ω = K P_ω² (peak powers), 1/W. */
  K: number;
  /** Same with h replaced by its near-field (plane-wave) limit ξ sinc²(ΔkL/2), 1/W. */
  KNearField: number;
  h: number;
  xi: number;
  sigma: number;
  /** Confocal parameter, m. */
  b: number;
  /** Δk = 2k_ω − k_2ω, 1/m. */
  deltaK: number;
}

/** Focused-beam SHG coefficient (Boyd–Kleinman) and its plane-wave near-field limit. */
export function shgCoefficient({ lambda, length, deff, nOmega, deltaN, w0 }: ShgInput): ShgResult {
  const n2 = nOmega + deltaN;
  const b = confocalParameter(lambda, nOmega, w0);
  const ok = Number.isFinite(b) && length > 0 && Number.isFinite(deff) && nOmega >= 1 && n2 >= 1 && Number.isFinite(deltaN);
  if (!ok) return { K: NaN, KNearField: NaN, h: NaN, xi: NaN, sigma: NaN, b: NaN, deltaK: NaN };
  const deltaK = (-4 * Math.PI * deltaN) / lambda;
  const xi = length / b;
  const sigma = (b * deltaK) / 2;
  const h = boydKleinmanH(sigma, xi);
  const phase = (deltaK * length) / 2;
  const s = sinc(phase);
  const prefactor = (16 * Math.PI ** 2 * deff * deff * length) / (epsilon_0 * c * nOmega * n2 * lambda ** 3);
  return { K: prefactor * h, KNearField: prefactor * xi * s * s, h, xi, sigma, b, deltaK };
}

/** Average SH power from Gaussian pulses: K g ⟨P⟩²/(f τ), W. */
export function averageShgPower(K: number, averagePower: number, repetitionRate: number, tauFwhm: number): number {
  if (!(repetitionRate > 0 && tauFwhm > 0 && averagePower >= 0)) return NaN;
  return (K * GAUSSIAN_PULSE_G2 * averagePower * averagePower) / (repetitionRate * tauFwhm);
}

/** Forward coherence length π/|Δk| = λ/(4|n_2ω − n_ω|), m (∞ when phase-matched). */
export function forwardCoherenceLength(lambda: number, deltaN: number): number {
  if (!(lambda > 0) || !Number.isFinite(deltaN)) return NaN;
  return deltaN === 0 ? Infinity : lambda / (4 * Math.abs(deltaN));
}

/** Backward (reflected) SHG coherence length π/(k_2ω + 2k_ω) = λ/(4(n_ω + n_2ω)), m. */
export function backwardCoherenceLength(lambda: number, nOmega: number, n2Omega: number): number {
  if (!(lambda > 0 && nOmega > 0 && n2Omega > 0)) return NaN;
  return lambda / (4 * (nOmega + n2Omega));
}

/** Sum-frequency wavelength λ₁λ₂/(λ₁ + λ₂), m. */
export function sumFrequencyWavelength(lambda1: number, lambda2: number): number {
  if (!(lambda1 > 0 && lambda2 > 0)) return NaN;
  return (lambda1 * lambda2) / (lambda1 + lambda2);
}

export interface SfgInput {
  /** Vacuum wavelengths of the two input beams, m. */
  lambda1: number;
  lambda2: number;
  /** Slab thickness, m. */
  length: number;
  /** Effective nonlinear coefficient d_eff, m/V. */
  deff: number;
  /** Index at both input wavelengths. */
  n: number;
  /** n(ω₃) − n; positive for normal dispersion. */
  deltaN: number;
  /** 1/e² intensity radii of the two foci, m. */
  w1: number;
  w2: number;
}

export interface SfgResult {
  /** P₃ = K P₁ P₂ (peak powers), thin-slab limit, 1/W. */
  K: number;
  /** Sum-frequency wavelength, m. */
  lambda3: number;
  /** Δk = k₁ + k₂ − k₃, 1/m. */
  deltaK: number;
  /** L over the smaller confocal parameter 2πn wᵢ²/λᵢ; the thin-slab limit needs it ≪ 1. */
  xi: number;
}

/** Thin-slab SFG coefficient for two focused Gaussian beams (plane-wave L² sinc² law over the beam overlap). */
export function sfgCoefficient({ lambda1, lambda2, length, deff, n, deltaN, w1, w2 }: SfgInput): SfgResult {
  const lambda3 = sumFrequencyWavelength(lambda1, lambda2);
  const n3 = n + deltaN;
  const ok = Number.isFinite(lambda3) && length > 0 && Number.isFinite(deff) && n >= 1 && n3 >= 1 && w1 > 0 && w2 > 0;
  if (!ok) return { K: NaN, lambda3: NaN, deltaK: NaN, xi: NaN };
  const deltaK = deltaN === 0 ? 0 : (-2 * Math.PI * deltaN) / lambda3;
  const phase = (deltaK * length) / 2;
  const s = sinc(phase);
  const planeWave = (8 * Math.PI ** 2 * deff * deff * length * length * s * s) / (epsilon_0 * c * n * n * n3 * lambda3 ** 2);
  const bMin = Math.min(confocalParameter(lambda1, n, w1), confocalParameter(lambda2, n, w2));
  return { K: (planeWave * 2) / (Math.PI * (w1 * w1 + w2 * w2)), lambda3, deltaK, xi: length / bMin };
}

/** Average SFG power from synchronised Gaussian pulses: K g ⟨P₁⟩⟨P₂⟩/(f τ), W. */
export function averageSfgPower(K: number, power1: number, power2: number, repetitionRate: number, tauFwhm: number): number {
  if (!(repetitionRate > 0 && tauFwhm > 0 && power1 >= 0 && power2 >= 0)) return NaN;
  return (K * GAUSSIAN_PULSE_G2 * power1 * power2) / (repetitionRate * tauFwhm);
}

/** SFG coherence lengths π/|Δk|: forward λ₃/(2|Δn|) (∞ when phase-matched), backward λ₃/(2(2n + Δn)), m. */
export function sfgCoherenceLengths(lambda3: number, n: number, deltaN: number) {
  if (!(lambda3 > 0 && n >= 1 && n + deltaN >= 1)) return { forward: NaN, backward: NaN };
  return {
    forward: deltaN === 0 ? Infinity : lambda3 / (2 * Math.abs(deltaN)),
    backward: lambda3 / (2 * (2 * n + deltaN)),
  };
}
