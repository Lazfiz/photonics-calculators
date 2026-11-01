/**
 * Window and infrared materials: transmission bands and room-temperature properties from the Crystran data
 * sheets, with the index from the published Sellmeier sets in `sellmeier-data.ts` / `uniaxial-data.ts`
 * (the ordinary ray for the uniaxial crystals: a c-cut window at normal incidence).
 *
 * Fresnel limit of a lossless plane-parallel window at normal incidence, its two surfaces adding
 * incoherently (multiple reflections summed in intensity): with R = ((n − 1)/(n + 1))² per surface,
 *   T = (1 − R)² Σ R²ᵏ = (1 − R)/(1 + R) = 2n/(n² + 1)
 * (Born & Wolf, Principles of Optics, Fresnel formulae at normal incidence). It is an upper bound: absorption
 * near the band edges and inside the bands only lowers it. Model tier: exact for the stated idealisation.
 * Crystran's "reflection loss (2 surfaces)" is 1 − 2n/(n² + 1) (Ge 53 % at 11 µm, LiF 5.2 % at 0.6 µm).
 */
import { inRange, refractiveIndex } from "./sellmeier";
import { MATERIALS, SCHOTT_GLASSES, type DispersionMaterial } from "./sellmeier-data";
import { UNIAXIAL_CRYSTALS } from "./uniaxial-data";
import { normalIncidenceReflectance } from "../polarization/fresnel";

/** A single data-sheet index where no verified dispersion formula is included. λ in m. */
export interface DataSheetIndex {
  n: number;
  lambda: number;
  source: string;
}

export interface WindowMaterial {
  name: string;
  dispersion: DispersionMaterial | DataSheetIndex;
  /** Transmission bands, m, as the data sheet gives them; empty where no sourced range is included. */
  bands: readonly (readonly [number, number])[];
  /** dn/dT near room temperature, 1/K (null: not sourced). */
  dnDT: number | null;
  /** Thermal conductivity, W/(m·K), Crystran's room-temperature table value (silicon's 163 is at 273 K, Crystran). */
  conductivity: number | null;
  /** Knoop hardness, kg/mm². */
  knoop: number | null;
  note?: string;
}

export const CRYSTRAN_REFERENCE = "Crystran, Handbook of Infrared and Ultraviolet Optical Materials, data sheets (crystran.com)";

const um = (...b: [number, number][]) => b.map(([lo, hi]) => [lo * 1e-6, hi * 1e-6] as const);

function ordinary(id: "sapphire" | "quartz"): DispersionMaterial {
  const c = UNIAXIAL_CRYSTALS[id];
  return { name: `${c.name}, ordinary`, model: c.o, reference: c.reference, temperature_C: c.temperature_C };
}

