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
 *   electron (E_ph = hc/λ_peak). PHOSPHOR_SCREENS holds measured gains at 5 kV, so their η includes the aluminium
 *   film's loss there; scaling them ∝ V ignores the film's dead voltage, which makes the gain fall faster below 5 kV.
 *   Each further stage adds to the noise factor (F_k − 1)/(G₁…G_(k−1)) (cascade formula); a Poisson phosphor
 *   (F = 1 + 1/g) and a binomial coupling p (F = 1/p) together add 1/(g·p), so F = F_MCP + 1/G_e with G_e the CCD
 *   electrons per photoelectron. W. Shockley, J. R. Pierce, Proc. IRE 26, 321 (1938), doi:10.1109/JRPROC.1938.228127.
 *   F here is a variance factor; intensifier data sheets quote the amplitude ratio K_f = SNR_in/SNR_out, so F = K_f².
 * - The phosphor light of one photoelectron spreads over several CCD pixels (Gaussian spot, FWHM w pixels): its
 *   centre pixel gets the share s₀² (s₀ = erf(1/(2√2σ)), σ = w/2.3548). The SNR is per pixel-sized element of the
 *   photocathode, read through the matched filter h/Σh²: read noise from N_eff = 1/Σh² pixels (I. R. King, PASP 95,
 *   163 (1983), doi:10.1086/131139, noise-equivalent area) and even background from κ ≈ N_eff/2 pixels (intensifiedSnr).
 *   In an even field each pixel's variance is N·G_e²·(F_MCP·Σh² + 1/G_e) (derived here; a Monte Carlo agrees to
 *   0.5 %), lower than N·G_e²·(F_MCP + 1/G_e), but neighbouring pixels correlate.
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

/** Energy efficiency g·E_ph/(qV) of a screen that gives g photons per electron at voltage V (V) and peak λ (m). */
export function phosphorEfficiency(photonsPerElectron: number, voltage: number, wavelength: number): number {
  if (!(photonsPerElectron >= 0) || !(voltage > 0) || !(wavelength > 0)) return NaN;
  return (photonsPerElectron * h * c) / (q * voltage * wavelength);
}

/**
 * Phosphor screens: photons per electron at 5 kV and peak wavelength from Photek, Image Diode data sheet PH-DS039
 * Rev 02 (2021), "Phosphor options"; decay to 10 % from Stanford Computer Optics, "Image intensifier: phosphor screen".
 */
export const PHOSPHOR_SCREENS = {
  p43: { label: "P43 (Gd₂O₂S:Tb)", photonsAt5kV: 240, peak: 548e-9, decay: "1.5 ms to 10 %" },
  p46: { label: "P46 (Y₃Al₅O₁₂:Ce)", photonsAt5kV: 55, peak: 530e-9, decay: "0.2 µs to 10 %" },
} as const;

/** Pixel statistics of a spot spread over the grid (h_i its pixel shares, Σh = 1); a point spot has every value 1. */
export interface SpotStatistics {
  /** Share of the pixel under the spot centre. */
  peak: number;
  /** Σh²; N_eff = 1/Σh². */
  sumSquares: number;
  /** Σh³/(Σh²)²: the phosphor term of the signal variance through the matched filter. */
  cubeRatio: number;
  /** κ = Σ(h⋆h)²/(Σh²)²: pixels' worth of even background inside the matched filter (→ N_eff/2 for a wide spot). */
  footprint: number;
}

export const POINT_SPOT: SpotStatistics = { peak: 1, sumSquares: 1, cubeRatio: 1, footprint: 1 };

/**
 * Statistics of a Gaussian spot (FWHM in pixels, ≤ 1000) centred on a pixel. The 2-D shares are products of 1-D shares
 * s_k = ½[erf((k + ½)/σ√2) − erf((k − ½)/σ√2)], so every sum factorises; a_m = Σ s_k·s_(k+m) is the 1-D autocorrelation.
 */
export function gaussianSpotShares(fwhmPixels: number): SpotStatistics {
  if (!(fwhmPixels >= 0 && fwhmPixels <= 1e3)) return { peak: NaN, sumSquares: NaN, cubeRatio: NaN, footprint: NaN };
  if (fwhmPixels === 0) return POINT_SPOT;
  const s = (fwhmPixels / FWHM_PER_SIGMA) * Math.SQRT2;
  const K = Math.ceil(6 * s) + 1;
  const shares = Array.from({ length: 2 * K + 1 }, (_, i) => 0.5 * (erf((i - K + 0.5) / s) - erf((i - K - 0.5) / s)));
  const sum = (f: (x: number, i: number) => number) => shares.reduce((acc, x, i) => acc + f(x, i), 0);
  const s2 = sum((x) => x * x);
  const s3 = sum((x) => x ** 3);
  let a2 = 0; // Σ_m a_m²
  for (let m = -2 * K; m <= 2 * K; m++) {
    const a = sum((x, i) => (i + m >= 0 && i + m <= 2 * K ? x * shares[i + m] : 0));
    a2 += a * a;
  }
  return { peak: shares[K] ** 2, sumSquares: s2 ** 2, cubeRatio: s3 ** 2 / s2 ** 4, footprint: a2 ** 2 / s2 ** 4 };
}

/** Noise factor F_MCP + 1/G_e of an intensifier whose MCP (noise factor F_MCP ≥ 1) is followed by G_e CCD electrons per photoelectron. */
export function intensifierNoiseFactor(mcpNoiseFactor: number, electronsPerPhotoelectron: number): number {
  if (!(mcpNoiseFactor >= 1) || !(electronsPerPhotoelectron > 0)) return NaN;
  return mcpNoiseFactor + 1 / electronsPerPhotoelectron;
}

/**
 * SNR of an intensified element (S signal photoelectrons from one pixel area, B background photoelectrons per pixel
 * area) read through the matched filter w = h/Σh² of the spot:
 *   Var = S·G_e²·(F_MCP + c₃/G_e) + B·G_e²·(F_MCP·κ + N_eff/G_e) + N_eff·σ_r²,
 * with G_e CCD electrons per photoelectron, F_MCP the tube's variance factor (K_f²), σ_r the read noise (e⁻ rms) and c₃,
 * κ, N_eff from SpotStatistics (derived here from the compound-Poisson pixel covariance
 * Cov_ij = n·[G_e²·F_MCP·(h⋆h)_(i−j) + G_e·h_i·δ_ij]). A point spot gives (S + B)·G_e²·(F_MCP + 1/G_e) + σ_r².
 */
export function intensifiedSnr(signal: number, background: number, electronsPerPhotoelectron: number, mcpNoiseFactor: number, readNoise: number, spot: SpotStatistics = POINT_SPOT): number {
  if (!(signal >= 0 && background >= 0 && electronsPerPhotoelectron > 0 && mcpNoiseFactor >= 1 && readNoise >= 0 && spot.sumSquares > 0)) return NaN;
  const ge = electronsPerPhotoelectron;
  const nEff = 1 / spot.sumSquares;
  const variance = signal * ge ** 2 * (mcpNoiseFactor + spot.cubeRatio / ge)
    + background * ge ** 2 * (mcpNoiseFactor * spot.footprint + nEff / ge) + nEff * readNoise ** 2;
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
