/**
 * Optical Kerr effect in a bulk medium, n = n₀ + n₂I: critical power for self-focusing, the thin Kerr lens, the
 * self-focusing (collapse) distance and self-phase modulation (SPM) of a pulse.
 * SI units: λ is the vacuum wavelength in m, n₂ in m²/W, powers in W, intensities in W/m², lengths in m, times in s.
 * Model tier: textbook (instantaneous Kerr response of a TEM₀₀ beam; no dispersion, plasma or multiphoton absorption).
 *
 * - Critical power of a Gaussian beam P_cr = 3.77 λ²/(8π n₀ n₂) (G. Fibich & A. L. Gaeta, Opt. Lett. 25, 335 (2000),
 *   doi 10.1364/OL.25.000335); the Townes profile collapses at 3.72 λ²/(8π n₀ n₂), 1.3 % lower.
 * - Thin Kerr lens: near the axis I(r) = I₀ e^(−2r²/w²) ≈ I₀(1 − 2r²/w²), so a slab of length L adds the phase
 *   k₀ n₂ I₀ L (1 − 2r²/w²); matching the thin-lens phase −k₀r²/(2f) gives 1/f = 4n₂I₀L/w² = 8n₂PL/(πw⁴) with
 *   I₀ = 2P/(πw²) (V. Magni, G. Cerullo & S. De Silvestri, Opt. Commun. 96, 348 (1993),
 *   doi 10.1016/0030-4018(93)90284-C). Valid for L well below z_R and f, and P well below P_cr.
 * - Self-focusing distance of a collimated Gaussian beam (Dawes–Marburger fit to numerical solutions; J. H. Marburger,
 *   Prog. Quantum Electron. 4, 35 (1975), doi 10.1016/0079-6727(75)90003-8):
 *   z_sf = 0.367 z_R / √((√(P/P_cr) − 0.852)² − 0.0219), z_R = π n₀ w₀²/λ (w₀ the 1/e² radius). A lens of focal
 *   length f moves it to 1/z′ = 1/z_sf + 1/f (A. Dubietis et al., Lith. J. Phys. 57(3) (2017),
 *   doi 10.3952/physics.v57i3.3541; eq. 16 of arXiv:1706.04356).
 * - SPM (G. P. Agrawal, Nonlinear Fiber Optics, 6th ed. (2019), ch. 4; R. H. Stolen & C. Lin, Phys. Rev. A 17, 1448
 *   (1978), doi 10.1103/PhysRevA.17.1448): without dispersion the field keeps its envelope and gains the phase
 *   φ(T) = φ_max |U(T)|², φ_max = k₀ n₂ I₀ L (on axis, k₀ = 2π/λ). Its spectrum is the Fourier transform of
 *   U(T) e^(iφ(T)), computed here by FFT.
 */

import { fftRadix2 } from "../fft";
import { spmRmsBroadening as gaussianRmsBroadening } from "../fiber-optics/fiber-nonlinear";
import { rayleighRange } from "./gaussian-beam";

const finitePositive = (x: number) => Number.isFinite(x) && x > 0;
const finiteNonNegative = (x: number) => Number.isFinite(x) && x >= 0;

/** Prefactor of the Gaussian-beam critical power P_cr = 3.77 λ²/(8π n₀ n₂) (Fibich & Gaeta 2000). */
export const GAUSSIAN_CRITICAL_POWER_FACTOR = 3.77;

/** Critical power for self-focusing of a Gaussian beam, W. NaN unless λ, n₀ and n₂ are > 0. */
export function criticalPower(lambda: number, n0: number, n2: number): number {
  if (!(finitePositive(lambda) && finitePositive(n0) && finitePositive(n2))) return NaN;
  return (GAUSSIAN_CRITICAL_POWER_FACTOR * lambda ** 2) / (8 * Math.PI * n0 * n2);
}

