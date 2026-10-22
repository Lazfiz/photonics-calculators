/**
 * Colour centres: absorption and emission band peaks, Stokes shift and quantum defect. SI units: wavelengths in m,
 * cross-sections in m², wavenumbers in m⁻¹; energies in eV where named so.
 * Model tier: textbook. Band maxima only; the band shapes, their temperature dependence and the Huang–Rhys factor are
 * not modelled (E_Stokes ≈ 2Sħω holds only approximately: M. de Jong, L. Seijo, A. Meijerink, F. T. Rabouw,
 * Phys. Chem. Chem. Phys. 17, 16959 (2015), doi:10.1039/C5CP02093J).
 *
 * Sources:
 * - NV⁻ in diamond: absorption maximum 2.180 eV, zero-phonon line 1.945 eV, emission maximum 1.760 eV (Davies & Hamer
 *   1976, as tabulated in M. W. Doherty et al., Phys. Rep. 528, 1 (2013), doi:10.1016/j.physrep.2013.02.001, Table 9).
 *   One-photon absorption cross-section (3.1 ± 0.8)e-17 cm² at 532 nm (T.-L. Wee et al., J. Phys. Chem. A 111, 9379
 *   (2007), doi:10.1021/jp073938o).
 * - F₂ and F₂⁺ in LiF: absorption 443 and 645 nm, emission 678 and 910 nm (G. Baldacchini, J. Lumin. 100, 333 (2002),
 *   as tabulated in M. Guerrero Perez et al., arXiv:2412.21060 (2024), Table I).
 */

import { c, h, q } from "../constants";

const NM = 1e-9;
const photonWavelength = (energyEv: number) => (h * c) / (energyEv * q);

export type ColorCenterId = "nv" | "lifF2" | "lifF2plus";

export interface ColorCenter {
  readonly name: string;
  readonly host: string;
  /** Absorption band maximum, m. */
  readonly absorptionPeak: number;
  /** Emission band maximum, m. */
  readonly emissionPeak: number;
  /** Zero-phonon line, m (NaN when not listed). */
  readonly zpl: number;
  /** Absorption cross-section, m² (NaN when no cited value). */
  readonly sigmaA: number;
  /** Wavelength the cross-section is quoted at, m. */
  readonly sigmaLambda: number;
}

export const COLOR_CENTERS: Record<ColorCenterId, ColorCenter> = {
  nv: {
    name: "NV⁻", host: "diamond", absorptionPeak: photonWavelength(2.180), emissionPeak: photonWavelength(1.760),
    zpl: photonWavelength(1.945), sigmaA: 3.1e-21, sigmaLambda: 532 * NM,
  },
  lifF2: { name: "F₂", host: "LiF", absorptionPeak: 443 * NM, emissionPeak: 678 * NM, zpl: NaN, sigmaA: NaN, sigmaLambda: NaN },
  lifF2plus: { name: "F₂⁺", host: "LiF", absorptionPeak: 645 * NM, emissionPeak: 910 * NM, zpl: NaN, sigmaA: NaN, sigmaLambda: NaN },
};

export interface StokesShift {
  /** E_abs − E_em, eV. */
  readonly energyEv: number;
  /** 1/λ_abs − 1/λ_em, m⁻¹. */
  readonly wavenumber: number;
  /** Fraction of the absorbed photon energy not re-emitted, 1 − λ_abs/λ_em (heat at unit quantum yield). */
  readonly quantumDefect: number;
}

/** Stokes shift between band maxima. Negative for λ_em < λ_abs (anti-Stokes); NaN for a non-positive wavelength. */
export function stokesShift(absorptionPeak: number, emissionPeak: number): StokesShift {
  if (!(absorptionPeak > 0 && emissionPeak > 0)) return { energyEv: NaN, wavenumber: NaN, quantumDefect: NaN };
  const wavenumber = 1 / absorptionPeak - 1 / emissionPeak;
  return { energyEv: (h * c * wavenumber) / q, wavenumber, quantumDefect: 1 - absorptionPeak / emissionPeak };
}
