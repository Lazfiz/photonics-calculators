/**
 * Confocal pinhole page: Airy unit at the sample and at the pinhole, throughput and FWHMs for one pinhole size.
 * SI units in and out. Model tier: textbook approximation; the physics is in the confocal and
 * optical-sectioning-thickness modules (scalar paraxial theory, equal excitation and emission wavelengths).
 * Wilhelm's geometric optical-section formula holds for pinholes of at least 1 AU (R. Wilhelm, B. Gröbler,
 * M. Gluch, H. Heinz, Confocal Laser Scanning Microscopy: Principles, Carl Zeiss, 2003).
 */
import { confocalLateralFwhm, confocalOpticalSectionFwhm, pinholeThroughput } from "./confocal";
import { airyUnit, confocalSectionFwhm } from "./optical-sectioning-thickness";

/** Smallest pinhole (Airy units) for which Wilhelm's geometric formula is shown. */
export const WILHELM_MIN_PINHOLE_AU = 1;

export interface ConfocalPinholeSummary {
  /** 1 Airy unit at the sample, m. */
  airyObject: number;
  /** 1 Airy unit at the pinhole, m. */
  airyPinhole: number;
  /** Pinhole diameter, m. */
  pinholeDiameter: number;
  /** In-focus point throughput, fraction. */
  throughput: number;
  lateral: number;
  /** Optical-section FWHM, m. */
  section: number;
  /** Wilhelm's geometric section FWHM, m; NaN below WILHELM_MIN_PINHOLE_AU. */
  wilhelm: number;
  /** Wilhelm's value above the section FWHM, fraction; NaN below WILHELM_MIN_PINHOLE_AU. */
  wilhelmExcess: number;
}

/** Inputs in SI (m); `magnification` is the magnification to the pinhole, `n` the immersion index. */
export function confocalPinholeSummary(
  lambda: number, NA: number, magnification: number, n: number, pinholeAU: number,
): ConfocalPinholeSummary {
  const airyObject = airyUnit(lambda, NA);
  const airyPinhole = airyObject * magnification;
  const section = confocalOpticalSectionFwhm(lambda, n, NA, pinholeAU);
  const geometric = pinholeAU >= WILHELM_MIN_PINHOLE_AU;
  const wilhelm = geometric ? confocalSectionFwhm(lambda, n, NA, pinholeAU) : NaN;
  return {
    airyObject,
    airyPinhole,
    pinholeDiameter: pinholeAU * airyPinhole,
    throughput: pinholeThroughput(pinholeAU),
    lateral: confocalLateralFwhm(lambda, NA, pinholeAU),
    section,
    wilhelm,
    wilhelmExcess: (wilhelm - section) / section,
  };
}
