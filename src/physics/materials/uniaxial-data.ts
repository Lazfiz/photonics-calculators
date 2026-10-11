/**
 * Ordinary and extraordinary Sellmeier sets of uniaxial crystals, transcribed from the refractiveindex.info
 * database (CC0; it records each set's original reference and conditions, cited here, DOIs checked on
 * Crossref). Coefficients are as published; `tests/polarization-uniaxial.test.ts` checks every set against an
 * independent measurement or fit. Wavelengths in m; Δn = n_e − n_o (> 0: positive uniaxial).
 */
import { fromPoleForm, fromResonanceWavelengths, fromSquaredForm, refractiveIndex, type SellmeierModel } from "./sellmeier";
import { MATERIALS } from "./sellmeier-data";

export interface UniaxialCrystal {
  name: string;
  /** Ordinary and extraordinary index models. */
  o: SellmeierModel;
  e: SellmeierModel;
  reference: string;
  /** Temperature of the measurements the formula fits, °C (null: "room temperature"). */
  temperature_C: number | null;
}

// Ghosh writes n² = A + Bλ²/(λ² − C) + Dλ²/(λ² − E); Zelmon and Lomheim n² − 1 = Σ Bλ²/(λ² − C);
// DeVore n² = A + B/(λ² − C); Dodge and Malitson n² − 1 = Σ Bλ²/(λ² − λᵢ²). λ in µm.
export const UNIAXIAL_CRYSTALS = {
  quartz: {
    name: "Crystal quartz (α-SiO₂)",
    o: fromSquaredForm(1.28604141, [1.07044083, 1.10202242], [1.00585997e-2, 100], [0.198, 2.0531]),
    e: fromSquaredForm(1.28851804, [1.09509924, 1.15662475], [1.02101864e-2, 100], [0.198, 2.0531]),
    reference: "G. Ghosh, Opt. Commun. 163, 95 (1999), doi:10.1016/S0030-4018(99)00091-7",
    temperature_C: null,
  },
  calcite: {
    name: "Calcite (CaCO₃)",
    o: fromSquaredForm(1.73358749, [0.96464345, 1.82831454], [1.94325203e-2, 120], [0.204, 2.172]),
    e: fromSquaredForm(1.35859695, [0.8242783, 0.14429128], [1.06689543e-2, 120], [0.204, 2.172]),
    reference: "G. Ghosh, Opt. Commun. 163, 95 (1999), doi:10.1016/S0030-4018(99)00091-7",
    temperature_C: null,
  },
  mgf2: {
    name: "Magnesium fluoride (MgF₂)",
    o: MATERIALS.mgf2.model,
    e: fromResonanceWavelengths(1, [0.41344023, 0.50497499, 2.4904862], [0.03684262, 0.09076162, 23.771995], [0.2, 7.0]),
    reference: "M. J. Dodge, Appl. Opt. 23, 1980 (1984), doi:10.1364/AO.23.001980",
    temperature_C: 19,
  },
  sapphire: {
    name: "Sapphire (α-Al₂O₃)",
    o: fromResonanceWavelengths(1, [1.4313493, 0.65054713, 5.3414021], [0.0726631, 0.1193242, 18.028251], [0.2, 5.0]),
    e: fromResonanceWavelengths(1, [1.5039759, 0.55069141, 6.5927379], [0.0740288, 0.1216529, 20.072248], [0.2, 5.0]),
    reference:
      "I. H. Malitson, M. J. Dodge, J. Opt. Soc. Am. 62, 1405 (1972), meeting abstract; formula in M. J. Dodge, " +
      "Handbook of Laser Science and Technology, vol. IV, part 2 (CRC Press, 1986), p. 30",
    temperature_C: 20,
  },
  yvo4: {
    name: "Yttrium orthovanadate (YVO₄)",
    o: fromSquaredForm(1, [2.7665], [0.026884], [0.488, 3.39]),
    e: fromSquaredForm(1, [3.593], [0.032103], [0.488, 3.39]),
    reference: "T. S. Lomheim, L. G. DeShazer, J. Appl. Phys. 49, 5517 (1978), doi:10.1063/1.324471",
    temperature_C: null,
  },
  linbo3: {
    name: "Lithium niobate (LiNbO₃, congruent)",
    o: fromSquaredForm(1, [2.6734, 1.229, 12.614], [0.01764, 0.05914, 474.6], [0.4, 5.0]),
    e: fromSquaredForm(1, [2.9804, 0.5981, 8.9543], [0.02047, 0.0666, 416.08], [0.4, 5.0]),
    reference: "D. E. Zelmon, D. L. Small, D. Jundt, J. Opt. Soc. Am. B 14, 3319 (1997), doi:10.1364/JOSAB.14.003319",
    temperature_C: 21,
  },
  rutile: {
    name: "Rutile (TiO₂)",
    o: fromPoleForm(5.913, [0.2441], [0.0803], [0.43, 1.53]),
    e: fromPoleForm(7.197, [0.3322], [0.0843], [0.43, 1.53]),
    reference: "J. R. DeVore, J. Opt. Soc. Am. 41, 416 (1951), doi:10.1364/JOSA.41.000416",
    temperature_C: null,
  },
} as const satisfies Record<string, UniaxialCrystal>;

export type CrystalId = keyof typeof UNIAXIAL_CRYSTALS;

export const CRYSTAL_IDS = Object.keys(UNIAXIAL_CRYSTALS) as CrystalId[];

/** n_o and n_e at λ (m); NaN outside a set's range is the caller's to guard (see `crystalRange`). */
export function crystalIndices(id: CrystalId, lambda: number): { no: number; ne: number } {
  const c = UNIAXIAL_CRYSTALS[id];
  return { no: refractiveIndex(c.o, lambda), ne: refractiveIndex(c.e, lambda) };
}

/** Wavelength range where both the o and e fits hold, m. */
export function crystalRange(id: CrystalId): [number, number] {
  const c = UNIAXIAL_CRYSTALS[id];
  return [Math.max(c.o.range[0], c.e.range[0]), Math.min(c.o.range[1], c.e.range[1])];
}
