/**
 * Fundamental noise sources of detectors and their read-out chain. SI units: A, V, W, Ω, F, K, Hz; charge noise in
 * electrons. Invalid inputs (negative resistance, zero capacitance, an empty band) give NaN.
 *
 * - Shot noise i_n = √(2q·I·B): W. Schottky, Ann. Phys. 362, 541 (1918); B. E. A. Saleh, M. C. Teich, Fundamentals of
 *   Photonics (Wiley 1991), §17.5.
 * - Johnson–Nyquist noise v_n = √(4k_B·T·R·B), available power k_B·T·B: H. Nyquist, Phys. Rev. 32, 110 (1928), in the
 *   classical limit h·f ≪ k_B·T (k_B·T/h = 6.25 THz at 300 K).
 * - Reset (kTC) noise √(k_B·T/C), charge √(k_B·T·C): J. R. Janesick, Scientific Charge-Coupled Devices (SPIE 2001).
 * - 1/f noise S_I(f) = K_f·I^α/f, the SPICE KF/AF form of F. N. Hooge, Phys. Lett. A 29, 139 (1969).
 * - Ideal ADC quantisation SNR 20·log₁₀(2^N·√1.5) = 6.02·N + 1.76 dB and ENOB: IEEE Std 1241-2010; W. Kester,
 *   Analog Devices tutorials MT-001 and MT-003 (2009).
 */

import { k_B, q } from "../constants";

/** RMS shot-noise current √(2q·I·B) of a mean current I (A) in a bandwidth B (Hz), A. */
export function shotNoiseCurrent(current: number, bandwidth: number): number {
  if (!(current >= 0) || !(bandwidth >= 0)) return NaN;
  return Math.sqrt(2 * q * current * bandwidth);
}

export interface JohnsonNoise {
  /** Open-circuit RMS voltage √(4k_B·T·R·B), V. */
  v: number;
  /** Short-circuit RMS current √(4k_B·T·B/R), A. */
  i: number;
  /** Power k_B·T·B delivered into a matched load, W. */
  p: number;
}

/** Johnson–Nyquist noise of a resistance R (Ω) at temperature T (K) in a bandwidth B (Hz). */
export function johnsonNoise(resistance: number, temperature: number, bandwidth: number): JohnsonNoise {
  if (!(resistance > 0) || !(temperature >= 0) || !(bandwidth >= 0)) return { v: NaN, i: NaN, p: NaN };
  const p = k_B * temperature * bandwidth;
  return { v: Math.sqrt(4 * p * resistance), i: Math.sqrt((4 * p) / resistance), p };
}

export interface KtcNoise {
  /** RMS voltage √(k_B·T/C) left on the capacitor after a reset, V. */
  v: number;
  /** RMS charge √(k_B·T·C), C. */
  charge: number;
  /** The same charge in electrons. */
  electrons: number;
}

/** Reset (kTC) noise of a capacitance C (F) at temperature T (K); independent of the switch resistance. */
export function ktcNoise(capacitance: number, temperature: number): KtcNoise {
  if (!(capacitance > 0) || !(temperature >= 0)) return { v: NaN, charge: NaN, electrons: NaN };
  const charge = Math.sqrt(k_B * temperature * capacitance);
  return { v: charge / capacitance, charge, electrons: charge / q };
}

/** 1/f current noise density K_f·I^α/f at frequency f, A²/Hz. K_f is in A^(2−α). */
export function flickerPsd(kf: number, current: number, alpha: number, f: number): number {
  if (!(kf >= 0) || !(current >= 0) || !(f > 0)) return NaN;
  return (kf * current ** alpha) / f;
}

/** RMS 1/f current √(K_f·I^α·ln(f_H/f_L)) between band edges 0 < f_L < f_H, A. */
export function flickerRms(kf: number, current: number, alpha: number, fLow: number, fHigh: number): number {
  if (!(kf >= 0) || !(current >= 0) || !(fLow > 0) || !(fHigh > fLow)) return NaN;
  return Math.sqrt(kf * current ** alpha * Math.log(fHigh / fLow));
}

/** Frequency where the 1/f density K_f·I^α/f falls to the shot-noise density 2q·I, Hz. */
export function flickerShotCorner(kf: number, current: number, alpha: number): number {
  if (!(kf >= 0) || !(current > 0)) return NaN;
  return (kf * current ** (alpha - 1)) / (2 * q);
}

/**
 * RMS 1/f noise that a 1/f corner f_c adds to a white noise σ_w, where σ_w is the white noise integrated over 0…B:
 * the density is (σ_w²/B)·(1 + f_c/f), so the 1/f part from f_L to B is σ_w·√((f_c/B)·ln(B/f_L)). Same unit as σ_w.
 * C. D. Motchenbacher, J. A. Connelly, Low-Noise Electronic System Design (Wiley 1993), noise of a 1/f corner.
 */
export function cornerFlickerRms(sigmaWhite: number, fCorner: number, bandwidth: number, fLow: number): number {
  if (!(sigmaWhite >= 0) || !(fCorner >= 0) || !(fLow > 0) || !(bandwidth > fLow)) return NaN;
  return sigmaWhite * Math.sqrt((fCorner / bandwidth) * Math.log(bandwidth / fLow));
}

export interface SensorNoiseInputs {
  /** Mean signal, e⁻ (Poisson: variance = mean). */
  signal: number;
  /** Read noise, e⁻ rms. */
  read: number;
  /** Mean dark charge, e⁻ (Poisson). */
  dark?: number;
}

/** Total noise √(S + σ_read² + D) of a photon-counting sensor pixel, e⁻ rms (Janesick, Photon Transfer, 2007). */
export function sensorNoiseElectrons({ signal, read, dark = 0 }: SensorNoiseInputs): number {
  if (!(signal >= 0) || !(read >= 0) || !(dark >= 0)) return NaN;
  return Math.sqrt(signal + read * read + dark);
}

/**
 * Smallest mean signal S (e⁻) with S/√(S + σ²) = k over a signal-independent noise floor σ (e⁻ rms):
 * S = (k² + √(k⁴ + 4k²σ²))/2, the positive root of S² − k²S − k²σ² = 0.
 */
export function minDetectableSignal(floor: number, snr = 3): number {
  if (!(floor >= 0) || !(snr > 0)) return NaN;
  const k2 = snr * snr;
  return (k2 + Math.sqrt(k2 * k2 + 4 * k2 * floor * floor)) / 2;
}

/** 10·log₁₀(2^N·√1.5)² = 6.02·N + 1.76 dB: an ideal N-bit ADC driven by a full-scale sine. */
export function idealSqnrDb(bits: number): number {
  if (!(bits > 0)) return NaN;
  return 20 * Math.log10(2 ** bits * Math.sqrt(1.5));
}

/** Effective number of bits (SINAD − 1.76 dB)/6.02 dB, with the exact constants of idealSqnrDb. */
export function enobFromSinad(sinadDb: number): number {
  return (sinadDb - 10 * Math.log10(1.5)) / (20 * Math.log10(2));
}
