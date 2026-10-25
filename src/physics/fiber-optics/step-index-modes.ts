/**
 * Mode properties of a weakly guiding step-index fibre beyond V: LP01 field, Petermann II spot size,
 * normalized propagation constant, effective index, core confinement and the exact LP mode count.
 * SI units (m). Builds on the LP01 eigenvalue solver in macro-bending-loss.ts. Model tier: exact within
 * the weak-guidance (LP) approximation (Gloge, Appl. Opt. 10, 2252 (1971)).
 *
 * LP01 field, ρ = r/a: ψ = J₀(Uρ) for ρ ≤ 1 and J₀(U) K₀(Wρ)/K₀(W) for ρ > 1.
 * With x = J₁(U)/J₀(U) and the eigenvalue equation U x = W K₁(W)/K₀(W), the standard Bessel integrals give
 *   ∫ψ² ρ dρ (core) = (J₀² + J₁²)/2,   ∫ψ² ρ dρ (all) = J₀² x² V²/(2W²),   ∫ψ'² ρ dρ (all) = J₀² V²/2.
 * Hence the core power fraction Γ = (W²/V²)(1 + J₀²/J₁²) (Gloge 1971) and the Petermann II spot size
 * w² = 2∫ψ²r dr / ∫ψ'²r dr = 2a² x²/W², i.e. w_PII = √2 a J₁(U)/(W J₀(U)) = √2 a K₁(W)/(U K₀(W)).
 * Petermann II is the MFD that ITU-T G.650.1 defines (far-field second moment); Marcuse's Gaussian fit
 * (modeFieldRadius) is the best-fit Gaussian of the near field, ~1–2 % larger near V = 2.
 *
 * Mode count: LP_lm is guided for V above its cutoff, the m-th zero of J_{l−1} (l ≥ 1), or the (m−1)-th
 * zero of J₁ for l = 0 (LP01 has no cutoff). Each LP_0m counts 2 modes (polarizations) and each LP_lm,
 * l ≥ 1, counts 4 (polarizations × cos/sin). For V ≫ 1 the total approaches V²/2 (Gloge 1971).
 */
import { besselJ, besselKScaled } from "../math";
import { lp01Mode, vNumber, type Lp01Mode, type StepIndexFiber } from "./macro-bending-loss";

const modeFor = (f: StepIndexFiber, lambda: number, mode?: Lp01Mode) => {
  const m = mode ?? lp01Mode(vNumber(f, lambda));
  return Number.isFinite(m.U) && m.V === vNumber(f, lambda) ? m : null;
};

/** Petermann II mode-field radius of the exact step-index LP01 mode, m. NaN outside the domain. */
export function petermannIIRadius(f: StepIndexFiber, lambda: number, mode?: Lp01Mode): number {
  const m = modeFor(f, lambda, mode);
  if (!m) return NaN;
  return (Math.SQRT2 * f.a * besselKScaled(1, m.W)) / (m.U * besselKScaled(0, m.W));
}

/** LP01 field ψ(ρ), ρ = r/a ≥ 0, normalized to ψ(0) = 1. Intensity is ψ². */
export function lp01Field({ U, W }: Lp01Mode, rho: number): number {
  const r = Math.abs(rho);
  if (r <= 1) return besselJ(0, U * r);
  // K₀(Wr)/K₀(W) in scaled form: finite for large W, where K₀ itself underflows.
  return (besselJ(0, U) * besselKScaled(0, W * r) * Math.exp(-W * (r - 1))) / besselKScaled(0, W);
}

/** Normalized propagation constant b = W²/V² = (n_eff² − n₂²)/(n₁² − n₂²). */
export function normalizedB({ V, W }: Lp01Mode): number {
  return (W * W) / (V * V);
}

/** Numerical aperture NA = √(n₁² − n₂²) of a step-index guide (Saleh & Teich eq. 9.1-4). NaN unless n₁ ≥ n₂ > 0. */
export function numericalAperture(n1: number, n2: number): number {
  // (n₁ − n₂)(n₁ + n₂): no cancellation when n₁ ≈ n₂.
  return n2 > 0 && n1 >= n2 ? Math.sqrt((n1 - n2) * (n1 + n2)) : NaN;
}

/** Cladding index n₂ = √(n₁² − NA²). */
export function claddingIndex({ n1, NA }: StepIndexFiber): number {
  return Math.sqrt(n1 * n1 - NA * NA);
}

/** Core index n₁ = √(n₂² + NA²) from the cladding index and NA. NaN unless n₂ > 0 and NA ≥ 0. */
export function coreIndexFromNA(n2: number, NA: number): number {
  return n2 > 0 && NA >= 0 ? Math.sqrt(n2 * n2 + NA * NA) : NaN;
}

