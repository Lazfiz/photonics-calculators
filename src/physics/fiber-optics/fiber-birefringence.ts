/**
 * Linear birefringence of single-mode fibre: elliptical-core (geometric) birefringence, bend-induced birefringence,
 * fibre loop (Lefèvre) retarders, and polarization crosstalk in polarization-maintaining (PM) fibre.
 * SI units in and out: lengths in m, h in 1/m, retardance in rad, birefringence B = n_slow − n_fast (dimensionless).
 * Model tier: textbook approximation.
 *
 * Geometric birefringence of a slightly elliptical step-index core (first-order perturbation, weak guidance),
 * J. Sakai and T. Kimura, IEEE J. Quantum Electron. 17, 1041 (1981), as quoted in S. C. Rashleigh, J. Lightwave
 * Technol. 1, 312 (1983):
 *   B = ε n₁ Δ² G(V),  ε = 1 − b/a (b, a the minor and major semi-axes), Δ = (n₁ − n₂)/n₁,
 *   G(V) = (W²/V⁴) [U² + (U² − W²) (J₀(U)/J₁(U))² + U W² (J₀(U)/J₁(U))³],
 * with U, W the LP01 eigenvalues of the circular core of the same V. The slow axis is the major axis.
 * G peaks at ≈ 0.49 near V = 1.8. Group birefringence (DGD per length × c): ε n₁ Δ² d(V G)/dV, ignoring material
 * dispersion of n₁ and Δ; it changes sign near V = 2.5. Valid for ε ≪ 1 (linear in ε); stress from the
 * elliptical core and thermal mismatch is a separate term.
 *
 * Bend birefringence of a silica fibre of cladding diameter d bent to radius R: B = C (d/2R)², C = 0.133
 * (R. Ulrich, S. C. Rashleigh and W. Eickhoff, Opt. Lett. 5, 273 (1980)), fast axis in the plane of the bend.
 * N loops of diameter D give the retardance Γ = 2π² C N d²/(λ D) (H. C. Lefèvre, Electron. Lett. 16, 778 (1980)):
 * 0.882 rad per loop for d = 125 µm, D = 30 mm at 1550 nm. Not included: the core correction (∝ (a/d)², < 0.1 %),
 * bend loss, tension and the twist between paddles.
 *
 * PM fibre crosstalk: random coupling between the two polarization modes at rate h (the h-parameter) gives the
 * coupled power equations dPx/dz = −h(Px − Py), dPy/dz = h(Px − Py) (K. Okamoto, T. Hosaka, Y. Sasaki, as reviewed
 * by J. Noda, K. Okamoto and Y. Sasaki, J. Lightwave Technol. 4, 1071 (1986)). With input ratio ε₀ = Py/Px,
 * Px − Py decays as e^(−2hL), so the output ratio is (1 − r)/(1 + r) with r = e^(−2hL)(1 − ε₀)/(1 + ε₀);
 * for ε₀ = 0 this is tanh(hL). Losses are polarization-independent.
 */
import { c } from "../constants";
import { besselJ } from "../math";
import { applyMueller, muellerRetarder } from "../polarization/mueller";
import type { Stokes } from "../polarization/stokes";
import { LP11_CUTOFF_V, MIN_V, lp01Mode } from "./macro-bending-loss";

/** Ulrich's bend-birefringence coefficient of silica fibre, B = C (r/R)². */
export const BEND_C_SILICA = 0.133;

/** Sakai–Kimura G(V) for the LP01 mode (MIN_V ≤ V < ∞); NaN outside. */
export function geometricG(V: number): number {
  const { U, W } = lp01Mode(V);
  if (!Number.isFinite(U) || !Number.isFinite(W)) return NaN;
  const r = besselJ(0, U) / besselJ(1, U);
  return ((W * W) / V ** 4) * (U * U + (U * U - W * W) * r * r + U * W * W * r ** 3);
}

/** d(V G)/dV by a central difference (step 1e-5 V), one-sided (second order) within a step of MIN_V; NaN below MIN_V. */
export function geometricGroupG(V: number): number {
  if (!(V >= MIN_V) || !Number.isFinite(V)) return NaN;
  const dV = 1e-5 * V;
  const f = (v: number) => v * geometricG(v);
  if (V - dV < MIN_V) return (-3 * f(V) + 4 * f(V + dV) - f(V + 2 * dV)) / (2 * dV);
  return (f(V + dV) - f(V - dV)) / (2 * dV);
}

export interface EllipticalCoreFiber {
  /** Mean core radius a, m, > 0. */
  a: number;
  /** Core index n₁ > n₂. */
  n1: number;
  /** Cladding index n₂ ≥ 1. */
  n2: number;
  /** Ellipticity ε = 1 − b/a ∈ [0, 1). */
  ellipticity: number;
}

export interface GeometricBirefringence {
  V: number;
  /** Relative index difference (n₁ − n₂)/n₁. */
  delta: number;
  /** Phase birefringence n_major − n_minor. */
  B: number;
  /** Group birefringence (c × DGD per length). */
  groupB: number;
  /** V above the LP11 cutoff: the fibre is not single-mode. */
  multimode: boolean;
}

