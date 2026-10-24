/**
 * Three-wave mixing in a χ⁽²⁾ crystal: sum- and difference-frequency generation and optical parametric
 * amplification (OPA). Plane waves, no absorption, no walk-off, undepleted pump. SI units in and out. Model tier:
 * textbook approximation.
 *
 * Low conversion (R. W. Boyd, Nonlinear Optics, 3rd ed., §2.2 coupled-amplitude equations, with I = 2nε₀c|A|²). Two
 * undepleted inputs generate a weak wave at ω_g = ω₁ + ω₂ (SFG) or ω_g = ω_p − ω_s (DFG, idler):
 *   I_g = η I₁ I₂,  η = 8π² d_eff² L² sinc²(ΔkL/2) / (ε₀ c n₁ n₂ n_g λ_g²),
 * Δk the residual phase mismatch. The DFG equation dA_i/dz ∝ A_p A_s* has the same prefactor with ω_i, so one law
 * covers both. Gaussian beams of 1/e² radii w₁, w₂ in a crystal short next to their confocal parameters 2πnw²/λ:
 * ∫I₁I₂ dA = 2P₁P₂/(π(w₁² + w₂²)), so P_g = η·2P₁P₂/(π(w₁² + w₂²)) (`sfgCoefficient` in
 * imaging/second-harmonic-generation.ts is the same law with n₁ = n₂). A longer crystal or a tighter focus needs the
 * Boyd–Kleinman focusing function (J. Appl. Phys. 39, 3597 (1968)); the plane-wave value then overestimates P_g.
 *
 * Parametric amplification (Boyd §2.8), undepleted pump, signal seed, no idler input:
 *   G = P_s(L)/P_s(0) = 1 + (Γ/g)² sinh²(gL),  g² = Γ² − (Δk/2)²,  Γ² = 2ω_sω_i d_eff² I_p/(n_p n_s n_i ε₀ c³),
 * with sinh(gL)/g → sin(|g|L)/|g| when (Δk/2)² > Γ² (Γ from `parametricGainCoefficient`). Each signal photon gained
 * comes with an idler photon: P_i = (λ_s/λ_i)(G − 1)P_s. At low gain G − 1 → Γ²L² sinc²(ΔkL/2), which is the DFG law.
 *
 * Gain bandwidth: with group-velocity mismatch δ_si = 1/v_gs − 1/v_gi, a signal detuned by Δν (idler by −Δν) sees
 * Δk = Δk₀ − 2πΔν δ_si, so the gain spectrum is G(Δk) shifted to Δk = 0. Its FWHM (of G − 1) tends to 0.886/(|δ_si|L)
 * at low gain (the sinc² width) and (2√ln2/π)√(Γ/L)/|δ_si| at high gain (G. Cerullo, S. De Silvestri, Rev. Sci.
 * Instrum. 74, 1 (2003), doi:10.1063/1.1523642). δ_si = 0 (degenerate type I) leaves only group-velocity dispersion,
 * which this first-order model omits.
 */
import { epsilon_0, c } from "../constants";
import { sumFrequencyWavelength } from "../imaging/second-harmonic-generation";
import { idlerWavelength } from "./optical-parametric-oscillator";

export { sumFrequencyWavelength, idlerWavelength };

/**
 * d₃₃ of congruent LiNbO₃ for SHG of 1.313 µm, 19.5 pm/V (I. Shoji et al., J. Opt. Soc. Am. B 14, 2268 (1997),
 * doi:10.1364/JOSAB.14.002268, Tables 6 and 10; 25.2 pm/V at 1.064 µm, 25.7 at 0.852 µm). It is the longest fundamental
 * they measured, the closest to 1064 + 1550 nm mixing. Their Miller Δ₃₃ changes from 4.73 to 3.92 × 10⁻¹³ m/V between
 * 1.064 and 1.313 µm, so it isn't scaled further; at the longer DFG idler d₃₃ is likely lower still.
 */
export const LINBO3_D33_1313 = 19.5e-12;

/** First-order quasi-phase-matching d_eff = 2d₃₃/π (50 % duty cycle), m/V. */
export function qpmDeff(d33: number): number {
  return (2 * d33) / Math.PI;
}

export interface MixingInput {
  /** Vacuum wavelength of the generated wave (λ₃ for SFG, λ_i for DFG), m. */
  lambdaOut: number;
  /** Crystal length, m. */
  length: number;
  /** Effective nonlinear coefficient d_eff, m/V. */
  deff: number;
  /** Indices of the two inputs and of the generated wave. */
  n1: number;
  n2: number;
  nOut: number;
  /** Residual phase mismatch Δk, 1/m. */
  deltaK: number;
}

const sinc = (x: number) => (x === 0 ? 1 : Math.sin(x) / x);

