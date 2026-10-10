/**
 * Dielectric beam splitters at normal incidence: the index a single quarter-wave layer (or the middle
 * layer of H M H) needs for a given reflectance, and a quarter-wave stack H(LH)^m with one layer thinned
 * so that R(λ₀) equals a target.
 *
 * Model tier: Exact for lossless, non-dispersive layers at normal incidence, coherent, back surface of
 * the substrate ignored (the response comes from ./transfer-matrix).
 *
 * References: H. A. Macleod, Thin-Film Optical Filters, 4th ed. (CRC Press, 2010), ch. 2 (a quarter-wave
 * layer maps the admittance Y → n²/Y; admittance loci of a layer are circles) and ch. 5 (beam splitters).
 */
import { firstCrossing } from "../math";
import { quarterWaveThickness, stackResponse, type Layer } from "./transfer-matrix";

/**
 * Index of a single quarter-wave layer with reflectance R at λ₀ (normal incidence):
 * R = ((n₀n_s − n²)/(n₀n_s + n²))², so n² = n₀n_s (1 + √R)/(1 − √R). This is the root with n² ≥ n₀n_s
 * (R = 0 gives the quarter-wave AR index √(n₀n_s)); the other root, n² = n₀n_s (1 − √R)/(1 + √R), is
 * below it. NaN unless 0 ≤ R < 1 and n₀, n_s > 0.
 */
export function singleLayerIndexForReflectance(R: number, incident: number, substrate: number): number {
  if (!(R >= 0 && R < 1 && incident > 0 && substrate > 0)) return NaN;
  const s = Math.sqrt(R);
  return Math.sqrt((incident * substrate * (1 + s)) / (1 - s));
}

/**
 * Middle index n_M of an all-quarter-wave H M H stack with reflectance R at λ₀. Its admittance is
 * n_H⁴/(n_M² n_s), that of one quarter-wave layer of index n_H²/n_M, so n_M = n_H²/n₁ with n₁ from
 * `singleLayerIndexForReflectance`. Every layer is a quarter wave, so R(λ) is stationary at λ₀ (a flat
 * top), unlike the thinned design of `tunedSplitter`. NaN unless n_H > 0 and n₁ is defined.
 */
export function middleIndexForReflectance(R: number, nH: number, incident: number, substrate: number): number {
  const n1 = singleLayerIndexForReflectance(R, incident, substrate);
  return nH > 0 ? (nH * nH) / n1 : NaN;
}

/**
 * Layers from the incident side. m = 0: one H layer of x quarter waves. m ≥ 1: H, L of x quarter waves,
 * then H(LH)^(m−1); x = 1 is the quarter-wave stack H(LH)^m (2m + 1 layers). Empty unless m is an
 * integer ≥ 0, 0 ≤ x ≤ 1 and the indices and λ₀ are > 0.
 */
export function tunedSplitterLayers(nH: number, nL: number, m: number, x: number, lambda0: number): Layer[] {
  if (!(Number.isInteger(m) && m >= 0 && x >= 0 && x <= 1 && nH > 0 && nL > 0 && lambda0 > 0)) return [];
  const H: Layer = { n: nH, thickness: quarterWaveThickness(nH, lambda0) };
  const L: Layer = { n: nL, thickness: quarterWaveThickness(nL, lambda0) };
  if (m === 0) return [{ ...H, thickness: x * H.thickness }];
  const rest = Array.from({ length: m - 1 }, () => [L, H]).flat();
  return [H, { ...L, thickness: x * L.thickness }, H, ...rest];
}

export interface TunedSplitter {
  /** Periods of the quarter-wave stack H(LH)^m that the design is cut from. */
  m: number;
  /** Thickness of the thinned layer (the H layer for m = 0, else the L layer behind the front H), in quarter waves. */
  x: number;
  layers: Layer[];
}

/** Largest m tried: H(LH)^20 reflects > 99.99 % for any useful contrast. */
const MAX_PERIODS = 20;

/**
 * A design with R(λ₀) = target: the smallest m with R(H(LH)^m) ≥ target, then x in [0, 1] by bisection
 * (`firstCrossing`, 200 intervals) on `tunedSplitterLayers`. R rises monotonically with x: as the thinned
 * layer grows from 0 to a quarter wave, the admittance behind the front face (behind the front quarter-wave
 * H when m ≥ 1) runs along half of a circle centred on the real axis, and on such a circle R is a Möbius
 * function of the cosine of the angle (Macleod ch. 2, admittance loci). At x = 0 the stack is the bare
 * substrate (m = 0, 1) or (LH)^(m−1) (the two H layers form a half-wave absentee). Returns null when the
 * target is below that (e.g. below the bare substrate: an AR coating, not a splitter), at or above the
 * reflectance of H(LH)^20, or the inputs are invalid (needs n_H > n_L > 0, n₀, n_s > 0, λ₀ > 0, 0 < target < 1).
 */
export function tunedSplitter(
  target: number,
  nH: number,
  nL: number,
  incident: number,
  substrate: number,
  lambda0: number,
): TunedSplitter | null {
  if (!(target > 0 && target < 1 && nH > nL && nL > 0 && incident > 0 && substrate > 0 && lambda0 > 0)) return null;
  const R = (m: number, x: number) =>
    stackResponse({ incident, layers: tunedSplitterLayers(nH, nL, m, x, lambda0), substrate: { n: substrate } }, lambda0).R;
  for (let m = 0; m <= MAX_PERIODS; m++) {
    if (R(m, 1) < target) continue;
    if (!(R(m, 0) <= target)) return null;
    const x = firstCrossing((xx) => R(m, xx), 0, 1, target, 200);
    return Number.isFinite(x) ? { m, x, layers: tunedSplitterLayers(nH, nL, m, x, lambda0) } : null;
  }
  return null;
}
