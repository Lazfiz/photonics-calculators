/**
 * Photodiode + transimpedance amplifier noise at one feedback resistance. SI units (A/√Hz, V/√Hz, Ω, F, Hz, K, A/W).
 * Input-referred current noise i²(f) = i_n² + 4k_BT/R_f + (e_n/R_f)² + (e_n·2πf·C_S)² through the Butterworth TIA response
 * and a brick-wall post-filter B (X. Ramus, Transimpedance Considerations for High-Speed Amplifiers, TI SBOA122, 2009),
 * NEP = i_rms/ℛ. Composition of `tia.ts`, `noise.ts` and `responsivity.ts`; photocurrent and dark shot noise are left out.
 */

import { noiseEquivalentPower } from "./noise";
import { responsivity as responsivityOf } from "./responsivity";
import { tiaBandwidth, tiaButterworthCf, tiaFilteredNoise, type TiaNoiseInputs, type TiaNoiseTerms } from "./tia";

export interface TiaNoiseParams {
  wavelength_nm: number;
  qe: number;
  /** A/√Hz. */
  currentNoise: number;
  /** V/√Hz. */
  voltageNoise: number;
  /** F. */
  inputC: number;
  /** Op-amp gain-bandwidth, Hz. */
  gbw: number;
  /** Post-filter bandwidth B, Hz. */
  band: number;
  /** R_f, Ω. */
  feedbackR: number;
  temperature: number;
}

export interface TiaNoiseAtRf {
  /** Butterworth TIA bandwidth, Hz. */
  fTia: number;
  /** Noise-equivalent bandwidth, Hz. */
  F: number;
  /** Densities averaged over F, A²/Hz. */
  terms: TiaNoiseTerms;
  /** RMS input noise current, A. */
  iRms: number;
  /** W. */
  nep: number;
}

/** The amplifier's noise inputs at a feedback resistance R_f. */
export function tiaAmp(p: TiaNoiseParams, feedbackR: number): TiaNoiseInputs {
  return { currentNoise: p.currentNoise, voltageNoise: p.voltageNoise, feedbackR, inputC: p.inputC, temperature: p.temperature };
}

/** Noise weighted by the Butterworth TIA response up to the post-filter B, for R_f = `feedbackR` (the rest from `p`). */
export function tiaNoiseAtRf(p: TiaNoiseParams, feedbackR: number): TiaNoiseAtRf {
  const responsivity = responsivityOf(p.qe, p.wavelength_nm * 1e-9);
  const fTia = tiaBandwidth(p.gbw, feedbackR, p.inputC);
  const { terms, enbw: F } = tiaFilteredNoise(tiaAmp(p, feedbackR), fTia, p.band);
  const iRms = Math.sqrt(terms.total * F);
  return { fTia, F, terms, iRms, nep: noiseEquivalentPower(iRms, responsivity) };
}

export interface TiaNoiseSummary extends TiaNoiseAtRf {
  /** A/W. */
  responsivity: number;
  /** Feedback capacitance for Q = 1/√2, F; NaN when none is needed. */
  cf: number;
  /** Largest noise term at R_f. */
  dominant: string;
  /** Output noise i_rms·R_f, V rms. */
  outputNoise: number;
}

export function tiaNoiseSummary(p: TiaNoiseParams): TiaNoiseSummary {
  const at = tiaNoiseAtRf(p, p.feedbackR);
  const parts = [
    { name: "amplifier i_n", v: at.terms.current },
    { name: "Johnson of R_f", v: at.terms.johnson },
    { name: "e_n/R_f", v: at.terms.voltage },
    { name: "e_n·2πf·C_S", v: at.terms.capacitive },
  ];
  return {
    ...at,
    responsivity: responsivityOf(p.qe, p.wavelength_nm * 1e-9),
    cf: tiaButterworthCf(p.gbw, p.feedbackR, p.inputC),
    dominant: parts.reduce((a, b) => (b.v > a.v ? b : a)).name,
    outputNoise: at.iRms * p.feedbackR,
  };
}
