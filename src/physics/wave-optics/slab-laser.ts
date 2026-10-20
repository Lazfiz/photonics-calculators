/**
 * Zigzag slab laser: bounce geometry, the one-dimensional temperature profile of a uniformly heated slab cooled on both
 * large faces, and the thermal lens a straight-through ray would see. SI units.
 * Model tier: textbook. Infinite slab (no edge or end effects), uniform heat density, temperature-independent
 * conductivity; the lens keeps only the dn/dT term (no stress-optic or end-bulging terms). J. M. Eggleston, T. J. Kane,
 * K. Kuhn, J. Unternahrer, R. L. Byer, IEEE J. Quantum Electron. 20, 289 (1984), doi 10.1109/JQE.1984.1072386;
 * T. J. Kane, J. M. Eggleston, R. L. Byer, IEEE J. Quantum Electron. 21, 1195 (1985), doi 10.1109/JQE.1985.1072799.
 *
 *   θ = atan(N t/L)                 zigzag angle to the slab axis, N crossings of the thickness t over the length L
 *   L_z = L/cos θ                   zigzag path; the face incidence angle 90° − θ must exceed asin(1/n) for TIR
 *   ΔT(y) = Q(t²/4 − y²)/(2κ)       centre rise Q t²/(8κ), mean rise Q t²/(12κ)
 *   f = κ/((dn/dT) Q L)             straight-through thermal lens; the zigzag averages it out to first order
 */

/** Zigzag angle to the slab axis atan(N t/L), rad. */
export function zigzagAngle(length: number, thickness: number, crossings: number): number {
  if (!(length > 0 && thickness > 0 && crossings > 0)) return NaN;
  return Math.atan((crossings * thickness) / length);
}

/** True when the face incidence angle π/2 − θ exceeds the critical angle asin(1/n). */
export function totalInternalReflection(theta: number, n: number): boolean {
  return n > 1 && theta >= 0 && Math.PI / 2 - theta > Math.asin(1 / n);
}

/** Temperature rise above the faces at height y (|y| ≤ t/2) of a slab of thickness t with heat density Q, K. */
export function slabTemperatureRise(Q: number, thickness: number, kappa: number, y = 0): number {
  if (!(Q >= 0 && thickness > 0 && kappa > 0 && Math.abs(y) <= thickness / 2)) return NaN;
  return (Q * (thickness * thickness / 4 - y * y)) / (2 * kappa);
}

/** Straight-through thermal focal length κ/((dn/dT) Q L), m; Infinity without heating, negative for dn/dT < 0. */
export function slabThermalLens(Q: number, kappa: number, dndT: number, length: number): number {
  if (!(Q >= 0 && kappa > 0 && length > 0 && Number.isFinite(dndT))) return NaN;
  return Q === 0 || dndT === 0 ? Infinity : kappa / (dndT * Q * length);
}
