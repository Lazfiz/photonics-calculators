/**
 * Quarter-wave notch filter: (HL)^N with H facing the incident medium and L on the substrate. The notch
 * is the stop band of the stack, about as wide as the zone λ₀/(1 ± Δg); the pair count sets the depth.
 *
 * Model tier: Exact for the spectra (transfer matrix of lossless, non-dispersive layers at normal
 * incidence on a semi-infinite substrate); no side-lobe suppression, no matching layers.
 *
 * References: H. A. Macleod, Thin-Film Optical Filters, 4th ed. (CRC Press, 2010), ch. 2 (admittance of
 * quarter-wave layers, R = tanh²(N ln(nH/nL) + ½ ln(ns/n0))) and ch. 6 (zone width).
 */
import {
  quarterWavePairsForReflectance,
  reflectionBandEdges,
  stopBandEdges,
  stopBandHalfWidth,
} from "./quarter-wave-stack";
import { quarterWaveLayers, quarterWaveStackReflectance, stackResponse, type Stack } from "./transfer-matrix";

const NM = 1e-9;

export interface NotchFilterInput {
  nH: number;
  nL: number;
  nSub: number;
  nInc: number;
  /** Notch wavelength λ₀ (m). */
  lambda0: number;
  /** Integer number of (HL) pairs. */
  pairs: number;
}

export interface NotchFilterSummary {
  valid: boolean;
  /** Layer indices from the incident side. */
  indices: number[];
  stack: Stack;
  /** Reflectance at λ₀ (NaN if invalid). */
  R0: number;
  /** Optical density −log10 T at λ₀ (from T itself: 1 − R loses its digits as R → 1). */
  od: number;
  /** Half-depth edges (R ≥ R(λ₀)/2), m. */
  notch: { short: number; long: number };
  /** Zone edges of the infinite stack, m. */
  zone: { short: number; long: number };
  /** Δg of the stack. */
  halfWidth: number;
}

/** The page's validity test: nH > nL, positive indices, λ₀ in 100–20 000 nm. */
export function notchFilterValid(i: Omit<NotchFilterInput, "pairs">): boolean {
  return i.nH > i.nL && i.nL > 0 && i.nSub > 0 && i.nInc > 0 && i.lambda0 >= 100 * NM && i.lambda0 <= 20000 * NM;
}

/** Indices of (HL)^N from the incident side. */
export function notchFilterIndices(pairs: number, nH: number, nL: number): number[] {
  return Array.from({ length: 2 * pairs }, (_, j) => (j % 2 === 0 ? nH : nL));
}

/** Pairs needed for optical density `od` at λ₀ (T = 10^−od); NaN if invalid. */
export function notchPairsForOD(od: number, i: Omit<NotchFilterInput, "pairs">): number {
  return notchFilterValid(i) ? quarterWavePairsForReflectance(1 - 10 ** -od, i.nH, i.nL, i.nInc, i.nSub) : NaN;
}

/** Notch depth, width and zone of (HL)^N at λ₀. */
export function notchFilterSummary(i: NotchFilterInput): NotchFilterSummary {
  const { nH, nL, nSub, nInc, lambda0, pairs } = i;
  const valid = notchFilterValid(i);
  const dg = stopBandHalfWidth(nH, nL);
  const indices = notchFilterIndices(pairs, nH, nL);
  const stack: Stack = { incident: nInc, layers: quarterWaveLayers(indices, lambda0), substrate: { n: nSub } };
  const R0 = valid ? quarterWaveStackReflectance(nInc, indices, nSub) : NaN;
  const od = valid ? -Math.log10(stackResponse(stack, lambda0).T) : NaN;
  const notch = valid ? reflectionBandEdges(stack, lambda0, R0 / 2, 3 * dg) : { short: NaN, long: NaN };
  return { valid, indices, stack, R0, od, notch, zone: stopBandEdges(lambda0, nH, nL), halfWidth: dg };
}
