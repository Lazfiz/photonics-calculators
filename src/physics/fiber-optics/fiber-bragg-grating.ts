/**
 * Fiber Bragg gratings: coupled-mode reflection spectrum, bandwidths, chirp, and strain/temperature response. SI units
 * in and out: wavelengths, periods and lengths in m, coupling coefficients and detunings in 1/m, strain dimensionless
 * (1 µε = 1e-6), temperatures in K, chirp dλ_B/dz in m/m. Model tier: textbook (coupled-mode theory with
 * synchronous approximation, single core-mode reflection, lossless; linear strain and temperature response).
 *
 * Sources:
 * - T. Erdogan, "Fiber grating spectra", J. Lightwave Technol. 15, 1277 (1997), doi:10.1109/50.618322: uniform
 *   grating amplitude reflection r = −κ sinh(γL)/(σ̂ sinh(γL) + iγ cosh(γL)) with γ² = κ² − σ̂², so
 *   R = sinh²(γL)/(cosh²(γL) − σ̂²/κ²) (eq. 20); peak tanh²(κL); band between the first zeros
 *   Δλ₀/λ = (vδn/n_eff)√(1 + (λ_D/(vδn L))²); the piecewise-uniform transfer matrices F_i (§IV) for apodized and
 *   chirped gratings, after M. Yamada, K. Sakuda, Appl. Opt. 26, 3474 (1987), doi:10.1364/AO.26.003474.
 *   Here Δn is Erdogan's ac amplitude vδn̄_eff, so κ = πΔn/λ; the dc index change is absorbed into λ_B = 2n_eff Λ.
 * - F. Ouellette, Opt. Lett. 12, 847 (1987), doi:10.1364/OL.12.000847: a linearly chirped grating reflects each
 *   wavelength from the point where it is Bragg-matched, so the round-trip delay changes by 2n_eff/c per unit length
 *   and the dispersion is 2n_eff/(c·dλ_B/dz).
 * - A. D. Kersey et al., "Fiber grating sensors", J. Lightwave Technol. 15, 1442 (1997), doi:10.1109/50.618377:
 *   Δλ_B/λ_B = (1 − p_e)ε + (α + ξ)ΔT with p_e = (n²/2)[p₁₂ − ν(p₁₁ + p₁₂)].
 * - Strain-optic coefficients of single-mode fibre p₁₁ = 0.113, p₁₂ = 0.252: R. Bertholds, R. Dändliker,
 *   J. Lightwave Technol. 6, 17 (1988), doi:10.1109/50.3956. Poisson ratio of fused silica 0.16 (Corning HPFS 7980
 *   product sheet).
 * - Temperature coefficient of SMF-28 gratings K_T = (1/n_eff)dn_eff/dT + α = 6.165e-6 /K at 20 °C (≈ 9.56 pm/K at
 *   1550 nm): M. Cosme et al., Sensors 26, 435 (2026), doi:10.3390/s26020435.
 */
import { c } from "../constants";
import { firstCrossing } from "../math";

/** Strain-optic (Pockels) coefficients of single-mode fibre, Bertholds & Dändliker 1988. */
export const FIBER_P11 = 0.113;
export const FIBER_P12 = 0.252;
/** Poisson ratio of fused silica (Corning HPFS 7980). */
export const SILICA_POISSON = 0.16;
/** Normalised temperature coefficient (1/λ_B)dλ_B/dT of an SMF-28 grating at 20 °C, 1/K (Cosme et al. 2026). */
export const SMF28_THERMAL_COEFFICIENT = 6.165e-6;

/** Bragg wavelength λ_B = 2 n_eff Λ. */
export function braggWavelength(nEff: number, period: number): number {
  return 2 * nEff * period;
}

/** ac coupling coefficient κ = πΔn/λ (1/m) for an index modulation amplitude Δn (Erdogan's vδn̄_eff). */
export function couplingCoefficient(deltaN: number, lambda: number): number {
  return (Math.PI * deltaN) / lambda;
}

/** Detuning σ̂ = 2π n_eff (1/λ − 1/λ_B) (1/m); positive on the short-wavelength side. */
export function detuning(lambda: number, lambdaB: number, nEff: number): number {
  return 2 * Math.PI * nEff * (1 / lambda - 1 / lambdaB);
}

