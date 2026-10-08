/**
 * Published Sellmeier data sets, transcribed from the refractiveindex.info database (CC0; it records each
 * set's original reference and conditions, cited here) and the SCHOTT optical glass catalog. Coefficients are
 * as published; `tests/materials-sellmeier.test.ts` checks every set against independent values (catalog
 * n_d and V_d, or tabulated indices).
 */
import {
  fromPoleForm, fromResonanceWavelengths, fromSquaredForm, type SchottThermalCoefficients, type SellmeierModel,
} from "./sellmeier";

export interface DispersionMaterial {
  name: string;
  model: SellmeierModel;
  /** Original source of the formula. */
  reference: string;
  /** Temperature of the measurements the formula fits, °C (null: "room temperature"). */
  temperature_C: number | null;
}

export interface CatalogGlass extends DispersionMaterial {
  /** Catalog n_d and V_d, as printed. */
  nd: number;
  vd: number;
  /** Density, kg/m³. */
  density: number;
  /** SCHOTT TIE-19 thermo-optic coefficients D₀, D₁, D₂, E₀, E₁, λ_TK. */
  thermal: SchottThermalCoefficients;
}

export const MATERIALS = {
  fusedSilica: {
    name: "Fused silica (SiO₂)",
    model: fromResonanceWavelengths(1, [0.6961663, 0.4079426, 0.8974794], [0.0684043, 0.1162414, 9.896161], [0.21, 6.7]),
    reference: "I. H. Malitson, J. Opt. Soc. Am. 55, 1205 (1965)",
    temperature_C: 20,
  },
  caf2: {
    name: "Calcium fluoride (CaF₂)",
    model: fromResonanceWavelengths(1, [0.5675888, 0.4710914, 3.8484723], [0.050263605, 0.1003909, 34.64904], [0.23, 9.7]),
    reference: "I. H. Malitson, Appl. Opt. 2, 1103 (1963)",
    temperature_C: 24,
  },
  baf2: {
    name: "Barium fluoride (BaF₂)",
    model: fromResonanceWavelengths(1, [0.643356, 0.506762, 3.8261], [0.057789, 0.10968, 46.3864], [0.2652, 10.346]),
    reference: "I. H. Malitson, J. Opt. Soc. Am. 54, 628 (1964)",
    temperature_C: 25,
  },
  mgf2: {
    name: "Magnesium fluoride (MgF₂, ordinary)",
    model: fromResonanceWavelengths(1, [0.48755108, 0.39875031, 2.3120353], [0.04338408, 0.09461442, 23.793604], [0.2, 7.0]),
    reference: "M. J. Dodge, Appl. Opt. 23, 1980 (1984)",
    temperature_C: 19,
  },
  nacl: {
    name: "Sodium chloride (NaCl)",
    model: fromResonanceWavelengths(
      1.00055,
      [0.198, 0.48398, 0.38696, 0.25998, 0.08796, 3.17064, 0.30038],
      [0.05, 0.1, 0.128, 0.158, 40.5, 60.98, 120.34],
      [0.2, 30],
    ),
    reference: "H. H. Li, J. Phys. Chem. Ref. Data 5, 329 (1976)",
    temperature_C: 24,
  },
  ge: {
    name: "Germanium (Ge)",
    model: fromSquaredForm(1, [0.4886331, 14.5142535, 0.0091224], [1.393959, 0.1626427, 752.19], [2, 14]),
    reference: "J. H. Burnett et al., Proc. SPIE 9974, 99740X (2016)",
    temperature_C: 22,
  },
  si: {
    name: "Silicon (Si)",
    model: fromResonanceWavelengths(1, [10.6684293, 0.0030434748, 1.54133408], [0.301516485, 1.13475115, 1104], [1.357, 11.04]),
    reference: "C. D. Salzberg, J. J. Villa, J. Opt. Soc. Am. 47, 244 (1957); fit by B. Tatian, Appl. Opt. 23, 4477 (1984)",
    temperature_C: 26,
  },
  znse: {
    name: "Zinc selenide (ZnSe, CVD)",
    model: fromResonanceWavelengths(1, [4.45813734, 0.467216334, 2.8956629], [0.200859853, 0.391371166, 47.1362108], [0.54, 18.2]),
    reference: "J. Connolly et al., Proc. SPIE 181, 141 (1979); fit by B. Tatian, Appl. Opt. 23, 4477 (1984)",
    temperature_C: 23,
  },
  zns: {
    name: "Zinc sulfide (ZnS, cubic CVD)",
    // Published as n² = 8.393 + 0.14383/(λ² − 0.2421²) + 4430.99/(λ² − 36.71²).
    model: fromPoleForm(8.393, [0.14383, 4430.99], [0.2421 ** 2, 36.71 ** 2], [0.405, 13]),
    reference: "M. Debenham, Appl. Opt. 23, 2238 (1984)",
    temperature_C: 20,
  },
  diamond: {
    name: "Diamond (C)",
    model: fromResonanceWavelengths(1, [0.3306, 4.3356], [0.175, 0.106], [0.226, 0.76]),
    reference: "F. Peter, Z. Phys. 15, 358 (1923)",
    temperature_C: null,
  },
} as const satisfies Record<string, DispersionMaterial>;

