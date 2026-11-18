/**
 * Adaptive-optics page summary: open-loop, modal (Zernike) and deformable-mirror fitting-limited phase variance and
 * Strehl ratio, plus the stroke a mirror needs. SI in and out (m); variances are in rad². Model tier: textbook.
 * The turbulence formulas live in `free-space-comms/turbulence` (Noll 1976 Δ_J, Hudgin 1977 κ, Parenti & Sasiela 1994
 * Strehl); this module only adds the page's dispatch, so those widely imported modules are not touched.
 */
import {
  DM_FITTING_COEFFICIENT, dmFittingVariance, nollResidual, strehlRatio, uncorrectedPhaseVariance,
} from "../free-space-comms/turbulence";

export type DmType = keyof typeof DM_FITTING_COEFFICIENT;
export const DM_TYPES: readonly DmType[] = ["continuous", "segmentedTipTilt", "segmentedPiston"];
export const DM_LABELS: Record<DmType, string> = {
  continuous: "Continuous facesheet (κ 0.28)",
  segmentedTipTilt: "Segments, piston + tip-tilt (κ 0.134)",
  segmentedPiston: "Segments, piston only (κ 1.26)",
};
/** Largest number of corrected Zernike modes J the page accepts. */
export const MAX_MODES = 1000;
/** Noll's tip-tilt-removed residual is Δ₃ (J = 3: piston and both tilts corrected). */
const TIP_TILT_REMOVED_MODES = 3;
/** The stroke row covers ±3σ of the tip-tilt-removed wavefront. */
const STROKE_SIGMAS = 3;

export interface AdaptiveOpticsSummary {
  /** Phase variances, rad². */
  openVariance: number;
  modalVariance: number;
  zonalVariance: number;
  tipTiltRemovedVariance: number;
  /** rms optical path σλ/2π, m. */
  openRms: number;
  modalRms: number;
  zonalRms: number;
  strehlOpen: number;
  strehlModal: number;
  strehlZonal: number;
  /** Actuator pitch over r₀, (D/r₀)/N. */
  pitchOverR0: number;
  /** Mirror surface stroke for ±3σ of the tip-tilt-removed wavefront, m. */
  strokeNeeded: number;
  /** True when the stroke given is below `strokeNeeded`. */
  strokeShort: boolean;
}

/**
 * wavelength in m, dr0 = D/r₀, modes = Zernike modes corrected J (rounded to an integer), actuators across the
 * pupil, dmType, stroke = mirror surface stroke in m. Everything is scaled with r₀ = 1, so D/r₀ = dr0.
 */
export function adaptiveOpticsSummary(p: {
  wavelength: number; dr0: number; modes: number; actuators: number; dmType: DmType; stroke: number;
}): AdaptiveOpticsSummary {
  const { wavelength, dr0, actuators, dmType, stroke } = p;
  const modes = Math.round(p.modes);
  const rms = (variance: number) => (Math.sqrt(variance) * wavelength) / (2 * Math.PI);
  const open = uncorrectedPhaseVariance(dr0, 1);
  const tipTiltRemoved = nollResidual(TIP_TILT_REMOVED_MODES) * dr0 ** (5 / 3);
  const modal = nollResidual(modes) * dr0 ** (5 / 3);
  const zonal = dmFittingVariance(dr0 / actuators, 1, DM_FITTING_COEFFICIENT[dmType]);
  const strokeNeeded = STROKE_SIGMAS * rms(tipTiltRemoved);
  return {
    openVariance: open,
    modalVariance: modal,
    zonalVariance: zonal,
    tipTiltRemovedVariance: tipTiltRemoved,
    openRms: rms(open),
    modalRms: rms(modal),
    zonalRms: rms(zonal),
    strehlOpen: strehlRatio(open, dr0, 1),
    strehlModal: strehlRatio(modal, dr0, 1),
    strehlZonal: strehlRatio(zonal, dr0, 1),
    pitchOverR0: dr0 / actuators,
    strokeNeeded,
    strokeShort: stroke < strokeNeeded,
  };
}
