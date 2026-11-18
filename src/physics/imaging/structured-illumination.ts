/**
 * Structured-illumination page: cut-offs, resolution, raw image count and the notes the page shows, from the SIM
 * formulas in `super-resolution.ts` (Gustafsson 2000, 2005). SI units (m, cycles/m). Model tier: textbook.
 */

import { abbeLateralFwhm, simCutoff, simLateralFwhm, simRawImageCount, simSupportHasGap } from "./super-resolution";

const nanometres = (x: number) => Number((x * 1e9).toPrecision(8));

export interface SimSummary {
  /** Widefield cut-off 2NA/λ_em, cycles/m. */
  cutoff: number;
  /** Pattern frequency k₀ = p · 2NA/λ_ex, cycles/m. */
  patternFrequency: number;
  /** SIM cut-off 2NA/λ_em + m·k₀, cycles/m. */
  simCutoff: number;
  /** Widefield resolution λ_em/(2NA), m. */
  widefieldResolution: number;
  /** SIM resolution 1/k_c, m. */
  simResolution: number;
  /** Resolution gain over widefield, dimensionless. */
  improvement: number;
  /** Raw images: angles × (2m + 1) phases. */
  rawImages: number;
  notes: string[];
}

/** Summary for excitation and emission wavelengths (m), NA, pattern fraction p (0–1), harmonic orders and angles. */
export function simSummary(
  lambdaEx: number, lambdaEm: number, na: number, patternFraction: number, orders: number, angles: number,
): SimSummary {
  const cutoff = (2 * na) / lambdaEm;
  const patternFrequency = (patternFraction * 2 * na) / lambdaEx;
  const notes: string[] = [];
  if (lambdaEm < lambdaEx) {
    notes.push(`The emission (${nanometres(lambdaEm)} nm) is shorter than the excitation (${nanometres(lambdaEx)} nm); fluorescence is Stokes-shifted to longer wavelengths.`);
  }
  if (simSupportHasGap(lambdaEx, lambdaEm, na, patternFraction)) {
    notes.push("The pattern frequency exceeds twice the detection cut-off, so the shifted passbands no longer overlap the central one and the support has gaps.");
  } else if (patternFrequency > cutoff) {
    notes.push("The pattern frequency lies beyond the detection cut-off: the stripes are not visible in the raw images, so the pattern phase and frequency are estimated from the overlap of the shifted passbands.");
  }
  if (orders > 1) {
    notes.push("Harmonics beyond the first need a nonlinear (saturated or photoswitched) fluorescence response; their strength depends on the saturation level, not modelled here.");
  }
  if (angles < 3) {
    notes.push(`${angles === 1 ? "1 pattern angle extends the support along its direction only" : "2 pattern angles extend the support along those two directions only"}; three or more are needed for near-isotropic resolution.`);
  }
  const widefieldResolution = abbeLateralFwhm(lambdaEm, na);
  const simResolution = simLateralFwhm(lambdaEx, lambdaEm, na, patternFraction, orders);
  return {
    cutoff,
    patternFrequency,
    simCutoff: simCutoff(lambdaEx, lambdaEm, na, patternFraction, orders),
    widefieldResolution,
    simResolution,
    improvement: widefieldResolution / simResolution,
    rawImages: simRawImageCount(orders, angles),
    notes,
  };
}
