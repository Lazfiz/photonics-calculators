/**
 * Page summary of the multiphoton-depth calculator: two-photon focal FWHM, pulse energy and peak power, and the
 * depth at which the ballistic two-photon signal falls to a given fraction. SI units in and out (m, W, J, 1/m).
 * Model tier: textbook approximation. Focus: Zipfel et al., Nat. Biotechnol. 21, 1369 (2003), doi:10.1038/nbt899
 * (multiphoton-focus.ts). Depth: the ballistic excitation falls as exp(−µz), µ = µ_a + µ_s, so at constant surface
 * power the k = 2 signal falls as exp(−2µz) and reaches a fraction F at z = −ln F/(2µ)
 * (Theer & Denk, J. Opt. Soc. Am. A 23, 3139 (2006), doi:10.1364/JOSAA.23.003139).
 */
import { gaussianPulsePeakPower, multiphotonFwhm, pulseEnergy } from "./multiphoton-focus";

/** Signal fractions of the two depth outputs (1 % and 0.1 %). */
export const DEPTH_FRACTION_1E2 = 0.01;
export const DEPTH_FRACTION_1E3 = 0.001;

export interface MultiphotonDepthInputs {
  /** Objective NA, below the medium index. */
  na: number;
  /** Excitation wavelength in vacuum, m. */
  lambda: number;
  /** Refractive index of the sample. */
  n: number;
  /** Pulse width FWHM, s. */
  pulseWidth: number;
  /** Repetition rate, Hz. */
  repRate: number;
  /** Average power at the sample, W. */
  avgPower: number;
  /** Absorption and scattering coefficients, 1/m. */
  absorption: number;
  scattering: number;
}

export interface MultiphotonDepthResult {
  /** Two-photon lateral and axial FWHM, m. */
  lateral: number;
  axial: number;
  /** Energy per pulse, J, and Gaussian-pulse peak power, W. */
  pulseEnergy: number;
  peakPower: number;
  /** Attenuation length 1/µ, m (Infinity when µ = 0). */
  attenuationLength: number;
  /** Depth where the 2P signal is 1 % and 0.1 % of its surface value, m (Infinity when µ = 0). */
  depth1e2: number;
  depth1e3: number;
}

/** Depth at which the two-photon signal exp(−2µz) falls to `fraction`, m; Infinity when µ = 0, NaN for µ < 0. */
export function twoPhotonDepthAtFraction(fraction: number, attenuationCoefficient: number): number {
  if (!(fraction > 0 && fraction < 1) || !(attenuationCoefficient >= 0)) return NaN;
  return attenuationCoefficient > 0 ? -Math.log(fraction) / (2 * attenuationCoefficient) : Infinity;
}

export function multiphotonDepthSummary(p: MultiphotonDepthInputs): MultiphotonDepthResult {
  const fwhm = multiphotonFwhm(p.lambda, p.n, p.na, 2);
  const mu = p.absorption + p.scattering;
  return {
    lateral: fwhm.lateral,
    axial: fwhm.axial,
    pulseEnergy: pulseEnergy(p.avgPower, p.repRate),
    peakPower: gaussianPulsePeakPower(p.avgPower, p.repRate, p.pulseWidth),
    attenuationLength: mu > 0 ? 1 / mu : Infinity,
    depth1e2: twoPhotonDepthAtFraction(DEPTH_FRACTION_1E2, mu),
    depth1e3: twoPhotonDepthAtFraction(DEPTH_FRACTION_1E3, mu),
  };
}
