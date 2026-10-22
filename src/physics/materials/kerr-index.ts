/**
 * Nonlinear (Kerr) refractive index n = n₀ + n₂I of transparent media: reference n₂ values, the index change, the
 * nonlinear phase over a length, the fibre nonlinear coefficient γ and the self-focusing critical power.
 * Model tier: textbook (instantaneous electronic Kerr response, linearly polarized light; n₂ fixed at the wavelength it
 * was measured at, so its dispersion is not modelled).
 * SI units: λ in m, n₂ in m²/W, intensities in W/m², lengths in m, areas in m², powers in W.
 *
 * - Δn = n₂I and φ = k₀n₂IL (R. W. Boyd, Nonlinear Optics, 4th ed. (2020), self-focusing and the nonlinear index);
 *   `nonlinearPhase` and `criticalPower` (3.77 λ²/(8π n₀ n₂), Fibich & Gaeta 2000) are in wave-optics/kerr.ts.
 * - γ = 2πn₂/(λA_eff) (G. P. Agrawal, Nonlinear Fiber Optics, 6th ed. (2019)): `nonlinearCoefficient` in
 *   fiber-optics/fiber-nonlinear.ts.
 * - n₂ and n₀ at 800 nm: A. Dubietis, G. Tamošauskas, R. Šuminas, V. Jukna, A. Couairon, Lith. J. Phys. 57(3) (2017),
 *   doi 10.3952/physics.v57i3.3541, Table 1 (arXiv:1706.04356), which compiles them from the primary measurements.
 * - Silica fibre at 1550 nm: n₂ = 2.6e-20 m²/W (Agrawal, `SILICA_N2`), n₀ of fused silica from Malitson 1965.
 */

import { SILICA_N2 } from "../fiber-optics/fiber-nonlinear";
import { refractiveIndex } from "./sellmeier";
import { MATERIALS } from "./sellmeier-data";

export type KerrMediumId =
  | "silica-fiber" | "lif" | "caf2" | "sapphire" | "baf2" | "fused-silica" | "kdp" | "water" | "yag" | "bbo" | "bk7"
  | "kgw" | "yvo4";

export interface KerrMedium {
  name: string;
  /** Nonlinear index, m²/W. */
  n2: number;
  /** Linear index at `lambda`. */
  n0: number;
  /** Wavelength the values hold at, m. */
  lambda: number;
  source: string;
}

const DUBIETIS = "Dubietis et al. 2017, Table 1 (800 nm)";
const at800 = (name: string, n2_1e16cm2W: number, n0: number): KerrMedium => ({
  name, n2: n2_1e16cm2W * 1e-20, n0, lambda: 800e-9, source: DUBIETIS,
});

export const KERR_MEDIA: Record<KerrMediumId, KerrMedium> = {
  "silica-fiber": {
    name: "Silica fibre (1550 nm)", n2: SILICA_N2, n0: refractiveIndex(MATERIALS.fusedSilica.model, 1550e-9), lambda: 1550e-9,
    source: "n₂ Agrawal, Nonlinear Fiber Optics; n₀ Malitson 1965",
  },
  lif: at800("LiF", 0.81, 1.39),
  caf2: at800("CaF₂", 1.3, 1.43),
  sapphire: at800("Sapphire (Al₂O₃)", 3.1, 1.76),
  baf2: at800("BaF₂", 1.91, 1.47),
  "fused-silica": at800("Fused silica", 2.4, 1.45),
  kdp: at800("KDP", 2.0, 1.5),
  water: at800("Water", 5.7, 1.33),
  yag: at800("YAG", 6.2, 1.82),
  bbo: at800("β-BBO", 5.2, 1.66),
  bk7: at800("BK7", 3.75, 1.51),
  kgw: at800("KGW", 11, 2.02),
  yvo4: at800("YVO₄", 15, 1.97),
};

/** Kerr index change Δn = n₂I. NaN unless n₂ is finite and I ≥ 0. */
export function kerrIndexChange(n2: number, intensity: number): number {
  if (!Number.isFinite(n2) || !(intensity >= 0) || !Number.isFinite(intensity)) return NaN;
  return n2 * intensity;
}

/** Intensity that gives a nonlinear phase of π over L, I_π = λ/(2n₂L), W/m². NaN unless λ, n₂ and L are > 0. */
export function piPhaseIntensity(lambda: number, n2: number, length: number): number {
  if (!(lambda > 0 && n2 > 0 && length > 0)) return NaN;
  return lambda / (2 * n2 * length);
}
