/**
 * Exposure limit (EL, the MPE) of the skin for a CW laser beam or a single pulse. SI units: wavelength in m, time in s,
 * area in m², irradiance in W/m², radiant exposure in J/m². Model tier: exact, i.e. the tabulated limit.
 *
 * Source: ICNIRP, "Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm",
 * Health Phys. 105(3), 271–295 (2013), Table 7 and Table 8 (apertures). From 1 ns to 30 ks:
 * - 180–400 nm and 1400 nm – 1 mm: the same limit as the eye (Table 5), from `eye-exposure-limits.ts`.
 * - 400–1400 nm: 200 C_A J/m² to 100 ns, 1.1×10⁴ C_A t^0.25 J/m² to 10 s, then 2.0×10³ C_A W/m².
 * - Above 1400 nm, beyond 10 s, on a large area A (Table 7 note c): 1000 W/m² up to 0.01 m², 10/A W/m² to 0.1 m²,
 *   then 100 W/m².
 * - Averaged over a 3.5 mm aperture at every duration (the eye's 1 mm → 3.5 mm ramp doesn't apply), 11 mm from
 *   100 µm (Table 8). Table 7 note b: "For beam diameters less than 1 mm, the actual radiant exposure, i.e., not
 *   averaged over of the limiting aperture of 3.5 mm, should be compared", at every duration; the 1/e diameter (p. 288),
 *   so a Gaussian beam with d/√2 < 1 mm is held to its peak 8P/(πd²) (`comparedIrradiance`), up to 98× its 3.5 mm
 *   average at d = 0.5 mm.
 * The anterior-eye limit in `eye-exposure-limits.ts` is this one at 400–700 nm and twice it at 700–1400 nm (Table 5
 * note d).
 */
import {
  ACTUAL_EXPOSURE_BELOW, correctionCA, exposureLimit, eyeLimits, fixedAperture, limitIrradiance, limitingAperture, limitMaxPower, T_MAX, T_MIN, type AperturePiece, type Piece, type TabulatedLimit,
} from "./eye-exposure-limits";

export interface SkinLimit extends TabulatedLimit {
  readonly kind: "skin";
}

/** λ (m) → nm, rounded to 1 fm, as in `eye-exposure-limits.ts`. */
const toNm = (lambda: number) => Math.round(lambda * 1e15) / 1e6;

/**
 * The skin limit at λ (m), 180 nm ≤ λ ≤ 1 mm, for an exposed area A (m², only used above 1400 nm); null outside or for
 * A < 0.
 */
export function skinLimit(lambda: number, exposedArea = 0): SkinLimit | null {
  const nm = toNm(lambda);
  if (!(nm >= 180 && nm <= 1e6 && exposedArea >= 0)) return null;
  const apertures: AperturePiece[] = nm < 1e5 ? [{ ...fixedAperture(3.5e-3)[0], actualBelow: ACTUAL_EXPOSURE_BELOW }] : fixedAperture(11e-3);
  if (nm >= 400 && nm < 1400) {
    const ca = correctionCA(lambda);
    const pieces: Piece[] = [
      { t0: T_MIN, t1: 1e-7, a: 200 * ca, p: 0 },
      { t0: 1e-7, t1: 10, a: 1.1e4 * ca, p: 0.25 },
      { t0: 10, t1: T_MAX, a: 2e3 * ca, p: 1 },
    ];
    return { kind: "skin", pieces, apertures };
  }
  const eye = eyeLimits(lambda)[0].pieces;
  if (nm < 400) return { kind: "skin", pieces: eye, apertures };
  // Large-area rule for the 10 s – 30 ks irradiance piece: 1000 W/m² × clamp(0.01 m² / A, 0.1, 1).
  const areaFactor = Math.min(1, Math.max(0.1, 0.01 / exposedArea));
  const pieces = eye.map((s) => (s.t0 >= 10 && s.p === 1 ? { ...s, a: s.a * areaFactor } : s));
  return { kind: "skin", pieces, apertures };
}

export interface SkinMpeResult {
  /** Skin limit H at t, J/m². */
  H: number;
  /** Averaging aperture, m. */
  D: number;
  /** Beam irradiance the limit compares (3.5 mm average, or the peak for d/√2 < 1 mm), W/m². */
  E: number;
  /** Largest power within the limit at every duration up to t, W. */
  pMax: number;
  /** P / pMax. */
  ratio: number;
}

/**
 * The page's skin-limit evaluation for a round Gaussian beam: power P (W), 1/e² diameter d (m), exposure t (s, clamped
 * to 1 ns – 30 ks) at wavelength λ (m). The exposed area for the large-area rule is the area inside the 1/e² diameter.
 * Null outside 180 nm – 1 mm.
 */
export function skinMpeResult(lambda: number, P: number, d: number, t: number): SkinMpeResult | null {
  const tc = Math.min(Math.max(t, T_MIN), T_MAX);
  const limit = skinLimit(lambda, (Math.PI * d * d) / 4);
  if (!limit) return null;
  const pMax = limitMaxPower(limit, d, tc);
  return { H: exposureLimit(limit, tc), D: limitingAperture(limit, tc), E: limitIrradiance(limit, P, d, tc), pMax, ratio: P / pMax };
}
