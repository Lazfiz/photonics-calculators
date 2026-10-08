/**
 * Macrobending loss of the fundamental (LP01) mode of a step-index, weakly guiding fibre bent to a constant
 * radius R. SI units in and out: lengths in m, loss coefficients in 1/m (power, P(z) = P₀ e^(−αz)).
 * Model tier: textbook approximation.
 *
 * Fibre: core radius a, core index n₁, NA = √(n₁² − n₂²) ≪ n₁. At vacuum wavelength λ, k = 2π/λ,
 * V = k·a·NA, and the LP01 eigenvalues U, W (U² + W² = V²) solve U J₁(U)/J₀(U) = W K₁(W)/K₀(W)
 * (Gloge, Appl. Opt. 10, 2252 (1971)). κ = U/a, γ = W/a, β² = (n₁k)² − κ².
 *
 * Marcuse's curvature loss formula for an LP_ν mode (D. Marcuse, J. Opt. Soc. Am. 66, 216 (1976)),
 * with e_ν = 2 for ν = 0, so K_{ν−1}K_{ν+1} = K₁² and
 *   α = √π κ² exp(−2γ³R/(3β²)) / (2 γ^(3/2) V² √R K₁²(W)).
 * In normalized form, with β² ≈ (n₁k)² and Δ = NA²/(2n₁²), this is Snyder & Love's power attenuation
 * coefficient for the fundamental mode of a step profile (Optical Waveguide Theory, 1983, bend-loss chapter):
 *   α = (√π/2a) (a/R)^(1/2) U² / (V² W^(3/2) K₁²(W)) · exp(−(4/3)(R/a) Δ W³/V²).
 * Not included: the elasto-optic correction (silica behaves as if R were ≈ 1.28× larger, so measured loss
 * is lower; Schermer & Cole, IEEE J. Quantum Electron. 43, 899 (2007)), reflections from the
 * cladding/coating boundary (oscillations in R and λ), and the transition loss where a bend starts and
 * ends. Marcuse's formula is asymptotic for R ≫ a.
 *
 * Mode-field radius: Marcuse's Gaussian fit w/a = 0.65 + 1.619 V^(−3/2) + 2.879 V^(−6)
 * (D. Marcuse, Bell Syst. Tech. J. 56, 703 (1977); within ~1 % for 1.2 < V < 2.4).
 */
import { besselJ, besselK } from "../math";

export interface StepIndexFiber {
  /** Core radius a, m, > 0. */
  a: number;
  /** Core refractive index n₁, ≥ 1. */
  n1: number;
  /** Numerical aperture √(n₁² − n₂²), 0 < NA < n₁. */
  NA: number;
}

export interface Lp01Mode {
  V: number;
  /** Core eigenvalue U = a√((n₁k)² − β²). */
  U: number;
  /** Cladding eigenvalue W = a√(β² − (n₂k)²). */
  W: number;
}

/** First zero of J₀: the LP11 cutoff V (single-mode below it). */
export const LP11_CUTOFF_V = 2.404825557695773;

/**
 * Below this V (W < 5e-4 there) the LP01 field spreads far into the cladding, the R ≫ mode-size assumption
 * fails, and W = √(V² − U²) loses precision, so the model returns NaN.
 */
export const MIN_V = 0.5;

const SQRT_PI = Math.sqrt(Math.PI);

const validFiber = ({ a, n1, NA }: StepIndexFiber) =>
  a > 0 && n1 >= 1 && NA > 0 && NA < n1 && Number.isFinite(a * n1 * NA);

/** Normalized frequency V = 2π a NA / λ. NaN outside the domain. */
export function vNumber(f: StepIndexFiber, lambda: number): number {
  return validFiber(f) && lambda > 0 && Number.isFinite(lambda) ? (2 * Math.PI * f.a * f.NA) / lambda : NaN;
}

