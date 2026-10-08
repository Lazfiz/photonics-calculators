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
 */
import { c, epsilon_0 } from "../constants";

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

/** Phase mismatch Δk = k_p − k_s − k_i, 1/m. */
export function phaseMismatch(p: ParametricProcess): number {
  if (!validProcess(p)) return NaN;
  const lambdaI = idlerWavelength(p.lambdaPump, p.lambdaSignal);
  return 2 * Math.PI * (p.nPump / p.lambdaPump - p.nSignal / p.lambdaSignal - p.nIdler / lambdaI);
}
