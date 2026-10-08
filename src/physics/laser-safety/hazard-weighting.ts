/**
 * Photobiological hazard weighting functions and exposure limits for the eye. SI units: wavelength in m,
 * irradiance in W/m², radiant exposure in J/m², time in s (the tables are indexed in nm, as published).
 * Model tier: exact, i.e. the standards' tabulated values, interpolated log-linearly between table points.
 *
 * - S(λ), actinic UV, 180–400 nm: ICNIRP, "Guidelines on limits of exposure to ultraviolet radiation of
 *   wavelengths between 180 nm and 400 nm (incoherent optical radiation)", Health Phys. 87(2), 171–186 (2004),
 *   Table 1 (the same values as ACGIH and IEC 62471:2006 Table 4.1). Limits for the eye within an 8 h period:
 *   S(λ)-weighted radiant exposure ≤ 30 J/m², and unweighted 315–400 nm (UVA) radiant exposure ≤ 10⁴ J/m².
 *   (ACGIH and IEC 62471 relax the UVA limit to 10 W/m² beyond 1000 s; ICNIRP's is the stricter one.)
 * - B(λ), blue-light hazard, 300–700 nm: ICNIRP, "Guidelines on limits of exposure to incoherent visible and
 *   infrared radiation", Health Phys. 105(1), 74–96 (2013), Table 2; 500–600 nm is 10^((450 − λ)/50), as in
 *   IEC 62471:2006 Table 4.2 (which rounds 385 nm to 0.013). Small source (α < 11 mrad), eqns 15–17:
 *   H_B ≤ 100 J/m² for 0.25 s ≤ t < 100 s, E_B ≤ 1 W/m² for t ≥ 100 s. Risk groups for a small source,
 *   IEC 62471:2006 Table 6.1: Exempt 1 W/m² (10⁴ s), RG1 1 W/m² (100 s), RG2 400 W/m² (0.25 s).
 * - Laser MPE at the cornea, 180–400 nm, 10⁻⁹ s ≤ t ≤ 3×10⁴ s: IEC 60825-1:2014 Table A.1 (= ANSI Z136.1
 *   Table 5a). 180–302.5 nm: 30 J/m². 302.5–315 nm: C₁ for t < T₁, else C₂, i.e. min(C₁, C₂). 315–400 nm: C₁ to
 *   10 s, 10⁴ J/m² to 10³ s, then 10 W/m². C₁ = 5.6×10³ t^0.25 J/m², C₂ = 10^(0.2(λ − 295)) J/m² (λ in nm).
 *
 * A narrowband source of irradiance E at λ has the weighted irradiance E·S(λ) (or E·B(λ)): the sum
 * Σ E_λ S(λ) Δλ collapses to one term.
 */

type Table = readonly (readonly [number, number])[];

/** λ (m) → nm, rounded to 1 fm so that 700e-9 m is 700 nm, not 700.0000000000001. */
const toNm = (lambda: number) => Math.round(lambda * 1e15) / 1e6;

/** S(λ), relative spectral effectiveness, ICNIRP 2004 Table 1 ([nm, S]). */
const ACTINIC_UV_TABLE: Table = [
  [180, 0.012], [190, 0.019], [200, 0.030], [205, 0.051], [210, 0.075], [215, 0.095], [220, 0.120],
  [225, 0.150], [230, 0.190], [235, 0.240], [240, 0.300], [245, 0.360], [250, 0.430], [254, 0.500],
  [255, 0.520], [260, 0.650], [265, 0.810], [270, 1.000], [275, 0.960], [280, 0.880], [285, 0.770],
  [290, 0.640], [295, 0.540], [297, 0.460], [300, 0.300], [303, 0.120], [305, 0.060], [308, 0.026],
  [310, 0.015], [313, 0.006], [315, 0.003], [316, 0.0024], [317, 0.0020], [318, 0.0016], [319, 0.0012],
  [320, 0.0010], [322, 0.00067], [323, 0.00054], [325, 0.00050], [328, 0.00044], [330, 0.00041],
  [333, 0.00037], [335, 0.00034], [340, 0.00028], [345, 0.00024], [350, 0.00020], [355, 0.00016],
  [360, 0.00013], [365, 0.00011], [370, 0.000093], [375, 0.000077], [380, 0.000064], [385, 0.000053],
  [390, 0.000044], [395, 0.000036], [400, 0.000030],
];

