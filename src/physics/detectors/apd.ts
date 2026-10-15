/**
 * Linear-mode avalanche photodiode: gain, excess noise, gain drift with temperature and the optimum gain against
 * thermal noise. SI units: V, A, Ω, Hz, K; temperatures may be in °C where only differences enter. Invalid inputs give
 * NaN; a bias at or above breakdown gives Infinity (Geiger mode, outside this model).
 *
 * - Gain M = 1/[1 − (V/V_br)^n], the empirical form of S. L. Miller, Phys. Rev. 99, 1234 (1955),
 *   doi:10.1103/PhysRev.99.1234. n is a fitted device parameter; `millerExponent` fits it through one operating point.
 * - Excess noise F = k·M + (1 − k)·(2 − 1/M) for injection of the more ionising carrier, k the ratio of the smaller
 *   to the larger ionisation coefficient: R. J. McIntyre, IEEE Trans. Electron Devices ED-13, 164 (1966),
 *   doi:10.1109/T-ED.1966.15651.
 * - V_br rises with temperature because phonon scattering lowers the ionisation coefficients: C. R. Crowell,
 *   S. M. Sze, Appl. Phys. Lett. 9, 242 (1966), doi:10.1063/1.1754731. Taken linear, V_br(T) = V_br,0 + γ·ΔT.
 * - Receiver SNR (M·I_p)²/[2q(I_p + I_d)M²F·B + 4k_B·T·B/R] and its optimum gain: S. D. Personick, Proc. IEEE 65,
 *   1670 (1977), doi:10.1109/PROC.1977.10808; G. P. Agrawal, Fiber-Optic Communication Systems, 4th ed. (Wiley 2010),
 *   §4.4.
 */

import { k_B, q } from "../constants";

export type ApdMaterial = "si" | "ingaas" | "ge";

/**
 * Ionisation ratio k by multiplication material. Ranges: Agrawal (2010), Table 4.2 (the same figures are quoted in
 * US patent 7,233,051 B2). The silicon value is the k_eff of the Excelitas C30902EH reach-through APD (datasheet
 * Rev. 2022.02); InGaAs APDs multiply in an InP layer; the Ge value is the middle of its range.
 */
export const APD_K_TABLE: readonly { id: ApdMaterial; label: string; k: number; range: readonly [number, number] }[] = [
  { id: "si", label: "Si", k: 0.02, range: [0.02, 0.05] },
  { id: "ingaas", label: "InGaAs/InP", k: 0.5, range: [0.5, 0.7] },
  { id: "ge", label: "Ge", k: 0.85, range: [0.7, 1.0] },
];

/** Maps a URL string onto a material id, defaulting to silicon. */
export function parseApdMaterial(s: string): ApdMaterial {
  return APD_K_TABLE.find((m) => m.id === s)?.id ?? "si";
}

/** Miller gain 1/[1 − (V/V_br)^n] for 0 ≤ V < V_br; Infinity at or above breakdown. */
export function millerGain(bias: number, breakdown: number, n: number): number {
  if (!(bias >= 0 && breakdown > 0 && n > 0)) return NaN;
  if (bias >= breakdown) return Infinity;
  if (bias === 0) return 1;
  return -1 / Math.expm1(n * Math.log(bias / breakdown));
}

/** Exponent n of Miller's law through one operating point: gain M > 1 at bias 0 < V < V_br. */
export function millerExponent(gain: number, bias: number, breakdown: number): number {
  if (!(gain > 1 && bias > 0 && bias < breakdown)) return NaN;
  return Math.log1p(-1 / gain) / Math.log(bias / breakdown);
}

/** McIntyre excess noise factor F = kM + (1 − k)(2 − 1/M) for gain M ≥ 1 and ionisation ratio k ∈ [0, 1]. */
export function excessNoiseFactor(gain: number, k: number): number {
  if (!(gain >= 1 && k >= 0 && k <= 1)) return NaN;
  return k * gain + (1 - k) * (2 - 1 / gain);
}

/** Excess noise index x with F = M^x (the datasheet form), for M > 1. */
export function excessNoiseIndex(gain: number, k: number): number {
  if (!(gain > 1)) return NaN;
  return Math.log(excessNoiseFactor(gain, k)) / Math.log(gain);
}

export interface GainDriftInput {
  /** Gain at the reference temperature, > 1. */
  gainRef: number;
  /** Breakdown voltage at the reference temperature, V. */
  breakdownRef: number;
  /** Fixed bias below breakdown at the reference temperature, V_br − V, V. */
  marginRef: number;
  /** Temperature coefficient of the breakdown voltage γ, V/K. */
  breakdownCoeff: number;
}

