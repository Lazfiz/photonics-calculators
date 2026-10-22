/**
 * Brillouin scattering in a bulk medium or the core of a fibre: the Stokes frequency shift, the acoustic wavelength and
 * phonon lifetime, and the peak gain of the Lorentzian Brillouin gain line.
 * Model tier: textbook (backward scattering from a single longitudinal acoustic mode, scalar fields, CW pump narrower
 * than the Brillouin line; no acoustic guiding or overlap integral of a real fibre).
 * SI units: λ in m, velocities in m/s, densities in kg/m³, frequencies in Hz, g_B in m/W.
 *
 * G. P. Agrawal, Nonlinear Fiber Optics, 6th ed. (Academic Press, 2019), doi:10.1016/C2018-0-01168-8, Brillouin
 * scattering:
 *   ν_B = 2 n v_A/λ_p,   Λ = λ_p/(2n) = v_A/ν_B,   T_B = 1/(πΔν_B),
 *   g_B = 2π n⁷ p₁₂² / (c λ_p² ρ₀ v_A Δν_B)   (peak of the Lorentzian line, Δν_B its FWHM),
 * with fused-silica values n = 1.45, v_A = 5.96 km/s, ρ₀ = 2210 kg/m³ and p₁₂ = 0.286. Δν_B scales as λ_p⁻² (the
 * phonon damping grows as the acoustic wavenumber squared), so the peak g_B hardly depends on the pump wavelength.
 * `brillouinShift` and `stokesWavelength` are in fiber-optics/fiber-nonlinear.ts; the threshold (`sbsThreshold`) is
 * there too and has its own page, fiber-optics/sbs-threshold.
 */

import { c } from "../constants";
import { SILICA_ACOUSTIC_VELOCITY, SILICA_MODE_INDEX } from "../fiber-optics/fiber-nonlinear";

export interface BrillouinMedium {
  name: string;
  /** Refractive (mode) index. */
  n: number;
  /** Longitudinal acoustic velocity, m/s. */
  vA: number;
  /** Density, kg/m³. */
  rho: number;
  /** Longitudinal elasto-optic coefficient p₁₂. */
  p12: number;
  source: string;
}

export const FUSED_SILICA_BRILLOUIN: BrillouinMedium = {
  name: "Fused silica",
  n: SILICA_MODE_INDEX,
  vA: SILICA_ACOUSTIC_VELOCITY,
  rho: 2210,
  p12: 0.286,
  source: "Agrawal, Nonlinear Fiber Optics, 6th ed.",
};

const positive = (x: number) => Number.isFinite(x) && x > 0;

/** Peak Brillouin gain g_B = 2π n⁷ p₁₂²/(c λ² ρ v_A Δν_B), m/W. NaN unless every input is positive. */
export function brillouinGain(lambdaPump: number, m: Pick<BrillouinMedium, "n" | "vA" | "rho" | "p12">, linewidth: number): number {
  if (![lambdaPump, m.n, m.vA, m.rho, m.p12, linewidth].every(positive)) return NaN;
  return (2 * Math.PI * m.n ** 7 * m.p12 ** 2) / (c * lambdaPump ** 2 * m.rho * m.vA * linewidth);
}

/** Acoustic wavelength Λ = λ_p/(2n) of the phonon that back-scatters the pump, m. */
export function acousticWavelength(lambdaPump: number, n: number): number {
  return positive(lambdaPump) && positive(n) ? lambdaPump / (2 * n) : NaN;
}

/** Phonon lifetime T_B = 1/(πΔν_B) from the FWHM gain bandwidth, s. */
export function phononLifetime(linewidth: number): number {
  return positive(linewidth) ? 1 / (Math.PI * linewidth) : NaN;
}
