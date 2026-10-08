/**
 * Layer sequence of an all-dielectric multiple-cavity (Fabry–Perot) filter, for use with
 * `stackResponse` / `reflectanceSpectrum` in ./transfer-matrix.
 *
 * Model tier: Exact (the design only lists layers; the response comes from the transfer matrix).
 *
 * Each cavity is (HL)^p S (LH)^p: a quarter-wave mirror, a spacer S of q quarter waves, and the
 * mirror image of the first mirror, so the cavity starts and ends with H. Cavities are coupled by a
 * quarter-wave L layer: K L K L … K. With a half-wave spacer (q = 2) the spacer is an absentee
 * layer at λ₀, the mirror layers then cancel in half-wave pairs from the inside out, and a single
 * cavity leaves the bare substrate (a transmission peak at λ₀). With a quarter-wave spacer (q = 1)
 * every layer is a quarter wave and the stack reflects strongly at λ₀.
 *
 * References: H. A. Macleod, Thin-Film Optical Filters, 4th ed. (CRC Press, 2010): absentee
 * (half-wave) layers and quarter-wave admittance ch. 2; Fabry–Perot and multiple-cavity
 * bandpass filters ch. 8.
 */
import { quarterWaveThickness, type Layer } from "./transfer-matrix";

export interface CavityFilterDesign {
  /** High and low mirror indices (> 0). */
  nH: number;
  nL: number;
  /** Spacer index (> 0). */
  nSpacer: number;
  /** HL pairs in each mirror, integer ≥ 0. */
  mirrorPairs: number;
  /** Number of cavities, integer ≥ 1. */
  cavities: number;
  /** Spacer optical thickness in quarter waves at λ₀, integer ≥ 1 (2 = half-wave). */
  spacerQuarterWaves: number;
  /** Design wavelength λ₀, m (> 0). */
  lambda0: number;
}

const INVALID: Layer[] = [{ n: NaN, thickness: NaN }];

/**
 * Layers listed from the incident side (the design is symmetric, so the order is the same from
 * the substrate). Invalid input returns a single NaN layer, so the stack response is NaN.
 */
export function cavityFilterLayers(d: CavityFilterDesign): Layer[] {
  const { nH, nL, nSpacer, mirrorPairs, cavities, spacerQuarterWaves, lambda0 } = d;
  const ok =
    nH > 0 && nL > 0 && nSpacer > 0 && lambda0 > 0 && Number.isFinite(nH + nL + nSpacer + lambda0) &&
    Number.isInteger(mirrorPairs) && mirrorPairs >= 0 &&
    Number.isInteger(cavities) && cavities >= 1 &&
    Number.isInteger(spacerQuarterWaves) && spacerQuarterWaves >= 1;
  if (!ok) return INVALID;

  const H: Layer = { n: nH, thickness: quarterWaveThickness(nH, lambda0) };
  const L: Layer = { n: nL, thickness: quarterWaveThickness(nL, lambda0) };
  const S: Layer = { n: nSpacer, thickness: spacerQuarterWaves * quarterWaveThickness(nSpacer, lambda0) };

  const mirrorHL = Array.from({ length: mirrorPairs }, () => [H, L]).flat();
  const cavity = [...mirrorHL, S, ...[...mirrorHL].reverse()];

  const layers: Layer[] = [];
  for (let c = 0; c < cavities; c++) {
    if (c > 0) layers.push(L);
    layers.push(...cavity);
  }
  return layers;
}
