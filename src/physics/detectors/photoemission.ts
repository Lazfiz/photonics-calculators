/**
 * Photoemissive detectors: the vacuum photodiode, the image intensifier behind an ICCD and the streak tube. SI units
 * except where a name says otherwise. Invalid inputs give NaN.
 *
 * - Thermionic emission (Richardson–Dushman): J = A₀·T²·exp(−φ/k_B·T) with A₀ = 4π·m_e·k_B²·q/h³ = 1.2017×10⁶ A/(m²·K²).
 *   Real photocathodes emit less than A₀ predicts (a reflection factor, patchy φ). N. W. Ashcroft, N. D. Mermin, Solid
 *   State Physics (1976), ch. 18; S. Dushman, Phys. Rev. 21, 623 (1923), doi:10.1103/PhysRev.21.623.
 * - Planar diode, gap d, voltage V: an electron leaving the cathode at rest crosses in τ = d·√(2m_e/qV). By Ramo's
 *   theorem (S. Ramo, Proc. IRE 27, 584 (1939), doi:10.1109/JRPROC.1939.228757) its current pulse is the ramp
 *   i(t) = 2q·t/τ², whose spectrum is H(x) = 2[(1 + ix)·e^(−ix) − 1]/x² with x = 2πfτ; |H| = 1/√2 at x = 3.4767, so
 *   f_tr = 0.5533/τ (derived here). Space charge caps the current at Child's law J = (4ε₀/9)·√(2q/m_e)·V^(3/2)/d²
 *   (C. D. Child, Phys. Rev. (Series I) 32, 492 (1911), doi:10.1103/PhysRevSeriesI.32.492). Thermionic emission at
 *   the photoemission threshold fits metals; semiconductor photocathodes emit over a lower barrier, so their dark
 *   emission comes from measured values (PHOTOCATHODE_DARK_EMISSION). The RC limit uses the gap capacitance ε₀A/d plus
 *   the stray (anode-to-electrodes and wiring) capacitance C_s: f_c = 1/(2π C_s R_L) (Hamamatsu PMT handbook, Eq. 5-7).
 * - Image intensifier: a phosphor of energy efficiency η hit by electrons of energy qV emits η·qV/E_ph photons per
 *   electron (E_ph = hc/λ_peak); the aluminium film's dead voltage, ignored here, lowers it. Each further stage adds
 *   to the noise factor (F_k − 1)/(G₁…G_(k−1)) (cascade formula); a Poisson phosphor (F = 1 + 1/g) and a binomial
 *   coupling p (F = 1/p) together add 1/(g·p), so F = F_MCP + 1/G_e with G_e the CCD electrons per photoelectron.
 *   W. Shockley, J. R. Pierce, Proc. IRE 26, 321 (1938), doi:10.1109/JRPROC.1938.228127.
 * - Streak camera: the slit image (width w·M on the screen) and one readout pixel are rectangles of length/sweep
 *   speed; the tube's own limit, its screen blur and trigger jitter are Gaussians, which add in quadrature. The
 *   resolution is the FWHM of their convolution (Hamamatsu, Guide to Streak Cameras, 2008: the FWHM of the streak
 *   image of a delta pulse). Technical (slit/sweep) and physical limits: E. K. Zavoisky, S. D. Fanchenko, Appl. Opt.
 *   4, 1155 (1965), doi:10.1364/AO.4.001155.
 */

import { c, epsilon_0, h, k_B, m_e, q } from "../constants";
import { erf, firstCrossing } from "../math";
import { FWHM_PER_SIGMA } from "./electron-multiplier";

/** Richardson constant A₀ = 4π·m_e·k_B²·q/h³, A/(m²·K²). */
export const RICHARDSON_A0 = (4 * Math.PI * m_e * k_B ** 2 * q) / h ** 3;

/** f_tr·τ for the ramp current of an electron accelerated from rest across a planar gap: x/2π with |H(x)| = 1/√2. */
export const VACUUM_TRANSIT_FACTOR = 0.55332713;