/** η in I_g = η I₁ I₂ (low conversion, plane waves), m²/W. NaN outside the domain. */
export function mixingEfficiency({ lambdaOut, length, deff, n1, n2, nOut, deltaK }: MixingInput): number {
  const ok = lambdaOut > 0 && Number.isFinite(lambdaOut) && length >= 0 && Number.isFinite(length) && Number.isFinite(deff) &&
    n1 >= 1 && n2 >= 1 && nOut >= 1 && Number.isFinite(n1 * n2 * nOut) && Number.isFinite(deltaK);
  if (!ok) return NaN;
  const s = sinc((deltaK * length) / 2);
  return (8 * Math.PI ** 2 * deff ** 2 * length ** 2 * s * s) / (epsilon_0 * c * n1 * n2 * nOut * lambdaOut ** 2);
}

/** Generated power η·2P₁P₂/(π(w₁² + w₂²)) for Gaussian beams of 1/e² radii w₁, w₂ (thin crystal), W. */
export function gaussianMixingPower(eta: number, power1: number, power2: number, w1: number, w2: number): number {
  if (!(eta >= 0 && power1 >= 0 && power2 >= 0 && w1 > 0 && w2 > 0)) return NaN;
  return (eta * 2 * power1 * power2) / (Math.PI * (w1 * w1 + w2 * w2));
}

/** ln|sinh(gL)/g| with g² = Γ² − (Δk/2)² (sin for g² < 0), overflow-free. */
function logGainAmplitude(gamma: number, deltaK: number, L: number): number {
  const g2 = gamma * gamma - (deltaK * deltaK) / 4;
  if (g2 === 0) return Math.log(L);
  const g = Math.sqrt(Math.abs(g2));
  if (g2 < 0) return Math.log(Math.abs(Math.sin(g * L))) - Math.log(g);
  const x = g * L;
  return x > 20 ? x - Math.LN2 + Math.log1p(-Math.exp(-2 * x)) - Math.log(g) : Math.log(Math.sinh(x) / g);
}

/** Signal power gain G = 1 + (Γ/g)² sinh²(gL) of an undepleted-pump OPA (Γ in 1/m, Δk in 1/m, L in m). */
export function parametricGain(gamma: number, deltaK: number, length: number): number {
  if (!(gamma >= 0 && Number.isFinite(gamma) && Number.isFinite(deltaK) && length >= 0 && Number.isFinite(length))) return NaN;
  if (gamma === 0 || length === 0) return 1;
  return 1 + Math.exp(2 * (Math.log(gamma) + logGainAmplitude(gamma, deltaK, length)));
}

/** Idler power (λ_s/λ_i)(G − 1)P_s, W. Either beam may be the longer wavelength: signal and idler are labels. */
export function idlerPower(gain: number, signalPower: number, lambdaSignal: number, lambdaIdler: number): number {
  if (!(gain >= 1 && signalPower >= 0 && lambdaSignal > 0 && lambdaIdler > 0)) return NaN;
  return (lambdaSignal / lambdaIdler) * (gain - 1) * signalPower;
}

/** Phase mismatch of a signal detuned by Δν (Hz): Δk₀ − 2πΔν δ_si, with δ_si = 1/v_gs − 1/v_gi in s/m. */
export function detunedMismatch(deltaK0: number, detuning: number, gvm: number): number {
  return deltaK0 - 2 * Math.PI * detuning * gvm;
}

/**
 * FWHM gain bandwidth (of G − 1) in signal frequency, Hz, for a GVM δ_si (s/m): bisection for the half-maximum Δk on
 * the main lobe, where G − 1 falls monotonically in |Δk| up to its first zero 2√(Γ² + π²/L²). Relative tolerance
 * 1e-12 or 200 halvings. Infinity for δ_si = 0.
 */
export function gainBandwidth(gamma: number, length: number, gvm: number): number {
  if (!(gamma >= 0 && Number.isFinite(gamma) && length > 0 && Number.isFinite(length) && Number.isFinite(gvm))) return NaN;
  if (gvm === 0) return Infinity;
  const target = logGainAmplitude(gamma, 0, length) - Math.LN2 / 2;
  let lo = 0;
  let hi = 2 * Math.sqrt(gamma * gamma + (Math.PI / length) ** 2);
  for (let i = 0; i < 200 && hi - lo > 1e-12 * hi; i++) {
    const mid = (lo + hi) / 2;
    if (logGainAmplitude(gamma, mid, length) > target) lo = mid;
    else hi = mid;
  }
  return (2 * ((lo + hi) / 2)) / (2 * Math.PI * Math.abs(gvm));
}

/** Low-gain limit 0.886/(|δ_si| L) of `gainBandwidth`: the sinc² FWHM, 2·1.39156/π = 0.88589. */
export const LOW_GAIN_BANDWIDTH_FACTOR = (4 * 1.3915573782515103) / (2 * Math.PI);
