/**
 * Coherent-Raman page summary (CARS/SRS calculator): wavelengths, pulse energies, peak powers, focal intensities, the
 * CARS maximum and the pulse excitation bandwidth in one call. SI units in and out (m, 1/m, W, Hz, s). Moved out of
 * the page so that the page and its API schema share it; the physics is in `coherent-raman.ts` and
 * `multiphoton-focus.ts`.
 */
import {
  antiStokesWavelength, carsPeakDetuning, excitationBandwidth, ramanShiftFrequency, stokesWavelength,
} from "./coherent-raman";
import { focalPeakIntensity, gaussianPulsePeakPower, pulseEnergy } from "./multiphoton-focus";

export interface CoherentRamanInputs {
  /** Pump wavelength, m. */
  pumpWavelength: number;
  /** Raman shift as a wavenumber, 1/m. */
  ramanShift: number;
  /** Average pump and Stokes powers, W. */
  pumpPower: number;
  stokesPower: number;
  /** Pulse width (intensity FWHM), s. */
  pulseWidth: number;
  /** Repetition rate, Hz. */
  repRate: number;
  na: number;
  /** Raman linewidth Γ (HWHM), 1/m. */
  linewidth: number;
  /** χ_NR relative to the peak Im χ_R. */
  chiNR: number;
}

/** Wavelengths, energies, powers and intensities of the two beams, SI. */
export function coherentRamanSummary(i: CoherentRamanInputs) {
  const lambdaS = stokesWavelength(i.pumpWavelength, i.ramanShift);
  const peakPowerPump = gaussianPulsePeakPower(i.pumpPower, i.repRate, i.pulseWidth);
  const peakPowerStokes = gaussianPulsePeakPower(i.stokesPower, i.repRate, i.pulseWidth);
  return {
    stokesWavelength: lambdaS,
    antiStokesWavelength: antiStokesWavelength(i.pumpWavelength, i.ramanShift),
    frequencyDifference: ramanShiftFrequency(i.ramanShift),
    pulseEnergyPump: pulseEnergy(i.pumpPower, i.repRate),
    pulseEnergyStokes: pulseEnergy(i.stokesPower, i.repRate),
    peakPowerPump,
    peakPowerStokes,
    intensityPump: focalPeakIntensity(peakPowerPump, i.pumpWavelength, i.na),
    intensityStokes: focalPeakIntensity(peakPowerStokes, lambdaS, i.na),
    /** Detuning of the CARS maximum from the resonance, 1/m (negative: below it). */
    carsPeakShift: carsPeakDetuning(i.linewidth, i.chiNR),
    /** Spectral FWHM of the drive of two transform-limited pulses, 1/m. */
    excitationBandwidth: excitationBandwidth(i.pulseWidth),
  };
}
