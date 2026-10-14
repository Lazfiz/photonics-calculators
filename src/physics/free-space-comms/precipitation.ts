/**
 * Attenuation of a free-space optical beam by rain and snow. SI units: rates in m/s (liquid-water depth per second),
 * path lengths and wavelengths in m, specific attenuations in dB/m, path attenuations in dB. The empirical laws are
 * stated in mm/h and dB/km; the conversions sit at the edge of each function. Model tier: textbook approximation
 * (empirical power laws).
 *
 * Rain (Rec. ITU-R P.1814-1 (09/2025), §§ 4.1.2.2 and 4.2.3). Raindrops (0.1–4 mm) are much larger than the
 * wavelength, so the specific attenuation is wavelength-independent in the 0.78–0.85 and 1.52–1.60 µm bands:
 *   γ_rain = k R^α  dB/km, R in mm/h                                        (eq. 11)
 * with k, α fitted to Mie theory over a gamma drop-size distribution of shape µ (Table 4; measured µ mostly −2…2).
 * Path attenuation for L ≤ 5 km (L in km):
 *   A′ = γ_rain L F,  F = 1 / (1 + L (R − 6.2)/2623)                          (eqs. 14, 15)
 *   A = A′ − G_ms,    G_ms = a_ms L^b_ms  dB                                 (eqs. 16, 17)
 *   a_ms = p₀ + p₁ ln R + p₂ (ln R)²,  b_ms = k₀ + k₁ ln R + k₂ (ln R)²       (eqs. 18, 19; Table 5)
 * G_ms is the power that forward and multiple scattering return to the receiver. The Recommendation states no rate
 * range for the fit. Below ≈ 1 mm/h the quadratic in ln R misbehaves: G_ms < 0 (µ = −2, −1, 2), or G_ms grows as
 * R → 0 (µ = 0, 1) and can exceed A′, whereas forward scattering must vanish with the rain. So below R₀ = 1 mm/h the
 * path attenuation scales the gain with the loss, G_ms(R) = max(G_ms(R₀), 0)·A′(R)/A′(R₀) (our choice, continuous at
 * R₀), and everywhere clamps it to [0, A′]. At 25 mm/h, 1 km, µ = 0: γ = 10.26 dB/km, F = 0.9929, G_ms = 0.097 dB,
 * A = 10.09 dB.
 * The older Carbonneau law, γ = 1.076 R^0.67 dB/km (France; as tabulated in H. Kaushal, G. Kaddoum, arXiv:1506.04836
 * (2015), Table IV), gives 9.30 dB/km at 25 mm/h, near the µ = −1 row (9.37).
 *
 * Snow (empirical, TU Graz group; M. S. Awan, PhD thesis, TU Graz (2010), eq. (3.29), citing M. S. Awan et al., WOCN
 * 2009, doi:10.1109/WOCN.2009.5010571; reproduced, rounded, by Kaushal & Kaddoum (2015), eqs. (4)–(5)):
 *   γ_snow = a S^b  dB/km, S in mm/h, λ in nm
 *   dry snow  a = 5.42·10⁻⁵ λ + 5.4958776,  b = 1.38
 *   wet snow  a = 1.023·10⁻⁴ λ + 3.7855466, b = 0.72
 * Kaushal & Kaddoum print a = 5.42·10⁻⁵ + 5.49 (the λ is lost); Awan states λ in nm. Neither source defines S beyond
 * "the precipitation rate recorded at meteorological stations"; we read it as the liquid-water-equivalent rate, which
 * fits better than snow depth: 5 mm/h of dry snow gives 51 dB/km, the extinction of a 0.33 km visibility (3.912/V),
 * i.e. heavy snow, whereas 5 mm/h of snow depth (≈ 0.5 mm/h of water) is light snow.
 * The λ term changes a by under 3 % from 780 to 1600 nm.
 */

/** 1 mm/h of rain or water-equivalent snow, in m/s. */
export const MM_PER_HOUR = 1e-3 / 3600;
/** Longest path for the ITU-R P.1814-1 rain path model, m. */
export const RAIN_PATH_MAX = 5000;
/** Rain rate below which the G_ms fit is replaced by a gain proportional to A′, m/s (1 mm/h). */
export const RAIN_GAIN_MIN_RATE = MM_PER_HOUR;
/** Wavelength bands in which ITU-R P.1814-1 states rain attenuation is wavelength-independent, m. */
export const RAIN_BANDS = [[780e-9, 850e-9], [1520e-9, 1600e-9]] as const;

/** Gamma drop-size-distribution shape parameters tabulated by ITU-R P.1814-1. */
export type RainShape = -2 | -1 | 0 | 1 | 2;
export const RAIN_SHAPES: readonly RainShape[] = [-2, -1, 0, 1, 2];

