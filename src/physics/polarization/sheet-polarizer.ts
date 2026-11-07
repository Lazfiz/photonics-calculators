/**
 * Dichroic (absorbing) polarizers: a slab whose two principal axes absorb differently, and the principal-
 * transmittance algebra of sheet polarizers. SI units (m). Model tier: exact for a plane-parallel slab at normal
 * incidence in air, light incoherent between its faces, each principal axis an eigenpolarization.
 *
 * Slab: along a principal axis the index is N = n − iκ (κ ≥ 0, e^{i(ωt − kz)} convention, `fresnel.ts`). The face
 * reflectance is R = |(1 − N)/(1 + N)|² = ((n − 1)² + κ²)/((n + 1)² + κ²), the single-pass transmittance
 * τ = exp(−αd) with α = 4πκ/λ, and summing the multiple reflections incoherently
 *   T = |t t′|² τ/(1 − R² τ²),  |t t′|² = |2/(1 + N)|² |2N/(N + 1)|² = (1 − R)² (1 + κ²/n²)
 * (the incoherent sum for a thick substrate: Macleod, Thin-Film Optical Filters, 4th ed., ch. 2; B. Harbecke, Appl.
 * Phys. B 39, 165 (1986), doi:10.1007/BF00697414, with the amplitude coefficients of both faces). The exit-face factor
 * 1 + κ²/n² appears because inside an absorbing medium the forward and backward waves' power fluxes don't simply add at
 * the face; 1 − R is the entrance transmittance only. It is 1 + 3 × 10⁻⁶ for κ = 3 × 10⁻³, n = 1.64, and matters for
 * metal-like κ. Without absorption this is the pile-of-plates sum of `reflection-polarizers.ts`.
 * Computed as ln T = 2 ln(1 − R) + ln(1 + κ²/n²) + ln τ − ln(1 − R²τ²), so a blocked axis with T ≈ 10⁻⁴⁰⁰ still has a
 * finite extinction ratio in dB.
 *
 * Principal transmittances (Shurcliff, Polarized Light, 1962, ch. 3): k₁ along the pass axis, k₂ along the block
 * axis. Unpolarized light through one sheet: (k₁ + k₂)/2; two sheets with parallel axes: H₀ = (k₁² + k₂²)/2; crossed:
 * H₉₀ = k₁k₂. Extinction ratio k₁/k₂; polarizing efficiency (k₁ − k₂)/(k₁ + k₂) = tanh((ln k₁ − ln k₂)/2), the
 * degree of polarization of the light one sheet passes.
 */

const LN10 = Math.LN10;

/** Normal-incidence reflectance of one face of a medium N = n − iκ in air. */
export function faceReflectance(n: number, kappa: number): number {
  if (!(n > 0) || !(kappa >= 0)) return NaN;
  return ((n - 1) ** 2 + kappa ** 2) / ((n + 1) ** 2 + kappa ** 2);
}

/** ln T of a slab with face reflectance R (0 ≤ R < 1) and single-pass ln τ ≤ 0, incoherent multiple reflections, κ ≪ n. */
export function slabLogTransmittanceFrom(R: number, lnTau: number): number {
  if (!(R >= 0 && R < 1) || !(lnTau <= 0)) return NaN;
  return 2 * Math.log1p(-R) + lnTau - Math.log1p(-R * R * Math.exp(2 * lnTau));
}

/**
 * ln T of a slab of thickness d (m) and index n − iκ at vacuum wavelength λ (m), normal incidence in air. Assumes d ≫ λ
 * (incoherent faces): below d ≈ 0.02λ the sum exceeds 1 for metal-like κ, where a thin film's coherent T applies.
 */
export function slabLogTransmittance(n: number, kappa: number, d: number, lambda: number): number {
  if (!(n > 0) || !(d >= 0) || !(lambda > 0)) return NaN;
  // log1p((κ/n)²): the exit-face factor 1 + κ²/n² (see the header).
  return slabLogTransmittanceFrom(faceReflectance(n, kappa), (-4 * Math.PI * kappa * d) / lambda) + Math.log1p((kappa / n) ** 2);
}

/** Internal (single-pass) ln τ from a decadic absorbance A = −log₁₀ τ. */
export const lnTauFromAbsorbance = (A: number) => -LN10 * A;

export interface SheetMetrics {
  k1: number;
  k2: number;
  /** Unpolarized light through one sheet, (k₁ + k₂)/2. */
  single: number;
  /** Two sheets, axes parallel, (k₁² + k₂²)/2. */
  parallel: number;
  /** Two sheets, axes crossed, k₁k₂. */
  crossed: number;
  /** 10 log₁₀(k₁/k₂), from the logs. */
  extinctionDb: number;
  /** (k₁ − k₂)/(k₁ + k₂). */
  efficiency: number;
  /** log₁₀ k₂ and log₁₀ H₉₀, finite even when k₂ underflows. */
  log10K2: number;
  log10Crossed: number;
}

/** Sheet figures from the logs of the principal transmittances (ln k₁ ≥ ln k₂ for the pass axis first). */
export function sheetMetrics(lnK1: number, lnK2: number): SheetMetrics {
  const k1 = Math.exp(lnK1), k2 = Math.exp(lnK2);
  return {
    k1,
    k2,
    single: (k1 + k2) / 2,
    parallel: (k1 * k1 + k2 * k2) / 2,
    crossed: Math.exp(lnK1 + lnK2),
    extinctionDb: (10 / LN10) * (lnK1 - lnK2),
    efficiency: Math.tanh((lnK1 - lnK2) / 2),
    log10K2: lnK2 / LN10,
    log10Crossed: (lnK1 + lnK2) / LN10,
  };
}

