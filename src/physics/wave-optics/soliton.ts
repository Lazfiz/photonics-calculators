/**
 * Optical solitons in fibres: sech pulse scales, soliton order, and a split-step Fourier solution of the nonlinear
 * Schrödinger equation (NLS).
 * SI units: times in s, β₂ in s²/m, γ in 1/(W·m), powers in W, energies in J, lengths in m.
 * Model tier: textbook (scalar NLS with β₂ and the Kerr term only; loss, β₃, self-steepening and the Raman response are
 * not modelled).
 *
 * Agrawal, Nonlinear Fiber Optics, 6th ed. (2019), ch. 3 and 5: a pulse of peak power P₀ and half-width T₀ in a fibre
 * of group-velocity dispersion β₂ and nonlinear coefficient γ has
 *   L_D = T₀²/|β₂|,  L_NL = 1/(γP₀),  N² = L_D/L_NL = γP₀T₀²/|β₂|,
 * and with β₂ < 0 an input sech(T/T₀) of order N = 1 propagates unchanged; its peak power is P₁ = |β₂|/(γT₀²).
 * Higher orders (integer N) recover their shape every soliton period z₀ = (π/2)L_D. For a sech² intensity the FWHM is
 * 2 ln(1 + √2) T₀ and the energy 2P₀T₀.
 *
 * Normalised NLS (Agrawal eq. 5.2.5 with U = u/N): ξ = z/L_D, τ = T/T₀, U(0, 0) = 1,
 *   i ∂U/∂ξ = (sgn β₂/2) ∂²U/∂τ² − N²|U|²U.
 * The symmetric split step advances it by h: half a dispersion step Ũ → Ũ exp(i sgn β₂ ω² h/4) in the Fourier domain, a
 * Kerr step U → U exp(i N²|U|² h), and the second half dispersion step (second-order accurate in h).
 *
 * Soliton fission of an N ≫ 1 input happens near L_fiss ≈ L_D/N (Dudley, Genty & Coen 2006, Rev. Mod. Phys. 78, 1135).
 */

import { fftRadix2 } from "../fft";

/** FWHM/T₀ of a sech² intensity profile, 2 ln(1 + √2) = 1.7627. */
export const SECH_FWHM_FACTOR = 2 * Math.log(1 + Math.SQRT2);

const finitePositive = (x: number) => Number.isFinite(x) && x > 0;

/** Half-width T₀, s, of a sech pulse from its intensity FWHM, s. NaN for FWHM ≤ 0. */
export function sechT0(fwhm: number): number {
  return finitePositive(fwhm) ? fwhm / SECH_FWHM_FACTOR : NaN;
}

/** Peak power, W, of a sech² pulse of energy E (J) and half-width T₀ (s): P₀ = E/(2T₀). */
export function sechPeakPower(energy: number, t0: number): number {
  return Number.isFinite(energy) && energy >= 0 && finitePositive(t0) ? energy / (2 * t0) : NaN;
}

/** Dispersion length L_D = T₀²/|β₂|, m. Infinity for β₂ = 0; NaN for T₀ ≤ 0. */
export function dispersionLength(t0: number, beta2: number): number {
  if (!finitePositive(t0) || !Number.isFinite(beta2)) return NaN;
  return beta2 === 0 ? Infinity : t0 ** 2 / Math.abs(beta2);
}

/** Nonlinear length L_NL = 1/(γP₀), m. Infinity for γP₀ = 0; NaN for negative inputs. */
export function nonlinearLength(gamma: number, power: number): number {
  if (!(Number.isFinite(gamma) && Number.isFinite(power) && gamma >= 0 && power >= 0)) return NaN;
  return gamma * power === 0 ? Infinity : 1 / (gamma * power);
}

/** Peak power, W, of the fundamental (N = 1) soliton: P₁ = |β₂|/(γT₀²). NaN for γ ≤ 0 or T₀ ≤ 0. */
export function fundamentalSolitonPower(beta2: number, gamma: number, t0: number): number {
  if (!(Number.isFinite(beta2) && finitePositive(gamma) && finitePositive(t0))) return NaN;
  return Math.abs(beta2) / (gamma * t0 ** 2);
}