/** ITU-R P.1814-1 Table 4 (k, α) and Table 5 (p₀, p₁, p₂, k₀, k₁, k₂), by µ. */
const RAIN_COEFFICIENTS: Record<RainShape, { k: number; alpha: number; p: readonly number[]; q: readonly number[] }> = {
  [-2]: { k: 2.2838, alpha: 0.405, p: [0.010012, 0.025381, -0.001606], q: [0.250329, -0.035278, 0.008349] },
  [-1]: { k: 1.5921, alpha: 0.5506, p: [0.014551, 0.010932, 0.001532], q: [0.279336, 0.023974, 0.004421] },
  [0]: { k: 1.2924, alpha: 0.6436, p: [0.01594, -0.001476, 0.008297], q: [0.117663, 0.029602, 0.002142] },
  [1]: { k: 1.1394, alpha: 0.7057, p: [0.023468, 0.002897, 0.008912], q: [0.090689, 0.034955, 0.004583] },
  [2]: { k: 1.0505, alpha: 0.7497, p: [-0.000316, 0.062233, -0.007835], q: [0.192092, -0.081869, 0.033669] },
};

/** Power-law coefficients k (dB/km per (mm/h)^α) and α of the specific rain attenuation for shape µ. */
export function rainPowerLaw(mu: RainShape = 0): { k: number; alpha: number } {
  const { k, alpha } = RAIN_COEFFICIENTS[mu];
  return { k, alpha };
}

/** Specific rain attenuation γ_rain, dB/m, for rain rate R (m/s). NaN for R < 0. */
export function rainSpecificAttenuation(rate: number, mu: RainShape = 0): number {
  if (!(rate >= 0)) return NaN;
  const { k, alpha } = RAIN_COEFFICIENTS[mu];
  return (k * (rate / MM_PER_HOUR) ** alpha) / 1000;
}

/** Path reduction factor F_rain for rate R (m/s) over length L (m). NaN for negative inputs or a non-positive denominator. */
export function rainPathReduction(rate: number, length: number): number {
  if (!(rate >= 0) || !(length >= 0)) return NaN;
  const d = 1 + ((length / 1000) * (rate / MM_PER_HOUR - 6.2)) / 2623;
  return d > 0 ? 1 / d : NaN;
}

/** Multiple-scattering gain G_ms, dB, for rate R (m/s) over length L (m). 0 for R = 0 or L = 0. */
export function rainMultipleScatteringGain(rate: number, length: number, mu: RainShape = 0): number {
  if (!(rate >= 0) || !(length >= 0)) return NaN;
  if (rate === 0 || length === 0) return 0;
  const { p, q } = RAIN_COEFFICIENTS[mu];
  const x = Math.log(rate / MM_PER_HOUR);
  const a = p[0] + p[1] * x + p[2] * x * x;
  const b = q[0] + q[1] * x + q[2] * x * x;
  return a * (length / 1000) ** b;
}

export interface RainPathResult {
  /** Specific attenuation, dB/m. */
  specific: number;
  /** Path reduction factor F_rain. */
  reduction: number;
  /** A′ = γ L F, dB. */
  reduced: number;
  /** Multiple-scattering gain from the fit, eq. (17), dB (may be < 0 or > A′ below 1 mm/h). */
  gainFit: number;
  /** Gain applied: tapered below 1 mm/h and clamped to [0, A′], dB. */
  gain: number;
  /** A = A′ − gain, dB. */
  attenuation: number;
}

/** ITU-R P.1814-1 path attenuation due to rain for rate R (m/s), length L (m) and shape µ. */
export function rainPathAttenuation(rate: number, length: number, mu: RainShape = 0): RainPathResult {
  const specific = rainSpecificAttenuation(rate, mu);
  const reduction = rainPathReduction(rate, length);
  const reduced = specific * length * reduction;
  const gainFit = rainMultipleScatteringGain(rate, length, mu);
  let gain = gainFit;
  if (rate < RAIN_GAIN_MIN_RATE && reduced > 0) {
    const r0 = RAIN_GAIN_MIN_RATE;
    const reduced0 = rainSpecificAttenuation(r0, mu) * length * rainPathReduction(r0, length);
    gain = (Math.max(rainMultipleScatteringGain(r0, length, mu), 0) * reduced) / reduced0;
  }
  gain = Math.min(Math.max(gain, 0), reduced);
  const attenuation = Number.isFinite(reduced) && Number.isFinite(gainFit) ? reduced - gain : NaN;
  return { specific, reduction, reduced, gainFit, gain, attenuation };
}

export type SnowType = "dry" | "wet";

/** Snow power-law coefficients a (dB/km per (mm/h)^b) and b at wavelength λ (m). */
export function snowPowerLaw(lambda: number, type: SnowType): { a: number; b: number } {
  const nm = lambda * 1e9;
  return type === "dry" ? { a: 5.42e-5 * nm + 5.4958776, b: 1.38 } : { a: 1.023e-4 * nm + 3.7855466, b: 0.72 };
}

/** Specific snow attenuation γ_snow, dB/m, for water-equivalent rate S (m/s) at λ (m). NaN for S < 0 or λ ≤ 0. */
export function snowSpecificAttenuation(rate: number, lambda: number, type: SnowType): number {
  if (!(rate >= 0) || !(lambda > 0)) return NaN;
  const { a, b } = snowPowerLaw(lambda, type);
  return (a * (rate / MM_PER_HOUR) ** b) / 1000;
}
