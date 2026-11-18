/**
 * Headline numbers of the SRS-threshold page, in SI: kept out of fiber-nonlinear.ts, whose exports every page that
 * imports that module ships. `srsSpan` clamps SI values (loss in dB/km) to the model's domain. Model tier: textbook approximation (Smith's threshold, undepleted pump), see fiber-nonlinear.ts.
 */
import {
  SRS_POLARIZATION_FACTOR, alphaFromDbPerKm, effectiveLength, ramanGainAt, srsThreshold, stokesWavelength,
} from "./fiber-nonlinear";

/** Polarization cases of the page, in display order (keys of SRS_POLARIZATION_FACTOR). */
export const SRS_POLARIZATION_CASES = ["copolarized", "standard"] as const;

/** The span in SI. */
export interface SrsSpan {
  /** Pump wavelength, m. */
  lambda: number;
  /** Fibre length, m. */
  L: number;
  /** Effective area, m². */
  Aeff: number;
  /** Power attenuation, 1/m. */
  alpha: number;
  /** Peak Raman gain, m/W. */
  gR: number;
  /** Raman shift, Hz. */
  shift: number;
}

export interface SrsRawInput {
  /** Pump wavelength, m. */
  lambda: number;
  /** Fibre length, m. */
  L: number;
  /** Effective area, m². */
  Aeff: number;
  /** Attenuation, dB/km. */
  lossDbPerKm: number;
  /** Peak Raman gain, m/W. */
  gR: number;
  /** Raman shift, Hz. */
  shift: number;
}

/** Clamps the values to the model's domain (400–2200 nm, L ≥ 1 m, A_eff ≥ 1 µm², ...). */
export function srsSpan(raw: SrsRawInput): SrsSpan {
  return {
    lambda: Math.min(Math.max(raw.lambda, 400 * 1e-9), 2200 * 1e-9),
    L: Math.max(raw.L, 1),
    Aeff: Math.max(raw.Aeff, 1e-12),
    alpha: alphaFromDbPerKm(Math.max(raw.lossDbPerKm, 0)),
    gR: Math.max(raw.gR, 1e-17),
    shift: Math.max(raw.shift, 0),
  };
}

/** SRS threshold (W) of the span for polarization factor K, optionally with another effective length. */
export function srsThresholdOf(span: SrsSpan, K: number, Leff = effectiveLength(span.alpha, span.L)): number {
  return srsThreshold(span.Aeff, span.gR, Leff, K);
}

export interface SrsSummary {
  /** Effective length, m. */
  Leff: number;
  /** Thresholds in W, one per SRS_POLARIZATION_CASES entry. */
  thresholds: number[];
  /** Peak Raman gain scaled to the pump wavelength (1/λ_p rule), m/W. */
  gRAtLambda: number;
  /** Stokes wavelength, m (NaN if the shift reaches the pump frequency). */
  lambdaStokes: number;
}

export function srsSummary(span: SrsSpan): SrsSummary {
  const Leff = effectiveLength(span.alpha, span.L);
  return {
    Leff,
    thresholds: SRS_POLARIZATION_CASES.map((key) => srsThresholdOf(span, SRS_POLARIZATION_FACTOR[key], Leff)),
    gRAtLambda: ramanGainAt(span.lambda),
    lambdaStokes: stokesWavelength(span.lambda, span.shift),
  };
}