/** B(λ) from 300 to 500 nm, ICNIRP 2013 Table 2 ([nm, B]; 0.01 throughout 300–380 nm). */
const BLUE_LIGHT_TABLE: Table = [
  [300, 0.01], [380, 0.01], [385, 0.0125], [390, 0.025], [395, 0.05], [400, 0.1], [405, 0.2], [410, 0.4],
  [415, 0.8], [420, 0.9], [425, 0.95], [430, 0.98], [435, 1], [440, 1], [445, 0.97], [450, 0.94],
  [455, 0.9], [460, 0.8], [465, 0.7], [470, 0.62], [475, 0.55], [480, 0.45], [485, 0.4], [490, 0.22],
  [495, 0.16], [500, 0.1],
];

/** Log-linear interpolation in a table sorted by x with y > 0; x must lie within the table. */
function interpolateLog(table: Table, x: number): number {
  let i = 1;
  while (i < table.length - 1 && table[i][0] < x) i++;
  const [x0, y0] = table[i - 1];
  const [x1, y1] = table[i];
  const f = (x - x0) / (x1 - x0);
  return y0 * Math.pow(y1 / y0, f);
}

/** Actinic UV weighting S(λ) at λ (m): 0 outside 180–400 nm, NaN for NaN. */
export function actinicUvWeight(lambda: number): number {
  const nm = toNm(lambda);
  if (Number.isNaN(nm)) return NaN;
  if (nm < 180 || nm > 400) return 0;
  return interpolateLog(ACTINIC_UV_TABLE, nm);
}

/** Blue-light hazard weighting B(λ) at λ (m): 0 outside 300–700 nm, NaN for NaN. */
export function blueLightWeight(lambda: number): number {
  const nm = toNm(lambda);
  if (Number.isNaN(nm)) return NaN;
  if (nm < 300 || nm > 700) return 0;
  if (nm <= 500) return interpolateLog(BLUE_LIGHT_TABLE, nm);
  if (nm <= 600) return Math.pow(10, (450 - nm) / 50);
  return 0.001;
}

/** Actinic UV limit for the eye: S(λ)-weighted radiant exposure within 8 h, J/m² (3 mJ/cm²). */
export const ACTINIC_UV_LIMIT = 30;
/** UVA (315–400 nm) limit for the eye: unweighted radiant exposure within 8 h, J/m² (1 J/cm²). */
export const UVA_EYE_LIMIT = 1e4;
/** The period the UV limits apply to, s (8 h). */
export const UV_LIMIT_PERIOD = 8 * 3600;

const isUva = (nm: number) => nm >= 315 && nm <= 400;

export interface UvHazard {
  /** S(λ). */
  S: number;
  /** S(λ)-weighted irradiance, W/m². */
  E_eff: number;
  /** Time to reach 30 J/m² effective, s. */
  tActinic: number;
  /** Time to reach 10⁴ J/m² unweighted, s; Infinity outside 315–400 nm. */
  tUva: number;
  /** The shorter of the two, s. Infinity when neither limit applies (E = 0, or λ outside 180–400 nm). */
  tMax: number;
}

/** UV hazard of a monochromatic source of irradiance E (W/m²) at λ (m), per ICNIRP 2004. NaN for E < 0. */
export function uvHazard(lambda: number, E: number): UvHazard {
  if (!(E >= 0)) return { S: NaN, E_eff: NaN, tActinic: NaN, tUva: NaN, tMax: NaN };
  const S = actinicUvWeight(lambda);
  const E_eff = E * S;
  const tActinic = E_eff > 0 ? ACTINIC_UV_LIMIT / E_eff : Infinity;
  const tUva = isUva(toNm(lambda)) && E > 0 ? UVA_EYE_LIMIT / E : Infinity;
  return { S, E_eff, tActinic, tUva, tMax: Math.min(tActinic, tUva) };
}

/** Fraction of the UV limits used by an exposure of duration t (s): ≤ 1 is within both. */
export function uvExposureFraction(lambda: number, E: number, t: number): number {
  const { E_eff } = uvHazard(lambda, E);
  if (!(t >= 0)) return NaN;
  const actinic = (E_eff * t) / ACTINIC_UV_LIMIT;
  return isUva(toNm(lambda)) ? Math.max(actinic, (E * t) / UVA_EYE_LIMIT) : actinic;
}

