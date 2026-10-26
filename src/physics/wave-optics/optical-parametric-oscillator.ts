/**
 * Optical parametric amplification and the threshold of a singly resonant OPO (SRO). SI units in and out.
 * Model tier: textbook approximation: plane waves of intensity I = P/(πw²), perfect phase matching, no
 * pump depletion, walk-off handled only by capping the length at the aperture length.
 *
 * Energy conservation: ω_p = ω_s + ω_i, so λ_i = λ_p λ_s/(λ_s − λ_p).
 * Gain coefficient (R. W. Boyd, Nonlinear Optics, 3rd ed., §2.8, in SI with I = 2nε₀c|A|²):
 *   g² = 2 ω_s ω_i d_eff² I_p / (n_p n_s n_i ε₀ c³);  with no idler input, A_s(L) = A_s(0) cosh(gL).
 * SRO threshold (Boyd §2.9 with the idler not fed back): a signal round trip with power loss α is
 * balanced when cosh²(gL) (1 − α) = 1, i.e. g_th L = arccosh(1/√(1 − α)) ≈ √α for small α. Hence
 *   I_th = arccosh²(1/√(1 − α)) · n_p n_s n_i ε₀ c³ / (2 ω_s ω_i d_eff² L²).
 * Walk-off aperture length l_a = √π w/ρ (G. D. Boyd & D. A. Kleinman, J. Appl. Phys. 39, 3597 (1968)).
 * Phase mismatch Δk = 2π(n_p/λ_p − n_s/λ_s − n_i/λ_i); first-order QPM period Λ = 2π/Δk.
 *
 * BBO type I cut (e-pump → o-signal + o-idler, negative uniaxial; Boyd §2.3): Δk = 0 needs
 *   n_e(θ, λ_p) = λ_p (n_o(λ_s)/λ_s + n_o(λ_i)/λ_i),  1/n_e(θ)² = cos²θ/n_o² + sin²θ/n_e²,
 * solved for θ as in type I SHG. Indices from the Tamošauskas 2018 fits (0.188–5.2 µm, `BBO_TAMOSAUSKAS`); the pump
 * walks off by tan ρ = (n_e(θ)²/2)(n_e⁻² − n_o⁻²) sin 2θ; d_eff = d₃₁ sinθ + d₂₂ cosθ (|sin 3φ| = 1, terms adding, as in
 * `nonlinear-crystals.ts`; EKSMA d₂₂ 2.2, d₃₁ 0.08 pm/V at 1064 nm, no Miller scaling).
 */
import { c, epsilon_0 } from "../constants";
import { BBO_D, typeIPhaseMatchingAngle, uniaxialWalkOff } from "../materials/nonlinear-crystals";
import { inRange, refractiveIndex } from "../materials/sellmeier";
import { BBO_TAMOSAUSKAS } from "../materials/uniaxial-data";

export interface ParametricProcess {
  /** Pump and signal vacuum wavelengths, m, with λ_p < λ_s. */
  lambdaPump: number;
  lambdaSignal: number;
  /** Effective nonlinear coefficient, m/V. */
  dEff: number;
  /** Refractive indices at the three wavelengths (for their polarizations). */
  nPump: number;
  nSignal: number;
  nIdler: number;
}

const validProcess = (p: ParametricProcess) =>
  p.lambdaPump > 0 && p.lambdaSignal > p.lambdaPump && Number.isFinite(p.lambdaSignal) &&
  p.dEff > 0 && p.nPump >= 1 && p.nSignal >= 1 && p.nIdler >= 1 &&
  Number.isFinite(p.dEff * p.nPump * p.nSignal * p.nIdler);

/** Idler wavelength λ_p λ_s/(λ_s − λ_p), m. NaN unless λ_s > λ_p. */
export function idlerWavelength(lambdaPump: number, lambdaSignal: number): number {
  return lambdaPump > 0 && lambdaSignal > lambdaPump && Number.isFinite(lambdaSignal)
    ? (lambdaPump * lambdaSignal) / (lambdaSignal - lambdaPump)
    : NaN;
}

/** 2 ω_s ω_i d_eff² / (n_p n_s n_i ε₀ c³), so that g² = this × I_p. Units m/W. */
function gainPerIntensity(p: ParametricProcess): number {
  const omegaS = (2 * Math.PI * c) / p.lambdaSignal;
  const omegaI = (2 * Math.PI * c) / idlerWavelength(p.lambdaPump, p.lambdaSignal);
  return (2 * omegaS * omegaI * p.dEff ** 2) / (p.nPump * p.nSignal * p.nIdler * epsilon_0 * c ** 3);
}

