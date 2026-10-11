// Display helpers shared by the polarization pages (Jones, Mueller, Stokes).
import { type Stokes, ellipseShape, handedness, isPhysicalStokes, polarizedIntensity } from "../physics/polarization/stokes";

/** toFixed without a minus sign on zero; "—" for an undefined (NaN) or infinite value. */
export function fix(v: number, digits: number): string {
  if (!Number.isFinite(v)) return "—";
  const s = v.toFixed(digits);
  return Number(s) === 0 ? (0).toFixed(digits) : s;
}

/** An angle in radians as degrees with one decimal, or "—" when it is undefined (NaN). */
export const degOrDash = (rad: number) => (Number.isNaN(rad) ? "—" : `${fix((rad * 180) / Math.PI, 1)}°`);

/** Why a typed Stokes vector isn't physical, or null when it is. */
export function stokesProblem(S: Stokes): string | null {
  if (isPhysicalStokes(S)) return null;
  if (!(S[0] > 0)) return "S₀ must be positive.";
  if (!S.every(Number.isFinite)) return "Enter a number for each Stokes parameter.";
  return `Not a physical Stokes vector: √(S₁² + S₂² + S₃²) = ${polarizedIntensity(S).toFixed(4)} exceeds S₀ = ${S[0].toFixed(4)}.`;
}

/** Name of the polarization state from the shape and sense of rotation of its ellipse. */
export function stateLabel(S: Stokes): string {
  const shape = ellipseShape(S);
  if (shape === "unpolarized" || handedness(S) === "unpolarized") return "Unpolarized";
  if (shape === "linear") return "Linear";
  const side = handedness(S) === "left" ? "Left" : "Right";
  return shape === "circular" ? `${side} circular` : `${side}-handed elliptical`;
}

/** What a plate with this leftover fraction of a wave does, within ±tol waves of a quarter, half or whole wave. */
export function plateTypeLabel(fraction: number, tol = 0.01): string {
  if (!Number.isFinite(fraction)) return "—";
  if (fraction < tol || fraction > 1 - tol) return "full-wave (no net retardance)";
  if (Math.abs(fraction - 0.25) < tol) return "quarter-wave";
  if (Math.abs(fraction - 0.5) < tol) return "half-wave";
  if (Math.abs(fraction - 0.75) < tol) return "quarter-wave, fast and slow axes swapped";
  return "no standard plate (not ¼, ½ or 1 wave)";
}

/** The sign convention, for pages that name a handedness. */
export const CONVENTION_NOTE =
  "Convention (Goldstein): RCP = [1, i]/√2 turns clockwise as seen by the receiver; S₃ > 0 is right-handed.";

/** A transmittance given by its log₁₀, readable even below the smallest double (10^−412.3). */
export function fromLog10(l: number): string {
  if (!Number.isFinite(l)) return "—";
  if (l > -300) return (10 ** l).toExponential(2);
  return `10^${fix(l, 1)}`;
}
