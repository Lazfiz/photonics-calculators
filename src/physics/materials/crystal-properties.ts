/**
 * Data-sheet properties of calcite, crystal quartz, sapphire and diamond, the rotatory power of quartz, and the
 * index of diamond from the UV to the far infrared. SI units in and out (wavelengths in m), except where a field
 * name gives the unit.
 *
 * - Properties: Crystran data sheets (crystran.com/optical-materials), room temperature. "∥"/"⊥" are relative to
 *   the c (optic) axis, as Crystran labels them.
 * - Quartz rotatory power along the optic axis, Chandrasekhar's single-term fit to Lowry & Coode-Adams' measurements:
 *   ρ = kλ²/(λ² − λ₀²)², k = 7.186 °·µm²/mm, λ₀ = 0.0926283 µm (S. Chandrasekhar, Proc. Indian Acad. Sci. A 35,
 *   103 (1952), doi:10.1007/BF03172225; data: T. M. Lowry, W. R. C. Coode-Adams, Phil. Trans. R. Soc. A 226, 391
 *   (1927), doi:10.1098/rsta.1927.0010). 21.75 °/mm at 589.3 nm against the measured 21.72. Model tier: textbook
 *   (one oscillator; the 1927 data are at 20 °C). Off the axis, the linear birefringence swamps it.
 * - Diamond n(λ): Peter's Sellmeier formula (sellmeier-data) over his 226–644 nm, then Palik's values as Crystran
 *   tabulates them (0.656–20 µm), interpolated linearly in λ. The 2.5–7 µm multiphonon band absorbs.
 */
import { WINDOW_MATERIALS } from "./window-materials";

/** A value along and across the c axis (equal for an isotropic crystal). */
export interface AxisPair {
  para: number;
  perp: number;
}

export interface CrystalSheet {
  /** Transmission bands, m. */
  bands: readonly (readonly [number, number])[];
  density_g_cm3: number;
  meltingPoint_C: number;
  meltingNote?: string;
  /**
   * dn/dT, 1/K, at the wavelength given. Crystran labels these by propagation direction: "∥ c" is light travelling along c,
   * which sees n_o, so para = dn_o/dT and perp = dn_e/dT for the uniaxial crystals (calcite: 3 and 13; quartz: −5.5 and −6.5).
   */
  dnDT: AxisPair;
  dnDTLambda: number;
  /** Thermal conductivity, W/(m·K). */
  conductivity: AxisPair;
  /** Thermal expansion, 1/K. */
  expansion: AxisPair;
  /** Knoop hardness, kg/mm² (a range where Crystran gives one). */
  knoop: string;
  specificHeat_J_kgK: number;
  youngs_GPa: AxisPair;
}

const um = (...b: [number, number][]) => b.map(([lo, hi]) => [lo * 1e-6, hi * 1e-6] as const);
const same = (v: number): AxisPair => ({ para: v, perp: v });

export const CRYSTAL_SHEETS = {
  calcite: {
    bands: um([0.3, 2.3]), density_g_cm3: 2.71, meltingPoint_C: 825, meltingNote: "decomposes",
    dnDT: { para: 3e-6, perp: 13e-6 }, dnDTLambda: 0.5e-6, conductivity: { para: 5.526, perp: 4.646 },
    expansion: { para: 25e-6, perp: -5.8e-6 }, knoop: "155 (Mohs 3)", specificHeat_J_kgK: 852,
    youngs_GPa: { para: 88.19, perp: 72.35 },
  },
  quartz: {
    bands: um([0.18, 3.5], [40, 100]), density_g_cm3: 2.649, meltingPoint_C: 1710, meltingNote: "α→β at 573 °C",
    dnDT: { para: -5.5e-6, perp: -6.5e-6 }, dnDTLambda: 633e-9, conductivity: { para: 10.7, perp: 6.2 },
    expansion: { para: 7.1e-6, perp: 13.2e-6 }, knoop: "741", specificHeat_J_kgK: 710,
    youngs_GPa: { para: 97.2, perp: 76.5 },
  },
  sapphire: {
    bands: um([0.17, 5.5]), density_g_cm3: 3.97, meltingPoint_C: 2040,
    dnDT: same(13.1e-6), dnDTLambda: 546e-9, conductivity: same(27.21),
    expansion: { para: 5.6e-6, perp: 5.0e-6 }, knoop: "1800 ∥, 2200 ⊥", specificHeat_J_kgK: 763, youngs_GPa: same(335),
  },
  diamond: {
    bands: WINDOW_MATERIALS.diamond.bands, density_g_cm3: 3.51, meltingPoint_C: 3497, meltingNote: "oxidises in air at 700 °C",
    dnDT: same(9.6e-6), dnDTLambda: 10.6e-6, conductivity: same(2600),
    expansion: same(1.0e-6), knoop: "5700–10400", specificHeat_J_kgK: 502, youngs_GPa: same(1050),
  },
} satisfies Record<string, CrystalSheet>;

export type SheetId = keyof typeof CRYSTAL_SHEETS;

// ------------------------------------------------------------------ quartz optical activity

const ROTATION_K = 7.186; // °·µm²/mm
const ROTATION_LAMBDA0_UM = 0.0926283;

/** Rotatory power of α-quartz along the optic axis, rad/m (Chandrasekhar 1952); NaN for λ ≤ λ₀. */
export function quartzRotatoryPower(lambda: number): number {
  const l2 = (lambda * 1e6) ** 2;
  const d = l2 - ROTATION_LAMBDA0_UM ** 2;
  if (!(d > 0)) return NaN;
  const degPerMm = (ROTATION_K * l2) / (d * d);
  return degPerMm * (Math.PI / 180) * 1e3;
}

// ------------------------------------------------------------------ diamond index

// Diamond n(λ) lives with the window materials, which also use it; re-exported here for the diamond page.
export { DIAMOND_IR_SOURCE, DIAMOND_RANGE, diamondIndex } from "./window-materials";
