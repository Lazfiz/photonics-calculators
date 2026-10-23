/**
 * Evanescent coupling between weakly guiding step-index fibre cores, and the LP01 tail beyond a polished
 * plane. SI units (m, rad/m). Builds on the exact LP01 mode (macro-bending-loss.ts, step-index-modes.ts).
 * Model tier: coupled-mode theory (textbook approximation; weak coupling, identical cores).
 *
 * Coupling coefficient of two identical cores, centre spacing D (Snyder, J. Opt. Soc. Am. 62, 1267 (1972);
 * Snyder & Love, Optical Waveguide Theory (1983)):
 *   κ = (√(2Δ)/a) · (U²/V³) · K₀(W D/a) / K₁²(W),   √(2Δ) = NA/n₁.
 * It is the overlap ∫_core1 ψ₁ψ₂ dA (exact via Graf's addition theorem for K₀) with β ≈ k n₁, so it holds for
 * any D ≥ 2a; coupled-mode theory itself needs weak coupling (κ ≪ β, cores a few radii apart).
 *
 * Inter-core crosstalk in a long multi-core fibre (MCF): random bends and twists make the phase mismatch
 * Δβ_eq(z) = Δβ + (βΛ/R_b) cos θ(z) between cores at pitch Λ. With an exponential autocorrelation of the phase
 * fluctuation (correlation length d) and θ uniform (twisted fibre), the average power-coupling coefficient is
 *   h̄ = (1/2π)∫ 2κ²d / (1 + d²(Δβ + B cos θ)²) dθ = 2κ²d · Re[1/√((1 + i dΔβ)² + (dB)²)],   B = βΛ/R_b
 * (Koshiba et al., IEEE Photonics J. 4, 1987 (2012), doi 10.1109/JPHOT.2012.2221085; the closed form follows
 * from (1/2π)∫dθ/(p + q cos θ) = 1/√(p² − q²)). For Δβ = 0 and dB ≫ 1 it reduces to Hayashi's
 * h = 2κ²R_b/(βΛ) (Opt. Express 19, 16576 (2011)), independent of d as long as d ≫ R_b/(βΛ); for |Δβ| > B (heterogeneous cores bent less
 * than the critical radius R_pk = βΛ/|Δβ|) phase matching never occurs and h̄ drops by orders of magnitude.
 * Pair crosstalk after length L: XT = tanh(h̄L) (coupled-power equations, two cores; Hayashi 2011 eq. 3).
 *
 * Evanescent field beyond a plane at x = ρ₀a (side-polished or D-shaped fibre, ρ₀ ≥ 1): the cladding field is
 * ψ = J₀(U) K₀(Wρ)/K₀(W), and the fraction of LP01 power with x > ρ₀a is
 *   η = ∫_{ρ₀}^∞ ψ²(ρ) · 2 arccos(ρ₀/ρ) ρ dρ / (π J₁²(U) V²/W²)
 * (denominator: ∫ψ² dA/a², Gloge, Appl. Opt. 10, 2252 (1971)). Numerical integral, see lp01PowerBeyondPlane.
 */
import { abs as cabs, complex, realPart, sqrt as csqrt, div as cdiv } from "../complex";
import { besselJ, besselKScaled, integrateSimpson as simpson } from "../math";
import { lp01Mode, vNumber, type Lp01Mode, type StepIndexFiber } from "./macro-bending-loss";
import { lp01Field } from "./step-index-modes";

/**
 * Snyder's coupling coefficient κ (1/m) between two identical step-index cores whose centres are D apart.
 * NaN outside the domain (D < 2a: the cores overlap; V below MIN_V).
 */
export function couplingCoefficient(f: StepIndexFiber, lambda: number, D: number, mode?: Lp01Mode): number {
  const V = vNumber(f, lambda);
  const m = mode ?? lp01Mode(V);
  if (!Number.isFinite(m.U) || m.V !== V || !(D >= 2 * f.a) || !Number.isFinite(D)) return NaN;
  const { U, W } = m;
  const x = (W * D) / f.a;
  // K₀(x)/K₁²(W) = e^(2W − x) · scaled ratio; 2W − x ≤ 0 since D ≥ 2a, so it underflows to 0, never to 0/0.
  const ratio = (besselKScaled(0, x) / besselKScaled(1, W) ** 2) * Math.exp(2 * W - x);
  return (f.NA / f.n1 / f.a) * ((U * U) / V ** 3) * ratio;
}

