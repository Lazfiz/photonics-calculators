/**
 * Multi-exponential fluorescence decay I(t) = Σ αᵢ exp(−t/τᵢ) and its average lifetimes. SI units: times in s.
 * Model tier: exact (definitions).
 *
 * The fractional intensity fᵢ = αᵢτᵢ / Σ αⱼτⱼ is component i's share of the time-integrated (steady-state)
 * emission. Two averages are in use:
 * - intensity-weighted ⟨τ⟩_int = Σ fᵢτᵢ = Σ αᵢτᵢ² / Σ αᵢτᵢ, the mean arrival time of the emitted photons;
 * - amplitude-weighted ⟨τ⟩_amp = Σ αᵢτᵢ / Σ αᵢ, the area under the normalised decay, which is proportional to the
 *   quantum yield when all components share one radiative rate (Φ = ⟨τ⟩_amp / τ_rad).
 * J. R. Lakowicz, Principles of Fluorescence Spectroscopy, 3rd ed. (Springer, 2006), ch. 4 (multi-exponential
 * decays); A. Sillen, Y. Engelborghs, "The correct use of 'average' fluorescence parameters", Photochem. Photobiol.
 * 67, 475 (1998).
 */

import { c } from "../constants";
import { erfc, erfcx } from "../math";

export interface DecayComponent {
  /** Pre-exponential amplitude αᵢ ≥ 0 (any scale). */
  amplitude: number;
  /** Lifetime τᵢ, s, > 0. */
  lifetime: number;
}

/** I(t) = Σ αᵢ exp(−t/τᵢ). */
export function decayIntensity(components: DecayComponent[], t: number): number {
  return components.reduce((sum, c) => sum + c.amplitude * Math.exp(-t / c.lifetime), 0);
}

/** Fractional intensities fᵢ = αᵢτᵢ / Σ αⱼτⱼ. */
export function fractionalIntensities(components: DecayComponent[]): number[] {
  const total = components.reduce((s, c) => s + c.amplitude * c.lifetime, 0);
  return components.map((c) => (total > 0 ? (c.amplitude * c.lifetime) / total : NaN));
}

/** Amplitude-weighted mean lifetime Σ αᵢτᵢ / Σ αᵢ, s. */
export function amplitudeWeightedLifetime(components: DecayComponent[]): number {
  const a = components.reduce((s, c) => s + c.amplitude, 0);
  return a > 0 ? components.reduce((s, c) => s + c.amplitude * c.lifetime, 0) / a : NaN;
}

/** Intensity-weighted mean lifetime Σ αᵢτᵢ² / Σ αᵢτᵢ, s. */
export function intensityWeightedLifetime(components: DecayComponent[]): number {
  const at = components.reduce((s, c) => s + c.amplitude * c.lifetime, 0);
  return at > 0 ? components.reduce((s, c) => s + c.amplitude * c.lifetime ** 2, 0) / at : NaN;
}

/** Quantum yield Φ = ⟨τ⟩_amp / τ_rad, or NaN if that exceeds 1 (τ_rad shorter than the decay). */
export function quantumYield(components: DecayComponent[], radiativeLifetime: number): number {
  const phi = amplitudeWeightedLifetime(components) / radiativeLifetime;
  return phi >= 0 && phi <= 1 ? phi : NaN;
}

/**
 * IRF-convolved decay. The instrument response is an area-normalised Gaussian of standard deviation σ centred at
 * t₀; one exponential e^(−t/τ) started by a delta pulse at t₀ then gives the exponentially modified Gaussian
 *   y(t) = e^(σ²/2τ² − (t−t₀)/τ) Φ((t − t₀ − σ²/τ)/σ) = ½ e^(σ²/2τ² − x/τ) erfc(z),  x = t − t₀, z = (σ²/τ − x)/(σ√2),
 * which tends to e^(−x/τ) once x ≫ σ. For z > 0 the identity e^(σ²/2τ² − x/τ) erfc z = e^(−x²/2σ²) erfcx z avoids the
 * overflow of the first factor. Model tier: exact for a Gaussian IRF. E. Grushka, "Characterization of exponentially
 * modified Gaussian peaks in chromatography", Anal. Chem. 44, 1733 (1972), doi 10.1021/ac60319a011; Lakowicz, ch. 4.
 */