// Crystran values; "∥"/"⊥" are relative to the c axis, and n and dn/dT of uniaxial crystals are the ordinary ones.
const DATA = {
  fusedSilica: {
    name: "Fused silica", dispersion: MATERIALS.fusedSilica, bands: um([0.18, 2.2]),
    dnDT: 12.9e-6, conductivity: 1.38, knoop: 500, note: "IR grades transmit to 3 µm.",
  },
  bk7: {
    name: "N-BK7", dispersion: SCHOTT_GLASSES["N-BK7"], bands: um([0.35, 2.5]),
    dnDT: null, conductivity: 1.114, knoop: 610, note: "dn/dT: see the Optical Glass Catalog (SCHOTT TIE-19).",
  },
  caf2: { name: "CaF₂", dispersion: MATERIALS.caf2, bands: um([0.13, 10]), dnDT: -10.6e-6, conductivity: 9.71, knoop: 158.3 },
  baf2: { name: "BaF₂", dispersion: MATERIALS.baf2, bands: um([0.15, 12]), dnDT: -15.2e-6, conductivity: 11.72, knoop: 82 },
  mgf2: {
    name: "MgF₂", dispersion: MATERIALS.mgf2, bands: um([0.12, 7]), dnDT: 1.7e-6, conductivity: 21, knoop: 415,
    note: "Conductivity ∥ c (33.6 W/(m·K) ⊥ c).",
  },
  lif: { name: "LiF", dispersion: MATERIALS.lif, bands: um([0.12, 6]), dnDT: -16e-6, conductivity: 11.3, knoop: 102 },
  sapphire: {
    name: "Sapphire (Al₂O₃)", dispersion: ordinary("sapphire"), bands: um([0.17, 5.5]),
    dnDT: 13.1e-6, conductivity: 27.21, knoop: 1800, note: "Knoop ∥ c (2200 ⊥ c).",
  },
  quartz: {
    name: "Crystal quartz", dispersion: ordinary("quartz"), bands: um([0.18, 3.5], [40, 100]),
    dnDT: -6.5e-6, conductivity: 6.2, knoop: 741, note: "Conductivity ⊥ c (10.7 W/(m·K) ∥ c).",
  },
  diamond: {
    name: "Diamond", dispersion: MATERIALS.diamond, bands: um([0.3, 2.5], [7, 100]),
    dnDT: 9.6e-6, conductivity: 2600, knoop: 5700, note: "Knoop 5700–10400 with orientation.",
  },
  nacl: { name: "NaCl", dispersion: MATERIALS.nacl, bands: um([0.2, 15]), dnDT: -40.83e-6, conductivity: 6.5, knoop: 18.2 },
  kbr: { name: "KBr", dispersion: MATERIALS.kbr, bands: um([0.23, 25]), dnDT: -40.8e-6, conductivity: 4.816, knoop: 7 },
  csi: { name: "CsI", dispersion: MATERIALS.csi, bands: um([0.25, 55]), dnDT: -99.3e-6, conductivity: 1.1, knoop: 20 },
  krs5: {
    name: "KRS-5 (TlBr–TlI)", dispersion: MATERIALS.krs5, bands: um([0.6, 40]),
    dnDT: -235e-6, conductivity: 0.544, knoop: 40.2, note: "dn/dT at 10 µm; −254 ×10⁻⁶/K at 0.58 µm (Rodney & Malitson 1956).",
  },
  znse: { name: "ZnSe", dispersion: MATERIALS.znse, bands: um([0.6, 21]), dnDT: 61e-6, conductivity: 18, knoop: 120 },
  zns: {
    name: "ZnS (multispectral)", dispersion: MATERIALS.zns, bands: um([0.37, 13.5]),
    dnDT: 38.7e-6, conductivity: 27.2, knoop: 240,
  },
  si: { name: "Silicon", dispersion: MATERIALS.si, bands: um([1.2, 15], [30, 100]), dnDT: 160e-6, conductivity: 163, knoop: 1150 },
  ge: { name: "Germanium", dispersion: MATERIALS.ge, bands: um([1.8, 23]), dnDT: 396e-6, conductivity: 58.62, knoop: 780 },
  as2s3: {
    name: "As₂S₃ glass", dispersion: MATERIALS.as2s3, bands: um([0.6, 8]), dnDT: null, conductivity: null, knoop: 109,
    note: "Band and Knoop of Amorphous Materials' AMTIR-6 (As₂S₃), whose index is ≈ 0.004 above Rodney's glass from 0.9 to 8 µm; " +
      "Rodney measured out to 11.8 µm. AMTIR-6 dn/dT changes sign across the band (+20.7 ×10⁻⁶/K at 0.9 µm, −3.5 at 8 µm), so none is " +
      "applied; AMI's two sheets disagree on its conductivity (0.33 and 0.17 W/(m·K)).",
  },
  amtir1: {
    name: "AMTIR-1 (Ge₃₃As₁₂Se₅₅)", dispersion: MATERIALS.amtir1, bands: um([0.7, 12]), dnDT: 71e-6, conductivity: 0.25, knoop: 170,
    note: "dn/dT at 10 µm; 76 ×10⁻⁶/K at 3 µm, 166 at 1 µm (Amorphous Materials).",
  },
  zblan: {
    name: "ZBLAN glass", dispersion: MATERIALS.zblan, bands: [], dnDT: null, conductivity: null, knoop: null,
    note: "No sourced transmission range or thermal data yet; Gan's formula covers 0.365–3.5 µm.",
  },
} as const satisfies Record<string, WindowMaterial>;

