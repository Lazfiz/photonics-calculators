/**
 * Internal quantum efficiency of a photodiode from the absorption coefficient. SI units: m, 1/m. Invalid inputs give NaN.
 *
 * Light enters through a surface of reflectance R, crosses an absorbing dead layer of thickness d that collects nothing
 * (a heavily doped or damaged surface), then a depletion region of width W that collects every carrier, then a
 * field-free substrate where minority carriers diffuse to the junction with diffusion length L. W. W. Gärtner,
 * Phys. Rev. 116, 84 (1959), doi:10.1103/PhysRev.116.84; S. M. Sze, K. K. Ng, Physics of Semiconductor Devices, 3rd
 * ed. (Wiley 2007), ch. 13:
 *   η = (1 − R)·e^(−α·d)·[1 − e^(−α·W)/(1 + α·L)].
 * L = 0 gives the slab absorber (1 − R)·e^(−α·d)·(1 − e^(−α·W)), the model of a thin epitaxial or back-thinned layer.
 * The substrate is semi-infinite and recombination at the back surface is ignored.
 */

import { normalIncidenceReflectance } from "../polarization/fresnel";

export interface PhotodiodeQeInputs {
  /** Absorption coefficient α, 1/m. */
  alpha: number;
  /** Power reflectance of the front surface, 0–1. */
  reflectance: number;
  /** Depletion (or fully collecting) width W, m. */
  depletionWidth: number;
  /** Minority-carrier diffusion length L in the substrate, m; 0 for a slab. */
  diffusionLength?: number;
  /** Non-collecting surface layer thickness d, m. */
  deadLayer?: number;
}

/** Quantum efficiency (1 − R)·e^(−α·d)·[1 − e^(−α·W)/(1 + α·L)], 0–1. */
export function photodiodeQe({ alpha, reflectance, depletionWidth, diffusionLength = 0, deadLayer = 0 }: PhotodiodeQeInputs): number {
  if (!(alpha >= 0) || !(reflectance >= 0 && reflectance <= 1) || !(depletionWidth >= 0)) return NaN;
  if (!(diffusionLength >= 0) || !(deadLayer >= 0)) return NaN;
  if (alpha === Infinity) return deadLayer > 0 ? 0 : NaN;
  const aL = alpha * diffusionLength;
  // 1 − e^(−αW)/(1 + αL) = (αL − expm1(−αW))/(1 + αL), exact and free of cancellation for small αW.
  const collected = (aL - Math.expm1(-alpha * depletionWidth)) / (1 + aL);
  return (1 - reflectance) * Math.exp(-alpha * deadLayer) * collected;
}

/** Normal-incidence reflectance ((n − 1)² + k²)/((n + 1)² + k²) of a bare surface n + ik in air (Fresnel). */
export function normalReflectance(n: number, k = 0): number {
  return normalIncidenceReflectance(1, n, k);
}
