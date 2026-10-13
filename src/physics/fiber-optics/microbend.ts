/**
 * Microbending loss of the LP01 mode of a step-index single-mode fibre whose axis is displaced
 * sinusoidally, f(z) = A sin(2πz/Λ). SI units: m in, power loss coefficient α in 1/m (P = P₀ e^(−αz)).
 * Model tier: textbook approximation (first-order coupled-mode theory, cladding radiation continuum).
 *
 * In the local frame of a bent fibre the index is n²(1 + 2x c(z)) with curvature c = f'' (no
 * elasto-optic correction). First-order coupled-mode theory (Marcuse, Theory of Dielectric Optical
 * Waveguides, 2nd ed., 1991, ch. 3 and 5) couples the mode to radiation modes m at the rate
 * da_m/dz = i k n c(z) ⟨m|x|0⟩ e^(−iΔβ_m z). Following Petermann (Electron. Lett. 12, 107 (1976)), the
 * radiation modes are plane waves e^(ik·r)/2π in the cladding (index n = n₂), so Δβ = δ + k_t²/(2kn) with
 *   δ = β − k n₂ = W²/(a²(β + k n₂))   (exact LP01 β),
 * and ⟨k|x|0⟩ = i cos φ H'(k), where H(q) = ∫ψ̂ J₀(qr) r dr is the Hankel transform of the power-normalized
 * mode ψ̂. Summing |a_m|² over the plane-wave continuum for c(z) = C sin(νz), ν = 2π/Λ, C = Aν², gives
 *   α = (π²/2) (k n)³ C² H'(k*)²,   k* = √(2 k n s),   s = ν − δ,
 * and α = 0 for s ≤ 0: in this first-order, infinitely long sinusoid, deformations longer than the critical
 * period Λc = 2π/δ cannot phase-match any radiation mode.
 *
 * Exact LP01 field (ψ = J₀(Uρ) in the core, J₀(U)K₀(Wρ)/K₀(W) outside, ρ = r/a): the Lommel integrals for the
 * core and cladding, with the eigenvalue equation W K₁(W)/K₀(W) = U J₁(U)/J₀(U), sum to
 *   ∫₀^∞ ψ J₀(Qρ) ρ dρ = F(Q) = V² N(Q)/((U² − Q²)(Q² + W²)),   N(Q) = U J₁(U) J₀(Q) − Q J₀(U) J₁(Q),
 * Q = qa, and ∫ψ² dA = π a² J₁²(U) V²/W². Hence
 *   α = (π/2) (k n)³ C² a⁴ W² F'(Q*)² / (J₁²(U) V²),   Q* = a k*.
 * The Gaussian mode ψ ∝ exp(−r²/w²) (Petermann's approximation, w: Marcuse's mode-field radius) gives the
 * closed form α = (π/8) (k n)⁴ w⁶ C² s e^(−k n w² s); it is about 2× low at Λ ≈ Λc/1.3 and far too low at
 * short periods, where the field's tail at r = a dominates. tests/fiber-microbend checks both against
 * quadrature and the Gaussian coupling normalization against Marcuse's small-angle tilt loss (π n w θ/λ)²
 * (Bell Syst. Tech. J. 56, 703 (1977)).
 * Not included: discrete cladding modes (real spectra show resonances near Λc), the coating, random
 * deformation spectra, and the elasto-optic correction.
 */
import { besselJ } from "../math";
import { lp01Mode, modeFieldRadius, vNumber, type Lp01Mode, type StepIndexFiber } from "./macro-bending-loss";
import { claddingIndex } from "./step-index-modes";

/** δ = β − k n₂ of LP01, 1/m. NaN outside the domain. */
export function claddingMismatch(f: StepIndexFiber, lambda: number, mode: Lp01Mode = lp01Mode(vNumber(f, lambda))): number {
  if (!Number.isFinite(mode.U) || mode.V !== vNumber(f, lambda)) return NaN;
  const k = (2 * Math.PI) / lambda;
  const kn2 = k * claddingIndex(f);
  const gamma2 = (mode.W / f.a) ** 2;
  const beta = Math.sqrt(kn2 * kn2 + gamma2);
  return gamma2 / (beta + kn2);
}

