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

/** The sign convention, for pages that name a handedness. */
export const CONVENTION_NOTE =
  "Convention (Goldstein): RCP = [1, i]/√2 turns clockwise as seen by the receiver; S₃ > 0 is right-handed.";
