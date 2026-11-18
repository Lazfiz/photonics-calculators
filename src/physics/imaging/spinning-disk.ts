/**
 * Spinning-disk confocal page: pinhole size in Airy units, section FWHMs, crosstalk floor, frame rate and banding.
 * SI units in and out (lengths in m, times in s). Model tier: textbook approximation; the physics is in the confocal and
 * optical-sectioning-thickness modules (scalar paraxial theory, square lattice of mutually incoherent beams).
 * Frame rate: Tanaami et al., Appl. Opt. 41, 4704 (2002). Crosstalk: Egner, Andresen, Hell, J. Microsc. 206, 24 (2002).
 */
import {
  CONFOCAL_MAX_PINHOLE_AU, SPINNING_DISK_MAX_PITCH_AU, confocalAxialCoordinate, confocalLateralFwhm,
  confocalOpticalSectionFwhm, pinholeAiryUnits, pinholeFillFactor, pinholeThroughput, spinningDiskFrameRate,
  spinningDiskSection, type SpinningDiskSection,
} from "./confocal";
import { airyUnit, confocalSectionFwhm } from "./optical-sectioning-thickness";

/** Smallest pinhole (Airy units) for which Wilhelm's geometric formula is shown. */
export const SPINNING_DISK_WILHELM_MIN_AU = 1;
/** Banding depth above which the page warns that the exposure is not a whole number of scans. */
export const SPINNING_DISK_BANDING_LIMIT = 0.01;
/** Crosstalk floor above which the page colours it as a warning (fraction). */
export const SPINNING_DISK_FLOOR_WARN = 0.05;

export interface SpinningDiskInputs {
  /** m */ lambda: number;
  NA: number;
  /** Refractive index of the immersion medium. */
  n: number;
  /** Magnification to the disk. */
  magnification: number;
  /** Pinhole diameter on the disk, m. */
  pinholeDiameter: number;
  /** Pinhole pitch on the disk, m. */
  pitch: number;
  /** Disk speed, rev/s (SI). */
  revPerSecond: number;
  scansPerRevolution: number;
  /** Camera exposure, s. */
  exposure: number;
}

export interface SpinningDiskSummary {
  airyObject: number;
  pinholeAU: number;
  pitchAU: number;
  throughput: number;
  /** NaN above CONFOCAL_MAX_PINHOLE_AU. */
  lateral: number;
  /** NaN above CONFOCAL_MAX_PINHOLE_AU. */
  section: number;
  /** NaN below SPINNING_DISK_WILHELM_MIN_AU. */
  wilhelm: number;
  /** Disk section FWHM with crosstalk, m; NaN above the pitch limit, for pinhole > pitch, or floor ≥ ½. */
  diskSection: number;
  /** Crosstalk floor, fraction; NaN for pinhole > pitch. */
  floor: number;
  frameRate: number;
  /** Open area fraction; NaN for pinhole > pitch. */
  fill: number;
  /** Illuminated time per point, s; NaN for pinhole > pitch. */
  illuminated: number;
  scansPerExposure: number;
  /** Depth of the stripes; 1 when nothing is scanned during the exposure. */
  bandingDepth: number;
  banding: boolean;
  pinholeTooBig: boolean;
  widePitch: boolean;
  /** Defocus (m) per unit of the optical coordinate u. */
  zPerU: number;
  model: SpinningDiskSection;
}

export function spinningDiskSummary(i: SpinningDiskInputs): SpinningDiskSummary {
  const airyObject = airyUnit(i.lambda, i.NA);
  const pinholeAU = pinholeAiryUnits(i.pinholeDiameter, i.magnification, i.lambda, i.NA);
  const pitchAU = pinholeAiryUnits(i.pitch, i.magnification, i.lambda, i.NA);
  const frameRate = spinningDiskFrameRate(60 * i.revPerSecond, i.scansPerRevolution);
  const fill = pinholeFillFactor(i.pinholeDiameter, i.pitch);
  const scansPerExposure = i.exposure * frameRate;
  const bandingDepth = scansPerExposure > 0 ? Math.abs(scansPerExposure - Math.round(scansPerExposure)) / scansPerExposure : 1;
  const zPerU = 1 / confocalAxialCoordinate(1, i.lambda, i.n, i.NA);
  const model = spinningDiskSection(pinholeAU, pitchAU);
  return {
    airyObject,
    pinholeAU,
    pitchAU,
    throughput: pinholeThroughput(pinholeAU),
    lateral: confocalLateralFwhm(i.lambda, i.NA, pinholeAU),
    section: confocalOpticalSectionFwhm(i.lambda, i.n, i.NA, pinholeAU),
    wilhelm: pinholeAU >= SPINNING_DISK_WILHELM_MIN_AU ? confocalSectionFwhm(i.lambda, i.n, i.NA, pinholeAU) : NaN,
    diskSection: 2 * model.halfWidthU * zPerU,
    floor: model.floor,
    frameRate,
    fill,
    illuminated: fill * i.exposure,
    scansPerExposure,
    bandingDepth,
    banding: !(bandingDepth <= SPINNING_DISK_BANDING_LIMIT),
    pinholeTooBig: i.pinholeDiameter > i.pitch,
    widePitch: pitchAU > SPINNING_DISK_MAX_PITCH_AU,
    zPerU,
    model,
  };
}

export { CONFOCAL_MAX_PINHOLE_AU, SPINNING_DISK_MAX_PITCH_AU };
