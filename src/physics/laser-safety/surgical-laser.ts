/**
 * Beam geometry of a focusing surgical handpiece and the thermal relaxation time of a tissue target. SI units: lengths
 * in m, angles in rad, time in s, diffusivity in m²/s. Model tier: textbook.
 *
 * Handpiece ("lens on laser", ANSI Z136.1-2014 App. B, ANSI Z136.3): a beam of 1/e² diameter b₀ on a lens of focal
 * length f converges to the focus and spreads again beyond it with the full angle b₀/f. The hazard distance beyond the
 * focus is then `nominalOcularHazardDistance` of a beam of the focal-spot diameter and that divergence (linear spread),
 * which for a spot much smaller than the safe diameter is the standards' (f/b₀)·√(4P/(πE)) with 1/e values. A Gaussian
 * beam can't focus below 4λf/(πb₀) (M² = 1).
 *
 * Thermal relaxation time (Anderson & Parrish, Science 220, 524, 1983): the time for the centre temperature of a
 * Gaussian profile whose 1/e width is the target size d to halve. In n dimensions it falls as (1 + 4κt/(d/2)²)^(−n/2),
 * so τ = (2^(2/n) − 1)·d²/(16κ): d²/(16κ) for a cylinder (a vessel, n = 2), d²/(27.2κ) for a sphere (n = 3) and
 * 3d²/(16κ) for a layer of thickness d (n = 1). Heat stays in the target (thermal confinement) for pulses shorter than τ.
 */

/** Thermal diffusivity of soft tissue, m²/s (water: 1.43×10⁻⁷ at 20 °C). */
export const TISSUE_DIFFUSIVITY = 1.3e-7;

export type TargetShape = "layer" | "cylinder" | "sphere";

const DIMENSIONS: Record<TargetShape, number> = { layer: 1, cylinder: 2, sphere: 3 };

/** Thermal relaxation time, s, of a target of size d (m) and shape, diffusivity κ (m²/s); NaN for d < 0 or κ ≤ 0. */
export function thermalRelaxationTime(d: number, shape: TargetShape, kappa = TISSUE_DIFFUSIVITY): number {
  if (!(d >= 0 && kappa > 0)) return NaN;
  return ((Math.pow(2, 2 / DIMENSIONS[shape]) - 1) * d * d) / (16 * kappa);
}

/** Full-angle divergence, rad, beyond the focus of a beam of 1/e² diameter b₀ (m) on a lens of focal length f (m). */
export function focusedDivergence(b0: number, f: number): number {
  return b0 >= 0 && f > 0 ? b0 / f : NaN;
}

/** Smallest 1/e² focal-spot diameter, m, of a beam of diameter b₀ (m) at λ (m) on a lens of focal length f (m): 4λf/(πb₀). */
export function diffractionLimitedSpot(lambda: number, b0: number, f: number): number {
  return lambda > 0 && b0 > 0 && f > 0 ? (4 * lambda * f) / (Math.PI * b0) : NaN;
}
