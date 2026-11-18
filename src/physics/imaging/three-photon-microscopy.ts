/**
 * Results of the three-photon-microscopy page in SI units, shared by the page and the API schema. Composes
 * `multiphoton-focus.ts` (Zipfel et al. 2003 Gaussian focus extended to I³, Gaussian pulses, ballistic attenuation).
 * Model tier: textbook approximation.
 */
import {
  ballisticFraction, focalPeakIntensity, gaussianPulsePeakPower, multiphotonFwhm, multiphotonVolume, pulseEnergy,
} from "./multiphoton-focus";

export interface ThreePhotonInputs {
  /** Excitation vacuum wavelength, m. */
  lambda: number;
  n: number;
  na: number;
  /** Pulse FWHM, s. */
  pulseWidth: number;
  /** Repetition rate, Hz. */
  repRate: number;
  /** Average power at the surface, W. */
  avgPower: number;
  /** Scattering (extinction) coefficient, 1/m. */
  scattering: number;
  /** Focus depth, m. */
  depth: number;
}

export function threePhotonSummary(i: ThreePhotonInputs) {
  const fwhm3 = multiphotonFwhm(i.lambda, i.n, i.na, 3);
  const fwhm2 = multiphotonFwhm(i.lambda, i.n, i.na, 2);
  const peakPower = gaussianPulsePeakPower(i.avgPower, i.repRate, i.pulseWidth);
  const peakIntensity = focalPeakIntensity(peakPower, i.lambda, i.na);
  const fraction = ballisticFraction(i.depth, i.scattering);
  return {
    lateral3: fwhm3.lateral,
    axial3: fwhm3.axial,
    lateral2: fwhm2.lateral,
    axial2: fwhm2.axial,
    volume: multiphotonVolume(i.lambda, i.n, i.na, 3),
    pulseEnergy: pulseEnergy(i.avgPower, i.repRate),
    peakPower,
    /** At the surface, W/m². */
    peakIntensity,
    /** Ballistic fraction exp(−µz) at the focus depth. */
    fraction,
    intensityAtDepth: peakIntensity * fraction,
    ballisticPower: i.avgPower * fraction,
    /** Relative 3P signal at depth, exp(−3µz). */
    relativeSignal: fraction ** 3,
    /** One-photon- and two-photon-equivalent wavelengths λ/3 and λ/2, m. */
    equivalent1p: i.lambda / 3,
    equivalent2p: i.lambda / 2,
    /** The page's "valid" flag: NA below n and a finite peak power. */
    valid: Number.isFinite(fwhm3.axial) && Number.isFinite(peakPower),
  };
}
