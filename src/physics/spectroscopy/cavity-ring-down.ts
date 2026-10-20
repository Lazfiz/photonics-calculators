/**
 * Cavity ring-down spectroscopy (CRDS) for a two-mirror linear cavity filled with the sample. Lengths in m, times in s,
 * absorption coefficients in m⁻¹.
 * Model tier: exact for the decay envelope (one round trip multiplies the stored energy by G = R₁R₂(1 − ℓ)·10^(−2A),
 * so I(k·t_rt) = Gᵏ = exp(−k Λ), Λ = −ln G, and τ = t_rt/Λ = 2L/(cΛ)); single-mode excitation, no mode beating,
 * no detector response. Sample: absorbance A per pass (base 10), α = A ln 10/L for a filled cavity.
 *
 * References: A. O'Keefe, D. A. G. Deacon, Rev. Sci. Instrum. 59, 2544 (1988), doi 10.1063/1.1139895;
 * G. Berden, R. Peeters, G. Meijer, Int. Rev. Phys. Chem. 19, 565 (2000), doi 10.1080/014423500750040627:
 * α = (1/c)(1/τ − 1/τ₀), and the minimum detectable α = (Δτ/τ)/(cτ₀) ≈ (Δτ/τ)(1 − R)/L; per √Hz it is divided by
 * √f_rep for f_rep averaged decays per second. Finesse from the round-trip amplitude ρ = √G:
 * ℱ = π√ρ/(1 − ρ) ≈ 2π/Λ (A. E. Siegman, Lasers, University Science Books 1986, §11.3); mode FWHM 1/(2πτ).
 */
import { c } from "../constants";

/**
 * Round-trip loss Λ = −ln G = −ln R₁ − ln R₂ − ln(1 − ℓ) + 2A ln 10, summed in logs (log1p) so mirror losses
 * of 10⁻⁷ survive. NaN unless 0 < R ≤ 1, 0 ≤ ℓ < 1, A ≥ 0.
 */
export function roundTripLoss(R1: number, R2: number, otherLoss: number, absorbancePerPass: number): number {
  if (!(R1 > 0 && R1 <= 1 && R2 > 0 && R2 <= 1 && otherLoss >= 0 && otherLoss < 1 && absorbancePerPass >= 0)) return NaN;
  return -Math.log1p(R1 - 1) - Math.log1p(R2 - 1) - Math.log1p(-otherLoss) + 2 * absorbancePerPass * Math.LN10;
}

/** Ring-down time τ = 2L/(cΛ), s. NaN unless L > 0 and Λ > 0 (Λ = 0: no decay). */
export function ringDownTime(length: number, loss: number): number {
  if (!(length > 0 && loss > 0)) return NaN;
  return (2 * length) / (c * loss);
}

/** Cavity finesse π√ρ/(1 − ρ), ρ = e^(−Λ/2). NaN unless Λ > 0. */
export function cavityFinesse(loss: number): number {
  if (!(loss > 0)) return NaN;
  return (Math.PI * Math.exp(-loss / 4)) / -Math.expm1(-loss / 2);
}

/** Sample absorption coefficient from the ring-down times, α = (1/c)(1/τ − 1/τ₀), m⁻¹. */
export function absorptionFromRingDown(tau: number, tau0: number): number {
  if (!(tau > 0 && tau0 > 0)) return NaN;
  return (1 / tau - 1 / tau0) / c;
}

/** Minimum detectable absorption coefficient (Δτ/τ)/(cτ₀) for a relative ring-down-time noise Δτ/τ per decay, m⁻¹. */
export function minDetectableAbsorption(tau0: number, relativeTauNoise: number): number {
  if (!(tau0 > 0 && relativeTauNoise > 0)) return NaN;
  return relativeTauNoise / (c * tau0);
}

/** Noise-equivalent absorption α_min/√f_rep, m⁻¹ Hz^(−1/2), for f_rep decays averaged per second. */
export function noiseEquivalentAbsorption(alphaMin: number, repetitionRate: number): number {
  if (!(alphaMin > 0 && repetitionRate > 0)) return NaN;
  return alphaMin / Math.sqrt(repetitionRate);
}