/** Thermionic current density A₀·T²·exp(−φ/k_B·T) of a cathode at T (K) with work function φ (eV), A/m². */
export function thermionicCurrentDensity(temperature: number, workFunction_eV: number): number {
  if (!(temperature > 0) || !(workFunction_eV > 0)) return NaN;
  return RICHARDSON_A0 * temperature ** 2 * Math.exp(-(workFunction_eV * q) / (k_B * temperature));
}

/**
 * Dark (thermionic) emission of photocathodes at 25 °C, A/m², from Burle Photomultiplier Handbook (Burle Industries,
 * 1980), Table I, "Dark Emission at 25 °C (fA/cm²)" (1 fA/cm² = 1e-11 A/m²). A semiconductor photocathode emits over
 * a barrier below its photoemission threshold E_G + E_A (Burle p. 20; Hamamatsu, Photomultiplier Tubes: Basics and
 * Applications, 4th ed., §4.3.6, Eq. 4-19), so the threshold cannot predict it.
 */
export const PHOTOCATHODE_DARK_EMISSION: readonly { name: string; jDark25: number }[] = [
  { name: "Na₂KSb (bialkali, high temperature)", jDark25: 0.0003e-11 },
  { name: "K₂CsSb (bialkali)", jDark25: 0.02e-11 },
  { name: "Cs₃Sb (S-11)", jDark25: 3e-11 },
  { name: "Na₂KSb:Cs (S-20)", jDark25: 0.4e-11 },
  { name: "GaAs:Cs-O", jDark25: 92e-11 },
];

/**
 * Effective barrier ψ (eV) for which Richardson–Dushman gives the dark emission jRef (A/m²) at tRef (K):
 * ψ = k_B·T·ln(A₀T²/j). It carries a measured 25 °C value to other temperatures; the impurity-semiconductor law has
 * T^(5/4) in place of T² and real cathodes curve away on an Arrhenius plot (Burle Fig. 16), so away from 25 °C the
 * scaling is an order-of-magnitude estimate.
 */
export function effectiveThermionicBarrier(jRef: number, tRef: number): number {
  if (!(jRef > 0) || !(tRef > 0)) return NaN;
  return ((k_B * tRef) / q) * Math.log((RICHARDSON_A0 * tRef ** 2) / jRef);
}

/** Longest wavelength hc/φ that can free an electron over a threshold φ (eV), m. */
export function thresholdWavelength(threshold_eV: number): number {
  return threshold_eV > 0 ? (h * c) / (threshold_eV * q) : NaN;
}

/** Transit time d·√(2m_e/qV) of an electron starting at rest across a planar gap d (m) at voltage V, s. */
export function planarTransitTime(gap: number, voltage: number): number {
  if (!(gap > 0) || !(voltage > 0)) return NaN;
  return gap * Math.sqrt((2 * m_e) / (q * voltage));
}

/** −3 dB frequency 0.5533/τ of the ramp transit current, Hz. */
export function vacuumTransitBandwidth(transitTime: number): number {
  return transitTime > 0 ? VACUUM_TRANSIT_FACTOR / transitTime : NaN;
}

/** Child's space-charge-limited current density (4ε₀/9)·√(2q/m_e)·V^(3/2)/d², A/m². */
export function childLangmuirCurrentDensity(voltage: number, gap: number): number {
  if (!(voltage >= 0) || !(gap > 0)) return NaN;
  return ((4 * epsilon_0) / 9) * Math.sqrt((2 * q) / m_e) * voltage ** 1.5 / gap ** 2;
}

/** Photons per electron η·qV/E_ph of a phosphor screen at voltage V with energy efficiency η and peak λ (m). */
export function phosphorGain(efficiency: number, voltage: number, wavelength: number): number {
  if (!(efficiency >= 0 && efficiency <= 1) || !(voltage >= 0) || !(wavelength > 0)) return NaN;
  return (efficiency * q * voltage * wavelength) / (h * c);
}

/** Noise factor F_MCP + 1/G_e of an intensifier whose MCP (noise factor F_MCP ≥ 1) is followed by G_e CCD electrons per photoelectron. */
export function intensifierNoiseFactor(mcpNoiseFactor: number, electronsPerPhotoelectron: number): number {
  if (!(mcpNoiseFactor >= 1) || !(electronsPerPhotoelectron > 0)) return NaN;
  return mcpNoiseFactor + 1 / electronsPerPhotoelectron;
}

