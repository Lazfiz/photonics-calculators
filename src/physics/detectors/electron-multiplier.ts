/**
 * Secondary-electron multipliers: discrete dynode chains (PMT), continuous channels (MCP, channel photomultiplier)
 * and the noise they add. SI units except where a name says otherwise. Invalid inputs give NaN.
 *
 * - Dynode chain: G = δ₁·δ₂·…·δₙ, and with Poisson secondary emission at each stage the noise figure is
 *   F = 1 + 1/δ₁ + 1/(δ₁δ₂) + … + 1/(δ₁…δₙ), which tends to δ/(δ − 1) for n equal stages. Hamamatsu Photonics,
 *   Photomultiplier Tubes: Basics and Applications, 4th ed. (2017), §4.3.7, Eq. 4-25 to 4-32.
 * - Channel gain (Schagen's model): secondaries leave the wall normal to it with energy V₀
 *   (eV), the axial field V/L accelerates them across the bore, and the yield per strike is δ = A·V_c^{1/2}. Then
 *   G = (A·V/(2α·V₀^{1/2}))^{4V₀α²/V} with α = L/d, A ≈ 0.2 V^{−1/2} and V₀ ≈ 1 eV. J. L. Wiza, Microchannel plate
 *   detectors, Nucl. Instrum. Methods 162, 587 (1979), doi:10.1016/0029-554X(79)90734-1, eq. (1)–(4). Outside about
 *   2 < n and δ < 4 the single-energy picture fails (real yields peak near 3).
 * - Space charge at the channel output caps the gain; the saturated gain scales with the bore, about 10⁸ for a 1 mm
 *   channel and 10⁶ for 10 µm (Wiza 1979, §2.2).
 */

import { c, h, q } from "../constants";

/** FWHM of a Gaussian in units of its standard deviation, 2√(2 ln 2). */
export const FWHM_PER_SIGMA = 2 * Math.sqrt(2 * Math.LN2);

/** Saturated gain of a 1 mm channel (Wiza 1979, §2.2); it scales with the channel diameter. */
export const SATURATED_GAIN_PER_MM = 1e8;

function validDeltas(deltas: readonly number[]): boolean {
  return deltas.every((d) => d > 0 && Number.isFinite(d));
}

/** n equal stages of yield δ. */
export function uniformDynodes(delta: number, stages: number): number[] {
  return Number.isInteger(stages) && stages >= 0 ? Array.from({ length: stages }, () => delta) : [];
}

/** Gain δ₁·δ₂·…·δₙ of a dynode chain. */
export function dynodeGain(deltas: readonly number[]): number {
  return validDeltas(deltas) ? deltas.reduce((g, d) => g * d, 1) : NaN;
}

/** Noise figure 1 + 1/δ₁ + 1/(δ₁δ₂) + … + 1/(δ₁…δₙ) of a chain with Poisson secondary emission. */
export function dynodeExcessNoise(deltas: readonly number[]): number {
  if (!validDeltas(deltas)) return NaN;
  let f = 1;
  let gain = 1;
  for (const d of deltas) {
    gain *= d;
    f += 1 / gain;
  }
  return f;
}

/**
 * SNR of a multiplied photocurrent in bandwidth B (Hz): R_s/√(2B·(R_s + R_d)·F). Rates are photoelectrons per
 * second at the cathode, so the gain cancels (Hamamatsu, Eq. 4-29). The dark level is taken as known; subtracting a
 * measured one adds R_d again (Eq. 4-32).
 */
export function analogSnr(signalRate: number, darkRate: number, bandwidth: number, excessNoise: number): number {
  if (!(signalRate >= 0 && darkRate >= 0 && bandwidth > 0 && excessNoise >= 1)) return NaN;
  const variance = 2 * bandwidth * (signalRate + darkRate) * excessNoise;
  return variance > 0 ? signalRate / Math.sqrt(variance) : NaN;
}

/** Counting SNR R_s·T/√((R_s + R_d)·T) over a gate T (s), Poisson counts, dark rate known. */
export function photonCountingSnr(signalRate: number, darkRate: number, gate: number): number {
  if (!(signalRate >= 0 && darkRate >= 0 && gate > 0)) return NaN;
  const counts = (signalRate + darkRate) * gate;
  return counts > 0 ? (signalRate * gate) / Math.sqrt(counts) : NaN;
}

