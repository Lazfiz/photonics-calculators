/**
 * Imaging depth in cleared tissue: ballistic light and the focal shift from an index mismatch.
 * SI units in and out. Model tier: textbook approximation.
 *
 * - Ballistic (unscattered, unabsorbed) fraction after a path z, Beer–Lambert with the total attenuation
 *   µ_t = µ_a + µ_s: T_b = exp(−µ_t z) (S. L. Jacques, Phys. Med. Biol. 58, R37 (2013),
 *   doi:10.1088/0031-9155/58/11/R37). Scattered light still reaches the detector, so this is not the total
 *   transmission; it is the light that still forms a sharp focus or image.
 * - Focal shift: moving the objective by Δ in its immersion medium (n_imm) moves the focus by f·Δ in a sample of index
 *   n_s. Paraxial rays give f = n_s/n_imm; the marginal ray (sin α = NA/n) gives tan α_imm/tan α_s. The true shift
 *   of the intensity maximum lies between the two (S. Hell et al., J. Microsc. 169, 391 (1993),
 *   doi:10.1111/j.1365-2818.1993.tb03315.x; E. E. Diel, J. W. Lichtman, D. S. Richardson, Nat. Protoc. 15, 2773
 *   (2020), doi:10.1038/s41596-020-0360-2). The mismatch also adds spherical aberration that grows with depth.
 */

const positive = (x: number) => Number.isFinite(x) && x > 0;

/** Ballistic fraction exp(−(µ_a + µ_s) z), coefficients in m⁻¹, z in m. */
export function ballisticFraction(muA: number, muS: number, z: number): number {
  if (!(muA >= 0 && muS >= 0 && z >= 0 && Number.isFinite(muA + muS + z))) return NaN;
  return Math.exp(-(muA + muS) * z);
}

/** Depth at which the ballistic fraction falls to `fraction` (0 < fraction < 1), −ln(fraction)/µ_t, m. */
export function ballisticDepth(muA: number, muS: number, fraction: number): number {
  const muT = muA + muS;
  if (!(muA >= 0 && muS >= 0 && positive(muT) && fraction > 0 && fraction < 1)) return NaN;
  return -Math.log(fraction) / muT;
}

/** Paraxial focal-shift factor n_s/n_imm. */
export function paraxialFocalShift(nImmersion: number, nSample: number): number {
  return nImmersion >= 1 && nSample >= 1 && Number.isFinite(nImmersion + nSample) ? nSample / nImmersion : NaN;
}

/** Marginal-ray focal-shift factor tan α_imm/tan α_s, sin α = NA/n; NaN if NA ≥ either index (the ray is lost). */
export function marginalFocalShift(NA: number, nImmersion: number, nSample: number): number {
  if (!(positive(NA) && NA < nImmersion && NA < nSample && Number.isFinite(nImmersion + nSample))) return NaN;
  const tanAlpha = (n: number) => NA / Math.sqrt(n * n - NA * NA);
  return tanAlpha(nImmersion) / tanAlpha(nSample);
}