/** Highest unweighted irradiance, W/m², at λ (m) that stays within both UV limits for an exposure of t (s). */
export function uvMaxIrradiance(lambda: number, t: number): number {
  if (!(t > 0)) return NaN;
  const S = actinicUvWeight(lambda);
  const actinic = S > 0 ? ACTINIC_UV_LIMIT / (S * t) : Infinity;
  return isUva(toNm(lambda)) ? Math.min(actinic, UVA_EYE_LIMIT / t) : actinic;
}

/** Small-source blue-light limits: H_B for 0.25 s ≤ t < 100 s, J/m²; E_B for t ≥ 100 s, W/m². */
export const BLUE_LIGHT_SMALL_SOURCE_DOSE = 100;
export const BLUE_LIGHT_SMALL_SOURCE_IRRADIANCE = 1;

/**
 * Longest exposure, s, before a small source with blue-light weighted irradiance E_B (W/m²) reaches the limit:
 * Infinity for E_B ≤ 1 W/m², else 100 J/m² / E_B. Below 0.25 s the retinal thermal limit governs instead.
 */
export function blueLightSmallSourceMaxDuration(E_B: number): number {
  if (!(E_B >= 0)) return NaN;
  return E_B <= BLUE_LIGHT_SMALL_SOURCE_IRRADIANCE ? Infinity : BLUE_LIGHT_SMALL_SOURCE_DOSE / E_B;
}

export type RiskGroup = "Exempt" | "RG1" | "RG2" | "RG3";

/** IEC 62471 Table 6.1, small-source blue light: E_B limits, W/m². RG1's limit equals Exempt's, so no
 *  small source is RG1 on blue light alone. */
const BLUE_LIGHT_SMALL_SOURCE_GROUPS: readonly (readonly [RiskGroup, number])[] = [
  ["Exempt", 1], ["RG1", 1], ["RG2", 400],
];

/** Risk group of a small source (α < 11 mrad) from its blue-light weighted irradiance E_B (W/m²). */
export function blueLightSmallSourceRiskGroup(E_B: number): RiskGroup {
  for (const [group, limit] of BLUE_LIGHT_SMALL_SOURCE_GROUPS) if (E_B <= limit) return group;
  return "RG3";
}

/** C₁ = 5.6×10³ t^0.25, J/m² (IEC 60825-1:2014 Table 9). */
const c1 = (t: number) => 5.6e3 * Math.pow(t, 0.25);

/** Laser MPE at the cornea, J/m², for 180 nm ≤ λ ≤ 400 nm and 10⁻⁹ s ≤ t ≤ 3×10⁴ s; NaN outside. */
export function uvLaserCornealMpe(lambda: number, t: number): number {
  const nm = toNm(lambda);
  if (!(nm >= 180 && nm <= 400 && t >= 1e-9 && t <= 3e4)) return NaN;
  if (nm < 302.5) return 30;
  if (nm < 315) return Math.min(c1(t), Math.pow(10, 0.2 * (nm - 295)));
  if (t <= 10) return c1(t);
  if (t <= 1e3) return 1e4;
  return 10 * t;
}

/**
 * Longest exposure, s, before a CW irradiance E (W/m²) at λ (m) first exceeds the UV laser MPE at the cornea.
 * Infinity if it stays within the MPE for 3×10⁴ s; NaN outside 180–400 nm, for E < 0, or below 10⁻⁹ s.
 */
export function uvLaserMaxDuration(lambda: number, E: number): number {
  const nm = toNm(lambda);
  if (!(nm >= 180 && nm <= 400 && E >= 0)) return NaN;
  if (E === 0) return Infinity;
  // E·t ≤ C₁(t) ⇔ t ≤ (5.6×10³ / E)^(4/3).
  const tC1 = Math.pow(5.6e3 / E, 4 / 3);
  let t: number;
  if (nm < 302.5) t = 30 / E;
  else if (nm < 315) t = Math.min(tC1, Math.pow(10, 0.2 * (nm - 295)) / E);
  else if (tC1 <= 10) t = tC1;
  else if (E <= 10) return Infinity; // 10 W/m² holds from 10³ s on
  else t = 1e4 / E; // 10 s < t < 10³ s here
  if (t < 1e-9) return NaN;
  return t > 3e4 ? Infinity : t;
}
