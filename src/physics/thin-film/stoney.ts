/**
 * Film stress from substrate curvature (Stoney) and thermal-mismatch stress. SI units in and out: stresses and
 * moduli in Pa, lengths in m, curvature in 1/m, expansion coefficients in 1/K, temperatures in K or °C
 * (only differences are used). Model tier: textbook approximation.
 *
 * Sign convention: tensile stress > 0. A tensile film bends the substrate so that the film side is concave;
 * curvature κ > 0 and center deflection h > 0 mean that shape.
 *
 * Stoney's equation with the substrate's biaxial modulus E_s/(1 − ν_s), for an equibiaxial film stress σ_f
 * (G. G. Stoney, Proc. R. Soc. Lond. A 82, 172 (1909); G. C. A. M. Janssen et al., "Celebrating the 100th
 * anniversary of the Stoney equation for film stress", Thin Solid Films 517, 1858 (2009)):
 *   σ_f = E_s t_s² Δκ / (6 (1 − ν_s) t_f).
 * Δκ is the change of curvature caused by the film (after minus before deposition). Valid for t_f ≪ t_s,
 * deflections small compared with t_s, a uniform film and an isotropic substrate. For N identical layers the
 * force σ_f t_f adds, so κ grows linearly with the total thickness.
 *
 * Curvature from a center deflection h measured over a radius a (half the scan length), for a spherical cap:
 *   R = (a² + h²)/(2h), so κ = 2h/(a² + h²) ≈ 2h/a².
 *
 * Thermal-mismatch stress after cooling (or heating) from the deposition temperature T_dep to T, for a film
 * with biaxial modulus E_f/(1 − ν_f) on a much thicker substrate (L. B. Freund, S. Suresh, Thin Film Materials,
 * Cambridge 2003, ch. 2, thermal mismatch strain):
 *   σ_th = E_f/(1 − ν_f) · (α_s − α_f)(T − T_dep).
 * Intrinsic stress = measured σ_f − σ_th. Equibiaxial strain ε = σ(1 − ν_f)/E_f and stored elastic energy per
 * area U = σ² t_f (1 − ν_f)/E_f.
 */

/** Curvature produced by a film of stress σ_f and thickness t_f on a substrate, 1/m. NaN for invalid inputs. */
export function stoneyCurvature(sigmaF: number, tF: number, Es: number, nuS: number, tS: number): number {
  if (!(Es > 0 && tS > 0 && tF >= 0 && nuS < 1)) return NaN;
  return (6 * sigmaF * tF * (1 - nuS)) / (Es * tS * tS);
}

/** Film stress from a change of substrate curvature Δκ, Pa. NaN for invalid inputs (t_f ≤ 0, ν_s ≥ 1, …). */
export function stoneyStress(deltaKappa: number, tF: number, Es: number, nuS: number, tS: number): number {
  if (!(Es > 0 && tS > 0 && tF > 0 && nuS < 1)) return NaN;
  return (Es * tS * tS * deltaKappa) / (6 * (1 - nuS) * tF);
}

/** Curvature 2h/(a² + h²) of the sphere through a center deflection h over radius a, 1/m. */
export function curvatureFromDeflection(h: number, a: number): number {
  if (!(a > 0)) return NaN;
  return (2 * h) / (a * a + h * h);
}

/** Center deflection (sagitta) over radius a for curvature κ, m; NaN when |κa| > 1 (no spherical cap). */
export function deflectionFromCurvature(kappa: number, a: number): number {
  const ka = kappa * a;
  if (!(a > 0) || Math.abs(ka) > 1) return NaN;
  // (1 − √(1 − (κa)²))/κ without cancellation at small κ.
  return (kappa * a * a) / (1 + Math.sqrt(1 - ka * ka));
}

/** Thermal-mismatch stress E_f/(1 − ν_f) · (α_s − α_f)(T − T_dep), Pa. */
export function thermalMismatchStress(
  Ef: number, nuF: number, alphaS: number, alphaF: number, T: number, Tdep: number,
): number {
  if (!(Ef > 0 && nuF < 1)) return NaN;
  return (Ef / (1 - nuF)) * (alphaS - alphaF) * (T - Tdep);
}

/** In-plane strain of an equibiaxially stressed film, σ(1 − ν_f)/E_f. */
export function biaxialStrain(sigma: number, Ef: number, nuF: number): number {
  if (!(Ef > 0 && nuF < 1)) return NaN;
  return (sigma * (1 - nuF)) / Ef;
}

/** Elastic energy stored per unit area of an equibiaxially stressed film, σ² t_f (1 − ν_f)/E_f, J/m². */
export function biaxialStrainEnergy(sigma: number, tF: number, Ef: number, nuF: number): number {
  if (!(Ef > 0 && nuF < 1)) return NaN;
  return (sigma * sigma * tF * (1 - nuF)) / Ef;
}

/**
 * Film thickness at which the stored elastic energy U = σ² t_f (1 − ν_f)/E_f reaches the interface toughness Γ
 * (J/m²): t_c = Γ E_f / ((1 − ν_f) σ²), m. A debond can't release more energy per unit area than the film stores,
 * so below t_c the film can't delaminate whatever its flaws (J. W. Hutchinson, Z. Suo, "Mixed mode cracking in
 * layered materials", Adv. Appl. Mech. (1991), pp. 63–191, doi:10.1016/S0065-2156(08)70164-9). Above t_c it may:
 * edge cracks, buckles (compressive films) and channel cracks (tensile films) release only part of U.
 * Infinity for σ = 0; NaN for invalid inputs.
 */
export function delaminationThickness(toughness: number, sigma: number, Ef: number, nuF: number): number {
  if (!(toughness > 0 && Ef > 0 && nuF < 1 && Number.isFinite(sigma))) return NaN;
  if (sigma === 0) return Infinity;
  return (toughness * Ef) / ((1 - nuF) * sigma * sigma);
}