/** LP11 cutoff wavelength λc = 2π a NA / 2.4048, m. */
export function lp11CutoffWavelength(f: StepIndexFiber): number {
  return validFiber(f) ? (2 * Math.PI * f.a * f.NA) / LP11_CUTOFF_V : NaN;
}

/**
 * LP01 eigenvalues for a given V (MIN_V ≤ V < ∞): the root of
 *   r(U) = U J₁(U) − J₀(U) · W K₁(W)/K₀(W)   (W K₁/K₀ → 0 as W → 0)
 * on [0, min(V, 2.4048)], where r(0) = −V K₁(V)/K₀(V) < 0 and r > 0 at the upper end, with one root.
 * Illinois (modified regula falsi) keeps the bracket; it stops when a step moves U by < 1e-14·U
 * (typically 8–12 evaluations, capped at 100).
 */
export function lp01Mode(V: number): Lp01Mode {
  if (!(V >= MIN_V) || !Number.isFinite(V)) return { V, U: NaN, W: NaN };
  const residual = (u: number) => {
    const w = Math.sqrt(Math.max(V * V - u * u, 0));
    const ratio = w === 0 ? 0 : (w * besselK(1, w)) / besselK(0, w);
    return u * besselJ(1, u) - besselJ(0, u) * ratio;
  };
  let a = 0;
  let fa = residual(a);
  let b = Math.min(V, LP11_CUTOFF_V);
  let fb = residual(b);
  let U = b;
  let side = 0;
  for (let i = 0; i < 100; i++) {
    const next = (a * fb - b * fa) / (fb - fa);
    const done = Math.abs(next - U) <= 1e-14 * next;
    U = next;
    if (done) break;
    const fU = residual(U);
    if (fU === 0) break;
    if (fU * fb > 0) {
      b = U;
      fb = fU;
      if (side === -1) fa /= 2;
      side = -1;
    } else {
      a = U;
      fa = fU;
      if (side === 1) fb /= 2;
      side = 1;
    }
  }
  return { V, U, W: Math.sqrt(V * V - U * U) };
}

/** Mode-field radius (1/e² intensity), m, from Marcuse's 1977 fit. NaN outside the domain. */
export function modeFieldRadius(f: StepIndexFiber, lambda: number): number {
  const V = vNumber(f, lambda);
  if (!(V >= MIN_V)) return NaN;
  return f.a * (0.65 + 1.619 / V ** 1.5 + 2.879 / V ** 6);
}

/**
 * Power bend-loss coefficient α, 1/m, at bend radius R (m). Pass `mode` (from lp01Mode) to reuse the
 * eigenvalue solution across radii. NaN outside the domain; 0 where the exponential underflows.
 */
export function bendLossCoefficient(
  f: StepIndexFiber,
  lambda: number,
  R: number,
  mode: Lp01Mode = lp01Mode(vNumber(f, lambda)),
): number {
  const { V, U, W } = mode;
  if (!(R > 0) || !Number.isFinite(U) || V !== vNumber(f, lambda)) return NaN;
  if (R === Infinity) return 0;
  const k = (2 * Math.PI) / lambda;
  const kappa = U / f.a;
  const gamma = W / f.a;
  const beta2 = (f.n1 * k) ** 2 - kappa ** 2;
  const K1 = besselK(1, W);
  const decay = Math.exp(-(2 * gamma ** 3 * R) / (3 * beta2));
  return (SQRT_PI * kappa ** 2 * decay) / (2 * gamma ** 1.5 * V ** 2 * Math.sqrt(R) * K1 * K1);
}

/** dB per neper of power: 10 log₁₀(e). */
export const DB_PER_NEPER = 10 / Math.LN10;

/** Loss of one full turn (length 2πR), dB. */
export function bendLossPerTurnDb(
  f: StepIndexFiber,
  lambda: number,
  R: number,
  mode: Lp01Mode = lp01Mode(vNumber(f, lambda)),
): number {
  return DB_PER_NEPER * bendLossCoefficient(f, lambda, R, mode) * 2 * Math.PI * R;
}