export function emgDecay(t: number, lifetime: number, irfSigma: number, t0 = 0): number {
  const x = t - t0;
  if (!(lifetime > 0) || !(irfSigma >= 0)) return NaN;
  if (irfSigma === 0) return x >= 0 ? Math.exp(-x / lifetime) : 0;
  const z = (irfSigma * irfSigma / lifetime - x) / (irfSigma * Math.SQRT2);
  if (z > 0) return 0.5 * Math.exp(-(x * x) / (2 * irfSigma * irfSigma)) * erfcx(z);
  return 0.5 * Math.exp((irfSigma * irfSigma) / (2 * lifetime * lifetime) - x / lifetime) * erfc(z);
}

/** Σ αᵢ yᵢ(t): a multi-exponential decay convolved with a Gaussian IRF (σ, centre t₀). */
export function convolvedDecay(components: DecayComponent[], t: number, irfSigma: number, t0 = 0): number {
  return components.reduce((sum, c) => sum + c.amplitude * emgDecay(t, c.lifetime, irfSigma, t0), 0);
}

/**
 * The same decay under a pulse train of period T (TCSPC at repetition rate 1/T): Σₙ y(t + nT) over all pulses t₀ − nT,
 * so tails of earlier pulses that have not decayed add to the window ("incomplete decay"). The sum is periodic, so t − t₀
 * is first reduced into [0, T); pulses later than t by more than 8σ (Gaussian tail < 2e-15) are dropped. Once Φ in y
 * has reached 1 (argument ≥ 8, error < 7e-16) the remaining terms are a geometric series, summed in closed form:
 * e^(σ²/2τ² − x_m/τ) / (1 − e^(−T/τ)). NaN if T ≤ 0 or more than 10⁵ explicit terms would be needed (σ ≫ T).
 * W. Becker, Advanced Time-Correlated Single Photon Counting Techniques (Springer, 2005).
 */
export function periodicDecay(components: DecayComponent[], t: number, irfSigma: number, t0: number, period: number): number {
  if (!(period > 0) || !Number.isFinite(t - t0)) return NaN;
  const x = (((t - t0) % period) + period) % period;
  // First n with x + nT ≥ −8σ; the pulses before it have not arrived.
  const n0 = Math.min(-1, Math.ceil((-8 * irfSigma - x) / period));
  let sum = 0;
  for (const c of components) {
    const tau = c.lifetime;
    // First n with (x + nT − σ²/τ)/σ ≥ 8.
    const m = Math.max(0, Math.ceil((irfSigma * irfSigma / tau + 8 * irfSigma - x) / period));
    if (m - n0 > 1e5) return NaN;
    let s = 0;
    for (let n = n0; n < m; n++) s += emgDecay(x + n * period, tau, irfSigma, 0);
    const xm = x + m * period;
    s += Math.exp((irfSigma * irfSigma) / (2 * tau * tau) - xm / tau) / -Math.expm1(-period / tau);
    sum += c.amplitude * s;
  }
  return sum;
}

/**
 * Transform-limited bandwidth of a Gaussian pulse of intensity FWHM Δt: Δν = (2 ln 2/π)/Δt = 0.4413/Δt (Hz), and the
 * matching wavelength width about λ₀, exact for a band symmetric in frequency: Δλ = λ₀ (Δν/ν₀) / (1 − (Δν/2ν₀)²).
 * J.-C. Diels, W. Rudolph, Ultrashort Laser Pulse Phenomena, 2nd ed. (Academic Press, 2006), ch. 1.
 */
export function gaussianPulseBandwidth(fwhm: number, lambda0: number): { hz: number; lambda: number } {
  if (!(fwhm > 0) || !(lambda0 > 0)) return { hz: NaN, lambda: NaN };
  const hz = (2 * Math.LN2) / (Math.PI * fwhm);
  const r = (hz * lambda0) / c;
  return { hz, lambda: r < 2 ? (lambda0 * r) / (1 - (r / 2) ** 2) : Infinity };
}
