/**
 * Closed forms for a periodic quarter-wave stack (HL)^N: the width of its high-reflectance zone (stop
 * band), and the first-order shift of the zone with the angle of incidence.
 *
 * Model tier: Exact for the zone edges of a lossless, non-dispersive quarter-wave stack at normal
 * incidence in the limit of many periods, where the period's characteristic matrix has half-trace −1
 * (Born & Wolf §1.6.5). A finite stack's 50 % points lie a little outside these edges. Textbook (first
 * order) for the angle shift: the zone centre is put where the period's phase thickness is π.
 *
 * References: H. A. Macleod, Thin-Film Optical Filters, 4th ed. (CRC Press, 2010), ch. 6 (multilayer
 * high-reflectance coatings: Δg = (2/π) asin((n_H − n_L)/(n_H + n_L)) in g = λ₀/λ) and ch. 2 (phase
 * thickness 2πNd cos θ/λ). M. Born & E. Wolf, Principles of Optics, 7th ed. (Cambridge University
 * Press, 1999), §1.6.5 (periodically stratified media).
 */

/**
 * Half-width Δg of the high-reflectance zone, in g = λ₀/λ: Δg = (2/π) asin(|n_H − n_L|/(n_H + n_L)).
 * The zone spans g = 1 ± Δg. NaN unless n_H, n_L > 0.
 */
export function stopBandHalfWidth(nH: number, nL: number): number {
  if (!(nH > 0 && nL > 0)) return NaN;
  return (2 / Math.PI) * Math.asin(Math.abs(nH - nL) / (nH + nL));
}

/** Edges of the zone around λ₀ (m): short = λ₀/(1 + Δg), long = λ₀/(1 − Δg). NaN unless λ₀ > 0. */
export function stopBandEdges(lambda0: number, nH: number, nL: number): { short: number; long: number } {
  const dg = stopBandHalfWidth(nH, nL);
  if (!(lambda0 > 0) || Number.isNaN(dg)) return { short: NaN, long: NaN };
  return { short: lambda0 / (1 + dg), long: lambda0 / (1 - dg) };
}

/**
 * Smallest ratio λ₂/λ₁ of the design wavelengths of two stacks (same n_H, n_L) whose zones don't
 * overlap: λ₁/(1 − Δg) ≤ λ₂/(1 + Δg), so λ₂/λ₁ ≥ (1 + Δg)/(1 − Δg).
 */
export function nonOverlappingRatio(nH: number, nL: number): number {
  const dg = stopBandHalfWidth(nH, nL);
  return (1 + dg) / (1 - dg);
}

/**
 * Zone centre (m) at angle of incidence θ₀ (rad) from an incident medium of index n₀, for layers that
 * are quarter waves at λ₀ at normal incidence. A layer's phase thickness is (π/2)(λ₀/λ) cos θᵢ with
 * cos θᵢ = √(1 − (n₀ sin θ₀/nᵢ)²) (Snell); the period's phase is π at λ_c = λ₀ (cos θ_H + cos θ_L)/2.
 * First order: the same for s and p. NaN unless λ₀, n₀, n_H, n_L > 0, 0 ≤ θ₀ < π/2 and the light
 * propagates in both layers (n₀ sin θ₀ < n_H, n_L).
 */
export function stopBandCentreAtAngle(lambda0: number, nH: number, nL: number, angle: number, incident = 1): number {
  if (!(lambda0 > 0 && nH > 0 && nL > 0 && incident > 0 && angle >= 0 && angle < Math.PI / 2)) return NaN;
  const s = incident * Math.sin(angle);
  if (!(s < nH && s < nL)) return NaN;
  const cosH = Math.sqrt(1 - (s / nH) ** 2);
  const cosL = Math.sqrt(1 - (s / nL) ** 2);
  return (lambda0 * (cosH + cosL)) / 2;
}
