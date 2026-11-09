/**
 * Step-index fibre characterization summary for the fiber-characterization page and its API schema: mode
 * properties (step-index-modes.ts, macro-bending-loss.ts), silica γ (fiber-nonlinear.ts) and the G.652-form
 * dispersion (chromatic-dispersion.ts). Kept apart from step-index-modes.ts so that module's many importers don't
 * pull in the dispersion and nonlinear modules. SI units.
 */
import { sellmeierDispersion } from "./chromatic-dispersion";
import { SILICA_N2, nonlinearCoefficient } from "./fiber-nonlinear";
import { lp01Mode, lp11CutoffWavelength, modeFieldRadius, vNumber, type StepIndexFiber } from "./macro-bending-loss";
import {
  coreConfinement, effectiveIndex, normalizedB, numericalAperture, petermannIIRadius, relativeIndexDifference,
} from "./step-index-modes";

/** Relative index difference above which the weak-guidance (LP) model is only approximate. */
export const WEAK_GUIDANCE_DELTA = 0.05;

/**
 * Step-index fibre characterization (core radius a, indices n₁ > n₂, wavelength λ; dispersion from λ₀ and S₀ in the
 * G.652 form): V, NA, Δ, acceptance half-angle (rad), LP11 cutoff, b, n_eff, core power fraction, Gaussian-fit MFD
 * and Petermann II MFD (m), A_eff = πw² (m²), γ of silica (1/(W·m)), D (s/m²). NaN outside the model's domain.
 */
export function fiberCharacterization(a: number, n1: number, n2: number, lambda: number, lambda0: number, S0: number) {
  const fiber: StepIndexFiber = { a, n1, NA: numericalAperture(n1, n2) };
  const V = vNumber(fiber, lambda);
  const mode = lp01Mode(V);
  const w = modeFieldRadius(fiber, lambda);
  const Aeff = Math.PI * w * w;
  return {
    V,
    NA: fiber.NA,
    delta: relativeIndexDifference(fiber),
    acceptanceAngle: fiber.NA <= 1 ? Math.asin(fiber.NA) : NaN,
    cutoff: lp11CutoffWavelength(fiber),
    b: normalizedB(mode),
    nEff: effectiveIndex(fiber, lambda, mode),
    confinement: coreConfinement(mode),
    mfd: 2 * w,
    mfdPetermannII: 2 * petermannIIRadius(fiber, lambda, mode),
    Aeff,
    gamma: nonlinearCoefficient(SILICA_N2, lambda, Aeff),
    D: sellmeierDispersion(lambda, lambda0, S0),
  };
}
