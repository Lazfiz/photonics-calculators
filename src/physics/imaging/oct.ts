/**
 * Optical coherence tomography (OCT) and low-coherence interferometry: coherence of a Gaussian source, axial
 * resolution, fringe visibility, the time-domain carrier and the shot-noise-limited SNR. SI units in and out.
 * Model tier: textbook (Gaussian spectrum, narrow band Δλ ≪ λ₀, no dispersion mismatch).
 *
 * A source with a Gaussian power spectrum of FWHM Δν = cΔλ/λ₀² has the degree of coherence
 *   |γ(τ)| = exp(−(πΔν τ)²/(4 ln 2)),
 * whose FWHM in delay is τ_c = (4 ln 2/π)/Δν, so the coherence length (FWHM of |γ| against the optical path
 * difference) is l_c = cτ_c = (4 ln 2/π) λ₀²/Δλ. In a Michelson interferometer the path difference is twice the
 * mirror or reflector displacement, so the axial resolution (FWHM of the coherence gate in depth) is half of it:
 *   Δz = (2 ln 2/π) λ₀²/(n Δλ) = 0.4413 λ₀²/(n Δλ)
 * (A. F. Fercher et al., Rep. Prog. Phys. 66, 239 (2003), doi:10.1088/0034-4885/66/2/204, the "round-trip
 * coherence length"), with n the group index of the sample.
 *
 * Shot-noise limit with the reference power much larger than the sample power, ρ the responsivity (A/W), P_s the
 * sample power reaching the detector (M. A. Choma et al., Opt. Express 11, 2183 (2003), doi:10.1364/OE.11.002183):
 *   time domain, eq. 9: SNR = ρ P_s/(2e B);  Fourier domain (spectrometer or swept source), eq. 10: SNR = ρ P_s Δt/(2e),
 * with Δt the A-scan time. SNR is a power ratio (A-scan peak height over the noise standard deviation, squared).
 */
import { c, q } from "../constants";

const positive = (x: number) => Number.isFinite(x) && x > 0;

/** (2 ln 2)/π = 0.44127: axial resolution Δz = this · λ₀²/(nΔλ) for a Gaussian spectrum. */
export const OCT_GAUSSIAN_FACTOR = (2 * Math.LN2) / Math.PI;

/** Axial resolution (2 ln 2/π) λ₀²/(n Δλ) in a medium of group index n, m (Fercher 2003). */
export function octAxialResolution(lambda0: number, dLambda: number, n = 1): number {
  if (!(positive(lambda0) && positive(dLambda) && positive(n))) return NaN;
  return (OCT_GAUSSIAN_FACTOR * lambda0 * lambda0) / (n * dLambda);
}

/** Optical-frequency FWHM Δν = cΔλ/λ₀², Hz (first order in Δλ/λ₀). */
export function spectralWidthHz(lambda0: number, dLambda: number): number {
  return positive(lambda0) && positive(dLambda) ? (c * dLambda) / (lambda0 * lambda0) : NaN;
}

/** Coherence time, the FWHM of |γ(τ)|: (4 ln 2/π)/Δν, s. */
export function coherenceTime(lambda0: number, dLambda: number): number {
  return (2 * OCT_GAUSSIAN_FACTOR) / spectralWidthHz(lambda0, dLambda);
}

/** Coherence length cτ_c = (4 ln 2/π) λ₀²/Δλ, the FWHM of |γ| against the optical path difference, m. */
export function coherenceLength(lambda0: number, dLambda: number): number {
  return c * coherenceTime(lambda0, dLambda);
}

/** Degree of coherence |γ| = exp(−(π Δλ OPD/λ₀²)²/(4 ln 2)) at an optical path difference OPD (m) in vacuum. */
export function degreeOfCoherence(opd: number, lambda0: number, dLambda: number): number {
  if (!(positive(lambda0) && positive(dLambda) && Number.isFinite(opd))) return NaN;
  const u = (Math.PI * dLambda * opd) / (lambda0 * lambda0);
  return Math.exp(-(u * u) / (4 * Math.LN2));
}

/** Fringe visibility 2√(R_r R_s)/(R_r + R_s) of two beams of power ratio R_r : R_s at zero path difference. */
export function fringeVisibility(Rr: number, Rs: number): number {
  if (!(Rr >= 0 && Rs >= 0 && Rr + Rs > 0)) return NaN;
  return (2 * Math.sqrt(Rr * Rs)) / (Rr + Rs);
}

/**
 * Doppler frequency 2 n v cos θ/λ₀ of a reflector moving at v (m/s) in a medium of index n, at angle θ (rad) to the
 * beam, Hz. With a scanning reference mirror in air (n = 1, θ = 0) it is the time-domain OCT carrier 2v/λ₀.
 */
export function dopplerFrequency(v: number, lambda0: number, n = 1, theta = 0): number {
  if (!(Number.isFinite(v) && positive(lambda0) && positive(n) && Number.isFinite(theta))) return NaN;
  return (2 * n * v * Math.cos(theta)) / lambda0;
}

/**
 * FWHM of the time-domain OCT signal spectrum, 2vΔλ/λ₀², Hz: the gate (FWHM 0.4413λ₀²/Δλ in mirror travel) lasts
 * T = Δz/v, and a Gaussian of FWHM T has a spectrum of FWHM (4 ln 2/π)/T. The detection bandwidth must pass it.
 */
export function tdSignalBandwidth(v: number, lambda0: number, dLambda: number): number {
  return positive(v) ? (2 * OCT_GAUSSIAN_FACTOR * v) / octAxialResolution(lambda0, dLambda) : NaN;
}

/** Fourier-domain shot-noise-limited SNR ρ P_s Δt/(2e) (Choma 2003, eq. 10); ρ in A/W, P_s in W, Δt in s. */
export function fdOctSnr(responsivity: number, sampleSignalPower: number, aScanTime: number): number {
  if (!(positive(responsivity) && sampleSignalPower >= 0 && positive(aScanTime))) return NaN;
  return (responsivity * sampleSignalPower * aScanTime) / (2 * q);
}

/** Time-domain shot-noise-limited SNR ρ P_s/(2e B) (Choma 2003, eq. 9); B is the detection bandwidth, Hz. */
export function tdOctSnr(responsivity: number, sampleSignalPower: number, bandwidth: number): number {
  return positive(bandwidth) ? fdOctSnr(responsivity, sampleSignalPower, 1 / bandwidth) : NaN;
}
