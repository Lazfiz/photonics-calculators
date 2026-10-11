/**
 * Jones calculus for fully polarized, coherent light: 2-vectors of complex field amplitudes (Ex, Ey) and 2×2
 * complex matrices. Model tier: exact for ideal elements. R. C. Jones, JOSA 31, 488 (1941),
 * doi:10.1364/JOSA.31.000488; D. H. Goldstein, Polarized Light, 3rd ed. (CRC Press, 2011).
 *
 * CONVENTION (Goldstein/Collett, used by every polarization module and page):
 * - Time factor e^{i(ωt − kz)}: the physical field is Re{E e^{iωt}}.
 * - Right circular RCP = [1, i]/√2: the field turns clockwise as seen by the receiver, looking into the beam.
 *   S3 = 2 Im(Ex* Ey) is +1 for RCP, −1 for LCP = [1, −i]/√2.
 * - A retarder with its fast axis at 0° is diag(1, e^{−iΓ}): the slow (y) component lags by Γ.
 * - Angles θ are counter-clockwise looking into the beam, from +x, for polarizers, retarders and rotators
 *   alike. An element rotated to θ is R(−θ)·J·R(θ), with the coordinate rotation R(θ) = [[c, s], [−s, c]].
 *   A rotator by +θ is R(−θ): it turns horizontal light to the linear state at +θ.
 * Angles are in radians.
 */
import { type Complex, add, complex, conj, exp, mul, abs2 } from "../complex";

export type JonesVector = [Complex, Complex];
export type JonesMatrix = [[Complex, Complex], [Complex, Complex]];

const re = (x: number) => complex(x, 0);

/** Matrix from real entries [[a, b], [c, d]]. */
const realMatrix = (a: number, b: number, c: number, d: number): JonesMatrix => [
  [re(a), re(b)],
  [re(c), re(d)],
];

export const IDENTITY: JonesMatrix = realMatrix(1, 0, 0, 1);

// ---------------------------------------------------------------- states

/** Linear polarization at azimuth θ, unit intensity: [cos θ, sin θ]. */
export function linearState(theta: number): JonesVector {
  return [re(Math.cos(theta)), re(Math.sin(theta))];
}

/**
 * Elliptical state with azimuth ψ and ellipticity angle χ ∈ [−π/4, π/4], unit intensity (Goldstein):
 *   E = [cos ψ cos χ − i sin ψ sin χ, sin ψ cos χ + i cos ψ sin χ].
 * χ > 0 is right-handed (S3 = sin 2χ > 0); χ = ±π/4 gives RCP and LCP.
 */
export function ellipticalState(psi: number, chi: number): JonesVector {
  const cp = Math.cos(psi), sp = Math.sin(psi), cc = Math.cos(chi), sc = Math.sin(chi);
  return [complex(cp * cc, -sp * sc), complex(sp * cc, cp * sc)];
}

export const RCP: JonesVector = [re(Math.SQRT1_2), complex(0, Math.SQRT1_2)];
export const LCP: JonesVector = [re(Math.SQRT1_2), complex(0, -Math.SQRT1_2)];

// ---------------------------------------------------------------- algebra

export function matMul(A: JonesMatrix, B: JonesMatrix): JonesMatrix {
  const e = (i: 0 | 1, j: 0 | 1) => add(mul(A[i][0], B[0][j]), mul(A[i][1], B[1][j]));
  return [
    [e(0, 0), e(0, 1)],
    [e(1, 0), e(1, 1)],
  ];
}

export function apply(M: JonesMatrix, E: JonesVector): JonesVector {
  return [add(mul(M[0][0], E[0]), mul(M[0][1], E[1])), add(mul(M[1][0], E[0]), mul(M[1][1], E[1]))];
}

/** Conjugate transpose J†. */
export function adjoint(M: JonesMatrix): JonesMatrix {
  return [
    [conj(M[0][0]), conj(M[1][0])],
    [conj(M[0][1]), conj(M[1][1])],
  ];
}

/**
 * System matrix of elements in the order the light meets them: elements[0] acts first, so the product is
 * M_n ⋯ M_2 · M_1. The identity for an empty list.
 */
export function chainMatrix(elements: readonly JonesMatrix[]): JonesMatrix {
  return elements.reduce<JonesMatrix>((acc, M) => matMul(M, acc), IDENTITY);
}

/** The field after each element in turn; [0] is the input. elements[0] acts first. */
export function propagate(elements: readonly JonesMatrix[], E: JonesVector): JonesVector[] {
  const states: JonesVector[] = [E];
  for (const M of elements) states.push(apply(M, states[states.length - 1]));
  return states;
}

/** Intensity |Ex|² + |Ey|². */
export const intensity = (E: JonesVector) => abs2(E[0]) + abs2(E[1]);

/** Stokes vector [S0, S1, S2, S3] of a Jones vector; S2 = 2 Re(Ex* Ey), S3 = 2 Im(Ex* Ey). */
export function stokesFromJones(E: JonesVector): [number, number, number, number] {
  const ix = abs2(E[0]), iy = abs2(E[1]);
  const cross = mul(conj(E[0]), E[1]);
  return [ix + iy, ix - iy, 2 * cross.re, 2 * cross.im];
}

// ---------------------------------------------------------------- elements

/** Coordinate rotation R(θ) = [[cos θ, sin θ], [−sin θ, cos θ]]. */
export function rotation(theta: number): JonesMatrix {
  const c = Math.cos(theta), s = Math.sin(theta);
  return realMatrix(c, s, -s, c);
}

/** Element J turned to azimuth θ: R(−θ)·J·R(θ). */
export function rotateElement(J: JonesMatrix, theta: number): JonesMatrix {
  return matMul(rotation(-theta), matMul(J, rotation(theta)));
}

/** Ideal linear polarizer with its transmission axis at θ: [[c², cs], [cs, s²]]. */
export function linearPolarizer(theta: number): JonesMatrix {
  const c = Math.cos(theta), s = Math.sin(theta);
  return realMatrix(c * c, c * s, c * s, s * s);
}

/** Linear retarder, retardance Γ, fast axis at θ: R(−θ)·diag(1, e^{−iΓ})·R(θ). */
export function linearRetarder(retardance: number, fastAxis: number): JonesMatrix {
  const J: JonesMatrix = [
    [re(1), re(0)],
    [re(0), exp(complex(0, -retardance))],
  ];
  return rotateElement(J, fastAxis);
}

/** Rotator (optically active or Faraday element in one pass) turning the polarization by +θ: R(−θ). */
export function rotator(theta: number): JonesMatrix {
  return rotation(-theta);
}

/** Ideal circular polarizer: the projector E·E† onto RCP or LCP. Right: ½[[1, −i], [i, 1]]. */
export function circularPolarizer(hand: "right" | "left"): JonesMatrix {
  const s = hand === "right" ? 0.5 : -0.5;
  return [
    [re(0.5), complex(0, -s)],
    [complex(0, s), re(0.5)],
  ];
}