/** Sakai–Kimura geometric birefringence; all fields NaN (multimode false) outside the domain. */
export function geometricBirefringence(f: EllipticalCoreFiber, lambda: number): GeometricBirefringence {
  const { a, n1, n2, ellipticity: e } = f;
  const ok = a > 0 && n2 >= 1 && n1 > n2 && e >= 0 && e < 1 && lambda > 0 && Number.isFinite(a * n1 * lambda);
  const V = ok ? ((2 * Math.PI * a) / lambda) * Math.sqrt(n1 * n1 - n2 * n2) : NaN;
  if (!(V >= MIN_V)) return { V, delta: NaN, B: NaN, groupB: NaN, multimode: false };
  const delta = (n1 - n2) / n1;
  const scale = e * n1 * delta * delta;
  return { V, delta, B: scale * geometricG(V), groupB: scale * geometricGroupG(V), multimode: V > LP11_CUTOFF_V };
}

/** Beat length λ/|B|, m; Infinity for B = 0, NaN outside the domain. */
export function beatLength(B: number, lambda: number): number {
  if (!(lambda > 0) || !Number.isFinite(B)) return NaN;
  return B === 0 ? Infinity : lambda / Math.abs(B);
}

/** Differential group delay per length |B_g|/c, s/m. */
export function dgdPerLength(groupB: number): number {
  return Number.isFinite(groupB) ? Math.abs(groupB) / c : NaN;
}

/** Bend birefringence C (d/2R)² of a fibre of cladding diameter d bent to radius R > d/2. */
export function bendBirefringence(d: number, R: number, C = BEND_C_SILICA): number {
  if (!(d > 0 && R > d / 2 && C >= 0) || !Number.isFinite(R)) return NaN;
  return C * (d / (2 * R)) ** 2;
}

/** Retardance 2π² C N d²/(λ D) of N loops of diameter D, rad. */
export function loopRetardance(d: number, D: number, lambda: number, N = 1, C = BEND_C_SILICA): number {
  if (!(d > 0 && D > d && lambda > 0 && N >= 0 && C >= 0) || !Number.isFinite(D * lambda * N)) return NaN;
  return (2 * Math.PI ** 2 * C * N * d * d) / (lambda * D);
}

/** Loop diameter D giving retardance Γ > 0 with N ≥ 1 loops, m (λ/4: Γ = π/2; λ/2: Γ = π). */
export function loopDiameterFor(retardance: number, d: number, lambda: number, N = 1, C = BEND_C_SILICA): number {
  if (!(retardance > 0 && d > 0 && lambda > 0 && N > 0 && C > 0) || !Number.isFinite(retardance * lambda * N)) return NaN;
  return (2 * Math.PI ** 2 * C * N * d * d) / (lambda * retardance);
}

export interface Paddle {
  /** Retardance Γ, rad. */
  retardance: number;
  /** Fast-axis azimuth (the loop plane), rad from x. */
  fastAxis: number;
}

/**
 * Stokes vector after each paddle (index 0 is the input), each a linear retarder from mueller.ts
 * (Goldstein/Collett signs: a λ/4 paddle at +45° turns horizontal light into S3 = +1).
 */
export function paddleStates(input: Stokes, paddles: readonly Paddle[]): Stokes[] {
  const out: Stokes[] = [input];
  for (const p of paddles) out.push(applyMueller(muellerRetarder(p.retardance, p.fastAxis), out[out.length - 1]));
  return out;
}

/** Power ratio Py/Px for an extinction ratio in dB (10^(−ER/10)). */
export const ratioFromDb = (erDb: number) => 10 ** (-erDb / 10);

/** Extinction ratio in dB, −10 log₁₀(Py/Px); Infinity for a ratio of 0. */
export const ratioToDb = (ratio: number) => (ratio >= 0 ? -10 * Math.log10(ratio) : NaN);

/**
 * Output Py/Px after length L with h-parameter h, from input ratio ε₀ ∈ [0, 1]:
 * (1 − r)/(1 + r), r = e^(−2hL)(1 − ε₀)/(1 + ε₀), with 1 − r = 2ε₀/(1 + ε₀) − r₀·expm1(−2hL) (no cancellation).
 */
export function crossPolarizedRatio(eps0: number, h: number, L: number): number {
  if (!(eps0 >= 0 && eps0 <= 1 && h >= 0 && L >= 0) || !Number.isFinite(h * L)) return NaN;
  const r0 = (1 - eps0) / (1 + eps0);
  const x = 2 * h * L;
  const oneMinusR = (2 * eps0) / (1 + eps0) - r0 * Math.expm1(-x);
  return oneMinusR / (2 - oneMinusR);
}

/** Crosstalk of the fibre alone (input ε₀ = 0), tanh(hL), as dB (negative). */
export function fibreCrosstalkDb(h: number, L: number): number {
  if (!(h >= 0 && L >= 0) || !Number.isFinite(h * L)) return NaN;
  return 10 * Math.log10(Math.tanh(h * L));
}

/**
 * Length at which the ratio grows from ε₀ to ε_t (ε₀ < ε_t < 1, h > 0): L = ln(r₀/r_t)/(2h), m.
 * 0 when ε_t ≤ ε₀ (already worse); Infinity for h = 0 (never); NaN outside the domain.
 */
export function lengthToRatio(eps0: number, epsTarget: number, h: number): number {
  if (!(eps0 >= 0 && eps0 <= 1 && epsTarget > 0 && epsTarget < 1 && h >= 0) || !Number.isFinite(h)) return NaN;
  if (epsTarget <= eps0) return 0;
  if (h === 0) return Infinity;
  const lnR = (e: number) => Math.log1p((-2 * e) / (1 + e));
  return (lnR(eps0) - lnR(epsTarget)) / (2 * h);
}
