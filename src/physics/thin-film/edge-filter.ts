/**
 * Quarter-wave edge filters built from symmetric periods: (H/2 L H/2)^N passes long wavelengths and
 * (L/2 H L/2)^N passes short ones. Both have the high-reflectance zone of the quarter-wave stack,
 * g = λ₀/λ in 1 ± Δg; the outer half layers set the period's equivalent admittance
 * E² = n_p² (cos φ + κ)/(cos φ − κ), φ = πg/2, κ = (n_q − n_p)/(n_q + n_p) for the period p/2 q p/2.
 * E stays between n_H and n_L on the pass side of each design (from √(n_H n_L) at g → 0, through 0 or ∞
 * at the zone edge), so that side has the smaller ripple. Stacks in series, staggered in λ₀, widen
 * the zone.
 *
 * Model tier: Exact for the spectra (transfer matrix of lossless, non-dispersive layers at normal
 * incidence on a semi-infinite substrate). The zone edges λ₀/(1 ± Δg) belong to the infinite stack; a
 * finite stack's 50 % point lies a little toward the pass band, so `halfTransmissionEdge` finds it on
 * the actual stack. Textbook for the stacks in series: no matching layers or refinement, as in a
 * production design.
 *
 * References: H. A. Macleod, Thin-Film Optical Filters, 4th ed. (CRC Press, 2010), ch. 7 (edge filters,
 * symmetric periods and their equivalent admittance), ch. 6 (zone width; extending it with stacks in
 * series), ch. 2
 * (incoherent reflection at two surfaces). L. I. Epstein, J. Opt. Soc. Am. 42, 806 (1952) (symmetric
 * periods as equivalent layers).
 */

import { firstCrossing } from "../math";
import { stopBandHalfWidth } from "./quarter-wave-stack";
import { stackResponse, type Layer, type Stack } from "./transfer-matrix";

/** Long-pass reflects the short side of the zone and transmits longer wavelengths; short-pass the reverse. */
export type EdgeType = "long-pass" | "short-pass";

/**
 * Design wavelength λ₀ (m) that puts the zone edge of the infinite stack at λ_edge (m): long-pass
 * λ₀ = λ_edge(1 − Δg) (the edge is the zone's long side), short-pass λ₀ = λ_edge(1 + Δg).
 * NaN unless λ_edge, n_H, n_L > 0.
 */
export function edgeDesignWavelength(type: EdgeType, edge: number, nH: number, nL: number): number {
  const dg = stopBandHalfWidth(nH, nL);
  if (!(edge > 0) || Number.isNaN(dg)) return NaN;
  return type === "long-pass" ? edge * (1 - dg) : edge * (1 + dg);
}

/**
 * Design wavelengths (m) of the stacks in series whose zones together cover the band [λ_a, λ_b] (m):
 * K = ⌈ln(λ_b/λ_a) / ln((1 + Δg)/(1 − Δg))⌉ stacks, λ₀ in a geometric progression from λ_a(1 + Δg),
 * whose zone starts at λ_a, to λ_b(1 − Δg), whose zone ends at λ_b, so neighbouring zones overlap.
 * One stack if a single zone spans the band; it then puts the zone edge on the pass side
 * (λ_b(1 − Δg) for long-pass, λ_a(1 + Δg) for short-pass). Listed from the incident side, the stack
 * next to the pass band first (a design choice: it gave the smaller pass-band ripple on glass).
 * Empty unless 0 < λ_a < λ_b and n_H ≠ n_L, both > 0.
 */
export function staggeredDesignWavelengths(
  type: EdgeType,
  bandShort: number,
  bandLong: number,
  nH: number,
  nL: number,
): number[] {
  const dg = stopBandHalfWidth(nH, nL);
  if (!(bandShort > 0 && bandLong > bandShort && dg > 0)) return [];
  const first = bandShort * (1 + dg);
  const last = bandLong * (1 - dg);
  if (first >= last) return [type === "long-pass" ? last : first];
  const K = Math.max(2, Math.ceil(Math.log(bandLong / bandShort) / Math.log((1 + dg) / (1 - dg))));
  const centres = Array.from({ length: K }, (_, k) => first * (last / first) ** (k / (K - 1)));
  return type === "long-pass" ? centres.reverse() : centres;
}