/** Critical deformation period Λc = 2π/(β − k n₂), m: the LP01–radiation beat length. */
export function criticalPeriod(f: StepIndexFiber, lambda: number, mode?: Lp01Mode): number {
  return (2 * Math.PI) / claddingMismatch(f, lambda, mode);
}

/**
 * dF/dQ of the LP01 Hankel transform F(Q) = V² N/D (header). N and D both vanish at Q = U; within 1e-4·U of
 * it the slope is interpolated linearly between U(1 ± 1e-4), which keeps ~1e-8 relative accuracy.
 */
export function lp01TransformSlope({ U, W, V }: Lp01Mode, Q: number): number {
  const J0U = besselJ(0, U);
  const UJ1U = U * besselJ(1, U);
  const slope = (q: number) => {
    const J0 = besselJ(0, q);
    const J1 = besselJ(1, q);
    const N = UJ1U * J0 - q * J0U * J1;
    const dN = -UJ1U * J1 - q * J0U * J0;
    const D = (U * U - q * q) * (q * q + W * W);
    const dD = 2 * q * (U * U - W * W - 2 * q * q);
    return (V * V * (dN * D - N * dD)) / (D * D);
  };
  const h = 1e-4 * U;
  if (Math.abs(Q - U) >= h) return slope(Q);
  const lo = slope(U - h);
  const hi = slope(U + h);
  return lo + ((hi - lo) * (Q - (U - h))) / (2 * h);
}

/** Shared domain checks; returns ν, s and k n₂, or a number (0 or NaN) when the loss is already decided. */
function phaseMatch(f: StepIndexFiber, lambda: number, A: number, period: number, mode: Lp01Mode) {
  const delta = claddingMismatch(f, lambda, mode);
  if (!Number.isFinite(delta) || !(A >= 0) || !Number.isFinite(A) || !(period > 0)) return NaN;
  if (period === Infinity || A === 0) return 0;
  const nu = (2 * Math.PI) / period;
  const s = nu - delta;
  if (s <= 0) return 0;
  return { nu, s, kn: ((2 * Math.PI) / lambda) * claddingIndex(f), C: A * nu * nu };
}

/**
 * Power loss coefficient α (1/m) of the exact LP01 mode for a sinusoidal axis displacement of amplitude A (m)
 * and period Λ (m). 0 for Λ ≥ Λc; NaN outside the domain.
 */
export function sinusoidalMicrobendLoss(
  f: StepIndexFiber,
  lambda: number,
  A: number,
  period: number,
  mode: Lp01Mode = lp01Mode(vNumber(f, lambda)),
): number {
  const p = phaseMatch(f, lambda, A, period, mode);
  if (typeof p === "number") return p;
  const { U, W, V } = mode;
  const Q = f.a * Math.sqrt(2 * p.kn * p.s);
  const dF = lp01TransformSlope(mode, Q);
  return ((Math.PI / 2) * p.kn ** 3 * p.C ** 2 * f.a ** 4 * W * W * dF * dF) / (besselJ(1, U) ** 2 * V * V);
}

/** The same loss with Petermann's Gaussian mode of radius w = Marcuse's fit: (π/8)(kn)⁴ w⁶ C² s e^(−kn w² s). */
export function gaussianMicrobendLoss(
  f: StepIndexFiber,
  lambda: number,
  A: number,
  period: number,
  mode: Lp01Mode = lp01Mode(vNumber(f, lambda)),
): number {
  const w = modeFieldRadius(f, lambda);
  if (!Number.isFinite(w)) return NaN;
  const p = phaseMatch(f, lambda, A, period, mode);
  if (typeof p === "number") return p;
  return (Math.PI / 8) * p.kn ** 4 * w ** 6 * p.C ** 2 * p.s * Math.exp(-p.kn * w * w * p.s);
}

/**
 * Fraction of power a single tilt of the steepest slope Aν would shed, (k n₂ w A ν/2)² (Marcuse 1977,
 * small-angle). First-order theory needs it ≪ 1; NaN outside the domain.
 */
export function peakTiltLoss(f: StepIndexFiber, lambda: number, A: number, period: number): number {
  const w = modeFieldRadius(f, lambda);
  if (!Number.isFinite(w) || !(A >= 0) || !(period > 0)) return NaN;
  const kn = ((2 * Math.PI) / lambda) * claddingIndex(f);
  return ((kn * w * A * 2 * Math.PI) / period / 2) ** 2;
}