export type WindowMaterialId = keyof typeof DATA;

export const WINDOW_MATERIALS: Record<WindowMaterialId, WindowMaterial> = DATA;

export function hasFormula(d: DispersionMaterial | DataSheetIndex): d is DispersionMaterial {
  return "model" in d;
}

/** Diamond n (ordinary light; cubic) from Crystran's table of Palik's values, [λ µm, n]. */
const DIAMOND_IR: readonly (readonly [number, number])[] = [
  [0.656, 2.4104], [1, 2.3905], [2, 2.3813], [3, 2.3795], [4, 2.3787], [5, 2.3783], [6, 2.3779], [10, 2.3765], [20, 2.3741],
];

export const DIAMOND_RANGE: readonly [number, number] = [MATERIALS.diamond.model.range[0], 20e-6];

export const DIAMOND_IR_SOURCE = "E. D. Palik (ed.), Handbook of Optical Constants of Solids, vol. 1 (Academic Press, 1985), as tabulated by Crystran";

/**
 * Diamond n(λ) and its source: Peter's formula to 644 nm, then the Palik table; NaN outside 226 nm–20 µm.
 * Between nodes n is linear in 1/λ² (Cauchy form, far below the 0.1–0.18 µm UV resonances): on Edwards & Ochoa's
 * Sellmeier curve that chord is within 1e-4, where a chord linear in λ is 2.7e-3 off at 0.8 µm.
 */
export function diamondIndex(lambda: number): { n: number; source: "peter" | "palik" | null } {
  const peter = MATERIALS.diamond.model;
  if (!(lambda >= DIAMOND_RANGE[0] && lambda <= DIAMOND_RANGE[1])) return { n: NaN, source: null };
  if (lambda <= peter.range[1]) return { n: refractiveIndex(peter, lambda), source: "peter" };
  const x = lambda * 1e6;
  const nodes: (readonly [number, number])[] = [[peter.range[1] * 1e6, refractiveIndex(peter, peter.range[1])], ...DIAMOND_IR];
  for (let i = 1; i < nodes.length; i++) {
    const [x0, n0] = nodes[i - 1];
    const [x1, n1] = nodes[i];
    if (x <= x1) return { n: n0 + ((n1 - n0) * (x0 ** -2 - x ** -2)) / (x0 ** -2 - x1 ** -2), source: "palik" };
  }
  return { n: NaN, source: null };
}

/** Index at λ (m) from the material's formula (diamond: Peter, then Palik); NaN outside the fit range or for a data-sheet-only material. */
export function windowIndex(m: WindowMaterial, lambda: number): number {
  const d = m.dispersion;
  if (d === MATERIALS.diamond) return diamondIndex(lambda).n;
  return hasFormula(d) && inRange(d.model, lambda) ? refractiveIndex(d.model, lambda) : NaN;
}

/** Whether λ (m) lies inside one of the material's transmission bands. */
export function transmits(m: WindowMaterial, lambda: number): boolean {
  return m.bands.some(([lo, hi]) => lambda >= lo && lambda <= hi);
}

/** Normal-incidence reflectance of one surface into air; NaN unless n > 0. */
export function surfaceReflectance(n: number): number {
  return normalIncidenceReflectance(1, n);
}

/** Fresnel-limited transmission of a lossless window, 2n/(n² + 1); NaN unless n > 0. */
export function fresnelLimitTransmission(n: number): number {
  if (!(n > 0) || !Number.isFinite(n)) return NaN;
  return (2 * n) / (n * n + 1);
}
