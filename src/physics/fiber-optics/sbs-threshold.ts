/**
 * Headline numbers of the SBS-threshold page, in SI: kept out of fiber-nonlinear.ts, whose exports every page that
 * imports that module ships. `sbsSpan` clamps SI values (loss in dB/km) to the model's domain. Model tier: textbook approximation (Smith's threshold, Lorentzian linewidth factor), see fiber-nonlinear.ts.
 */
import {
  SBS_POLARIZATION_FACTOR, alphaFromDbPerKm, brillouinShift, effectiveLength, sbsLinewidthFactor, sbsThreshold,
} from "./fiber-nonlinear";

/** Polarization cases of the page, in display order (keys of SBS_POLARIZATION_FACTOR). */
export const SBS_POLARIZATION_CASES = ["copolarized", "randomBirefringence", "scrambled"] as const;
export type SbsPolarizationCase = (typeof SBS_POLARIZATION_CASES)[number];

/** The span in SI. */
export interface SbsSpan {
  /** Pump wavelength, m. */
  lambda: number;
  /** Fibre length, m. */
  L: number;
  /** Effective area, m². */
  Aeff: number;
  /** Power attenuation, 1/m. */
  alpha: number;
  /** Brillouin gain, m/W. */
  gB: number;
  /** Brillouin gain bandwidth Δν_B, Hz. */
  dnuB: number;
  /** Source linewidth Δν_s, Hz. */
  dnuS: number;
}

export interface SbsRawInput {
  /** Pump wavelength, m. */
  lambda: number;
  /** Fibre length, m. */
  L: number;
  /** Effective area, m². */
  Aeff: number;
  /** Attenuation, dB/km. */
  lossDbPerKm: number;
  /** Brillouin gain, m/W. */
  gB: number;
  /** Brillouin gain bandwidth, Hz. */
  dnuB: number;
  /** Source linewidth, Hz. */
  dnuS: number;
}

/** Clamps the values to the model's domain (400–2200 nm, L ≥ 1 m, A_eff ≥ 1 µm², Δν_B ≥ 0.1 MHz, ...). */
export function sbsSpan(raw: SbsRawInput): SbsSpan {
  return {
    lambda: Math.min(Math.max(raw.lambda, 400 * 1e-9), 2200 * 1e-9),
    L: Math.max(raw.L, 1),
    Aeff: Math.max(raw.Aeff, 1e-12),
    alpha: alphaFromDbPerKm(Math.max(raw.lossDbPerKm, 0)),
    gB: Math.max(raw.gB, 1e-15),
    dnuB: Math.max(raw.dnuB, 0.1 * 1e6),
    dnuS: Math.max(raw.dnuS, 0),
  };
}

/** SBS threshold (W) of the span for polarization factor K, optionally with another effective length or source linewidth (Hz). */
export function sbsThresholdOf(span: SbsSpan, K: number, Leff = effectiveLength(span.alpha, span.L), dnuS = span.dnuS): number {
  return sbsThreshold({ Aeff: span.Aeff, gB: span.gB, Leff, K, sourceLinewidth: dnuS, brillouinLinewidth: span.dnuB });
}

export interface SbsSummary {
  /** Effective length, m. */
  Leff: number;
  /** Brillouin shift ν_B, Hz. */
  nuB: number;
  /** 1 + Δν_s/Δν_B. */
  linewidthFactor: number;
  /** Thresholds in W, one per SBS_POLARIZATION_CASES entry. */
  thresholds: number[];
}

export function sbsSummary(span: SbsSpan): SbsSummary {
  const Leff = effectiveLength(span.alpha, span.L);
  return {
    Leff,
    nuB: brillouinShift(span.lambda),
    linewidthFactor: sbsLinewidthFactor(span.dnuS, span.dnuB),
    thresholds: SBS_POLARIZATION_CASES.map((key) => sbsThresholdOf(span, SBS_POLARIZATION_FACTOR[key], Leff)),
  };
}
