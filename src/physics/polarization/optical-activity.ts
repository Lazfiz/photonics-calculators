/**
 * Optical rotation by a solution of an optically active substance. SI inside: specific rotation [α] in rad·m²/kg,
 * mass concentration c in kg/m³ (= g/L), path l in m, wavelength in m, temperature in K, molar mass in kg/mol.
 * The conversion factors below give the conventional units (deg·mL·g⁻¹·dm⁻¹ and deg·cm²·dmol⁻¹).
 *
 * - Biot's law: α = [α] c l. Positive α is dextrorotatory: the plane turns clockwise as seen by an observer looking
 *   toward the source. In this site's convention (+θ counter-clockwise looking into the beam, jones.ts) the output
 *   azimuth is θ_in − α.
 * - Rotatory dispersion, one-term Drude equation [α](λ) = A / (λ² − λ₀²), written relative to a reference
 *   wavelength; λ₀ = 0 is Biot's 1/λ² law.
 * - Sucrose: [α] at 20 °C and 589.4400 nm (in vacuo) = 66.524 deg·mL·g⁻¹·dm⁻¹, and the ICUMSA rotatory dispersion
 *   equation α(λ)/α(546.2271 nm) = 1/(a₀ + a₁λ² + a₂λ⁴ + a₃λ⁶), λ in µm, both from NIST SRM 17e, Certificate of
 *   Analysis (2003); NIST uses the equation from 546 to 883 nm (ICUMSA Proc. 22nd Session, p. 209, 1998). [α] is
 *   taken as independent of concentration.
 * - Temperature: α(T) = α(20 °C) [1 + k (T − 20 °C)] for a solution made up at 20 °C. For the normal sugar solution
 *   k = −0.000461 /°C, the same at all wavelengths (Schönrock, quoted by Bates & Blake, Bull. Bur. Stand. 3, 105
 *   (1907), doi:10.6028/bulletin.057); it includes the thermal expansion of the solution and is a linear fit for a
 *   few degrees around 20 °C.
 * - Molar rotation [M] = [α] M (conventionally [α]·M/100 in deg·cm²·dmol⁻¹ with M in g/mol).
 */

/** 1 deg·mL·g⁻¹·dm⁻¹ in rad·m²/kg: (π/180) rad / (0.1 m · 1000 kg/m³). */
export const SPECIFIC_ROTATION_SI_PER_CONV = (Math.PI / 180) * 1e-2;
/** 1 rad·m²/mol of molar rotation in deg·cm²·dmol⁻¹: (180/π) · 1e4 cm² / 10 dmol. */
export const MOLAR_ROTATION_CONV_PER_SI = (180 / Math.PI) * 1e3;

/** 20 °C in K, the reference temperature of specific rotations. */
export const T_REF = 293.15;

/** Sucrose [α] at 20 °C, 589.4400 nm, deg·mL·g⁻¹·dm⁻¹ (NIST SRM 17e, Table 1c). */
export const SUCROSE_SPECIFIC_ROTATION_D = 66.524;
/** Wavelength of the SRM 17e sodium value, m (in vacuo). */
export const SUCROSE_LAMBDA_D = 589.44e-9;
/** Range over which NIST uses the ICUMSA equation for SRM 17e, m (in vacuo). */
export const SUCROSE_DISPERSION_RANGE: readonly [number, number] = [546.2271e-9, 882.6e-9];
/** Schönrock's temperature coefficient of the normal sugar solution's rotation, 1/K. */
export const SUCROSE_TEMPERATURE_COEFFICIENT = -0.000461;

const ICUMSA = [-0.075047659, 3.588221904585, 0.0519461783, -0.006515194377];

/** ICUMSA ratio α(λ)/α(546.2271 nm) for sucrose. NaN for λ ≤ 0 or where the polynomial is ≤ 0. */
export function sucroseDispersionRatio(lambda: number): number {
  if (!(lambda > 0)) return NaN;
  const x = (lambda * 1e6) ** 2;
  const den = ICUMSA[0] + x * (ICUMSA[1] + x * (ICUMSA[2] + x * ICUMSA[3]));
  return den > 0 ? 1 / den : NaN;
}

/** Sucrose specific rotation at λ and 20 °C, rad·m²/kg. */
export function sucroseSpecificRotation(lambda: number): number {
  return SUCROSE_SPECIFIC_ROTATION_D * SPECIFIC_ROTATION_SI_PER_CONV
    * (sucroseDispersionRatio(lambda) / sucroseDispersionRatio(SUCROSE_LAMBDA_D));
}

/**
 * One-term Drude dispersion: [α](λ) = [α]_ref (λ_ref² − λ₀²)/(λ² − λ₀²). NaN unless λ, λ_ref > λ₀ ≥ 0.
 */
export function drudeSpecificRotation(alphaRef: number, lambdaRef: number, lambda: number, lambda0: number): number {
  if (!(lambda0 >= 0 && lambda > lambda0 && lambdaRef > lambda0)) return NaN;
  return (alphaRef * (lambdaRef ** 2 - lambda0 ** 2)) / (lambda ** 2 - lambda0 ** 2);
}

/** Linear temperature correction α(T) = α(20 °C)[1 + k(T − 20 °C)], T in K, k in 1/K. */
export function temperatureCorrected(alpha20: number, k: number, T: number): number {
  return alpha20 * (1 + k * (T - T_REF));
}

/** Observed rotation α = [α] c l, rad. NaN for c < 0 or l < 0. */
export function observedRotation(specificRotation: number, c: number, l: number): number {
  return c >= 0 && l >= 0 ? specificRotation * c * l : NaN;
}

/** Specific rotation from a measured rotation: [α] = α/(c l). NaN unless c > 0 and l > 0. */
export function specificRotationFromObserved(alpha: number, c: number, l: number): number {
  return c > 0 && l > 0 ? alpha / (c * l) : NaN;
}

/** Molar rotation [M] = [α] M, rad·m²/mol (M in kg/mol). NaN for M ≤ 0. */
export function molarRotation(specificRotation: number, molarMass: number): number {
  return molarMass > 0 ? specificRotation * molarMass : NaN;
}

/** Output azimuth after a rotation α (dextrorotatory α > 0 turns clockwise seen looking toward the source). */
export function outputAzimuth(inputAzimuth: number, alpha: number): number {
  return inputAzimuth - alpha;
}
