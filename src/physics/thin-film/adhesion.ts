/**
 * Thin-film adhesion tests: the scratch test (Benjamin–Weaver), the elastic peel test (Kendall), the
 * ASTM D3359 tape-test classes, and the film stress and crack driving forces in a bend test.
 *
 * Model tier: Textbook approximation. The scratch-test shear stress is the Benjamin–Weaver estimate for a
 * rigid spherical stylus pressed into a fully plastic substrate; the critical load also depends on the
 * friction, the film thickness and the failure mode, so it ranks coatings rather than measuring a work
 * of adhesion. The peel and bend results are the standard linear-elastic ones.
 *
 * References: P. Benjamin, C. Weaver, Proc. R. Soc. Lond. A 254, 163 (1960), doi:10.1098/rspa.1960.0012
 * (scratch test). K. Kendall, J. Phys. D 8, 1449 (1975), doi:10.1088/0022-3727/8/13/005 (thin-film
 * peeling). J. W. Hutchinson, Z. Suo, Adv. Appl. Mech. 29, 63 (1991), doi:10.1016/S0065-2156(08)70164-9
 * (Fig. 2 and Table: channel crack Z = 1.976, steady-state delamination Z = 1/2, no elastic mismatch).
 * ASTM D3359 (cross-cut tape test, Method B classes). M. Ohring, Materials Science of Thin Films, 2nd ed.
 * (2002), ch. 12 (adhesion tests).
 */

export interface ScratchResult {
  /** Radius of the contact circle (m). */
  contactRadius: number;
  /** Shear stress at the edge of the contact (Pa). */
  shearStress: number;
}

/**
 * Benjamin–Weaver scratch test: a stylus of tip radius R under load L sinks into a substrate of
 * indentation hardness H until the contact pressure equals H, so a = √(L/(πH)), and the shear stress at
 * the edge of the contact is τ = H a / √(R² − a²). NaN unless L ≥ 0, R, H > 0 and a < R.
 */
export function benjaminWeaver(L: number, R: number, H: number): ScratchResult {
  const nan = { contactRadius: NaN, shearStress: NaN };
  if (!(L >= 0 && R > 0 && H > 0)) return nan;
  const a = Math.sqrt(L / (Math.PI * H));
  if (!(a < R)) return nan;
  return { contactRadius: a, shearStress: (H * a) / Math.sqrt(R * R - a * a) };
}

/** Largest load (N) the Benjamin–Weaver estimate holds for: a = R at L = π R² H. */
export function benjaminWeaverMaxLoad(R: number, H: number): number {
  if (!(R > 0 && H > 0)) return NaN;
  return Math.PI * R * R * H;
}

/**
 * Kendall's energy balance for peeling an elastic strip (Young's modulus E, thickness h) at angle θ
 * (rad, 0 = along the surface) with force per unit width F/b (N/m): the interfacial fracture energy
 * G = (F/b)(1 − cos θ) + (F/b)² / (2 E h). The second term is the elastic stretching of the peel arm;
 * plastic bending of the arm is not included. NaN unless F/b ≥ 0, 0 ≤ θ ≤ π and E, h > 0.
 */
export function kendallPeelEnergy(forcePerWidth: number, theta: number, E: number, h: number): number {
  if (!(forcePerWidth >= 0 && theta >= 0 && theta <= Math.PI && E > 0 && h > 0)) return NaN;
  return forcePerWidth * (1 - Math.cos(theta)) + (forcePerWidth * forcePerWidth) / (2 * E * h);
}

export const TAPE_CLASSES = ["5B", "4B", "3B", "2B", "1B", "0B"] as const;
export type TapeClass = (typeof TAPE_CLASSES)[number];

/** ASTM D3359 Method B area removed for each class (% of the lattice). */
export const TAPE_CLASS_RANGE: Record<TapeClass, string> = {
  "5B": "0 %",
  "4B": "< 5 %",
  "3B": "5–15 %",
  "2B": "15–35 %",
  "1B": "35–65 %",
  "0B": "> 65 %",
};

/**
 * ASTM D3359 Method B (cross-cut) class from the percentage of the lattice area removed by the tape.
 * Undefined unless 0 ≤ removed ≤ 100.
 */
export function tapeClass(removedPercent: number): TapeClass | undefined {
  if (!(removedPercent >= 0 && removedPercent <= 100)) return undefined;
  if (removedPercent === 0) return "5B";
  if (removedPercent < 5) return "4B";
  if (removedPercent <= 15) return "3B";
  if (removedPercent <= 35) return "2B";
  if (removedPercent <= 65) return "1B";
  return "0B";
}

export interface BendResult {
  /** Strain in the film on the convex side (tensile). */
  strain: number;
  /** Film stress along the bend (Pa): residual stress + Ē_f ε. */
  stress: number;
  /** Energy release rate of a channel crack through the film (J/m²): 1.976 σ² h / Ē_f; NaN if σ < 0. */
  channelG: number;
  /** Energy release rate of steady-state interface delamination (J/m²): σ² h / (2 Ē_f); NaN if σ < 0. */
  delaminationG: number;
}

/**
 * A thin film (E_f, ν_f, thickness h) on the convex side of a wide substrate of thickness h_s bent to
 * radius R (at the substrate mid-plane): ε = h_s / (2R), σ = σ_res + Ē_f ε with Ē_f = E_f / (1 − ν_f²)
 * (no strain across the bend) and σ_res the residual film stress (tensile > 0), and the Hutchinson–Suo
 * driving forces for a film much thinner than the substrate. The channel-crack Z = 1.976 holds for
 * matched moduli (a more compliant substrate raises it); the steady-state delamination G is independent
 * of the substrate. A crack or a delamination grows when its G reaches the film's or the interface's
 * toughness. A compressive film buckles instead, so both G are NaN for σ < 0. NaN unless h_s, R, E_f,
 * h > 0, h_s < 2R and 0 ≤ ν_f < 1.
 */
export function bendTest(hs: number, R: number, Ef: number, nuf: number, h: number, residual = 0): BendResult {
  if (!(hs > 0 && R > 0 && hs < 2 * R && Ef > 0 && nuf >= 0 && nuf < 1 && h > 0 && Number.isFinite(residual))) {
    return { strain: NaN, stress: NaN, channelG: NaN, delaminationG: NaN };
  }
  const strain = hs / (2 * R);
  const Ebar = Ef / (1 - nuf * nuf);
  const stress = residual + Ebar * strain;
  const w = stress >= 0 ? (stress * stress * h) / Ebar : NaN;
  return { strain, stress, channelG: 1.976 * w, delaminationG: 0.5 * w };
}