/** Anode radiant sensitivity QE·qλ/(hc)·G (A/W) at wavelength λ (m). */
export function anodeSensitivity(quantumEfficiency: number, wavelength: number, gain: number): number {
  if (!(quantumEfficiency >= 0 && quantumEfficiency <= 1 && wavelength > 0 && gain >= 0)) return NaN;
  return ((quantumEfficiency * q * wavelength) / (h * c)) * gain;
}

/** Noise figure 1 + (σ/μ)² of a single-electron pulse-height distribution given its relative FWHM (Gaussian shape). */
export function excessNoiseFromFwhm(relativeFwhm: number): number {
  return relativeFwhm >= 0 && Number.isFinite(relativeFwhm) ? 1 + (relativeFwhm / FWHM_PER_SIGMA) ** 2 : NaN;
}

/** Relative FWHM 2√(2 ln 2)·√(F/N) of the charge from N photoelectrons (Poisson photoelectrons, noise figure F). */
export function pulseResolutionFwhm(photoelectrons: number, excessNoise: number): number {
  return photoelectrons > 0 && excessNoise >= 1 ? FWHM_PER_SIGMA * Math.sqrt(excessNoise / photoelectrons) : NaN;
}

/** Yield per wall strike A·V/(2α·√V₀) = A·√V_c. */
export function channelYieldPerStrike(voltage: number, ldRatio: number, yieldConstant: number, emissionEnergy: number): number {
  if (!(voltage > 0 && ldRatio > 0 && yieldConstant > 0 && emissionEnergy > 0)) return NaN;
  return (yieldConstant * voltage) / (2 * ldRatio * Math.sqrt(emissionEnergy));
}

/** Channel gain (A·V/(2α·√V₀))^{4V₀α²/V}: V the channel voltage (V), α = L/d, A in V^{−1/2}, V₀ in eV. */
export function channelGain(voltage: number, ldRatio: number, yieldConstant: number, emissionEnergy: number): number {
  const delta = channelYieldPerStrike(voltage, ldRatio, yieldConstant, emissionEnergy);
  return Number.isNaN(delta) ? NaN : Math.exp(channelStrikes(voltage, ldRatio, emissionEnergy) * Math.log(delta));
}

/** Number of wall strikes 4V₀α²/V along the channel. */
export function channelStrikes(voltage: number, ldRatio: number, emissionEnergy: number): number {
  return voltage > 0 && ldRatio > 0 && emissionEnergy > 0 ? (4 * emissionEnergy * ldRatio ** 2) / voltage : NaN;
}

/** L/d that maximises the channel gain at voltage V: A·V/(2√(e·V₀)), where the yield per strike is √e. */
export function optimumLdRatio(voltage: number, yieldConstant: number, emissionEnergy: number): number {
  if (!(voltage > 0 && yieldConstant > 0 && emissionEnergy > 0)) return NaN;
  return (yieldConstant * voltage) / (2 * Math.sqrt(Math.E * emissionEnergy));
}

/** Gain at the optimum L/d: exp(A²V/(2e)), independent of V₀ (Wiza eq. 4 writes 0.184·A²·V). */
export function maximumChannelGain(voltage: number, yieldConstant: number): number {
  return voltage > 0 && yieldConstant > 0 ? Math.exp((yieldConstant ** 2 * voltage) / (2 * Math.E)) : NaN;
}

/** Unsaturated gain G^N of N identical plates in a stack; NaN when it overflows. */
export function stackedGain(plateGain: number, plates: number): number {
  if (!(plateGain >= 0 && Number.isInteger(plates) && plates >= 1)) return NaN;
  const g = plateGain ** plates;
  return Number.isFinite(g) ? g : NaN;
}

/** Space-charge saturated gain of a channel of diameter d (m): 10⁸ × d/1 mm. */
export function saturatedChannelGain(diameter: number): number {
  return diameter > 0 ? SATURATED_GAIN_PER_MM * (diameter / 1e-3) : NaN;
}

/** Centre-to-centre pitch d·√(π/(2√3·OAR)) of circular channels on a hexagonal lattice with open-area ratio OAR. */
export function hexagonalPitch(diameter: number, openAreaRatio: number): number {
  if (!(diameter > 0 && openAreaRatio > 0 && openAreaRatio <= Math.PI / (2 * Math.sqrt(3)))) return NaN;
  return diameter * Math.sqrt(Math.PI / (2 * Math.sqrt(3) * openAreaRatio));
}
