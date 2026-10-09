/**
 * Graded-index (inhomogeneous) layer approximated by a staircase of thin homogeneous sublayers, for use
 * with `stackResponse` / `reflectanceSpectrum` in ./transfer-matrix.
 *
 * Model tier: Textbook. The staircase converges to the continuous profile as the sublayers become thin
 * compared with λ/n; each sublayer takes the profile's index at its mid-height (a midpoint rule). With at
 * least 10 sublayers per λ_min/n_max, R is within about 0.01 percentage points of the continuous limit.
 * The surface step from the incident medium to n_surface stays abrupt: for a thick, smooth profile R
 * tends to that step's Fresnel reflectance (a thinner one can interfere with it and land on either side).
 *
 * References: W. H. Southwell, "Gradient-index antireflection coatings", Opt. Lett. 8, 584–586 (1983):
 * smooth profiles (zero slope at both ends) reflect little once thicker than about λ. H. A. Macleod,
 * Thin-Film Optical Filters, 4th ed. (CRC Press, 2010), ch. 2 (characteristic matrix of each sublayer).
 */
import type { Layer } from "./transfer-matrix";

export type GradedProfile = "linear" | "cosine" | "exponential";

/**
 * Index at fractional height f above the substrate (f = 0 at the substrate, 1 at the surface):
 * linear n_s + (n_t − n_s) f, cosine n_s + (n_t − n_s)(1 − cos πf)/2 (zero slope at both ends), or
 * exponential n_s (n_t/n_s)^f. NaN unless both indices are > 0 and 0 ≤ f ≤ 1.
 */
export function gradedIndexAt(profile: GradedProfile, nSubstrate: number, nSurface: number, f: number): number {
  if (!(nSubstrate > 0 && nSurface > 0 && f >= 0 && f <= 1)) return NaN;
  if (profile === "linear") return nSubstrate + (nSurface - nSubstrate) * f;
  if (profile === "cosine") return nSubstrate + ((nSurface - nSubstrate) * (1 - Math.cos(Math.PI * f))) / 2;
  return nSubstrate * Math.exp(f * Math.log(nSurface / nSubstrate));
}

/** Sublayer count: at least 50, and at least 10 per λ_min/n_max of thickness, capped at 400. */
export function gradedSublayerCount(thickness: number, minWavelength: number, nMax: number): number {
  if (!(thickness > 0 && minWavelength > 0 && nMax > 0)) return 50;
  return Math.min(400, Math.max(50, Math.ceil((10 * thickness * nMax) / minWavelength)));
}

/**
 * Lossless sublayers approximating the profile, outermost (surface) first, as `Stack.layers` expects.
 * thickness and minWavelength in m; minWavelength is the shortest wavelength the stack will be evaluated
 * at, and sets the sublayer count. Returns [] unless the thickness is > 0 and the indices are > 0.
 */
export function gradedIndexLayers(
  profile: GradedProfile,
  nSubstrate: number,
  nSurface: number,
  thickness: number,
  minWavelength: number,
): Layer[] {
  if (!(thickness > 0 && nSubstrate > 0 && nSurface > 0)) return [];
  const count = gradedSublayerCount(thickness, minWavelength, Math.max(nSubstrate, nSurface));
  const layers: Layer[] = [];
  for (let j = count - 1; j >= 0; j--) {
    layers.push({ n: gradedIndexAt(profile, nSubstrate, nSurface, (j + 0.5) / count), thickness: thickness / count });
  }
  return layers;
}
