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

// ---------------------------------------------------------------------------------------------------------------
// Element and input-state tables of the Jones-calculus and Jones-chain pages (shared with their API schemas).
// ---------------------------------------------------------------------------------------------------------------
const D2R = Math.PI / 180;

export type JonesCalculusElementType =
  | "polarizer-h" | "polarizer-v" | "polarizer-45" | "polarizer-135"
  | "qwp-fast-h" | "qwp-fast-v" | "hwp-fast-h" | "hwp-fast-v" | "rotator";

/** Elements the Jones-calculus page offers. `hasAngle`: the element takes a rotation angle (degrees). */
export const JONES_CALCULUS_ELEMENTS: readonly {
  type: JonesCalculusElementType; label: string; hasAngle: boolean; defaultAngle: number;
}[] = [
  { type: "polarizer-h", label: "Polarizer → H", hasAngle: false, defaultAngle: 0 },
  { type: "polarizer-v", label: "Polarizer → V", hasAngle: false, defaultAngle: 0 },
  { type: "polarizer-45", label: "Polarizer → 45°", hasAngle: false, defaultAngle: 0 },
  { type: "polarizer-135", label: "Polarizer → 135°", hasAngle: false, defaultAngle: 0 },
  { type: "qwp-fast-h", label: "λ/4 fast axis H", hasAngle: false, defaultAngle: 0 },
  { type: "qwp-fast-v", label: "λ/4 fast axis V", hasAngle: false, defaultAngle: 0 },
  { type: "hwp-fast-h", label: "λ/2 fast axis H", hasAngle: false, defaultAngle: 0 },
  { type: "hwp-fast-v", label: "λ/2 fast axis V", hasAngle: false, defaultAngle: 0 },
  { type: "rotator", label: "Rotator", hasAngle: true, defaultAngle: 45 },
];

/** Jones matrix of a Jones-calculus page element; `angleDeg` is used by the rotator only (default 45°). */
export function jonesCalculusMatrix(type: JonesCalculusElementType, angleDeg?: number): JonesMatrix {
  switch (type) {
    case "polarizer-h": return linearPolarizer(0);
    case "polarizer-v": return linearPolarizer(90 * D2R);
    case "polarizer-45": return linearPolarizer(45 * D2R);
    case "polarizer-135": return linearPolarizer(135 * D2R);
    case "qwp-fast-h": return linearRetarder(90 * D2R, 0);
    case "qwp-fast-v": return linearRetarder(90 * D2R, 90 * D2R);
    case "hwp-fast-h": return linearRetarder(180 * D2R, 0);
    case "hwp-fast-v": return linearRetarder(180 * D2R, 90 * D2R);
    case "rotator": return rotator((angleDeg ?? 45) * D2R);
    default: return IDENTITY;
  }
}

export type JonesCalculusInputKey = "linear-h" | "linear-v" | "linear-45" | "linear-135" | "rcp" | "lcp";

/** Input states of the Jones-calculus page (unit intensity). */
export const JONES_CALCULUS_INPUTS: Record<JonesCalculusInputKey, { jones: JonesVector; label: string }> = {
  "linear-h": { jones: linearState(0), label: "Linear H" },
  "linear-v": { jones: linearState(90 * D2R), label: "Linear V" },
  "linear-45": { jones: linearState(45 * D2R), label: "Linear 45°" },
  "linear-135": { jones: linearState(-45 * D2R), label: "Linear 135°" }, // 135° = −45°
  rcp: { jones: RCP, label: "RCP" },
  lcp: { jones: LCP, label: "LCP" },
};

/** Elements of the Jones-chain page, keyed by id. */
export const JONES_CHAIN_ELEMENTS: Record<string, { label: string; matrix: JonesMatrix }> = {
  "polarizer-h": { label: "Horizontal Polarizer", matrix: linearPolarizer(0) },
  "polarizer-v": { label: "Vertical Polarizer", matrix: linearPolarizer(90 * D2R) },
  "polarizer-45": { label: "45° Polarizer", matrix: linearPolarizer(45 * D2R) },
  "qwp-fast-h": { label: "Quarter-Wave (Fast-H)", matrix: linearRetarder(90 * D2R, 0) },
  "qwp-fast-v": { label: "Quarter-Wave (Fast-V)", matrix: linearRetarder(90 * D2R, 90 * D2R) },
  "hwp-fast-h": { label: "Half-Wave (Fast-H)", matrix: linearRetarder(180 * D2R, 0) },
  "hwp-fast-45": { label: "Half-Wave (Fast-45°)", matrix: linearRetarder(180 * D2R, 45 * D2R) },
  "circ-polarizer-right": { label: "Right Circular Polarizer", matrix: circularPolarizer("right") },
  "circ-polarizer-left": { label: "Left Circular Polarizer", matrix: circularPolarizer("left") },
};

/** Input states of the Jones-chain page, keyed by id (unit intensity). */
export const JONES_CHAIN_INPUTS: Record<string, { label: string; jones: JonesVector }> = {
  h: { label: "Horizontal", jones: linearState(0) },
  v: { label: "Vertical", jones: linearState(90 * D2R) },
  "linear-45": { label: "45° Linear", jones: linearState(45 * D2R) },
  rcp: { label: "RCP", jones: RCP },
  lcp: { label: "LCP", jones: LCP },
  elliptical: { label: "Elliptical (ψ 20°, χ 15°)", jones: ellipticalState(20 * D2R, 15 * D2R) },
};
