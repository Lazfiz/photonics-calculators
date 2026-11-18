/**
 * Results of the second-harmonic-generation page in SI units, shared by the page and the API schema. Composes
 * `multiphoton-focus.ts` (Zipfel et al. 2003 focus, Gaussian pulses) and `second-harmonic-generation.ts`
 * (Boyd & Kleinman 1968 focused-beam SHG, coherence lengths). Kept apart from those modules so that the pages that
 * import them (sum-frequency microscopy and others) don't ship these exports. Model tier: textbook approximation.
 */

import {
  focalIntensityRadius, focalPeakIntensity, gaussianPulsePeakPower, multiphotonFwhm, pulseEnergy,
} from "./multiphoton-focus";
import {
  averageShgPower, backwardCoherenceLength, forwardCoherenceLength, shgCoefficient,
} from "./second-harmonic-generation";

/** The Gaussian-beam focus is indicative only above this NA (the page warns). */
export const SHG_PARAXIAL_NA_LIMIT = 0.5;
/** Above this average conversion efficiency the undepleted-pump estimate is too high (the page warns). */
export const SHG_DEPLETION_EFFICIENCY = 0.1;
/** Time-bandwidth product Δν·τ of a transform-limited Gaussian pulse, 2 ln 2/π = 2·0.69314718/3.14159265 = 0.44127120 (Diels & Rudolph tabulate the rounded 0.441). */
export const GAUSSIAN_TIME_BANDWIDTH = (2 * Math.LN2) / Math.PI;

export interface ShgSummaryInputs {
  /** Fundamental vacuum wavelength, m. */
  lambda: number;
  /** Objective numerical aperture. */
  na: number;
  /** Index at the fundamental. */
  n: number;
  /** Pulse FWHM, s. */
  pulseWidth: number;
  /** Average power, W. */
  avgPower: number;
  /** Repetition rate, Hz. */
  repRate: number;
  /** Effective nonlinear coefficient, m/V. */
  deff: number;
  /** Slab thickness, m. */
  length: number;
  /** n(2ω) − n(ω). */
  deltaN: number;
}

export interface ShgSummary {
  /** Second-harmonic wavelength, m. */
  shgWavelength: number;
  /** Lateral and axial two-photon (I²) FWHM, m. */
  lateralFwhm: number;
  axialFwhm: number;
  /** Energy per pulse, J. */
  pulseEnergy: number;
  /** Focal peak intensity, W/m². */
  peakIntensity: number;
  /** 1/e² focal radius, m. */
  w0: number;
  /** Confocal parameter, m. */
  b: number;
  xi: number;
  h: number;
  /** Coherence lengths, m (forward ∞ when phase-matched). */
  forwardCoherenceLength: number;
  backwardCoherenceLength: number;
  /** Average SH power, W. */
  shPower: number;
  /** Average conversion efficiency (fraction) and its plane-wave near-field estimate. */
  efficiency: number;
  nearFieldEfficiency: number;
  /** Transform-limited Gaussian bandwidth of the fundamental, Hz. */
  bandwidth: number;
}

/** Everything the page shows. The focus-dependent results are NaN unless NA < n. */
export function shgSummary(p: ShgSummaryInputs): ShgSummary {
  const w0 = focalIntensityRadius(p.lambda, p.na);
  const shg = shgCoefficient({ lambda: p.lambda, length: p.length, deff: p.deff, nOmega: p.n, deltaN: p.deltaN, w0 });
  const shPower = averageShgPower(shg.K, p.avgPower, p.repRate, p.pulseWidth);
  const fwhm = multiphotonFwhm(p.lambda, p.n, p.na, 2);
  const peakPower = gaussianPulsePeakPower(p.avgPower, p.repRate, p.pulseWidth);
  const g = (x: number) => (p.na < p.n ? x : NaN); // the focus formulas need NA < n
  return {
    shgWavelength: p.lambda / 2,
    lateralFwhm: g(fwhm.lateral),
    axialFwhm: g(fwhm.axial),
    pulseEnergy: pulseEnergy(p.avgPower, p.repRate),
    peakIntensity: g(focalPeakIntensity(peakPower, p.lambda, p.na)),
    w0: g(w0),
    b: g(shg.b),
    xi: g(shg.xi),
    h: g(shg.h),
    forwardCoherenceLength: forwardCoherenceLength(p.lambda, p.deltaN),
    backwardCoherenceLength: backwardCoherenceLength(p.lambda, p.n, p.n + p.deltaN),
    shPower: g(shPower),
    efficiency: g(shPower / p.avgPower),
    nearFieldEfficiency: g(averageShgPower(shg.KNearField, p.avgPower, p.repRate, p.pulseWidth) / p.avgPower),
    bandwidth: GAUSSIAN_TIME_BANDWIDTH / p.pulseWidth,
  };
}
