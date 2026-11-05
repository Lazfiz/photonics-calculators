/**
 * Linear thermal expansion with a constant coefficient: ΔL = α L ΔT, strain ε = α ΔT. SI units: α in 1/K, lengths in m.
 * Model tier: textbook. α itself depends on temperature (Si: 2.6e-6/K at 300 K, rising to about 4.6e-6/K at 1500 K;
 * Y. Okada, Y. Tokumaru, J. Appl. Phys. 56, 314 (1984), doi:10.1063/1.333965), so a constant α holds over tens of kelvin;
 * for wide spans integrate α(T) dT instead (silicon: `siliconExpansion` below).
 */

/** Length change ΔL = α L ΔT, m. */
export const thermalExpansion = (alpha: number, L: number, dT: number) => alpha * L * dT;

/** Range of the Okada–Tokumaru fit, K (abstract: "t … ranging from 120 to 1500 K"). */
export const SI_ALPHA_T_MIN = 120;
export const SI_ALPHA_T_MAX = 1500;

const inSiRange = (T: number) => T >= SI_ALPHA_T_MIN && T <= SI_ALPHA_T_MAX;

/**
 * Linear CTE of silicon, 1/K, at absolute temperature T (K): Okada & Tokumaru (1984), abstract,
 * α(T) = (3.725 {1 − exp[−5.88 × 10⁻³ (T − 124)]} + 5.548 × 10⁻⁴ T) × 10⁻⁶ /K, valid 120–1500 K (measured 300–1500 K);
 * their float-zone and Czochralski data lie within ±2 × 10⁻⁷ /K of it. NaN outside the range.
 */
export function siliconAlpha(T: number): number {
  if (!inSiRange(T)) return NaN;
  return (3.725 * -Math.expm1(-5.88e-3 * (T - 124)) + 5.548e-4 * T) * 1e-6;
}

/** expm1(−x)/x, → −1 as x → 0. */
const expm1Ratio = (x: number) => (x === 0 ? -1 : Math.expm1(-x) / x);

/**
 * Mean α of silicon over T1–T2 (K), 1/K, closed form: the antiderivative 10⁻⁶ [3.725 (T + e^{−c(T−124)}/c) + 2.774 × 10⁻⁴ T²]
 * differenced and divided by ΔT, written as 10⁻⁶ [3.725 (1 + e^{−c(T1−124)} expm1(−cΔT)/(cΔT)) + 2.774 × 10⁻⁴ (T1 + T2)] so
 * that a tiny ΔT doesn't cancel (the antiderivative is ≈ 6e-3, α ΔT can be 1e-18). α(T1) when T1 = T2; NaN unless both ends
 * lie in 120–1500 K.
 */
export function siliconMeanAlpha(T1: number, T2: number): number {
  if (!inSiRange(T1) || !inSiRange(T2)) return NaN;
  const c = 5.88e-3;
  return (3.725 * (1 + Math.exp(-c * (T1 - 124)) * expm1Ratio(c * (T2 - T1))) + 2.774e-4 * (T1 + T2)) * 1e-6;
}

/** ∫ α dT from T1 to T2 (K) for silicon, closed form (mean α × ΔT). */
export const siliconAlphaIntegral = (T1: number, T2: number) => siliconMeanAlpha(T1, T2) * (T2 - T1);

/**
 * Length change of silicon heated from T1 to T2 (K), m: with α = (1/L) dL/dT, L₂ = L₁ exp(∫α dT), so
 * ΔL = L₁ expm1(∫α dT). Against L₁ ∫α dT this differs by (∫α dT)²/2 ≤ 1.3e-5 relative (120 → 1500 K), inside the
 * ±1e-5 nm (2e-5 relative) by which Okada & Tokumaru's lattice parameters scatter about the fit.
 */
export const siliconExpansion = (L: number, T1: number, T2: number) => L * Math.expm1(siliconAlphaIntegral(T1, T2));

