/**
 * Detector-limited and system specific detectivity D*. ℛ = η·q·λ/(h·c) up to the cutoff λ_c = h·c/E_g, zero above;
 * NEP = i_n/(ℛ·M); system D* = √(A·Δf)/NEP; detector D* = ℛ·M/√(2q·J_d·M²·F + 4k_BT/R₀A). Dereniak & Boreman, Infrared
 * Detectors and Systems (Wiley 1996), ch. 5; A. Rogalski, Prog. Quantum Electron. 27, 59 (2003). Base functions in `noise.ts`.
 * Units here: nm, A, cm², Hz, K, Ω, Ω·cm²; D* in Jones (cm·√Hz/W).
 */

import { hc_eV_nm, k_B, q } from "../constants";
import { detectorDetectivity, johnsonNoise, noiseEquivalentPower, responsivity as responsivityOf, shotNoiseCurrent, specificDetectivity } from "./noise";

export interface DetectivityParams {
  wavelength_nm: number;
  cutoff_nm: number;
  qe: number;
  /** Unmultiplied dark current, A. */
  darkCurrent: number;
  area_cm2: number;
  bandwidth: number;
  temperature: number;
  loadResistance: number;
  /** Zero-bias R₀A, Ω·cm². */
  r0a: number;
  gain: number;
  excessNoiseFactor: number;
}

/** ℛ = η·q·λ/(h·c) below the cutoff, zero above it (η held constant up to λ_c), A/W. */
export function responsivityAt(p: DetectivityParams, lambda_nm: number): number {
  return lambda_nm <= p.cutoff_nm ? responsivityOf(p.qe, lambda_nm * 1e-9) : 0;
}

/** Multiplied dark-current shot noise 2q·I_d·M²·F·B plus load Johnson noise 4kTB/R_L, A rms. */
export function systemNoiseCurrent(p: DetectivityParams, darkCurrent: number, temperature: number): number {
  return Math.hypot(
    shotNoiseCurrent(darkCurrent, p.bandwidth) * p.gain * Math.sqrt(p.excessNoiseFactor),
    johnsonNoise(p.loadResistance, temperature, p.bandwidth).i,
  );
}

/** System D* = √(A·Δf)/NEP for a responsivity R and total noise current iNoise; NaN without response. */
export function systemDStar(p: DetectivityParams, R: number, iNoise: number): number {
  return R > 0 ? specificDetectivity(p.area_cm2, p.bandwidth, noiseEquivalentPower(iNoise, R, p.gain)) : NaN;
}

/** The detector's own D* from J_d = I_d/A and R₀A: independent of area, bandwidth and the load. */
export function detectorDStarAt(p: DetectivityParams, R: number, darkCurrent: number, r0a: number, temperature: number): number {
  return detectorDetectivity({
    responsivity: R, darkCurrentDensity: darkCurrent / p.area_cm2, r0a, temperature, gain: p.gain, excessNoiseFactor: p.excessNoiseFactor,
  });
}

export interface DetectivitySummary {
  /** Gap implied by the cutoff, eV. */
  bandGap_eV: number;
  /** M = 1 responsivity at the wavelength, A/W. */
  responsivity: number;
  detectorDStar: number;
  systemDStar: number;
  /** Spectral NEP of the system, W/√Hz. */
  nepSpectral: number;
  shotNoise: number;
  thermalNoise: number;
  totalNoise: number;
  /** J_d = I_d/A, A/cm². */
  jd: number;
  /** Detector noise variances per Hz·cm²: dark-current shot and R₀A Johnson (the larger dominates). */
  shotVariance: number;
  johnsonVariance: number;
}

export function detectivitySummary(p: DetectivityParams): DetectivitySummary {
  const responsivity = responsivityAt(p, p.wavelength_nm);
  const shotNoise = shotNoiseCurrent(p.darkCurrent, p.bandwidth) * p.gain * Math.sqrt(p.excessNoiseFactor);
  const thermalNoise = johnsonNoise(p.loadResistance, p.temperature, p.bandwidth).i;
  const totalNoise = systemNoiseCurrent(p, p.darkCurrent, p.temperature);
  const jd = p.darkCurrent / p.area_cm2;
  return {
    bandGap_eV: hc_eV_nm / p.cutoff_nm,
    responsivity,
    detectorDStar: detectorDStarAt(p, responsivity, p.darkCurrent, p.r0a, p.temperature),
    systemDStar: systemDStar(p, responsivity, totalNoise),
    nepSpectral: responsivity > 0 ? noiseEquivalentPower(totalNoise, responsivity, p.gain) / Math.sqrt(p.bandwidth) : NaN,
    shotNoise,
    thermalNoise,
    totalNoise,
    jd,
    shotVariance: 2 * q * jd * p.gain * p.gain * p.excessNoiseFactor,
    johnsonVariance: (4 * k_B * p.temperature) / p.r0a,
  };
}
