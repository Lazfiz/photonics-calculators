/**
 * Acousto-optic Bragg cells: Bragg angle, Klein–Cook parameter, diffraction efficiency, access time and resolution.
 * Model tier: textbook approximation (isotropic Bragg diffraction, plane waves, weak acoustic attenuation).
 *
 * - Bragg angle outside the cell (air): sin θ_B = λ₀ f / (2v); inside it is λ₀ f / (2 n v), and refraction at the entrance
 *   face restores the outside value. The diffracted order leaves at 2θ_B, and a sweep Δf scans Δθ = λ₀ Δf / v
 *   (Yariv & Yeh, Optical Waves in Crystals, ch. 9).
 * - Klein–Cook parameter Q = 2π λ₀ L f² / (n v²): the Bragg formulas hold for Q ≫ 1, Raman–Nath diffraction for Q ≪ 1
 *   (Klein & Cook 1967, doi:10.1109/T-SU.1967.29423).
 * - First-order efficiency η = sin²[(π / (√2 λ₀)) √(M₂ L P / H)], with M₂ = n⁶p²/(ρv³), acoustic power P over a transducer
 *   of height H and interaction length L; 100 % needs P = λ₀² H / (2 M₂ L) (Yariv & Yeh, ch. 9).
 * - Access time τ = D / v for a beam of width D; a sweep Δf resolves N = τ Δf spots.
 * - M₂ and v are for one acoustic mode and propagation direction and were measured at 633 nm (Uchida & Niizeki 1973,
 *   doi:10.1109/PROC.1973.9212; Dixon 1967, doi:10.1063/1.1709293). TeO₂ slow-shear cells work by anisotropic Bragg
 *   diffraction (light near the optic axis changes polarization), so their real Bragg angles differ from the isotropic ones.
 */

export type AcoustoOpticId = "teo2-shear" | "teo2-long" | "pbmoo4" | "silica";

export interface AcoustoOpticMaterial {
  name: string;
  /** Acoustic mode and propagation direction. */
  mode: string;
  /** Refractive index at 633 nm. */
  n: number;
  /** Acoustic velocity, m/s. */
  v: number;
  /** Figure of merit M₂ at 633 nm, s³/kg. */
  M2: number;
}

export const ACOUSTO_OPTIC: Record<AcoustoOpticId, AcoustoOpticMaterial> = {
  "teo2-shear": { name: "TeO₂", mode: "slow shear along [110]", n: 2.26, v: 617, M2: 793e-15 },
  "teo2-long": { name: "TeO₂", mode: "longitudinal along [001]", n: 2.26, v: 4200, M2: 34.5e-15 },
  pbmoo4: { name: "PbMoO₄", mode: "longitudinal along [001]", n: 2.39, v: 3630, M2: 36.3e-15 },
  silica: { name: "Fused silica", mode: "longitudinal", n: 1.46, v: 5960, M2: 1.51e-15 },
};

/** Bragg angle outside the cell, rad: asin(λ₀ f / 2v); NaN when λ₀ f / 2v > 1. */
export function braggAngle(lambda0: number, f: number, v: number): number {
  const s = (lambda0 * f) / (2 * v);
  return v > 0 && s >= 0 && s <= 1 ? Math.asin(s) : NaN;
}

/** Scan angle (rad, outside the cell) for an RF sweep Δf: λ₀ Δf / v. */
export const scanAngle = (lambda0: number, df: number, v: number) => (v > 0 ? (lambda0 * df) / v : NaN);

/** Klein–Cook parameter Q = 2π λ₀ L f² / (n v²). */
export const kleinCookQ = (lambda0: number, L: number, f: number, n: number, v: number) =>
  n > 0 && v > 0 ? (2 * Math.PI * lambda0 * L * f * f) / (n * v * v) : NaN;

/** First-order Bragg efficiency sin²[(π/(√2 λ₀)) √(M₂ L P / H)] for acoustic power P (W), L and H (m). */
export function braggEfficiency(lambda0: number, M2: number, L: number, H: number, P: number): number {
  if (!(lambda0 > 0 && H > 0 && M2 >= 0 && L >= 0 && P >= 0)) return NaN;
  return Math.sin((Math.PI / (Math.SQRT2 * lambda0)) * Math.sqrt((M2 * L * P) / H)) ** 2;
}

/** Acoustic power (W) for 100 % first-order efficiency: λ₀² H / (2 M₂ L). */
export const fullEfficiencyPower = (lambda0: number, M2: number, L: number, H: number) =>
  M2 > 0 && L > 0 ? (lambda0 * lambda0 * H) / (2 * M2 * L) : NaN;

/** Access time τ = D / v, s. */
export const accessTime = (D: number, v: number) => (v > 0 ? D / v : NaN);