/**
 * Bend-and-twist averaged power-coupling coefficient h̄ (1/m) between two cores (Koshiba et al. 2012, exponential
 * autocorrelation): 2κ²d Re[1/√((1 + i dΔβ)² + (dB)²)], B = βΛ/R_b. Δβ = β_m − β_n (rad/m); the sign does not matter.
 */
export function averagePowerCoupling(p: {
  kappa: number;
  beta: number;
  pitch: number;
  bendRadius: number;
  correlationLength: number;
  deltaBeta: number;
}): number {
  const { kappa, beta, pitch, bendRadius: R, correlationLength: d, deltaBeta } = p;
  if (!(kappa >= 0 && beta > 0 && pitch > 0 && R > 0 && d > 0) || !Number.isFinite(deltaBeta)) return NaN;
  const dB = (d * beta * pitch) / R;
  const db = d * deltaBeta;
  // (1 + i db)² + dB² = (1 − db² + dB²) + 2i db. Scale by s = max(1, |db|, dB) before squaring to avoid overflow.
  const s = Math.max(1, Math.abs(db), dB);
  const z = complex((1 / s) ** 2 - (db / s) ** 2 + (dB / s) ** 2, (2 * db) / s ** 2);
  const root = csqrt(z); // principal root, Re ≥ 0 since Re[1/√…] must be positive
  if (cabs(root) === 0) return NaN;
  return (2 * kappa * kappa * d * realPart(cdiv(complex(1), root))) / s;
}

/**
 * Hayashi's homogeneous-MCF limit h = 2κ²R_b/(βΛ) (Δβ = 0, correlation length ≫ R_b/(βΛ)). R_b is the physical
 * radius of the equivalent-index model n(1 + r cosθ/R_b) (Hayashi et al., Opt. Express 19, 16576, 2011, eq. 2), with
 * no elasto-optic factor; R_eq = R_b/(1 − (n²/2)[p₁₂ − ν(p₁₁ + p₁₂)]) ≈ 1.27 R_b for silica (Nagano, Kawakami and
 * Nishida, Appl. Opt. 17, 2080, 1978) would raise h by that factor.
 */
export function hayashiPowerCoupling(kappa: number, beta: number, pitch: number, bendRadius: number): number {
  return beta > 0 && pitch > 0 && bendRadius > 0 ? (2 * kappa * kappa * bendRadius) / (beta * pitch) : NaN;
}

/** Critical bend radius R_pk = βΛ/|Δβ| (m): bent tighter than this, heterogeneous cores pass through phase matching. */
export function criticalBendRadius(beta: number, pitch: number, deltaBeta: number): number {
  return beta > 0 && pitch > 0 ? (beta * pitch) / Math.abs(deltaBeta) : NaN;
}

/** Pair crosstalk XT = tanh(hL) (linear power ratio) from the coupled-power equations. */
export function pairCrosstalk(h: number, L: number): number {
  return h >= 0 && L >= 0 ? Math.tanh(h * L) : NaN;
}

/**
 * Lossless co-directional coupling of two modes with coupling κ and mismatch Δβ = β₁ − β₂ (1/m), light launched into
 * guide 1 (A. Yariv, IEEE J. Quantum Electron. 9, 919 (1973), doi:10.1109/JQE.1973.1077767):
 *   P₂(z)/P₁(0) = (κ²/ψ²) sin²(ψz),   ψ = √(κ² + (Δβ/2)²).
 * The transfer peaks at κ²/ψ² after z = π/(2ψ); full transfer needs Δβ = 0.
 */
export function codirectionalPsi(kappa: number, deltaBeta: number): number {
  return Math.hypot(kappa, deltaBeta / 2);
}

