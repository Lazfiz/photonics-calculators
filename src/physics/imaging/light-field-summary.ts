/**
 * Light-field microscope page text: why the refocused and single-view depth of field are blank. N_u = min(W/R_obj, W/(2p))
 * (Levoy et al. 2006, doi:10.1145/1141911.1141976, eq. 3, capped by two pixels per spot), and the depth of field needs
 * N_u >= 1, which fails either because the diffraction spot is wider than the lenslet or because the lenslet is narrower
 * than two pixels. A separate module because light-field.ts is also imported by the plenoptic-camera page.
 */

import type { LightFieldMicroscopeResult } from "./light-field";

/** Smallest number of resolvable spots per lenslet that still samples an angle. */
export const MIN_ANGULAR_SPOTS = 1;

export const NO_ANGLE_DIFFRACTION =
  "The lenslet is narrower than the diffraction spot (W/R_obj < 1): it samples no angle, so there is no refocused or single-view depth of field.";
export const NO_ANGLE_PIXELS =
  "Fewer than two pixels per lenslet (W/(2p) < 1): no angular sample, so no refocused or single-view depth of field.";

/** The reason N_u < 1, chosen by its cause, or undefined when N_u >= 1 (or the design is invalid). */
export function noAngleReason(r: Pick<LightFieldMicroscopeResult, "nu" | "spotsDiffraction">): string | undefined {
  if (!(r.nu < MIN_ANGULAR_SPOTS)) return undefined;
  return r.spotsDiffraction < MIN_ANGULAR_SPOTS ? NO_ANGLE_DIFFRACTION : NO_ANGLE_PIXELS;
}
