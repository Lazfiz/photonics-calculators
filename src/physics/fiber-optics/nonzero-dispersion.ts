/**
 * Summary of the non-zero dispersion-shifted fibre (ITU-T G.655) page: the linear D(λ) model about 1550 nm, its zero
 * and C-band extremes, accumulated dispersion, channel spacing in wavelength, and the FWM phase mismatch between adjacent
 * channels. It sits beside chromatic-dispersion.ts (formulas and sources) so the page and its API schema share it without
 * adding exports to a module other pages import. SI in and out: wavelengths and lengths in m, D in s/m², S in s/m³,
 * frequencies in Hz. Model tier: textbook approximation (D linear in λ over the S, C and L bands, 1460–1625 nm).
 */
import { fwmPhaseMismatch } from "./fiber-nonlinear";
import { beta2FromD, beta3FromDS, linearDispersion, linearZeroDispersionWavelength, presetDispersion } from "./chromatic-dispersion";
import { wavelengthWidth } from "../spectroscopy/wavenumber";

/** The linear model about 1550 nm holds across the S, C and L bands only, nm. */
export const NZDSF_BAND_MIN_NM = 1460;
export const NZDSF_BAND_MAX_NM = 1625;
/** C band, nm. */
export const C_BAND_NM = [1530, 1565] as const;
/** |D| below this (s/m²; 1e-3 ps/(nm·km)) counts as zero: λ − 1550 nm in floating point leaves ~1e-22 s/m² at λ₀. */
export const NZDSF_ZERO_D = 1e-3 * 1e-6;
/** FWM risk when |D| falls below this in the C band (s/m²; 1 ps/(nm·km), G.655 keeps |D| ≥ 1 ps/(nm·km)) or D changes sign. */
export const NZDSF_FWM_RISK_D = 1 * 1e-6;

export interface NonzeroDispersionInput {
  wavelength: number;
  length: number;
  /** D at 1550 nm, s/m². */
  dispAt1550: number;
  /** S, s/m³. */
  dispSlope: number;
  channelSpacing: number;
}

export function nonzeroDispersionSummary({ wavelength, length, dispAt1550, dispSlope, channelSpacing }: NonzeroDispersionInput) {
  const nm = 1e-9;
  const fiber = { D: dispAt1550, S: dispSlope };
  const D = linearDispersion(fiber, wavelength);
  const lambda0 = linearZeroDispersionWavelength(fiber);
  // Channel spacing in wavelength Δλ = λ²Δν/c; FWM phase mismatch between adjacent channels (degenerate, equal spacing),
  // Δβ = −(2πΔν)²[β₂ + β₃·2πΔν], including β₃; the smaller of the ± offsets (stronger FWM) is shown.
  const deltaLambda = wavelengthWidth(wavelength, channelSpacing);
  const beta2 = beta2FromD(D, wavelength);
  const beta3 = beta3FromDS(D, fiber.S, wavelength);
  const deltaBeta = Math.min(
    Math.abs(fwmPhaseMismatch(beta2, channelSpacing, channelSpacing, beta3)),
    Math.abs(fwmPhaseMismatch(beta2, -channelSpacing, -channelSpacing, beta3)),
  );
  const lambda0InBand = Number.isFinite(lambda0) && dispSlope !== 0 && lambda0 / nm >= NZDSF_BAND_MIN_NM && lambda0 / nm <= NZDSF_BAND_MAX_NM;
  // Linear D(λ) is monotonic, so the C-band extremes are at its ends.
  const dC1 = linearDispersion(fiber, C_BAND_NM[0] * nm), dC2 = linearDispersion(fiber, C_BAND_NM[1] * nm);
  const dCMin = Math.min(dC1, dC2), dCMax = Math.max(dC1, dC2);
  const dSMF = presetDispersion("G652", wavelength);
  const dDSF = presetDispersion("DSF", wavelength);
  return {
    D, lambda0, lambda0InBand, dCMin, dCMax, totalDisp: D * length, deltaLambda, deltaBeta, dSMF, dDSF,
    nzZero: Math.abs(D) < NZDSF_ZERO_D,
    fwmRisk: Math.min(Math.abs(dCMin), Math.abs(dCMax)) < NZDSF_FWM_RISK_D || dCMin * dCMax < 0,
    /** |D_SMF|/|D|, how much more dispersion standard fibre has here. */
    smfRatio: Math.abs(dSMF) / Math.abs(D),
  };
}
