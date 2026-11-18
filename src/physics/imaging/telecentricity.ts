/**
 * Telecentricity page: chief-ray angle, magnification change and edge shift for an ordinary and a telecentric lens,
 * and the depth of field. SI units in and out (lengths in m, angles in rad). Model tier: textbook (paraxial chief ray,
 * blur centroid followed; see telecentric.ts). Depth of field: Inoué and Spring, Microscope Image Formation (1997).
 */
import { inoueDepthOfField } from "./optical-sectioning-thickness";
import { chiefRayAngle, magnificationChange, pupilDistanceFromSlope } from "./telecentric";

export interface TelecentricityInputs {
  /** |m| */ magnification: number;
  /** Object-side NA. */ NA: number;
  /** m */ lambda: number;
  /** Acceptable blur at the sensor, m. */ blur: number;
  /** Object field height, m. */ fieldHeight: number;
  /** Entrance pupil distance of the ordinary lens, m. */ pupilDistance: number;
  /** Object displacement, m (+ away from the lens). */ dz: number;
  /** Residual chief-ray slope of the telecentric lens at the field edge, rad. */ slope: number;
}

export interface TelecentricitySummary {
  /** Chief-ray angle of the ordinary lens at the field edge, rad. */
  chiefAngle: number;
  ordinary: number;
  /** Edge image shift of the ordinary lens, m. */
  ordinaryShift: number;
  /** Equivalent entrance pupil distance h/tan θ_t, m; Infinity for zero slope. */
  teleDistance: number;
  telecentric: number;
  /** Edge image shift of the telecentric lens, m. */
  teleShift: number;
  dofWave: number;
  dofDetector: number;
  dofTotal: number;
  /** |Δz| exceeds half the total depth of field. */
  outOfFocus: boolean;
}

export function telecentricitySummary(i: TelecentricityInputs): TelecentricitySummary {
  const teleDistance = pupilDistanceFromSlope(i.fieldHeight, i.slope);
  const ordinary = magnificationChange(i.dz, i.pupilDistance);
  const telecentric = magnificationChange(i.dz, teleDistance);
  const dof = inoueDepthOfField(i.lambda, 1, i.NA, i.blur, i.magnification);
  return {
    chiefAngle: chiefRayAngle(i.fieldHeight, i.pupilDistance),
    ordinary,
    // Image-side shift of the field edge, m·h·Δm/m.
    ordinaryShift: i.magnification * i.fieldHeight * ordinary,
    teleDistance,
    telecentric,
    teleShift: i.magnification * i.fieldHeight * telecentric,
    dofWave: dof.wave,
    dofDetector: dof.detector,
    dofTotal: dof.total,
    outOfFocus: Math.abs(i.dz) > dof.total / 2,
  };
}
