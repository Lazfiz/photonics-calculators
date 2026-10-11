/**
 * Mueller calculus: 4×4 real matrices acting on Stokes vectors, for partially polarized or incoherent light.
 * Model tier: exact for ideal elements. Sign convention as in jones.ts (Goldstein/Collett): an element at azimuth θ
 * is R(−θ)·M·R(θ) with R(θ) = [[1, 0, 0, 0], [0, c, s, 0], [0, −s, c, 0], [0, 0, 0, 1]], c = cos 2θ, s = sin 2θ,
 * and a rotator by +θ is R(−θ). D. H. Goldstein, Polarized Light, 3rd ed. (CRC Press, 2011), the Mueller matrices
 * of polarizers, retarders and rotators. Angles in radians.
 */
import { type JonesMatrix, adjoint, matMul } from "./jones";
import type { Stokes } from "./stokes";

export type MuellerMatrix = number[][];

export const MUELLER_IDENTITY: MuellerMatrix = [
  [1, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 1, 0],
  [0, 0, 0, 1],
];

const nanMatrix = (): MuellerMatrix => Array.from({ length: 4 }, () => [NaN, NaN, NaN, NaN]);

export function muellerMultiply(A: MuellerMatrix, B: MuellerMatrix): MuellerMatrix {
  return A.map((row) => [0, 1, 2, 3].map((j) => row[0] * B[0][j] + row[1] * B[1][j] + row[2] * B[2][j] + row[3] * B[3][j]));
}

export function applyMueller(M: MuellerMatrix, S: Stokes): Stokes {
  const r = (i: number) => M[i][0] * S[0] + M[i][1] * S[1] + M[i][2] * S[2] + M[i][3] * S[3];
  return [r(0), r(1), r(2), r(3)];
}

/** System matrix for elements in the order the light meets them (elements[0] first): M_n ⋯ M_1. */
export function chainMueller(elements: readonly MuellerMatrix[]): MuellerMatrix {
  return elements.reduce<MuellerMatrix>((acc, M) => muellerMultiply(M, acc), MUELLER_IDENTITY);
}

/** Coordinate rotation R(θ). */
export function muellerRotation(theta: number): MuellerMatrix {
  const c = Math.cos(2 * theta), s = Math.sin(2 * theta);
  return [
    [1, 0, 0, 0],
    [0, c, s, 0],
    [0, -s, c, 0],
    [0, 0, 0, 1],
  ];
}

/** Element M turned to azimuth θ: R(−θ)·M·R(θ). */
export function rotateMueller(M: MuellerMatrix, theta: number): MuellerMatrix {
  return muellerMultiply(muellerRotation(-theta), muellerMultiply(M, muellerRotation(theta)));
}

/** Ideal linear polarizer, transmission axis at θ: ½[[1, c, s, 0], [c, c², cs, 0], [s, cs, s², 0], [0, 0, 0, 0]]. */
export function muellerPolarizer(theta: number): MuellerMatrix {
  const c = Math.cos(2 * theta), s = Math.sin(2 * theta);
  return [
    [0.5, 0.5 * c, 0.5 * s, 0],
    [0.5 * c, 0.5 * c * c, 0.5 * c * s, 0],
    [0.5 * s, 0.5 * c * s, 0.5 * s * s, 0],
    [0, 0, 0, 0],
  ];
}

/** Linear retarder with cos Γ and sin Γ given (so a band average of them gives the averaged matrix). */
function retarderFromCosSin(cd: number, sd: number, fastAxis: number): MuellerMatrix {
  const c = Math.cos(2 * fastAxis), s = Math.sin(2 * fastAxis);
  return [
    [1, 0, 0, 0],
    [0, c * c + s * s * cd, c * s * (1 - cd), -s * sd],
    [0, c * s * (1 - cd), s * s + c * c * cd, c * sd],
    [0, s * sd, -c * sd, cd],
  ];
}

/**
 * Linear retarder, retardance Γ, fast axis at θ. At θ = 0 the (S2, S3) block is [[cos Γ, sin Γ], [−sin Γ, cos Γ]]:
 * a quarter-wave plate turns +45° light, [1, 0, 1, 0], into LCP, [1, 0, 0, −1].
 */
export function muellerRetarder(retardance: number, fastAxis: number): MuellerMatrix {
  return retarderFromCosSin(Math.cos(retardance), Math.sin(retardance), fastAxis);
}

/** Rotator turning the polarization by +θ: R(−θ), whose (S1, S2) block is [[c, −s], [s, c]]. */
export function muellerRotator(theta: number): MuellerMatrix {
  return muellerRotation(-theta);
}

/** Ideal circular polarizer: ½[[1, 0, 0, ±1], 0, 0, [±1, 0, 0, 1]], + for right-handed (S3 > 0) output. */
export function muellerCircularPolarizer(hand: "right" | "left"): MuellerMatrix {
  const h = hand === "right" ? 0.5 : -0.5;
  return [
    [0.5, 0, 0, h],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [h, 0, 0, 0.5],
  ];
}

