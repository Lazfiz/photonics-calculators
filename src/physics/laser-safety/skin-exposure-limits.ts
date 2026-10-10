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
 *   100 µm (Table 8).
 * Not modelled: Table 7 note b, comparing the actual (unaveraged) exposure for beams narrower than 1 mm.
 * The anterior-eye limit in `eye-exposure-limits.ts` is twice this one from 1150 to 1400 nm (Table 5 note d).
 */
import { correctionCA, eyeLimits, fixedAperture, T_MAX, T_MIN, type Piece, type TabulatedLimit } from "./eye-exposure-limits";

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
  const apertures = fixedAperture(nm < 1e5 ? 3.5e-3 : 11e-3);
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
