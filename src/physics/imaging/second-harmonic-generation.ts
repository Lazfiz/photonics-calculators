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
 */

import { epsilon_0, c } from "../constants";

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
  const sinc = phase === 0 ? 1 : Math.sin(phase) / phase;
  const prefactor = (16 * Math.PI ** 2 * deff * deff * length) / (epsilon_0 * c * nOmega * n2 * lambda ** 3);
  return { K: prefactor * h, KNearField: prefactor * xi * sinc * sinc, h, xi, sigma, b, deltaK };
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