/**
 * Lossless layers of symmetric periods, from the incident side: long-pass (H/2 L H/2), short-pass
 * (L/2 H L/2), period j a quarter wave at lambda0s[j] (its halves are eighth waves). Touching halves
 * merge, so N periods give 2N + 1 layers. Empty if lambda0s is empty; NaN thicknesses unless every
 * λ₀ and index is > 0.
 */
export function symmetricPeriodLayers(type: EdgeType, lambda0s: readonly number[], nH: number, nL: number): Layer[] {
  const [outer, inner] = type === "long-pass" ? [nH, nL] : [nL, nH];
  const valid = outer > 0 && inner > 0 && lambda0s.every((l) => l > 0);
  const quarter = (n: number, lambda0: number) => (valid ? lambda0 / (4 * n) : NaN);
  const layers: Layer[] = [];
  lambda0s.forEach((lambda0, j) => {
    const half = quarter(outer, lambda0) / 2;
    if (j === 0) layers.push({ n: outer, thickness: half });
    else layers[layers.length - 1].thickness += half;
    layers.push({ n: inner, thickness: quarter(inner, lambda0) });
    layers.push({ n: outer, thickness: half });
  });
  return layers;
}

/**
 * (H/2 L H/2)^N (long-pass) or (L/2 H L/2)^N (short-pass), quarter waves at λ₀ (m), from the incident
 * side. Several λ₀ give stacks in series, N periods each. Empty unless N is an integer ≥ 1.
 */
export function edgeFilterLayers(
  type: EdgeType,
  lambda0: number | readonly number[],
  nH: number,
  nL: number,
  periods: number,
): Layer[] {
  const n = Number.isInteger(periods) && periods >= 1 ? periods : 0;
  const centres = typeof lambda0 === "number" ? [lambda0] : lambda0;
  return symmetricPeriodLayers(type, centres.flatMap((l) => Array<number>(n).fill(l)), nH, nL);
}

/**
 * 50 % transmittance point (m) of a stack: the first wavelength, going from `start` (m, inside the
 * zone) toward the pass band, where T crosses 0.5. Scans g = start/λ from 1 to 0.5 (long-pass,
 * λ up to 2·start) or to 2 (short-pass, λ down to start/2) in 800 steps, then bisects. NaN if
 * T(start) ≥ 0.5 (no zone there) or T stays below 0.5.
 */
export function halfTransmissionEdge(stack: Stack, type: EdgeType, start: number): number {
  if (!(start > 0)) return NaN;
  const T = (g: number) => stackResponse(stack, start / g).T;
  if (!(T(1) < 0.5)) return NaN;
  const g = firstCrossing(T, 1, type === "long-pass" ? 0.5 : 2, 0.5, 800);
  return start / g;
}

/**
 * Two lossless coated faces of a thick, non-absorbing substrate, their multiple reflections added in
 * intensity (incoherently): T = T₁T₂/(1 − R₁R₂), R = 1 − T, with T = 1 − R for each face. A lossless
 * face has the same R from either side, so R₂ may be computed from the outside. NaN unless
 * 0 ≤ R₁, R₂ ≤ 1 and not both are 1.
 */
export function incoherentLosslessFaces(R1: number, R2: number): { R: number; T: number } {
  if (!(R1 >= 0 && R1 <= 1 && R2 >= 0 && R2 <= 1) || R1 * R2 === 1) return { R: NaN, T: NaN };
  const T = ((1 - R1) * (1 - R2)) / (1 - R1 * R2);
  return { R: 1 - T, T };
}