/** Inverse of `detuning`: the wavelength at which the detuning is σ̂. */
export function wavelengthAtDetuning(sigma: number, lambdaB: number, nEff: number): number {
  return 1 / (1 / lambdaB + sigma / (2 * Math.PI * nEff));
}

/**
 * sinh(g)/g for g² = gSq, continued through g² ≤ 0 as sin(|g|)/|g|. Even in g, so real for real gSq.
 */
function sinhcOfSquare(gSq: number): number {
  if (gSq > 1e-12) {
    const g = Math.sqrt(gSq);
    return Math.sinh(g) / g;
  }
  if (gSq < -1e-12) {
    const g = Math.sqrt(-gSq);
    return Math.sin(g) / g;
  }
  return 1 + gSq / 6;
}

/**
 * Power reflectance of a uniform grating from the dimensionless κL and σ̂L (Erdogan eq. 20). With s = sinh(γL)/(γL),
 * eq. 20 becomes R = (κLs)²/(1 + (κLs)²), which stays finite at the band edge γ = 0 (R = (κL)²/(1 + (κL)²)), goes
 * through sin(|γ|L)/|γ|L outside the band, and tends to 1 instead of overflowing for very strong gratings.
 */
export function uniformReflectance(kappaL: number, sigmaL: number): number {
  if (!(Number.isFinite(kappaL) && Number.isFinite(sigmaL)) || kappaL < 0) return NaN;
  const x = kappaL * sinhcOfSquare(kappaL * kappaL - sigmaL * sigmaL);
  if (x === 0) return 0;
  return 1 / (1 + 1 / (x * x));
}

/** Peak reflectance tanh²(κL). */
export function peakReflectance(kappaL: number): number {
  return Math.tanh(kappaL) ** 2;
}

export interface UniformGrating {
  /** Bragg wavelength, m. */
  lambdaB: number;
  /** Modal (phase) effective index. */
  nEff: number;
  /** Grating length, m. */
  length: number;
  /** Index modulation amplitude Δn. */
  deltaN: number;
}

/** Reflectance of a uniform grating at wavelength λ. */
export function uniformGratingReflectance(g: UniformGrating, lambda: number): number {
  const kappa = couplingCoefficient(g.deltaN, g.lambdaB);
  return uniformReflectance(kappa * g.length, detuning(lambda, g.lambdaB, g.nEff) * g.length);
}

function bandWidthAtDetuning(g: UniformGrating, sigma: number): number {
  return wavelengthAtDetuning(-sigma, g.lambdaB, g.nEff) - wavelengthAtDetuning(sigma, g.lambdaB, g.nEff);
}

/**
 * Width between the first zeros of the main lobe, where γL = iπ: σ̂L = √((κL)² + π²). The edges are mapped back to
 * wavelength exactly; to first order this is Erdogan's Δλ₀ = (λΔn/n_eff)√(1 + (λ/(ΔnL))²).
 */
export function firstZeroBandwidth(g: UniformGrating): number {
  if (!(g.length > 0 && g.nEff > 0 && g.lambdaB > 0 && g.deltaN >= 0)) return NaN;
  const kappaL = couplingCoefficient(g.deltaN, g.lambdaB) * g.length;
  return bandWidthAtDetuning(g, Math.hypot(kappaL, Math.PI) / g.length);
}

/**
 * Full width at half the peak reflectance of a uniform grating. The main lobe falls monotonically from σ̂ = 0 to the
 * first zero, so the half-power detuning is bisected on that interval (`firstCrossing`, relative tolerance 1e-13).
 */
export function uniformFwhm(g: UniformGrating): number {
  if (!(g.length > 0 && g.nEff > 0 && g.lambdaB > 0 && g.deltaN > 0)) return NaN;
  const kappaL = couplingCoefficient(g.deltaN, g.lambdaB) * g.length;
  const half = peakReflectance(kappaL) / 2;
  const sigmaLHalf = firstCrossing((s) => uniformReflectance(kappaL, s), 0, Math.hypot(kappaL, Math.PI), half);
  return bandWidthAtDetuning(g, sigmaLHalf / g.length);
}