/** Length change in optical waves at wavelength λ (m). NaN for λ ≤ 0. */
export const expansionWaves = (dL: number, lambda: number) => (lambda > 0 ? dL / lambda : NaN);

export interface CteMaterial {
  name: string;
  /** Linear CTE near room temperature, 1/K. */
  alpha: number;
  type: string;
  notes: string;
  /** Where α comes from (references on the page): data sheets, Kaye & Laby's 293 K table, or the slope of a NIST fit at 293 K. */
  source: "Crystran" | "SCHOTT" | "Corning" | "Kaye & Laby" | "NIST";
}

/** Room-temperature CTEs of common optical and mount materials, sorted by α. Conventions are mixed: glasses give a mean over a range, Kaye & Laby and NIST give α at 293 K. */
export const CTE_TABLE: readonly CteMaterial[] = ([
  { name: "Fused Silica", alpha: 0.55e-6, type: "Glass", notes: "at 300 K", source: "Crystran" },
  { name: "ULE 7972", alpha: 0.03e-6, type: "Glass", notes: "Corning titania-silica; mean α specified as 0 ± 0.03, 5–35 °C (limit shown)", source: "Corning" },
  { name: "Zerodur", alpha: 0.05e-6, type: "Glass Ceramic", notes: "Expansion class 1: mean α 0 ± 0.05, 0–50 °C (limit shown); classes 0.007–0.1", source: "SCHOTT" },
  { name: "BK7", alpha: 7.1e-6, type: "Glass", notes: "Standard optical glass", source: "Crystran" },
  { name: "Pyrex (Borosilicate)", alpha: 2.8e-6, type: "Glass", notes: "at 293 K", source: "Kaye & Laby" },
  { name: "SF11", alpha: 6.1e-6, type: "Glass", notes: "High-index flint; mean −30 to +70 °C (N-SF11: 8.5)", source: "SCHOTT" },
  { name: "Sapphire ∥ c", alpha: 5.6e-6, type: "Crystal", notes: "5.0 perpendicular to the c-axis", source: "Crystran" },
  { name: "CaF₂", alpha: 18.85e-6, type: "Crystal", notes: "Large expansion, needs care", source: "Crystran" },
  { name: "Si", alpha: 2.6e-6, type: "Semiconductor", notes: "at 20 °C, increases with T (Okada–Tokumaru fit: 2.51 at 20 °C, 2.57 at 300 K)", source: "Crystran" },
  { name: "Ge", alpha: 6.1e-6, type: "Semiconductor", notes: "at 298 K", source: "Crystran" },
  { name: "ZnSe", alpha: 7.1e-6, type: "II-VI", notes: "at 273 K", source: "Crystran" },
  { name: "Aluminum 6061-T6", alpha: 22.6e-6, type: "Metal", notes: "Common mount material; at 293 K", source: "NIST" },
  { name: "Invar 36", alpha: 0.9e-6, type: "Metal", notes: "Fe-36Ni near 293 K, ± 20 % (fit slope; mean 250–300 K 1.2); heat treatment changes it (Kaye & Laby: 0.13)", source: "NIST" },
  { name: "Stainless 304", alpha: 15.4e-6, type: "Metal", notes: "at 293 K (Kaye & Laby, austenitic: 14.1)", source: "NIST" },
  { name: "Copper", alpha: 16.5e-6, type: "Metal", notes: "Heat sinks, mirrors; at 293 K", source: "Kaye & Laby" },
  { name: "Diamond", alpha: 1.0e-6, type: "Crystal", notes: "at 293 K", source: "Crystran" },
  { name: "MgF₂ ∥ c", alpha: 13.7e-6, type: "Crystal", notes: "8.9 perpendicular to the c-axis", source: "Crystran" },
] satisfies CteMaterial[]).sort((a, b) => a.alpha - b.alpha);

/** α in the table's display unit, 10⁻⁶/K, without float noise (0.05e-6 × 1e6 = 0.049999…). */
export const alphaPpm = (alpha: number) => +(alpha * 1e6).toPrecision(6);