/**
 * SNR of an intensified pixel: S·G_e/√((S + B)·G_e²·F + σ_r²) with S signal and B background photoelectrons, G_e CCD
 * electrons per photoelectron, F the noise factor and σ_r the read noise (e⁻ rms).
 */
export function intensifiedSnr(signal: number, background: number, electronsPerPhotoelectron: number, noiseFactor: number, readNoise: number): number {
  if (!(signal >= 0 && background >= 0 && electronsPerPhotoelectron > 0 && noiseFactor >= 1 && readNoise >= 0)) return NaN;
  const ge = electronsPerPhotoelectron;
  const variance = (signal + background) * ge ** 2 * noiseFactor + readNoise ** 2;
  return variance > 0 ? (signal * ge) / Math.sqrt(variance) : NaN;
}

/** Time a length L (m) on the screen spans at sweep speed v (m/s), s. */
export function streakTime(length: number, sweepSpeed: number): number {
  return length >= 0 && sweepSpeed > 0 ? length / sweepSpeed : NaN;
}

/**
 * Time window of a streak camera, s: the part of the sweep that is both on the phosphor screen and in the readout,
 * min(readout length, screen length)/v, all lengths on the screen (m) and v in m/s. Hamamatsu quotes sweep times per
 * "full screen" with a given camera (C16910 data sheet: Ø18 mm P-43 screen, read by an ORCA-Flash4.0 V3).
 */
export function streakWindow(readoutLength: number, screenLength: number, sweepSpeed: number): number {
  return screenLength > 0 ? streakTime(Math.min(readoutLength, screenLength), sweepSpeed) : NaN;
}

/** Quadrature sum √(Σ t_i²) of FWHM contributions (s); NaN if any is negative or NaN. Exact for Gaussians. */
export function quadratureFwhm(terms: readonly number[]): number {
  if (!terms.every((t) => t >= 0)) return NaN;
  return Math.sqrt(terms.reduce((s, t) => s + t * t, 0));
}

/** ∫erf = x·erf(x) + e^(−x²)/√π, even in x. */
const erfIntegral = (x: number) => x * erf(x) + Math.exp(-x * x) / Math.sqrt(Math.PI);

/**
 * FWHM of up to two rectangles (widths a, b ≥ 0) convolved with a Gaussian of FWHM g, in any unit. With
 * s = σ√2, rect a ⊗ Gauss ∝ erf((t + a/2)/s) − erf((t − a/2)/s), and the second rectangle integrates that with
 * ∫erf; the half-maximum point is bisected (firstCrossing, 1e-13 relative). Rectangles alone give max(a, b) (a
 * trapezoid); a Gaussian alone gives g. Quadrature overstates the rectangles: √(a² + b²) instead of max(a, b).
 */
export function rectGaussFwhm(rectWidths: readonly number[], gaussianFwhm: number): number {
  if (!(gaussianFwhm >= 0) || rectWidths.length > 2 || !rectWidths.every((w) => w >= 0)) return NaN;
  const rects = rectWidths.filter((w) => w > 0);
  const span = rects.reduce((s, w) => s + w, 0);
  if (span === 0) return gaussianFwhm;
  if (gaussianFwhm <= 1e-9 * span) return Math.max(...rects);
  const s = (gaussianFwhm / FWHM_PER_SIGMA) * Math.SQRT2;
  const profile = rects.length === 1
    ? (t: number) => erf((t + span / 2) / s) - erf((t - span / 2) / s)
    : (t: number) => {
      const [a, b] = rects;
      return erfIntegral((t + (a + b) / 2) / s) - erfIntegral((t + (a - b) / 2) / s)
        - erfIntegral((t - (a - b) / 2) / s) + erfIntegral((t - (a + b) / 2) / s);
    };
  const peak = profile(0);
  return 2 * firstCrossing((t) => profile(t) / peak, 0, span + 2 * gaussianFwhm, 0.5);
}