/** Soliton order N = √(γP₀T₀²/|β₂|). Infinity for β₂ = 0 with P₀ > 0; NaN for invalid inputs. */
export function solitonOrder(power: number, beta2: number, gamma: number, t0: number): number {
  if (!(Number.isFinite(power) && power >= 0 && Number.isFinite(beta2) && finitePositive(gamma) && finitePositive(t0))) return NaN;
  if (beta2 === 0) return power === 0 ? 0 : Infinity;
  return Math.sqrt((gamma * power * t0 ** 2) / Math.abs(beta2));
}

/** Soliton period z₀ = (π/2) L_D, m. */
export function solitonPeriod(t0: number, beta2: number): number {
  return (Math.PI / 2) * dispersionLength(t0, beta2);
}

/** Soliton fission length L_fiss ≈ L_D/N, m (Dudley et al. 2006). NaN for N ≤ 0. */
export function fissionLength(t0: number, beta2: number, order: number): number {
  return finitePositive(order) ? dispersionLength(t0, beta2) / order : NaN;
}

/**
 * Frequency offset Ω = ω_DW − ω_s, rad/s, of the dispersive wave a soliton radiates when β₃ ≠ 0, to leading order
 * Ω ≈ −3β₂/β₃ (Akhmediev & Karlsson 1995, Phys. Rev. A 51, 2602; Dudley et al. 2006 eq. 8 without the γP term).
 * NaN for β₃ = 0.
 */
export function dispersiveWaveShift(beta2: number, beta3: number): number {
  return Number.isFinite(beta2) && Number.isFinite(beta3) && beta3 !== 0 ? (-3 * beta2) / beta3 : NaN;
}

export interface SolitonContent {
  /** Number of solitons the input contains, ⌊N + 1/2⌋. */
  count: number;
  /** Amplitude of the strongest one, 2N − 1, in units of √P₁: its peak power is (2N − 1)²P₁ and its half-width T₀/(2N − 1). */
  amplitude: number;
}

/**
 * Solitons inside an input N sech τ with anomalous dispersion (Satsuma & Yajima 1974, Prog. Theor. Phys. Suppl. 55, 284):
 * the Zakharov–Shabat eigenvalues are η_k = N − k + 1/2 > 0, so the input holds ⌊N + 1/2⌋ solitons and the strongest has
 * amplitude 2η₁ = 2N − 1. The rest of the energy leaves as dispersive radiation. N < 1/2 holds none.
 */
export function solitonContent(order: number): SolitonContent {
  if (!(Number.isFinite(order) && order >= 0)) return { count: NaN, amplitude: NaN };
  const count = Math.floor(order + 0.5);
  return { count, amplitude: count > 0 ? 2 * order - 1 : 0 };
}

export interface NlsOptions {
  /** Number of time samples, a power of two. */
  points?: number;
  /** Full time window in units of T₀. */
  window?: number;
  /** Split-step size in units of L_D (the solver takes ⌈ξ/h⌉ equal steps). */
  step?: number;
  /** Number of distance samples recorded, plus the input. */
  samples?: number;
}

export interface NlsResult {
  /** τ = T/T₀ grid. */
  tau: number[];
  /** Recorded distances ξ = z/L_D, from 0 to ξ_max. */
  xi: number[];
  /** Peak |U|² at each recorded distance (1 at ξ = 0). */
  peak: number[];
  /** RMS width in units of T₀ at each recorded distance. */
  rmsWidth: number[];
  /** Output intensity |U(ξ_max, τ)|². */
  output: number[];
  /** Input intensity |U(0, τ)|² = sech²τ. */
  input: number[];
  /** Energy ∫|U|²dτ at ξ_max divided by its input value (1 to rounding: the NLS conserves it). */
  energyRatio: number;
}

/**
 * Split-step solution of the normalised NLS for an input U(0, τ) = sech τ.
 * `sign` is sgn β₂ (−1 anomalous, +1 normal), `order` is N ≥ 0 and `xiMax` the distance in L_D. Throws on a grid that is
 * not a power of two; returns NaN-filled arrays for invalid physical inputs.
 */