/** Relative index difference Δ = (n₁² − n₂²)/(2n₁²) = NA²/(2n₁²) (Gloge 1971); ≈ (n₁ − n₂)/n₁ for weak guidance. */
export function relativeIndexDifference({ n1, NA }: StepIndexFiber): number {
  return n1 > 0 ? (NA * NA) / (2 * n1 * n1) : NaN;
}

/** Effective (phase) index of LP01: n_eff² = n₂² + b NA². NaN outside the domain. */
export function effectiveIndex(f: StepIndexFiber, lambda: number, mode?: Lp01Mode): number {
  const m = modeFor(f, lambda, mode);
  if (!m) return NaN;
  return Math.sqrt(claddingIndex(f) ** 2 + normalizedB(m) * f.NA ** 2);
}

/** Fraction of LP01 power in the core, Γ = (W²/V²)(1 + J₀²(U)/J₁²(U)) (Gloge 1971). */
export function coreConfinement(mode: Lp01Mode): number {
  const { U, W, V } = mode;
  if (!Number.isFinite(U)) return NaN;
  return ((W * W) / (V * V)) * (1 + (besselJ(0, U) / besselJ(1, U)) ** 2);
}

/** Root of f in a sign-changing bracket [a, b] by the Illinois method, to 1e-13 relative (≤ 100 steps). */
function illinois(f: (x: number) => number, a: number, fa: number, b: number, fb: number): number {
  let x = b;
  let side = 0;
  for (let i = 0; i < 100; i++) {
    const next = (a * fb - b * fa) / (fb - fa);
    const done = Math.abs(next - x) <= 1e-13 * Math.abs(next);
    x = next;
    if (done) break;
    const fx = f(x);
    if (fx === 0) break;
    if (fx * fb > 0) {
      b = x;
      fb = fx;
      if (side === -1) fa /= 2;
      side = -1;
    } else {
      a = x;
      fa = fx;
      if (side === 1) fb /= 2;
      side = 1;
    }
  }
  return x;
}

/**
 * Positive zeros of J_n below xMax, ascending. They are > n and more than 3 apart (the spacing tends to π),
 * so a unit-step scan from x = n brackets each one; the Illinois method refines it.
 */
export function besselJZeros(n: number, xMax: number): number[] {
  const zeros: number[] = [];
  const step = 1;
  let x0 = n;
  let f0 = besselJ(n, x0);
  while (x0 < xMax) {
    const x1 = Math.min(x0 + step, xMax);
    const f1 = besselJ(n, x1);
    if (f0 === 0 && x0 > 0) zeros.push(x0);
    else if (f0 * f1 < 0) {
      const z = illinois((x) => besselJ(n, x), x0, f0, x1, f1);
      if (z < xMax) zeros.push(z);
    }
    x0 = x1;
    f0 = f1;
  }
  return zeros;
}

export interface LpMode {
  l: number;
  m: number;
  /** Cutoff V. */
  cutoff: number;
}

/** Largest V for which the exact LP mode list is computed (about 800 modes). */
export const MAX_EXACT_MODE_V = 40;

/** Guided LP modes at V (0 < V ≤ MAX_EXACT_MODE_V), sorted by cutoff. Empty array outside the domain. */
export function guidedLpModes(V: number): LpMode[] {
  if (!(V > 0 && V <= MAX_EXACT_MODE_V)) return [];
  const modes: LpMode[] = [{ l: 0, m: 1, cutoff: 0 }];
  besselJZeros(1, V).forEach((z, i) => modes.push({ l: 0, m: i + 2, cutoff: z }));
  for (let l = 1; l - 1 < V; l++) {
    const zeros = besselJZeros(l - 1, V);
    if (zeros.length === 0) break;
    zeros.forEach((z, i) => modes.push({ l, m: i + 1, cutoff: z }));
  }
  return modes.sort((p, q) => p.cutoff - q.cutoff);
}

/** Modes in an LP list counting polarization and orientation (2 per LP_0m, 4 per LP_lm, l ≥ 1); NaN if empty. */
export function countModes(modes: readonly LpMode[]): number {
  return modes.length === 0 ? NaN : modes.reduce((n, { l }) => n + (l === 0 ? 2 : 4), 0);
}

/** Total guided modes at V (0 < V ≤ MAX_EXACT_MODE_V); NaN outside the domain. */
export function guidedModeCount(V: number): number {
  return countModes(guidedLpModes(V));
}

/** Large-V estimate of the total mode count, V²/2 (Gloge 1971). */
export function asymptoticModeCount(V: number): number {
  return V > 0 && Number.isFinite(V) ? (V * V) / 2 : NaN;
}
