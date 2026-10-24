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
 * - n₂ at 1064 nm: R. DeSalvo, A. A. Said, D. J. Hagan, E. W. Van Stryland, M. Sheik-Bahae, IEEE J. Quantum Electron.
 *   32, 1324 (1996), doi 10.1109/3.511545, Table I (Z-scan, picosecond pulses, ±20 %) in 10⁻¹⁴ esu with the n₀ of their
 *   Table II; converted by n₂(esu) = (c n₀/40π) n₂(m²/W) as in their text (fused silica: 7.5e-14 esu = 2.1e-16 cm²/W).
 *   KTP z-cut with E ∥ y, LiNbO₃ x-cut with E ∥ c; tellurite glass 75 % TeO₂ + 20 % ZnO + 5 % Na₂O.
 * - Silicon: A. D. Bristow, N. Rotenberg, H. M. van Driel, Appl. Phys. Lett. 90, 191104 (2007), doi 10.1063/1.2737359:
 *   peak n₂ = 1.2e-13 cm²/W at 1800 nm (abstract); n₂ varies 4× over 1000–2200 nm (4.7e-14 cm²/W at 1220 nm, text).
 *   n₀ from Salzberg & Villa 1957 (Tatian fit).
 */

import { c } from "../constants";
import { SILICA_N2 } from "../fiber-optics/fiber-nonlinear";
import { refractiveIndex } from "./sellmeier";
import { MATERIALS } from "./sellmeier-data";

export type KerrMediumId =
  | "silica-fiber" | "lif" | "caf2" | "sapphire" | "baf2" | "fused-silica" | "kdp" | "water" | "yag" | "bbo" | "bk7"
  | "kgw" | "yvo4" | "mgf2" | "kbr" | "linbo3" | "ktp" | "tellurite" | "silicon";

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

/** n₂ in m²/W from n₂ in esu: n₂(m²/W) = 40π n₂(esu)/(c n₀) (DeSalvo et al. 1996, Sec. III). */
export function n2FromEsu(n2_esu: number, n0: number): number {
  if (!Number.isFinite(n2_esu) || !(n0 > 0)) return NaN;
  return (40 * Math.PI * n2_esu) / (c * n0);
}

const DESALVO = "DeSalvo et al. 1996, Tables I–II (1064 nm)";
const at1064 = (name: string, n2_1e14esu: number, n0: number): KerrMedium => ({
  name, n2: n2FromEsu(n2_1e14esu * 1e-14, n0), n0, lambda: 1064e-9, source: DESALVO,
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
  mgf2: at1064("MgF₂", 1.9, 1.4),
  kbr: at1064("KBr", 29, 1.53),
  linbo3: at1064("LiNbO₃ (E ∥ c)", 48, 2.2),
  ktp: at1064("KTP (E ∥ y)", 100, 1.77),
  tellurite: at1064("Tellurite glass (75TeO₂–20ZnO–5Na₂O)", 81, 2.0),
  silicon: {
    name: "Silicon (1800 nm)", n2: 1.2e-17, n0: refractiveIndex(MATERIALS.si.model, 1800e-9), lambda: 1800e-9,
    source: "n₂ Bristow et al. 2007 (peak, 850–2200 nm); n₀ Salzberg & Villa 1957",
  },
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
