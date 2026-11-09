/**
 * Layer sequence of an all-dielectric multiple-cavity (Fabry–Perot) filter, for use with
 * `stackResponse` / `reflectanceSpectrum` in ./transfer-matrix, and the width of its pass band (FWHM).
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
import { firstCrossing, goldenSectionMax } from "../math";
import { stopBandHalfWidth } from "./quarter-wave-stack";
import { quarterWaveThickness, stackResponse, type Layer, type Stack } from "./transfer-matrix";

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

export interface Passband {
  /** Highest transmittance in the pass band: T(λ₀), or a ripple maximum of a multiple-cavity filter. */
  peakT: number;
  /** Wavelengths of peakT, m (the same value twice when the peak is at λ₀). */
  peakShort: number;
  peakLong: number;
  /** Where T falls to peakT/2 on the short and long side, m. FWHM = long − short. */
  short: number;
  long: number;
}

/**
 * Pass band around λ₀ of a lossless filter made of whole quarter waves at λ₀ (`cavityFilterLayers`), at
 * normal incidence. Such a stack has T(g) = T(2 − g) in g = λ₀/λ (see `reflectionBandEdges`), so only
 * g = 1 + e is scanned, at e = span·10^(−8 + 8i/800), i = 0 … 800 (2.3 % steps; a pass band narrower
 * than the first step is bracketed by g = 1 and that step). The scan keeps the running maximum of T and
 * stops at the first sample below half of it. A ripple maximum is then refined by golden section between
 * the samples either side of it (the sampled one can be 0.02 % low), and the first fall below half the
 * refined peak, going out from it, is bisected (`firstCrossing`). So the width is that of the band
 * containing λ₀; a ripple dip below half the maximum ends the band there. Use the zone half-width Δg of
 * the mirrors as the span. NaN fields if T never falls to half within the span.
 */
export function cavityPassband(stack: Stack, lambda0: number, span: number): Passband {
  const none: Passband = { peakT: NaN, peakShort: NaN, peakLong: NaN, short: NaN, long: NaN };
  if (!(lambda0 > 0 && span > 0 && span < 1)) return none;
  const T = (g: number) => stackResponse(stack, lambda0 / g).T;
  let peakT = T(1);
  if (!Number.isFinite(peakT)) return none;
  let peakE = 0;
  let peakI = -1; // sample index of the peak; −1 while it is λ₀ itself
  const M = 800;
  const eAt = (i: number) => (i < 0 ? 0 : span * 10 ** (-8 + (8 * i) / M));
  for (let i = 0; i <= M; i++) {
    const e = eAt(i);
    const t = T(1 + e);
    if (!Number.isFinite(t)) return none;
    if (t > peakT) {
      peakT = t;
      peakE = e;
      peakI = i;
    } else if (t < peakT / 2) {
      if (peakI >= 0) {
        const best = goldenSectionMax((x) => T(1 + x), eAt(peakI - 1), eAt(peakI + 1));
        if (best.fx > peakT) ({ x: peakE, fx: peakT } = best);
      }
      const g = firstCrossing(T, 1 + peakE, 1 + e, peakT / 2);
      return { peakT, peakShort: lambda0 / (1 + peakE), peakLong: lambda0 / (1 - peakE), short: lambda0 / g, long: lambda0 / (2 - g) };
    }
  }
  return none;
}

export interface CavityFilterSummary {
  /** The stack (incident air, substrate nSub). */
  stack: Stack;
  /** Layers in the stack. */
  layerCount: number;
  /** Transmittance at λ₀. */
  T0: number;
  /** Pass band from `cavityPassband` (NaN fields if T never falls to half within the mirrors' zone). */
  band: Passband;
}

/**
 * The page's whole calculation: half-wave-spacer cavities (`cavityFilterLayers`, q = 2) on a substrate of index
 * nSub in air, T at λ₀ and the pass band searched within the mirrors' zone half-width Δg = `stopBandHalfWidth`.
 * null unless n_H > n_L > 0, nSub > 0, nSpacer > 0 and λ₀ > 0 (m); NaN fields for a non-integer mirrorPairs or cavities.
 */
export function cavityFilterSummary(p: {
  nH: number;
  nL: number;
  nSub: number;
  nSpacer: number;
  mirrorPairs: number;
  cavities: number;
  lambda0: number;
}): CavityFilterSummary | null {
  const { nH, nL, nSub, nSpacer, mirrorPairs, cavities, lambda0 } = p;
  if (!(nH > nL && nL > 0 && nSub > 0 && nSpacer > 0 && lambda0 > 0)) return null;
  const layers = cavityFilterLayers({ nH, nL, nSpacer, mirrorPairs, cavities, spacerQuarterWaves: 2, lambda0 });
  const stack = { incident: 1, layers, substrate: { n: nSub } };
  return {
    stack,
    layerCount: layers.length,
    T0: stackResponse(stack, lambda0).T,
    band: cavityPassband(stack, lambda0, stopBandHalfWidth(nH, nL)),
  };
}
