/**
 * 3D reconstruction page: resolution of widefield, confocal and light-sheet stacks, and the size of the voxel stack.
 * SI units in and out. Model tier: textbook approximation (scalar theory, uniformly filled pupil, no aberrations;
 * the confocal values use equal excitation and emission wavelengths). The physics is in the confocal, diffraction-psf,
 * light-sheet and optical-sectioning-thickness modules; this module holds the method dispatch and the stack arithmetic.
 * Sampling rule of thumb: pixel and z-step at most FWHM/2 (about Nyquist, C. E. Shannon, Proc. IRE 37, 10 (1949)).
 */
import { confocalAxialFwhm, confocalLateralFwhm } from "./confocal";
import { airyFwhm } from "./diffraction-psf";
import { effectiveAxialFwhm, gaussianSheetFwhm, gaussianSheetRayleighRange } from "./light-sheet";
import { axialPsfFwhm } from "./optical-sectioning-thickness";

export const RECONSTRUCTION_METHODS = ["widefield", "confocal", "lightsheet"] as const;
export type ReconstructionMethod = (typeof RECONSTRUCTION_METHODS)[number];

/** Bytes per voxel of the stack (16-bit). */
export const BYTES_PER_VOXEL = 2;

/** Lateral and axial FWHM (m) of each method. */
export function methodResolution(
  method: ReconstructionMethod, lambda: number, n: number, na: number, pinholeAU: number, sheetNA: number,
) {
  if (method === "confocal") {
    return { lateral: confocalLateralFwhm(lambda, na, pinholeAU), axial: confocalAxialFwhm(lambda, n, na, pinholeAU) };
  }
  const detection = axialPsfFwhm(lambda, n, na);
  return {
    lateral: airyFwhm(lambda, na),
    axial: method === "widefield" ? detection : effectiveAxialFwhm(gaussianSheetFwhm(lambda, sheetNA), detection),
  };
}

export interface ReconstructionSummary {
  lateral: number;
  axial: number;
  /** Light-sheet length 2 z_R, m (defined for every method; the page shows it for the light sheet). */
  sheetLength: number;
  pixelsPerSide: number;
  totalVoxels: number;
  volumeBytes: number;
  /** XY pixel at most half the lateral FWHM. */
  xyOk: boolean;
  /** Z-step at most half the axial FWHM. */
  zOk: boolean;
}

/** All lengths in m; `numSlices` is rounded to an integer. */
export function reconstructionSummary(
  method: ReconstructionMethod, numSlices: number, sliceSpacing: number, xyPixel: number, na: number, lambda: number,
  n: number, pinholeAU: number, sheetNA: number, fov: number,
): ReconstructionSummary {
  const res = methodResolution(method, lambda, n, na, pinholeAU, sheetNA);
  const slices = Math.round(numSlices);
  const pixelsPerSide = Math.round(Number((fov / xyPixel).toPrecision(12)));
  const totalVoxels = slices * pixelsPerSide * pixelsPerSide;
  return {
    lateral: res.lateral,
    axial: res.axial,
    sheetLength: 2 * gaussianSheetRayleighRange(lambda, sheetNA, n),
    pixelsPerSide,
    totalVoxels,
    volumeBytes: totalVoxels * BYTES_PER_VOXEL,
    xyOk: xyPixel <= res.lateral / 2,
    zOk: sliceSpacing <= res.axial / 2,
  };
}
