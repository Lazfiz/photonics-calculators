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
 * - Cross-sections: DOPANT_PRESETS (fiber-optics/doped-fiber-gain.ts), Er³⁺ from Barnes et al. 1991 and Yb³⁺ from
 *   Melkumov et al. 2004, shared with the fibre amplifier pages.
 */

import { DOPANT_PRESETS, type DopantPreset } from "../fiber-optics/doped-fiber-gain";
import { DB_PER_NEPER } from "../fiber-optics/macro-bending-loss";

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
    dbPerM: DB_PER_NEPER * alpha,
    absorptionLength: alpha > 0 ? 1 / alpha : Infinity,
    lossDb: DB_PER_NEPER * alpha * length,
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

/** Every pump and signal line of DOPANT_PRESETS (Er 980, 1480, 1550 nm; Yb 976, 1064 nm). */
export const DOPANT_LINES: readonly DopantLine[] = DOPANT_PRESETS.flatMap((p) =>
  (["pump", "signal"] as const).flatMap((role) =>
    (role === "pump" ? p.pumps : p.signals).map((x) => ({
      id: `${p.id}${Math.round(x.lambda * 1e9)}`, ion: p.id, role, lambda: x.lambda, sigmaA: x.sigmaA, sigmaE: x.sigmaE,
    })),
  ),
);