/** On-axis peak intensity of a TEM₀₀ beam, I₀ = 2P/(πw²), W/m². NaN for P < 0 or w ≤ 0. */
export function gaussianPeakIntensity(power: number, w: number): number {
  return finiteNonNegative(power) && finitePositive(w) ? (2 * power) / (Math.PI * w ** 2) : NaN;
}

/** Nonlinear phase φ = k₀ n₂ I L with k₀ = 2π/λ (vacuum), rad. Also the B-integral of a uniform slab. */
export function nonlinearPhase(lambda: number, n2: number, intensity: number, length: number): number {
  if (!(finitePositive(lambda) && Number.isFinite(n2) && finiteNonNegative(intensity) && finiteNonNegative(length))) return NaN;
  return ((2 * Math.PI) / lambda) * n2 * intensity * length;
}

/**
 * Focal length of the thin Kerr lens, f = πw⁴/(8 n₂ P L), m. Negative for n₂ < 0 (defocusing), Infinity when
 * n₂PL = 0; NaN for w ≤ 0, P < 0 or L < 0.
 */
export function kerrLensFocalLength(n2: number, power: number, length: number, w: number): number {
  if (!(Number.isFinite(n2) && finiteNonNegative(power) && finiteNonNegative(length) && finitePositive(w))) return NaN;
  const strength = 8 * n2 * power * length;
  return strength === 0 ? Infinity : (Math.PI * w ** 4) / strength;
}

/** Rayleigh range inside a medium of index n₀, z_R = π n₀ w₀²/λ, m (λ in vacuum). */
export function rayleighRangeInMedium(lambda: number, n0: number, w0: number): number {
  return finitePositive(n0) ? rayleighRange({ lambda: lambda / n0, w0 }) : NaN;
}

/**
 * Dawes–Marburger self-focusing distance of a collimated Gaussian beam, m, for P/P_cr = powerRatio and Rayleigh range
 * z_R. NaN for P ≤ P_cr: the beam diffracts, slowed by the Kerr lens, but doesn't collapse.
 */
export function selfFocusingDistance(powerRatio: number, zR: number): number {
  if (!(Number.isFinite(powerRatio) && powerRatio > 1 && finitePositive(zR))) return NaN;
  const arg = (Math.sqrt(powerRatio) - 0.852) ** 2 - 0.0219;
  return arg > 0 ? (0.367 * zR) / Math.sqrt(arg) : NaN;
}

/**
 * Collapse distance with a lens of focal length f in front of the medium, 1/z′ = 1/z_sf + 1/f, m. f = Infinity is a
 * collimated beam (z′ = z_sf); f < 0 is a diverging lens. NaN if z_sf isn't finite or the beam never collapses.
 */
export function focusedCollapseDistance(zsf: number, f: number): number {
  if (!finitePositive(zsf) || Number.isNaN(f) || f === 0) return NaN;
  const inv = 1 / zsf + 1 / f;
  return inv > 0 ? 1 / inv : NaN;
}

export type PulseShape = "gaussian" | "sech";

/** FWHM/T₀ of the intensity: Gaussian e^(−T²/T₀²) → 2√(ln 2) = 1.6651; sech² → 2 ln(1 + √2) = 1.7627. */
export const FWHM_FACTOR: Record<PulseShape, number> = {
  gaussian: 2 * Math.sqrt(Math.LN2),
  sech: 2 * Math.log(1 + Math.SQRT2),
};

/** Half-width T₀ of the intensity profile |U|² (e^(−T²/T₀²) or sech²(T/T₀)) from its FWHM, s. */
export function pulseHalfWidth(fwhm: number, shape: PulseShape): number {
  return finitePositive(fwhm) ? fwhm / FWHM_FACTOR[shape] : NaN;
}

/** Peak power from the pulse energy, W: E/(√π T₀) for a Gaussian, E/(2T₀) for sech². */
export function pulsePeakPower(energy: number, fwhm: number, shape: PulseShape): number {
  const t0 = pulseHalfWidth(fwhm, shape);
  if (!finiteNonNegative(energy) || Number.isNaN(t0)) return NaN;
  return energy / ((shape === "gaussian" ? Math.sqrt(Math.PI) : 2) * t0);
}

