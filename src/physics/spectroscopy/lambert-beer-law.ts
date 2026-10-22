import { N_A } from "../constants";

/**
 * Beer-Lambert law. SI units in and out: molar decadic absorption coefficient ε in m²/mol, amount concentration c
 * in mol/m³, path length l in m, molar mass M in kg/mol, absorption cross-section σ in m². Model tier: exact for its
 * assumptions (monochromatic light, a dilute solution of non-interacting absorbers, no scattering, fluorescence or
 * stray light).
 *
 * A = ε c l and T = 10^−A (IUPAC Gold Book, "absorbance" and "molar (decadic) absorption coefficient"). The usual
 * laboratory units convert as 1 L mol⁻¹ cm⁻¹ = 0.1 m²/mol, 1 mol/L = 1000 mol/m³ and 1 cm = 0.01 m, so their
 * product ε c l is the same number in both systems. The mass absorption coefficient is a = ε/M (Gold Book "mass
 * absorption coefficient"), and the cross-section per molecule is σ = ln 10 · ε / N_A (Gold Book "absorption cross
 * section": σ = κ/C, with the Napierian coefficient κ = ln 10 · ε c and the number concentration C = N_A c).
 */

/** Decadic absorbance A = ε c l. */
export function absorbance(epsilon: number, concentration: number, pathLength: number): number {
  return epsilon * concentration * pathLength;
}

/** Transmittance T = 10^−A. */
export function transmittance(absorbanceValue: number): number {
  return 10 ** -absorbanceValue;
}

/** Absorbance (optical density) A = −log₁₀ T, or NaN for T ≤ 0. */
export function absorbanceFromTransmittance(transmittanceValue: number): number {
  return transmittanceValue > 0 ? 0 - Math.log10(transmittanceValue) : NaN; // 0 − x: T = 1 gives 0, not −0
}

/** Attenuation in decibels, 10 log₁₀(1/T) = 10 A. */
export function attenuationDb(absorbanceValue: number): number {
  return 10 * absorbanceValue;
}

/** Concentration (mol/m³) that gives absorbance A over path l, or NaN if ε l = 0. */
export function concentrationForAbsorbance(absorbanceValue: number, epsilon: number, pathLength: number): number {
  const el = epsilon * pathLength;
  return el > 0 ? absorbanceValue / el : NaN;
}

/** Molar absorption coefficient ε (m²/mol) from a measured absorbance A = ε c l, or NaN if c l = 0. */
export function epsilonForAbsorbance(absorbanceValue: number, concentration: number, pathLength: number): number {
  const cl = concentration * pathLength;
  return cl > 0 ? absorbanceValue / cl : NaN;
}

/** Mass absorption coefficient a = ε/M (m²/kg), or NaN for M ≤ 0. */
export function massAbsorptionCoefficient(epsilon: number, molarMass: number): number {
  return molarMass > 0 ? epsilon / molarMass : NaN;
}

/** Absorption cross-section per molecule σ = ln 10 · ε / N_A (m²). */
export function crossSectionFromEpsilon(epsilon: number): number {
  return (Math.LN10 * epsilon) / N_A;
}

/** Napierian absorption coefficient α = σ N_A c = ln 10 · ε c (m⁻¹), so that T = e^(−α l). */
export function napierianAbsorptionCoefficient(crossSection: number, concentration: number): number {
  return crossSection * N_A * concentration;
}

/**
 * Decadic absorbance of a slab with Napierian absorption coefficient α (m⁻¹) and thickness d (m): A = α d / ln 10,
 * so the internal transmittance is 10^−A = e^(−α d) (Gold Book "absorption coefficient"). Surface reflections are
 * not included. NaN for α < 0 or d < 0.
 */
export function absorbanceFromNapierian(alpha: number, thickness: number): number {
  return alpha >= 0 && thickness >= 0 ? (alpha * thickness) / Math.LN10 : NaN;
}
