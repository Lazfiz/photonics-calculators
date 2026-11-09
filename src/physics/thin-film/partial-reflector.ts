/**
 * Single-layer partial reflector at normal incidence: exact reflectance of one lossless film (transfer matrix,
 * equal to the two-surface Airy sum), back surface ignored (H. A. Macleod, Thin-Film Optical Filters, 4th ed.,
 * CRC Press 2010, ch. 2 and ch. 5). All lengths in m. Tier: Exact.
 */
import { quarterWaveStackReflectance, quarterWaveThickness, stackResponse } from "./transfer-matrix";

export interface PartialReflectorAtDesign {
  /** R at λ₀ of a quarter-wave film (closed form). */
  quarterWave: number;
  /** R at λ₀ of a film of `thicknessRatio` quarter waves. */
  thisFilm: number;
  /** Film thickness, thicknessRatio · λ₀/(4 n_film), m. */
  thickness: number;
}

/** Reflectances at the design wavelength λ₀ (m); `thicknessRatio` is d / (λ₀/4n). */
export function partialReflectorAtDesign(
  nFilm: number, nSub: number, nInc: number, thicknessRatio: number, lambda0: number,
): PartialReflectorAtDesign {
  const thickness = thicknessRatio * quarterWaveThickness(nFilm, lambda0);
  const thisFilm = stackResponse(
    { incident: nInc, layers: [{ n: nFilm, thickness }], substrate: { n: nSub } },
    lambda0,
  ).R;
  return { quarterWave: quarterWaveStackReflectance(nInc, [nFilm], nSub), thisFilm, thickness };
}
