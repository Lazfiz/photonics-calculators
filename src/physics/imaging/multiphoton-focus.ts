/**
 * Focal spot of a microscope objective for k-photon processes: two- and three-photon excitation, harmonic
 * generation and coherent Raman. SI units in and out (wavelengths and lengths in m, powers in W, times in s).
 * Model tier: textbook approximation (Gaussian fit to the diffraction-limited focus of a filled pupil).
 *
 * W. R. Zipfel, R. M. Williams, W. W. Webb, "Nonlinear magic: multiphoton microscopy in the biosciences",
 * Nat. Biotechnol. 21, 1369 (2003), doi:10.1038/nbt899. Gaussian fit to the squared illumination PSF,
 * I²(r, z) ≈ exp(−r²/ω_xy² − z²/ω_z²), with 1/e radii
 *   ω_xy = 0.320 λ/(√2 NA)                  (NA ≤ 0.7)
 *   ω_xy = 0.325 λ/(√2 NA^0.91)             (NA > 0.7)
 *   ω_z  = 0.532 λ/(√2 (n − √(n² − NA²)))
 * so the two-photon FWHM is 2√(ln 2) ω and the two-photon volume ∫I² dV/I₀² = π^(3/2) ω_xy² ω_z.
 * λ is the vacuum excitation wavelength and n the immersion/sample index.
 *
 * The focal intensity is then I ≈ exp(−2r²/w² − 2z²/w_z²) with 1/e² radii w = 2ω_xy, w_z = 2ω_z, and the
 * k-photon profile I^k has FWHM 2√(2 ln 2/k) ω and volume ∫I^k dV/I₀^k = (π/(2k))^(3/2) w² w_z. For k = 2 this
 * is Zipfel's fit itself; for k = 1 and 3 it extends the Gaussian. Against the exact paraxial Airy pattern
 * [2J₁(v)/v]² (Born & Wolf §8.5) the lateral FWHM is 2.0 % wide for k = 2 and 1.5 % wide for k = 3, and the
 * peak intensity P/(2π ω_xy²) is 1.1 % below the Airy peak π NA² P/λ².
 *
 * Pulses are taken as Gaussian in time: P_peak = 2√(ln 2/π) E/τ_FWHM (sech² pulses: 0.881 E/τ).
 */

/** Gaussian pulse: peak power = PEAK_FACTOR · E/τ_FWHM. */
export const GAUSSIAN_PULSE_PEAK_FACTOR = 2 * Math.sqrt(Math.LN2 / Math.PI);

const finitePositive = (...xs: number[]) => xs.every((x) => Number.isFinite(x) && x > 0);

/** n − √(n² − NA²), computed as NA²/(n + √(n² − NA²)) to avoid cancellation at low NA. */
function axialDenominator(n: number, NA: number): number {
  return (NA * NA) / (n + Math.sqrt(n * n - NA * NA));
}

/** Zipfel's lateral 1/e radius ω_xy of the squared illumination PSF, m. Needs no medium index. */
export function zipfelLateralRadius(lambda: number, NA: number): number {
  if (!finitePositive(lambda, NA)) return NaN;
  return NA <= 0.7 ? (0.32 * lambda) / (Math.SQRT2 * NA) : (0.325 * lambda) / (Math.SQRT2 * NA ** 0.91);
}

/** Zipfel's axial 1/e radius ω_z of the squared illumination PSF, m (NaN unless 0 < NA < n). */
export function zipfelAxialRadius(lambda: number, n: number, NA: number): number {
  if (!finitePositive(lambda, n, NA) || n < 1 || NA >= n) return NaN;
  return (0.532 * lambda) / (Math.SQRT2 * axialDenominator(n, NA));
}

/** 1/e² radius w = 2ω_xy of the focal intensity itself (Gaussian approximation), m. */
export function focalIntensityRadius(lambda: number, NA: number): number {
  return 2 * zipfelLateralRadius(lambda, NA);
}

/** Lateral and axial FWHM of the k-photon profile I^k, m: 2√(2 ln 2/k) ω. */
export function multiphotonFwhm(lambda: number, n: number, NA: number, order: number) {
  const ok = Number.isFinite(order) && order >= 1;
  const scale = ok ? 2 * Math.sqrt((2 * Math.LN2) / order) : NaN;
  return {
    lateral: scale * zipfelLateralRadius(lambda, NA),
    axial: scale * zipfelAxialRadius(lambda, n, NA),
  };
}

/** k-photon focal volume ∫I^k dV / I₀^k = (π/(2k))^(3/2) w² w_z, m³ (k = 2: π^(3/2) ω_xy² ω_z). */
export function multiphotonVolume(lambda: number, n: number, NA: number, order: number): number {
  if (!(Number.isFinite(order) && order >= 1)) return NaN;
  const w = 2 * zipfelLateralRadius(lambda, NA);
  const wz = 2 * zipfelAxialRadius(lambda, n, NA);
  return (Math.PI / (2 * order)) ** 1.5 * w * w * wz;
}

/** Peak focal intensity 2P/(π w²) = P/(2π ω_xy²) for a peak power P, W/m². */
export function focalPeakIntensity(peakPower: number, lambda: number, NA: number): number {
  if (!(Number.isFinite(peakPower) && peakPower >= 0)) return NaN;
  const wxy = zipfelLateralRadius(lambda, NA);
  return peakPower / (2 * Math.PI * wxy * wxy);
}

/** Energy per pulse E = P_avg/f_rep, J. */
export function pulseEnergy(averagePower: number, repetitionRate: number): number {
  if (!(Number.isFinite(averagePower) && averagePower >= 0) || !finitePositive(repetitionRate)) return NaN;
  return averagePower / repetitionRate;
}

/** Peak power of a Gaussian pulse, 2√(ln 2/π) · E/τ_FWHM, W. */
export function gaussianPulsePeakPower(averagePower: number, repetitionRate: number, tauFwhm: number): number {
  if (!finitePositive(tauFwhm)) return NaN;
  return (GAUSSIAN_PULSE_PEAK_FACTOR * pulseEnergy(averagePower, repetitionRate)) / tauFwhm;
}

/**
 * Ballistic (unscattered) fraction of the excitation reaching depth z, exp(−μz), with μ the extinction
 * (scattering + absorption) coefficient in 1/m. A k-photon signal at constant surface power falls as its k-th power.
 */
export function ballisticFraction(depth: number, attenuationCoefficient: number): number {
  if (!(Number.isFinite(depth) && depth >= 0) || !(Number.isFinite(attenuationCoefficient) && attenuationCoefficient >= 0)) return NaN;
  return Math.exp(-attenuationCoefficient * depth);
}
