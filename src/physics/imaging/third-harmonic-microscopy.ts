/**
 * Results of the third-harmonic-microscopy page in SI units, shared by the page and the API schema. Composes
 * `multiphoton-focus.ts` (Zipfel et al. 2003 Gaussian focus, Gaussian pulses). Model tier: textbook approximation.
 * The THG signal itself is not predicted: in a homogeneous medium it cancels at the focus (Gouy phase, Boyd §2.10) and
 * appears only at interfaces (Barad et al. 1997), so only the source geometry and the excitation are returned.
 */
import {
  focalIntensityRadius, focalPeakIntensity, gaussianPulsePeakPower, multiphotonFwhm, pulseEnergy,
} from "./multiphoton-focus";

export interface ThgInputs {
  /** Fundamental vacuum wavelength, m. */
  lambda: number;
  /** Sample/immersion index. */
  n: number;
  na: number;
  /** Average power, W. */
  avgPower: number;
  /** Pulse FWHM, s. */
  pulseWidth: number;
  /** Repetition rate, Hz. */
  repRate: number;
}

export function thgSummary(i: ThgInputs) {
  const peakPower = gaussianPulsePeakPower(i.avgPower, i.repRate, i.pulseWidth);
  const fundamental = multiphotonFwhm(i.lambda, i.n, i.na, 1);
  const thg = multiphotonFwhm(i.lambda, i.n, i.na, 3);
  return {
    /** λ/3, m. */
    thgWavelength: i.lambda / 3,
    pulseEnergy: pulseEnergy(i.avgPower, i.repRate),
    peakPower,
    peakIntensity: focalPeakIntensity(peakPower, i.lambda, i.na),
    /** 1/e² radius of the fundamental focus, m. */
    w: focalIntensityRadius(i.lambda, i.na),
    fundamentalLateral: fundamental.lateral,
    fundamentalAxial: fundamental.axial,
    thgLateral: thg.lateral,
    thgAxial: thg.axial,
    /** The page's "valid" flag: NA below n and a finite peak power. */
    valid: Number.isFinite(thg.axial) && Number.isFinite(peakPower),
  };
}
