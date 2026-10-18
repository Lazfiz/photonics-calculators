/**
 * Photoacoustic (optoacoustic) imaging: initial pressure, diffuse light attenuation, acoustic resolution and the skin
 * exposure limit of the excitation. SI units in and out: lengths in m, coefficients in 1/m, fluence in J/m², pressure
 * in Pa, speeds in m/s, frequencies in Hz, times in s. Model tier: textbook approximation.
 *
 * - Initial pressure under stress and thermal confinement: p₀ = Γ μ_a F, with Γ the Grüneisen parameter (dimensionless),
 *   μ_a the absorption coefficient of the target and F the local fluence. Confinement needs the pulse shorter than the
 *   stress relaxation time d_c/v_s of the feature size d_c. M. Xu, L. V. Wang, Rev. Sci. Instrum. 77, 041101 (2006),
 *   doi:10.1063/1.2195024.
 * - Fluence at depth z in a diffusive background: F(z) ≈ F₀ exp(−μ_eff z), μ_eff = √(3μ_a(μ_a + μ_s′)) (diffusion
 *   theory, far from the surface; the build-up of backscattered light just below the surface is not modelled).
 *   L. V. Wang, H.-I. Wu, Biomedical Optics: Principles and Imaging (Wiley, 2007), ch. 5.
 * - Acoustic-resolution photoacoustic microscopy and partial-view tomography: axial R_A = 0.88 v_s/Δf (Δf the
 *   photoacoustic bandwidth), lateral R_L = 0.71 v_s/(NA f₀) (f₀ the centre frequency, NA the acoustic aperture).
 *   Detection is one-way, so there is no factor 2 as in pulse-echo ultrasound. L. V. Wang, S. Hu, Science 335, 1458
 *   (2012), doi:10.1126/science.1216210.
 * - Frequency-proportional acoustic attenuation α₀ f z (dB), with α₀ in dB/(m·Hz) (soft tissue ≈ 0.5 dB cm⁻¹ MHz⁻¹).
 * - Skin exposure limit of the excitation from ICNIRP 2013 Table 7 (`skin-exposure-limits.ts`): the single-pulse limit
 *   at the pulse duration and the irradiance limit for exposures of 10 s or more. The full repetitive-pulse analysis
 *   is not modelled.
 */

import { exposureLimit, T_MAX } from "../laser-safety/eye-exposure-limits";
import { skinLimit } from "../laser-safety/skin-exposure-limits";

const nonNegative = (x: number) => Number.isFinite(x) && x >= 0;
const positive = (x: number) => Number.isFinite(x) && x > 0;

/** Axial resolution prefactor of R_A = 0.88 v_s/Δf (Wang & Hu 2012). */
export const PA_AXIAL_FACTOR = 0.88;
/** Lateral resolution prefactor of R_L = 0.71 v_s/(NA f₀) (Wang & Hu 2012). */
export const PA_LATERAL_FACTOR = 0.71;

/** Initial pressure p₀ = Γ μ_a F, Pa. */
export function initialPressure(gruneisen: number, mua: number, fluence: number): number {
  return nonNegative(gruneisen) && nonNegative(mua) && nonNegative(fluence) ? gruneisen * mua * fluence : NaN;
}

/** Diffuse effective attenuation μ_eff = √(3μ_a(μ_a + μ_s′)), 1/m. */
export function effectiveAttenuation(mua: number, musPrime: number): number {
  return nonNegative(mua) && nonNegative(musPrime) ? Math.sqrt(3 * mua * (mua + musPrime)) : NaN;
}

/** Transport mean free path 1/(μ_a + μ_s′), m (∞ in a clear, non-absorbing medium). */
export function transportMeanFreePath(mua: number, musPrime: number): number {
  return nonNegative(mua) && nonNegative(musPrime) ? 1 / (mua + musPrime) : NaN;
}

/** Fluence at depth z, F₀ exp(−μ_eff z), J/m². */
export function fluenceAtDepth(surfaceFluence: number, muEff: number, depth: number): number {
  return nonNegative(surfaceFluence) && nonNegative(muEff) && nonNegative(depth) ? surfaceFluence * Math.exp(-muEff * depth) : NaN;
}

/** Axial resolution 0.88 v_s/Δf, m. */
export function paAxialResolution(soundSpeed: number, bandwidth: number): number {
  return positive(soundSpeed) && positive(bandwidth) ? (PA_AXIAL_FACTOR * soundSpeed) / bandwidth : NaN;
}

/** Lateral resolution 0.71 v_s/(NA f₀) of acoustic-resolution detection, m. */
export function paLateralResolution(soundSpeed: number, NA: number, centerFrequency: number): number {
  return positive(soundSpeed) && positive(NA) && NA <= 1 && positive(centerFrequency)
    ? (PA_LATERAL_FACTOR * soundSpeed) / (NA * centerFrequency)
    : NaN;
}

/** One-way acoustic attenuation α₀ f z, dB, for α₀ in dB/(m·Hz). */
export function acousticLossDb(alpha0: number, frequency: number, depth: number): number {
  return nonNegative(alpha0) && nonNegative(frequency) && nonNegative(depth) ? alpha0 * frequency * depth : NaN;
}

/** Stress relaxation time d_c/v_s, s: the pulse must be shorter for p₀ = Γμ_aF to hold. */
export function stressConfinementTime(size: number, soundSpeed: number): number {
  return positive(size) && positive(soundSpeed) ? size / soundSpeed : NaN;
}

/** ICNIRP 2013 skin limit for one pulse of duration τ (1 ns – 30 ks), radiant exposure J/m². */
export function skinPulseLimit(lambda: number, tau: number): number {
  const limit = skinLimit(lambda);
  return limit ? exposureLimit(limit, tau) : NaN;
}

/** ICNIRP 2013 skin irradiance limit for exposures of 10 s to 30 ks, W/m² (400–1400 nm: 2.0 C_A kW/m²). */
export function skinLongExposureIrradianceLimit(lambda: number): number {
  const limit = skinLimit(lambda);
  return limit ? exposureLimit(limit, T_MAX) / T_MAX : NaN;
}
