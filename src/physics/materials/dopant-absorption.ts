/**
 * Ground-state absorption by a density of absorbing centres (rare-earth ions, colour centres). SI units: cross-sections
 * in m², densities in m⁻³, lengths in m.
 * Model tier: textbook. Small-signal absorption of an unpumped medium, α = Γσ_a N (every centre in its ground state, no
 * bleaching, no excited-state absorption), and Beer–Lambert T = e^(−αL) (internal transmission, no surface reflections).
 * Γ is the fraction of the light inside the doped region: 1 for a bulk sample, the core overlap for a fibre.
 *
 * Sources:
 * - α = Γσ_a N and the dB/m form 10·log₁₀(e)·α: C. R. Giles, E. Desurvire, J. Lightwave Technol. 9, 271 (1991),
 *   doi:10.1109/50.65886 (α_k = Γ_kσ_akN, eqs. (6)–(9) with n₂ = 0).
 * - Cross-sections: DOPANT_PRESETS (fiber-optics/doped-fiber-gain.ts), Er³⁺ from Barnes et al. 1991, Yb³⁺ from
 *   Melkumov et al. 2004, Tm³⁺ from Agger & Povlsen 2006 and Ho³⁺ from Le Gouët et al. 2020, shared with the fibre
 *   amplifier pages.
 */

import { DOPANT_PRESETS, ionDensityFromWtPpm, type DopantPreset } from "../fiber-optics/doped-fiber-gain";
import { DB_PER_E_FOLD } from "../fiber-optics/macro-bending-loss";

export interface AbsorptionResult {
  /** Absorption coefficient Γσ_aN, m⁻¹. */
  readonly alpha: number;
  /** The same in dB/m. */
  readonly dbPerM: number;
  /** 1/e absorption length 1/α, m (∞ when α = 0). */
  readonly absorptionLength: number;
  /** Loss over the path length, dB. */
  readonly lossDb: number;
  /** Internal transmission e^(−αL). */
  readonly transmission: number;
}

const NAN_RESULT: AbsorptionResult = { alpha: NaN, dbPerM: NaN, absorptionLength: NaN, lossDb: NaN, transmission: NaN };

/** Small-signal absorption α = Γσ_aN and transmission e^(−αL). NaN for σ_a < 0, N < 0, Γ outside [0, 1] or L < 0. */
export function dopantAbsorption(sigmaA: number, N: number, length: number, overlap = 1): AbsorptionResult {
  if (!(sigmaA >= 0 && N >= 0 && overlap >= 0 && overlap <= 1 && length >= 0)) return NAN_RESULT;
  const alpha = overlap * sigmaA * N;
  return {
    alpha,
    dbPerM: DB_PER_E_FOLD * alpha,
    absorptionLength: alpha > 0 ? 1 / alpha : Infinity,
    lossDb: DB_PER_E_FOLD * alpha * length,
    transmission: Math.exp(-alpha * length),
  };
}

export interface DopantLine {
  readonly id: string;
  readonly ion: DopantPreset["id"];
  readonly role: "pump" | "signal";
  /** Wavelength, m. */
  readonly lambda: number;
  /** Absorption cross-section, m². */
  readonly sigmaA: number;
  /** Emission cross-section, m². */
  readonly sigmaE: number;
}

/** Every pump and signal line of DOPANT_PRESETS by ion, in wavelength order (Er 980, 1480, 1550 nm; Yb 976, 1064 nm;
 * Tm 1600, 1740, 1900 nm; Ho 1908, 1946, 1995, 2120 nm). */
export const DOPANT_LINES: readonly DopantLine[] = DOPANT_PRESETS.flatMap((p) =>
  (["pump", "signal"] as const).flatMap((role) =>
    (role === "pump" ? p.pumps : p.signals).map((x) => ({
      id: `${p.id}${Math.round(x.lambda * 1e9)}`, ion: p.id, role, lambda: x.lambda, sigmaA: x.sigmaA, sigmaE: x.sigmaE,
    })),
  ).sort((a, b) => a.lambda - b.lambda),
);

/** The unit of the cross-section input of the absorption page, m². */
export const SIGMA_UNIT = 1e-25;

/** The line with this id; Yb 976 nm (then the first line) for an unknown id. */
export function findDopantLine(id: string): DopantLine {
  return DOPANT_LINES.find((l) => l.id === id) ?? DOPANT_LINES.find((l) => l.id === "Yb976") ?? DOPANT_LINES[0];
}

const clampTo = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

/**
 * Absorption of a rare-earth-doped silica sample on one line, as the absorption page computes it. sigmaInput is σ_a in
 * units of 1e-25 m² (0 or less: the line's preset, rounded to 6 digits), ppm the ion's weight fraction in 10⁻⁶, length
 * in m. Inputs are clamped to the page ranges: σ_a 0.001–1000, ppm 0–50000, Γ 0–1, L 1e-4–1000 m.
 */
export function dopantLineAbsorption(lineId: string, sigmaInput: number, ppm: number, overlap: number, length: number) {
  const line = findDopantLine(lineId);
  const ion = DOPANT_PRESETS.find((p) => p.id === line.ion) ?? DOPANT_PRESETS[0];
  const presetSigma = Number((line.sigmaA / SIGMA_UNIT).toPrecision(6));
  const sigmaA = clampTo(sigmaInput > 0 ? sigmaInput : presetSigma, 1e-3, 1000, presetSigma) * SIGMA_UNIT;
  const N = ionDensityFromWtPpm(clampTo(ppm, 0, 50000, 1000), ion.molarMass);
  const result = dopantAbsorption(sigmaA, N, clampTo(length, 1e-4, 1000, 0.1), clampTo(overlap, 0, 1, 1));
  return { line, ion, sigmaA, N, ...result };
}