/** |U(τ)|², τ = T/T₀. */
function intensityProfile(tau: number, shape: PulseShape): number {
  return shape === "gaussian" ? Math.exp(-tau * tau) : 1 / Math.cosh(tau) ** 2;
}

/**
 * Largest SPM frequency shift |δω|max = max |dφ/dT|, rad/s: √(2/e) φ_max/T₀ = 0.8578 φ_max/T₀ at T = ±T₀/√2 for a
 * Gaussian (Agrawal §4.1); 4φ_max/(3√3 T₀) = 0.7698 φ_max/T₀ at tanh²(T/T₀) = 1/3 for sech².
 */
export function spmMaxFrequencyShift(phiMax: number, t0: number, shape: PulseShape): number {
  if (!(finiteNonNegative(phiMax) && finitePositive(t0))) return NaN;
  const k = shape === "gaussian" ? Math.sqrt(2 / Math.E) : 4 / (3 * Math.sqrt(3));
  return (k * phiMax) / t0;
}

/**
 * Rms spectral broadening Δω_rms/Δω₀ of an unchirped pulse by SPM alone, from ⟨ω²⟩ = ∫|∂U/∂T|² dT / ∫|U|² dT:
 * √(1 + 4φ²/(3√3)) for a Gaussian (Agrawal §4.1) and √(1 + 32φ²/35) for sech², using ∫sech² tanh² = 2/3 and
 * ∫sech⁶ tanh² = 16/105.
 */
export function spmRmsBroadening(phiMax: number, shape: PulseShape): number {
  if (!finiteNonNegative(phiMax)) return NaN;
  return shape === "gaussian" ? gaussianRmsBroadening(phiMax) : Math.sqrt(1 + (32 * phiMax ** 2) / 35);
}

/** Above this φ_max the default FFT grid (step T₀/64) no longer resolves the SPM spectrum. */
export const SPM_SPECTRUM_MAX_PHASE = 100;

export interface SpmSpectrum {
  /** Angular-frequency offset times T₀, ascending. */
  omegaT0: number[];
  /** Input and output spectral intensity, both divided by the input peak. */
  input: number[];
  output: number[];
}

/**
 * Spectrum of U(τ) e^(iφ_max |U(τ)|²) by FFT on n points (power of two) over a window of `window` T₀.
 * Dispersion-free SPM, so the energy is conserved and the shape depends on φ_max only.
 */
export function spmSpectrum(phiMax: number, shape: PulseShape, { points = 4096, window = 64 } = {}): SpmSpectrum | null {
  if (!finiteNonNegative(phiMax) || phiMax > SPM_SPECTRUM_MAX_PHASE) return null;
  const n = points;
  const dt = window / n;
  const spectrum = (phase: number) => {
    const re: number[] = new Array(n);
    const im: number[] = new Array(n);
    for (let j = 0; j < n; j++) {
      const p = intensityProfile((j - n / 2) * dt, shape);
      const a = Math.sqrt(p);
      re[j] = a * Math.cos(phase * p);
      im[j] = a * Math.sin(phase * p);
    }
    fftRadix2(re, im);
    // Reorder to ascending frequency: bins n/2 … n − 1 are the negative frequencies.
    const out: number[] = new Array(n);
    for (let k = 0; k < n; k++) {
      const src = (k + n / 2) % n;
      out[k] = re[src] ** 2 + im[src] ** 2;
    }
    return out;
  };
  const input = spectrum(0);
  const output = spectrum(phiMax);
  const peak = Math.max(...input);
  const dOmega = (2 * Math.PI) / window;
  return {
    omegaT0: input.map((_, k) => (k - n / 2) * dOmega),
    input: input.map((s) => s / peak),
    output: output.map((s) => s / peak),
  };
}
