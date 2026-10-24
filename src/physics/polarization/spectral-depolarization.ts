/**
 * Depolarization of broadband light by a linear retarder: incoherent wavelengths add intensities, so the output
 * Stokes vector is the spectrum-weighted mean of the monochromatic ones, and the retarder's Mueller matrix holds
 * ⟨cos Γ⟩ and ⟨sin Γ⟩ (mueller.ts, retarderFromCosSin). Wavenumbers σ = 1/λ in m⁻¹, retardances in m, angles in rad.
 *
 * Model: the retardance is linear in σ about the band centre, Γ(σ) = Γ₀ + 2π R_g (σ − σ₀), where R_g is the group
 * retardance d (Δn − λ dΔn/dλ) of a plate of thickness d. Then ⟨e^{iΓ}⟩ = V e^{iΓ₀} with the visibility V the
 * Fourier transform of the spectrum at the optical path difference R_g (the Wiener–Khinchin pairing of spectrum and
 * coherence: Born & Wolf, Principles of Optics, 7th ed., ch. 7 "Elements of the theory of interference and
 * interferometers", pp. 286–411, and ch. 10 "Interference and diffraction with partially coherent light", pp. 554–632):
 *   - flat spectrum of full width Δσ: V = sinc(π R_g Δσ) = sin x / x;
 *   - Gaussian of full width at half maximum Δσ: V = exp(−(π R_g Δσ)² / (4 ln 2)).
 * Exact for a non-dispersive retarder (R_g = R); for a dispersive crystal the error is the curvature of Δn(σ) across
 * the band, which tests/polarization-spectral-depolarization.test.ts bounds against direct integration over quartz.
 */
import { sinc } from "../math";
import { type MuellerMatrix, retarderFromCosSin } from "./mueller";

export type SpectrumShape = "flat" | "gaussian";

/**
 * Visibility V = |⟨e^{i2πR(σ − σ₀)}⟩| (signed for the flat spectrum) of a spectrum of width Δσ (full width, or FWHM
 * for the Gaussian) at path difference R. NaN for Δσ < 0 or non-finite input.
 */
export function spectralVisibility(R: number, dSigma: number, shape: SpectrumShape): number {
  if (!(dSigma >= 0) || !Number.isFinite(R) || !Number.isFinite(dSigma)) return NaN;
  const x = Math.PI * R * dSigma;
  return shape === "flat" ? sinc(x) : Math.exp(-(x * x) / (4 * Math.LN2));
}

/**
 * Band centre and width in wavenumber for a band given in wavelength: centre λ₀ and full width Δλ, edges
 * σ = 1/(λ₀ ± Δλ/2). NaN when Δλ/2 ≥ λ₀.
 */
export function wavenumberBand(lambda0: number, dLambda: number): { sigma0: number; dSigma: number } {
  const lo = lambda0 - dLambda / 2, hi = lambda0 + dLambda / 2;
  if (!(lambda0 > 0 && dLambda >= 0 && lo > 0)) return { sigma0: NaN, dSigma: NaN };
  return { sigma0: (1 / lo + 1 / hi) / 2, dSigma: 1 / lo - 1 / hi };
}

/**
 * Phase and group retardance of a plate of thickness d with birefringence Δn(λ) at λ₀: R = d Δn(λ₀) and
 * R_g = d (Δn − λ dΔn/dλ), the derivative by a central difference with step λ₀·1e-4 (error ~1e-8 relative).
 */
export function plateRetardances(
  d: number, deltaN: (lambda: number) => number, lambda0: number,
): { phase: number; group: number } {
  const h = lambda0 * 1e-4;
  const dn = deltaN(lambda0);
  const slope = (deltaN(lambda0 + h) - deltaN(lambda0 - h)) / (2 * h);
  return { phase: d * dn, group: d * (dn - lambda0 * slope) };
}

/**
 * Mean cos Γ and sin Γ for Γ(σ) = 2πRσ₀ + 2πR_g(σ − σ₀) over the spectrum: V cos Γ₀ and V sin Γ₀ with Γ₀ = 2πRσ₀.
 */
export function bandMeanRetardance(
  R: number, Rg: number, sigma0: number, dSigma: number, shape: SpectrumShape,
): { meanCos: number; meanSin: number; visibility: number } {
  const V = spectralVisibility(Rg, dSigma, shape);
  const g0 = 2 * Math.PI * R * sigma0;
  return { meanCos: V * Math.cos(g0), meanSin: V * Math.sin(g0), visibility: V };
}

/** Mueller matrix of the retarder (fast axis θ) averaged over the spectrum. NaN entries for invalid input. */
export function muellerRetarderSpectral(
  R: number, Rg: number, sigma0: number, dSigma: number, shape: SpectrumShape, fastAxis: number,
): MuellerMatrix {
  const { meanCos, meanSin } = bandMeanRetardance(R, Rg, sigma0, dSigma, shape);
  return retarderFromCosSin(meanCos, meanSin, fastAxis);
}

/**
 * Group retardance at which the visibility first falls to v (0 < v < 1): the depolarizing plate length scale.
 * Gaussian: R = √(4 ln 2 · ln(1/v)) / (πΔσ); flat: the first root of sinc x = v on (0, π), by bisection to 1e-12.
 */
export function retardanceForVisibility(v: number, dSigma: number, shape: SpectrumShape): number {
  if (!(v > 0 && v < 1 && dSigma > 0)) return NaN;
  if (shape === "gaussian") return Math.sqrt(4 * Math.LN2 * Math.log(1 / v)) / (Math.PI * dSigma);
  let lo = 0, hi = Math.PI;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (sinc(mid) > v) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2 / (Math.PI * dSigma);
}
