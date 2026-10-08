/**
 * Beer-Lambert law. SI units in and out: molar decadic absorption coefficient ε in m²/mol, amount concentration c
 * in mol/m³, path length l in m. Model tier: exact for its assumptions (monochromatic light, a dilute solution of
 * non-interacting absorbers, no scattering, fluorescence or stray light).
 *
 * A = ε c l and T = 10^−A (IUPAC Gold Book, "absorbance" and "molar (decadic) absorption coefficient"). The usual
 * laboratory units convert as 1 L mol⁻¹ cm⁻¹ = 0.1 m²/mol, 1 mol/L = 1000 mol/m³ and 1 cm = 0.01 m, so their
 * product ε c l is the same number in both systems.
 */

/** Decadic absorbance A = ε c l. */
export function absorbance(epsilon: number, concentration: number, pathLength: number): number {
  return epsilon * concentration * pathLength;
}

/** Transmittance T = 10^−A. */
export function transmittance(absorbanceValue: number): number {
  return 10 ** -absorbanceValue;
}

/** Concentration (mol/m³) that gives absorbance A over path l, or NaN if ε l = 0. */
export function concentrationForAbsorbance(absorbanceValue: number, epsilon: number, pathLength: number): number {
  const el = epsilon * pathLength;
  return el > 0 ? absorbanceValue / el : NaN;
}