export type MaterialId = keyof typeof MATERIALS;

const SCHOTT_REFERENCE = "SCHOTT optical glass catalog (Zemax AGF 2017-01-20)";

function schott(
  name: string, B: readonly number[], C: readonly number[], range_um: readonly [number, number],
  nd: number, vd: number, density: number, thermal: SchottThermalCoefficients,
): CatalogGlass {
  return { name, model: fromSquaredForm(1, B, C, range_um), reference: SCHOTT_REFERENCE, temperature_C: 20, nd, vd, density, thermal };
}

export const SCHOTT_GLASSES = {
  "N-BK7": schott("N-BK7", [1.03961212, 0.231792344, 1.01046945], [0.00600069867, 0.0200179144, 103.560653], [0.3, 2.5],
    1.5168, 64.17, 2510, [1.86e-6, 1.31e-8, -1.37e-11, 4.34e-7, 6.27e-10, 0.17]),
  "N-FK5": schott("N-FK5", [0.844309338, 0.344147824, 0.910790213], [0.00475111955, 0.0149814849, 97.8600293], [0.26, 2.5],
    1.48749, 70.41, 2450, [-7.24e-6, 1.58e-8, -9.51e-12, 3.51e-7, 4.61e-10, 0.156]),
  "N-BAK4": schott("N-BAK4", [1.28834642, 0.132817724, 0.945395373], [0.00779980626, 0.0315631177, 105.965875], [0.334, 2.5],
    1.56883, 55.98, 3046, [3.06e-6, 1.44e-8, -2.23e-11, 5.46e-7, 6.05e-10, 0.189]),
  "N-SK16": schott("N-SK16", [1.34317774, 0.241144399, 0.994317969], [0.00704687339, 0.0229005, 92.7508526], [0.31, 2.5],
    1.62041, 60.32, 3580, [-2.37e-8, 1.32e-8, -1.29e-11, 4.09e-7, 5.17e-10, 0.17]),
  "N-LAK9": schott("N-LAK9", [1.46231905, 0.344399589, 1.15508372], [0.00724270156, 0.0243353131, 85.4686868], [0.3, 2.5],
    1.691, 54.71, 3510, [2.11e-6, 1.11e-8, 1.82e-12, 4.74e-7, -3.47e-10, 0.146]),
  LLF1: schott("LLF1", [1.21640125, 0.13366454, 0.883399468], [0.00857807248, 0.0420143003, 107.59306], [0.31, 2.5],
    1.54814, 45.75, 2940, [3.25e-7, 1.74e-8, -6.12e-11, 6.53e-7, 2.58e-10, 0.233]),
  F2: schott("F2", [1.34533359, 0.209073176, 0.937357162], [0.00997743871, 0.0470450767, 111.886764], [0.32, 2.5],
    1.62004, 36.37, 3599, [1.51e-6, 1.56e-8, -2.78e-11, 9.34e-7, 1.04e-9, 0.25]),
  "N-LASF9": schott("N-LASF9", [2.00029547, 0.298926886, 1.80691843], [0.0121426017, 0.0538736236, 156.530829], [0.365, 2.5],
    1.85025, 32.17, 4410, [1.05e-6, 1.02e-8, -2.38e-11, 9.19e-7, 1.18e-9, 0.257]),
  "N-SF11": schott("N-SF11", [1.73759695, 0.313747346, 1.89878101], [0.013188707, 0.0623068142, 155.23629], [0.37, 2.5],
    1.78472, 25.68, 3224, [-3.56e-6, 9.2e-9, -2.1e-11, 9.65e-7, 1.44e-9, 0.294]),
  "N-SF6": schott("N-SF6", [1.77931763, 0.338149866, 2.08734474], [0.0133714182, 0.0617533621, 174.01759], [0.37, 2.5],
    1.80518, 25.36, 3369, [-4.93e-6, 7.02e-9, -2.4e-11, 9.84e-7, 1.54e-9, 0.29]),
} as const satisfies Record<string, CatalogGlass>;

export type GlassId = keyof typeof SCHOTT_GLASSES;
