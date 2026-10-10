/**
 * Diameters of a round TEM₀₀ Gaussian beam with irradiance I(r) = I₀ exp(−2r²/w²) (w is the 1/e² radius), and the
 * fraction of the power inside each. The relations are ratios, so lengths may be in any one unit (the page uses mm).
 * Model tier: exact for an ideal Gaussian profile; a real beam's FWHM or 1/e diameter differs by its profile.
 *
 * Source: Saleh & Teich, Fundamentals of Photonics, ch. 3.1 (I(ρ) ∝ exp(−2ρ²/W²)); the definitions of the 1/e and
 * 1/e² diameters are the points where I falls to I₀/e and I₀/e².
 * - 1/e² diameter d₂ = 2w.
 * - 1/e diameter: exp(−2r²/w²) = e⁻¹ at r = w/√2, so d₁ = √2·w = d₂/√2 = 0.7071 d₂.
 * - FWHM: exp(−2r²/w²) = ½ at r = w√(ln2/2), so d_FWHM = 2w√(ln2/2) = d₂√(ln2/2) = 0.5887 d₂.
 * - Power inside a circle of diameter d: 1 − exp(−2(d/2)²/w²) = 1 − exp(−d²/(2w²)): 1 − e⁻² = 86.47 % for d₂,
 *   1 − e⁻¹ = 63.21 % for d₁ and 50 % for the FWHM.
 * - IEC 60825-1 and ANSI Z136.1 define the beam diameter used in the exposure limits as the 1/e diameter (the circle
 *   holding 63 % of the power), not the 1/e² diameter that datasheets often quote.
 */

export type DiameterKind = "1e2" | "1e" | "fwhm";

/** FWHM / d(1/e²) = √(ln2/2). */
export const FWHM_PER_D1E2 = Math.sqrt(Math.LN2 / 2);

export interface GaussianDiameters {
  /** 1/e² intensity diameter 2w. */
  readonly d1e2: number;
  /** 1/e intensity diameter d₂/√2. */
  readonly d1e: number;
  /** Full width at half maximum of the intensity, d₂√(ln2/2). */
  readonly fwhm: number;
  /** 1/e² radius w, d₂/2. */
  readonly w: number;
}

/** All diameters of a Gaussian beam of 1/e² diameter d₂. NaN for d₂ ≤ 0 or non-finite. */
export function gaussianDiameters(d1e2: number): GaussianDiameters {
  if (!(Number.isFinite(d1e2) && d1e2 > 0)) return { d1e2: NaN, d1e: NaN, fwhm: NaN, w: NaN };
  return { d1e2, d1e: d1e2 / Math.SQRT2, fwhm: d1e2 * FWHM_PER_D1E2, w: d1e2 / 2 };
}

/** The 1/e² diameter of a Gaussian beam whose diameter of the given kind is `value`. NaN for value ≤ 0. */
export function d1e2From(kind: DiameterKind, value: number): number {
  if (!(Number.isFinite(value) && value > 0)) return NaN;
  if (kind === "1e2") return value;
  if (kind === "1e") return value * Math.SQRT2;
  return value / FWHM_PER_D1E2;
}

/** Normalised intensity I(r)/I₀ = exp(−2r²/w²) at radius r, for the 1/e² radius w. NaN for w ≤ 0 or r < 0. */
export function relativeIntensity(r: number, w: number): number {
  if (!(r >= 0 && w > 0)) return NaN;
  return Math.exp((-2 * r * r) / (w * w));
}

/** Fraction of the power inside a circle of diameter d, 1 − exp(−d²/(2w²)). NaN for d < 0 or w ≤ 0. */
export function powerInsideDiameter(d: number, w: number): number {
  if (!(d >= 0 && w > 0)) return NaN;
  return -Math.expm1((-d * d) / (2 * w * w));
}
