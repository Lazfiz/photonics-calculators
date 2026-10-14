/**
 * Ion-assisted deposition (IAD): arrival rates at the substrate and the ion-bombardment parameters
 * per deposited molecule that IAD results are reported against (ion-to-molecule ratio, energy and
 * momentum per molecule).
 *
 * Model tier: Exact kinematics for singly charged ions and a film at bulk density. The film properties
 * these parameters lead to (packing density, index, stress) depend on the material, the source and the
 * geometry, so they come from experiment and are not modelled here.
 *
 * References: P. J. Martin, H. A. Macleod, R. P. Netterfield, C. G. Pacey, W. G. Sainty, Appl. Opt. 22,
 * 178 (1983), doi:10.1364/AO.22.000178 (ion/molecule arrival ratio of IAD oxide films).
 * M. Ohring, Materials Science of Thin Films, 2nd ed. (Academic Press, 2002), ch. 5 (ion-beam assisted
 * deposition, energy per deposited atom).
 */
import { N_A, q } from "../constants";

export interface Compound {
  name: string;
  /** Molar mass of the formula unit (kg/mol). */
  M: number;
  /** Bulk density (kg/m³), CRC Handbook. */
  rho: number;
  /** Atoms per formula unit. */
  atoms: number;
}

/** Common IAD coating materials; densities of the bulk (amorphous SiO₂, rutile, corundum, monoclinic). */
export const IAD_MATERIALS = {
  SiO2: { name: "SiO₂", M: 60.084e-3, rho: 2200, atoms: 3 },
  TiO2: { name: "TiO₂", M: 79.866e-3, rho: 4230, atoms: 3 },
  Ta2O5: { name: "Ta₂O₅", M: 441.89e-3, rho: 8180, atoms: 7 },
  Al2O3: { name: "Al₂O₃", M: 101.96e-3, rho: 3987, atoms: 5 },
  ZrO2: { name: "ZrO₂", M: 123.22e-3, rho: 5680, atoms: 3 },
  HfO2: { name: "HfO₂", M: 210.49e-3, rho: 9680, atoms: 3 },
  MgF2: { name: "MgF₂", M: 62.30e-3, rho: 3148, atoms: 3 },
} as const satisfies Record<string, Compound>;

export type IadMaterialId = keyof typeof IAD_MATERIALS;

/** Flux of singly charged ions (m⁻² s⁻¹) for a current density J (A/m²). NaN unless J ≥ 0. */
export function ionFlux(J: number): number {
  if (!(J >= 0)) return NaN;
  return J / q;
}

/**
 * Arrival rate of formula units (m⁻² s⁻¹) that builds a film at rate r (m/s): r ρ N_A / M, sticking
 * coefficient 1. NaN unless r ≥ 0 and ρ, M > 0.
 */
export function moleculeFlux(rate: number, rho: number, M: number): number {
  if (!(rate >= 0 && rho > 0 && M > 0)) return NaN;
  return (rate * rho * N_A) / M;
}

export interface IadParameters {
  /** Ion flux (m⁻² s⁻¹). */
  ionFlux: number;
  /** Formula-unit flux (m⁻² s⁻¹). */
  moleculeFlux: number;
  /** Ions per arriving formula unit. */
  ratio: number;
  /** Ion energy per arriving formula unit (eV). */
  energyPerMolecule: number;
  /** Ion energy per arriving atom (eV). */
  energyPerAtom: number;
  /** Ion momentum per arriving formula unit, in √(u·eV) (ratio × √(2 m_i E) with m_i in u, E in eV). */
  momentumPerMolecule: number;
}

/**
 * Bombardment parameters for ions of energy E (eV) and mass m (u) at current density J (A/m²), with a
 * film of `mat` growing at r (m/s). NaN fields when the inputs are out of domain or r = 0.
 */
export function iadParameters(E: number, mIon: number, J: number, rate: number, mat: Compound): IadParameters {
  const fi = ionFlux(J);
  const fm = moleculeFlux(rate, mat.rho, mat.M);
  const ratio = fm > 0 ? fi / fm : NaN;
  const e = E >= 0 ? E : NaN;
  return {
    ionFlux: fi,
    moleculeFlux: fm,
    ratio,
    energyPerMolecule: ratio * e,
    energyPerAtom: (ratio * e) / mat.atoms,
    momentumPerMolecule: mIon > 0 ? ratio * Math.sqrt(2 * mIon * e) : NaN,
  };
}
