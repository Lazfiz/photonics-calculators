/**
 * Circular dichroism (CD) from the decadic absorbances A_L and A_R of left and right circularly polarized light.
 * SI inside: concentration c in mol/m³, path length l in m, Δε in m²/mol, ellipticity in rad, molar ellipticity in
 * rad·m²/mol. The conversion factors below give the units of the CD literature.
 *
 * - ΔA = A_L − A_R = Δε c l (Beer–Lambert for each handedness); g = ΔA / A with A = (A_L + A_R)/2.
 * - Ellipticity: the transmitted field amplitudes are 10^(−A/2), and the superposition of unequal RCP and LCP is an
 *   ellipse with tan θ = (E_R − E_L)/(E_R + E_L) = tanh(ln 10 · ΔA / 4); for small ΔA, θ = (ln 10/4) ΔA rad
 *   = 32.98 ΔA degrees (Greenfield, Nat. Protoc. 1, 2876 (2006), doi:10.1038/nprot.2006.202:
 *   θ(mdeg) = 32 980 ΔA).
 * - Molar ellipticity [θ] = 100 θ_deg / (c_M l_cm) = 3298.2 Δε in deg·cm²·dmol⁻¹ with Δε in M⁻¹·cm⁻¹ (Greenfield
 *   2006); per residue, [θ]_MRW = [θ] / (N − 1) for N residues (N − 1 peptide bonds, Greenfield's mean residue
 *   weight M/(N − 1)).
 * - Shot-noise-limited signal-to-noise at fixed g: S/N ∝ ΔA √I ∝ A 10^(−A/2), largest at A = 2/ln 10 = 0.869
 *   (d/dA [A e^(−A ln 10/2)] = 0).
 */

/** 1 m²/mol of Δε in M⁻¹·cm⁻¹ (1 M⁻¹·cm⁻¹ = 1e-3 m³/mol / 1e-2 m = 0.1 m²/mol). */
export const DELTA_EPS_CONV_PER_SI = 10;
/** 1 rad·m²/mol of molar ellipticity in deg·cm²·dmol⁻¹: (180/π) deg · 1e4 cm² / 10 dmol. */
export const MOLAR_ELLIPTICITY_CONV_PER_SI = (180 / Math.PI) * 1e3;
/** Absorbance of best shot-noise-limited signal-to-noise. */
export const CD_OPTIMUM_ABSORBANCE = 2 / Math.LN10;

/** Ellipticity θ in rad, exact: atan(tanh(ln 10 · (A_L − A_R)/4)). Positive when A_L > A_R. */
export function ellipticity(AL: number, AR: number): number {
  return Math.atan(Math.tanh((Math.LN10 * (AL - AR)) / 4));
}

/** Small-ΔA ellipticity (ln 10/4) ΔA, rad. */
export function ellipticityLinear(AL: number, AR: number): number {
  return (Math.LN10 / 4) * (AL - AR);
}

/** Δε = ΔA/(c l), m²/mol. NaN unless c > 0 and l > 0. */
export function deltaEpsilon(AL: number, AR: number, c: number, l: number): number {
  return c > 0 && l > 0 ? (AL - AR) / (c * l) : NaN;
}

/** Molar ellipticity (ln 10/4) Δε, rad·m²/mol (small-ΔA definition used in the literature). */
export function molarEllipticity(deltaEps: number): number {
  return (Math.LN10 / 4) * deltaEps;
}

/** Mean-residue ellipticity [θ]/(N − 1). NaN for N < 2 or non-integer N. */
export function meanResidueEllipticity(molar: number, residues: number): number {
  return Number.isInteger(residues) && residues >= 2 ? molar / (residues - 1) : NaN;
}

/** Dissymmetry (Kuhn anisotropy) factor g = 2(A_L − A_R)/(A_L + A_R). NaN when A_L + A_R ≤ 0. */
export function dissymmetryFactor(AL: number, AR: number): number {
  const sum = AL + AR;
  return sum > 0 ? (2 * (AL - AR)) / sum : NaN;
}

/** Relative shot-noise-limited S/N at total absorbance A, 1 at A = 2/ln 10. NaN for A < 0. */
export function relativeCdSnr(A: number): number {
  if (!(A >= 0)) return NaN;
  const a0 = CD_OPTIMUM_ABSORBANCE;
  return (A / a0) * Math.pow(10, -(A - a0) / 2);
}
