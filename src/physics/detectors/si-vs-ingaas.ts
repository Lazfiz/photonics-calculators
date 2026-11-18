/**
 * Silicon versus InGaAs p-i-n comparison at one operating point: QE, responsivity, generation-limited dark current and
 * SNR of two reference devices. SI (m, K, m², Hz, A/√Hz, W). Composition of `photodiode-qe.ts` (Gärtner 1959,
 * doi:10.1103/PhysRev.116.84), `silicon-absorption.ts` (Green 2008), `ingaas.ts`, `dark-current.ts` (q·n_i·W·A/τ_g, Sze
 * & Ng 2007, ch. 2), `noise.ts` (SNR = I_s/√((2q(I_s + I_d) + i_amp²)B)) and `responsivity.ts`. Kept apart so the pages
 * that import those modules do not ship it.
 */

import { SILICON_LAMBDA_MAX, siliconAbsorption } from "../materials/silicon-absorption";
import { generationCurrent, siliconIntrinsicDensity } from "./dark-current";
import { ingaasIntrinsicDensity, ingaasPinQe, inpWindowEdge } from "./ingaas";
import { photodiodeSnr } from "./noise";
import { photodiodeQe } from "./photodiode-qe";
import { responsivity } from "./responsivity";

// Reference devices (illustrative, not products). Si p-i-n: collecting width W, substrate diffusion length L,
// AR-coated front R, generation lifetime τ_g. InGaAs p-i-n: In₀.₅₃Ga₀.₄₇As fully depleted absorber d behind an InP cap.
export const SI_PIN = { W: 20e-6, L: 100e-6, R: 0.05, tauG: 1e-3 };
export const INGAAS_PIN = { x: 0.53, d: 3e-6, R: 0.02, tauG: 100e-6 };
export const INGAAS_WINDOWS = ["inp", "none"] as const;
export type IngaasWindow = (typeof INGAAS_WINDOWS)[number];

/** Si QE at λ (m). Si absorption is Green's 300 K table; beyond 1450 nm silicon is transparent (k < 1e-13), so its QE is 0. */
export function siPinQe(lambda: number): number {
  return lambda > SILICON_LAMBDA_MAX
    ? 0
    : photodiodeQe({ alpha: siliconAbsorption(lambda), reflectance: SI_PIN.R, depletionWidth: SI_PIN.W, diffusionLength: SI_PIN.L });
}

/** InGaAs QE at λ (m) and T (K), with or without the InP cap. */
export function ingaasReferenceQe(lambda: number, T: number, window: IngaasWindow): number {
  return ingaasPinQe(lambda, { x: INGAAS_PIN.x, T, thickness: INGAAS_PIN.d, reflectance: INGAAS_PIN.R, inpWindow: window === "inp" });
}

/** SNR of a detector of QE η and dark current I_dark (A) at λ (m) for a signal power (W). */
export function pinSnr(qe: number, lambda: number, dark: number, power: number, ampNoise: number, bandwidth: number): number {
  return photodiodeSnr(responsivity(qe, lambda) * power, dark, ampNoise, bandwidth);
}

export interface SiVsIngaasParams {
  /** m. */
  lambda: number;
  /** W. */
  power: number;
  /** K. */
  T: number;
  /** m². */
  area: number;
  /** Hz. */
  bandwidth: number;
  /** A/√Hz. */
  ampNoise: number;
  window: IngaasWindow;
}

export interface SiVsIngaasSummary {
  siQe: number;
  ingaasQe: number;
  siResponsivity: number;
  ingaasResponsivity: number;
  /** A. */
  siDark: number;
  ingaasDark: number;
  siSnr: number;
  ingaasSnr: number;
  /** InP window edge, m. */
  inpEdge: number;
  /** n_i(InGaAs)/n_i(Si). */
  niRatio: number;
}

export function siVsIngaasSummary(p: SiVsIngaasParams): SiVsIngaasSummary {
  const siDark = generationCurrent(siliconIntrinsicDensity(p.T), SI_PIN.W, p.area, SI_PIN.tauG);
  const ingaasDark = generationCurrent(ingaasIntrinsicDensity(INGAAS_PIN.x, p.T), INGAAS_PIN.d, p.area, INGAAS_PIN.tauG);
  const siQe = siPinQe(p.lambda);
  const ingaasQe = ingaasReferenceQe(p.lambda, p.T, p.window);
  return {
    siQe,
    ingaasQe,
    siResponsivity: responsivity(siQe, p.lambda),
    ingaasResponsivity: responsivity(ingaasQe, p.lambda),
    siDark,
    ingaasDark,
    siSnr: pinSnr(siQe, p.lambda, siDark, p.power, p.ampNoise, p.bandwidth),
    ingaasSnr: pinSnr(ingaasQe, p.lambda, ingaasDark, p.power, p.ampNoise, p.bandwidth),
    inpEdge: inpWindowEdge(p.T),
    niRatio: ingaasIntrinsicDensity(INGAAS_PIN.x, p.T) / siliconIntrinsicDensity(p.T),
  };
}