/** Miller exponent of the operating point, or NaN if it is invalid. */
export function driftExponent(p: GainDriftInput): number {
  return millerExponent(p.gainRef, p.breakdownRef - p.marginRef, p.breakdownRef);
}

/**
 * Gain at fixed bias after a temperature change ΔT (K): V_br shifts by γ·ΔT and n stays at its fitted value.
 * Infinity once V_br(T) falls to the bias.
 */
export function gainAtTemperature(p: GainDriftInput, deltaT: number): number {
  const n = driftExponent(p);
  if (Number.isNaN(n) || !Number.isFinite(deltaT) || !Number.isFinite(p.breakdownCoeff)) return NaN;
  const breakdown = p.breakdownRef + p.breakdownCoeff * deltaT;
  if (!(breakdown > 0)) return NaN;
  return millerGain(p.breakdownRef - p.marginRef, breakdown, n);
}

/** Relative gain coefficient (1/M)·dM/dT = −n(M − 1)·γ/V_br at the operating point, 1/K. */
export function gainTemperatureCoefficient(p: GainDriftInput): number {
  const n = driftExponent(p);
  if (Number.isNaN(n) || !Number.isFinite(p.breakdownCoeff)) return NaN;
  return (-n * (p.gainRef - 1) * p.breakdownCoeff) / p.breakdownRef;
}

export interface ApdReceiverInput {
  /** Primary (unmultiplied) photocurrent I_p, A. */
  photocurrent: number;
  /** Primary dark current that is multiplied (bulk), A. */
  darkCurrent: number;
  /** Ionisation ratio k ∈ [0, 1]. */
  k: number;
  /** Noise bandwidth B, Hz. */
  bandwidth: number;
  /** Load (or feedback) resistance R, Ω. */
  loadResistance: number;
  /** Temperature of the load, K. */
  temperature: number;
}

export interface ApdReceiverNoise {
  /** Multiplied signal current M·I_p, A. */
  signal: number;
  /** Shot-noise variance 2q(I_p + I_d)M²F·B, A². */
  shot: number;
  /** Thermal-noise variance 4k_B·T·B/R, A². */
  thermal: number;
  /** Electrical SNR (M·I_p)²/(shot + thermal), linear. */
  snr: number;
}

function receiverOk(p: ApdReceiverInput): boolean {
  return (
    p.photocurrent >= 0 && p.darkCurrent >= 0 && p.k >= 0 && p.k <= 1 && p.bandwidth > 0 && p.loadResistance > 0 &&
    p.temperature >= 0
  );
}

/** Signal, noise variances and electrical SNR of an APD receiver at gain M ≥ 1. */
export function apdReceiver(p: ApdReceiverInput, gain: number): ApdReceiverNoise {
  const F = excessNoiseFactor(gain, p.k);
  if (!receiverOk(p) || Number.isNaN(F)) return { signal: NaN, shot: NaN, thermal: NaN, snr: NaN };
  const signal = gain * p.photocurrent;
  const shot = 2 * q * (p.photocurrent + p.darkCurrent) * gain * gain * F * p.bandwidth;
  const thermal = (4 * k_B * p.temperature * p.bandwidth) / p.loadResistance;
  // No signal and no noise is no signal: SNR 0.
  const snr = signal === 0 ? 0 : (signal * signal) / (shot + thermal);
  return { signal, shot, thermal, snr };
}

/**
 * Gain that maximises the SNR: the one positive root of k·M³ + (1 − k)·M = 4k_B·T/[q·R·(I_p + I_d)], from
 * d/dM [F(M) + σ_T²/(2q(I_p + I_d)B·M²)] = 0. Limits: M = C at k = 0 and M = C^(1/3) at k = 1. Clamped to M ≥ 1
 * (below that a p-i-n does better). Infinity with no current to multiply.
 */
export function optimumGain(p: ApdReceiverInput): number {
  if (!receiverOk(p)) return NaN;
  const current = p.photocurrent + p.darkCurrent;
  if (current === 0) return Infinity;
  const C = (4 * k_B * p.temperature) / (q * p.loadResistance * current);
  const k = p.k;
  // f(M) = kM³ + (1 − k)M − C is convex and increasing for M > 0, so Newton from an upper bound falls monotonically.
  let M = k === 0 ? C : Math.min(k === 1 ? Infinity : C / (1 - k), Math.cbrt(C / k));
  for (let i = 0; i < 100; i++) {
    const f = k * M ** 3 + (1 - k) * M - C;
    const step = f / (3 * k * M * M + (1 - k));
    M -= step;
    if (Math.abs(step) <= 1e-15 * M) break;
  }
  return Math.max(1, M);
}
