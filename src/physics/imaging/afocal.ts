/**
 * Afocal-system page summary: two thin lenses f₁, f₂ a distance t apart in air, paraxial. SI in and out (m, rad,
 * dioptres = 1/m). Model tier: textbook. Built on `gaussian-optics` (ray-transfer matrix L(f₂)·T(t)·L(f₁), Gullstrand's
 * power φ = φ₁ + φ₂ − tφ₁φ₂; afocal when t = f₁ + f₂ with angular magnification M = −f₁/f₂, tan θ′ = M tan θ;
 * J. E. Greivenkamp, Field Guide to Geometrical Optics, SPIE 2004, doi:10.1117/3.547461).
 */
import { focalDistances, twoElementPower, twoLensABCD } from "./gaussian-optics";

/** Smallest |f| the page accepts, m (0.1 mm). */
export const MIN_FOCAL_LENGTH = 1e-4;
/** The system counts as afocal when the spacing is within this of f₁ + f₂, m (1 µm; then C = 0 to rounding). */
export const AFOCAL_TOLERANCE = 1e-6;
/** Message for a focal length below `MIN_FOCAL_LENGTH`. */
export const FOCAL_PROBLEM = "Each focal length must be non-zero (at least 0.1 mm in magnitude).";

export interface AfocalSummary {
  /** Non-empty when a focal length is below `MIN_FOCAL_LENGTH`; the other fields are then not meaningful. */
  problem: string;
  /** f₁ + f₂, m. */
  afocalSpacing: number;
  /** A positive spacing can make the lenses afocal (f₁ + f₂ > 0). */
  afocalPossible: boolean;
  afocal: boolean;
  A: number;
  /** m */
  B: number;
  /** dioptres (1/m) */
  C: number;
  D: number;
  /** System power −C, dioptres. */
  power: number;
  /** m; ±∞ or NaN at an afocal spacing. */
  efl: number;
  bfd: number;
  ffd: number;
  /** Angular magnification −f₁/f₂, output half-angle (rad), output beam diameter (m): meaningful when afocal. */
  magnification: number;
  outputAngle: number;
  outputBeam: number;
  /** Keplerian (both lenses positive) rather than Galilean. */
  keplerian: boolean;
  /** Diameter 2 f₁ tan θ of the intermediate image (field stop), m; NaN for a Galilean system. */
  fieldStopDiameter: number;
  /** The page's warning (empty when none). */
  notice: string;
}

/** f1, f2, t, beam in m; theta (input field half-angle) in rad. */
export function afocalSummary(p: { f1: number; f2: number; t: number; theta: number; beam: number }): AfocalSummary {
  const { f1, f2, t, theta, beam } = p;
  const problem = Math.abs(f1) < MIN_FOCAL_LENGTH || Math.abs(f2) < MIN_FOCAL_LENGTH ? FOCAL_PROBLEM : "";
  const afocalSpacing = f1 + f2;
  const abcd = twoLensABCD(f1, f2, t);
  const { efl, bfd, ffd } = focalDistances(abcd);
  const afocalPossible = afocalSpacing >= 0;
  const afocal = !problem && afocalPossible && Math.abs(t - afocalSpacing) < AFOCAL_TOLERANCE;
  const magnification = -f1 / f2;
  const keplerian = f1 > 0 && f2 > 0;
  const notice = problem
    ? ""
    : !afocalPossible
      ? `f₁ + f₂ = ${(afocalSpacing * 1e3).toFixed(1)} mm < 0: no spacing t ≥ 0 makes these lenses afocal.`
      : afocal
        ? ""
        : `The spacing is ${((t - afocalSpacing) * 1e3).toFixed(3)} mm from the afocal spacing f₁ + f₂, so the system has power and a collimated beam leaves it converging or diverging.`;
  return {
    problem,
    afocalSpacing,
    afocalPossible,
    afocal,
    A: abcd.A,
    B: abcd.B,
    C: abcd.C,
    D: abcd.D,
    power: twoElementPower(1 / f1, 1 / f2, t),
    efl,
    bfd,
    ffd,
    magnification,
    outputAngle: Math.atan(magnification * Math.tan(theta)),
    outputBeam: beam * Math.abs(f2 / f1),
    keplerian,
    fieldStopDiameter: keplerian ? 2 * f1 * Math.tan(theta) : NaN,
    notice,
  };
}
