/**
 * Results of the sum-frequency-microscopy page in SI units, shared by the page and the API schema. Composes
 * `multiphoton-focus.ts` (Zipfel et al. 2003 focus) and `second-harmonic-generation.ts` (thin-slab SFG coefficient,
 * coherence lengths). Kept apart from those modules so that the pages that import them don't ship these exports.
 * Model tier: textbook approximation (thin uniform layer, L ≪ b).
 */
import { c, h } from "../constants";
import { focalIntensityRadius, mixedFocusFwhm } from "./multiphoton-focus";
import {
  averageSfgPower, sfgCoefficient, sfgCoherenceLengths, sumFrequencyWavelength,
} from "./second-harmonic-generation";

/** Above this L/b the thin-slab result is shown with a warning (the page warns). */
export const SFG_XI_WARN = 0.1;
/** Above this L/b the thin-slab result is withheld (the page withholds it). */
export const SFG_XI_MAX = 1;

export interface SfgSummaryInputs {
  /** Vacuum wavelengths, m. */
  lambda1: number;
  lambda2: number;
  na: number;
  /** Index at both inputs. */
  n: number;
  /** Average powers, W. */
  power1: number;
  power2: number;
  /** Pulse FWHM (both beams), s. */
  pulseWidth: number;
  /** Repetition rate, Hz. */
  repRate: number;
  /** Effective nonlinear coefficient, m/V. */
  deff: number;
  /** Layer thickness, m. */
  thickness: number;
  /** n(ω₃) − n. */
  deltaN: number;
}

export function sfgSummary(i: SfgSummaryInputs) {
  const w1 = focalIntensityRadius(i.lambda1, i.na);
  const w2 = focalIntensityRadius(i.lambda2, i.na);
  const sfg = sfgCoefficient({
    lambda1: i.lambda1, lambda2: i.lambda2, length: i.thickness, deff: i.deff, n: i.n, deltaN: i.deltaN, w1, w2,
  });
  const lc = sfgCoherenceLengths(sfg.lambda3, i.n, i.deltaN);
  const focusOk = i.na < i.n;
  const fwhm = mixedFocusFwhm([{ lambda: i.lambda1, order: 1 }, { lambda: i.lambda2, order: 1 }], i.n, i.na);
  const thinPower = averageSfgPower(sfg.K, i.power1, i.power2, i.repRate, i.pulseWidth);
  const power = sfg.xi <= SFG_XI_MAX && focusOk ? thinPower : NaN;
  return {
    sfgWavelength: sumFrequencyWavelength(i.lambda1, i.lambda2),
    w1,
    w2,
    lateralFwhm: focusOk ? fwhm.lateral : NaN,
    axialFwhm: focusOk ? fwhm.axial : NaN,
    /** L over the smaller confocal parameter. */
    xi: sfg.xi,
    /** The smaller confocal parameter, m. */
    bMin: i.thickness / sfg.xi,
    forwardCoherenceLength: lc.forward,
    backwardCoherenceLength: lc.backward,
    /** Average forward SFG power of the thin layer, W (NaN above L/b = 1 or for NA ≥ n). */
    power,
    /** SFG photons per second, 1/s. */
    photonRate: (power * sfg.lambda3) / (h * c),
    focusOk,
  };
}