/** One uniform section of a piecewise-uniform grating. */
export interface GratingSection {
  /** Section length, m. */
  length: number;
  /** ac coupling coefficient, 1/m. */
  kappa: number;
  /** Local Bragg wavelength, m. */
  lambdaB: number;
}

export type Apodization = "uniform" | "gaussian";

export interface GratingProfile extends UniformGrating {
  apodization: Apodization;
  /** Gaussian apodization: FWHM of κ(z) as a fraction of the length (Erdogan's Gaussian profile). */
  gaussianFwhmFraction?: number;
  /** Linear chirp dλ_B/dz, m/m (0.1 nm/mm = 1e-7). λ_B is the value at the grating centre. */
  chirp?: number;
  /** Number of sections (each must stay much longer than the period); default `defaultSectionCount`. */
  sections?: number;
}

/**
 * Section count for the transfer-matrix model: at least 200, and enough that a chirped section's Bragg step
 * chirp·Δz stays well inside its own bandwidth ≈ λ²/(n_eff Δz), i.e. N ≥ 4L√(n_eff|chirp|)/λ_B; at most 5000, and
 * no more than one section per 20 periods.
 */
export function defaultSectionCount(p: GratingProfile): number {
  const perPeriods = Math.floor(p.length / (20 * (p.lambdaB / (2 * p.nEff))));
  const chirped = Math.ceil((4 * p.length * Math.sqrt(p.nEff * Math.abs(p.chirp ?? 0))) / p.lambdaB);
  return Math.max(1, Math.min(perPeriods, 5000, Math.max(200, chirped)));
}

/** Largest |chirp| (m/m) for which λ_B(z) stays within ±5 % of λ_B over the grating: |chirp|·L ≤ 0.1·λ_B. */
export function maxChirp(lambdaB: number, length: number): number {
  return (0.1 * lambdaB) / length;
}

/** Splits a grating into uniform sections: κ(z) from the apodization, λ_B(z) = λ_B + chirp·z, z from the centre. */
export function gratingSections(p: GratingProfile): GratingSection[] {
  const count = Math.max(1, Math.round(p.sections ?? defaultSectionCount(p)));
  const dz = p.length / count;
  const kappa0 = couplingCoefficient(p.deltaN, p.lambdaB);
  const fwhm = (p.gaussianFwhmFraction ?? 0.5) * p.length;
  const chirp = p.chirp ?? 0;
  const out: GratingSection[] = [];
  for (let i = 0; i < count; i++) {
    const z = (i + 0.5) * dz - p.length / 2;
    const envelope = p.apodization === "gaussian" ? Math.exp((-4 * Math.LN2 * z * z) / (fwhm * fwhm)) : 1;
    out.push({ length: dz, kappa: kappa0 * envelope, lambdaB: p.lambdaB + chirp * z });
  }
  return out;
}

/**
 * Power reflectance of a piecewise-uniform grating by transfer matrices (Erdogan §IV):
 * F_i = [[C − iσ̂S, −iκS], [iκS, C + iσ̂S]] with C = cosh(γΔz), S = sinh(γΔz)/γ (both real, and even in γ), and
 * r = F₂₁/F₁₁ of F = F_M⋯F₁. For one section this reproduces `uniformReflectance`. The product is rescaled when it
 * grows large; the ratio F₂₁/F₁₁ doesn't change.
 */
