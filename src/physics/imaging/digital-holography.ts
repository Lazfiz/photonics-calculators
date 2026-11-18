/*
 * Digital-holography page summary: sensor size, numerical aperture, Fresnel reconstruction grid, resolution, depth of
 * focus and in-line sampling limit for an N × N sensor of pitch Δx at distance z, from the formulas in `holography.ts`
 * (U. Schnars & W. Jüptner (2002), Meas. Sci. Technol. 13, R85–R101, doi:10.1088/0957-0233/13/9/201).
 * A separate module because `holography.ts` is also imported by the computer-generated-holography page.
 */

import {
  depthOfFocus, fresnelNumber, fresnelReconstructionPitch, hologramEffectiveNA, hologramNA, inlineMinDistance, maxInterferenceAngle, replayField,
} from "./holography";

export interface HologramSummary {
  /** Sensor side NΔx, m. */
  sensorSize: number;
  /** sin(atan(NΔx/2z)). */
  na: number;
  /** min(NA, λ/2Δx). */
  naEff: number;
  /** Fresnel reconstruction pixel λz/(NΔx), m. */
  pitch: number;
  /** Resolution λ/(2NA_eff), m. */
  resolution: number;
  /** Reconstructed field λz/Δx, m. */
  field: number;
  /** Depth of focus λ/NA_eff², m. */
  depthOfFocus: number;
  /** Largest reference angle 2 arcsin(λ/4Δx), rad. */
  maxAngle: number;
  /** Fresnel number (D/2)²/(λz). */
  fresnelNumber: number;
  /** Shortest in-line distance Δx(NΔx + D)/λ, m. */
  inlineMinDistance: number;
  /** Distance NΔx²/λ where the Fresnel image pixel equals the sensor pixel, m. */
  matchedDistance: number;
  /** Whether z ≥ the shortest in-line distance. */
  sampled: boolean;
}

/** All lengths in m (λ, Δx, z, D); N is the pixel count per axis. */
export function hologramSummary(lambda: number, N: number, dx: number, z: number, objectSize: number): HologramSummary {
  const na = hologramNA(N, dx, z);
  const naEff = hologramEffectiveNA(lambda, N, dx, z);
  const zMin = inlineMinDistance(lambda, N, dx, objectSize);
  return {
    sensorSize: N * dx,
    na,
    naEff,
    pitch: fresnelReconstructionPitch(lambda, z, N, dx),
    resolution: lambda / (2 * naEff),
    field: replayField(lambda, z, dx),
    depthOfFocus: depthOfFocus(lambda, naEff),
    maxAngle: maxInterferenceAngle(lambda, dx),
    fresnelNumber: fresnelNumber(objectSize * 0.5, lambda, z),
    inlineMinDistance: zMin,
    matchedDistance: inlineMinDistance(lambda, N, dx, 0),
    sampled: z >= zMin,
  };
}
