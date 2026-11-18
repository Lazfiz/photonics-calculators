/**
 * Results of the stimulated-raman-microscopy page in SI units, shared by the page and the API schema. Composes
 * `coherent-raman.ts` (Stokes wavelength, shot-noise SNR, focus factor and modulation depth) and `multiphoton-focus.ts`
 * (Gaussian focus, pulse peak power). Kept apart from those modules so that the pages that import them don't ship
 * these exports. Model tier: textbook approximation.
 */
import {
  detectedPhotoelectrons, excitationBandwidth, ramanShiftFrequency, srsFocusFactor, srsModulationDepth, srsShotNoiseSnr,
  stokesWavelength,
} from "./coherent-raman";
import { gaussianPulsePeakPower, mixedFocusFwhm } from "./multiphoton-focus";

/** Pixels per side of the frame whose acquisition time is returned. */
export const SRS_FRAME_PIXELS = 512;
/** Above this δ the depletion of the beams is no longer negligible (the page warns). */
export const SRS_LARGE_DEPTH = 0.1;
/** Typical condensed-phase Raman linewidth, 1/m (10 cm⁻¹, Cheng et al. 2001); wider pulses make the steady-state gain overestimate δ. */
export const SRS_TYPICAL_LINEWIDTH = 10 * 100;

export interface SrsSummaryInputs {
  /** Pump vacuum wavelength, m. */
  pumpWavelength: number;
  /** Raman shift as a wavenumber, 1/m. */
  ramanShift: number;
  na: number;
  n: number;
  /** Average powers at the sample, W. */
  pumpPower: number;
  stokesPower: number;
  /** "pump": stimulated Raman loss (SRL); anything else: stimulated Raman gain (SRG, Stokes detected). */
  detectedBeam: string;
  /** "gain": estimate δ from the Raman gain; anything else: use `modulationDepth`. */
  deltaSource: string;
  /** Measured δ = ΔP/P (a fraction). */
  modulationDepth: number;
  /** Raman gain coefficient g_R, m/W. */
  ramanGain: number;
  /** Pulse FWHM, s (gain mode). */
  pulseWidth: number;
  /** Repetition rate, Hz (gain mode). */
  repRate: number;
  quantumEfficiency: number;
  /** Pixel dwell = integration time, s. */
  pixelDwell: number;
}

export function srsSummary(i: SrsSummaryInputs) {
  const srl = i.detectedBeam === "pump";
  const fromGain = i.deltaSource === "gain";
  const focusOk = i.na < i.n;
  const lambdaP = i.pumpWavelength;
  const lambdaS = stokesWavelength(lambdaP, i.ramanShift);
  // δ on the detected beam: the input, or g_R·F·P̂/√2 of the modulated beam (pulses identical and overlapped).
  const deltaFor = (pumpDetected: boolean) => {
    if (!fromGain) return i.modulationDepth;
    if (!focusOk) return NaN; // no such focus, so no F
    const peak = gaussianPulsePeakPower(pumpDetected ? i.stokesPower : i.pumpPower, i.repRate, i.pulseWidth);
    return srsModulationDepth(i.ramanGain, peak, lambdaP, lambdaS, i.n, pumpDetected ? "pump" : "stokes", "gaussian");
  };
  const deltaSrg = deltaFor(false);
  const deltaSrl = deltaFor(true);
  const delta = srl ? deltaSrl : deltaSrg;
  const lambdaDet = srl ? lambdaP : lambdaS;
  const powerDet = srl ? i.pumpPower : i.stokesPower;
  const N = detectedPhotoelectrons(powerDet, lambdaDet, i.pixelDwell, i.quantumEfficiency);
  const fwhm = mixedFocusFwhm([{ lambda: lambdaP, order: 1 }, { lambda: lambdaS, order: 1 }], i.n, i.na);
  const bandwidth = excitationBandwidth(i.pulseWidth);
  return {
    stokesWavelength: lambdaS,
    beatFrequency: ramanShiftFrequency(i.ramanShift),
    photoelectrons: N,
    snr: Number.isFinite(delta) ? srsShotNoiseSnr(delta, powerDet, lambdaDet, i.pixelDwell, i.quantumEfficiency) : NaN,
    /** Smallest detectable ΔP/P (SNR = 1), a fraction. */
    minDelta: 1 / Math.sqrt(N),
    lateralFwhm: focusOk ? fwhm.lateral : NaN,
    axialFwhm: focusOk ? fwhm.axial : NaN,
    frameTime: SRS_FRAME_PIXELS * SRS_FRAME_PIXELS * i.pixelDwell,
    focusFactor: focusOk ? srsFocusFactor(lambdaP, lambdaS, i.n) : NaN,
    /** δ for SRG and SRL (the input in both when measured), fractions; NaN: no focus, or δ ≥ 1. */
    deltaSrg,
    deltaSrl,
    delta,
    excitationBandwidth: bandwidth,
    focusOk,
    /** Gain mode with a focus but δ ≥ 1 on the detected beam: the small-signal model fails. */
    deltaDepleted: fromGain && focusOk && !Number.isFinite(delta),
    deltaLarge: fromGain && delta > SRS_LARGE_DEPTH,
    bandwidthWide: fromGain && bandwidth > SRS_TYPICAL_LINEWIDTH,
  };
}
