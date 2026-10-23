/**
 * Principal-axis Sellmeier sets of biaxial crystals (n_x < n_y < n_z), transcribed from the refractiveindex.info
 * database (CC0; DOIs checked on Crossref). Both papers print n² = A + B₁/(λ² − C₁) [+ B₂/(λ² − C₂)] − Kλ², λ in µm,
 * 20 °C. `tests/materials-biaxial.test.ts` checks them against independent data-sheet indices and cut angles.
 */
import { fromPoleForm, refractiveIndex, type SellmeierModel } from "./sellmeier";

export interface BiaxialCrystal {
  name: string;
  x: SellmeierModel;
  y: SellmeierModel;
  z: SellmeierModel;
  reference: string;
}

export const BIAXIAL_CRYSTALS = {
  ktp: {
    name: "KTP (KTiOPO₄)",
    x: fromPoleForm(3.29100, [0.04140, 9.35522], [0.03978, 31.45571], [0.43, 3.54]),
    y: fromPoleForm(3.45018, [0.04341, 16.98825], [0.04597, 39.43799], [0.43, 3.54]),
    z: fromPoleForm(4.59423, [0.06206, 110.80672], [0.04763, 86.12171], [0.43, 3.54]),
    reference: "K. Kato, E. Takaoka, Appl. Opt. 41, 5040 (2002), doi:10.1364/AO.41.005040",
  },
  bibo: {
    name: "BiBO (BiB₃O₆)",
    x: fromPoleForm(3.07403, [0.03231], [0.03163], [0.48, 3.1], -0.013376),
    y: fromPoleForm(3.1694, [0.03717], [0.03483], [0.48, 3.1], -0.01827),
    z: fromPoleForm(3.6545, [0.05112], [0.03713], [0.48, 3.1], -0.02261),
    reference: "N. Umemura, K. Miyata, K. Kato, Opt. Mater. 30, 532 (2007), doi:10.1016/j.optmat.2006.12.014",
  },
} as const satisfies Record<string, BiaxialCrystal>;

export type BiaxialId = keyof typeof BIAXIAL_CRYSTALS;

/** Principal indices at λ (m); NaN outside the fit range. */
export function biaxialIndices(id: BiaxialId, lambda: number): { nx: number; ny: number; nz: number } {
  const c = BIAXIAL_CRYSTALS[id];
  const ok = lambda >= c.x.range[0] && lambda <= c.x.range[1];
  const n = (m: SellmeierModel) => (ok ? refractiveIndex(m, lambda) : NaN);
  return { nx: n(c.x), ny: n(c.y), nz: n(c.z) };
}

export const biaxialRange = (id: BiaxialId): [number, number] => [...BIAXIAL_CRYSTALS[id].x.range];
