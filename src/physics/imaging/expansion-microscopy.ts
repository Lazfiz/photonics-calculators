/*
 * Expansion-microscopy page summary (lengths in m): optical term d/E, label displacement L = √(probe² + linker²),
 * the label term as it enters the resolution, the effective resolution for the chosen and for the other labelling
 * moment, and the field of view, expanded gel thickness and volume factors that follow from isotropic expansion by E
 * (A. T. Wassie, Y. Zhao, E. S. Boyden, Nat. Methods 16, 33 (2019), doi:10.1038/s41592-018-0219-4).
 * A separate module because `super-resolution.ts` has other importers.
 */

import { expansionEffectiveResolution } from "./super-resolution";

export type ExpansionLabelling = "pre" | "post";

export interface ExpansionSummary {
  opticalTerm: number;
  labelDisplacement: number;
  labelTerm: number;
  effective: number;
  effectiveOther: number;
  /** Linear field of view as a fraction of the unexpanded one, 1/E. */
  fovLinear: number;
  /** Area field of view fraction, 1/E². */
  fovArea: number;
  /** Expanded gel thickness E × gel, m. */
  expandedGel: number;
  /** Volume to image relative to the unexpanded sample, E³. */
  volumeFactor: number;
}

export function expansionSummary(
  resolution: number, expansion: number, probe: number, linker: number, labelling: ExpansionLabelling, gelThickness: number,
): ExpansionSummary {
  if (!(expansion >= 1)) {
    return {
      opticalTerm: NaN, labelDisplacement: NaN, labelTerm: NaN, effective: NaN, effectiveOther: NaN,
      fovLinear: NaN, fovArea: NaN, expandedGel: NaN, volumeFactor: NaN,
    };
  }
  const other: ExpansionLabelling = labelling === "pre" ? "post" : "pre";
  const L = Math.hypot(probe, linker);
  return {
    opticalTerm: resolution / expansion,
    labelDisplacement: L,
    labelTerm: labelling === "post" ? L / expansion : L,
    effective: expansionEffectiveResolution(resolution, expansion, probe, linker, labelling),
    effectiveOther: expansionEffectiveResolution(resolution, expansion, probe, linker, other),
    fovLinear: 1 / expansion,
    fovArea: 1 / (expansion * expansion),
    expandedGel: gelThickness * expansion,
    volumeFactor: expansion ** 3,
  };
}