export function transferMatrixReflectance(sections: readonly GratingSection[], nEff: number, lambda: number): number {
  // Running product M = [[a, b], [c, d]] as complex pairs; only the first column is needed for r = M₂₁/M₁₁.
  let aRe = 1, aIm = 0, cRe = 0, cIm = 0;
  for (const s of sections) {
    const sigma = detuning(lambda, s.lambdaB, nEff);
    const gSq = (s.kappa * s.kappa - sigma * sigma) * s.length * s.length;
    // For γΔz > 20 the section matrix is divided by e^{γΔz} (r doesn't change), so cosh and sinh can't overflow.
    const g = gSq > 0 ? Math.sqrt(gSq) : 0;
    const shrink = g > 20 ? -Math.expm1(-2 * g) / 2 : 0; // (1 − e^{−2g})/2
    const C = g > 20 ? 1 - shrink : gSq >= 0 ? Math.cosh(g) : Math.cos(Math.sqrt(-gSq));
    const S = g > 20 ? (shrink / g) * s.length : sinhcOfSquare(gSq) * s.length;
    // F·[a; c]: F₁₁ = C − iσ̂S, F₁₂ = −iκS, F₂₁ = iκS, F₂₂ = C + iσ̂S.
    const sigS = sigma * S;
    const kapS = s.kappa * S;
    const naRe = C * aRe + sigS * aIm + kapS * cIm;
    const naIm = C * aIm - sigS * aRe - kapS * cRe;
    const ncRe = -kapS * aIm + C * cRe - sigS * cIm;
    const ncIm = kapS * aRe + C * cIm + sigS * cRe;
    aRe = naRe; aIm = naIm; cRe = ncRe; cIm = ncIm;
    const big = Math.max(Math.abs(aRe), Math.abs(aIm));
    if (big > 1e100) {
      aRe /= big; aIm /= big; cRe /= big; cIm /= big;
    }
  }
  const den = aRe * aRe + aIm * aIm;
  if (!(den > 0) || !Number.isFinite(den)) return NaN;
  return (cRe * cRe + cIm * cIm) / den;
}

/**
 * Full width at half maximum of a reflectance function on [lo, hi]: the peak is found on `samples` + 1 points, then
 * the outermost half-maximum crossings are bisected from each end inwards. NaN if the band runs off either end.
 */
export function spectrumFwhm(f: (lambda: number) => number, lo: number, hi: number, samples = 600): number {
  let peak = -Infinity, peakAt = lo;
  for (let i = 0; i <= samples; i++) {
    const x = lo + ((hi - lo) * i) / samples;
    const y = f(x);
    if (y > peak) { peak = y; peakAt = x; }
  }
  if (!(peak > 0)) return NaN;
  const left = firstCrossing(f, lo, peakAt, peak / 2, samples);
  const right = firstCrossing(f, hi, peakAt, peak / 2, samples);
  return right - left;
}

/** Reflection bandwidth of a linearly chirped grating, |dλ_B/dz|·L (Ouellette 1987), when it exceeds the uniform band. */
export function chirpedBandwidth(chirp: number, length: number): number {
  return Math.abs(chirp) * length;
}

/** Dispersion of a linearly chirped grating, 2n_eff/(c·dλ_B/dz), in s/m (×1e3 → ps/nm). Infinite for no chirp. */
export function chirpedGratingDispersion(nEff: number, chirp: number): number {
  return chirp === 0 ? Infinity : (2 * nEff) / (c * Math.abs(chirp));
}

/** Effective photoelastic constant p_e = (n²/2)[p₁₂ − ν(p₁₁ + p₁₂)] (Kersey 1997). */
export function effectivePhotoelastic(n: number, p11 = FIBER_P11, p12 = FIBER_P12, nu = SILICA_POISSON): number {
  return ((n * n) / 2) * (p12 - nu * (p11 + p12));
}

/** Strain gauge factor (1/λ_B)dλ_B/dε = 1 − p_e. */
export function strainGaugeFactor(n: number): number {
  return 1 - effectivePhotoelastic(n);
}

/**
 * Bragg-wavelength shift Δλ_B = λ_B[(1 − p_e)ε + K_T ΔT] (Kersey 1997), with gauge = 1 − p_e and thermal = K_T
 * (1/K). Linear in both: valid for small strains and a few tens of kelvin around the calibration temperature.
 */
export function braggShift(lambdaB: number, strain: number, deltaT: number, gauge: number, thermal: number): number {
  return lambdaB * (gauge * strain + thermal * deltaT);
}

/** Phase change of an interferometer arm of length L per unit strain, 2π n_eff L (1 − p_e)/λ (rad). */
export function phaseStrainSensitivity(lambda: number, nEff: number, length: number, gauge: number): number {
  return (2 * Math.PI * nEff * length * gauge) / lambda;
}

/** Phase change of an interferometer arm per kelvin, 2π n_eff L K_T/λ (rad/K); K_T as for the Bragg shift. */
export function phaseTemperatureSensitivity(lambda: number, nEff: number, length: number, thermal: number): number {
  return (2 * Math.PI * nEff * length * thermal) / lambda;
}
