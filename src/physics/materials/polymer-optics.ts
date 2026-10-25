/**
 * Refractive index and dispersion of optical polymers from published fits. SI units: wavelengths in m.
 *
 * Three fit forms (λ in µm), as recorded by the refractiveindex.info database (CC0), which cites each source:
 * - Sellmeier, n² = 1 + Bλ²/(λ² − C): delegated to `sellmeier.ts`.
 * - Power series in n², n² = A + Σ Bᵢλ^pᵢ (Beadie et al. 2015 for PMMA).
 * - Cauchy, n = A + Σ Bᵢλ^pᵢ (manufacturer fits for NOA 61 and SU-8).
 * Derived: group index n_g = n − λ dn/dλ, Abbe number V_d = (n_d − 1)/(n_F − n_C) (d, F, C lines from
 * `sellmeier.ts`), normal-incidence Fresnel reflectance R = ((n − 1)/(n + 1))² in air, and the numerical aperture
 * of a core/cladding pair NA = √(n₁² − n₂²) (Saleh & Teich, Fundamentals of Photonics, 2nd ed., ch. 9).
 * Model tier: exact for each fit inside its wavelength range; the fits match their measurements within
 * 1e-3 (Sultanova) or 2e-4 (Beadie). Polymer indices also vary by grade, cure and temperature,
 * which the fits do not cover; NaN outside the range.
 */

import { normalIncidenceReflectance } from "../polarization/fresnel";
import {
  LAMBDA_C, LAMBDA_D, LAMBDA_F, fromSquaredForm,
  dnDlambda as sellmeierDnDlambda, refractiveIndex as sellmeierIndex, type SellmeierModel,
} from "./sellmeier";

export type PolymerDispersion =
  | { form: "sellmeier"; model: SellmeierModel }
  | { form: "n2-power" | "n-power"; A: number; terms: readonly (readonly [number, number])[]; range: readonly [number, number] };

export interface Polymer {
  name: string;
  dispersion: PolymerDispersion;
  /** Original source of the fit or of the data it fits. */
  reference: string;
}

const um = (r: readonly [number, number]) => [r[0] * 1e-6, r[1] * 1e-6] as const;

export const POLYMERS = {
  pmma: {
    name: "PMMA (acrylic)",
    // n² = A + Σ Bᵢλ^pᵢ, 20.1 °C, 0.42–1.62 µm, absolute accuracy < 2e-4.
    dispersion: {
      form: "n2-power", A: 2.1778,
      terms: [[6.1209e-3, 2], [-1.5004e-3, 4], [2.3678e-2, -2], [-4.2137e-3, -4], [7.3417e-4, -6], [-4.5042e-5, -8]],
      range: um([0.42, 1.62]),
    },
    reference: "G. Beadie et al., Appl. Opt. 54, F139 (2015)",
  },
  pc: {
    name: "Polycarbonate (PC)",
    dispersion: { form: "sellmeier", model: fromSquaredForm(1, [1.4182], [0.021304], [0.4368, 1.052]) },
    reference: "N. Sultanova et al., Acta Phys. Pol. A 116, 585 (2009), 20 °C; Sellmeier fit by M. Polyanskiy",
  },
  ps: {
    name: "Polystyrene (PS)",
    dispersion: { form: "sellmeier", model: fromSquaredForm(1, [1.4435], [0.020216], [0.4368, 1.052]) },
    reference: "N. Sultanova et al., Acta Phys. Pol. A 116, 585 (2009), 20 °C; Sellmeier fit by M. Polyanskiy",
  },
  zeonex: {
    name: "Cyclo-olefin polymer (Zeonex E48R)",
    dispersion: { form: "sellmeier", model: fromSquaredForm(1, [1.2969], [0.011721], [0.4368, 1.052]) },
    reference: "N. Sultanova et al., Acta Phys. Pol. A 116, 585 (2009), 20 °C",
  },
  noa61: {
    name: "Norland NOA 61 (cured adhesive)",
    dispersion: { form: "n-power", A: 1.5375, terms: [[0.00829045, -2], [-0.000211046, -4]], range: um([0.45, 1.55]) },
    reference: "Norland Products, NOA 61 data sheet (Cauchy fit as recorded by refractiveindex.info, 2016; within 5e-4 of the sheet's 480–644 nm table)",
  },
  su8: {
    name: "SU-8 2000 (uncured resist)",
    dispersion: { form: "n-power", A: 1.566, terms: [[0.00796, -2], [0.00014, -4]], range: um([0.32, 0.8]) },
    reference: "MicroChem, SU-8 2000 data sheet (2011), Cauchy coefficients, uncured",
  },
} as const satisfies Record<string, Polymer>;

export type PolymerId = keyof typeof POLYMERS;

/** Fit range, m. */
export function polymerRange(d: PolymerDispersion): readonly [number, number] {
  return d.form === "sellmeier" ? d.model.range : d.range;
}

const inside = (d: PolymerDispersion, lambda: number) => {
  const [lo, hi] = polymerRange(d);
  return lambda >= lo && lambda <= hi;
};

/** Σ Bᵢxᵖⁱ and its x-derivative, x in µm. */
function series(terms: readonly (readonly [number, number])[], x: number) {
  let s = 0;
  let s1 = 0;
  for (const [b, p] of terms) {
    s += b * x ** p;
    s1 += p * b * x ** (p - 1);
  }
  return { s, s1 };
}

/** Refractive index at λ (m); NaN outside the fit range. */
export function polymerIndex(d: PolymerDispersion, lambda: number): number {
  if (!inside(d, lambda)) return NaN;
  if (d.form === "sellmeier") return sellmeierIndex(d.model, lambda);
  const { s } = series(d.terms, lambda * 1e6);
  if (d.form === "n-power") return d.A + s;
  return d.A + s > 0 ? Math.sqrt(d.A + s) : NaN;
}

/** dn/dλ, 1/m; NaN outside the fit range. */
export function polymerDnDlambda(d: PolymerDispersion, lambda: number): number {
  if (!inside(d, lambda)) return NaN;
  if (d.form === "sellmeier") return sellmeierDnDlambda(d.model, lambda);
  const { s1 } = series(d.terms, lambda * 1e6);
  return (d.form === "n-power" ? s1 : s1 / (2 * polymerIndex(d, lambda))) * 1e6;
}

/** Group index n − λ dn/dλ. */
export const polymerGroupIndex = (d: PolymerDispersion, lambda: number) =>
  polymerIndex(d, lambda) - lambda * polymerDnDlambda(d, lambda);

/** Abbe number V_d = (n_d − 1)/(n_F − n_C); NaN if the fit does not cover 486–656 nm. */
export function polymerAbbe(d: PolymerDispersion): number {
  return (polymerIndex(d, LAMBDA_D) - 1) / (polymerIndex(d, LAMBDA_F) - polymerIndex(d, LAMBDA_C));
}

/** Normal-incidence reflectance of one surface between media n₀ and n. */
export const normalReflectance = (n: number, n0 = 1) => normalIncidenceReflectance(n0, n);

/** Numerical aperture √(n₁² − n₂²) of a core n₁ in a cladding n₂ (launch from air); NaN if n₂ ≥ n₁. */
export function corecladNA(n1: number, n2: number): number {
  const d = n1 * n1 - n2 * n2;
  return d > 0 ? Math.sqrt(d) : NaN;
}
