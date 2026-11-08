/**
 * Sum-frequency generation of two Gaussian beams in a χ⁽²⁾ crystal (plane-wave, undepleted inputs, thin-crystal
 * Gaussian overlap): the page's whole result set in SI, so the page and the API schema share one function. The law is
 * in three-wave.ts (Boyd, Nonlinear Optics, 3rd ed., §2.2). Model tier: textbook approximation.
 */
import { confocalParameter } from "../imaging/second-harmonic-generation";
import {
  gaussianMixingPower, mixingEfficiency, qpmPeriod as qpmPeriodOf, sumFrequencyWavelength, threeWaveMismatch,
} from "./three-wave";

export interface SumFrequencyInput {
  lambda1: number;
  lambda2: number;
  /** m/V */
  deff: number;
  /** Crystal length, m. */
  length: number;
  power1: number;
  power2: number;
  /** 1/e² beam radius of both beams, m. */
  waist: number;
  n1: number;
  n2: number;
  n3: number;
  /** Residual phase mismatch, 1/m. */
  deltaK: number;
}

/** P₃ for crystal length `length` and mismatch `deltaK`, W. */
export function sfgPower(p: SumFrequencyInput, length: number, deltaK: number): number {
  const lambda3 = sumFrequencyWavelength(p.lambda1, p.lambda2);
  return gaussianMixingPower(
    mixingEfficiency({ lambdaOut: lambda3, length, deff: p.deff, n1: p.n1, n2: p.n2, nOut: p.n3, deltaK }),
    p.power1, p.power2, p.waist, p.waist,
  );
}

export function sumFrequencyModel(p: SumFrequencyInput) {
  const lambda3 = sumFrequencyWavelength(p.lambda1, p.lambda2);
  const power3 = sfgPower(p, p.length, p.deltaK);
  const normalized = p.power1 > 0 && p.power2 > 0 ? power3 / (p.power1 * p.power2) : NaN;
  // Index mismatch without phase matching: Δk = 2π(n₃/λ₃ − n₁/λ₁ − n₂/λ₂); first-order QPM period 2π/|Δk|.
  const deltaKMaterial = threeWaveMismatch(p.n1, p.lambda1, p.n2, p.lambda2, p.n3, lambda3);
  const qpmPeriod = qpmPeriodOf(deltaKMaterial);
  const confocalMin = Math.min(confocalParameter(p.lambda1, p.n1, p.waist), confocalParameter(p.lambda2, p.n2, p.waist));
  const focusingRatio = p.length / confocalMin;
  // Fraction of the weaker input's photons converted: (P₃/hν₃) / min(P₁/hν₁, P₂/hν₂).
  const photonFraction = (power3 * lambda3) / Math.min(p.power1 * p.lambda1, p.power2 * p.lambda2);
  return { lambda3, power3, normalized, deltaKMaterial, qpmPeriod, confocalMin, focusingRatio, photonFraction };
}