/**
 * Isotropic depolarizer diag(1, d, d, d): it keeps the fraction d of the polarized part. Realisable only for
 * d ∈ [−1/3, 1]: the coherency matrix of diag(1, a, b, c) has eigenvalues ¼(1 + a + b + c), ¼(1 + a − b − c),
 * ¼(1 − a + b − c), ¼(1 − a − b + c), which must all be ≥ 0 (S. R. Cloude, Optik 75, 26–36, 1986); here they are
 * ¼(1 + 3d) and ¼(1 − d). NaN entries outside that range.
 */
export function muellerDepolarizer(d: number): MuellerMatrix {
  if (!(d >= -1 / 3 && d <= 1)) return nanMatrix();
  return [
    [1, 0, 0, 0],
    [0, d, 0, 0],
    [0, 0, d, 0],
    [0, 0, 0, d],
  ];
}

/**
 * Mueller matrix of a Jones matrix (a non-depolarizing element): M_ij = ½ tr(J† σ_i J σ_j), with σ0 = I,
 * σ1 = diag(1, −1), σ2 = [[0, 1], [1, 0]], σ3 = [[0, −i], [i, 0]], so that S_i = E† σ_i E for every Jones vector E.
 */
export function muellerFromJones(J: JonesMatrix): MuellerMatrix {
  const z = { re: 0, im: 0 }, one = { re: 1, im: 0 };
  const sigma: JonesMatrix[] = [
    [[one, z], [z, one]],
    [[one, z], [z, { re: -1, im: 0 }]],
    [[z, one], [one, z]],
    [[z, { re: 0, im: -1 }], [{ re: 0, im: 1 }, z]],
  ];
  const Jd = adjoint(J);
  return sigma.map((si) => {
    const A = matMul(Jd, matMul(si, J));
    return sigma.map((sj) => {
      const P = matMul(A, sj);
      return 0.5 * (P[0][0].re + P[1][1].re);
    });
  });
}

/** Most Simpson intervals for a band average; beyond this the band holds too many retardance cycles. */
const MAX_INTERVALS = 1_000_000;

/**
 * Band averages ⟨cos Γ⟩ and ⟨sin Γ⟩ for a non-dispersive retarder, Γ(λ) = 2π m λ0/λ (m waves at λ0), over a
 * spectrum flat in wavelength on [λmin, λmax]. Simpson's rule with ≥ 32 intervals per 2π of Γ, so the error is
 * below 1e-5; NaN beyond 31 250 cycles across the band, or for λmin ≤ 0, λmax < λmin, m < 0.
 */
export function bandAveragedRetardance(
  m: number, lambda0: number, lambdaMin: number, lambdaMax: number,
): { meanCos: number; meanSin: number } {
  const bad = { meanCos: NaN, meanSin: NaN };
  if (!(m >= 0 && lambda0 > 0 && lambdaMin > 0 && lambdaMax >= lambdaMin) || !Number.isFinite(m * lambda0 * lambdaMax)) return bad;
  const a = 2 * Math.PI * m * lambda0;
  if (lambdaMax === lambdaMin) return { meanCos: Math.cos(a / lambdaMin), meanSin: Math.sin(a / lambdaMin) };
  const cycles = m * lambda0 * (1 / lambdaMin - 1 / lambdaMax);
  const n = 2 * Math.ceil(Math.max(100, 16 * cycles));
  if (n > MAX_INTERVALS) return bad;
  const h = (lambdaMax - lambdaMin) / n;
  let sc = 0, ss = 0;
  for (let i = 0; i <= n; i++) {
    const w = i === 0 || i === n ? 1 : i % 2 === 1 ? 4 : 2;
    const g = a / (lambdaMin + i * h);
    sc += w * Math.cos(g);
    ss += w * Math.sin(g);
  }
  const span = lambdaMax - lambdaMin;
  return { meanCos: (sc * h) / 3 / span, meanSin: (ss * h) / 3 / span };
}

/**
 * Mueller matrix of a non-dispersive retarder (m waves at λ0, fast axis θ) averaged over a band of full width B
 * centred on λ0, flat in wavelength: incoherent light adds intensities, so the Stokes outputs average and the
 * matrix is the retarder matrix with ⟨cos Γ⟩, ⟨sin Γ⟩. It depolarizes; NaN entries where bandAveragedRetardance is.
 */
export function muellerRetarderBandAveraged(m: number, lambda0: number, bandwidth: number, fastAxis: number): MuellerMatrix {
  const { meanCos, meanSin } = bandAveragedRetardance(m, lambda0, lambda0 - bandwidth / 2, lambda0 + bandwidth / 2);
  return Number.isNaN(meanCos) ? nanMatrix() : retarderFromCosSin(meanCos, meanSin, fastAxis);
}
