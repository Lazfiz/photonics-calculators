/**
 * Steady heat conduction in an optical window or rod with a temperature-independent conductivity k. SI units.
 * Model tier: textbook.
 *
 *   ΔT = P d/(kA)        face-to-face drop when P flows through a slab of thickness d and area A (Fourier's law)
 *   ΔT₀ = P/(4πkL)       beam centre to beam edge for heat P deposited uniformly in a cylinder of length L,
 *                        radial flow: T(r) = T(0) − Q r²/(4k), Q = P/(πr₀²L)
 *   f = 2kA/(P dn/dT)    thermal lens from the dn/dT term alone, f = (kA/P)(½ dn/dT)⁻¹
 * (W. Koechner, Solid-State Laser Engineering, 6th ed., Springer 2006, doi:10.1007/0-387-29338-8, ch. 7, the
 * uniformly pumped rod). The curvature inside the heated cylinder depends only on Q/k, so the lens holds for a
 * top-hat beam in a wider window too. Not modelled: the stress-optic and end-bulging terms of the lens, axial heat
 * flow to the faces (a thin window), a Gaussian heat profile, and k(T). A slab cooled on both faces has twice the
 * lens power of this cylinder (`slabThermalLens` in wave-optics/slab-laser.ts).
 */

/** Face-to-face temperature drop P d/(kA), K; NaN unless d, k, A > 0 and P ≥ 0. */
export function slabConductionRise(power: number, thickness: number, k: number, area: number): number {
  if (!(power >= 0 && thickness > 0 && k > 0 && area > 0)) return NaN;
  return (power * thickness) / (k * area);
}

/** Centre-to-edge rise of a uniformly heated cylinder with radial heat flow, P/(4πkL), K. */
export function cylinderCentreRise(power: number, k: number, length: number): number {
  if (!(power >= 0 && k > 0 && length > 0)) return NaN;
  return power / (4 * Math.PI * k * length);
}

/** dn/dT thermal focal length 2kA/(P dn/dT), m; Infinity without heating or dn/dT = 0, negative for dn/dT < 0. */
export function rodThermalLens(power: number, k: number, area: number, dndT: number): number {
  if (!(power >= 0 && k > 0 && area > 0 && Number.isFinite(dndT))) return NaN;
  return power === 0 || dndT === 0 ? Infinity : (2 * k * area) / (power * dndT);
}
