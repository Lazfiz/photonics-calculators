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
 *
 * SRS detection: one beam is modulated and the other is detected; a Stokes gain (SRG) or a pump loss (SRL) of
 * relative size δ = ΔP/P appears on it. With shot noise of the detected beam alone, the N = ηPτλ/(hc) photoelectrons
 * counted in τ give SNR = δN/√N = δ√N (Y. Ozeki et al., Opt. Express 17, 3651 (2009), doi:10.1364/OE.17.003651:
 * shot-noise-limited sensitivity). Not modelled: laser excess noise, detector noise and the demodulation loss of the
 * lock-in, which make real systems worse.
 */

import { c, h } from "../constants";

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

/** Photoelectrons ηPτλ/(hc) from a beam of power P (W) and vacuum wavelength λ (m) in a time τ (s). */
export function detectedPhotoelectrons(power: number, lambda: number, time: number, quantumEfficiency: number): number {
  const ok = Number.isFinite(power) && power >= 0 && positive(lambda) && positive(time) && quantumEfficiency > 0 && quantumEfficiency <= 1;
  return ok ? (quantumEfficiency * power * time * lambda) / (h * c) : NaN;
}

/** Shot-noise-limited SRS SNR δ√N for a relative modulation δ = ΔP/P on the detected beam (Ozeki 2009). */
export function srsShotNoiseSnr(modulationDepth: number, power: number, lambda: number, time: number, quantumEfficiency: number): number {
  if (!(Number.isFinite(modulationDepth) && modulationDepth >= 0)) return NaN;
  return modulationDepth * Math.sqrt(detectedPhotoelectrons(power, lambda, time, quantumEfficiency));
}