export function solveNls(order: number, sign: -1 | 1, xiMax: number, options: NlsOptions = {}): NlsResult {
  const { points = 1024, window = 64, step = 0.01, samples = 120 } = options;
  const n = points;
  const dtau = window / n;
  const tau = Array.from({ length: n }, (_, i) => (i - n / 2) * dtau);
  const input = tau.map((t) => 1 / Math.cosh(t) ** 2);
  const valid = Number.isFinite(order) && order >= 0 && Number.isFinite(xiMax) && xiMax >= 0 && step > 0;
  if (!valid) {
    const nan = [NaN];
    return { tau, xi: nan, peak: nan, rmsWidth: nan, output: tau.map(() => NaN), input, energyRatio: NaN };
  }

  const re = tau.map((t) => 1 / Math.cosh(t));
  const im = tau.map(() => 0);
  const steps = Math.max(1, Math.ceil(xiMax / step));
  const h = xiMax / steps;
  // Half-step dispersion phase per frequency sample; FFT bin k holds ω = 2πk/(n dτ) with k wrapped to [−n/2, n/2).
  const halfRe = new Array<number>(n);
  const halfIm = new Array<number>(n);
  for (let k = 0; k < n; k++) {
    const omega = ((k < n / 2 ? k : k - n) * 2 * Math.PI) / (n * dtau);
    const phi = (sign * omega * omega * h) / 4;
    halfRe[k] = Math.cos(phi);
    halfIm[k] = Math.sin(phi);
  }
  const rotate = (pr: number[], pi: number[]) => {
    for (let k = 0; k < n; k++) {
      const a = re[k], b = im[k];
      re[k] = a * pr[k] - b * pi[k];
      im[k] = a * pi[k] + b * pr[k];
    }
  };
  const fullRe = halfRe.map((c, k) => c * c - halfIm[k] * halfIm[k]);
  const fullIm = halfIm.map((s, k) => 2 * s * halfRe[k]);
  const n2 = order * order;

  const stats = () => {
    let peak = 0, sum = 0, m1 = 0, m2 = 0;
    for (let i = 0; i < n; i++) {
      const p = re[i] * re[i] + im[i] * im[i];
      if (p > peak) peak = p;
      sum += p;
      m1 += p * tau[i];
      m2 += p * tau[i] * tau[i];
    }
    const mean = m1 / sum;
    return { peak, energy: sum * dtau, rms: Math.sqrt(Math.max(0, m2 / sum - mean * mean)) };
  };
  const energy0 = stats().energy;
  const record = Math.max(1, Math.min(samples, steps));
  const xi: number[] = [];
  const peak: number[] = [];
  const rmsWidth: number[] = [];
  const push = (z: number) => {
    const s = stats();
    xi.push(z);
    peak.push(s.peak);
    rmsWidth.push(s.rms);
  };
  push(0);

  // Merged half steps: after the first D/2 each step is K then a full D; at a recorded distance that D is split into
  // D/2, a time-domain sample and D/2 (the last step stops after the sample).
  fftRadix2(re, im);
  rotate(halfRe, halfIm);
  let nextRecord = 1;
  for (let s = 1; s <= steps; s++) {
    fftRadix2(re, im, true);
    for (let i = 0; i < n; i++) {
      const phi = n2 * (re[i] * re[i] + im[i] * im[i]) * h;
      const a = re[i], b = im[i], c = Math.cos(phi), d = Math.sin(phi);
      re[i] = a * c - b * d;
      im[i] = a * d + b * c;
    }
    fftRadix2(re, im);
    const sampleHere = s === steps || s >= (nextRecord * steps) / record;
    if (sampleHere) {
      rotate(halfRe, halfIm);
      const saveRe = re.slice(), saveIm = im.slice();
      fftRadix2(re, im, true);
      push(s * h);
      nextRecord++;
      if (s === steps) break;
      for (let k = 0; k < n; k++) { re[k] = saveRe[k]; im[k] = saveIm[k]; }
      rotate(halfRe, halfIm);
    } else {
      rotate(fullRe, fullIm);
    }
  }
  const output = re.map((a, i) => a * a + im[i] * im[i]);
  return { tau, xi, peak, rmsWidth, output, input, energyRatio: stats().energy / energy0 };
}