/** Parametric gain coefficient g, 1/m, at pump intensity I (W/m²). NaN outside the domain. */
export function parametricGainCoefficient(p: ParametricProcess, intensity: number): number {
  if (!validProcess(p) || !(intensity >= 0) || !Number.isFinite(intensity)) return NaN;
  return Math.sqrt(gainPerIntensity(p) * intensity);
}

/** Walk-off aperture length √π w/ρ, m (Infinity for ρ = 0). w = beam radius (m), ρ = walk-off angle (rad). */
export function walkOffApertureLength(w: number, rho: number): number {
  if (!(w > 0) || !(rho >= 0)) return NaN;
  return rho === 0 ? Infinity : (Math.sqrt(Math.PI) * w) / rho;
}

/** g_th L for an SRO with round-trip signal power loss α (0 < α < 1): arccosh(1/√(1 − α)). */
export function sroThresholdGainLength(loss: number): number {
  return loss > 0 && loss < 1 ? Math.acosh(1 / Math.sqrt(1 - loss)) : NaN;
}

/** SRO threshold pump intensity, W/m², for an interaction length L (m) and round-trip signal loss α. */
export function sroThresholdIntensity(p: ParametricProcess, L: number, loss: number): number {
  if (!validProcess(p) || !(L > 0) || !Number.isFinite(L)) return NaN;
  return (sroThresholdGainLength(loss) / L) ** 2 / gainPerIntensity(p);
}

/**
 * Phase mismatch Δk = k₃ − k₁ − k₂ = 2π(n₃/λ₃ − n₁/λ₁ − n₂/λ₂) of three-wave mixing ω₃ = ω₁ + ω₂ (vacuum wavelengths,
 * m; Boyd, Nonlinear Optics, 3rd ed., §2.2), 1/m. SFG: wave 3 is the sum; DFG/OPA: wave 3 is the pump. NaN unless every
 * λ and n is positive and finite.
 */
export function threeWaveMismatch(n1: number, lambda1: number, n2: number, lambda2: number, n3: number, lambda3: number): number {
  const ok = [n1, lambda1, n2, lambda2, n3, lambda3].every((x) => x > 0 && Number.isFinite(x));
  return ok ? 2 * Math.PI * (n3 / lambda3 - n1 / lambda1 - n2 / lambda2) : NaN;
}

/** First-order quasi-phase-matching period Λ = 2π/|Δk|, m (Boyd §2.4); Infinity at Δk = 0 (already phase matched). */
export function qpmPeriod(deltaK: number): number {
  return Number.isFinite(deltaK) ? (2 * Math.PI) / Math.abs(deltaK) : NaN;
}

/** Phase mismatch Δk = k_p − k_s − k_i, 1/m. */
export function phaseMismatch(p: ParametricProcess): number {
  if (!validProcess(p)) return NaN;
  const lambdaI = idlerWavelength(p.lambdaPump, p.lambdaSignal);
  return threeWaveMismatch(p.nSignal, p.lambdaSignal, p.nIdler, lambdaI, p.nPump, p.lambdaPump);
}

export interface CrystalCut {
  /** Phase-matching angle θ from the optic axis, rad. */
  theta: number;
  nPump: number;
  nSignal: number;
  nIdler: number;
  /** Pump walk-off angle ρ, rad. */
  walkOff: number;
  /** Effective nonlinear coefficient, m/V. */
  dEff: number;
}

const NO_CUT: CrystalCut = { theta: NaN, nPump: NaN, nSignal: NaN, nIdler: NaN, walkOff: NaN, dEff: NaN };

/** Type I (e → o + o) BBO cut phase-matching λ_p → λ_s + λ_i. All fields NaN outside 0.188–5.2 µm or if no θ phase-matches. */
export function bboTypeICut(lambdaPump: number, lambdaSignal: number): CrystalCut {
  const lambdaIdler = idlerWavelength(lambdaPump, lambdaSignal);
  const { o, e } = BBO_TAMOSAUSKAS;
  if (![lambdaPump, lambdaSignal, lambdaIdler].every((l) => inRange(o, l) && inRange(e, l))) return NO_CUT;
  const nSignal = refractiveIndex(o, lambdaSignal);
  const nIdler = refractiveIndex(o, lambdaIdler);
  const noP = refractiveIndex(o, lambdaPump);
  const neP = refractiveIndex(e, lambdaPump);
  const target = lambdaPump * (nSignal / lambdaSignal + nIdler / lambdaIdler);
  const theta = typeIPhaseMatchingAngle(target, noP, neP);
  if (!Number.isFinite(theta)) return NO_CUT;
  return {
    theta, nPump: target, nSignal, nIdler,
    walkOff: Math.abs(uniaxialWalkOff(noP, neP, theta)),
    dEff: (BBO_D.d31 * Math.sin(theta) + BBO_D.d22 * Math.cos(theta)) * 1e-12,
  };
}
