/**
 * X-ray refractive index n = 1 − δ − iβ of an element or compound from the atomic scattering factors f₁, f₂
 * (forward scattering, independent atoms). SI units: energy in eV, lengths in m, densities in kg/m³.
 *
 *   δ = (r_e λ²/2π) Σ n_q f₁,q,   β = (r_e λ²/2π) Σ n_q f₂,q,   n_q = ρ N_A x_q / Σ x_j A_j
 * (B. L. Henke, E. M. Gullikson, J. C. Davis, At. Data Nucl. Data Tables 54, 181 (1993), doi:10.1006/adnd.1993.1013,
 * Introduction; J. Als-Nielsen, D. McMorrow, Elements of Modern X-ray Physics, 2nd ed., Wiley 2011, ch. 3).
 * Critical angle of total external reflection θ_c = √(2δ) (Als-Nielsen & McMorrow ch. 3, small-angle limit).
 * Intensity attenuation coefficient μ = 4πβ/λ, attenuation length 1/μ.
 * Model tier: exact for the tabulated f₁, f₂ (independent-atom model; wrong within ~50 eV of an edge, where the
 * chemical state matters). β uses photoabsorption only: Compton scattering, which CXRO's calculator adds, raises β
 * of Be by 28 % and of C by 6 % at 10 keV (less than 1 % for Si and heavier).
 */

import { N_A, hc_eV_nm, r_e } from "../constants";
import { HENKE, type HenkeId } from "./henke-data";

/** Range of the tabulated scattering factors, eV. */
export const HENKE_E_MIN = 1000;
export const HENKE_E_MAX = 30000;

/** f₁, f₂ of one element at energy E (eV), interpolated in ln E (f₁ linear, ln f₂ linear). NaN outside 1–30 keV. */
export function scatteringFactors(id: HenkeId, E_eV: number): { f1: number; f2: number } {
  const { E, f1, f2 } = HENKE[id];
  if (!(E_eV >= HENKE_E_MIN && E_eV <= HENKE_E_MAX)) return { f1: NaN, f2: NaN };
  let lo = 0;
  let hi = E.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (E[mid] <= E_eV) lo = mid;
    else hi = mid;
  }
  const t = Math.log(E_eV / E[lo]) / Math.log(E[hi] / E[lo]);
  return { f1: f1[lo] + t * (f1[hi] - f1[lo]), f2: Math.exp(Math.log(f2[lo]) + t * Math.log(f2[hi] / f2[lo])) };
}

export type XRayMaterialId = "Be" | "diamond" | "Si" | "Ni" | "Cu" | "Mo" | "Pt" | "Au" | "polyimide" | "Si3N4";

export interface XRayMaterial {
  label: string;
  /** Atoms per formula unit. */
  formula: Partial<Record<HenkeId, number>>;
  /** Default density, g/cm³. */
  rho_gcc: number;
}

/**
 * Densities: the CXRO defaults (https://henke.lbl.gov/optical_constants/getdb2.html and its compound list), except
 * diamond (3.515 g/cm³, CRC Handbook of Chemistry and Physics; CXRO's carbon default is graphite, 2.2).
 * Polyimide is Kapton, C₂₂H₁₀N₂O₅. Si₃N₄ 3.44 is the CXRO value; LPCVD membranes are less dense, so enter a measured one.
 */
export const XRAY_MATERIALS: Record<XRayMaterialId, XRayMaterial> = {
  Be: { label: "Beryllium (Be)", formula: { Be: 1 }, rho_gcc: 1.848 },
  diamond: { label: "Diamond (C)", formula: { C: 1 }, rho_gcc: 3.515 },
  Si: { label: "Silicon (Si)", formula: { Si: 1 }, rho_gcc: 2.33 },
  Ni: { label: "Nickel (Ni)", formula: { Ni: 1 }, rho_gcc: 8.902 },
  Cu: { label: "Copper (Cu)", formula: { Cu: 1 }, rho_gcc: 8.96 },
  Mo: { label: "Molybdenum (Mo)", formula: { Mo: 1 }, rho_gcc: 10.22 },
  Pt: { label: "Platinum (Pt)", formula: { Pt: 1 }, rho_gcc: 21.45 },
  Au: { label: "Gold (Au)", formula: { Au: 1 }, rho_gcc: 19.32 },
  polyimide: { label: "Kapton (C₂₂H₁₀N₂O₅)", formula: { C: 22, H: 10, N: 2, O: 5 }, rho_gcc: 1.43 },
  Si3N4: { label: "Silicon nitride (Si₃N₄)", formula: { Si: 3, N: 4 }, rho_gcc: 3.44 },
};

/** Photon wavelength, m, at energy E (eV). */
export const xrayWavelength = (E_eV: number) => (hc_eV_nm / E_eV) * 1e-9;

export interface XRayIndex {
  delta: number;
  beta: number;
  /** Critical angle √(2δ), rad. */
  thetaC: number;
  /** Intensity attenuation length λ/(4πβ), m. */
  attenuationLength: number;
  /** Mass attenuation coefficient μ/ρ, m²/kg (photoabsorption). */
  massAttenuation: number;
}

/** δ, β, θ_c and attenuation of a material of density rho (kg/m³) at energy E (eV). NaN outside 1–30 keV or ρ ≤ 0. */
export function xrayIndex(formula: Partial<Record<HenkeId, number>>, rho: number, E_eV: number): XRayIndex {
  const entries = Object.entries(formula) as [HenkeId, number][];
  const molarMass = entries.reduce((s, [id, x]) => s + x * HENKE[id].A, 0) * 1e-3; // kg/mol per formula unit
  if (!(rho > 0) || !(molarMass > 0)) return { delta: NaN, beta: NaN, thetaC: NaN, attenuationLength: NaN, massAttenuation: NaN };
  const units = (rho * N_A) / molarMass; // formula units per m³
  let sum1 = 0;
  let sum2 = 0;
  for (const [id, x] of entries) {
    const f = scatteringFactors(id, E_eV);
    sum1 += x * f.f1;
    sum2 += x * f.f2;
  }
  const lambda = xrayWavelength(E_eV);
  const k = (r_e * lambda ** 2 * units) / (2 * Math.PI);
  const delta = k * sum1;
  const beta = k * sum2;
  const mu = (4 * Math.PI * beta) / lambda;
  return {
    delta,
    beta,
    thetaC: delta > 0 ? Math.sqrt(2 * delta) : NaN,
    attenuationLength: mu > 0 ? 1 / mu : NaN,
    massAttenuation: mu / rho,
  };
}

/** Transmission exp(−t/L) through thickness t (m) for attenuation length L (m). */
export const xrayTransmission = (t: number, L: number) => (t >= 0 && L > 0 ? Math.exp(-t / L) : NaN);
