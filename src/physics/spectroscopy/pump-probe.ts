import { c, h } from "../constants";
import { emgDecay } from "./fluorescence-lifetime";
import { crossSectionFromEpsilon } from "./lambert-beer-law";

/**
 * Pump-probe / transient absorption with a sequential scheme A → B → GS (first-order rates k₁ = 1/τ₁, k₂ = 1/τ₂).
 * SI units: times in s, wavelengths in m, fluence in J/m², ε in m²/mol. Model tier: textbook.
 *
 * Populations after a delta pump at t = 0 (fraction of the excited molecules):
 *   n_A = e^(−k₁t),  n_B = k₁/(k₁ − k₂) (e^(−k₂t) − e^(−k₁t))  (→ k₁ t e^(−k₁t) when k₁ = k₂),
 * and the ground state is depleted by n_A + n_B. With a Gaussian pump-probe cross-correlation (σ) each exponential
 * becomes the exponentially modified Gaussian of fluorescence-lifetime.ts, and k t e^(−kt) becomes
 * μ y(t) + σ/√(2π) e^(−t²/2σ²), μ = t − kσ² (the same Gaussian integral with one more power of t).
 * The transient absorbance is ΔA(λ, t) = Σᵢ nᵢ(t) SADSᵢ(λ) (global/target analysis), here with
 *   ΔA = f A_GS [−(n_A + n_B) g_GS(λ) + n_A (r_A g_A(λ) − r_SE g_SE(λ)) + n_B r_B g_B(λ)],
 * A_GS the ground-state absorbance at its band peak, g Gaussian band shapes (peak 1) and r the peak ε of each band
 * relative to the ground-state peak ε. I. H. M. van Stokkum, D. S. Larsen, R. van Grondelle, "Global and target
 * analysis of time-resolved spectra", Biochim. Biophys. Acta 1657, 82 (2004), doi 10.1016/j.bbabio.2004.04.011;
 * R. Berera, R. van Grondelle, J. T. M. Kennis, "Ultrafast transient absorption spectroscopy: principles and
 * application to photosynthetic systems", Photosynth. Res. 101, 105 (2009), doi 10.1007/s11120-009-9454-y.
 */

export interface Populations {
  a: number;
  b: number;
  /** Ground-state depletion n_A + n_B. */
  bleach: number;
}

/** Relative rate difference below which n_B uses the k₁ = k₂ form at the mean rate (error < (Δk t)²/24 ≈ 1e-9). */
const DEGENERATE = 1e-5;

/** k t e^(−kt) convolved with an area-normalised Gaussian of σ (t e^(−kt) for σ = 0, 0 for t < 0). */
function teDecay(t: number, k: number, sigma: number): number {
  if (sigma === 0) return t >= 0 ? k * t * Math.exp(-k * t) : 0;
  const mu = t - k * sigma * sigma;
  return k * (mu * emgDecay(t, 1 / k, sigma) + (sigma / Math.sqrt(2 * Math.PI)) * Math.exp(-(t * t) / (2 * sigma * sigma)));
}

/** Sequential populations at delay t (s) for lifetimes τ₁, τ₂ > 0 and cross-correlation σ ≥ 0 (s). */
export function sequentialPopulations(t: number, tau1: number, tau2: number, sigma = 0): Populations {
  if (!(tau1 > 0) || !(tau2 > 0) || !(sigma >= 0)) return { a: NaN, b: NaN, bleach: NaN };
  const k1 = 1 / tau1, k2 = 1 / tau2;
  const a = emgDecay(t, tau1, sigma);
  const kMean = (k1 + k2) / 2;
  const b = Math.abs(k1 - k2) < DEGENERATE * kMean
    ? (k1 / kMean) * teDecay(t, kMean, sigma)
    : (k1 / (k1 - k2)) * (emgDecay(t, tau2, sigma) - a);
  return { a, b, bleach: a + b };
}

/** Delay of the B maximum without IRF, t = ln(k₁/k₂)/(k₁ − k₂) (τ for k₁ = k₂), s. */
export function intermediatePeakTime(tau1: number, tau2: number): number {
  if (!(tau1 > 0) || !(tau2 > 0)) return NaN;
  const k1 = 1 / tau1, k2 = 1 / tau2;
  return Math.abs(k1 - k2) < DEGENERATE * k1 ? tau1 : Math.log(k1 / k2) / (k1 - k2);
}

/** Photons per area J = F λ/(hc) for fluence F (J/m²) at wavelength λ (m). */
export function photonFluence(fluence: number, wavelength: number): number {
  return (fluence * wavelength) / (h * c);
}

/**
 * Mean fraction of molecules excited by the pump, averaged over the sample depth, in the linear (unsaturated) regime:
 *   f̄ = J σ (1 − 10^(−A_p)) / (A_p ln 10),  J = F λ/(hc) photons per area, σ = ln 10 · ε / N_A,
 * i.e. absorbed photons per area divided by molecules per area (A_p ln 10 / σ). Valid while f̄ ≪ 1 (no ground-state
 * saturation); at the front face the fraction is σJ.
 */
export function excitationFraction(fluence: number, wavelength: number, epsilon: number, pumpAbsorbance: number): number {
  if (!(fluence >= 0) || !(wavelength > 0) || !(epsilon >= 0) || !(pumpAbsorbance >= 0)) return NaN;
  const sigmaJ = crossSectionFromEpsilon(epsilon) * photonFluence(fluence, wavelength);
  const x = pumpAbsorbance * Math.LN10;
  return x < 1e-12 ? sigmaJ : sigmaJ * (-Math.expm1(-x) / x);
}

export interface Band {
  /** Centre wavelength, m. */
  centre: number;
  /** FWHM, m (> 0). */
  fwhm: number;
  /** Peak ε relative to the ground-state peak ε (SE: stimulated-emission strength on the same scale). */
  strength: number;
}

/** Gaussian band shape with peak 1. */
export function bandShape(lambda: number, band: Band): number {
  const d = (lambda - band.centre) / band.fwhm;
  return Math.exp(-4 * Math.LN2 * d * d);
}

export interface TransientBands {
  groundState: Band;
  /** Excited-state absorption of A. */
  esaA: Band;
  /** Stimulated emission from A. */
  se: Band;
  /** Excited-state absorption of B. */
  esaB: Band;
}

export interface DeltaAParts {
  bleach: number;
  esaA: number;
  se: number;
  esaB: number;
  total: number;
}

/** ΔA(λ) and its parts for populations p, excitation fraction f and ground-state peak absorbance A_GS. */
export function deltaA(lambda: number, p: Populations, bands: TransientBands, fraction: number, groundAbsorbance: number): DeltaAParts {
  const s = fraction * groundAbsorbance;
  const bleach = -s * p.bleach * bandShape(lambda, bands.groundState);
  const esaA = s * p.a * bands.esaA.strength * bandShape(lambda, bands.esaA);
  const se = -s * p.a * bands.se.strength * bandShape(lambda, bands.se);
  const esaB = s * p.b * bands.esaB.strength * bandShape(lambda, bands.esaB);
  return { bleach, esaA, se, esaB, total: bleach + esaA + se + esaB };
}

/** Relative transmission change ΔT/T = 10^(−ΔA) − 1. */
export function deltaTOverT(dA: number): number {
  return Math.expm1(-dA * Math.LN10);
}
