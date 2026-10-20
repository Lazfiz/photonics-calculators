/**
 * Relative (comparative) fluorescence quantum yield against a reference standard. Dimensionless inputs: integrated
 * emission (any common unit), decadic absorbance at the excitation wavelength, refractive indices of the solvents.
 * Model tier: textbook.
 *
 *   Φ_s = Φ_ref · (F_s / F_ref) · (f_ref / f_s) · (n_s² / n_ref²),  f = 1 − 10^(−A),
 * the absorptance f being the fraction of excitation photons absorbed. The common form with A_ref/A_s in place of
 * f_ref/f_s is its small-A limit (f ≈ A ln 10); both need the same excitation wavelength, geometry and detection,
 * dilute samples (no inner-filter or reabsorption effects, A ≲ 0.1 in a 1 cm cell) and isotropic emission. The n²
 * factor corrects the solid angle of detection for refraction at the cell (Würth et al. 2013).
 * C. Würth, M. Grabolle, J. Pauli, M. Spieles, U. Resch-Genger, "Relative and absolute determination of fluorescence
 * quantum yields of transparent samples", Nat. Protoc. 8, 1535 (2013), doi 10.1038/nprot.2013.087;
 * A. M. Brouwer, "Standards for photoluminescence quantum yield measurements in solution (IUPAC Technical Report)",
 * Pure Appl. Chem. 83, 2213 (2011), doi 10.1351/PAC-REP-10-09-31.
 */

/** Absorptance f = 1 − 10^(−A) for A ≥ 0 (expm1 keeps precision at small A). */
export function absorptance(absorbance: number): number {
  return absorbance >= 0 ? -Math.expm1(-absorbance * Math.LN10) : NaN;
}

export interface QuantumYieldInput {
  /** Integrated emission of the sample and the reference (same units), ≥ 0 and > 0. */
  sampleEmission: number;
  referenceEmission: number;
  /** Absorbance at the excitation wavelength, > 0. */
  sampleAbsorbance: number;
  referenceAbsorbance: number;
  /** Refractive indices of the two solvents, ≥ 1. */
  sampleIndex: number;
  referenceIndex: number;
  /** Quantum yield of the reference, 0–1. */
  referenceYield: number;
}

/**
 * Φ_s by the absorptance form (default) or the absorbance-ratio approximation. NaN when an input is out of range
 * (zero reference emission or absorbance, Φ_ref outside 0–1). A result above 1 is returned as is, for the caller to
 * flag: it means an inconsistent measurement, not a real yield.
 */
export function relativeQuantumYield(q: QuantumYieldInput, method: "absorptance" | "absorbance" = "absorptance"): number {
  const valid = q.sampleEmission >= 0 && q.referenceEmission > 0 && q.sampleAbsorbance > 0 && q.referenceAbsorbance > 0
    && q.sampleIndex >= 1 && q.referenceIndex >= 1 && q.referenceYield >= 0 && q.referenceYield <= 1;
  if (!valid) return NaN;
  const absorbed = method === "absorptance"
    ? absorptance(q.referenceAbsorbance) / absorptance(q.sampleAbsorbance)
    : q.referenceAbsorbance / q.sampleAbsorbance;
  return q.referenceYield * (q.sampleEmission / q.referenceEmission) * absorbed * (q.sampleIndex / q.referenceIndex) ** 2;
}
