/**
 * Twisted-nematic liquid-crystal layer in Jones calculus (CONVENTION in `jones.ts`). Angles in radians.
 * Model tier: exact for a uniformly twisted layer with the director in the cell plane (no pretilt, no field),
 * positive Δn (director = slow axis), normal incidence, ideal polarizers, no reflections.
 *
 * The director turns uniformly from 0 (along x) at the entrance to Φ at the exit (Φ > 0 counter-clockwise looking
 * into the beam). With Γ = 2πΔn d/λ and X = √(Φ² + (Γ/2)²), the field in the frame that follows the director obeys
 * dE′/dt = K E′ (t = z/d), K = [[−iΓ/2, Φ], [−Φ, iΓ/2]]. K² = −X² I, so
 *   J = R(−Φ) · (cos X · I + (sin X / X) · K),   R(θ) = [[cos θ, sin θ], [−sin θ, cos θ]],
 * up to a common phase (P. Yeh, C. Gu, Optics of Liquid Crystal Displays, Wiley, 1999).
 * With the polarizer along the entrance director and the analyzer parallel to it, a 90° cell transmits
 *   T∥ = sin²(X)/(1 + u²), u = Γ/(2Φ) = 2Δn d/λ,
 * zero at u = √(4k² − 1), i.e. Δn d/λ = √3/2, √15/2, … (Gooch & Tarry, J. Phys. D 8, 1575 (1975),
 * doi:10.1088/0022-3727/8/13/020). Φ = 0 is a plain retarder: T = cos²(Γ/2) between parallel polarizers at 45°.
 */
import { complex } from "../complex";
import { apply, linearState, matMul, rotation, type JonesMatrix } from "./jones";

/** sin(x)/x, 1 at x = 0. */
function sinc(x: number): number {
  return Math.abs(x) < 1e-8 ? 1 - (x * x) / 6 : Math.sin(x) / x;
}

/** Jones matrix of a twisted-nematic layer with twist Φ and retardance Γ = 2πΔn d/λ. */
export function twistedNematicJones(twist: number, retardance: number): JonesMatrix {
  const X = Math.hypot(twist, retardance / 2);
  const c = Math.cos(X), s = sinc(X);
  const M: JonesMatrix = [
    [complex(c, (-retardance / 2) * s), complex(twist * s, 0)],
    [complex(-twist * s, 0), complex(c, (retardance / 2) * s)],
  ];
  return matMul(rotation(-twist), M);
}

/**
 * Transmission of the cell between ideal linear polarizers at angles `polarizer` and `analyzer` (from the entrance
 * director), as a fraction of the light leaving the first polarizer.
 */
export function lcTransmission(twist: number, retardance: number, polarizer: number, analyzer: number): number {
  const E = apply(twistedNematicJones(twist, retardance), linearState(polarizer));
  const ca = Math.cos(analyzer), sa = Math.sin(analyzer);
  const re = ca * E[0].re + sa * E[1].re;
  const im = ca * E[0].im + sa * E[1].im;
  return re * re + im * im;
}

/** Gooch-Tarry T∥ of a 90° cell (polarizer along the entrance director, analyzer parallel to it). */
export function goochTarryParallel(retardance: number): number {
  const u = retardance / Math.PI;
  const X = (Math.PI / 2) * Math.sqrt(1 + u * u);
  return Math.sin(X) ** 2 / (1 + u * u);
}

/** The k-th Gooch-Tarry minimum of a 90° cell: Δn d/λ = √(4k² − 1)/2. */
export function goochTarryMinimum(k: number): number {
  return Math.sqrt(4 * k * k - 1) / 2;
}