/** Fraction of the launched power in the second guide after length z. */
export function codirectionalTransfer(kappa: number, deltaBeta: number, z: number): number {
  if (!(Number.isFinite(kappa) && Number.isFinite(deltaBeta) && z >= 0)) return NaN;
  const psi = codirectionalPsi(kappa, deltaBeta);
  if (psi === 0) return 0;
  return ((kappa * kappa) / (psi * psi)) * Math.sin(psi * z) ** 2;
}

/** Peak transfer κ²/ψ² and the length π/(2ψ) at which it is first reached (Infinity when κ = Δβ = 0). */
export function codirectionalPeak(kappa: number, deltaBeta: number): { fraction: number; length: number } {
  const psi = codirectionalPsi(kappa, deltaBeta);
  return psi === 0 ? { fraction: 0, length: Infinity } : { fraction: (kappa * kappa) / (psi * psi), length: Math.PI / (2 * psi) };
}

/**
 * Simpson panels for the tail integrals. The integrands are smooth and decay like Gaussians, so the rule converges
 * spectrally: 100 panels agree with 3,200 to 3e-11 down to V = 0.83 (W = 0.08) and to 1e-15 at V ≈ 2.
 */
const TAIL_PANELS = 100;

/**
 * Fraction η of LP01 power beyond the plane x = ρ₀a (ρ₀ = distance from the core centre / a, ≥ 1).
 * Substituting ρ = ρ₀ + s² removes the √ edge of arccos(ρ₀/ρ); the integral stops where ψ² has fallen by e⁻⁴²
 * (s² = 21/W). NaN for ρ₀ < 1 (the plane cuts the core, where the unperturbed mode no longer applies).
 */
export function lp01PowerBeyondPlane(mode: Lp01Mode, rho0: number): number {
  const { U, V, W } = mode;
  if (!Number.isFinite(U) || !(W > 0) || !(rho0 >= 1) || !Number.isFinite(rho0)) return NaN;
  const total = (Math.PI * (besselJ(1, U) * V) ** 2) / (W * W);
  const sMax = Math.sqrt(21 / W);
  const g = (s: number) => {
    const rho = rho0 + s * s;
    const psi = lp01Field(mode, rho);
    return psi * psi * 2 * Math.acos(rho0 / rho) * rho * 2 * s;
  };
  return simpson(g, 0, sMax, TAIL_PANELS) / total;
}

/** LP01 intensity at distance ρa from the core centre relative to the core boundary: [K₀(Wρ)/K₀(W)]², ρ ≥ 1. */
export function evanescentIntensityRatio(mode: Lp01Mode, rho: number): number {
  if (!(rho >= 1) || !Number.isFinite(mode.U)) return NaN;
  const r = lp01Field(mode, rho) / besselJ(0, mode.U);
  return r * r;
}

/**
 * Accumulated coupling Φ = ∫κ(z) dz of two identical fibres bent on blocks of radius R and polished to a
 * minimum core spacing D₀ (Digonnet & Shaw, IEEE J. Quantum Electron. 18, 746 (1982)): the spacing grows as
 * D(z) = D₀ + z²/R. Coupled power is sin²Φ. Numerical integral over z ∈ [0, z_max], z_max where the
 * K₀ ratio has fallen by e⁻⁴⁰ (W z²/(aR) = 40). For W D₀/a ≫ 1, Φ → κ₀ √(π a R / W) (their effective length).
 */
export function polishedCouplerPhase(f: StepIndexFiber, lambda: number, D0: number, R: number, mode?: Lp01Mode): number {
  const V = vNumber(f, lambda);
  const m = mode ?? lp01Mode(V);
  if (!(R > 0) || !Number.isFinite(R)) return NaN;
  const kappa0 = couplingCoefficient(f, lambda, D0, m);
  if (!Number.isFinite(kappa0)) return NaN;
  const zMax = Math.sqrt((40 * f.a * R) / m.W);
  const g = (t: number) => {
    // κ(z) is smooth and even in z: integrate z ∈ [0, zMax] and double.
    return couplingCoefficient(f, lambda, D0 + (t * t) / R, m);
  };
  return 2 * simpson(g, 0, zMax, TAIL_PANELS);
}
