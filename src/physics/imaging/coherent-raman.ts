/**
 * Coherent Raman (CARS and SRS) wavelengths and lineshapes. SI units in and out: wavelengths in m, Raman shifts
 * as wavenumbers in 1/m (1 cm⁻¹ = 100 m⁻¹), frequencies in Hz. Model tier: exact (wavelengths) and textbook
 * (single-Lorentzian lineshapes).
 *
 * Energy conservation, with ν̃ = 1/λ and the Raman shift Ω̃ = ν̃_p − ν̃_s:
 *   Stokes        ν̃_s  = ν̃_p − Ω̃
 *   anti-Stokes   ν̃_as = 2ν̃_p − ν̃_s = ν̃_p + Ω̃   (CARS signal)
 * CARS ∝ |χ_NR + χ_R|² I_p² I_s, SRS ∝ Im χ_R · I_p I_s (no non-resonant background), with one Raman line
 *   χ_R(Δ) = −Γ/(Δ + iΓ),  Δ = ω_p − ω_s − Ω,  so Im χ_R(0) = 1 and Γ is the half width at half maximum.
 * J.-X. Cheng, X. S. Xie, J. Phys. Chem. B 108, 827 (2004); C. W. Freudiger et al., Science 322, 1857 (2008).
 * The CARS line is dispersive: its maximum lies below the resonance, at Δ = Γ(1 − √(1 + 4a²))/(2a) for
 * a = χ_NR (real), and a dip follows above it.
 */

import { c } from "../constants";

const positive = (x: number) => Number.isFinite(x) && x > 0;

/** Stokes wavelength 1/(1/λ_p − Ω̃), m. NaN if the shift is not below the pump wavenumber. */
export function stokesWavelength(lambdaPump: number, ramanShift: number): number {
  if (!positive(lambdaPump) || !(Number.isFinite(ramanShift) && ramanShift >= 0)) return NaN;
  const nu = 1 / lambdaPump - ramanShift;
  return nu > 0 ? 1 / nu : NaN;
}

/** Anti-Stokes (CARS) wavelength 1/(1/λ_p + Ω̃), m. */
export function antiStokesWavelength(lambdaPump: number, ramanShift: number): number {
  if (!positive(lambdaPump) || !(Number.isFinite(ramanShift) && ramanShift >= 0)) return NaN;
  return 1 / (1 / lambdaPump + ramanShift);
}

/** Raman shift as a frequency, c·Ω̃, Hz. */
export function ramanShiftFrequency(ramanShift: number): number {
  return Number.isFinite(ramanShift) ? c * ramanShift : NaN;
}

/** CARS lineshape |χ_NR + χ_R(Δ)|² = ((aΔ − Γ)² + a²Γ²)/(Δ² + Γ²), with Im χ_R(0) = 1 (Δ, Γ in any common unit). */
export function carsLineshape(detuning: number, gamma: number, chiNR: number): number {
  if (!positive(gamma) || !Number.isFinite(detuning) || !Number.isFinite(chiNR)) return NaN;
  const re = chiNR - (gamma * detuning) / (detuning * detuning + gamma * gamma);
  const im = (gamma * gamma) / (detuning * detuning + gamma * gamma);
  return re * re + im * im;
}

/** SRS lineshape Im χ_R(Δ) = Γ²/(Δ² + Γ²). */
export function srsLineshape(detuning: number, gamma: number): number {
  if (!positive(gamma) || !Number.isFinite(detuning)) return NaN;
  return (gamma * gamma) / (detuning * detuning + gamma * gamma);
}

/** Detuning of the CARS maximum, Γ(1 − √(1 + 4a²))/(2a) (→ 0 as a → 0), same unit as Γ. */
export function carsPeakDetuning(gamma: number, chiNR: number): number {
  if (!positive(gamma) || !Number.isFinite(chiNR)) return NaN;
  if (chiNR === 0) return 0;
  // (1 − √(1 + 4a²))/(2a) = −2a/(1 + √(1 + 4a²)), without cancellation at small a.
  return (-2 * chiNR * gamma) / (1 + Math.sqrt(1 + 4 * chiNR * chiNR));
}
