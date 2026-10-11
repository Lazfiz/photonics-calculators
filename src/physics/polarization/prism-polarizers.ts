/**
 * Birefringent prism polarizers: the Glan family (total internal reflection of the o wave at a gap) and the
 * two-wedge beam splitters (Wollaston, Rochon, Sénarmont). Angles in radians, wave vectors in units of k₀ = 2π/λ.
 * Model tier: exact for plane waves in the plane of incidence of the internal face, lossless crystals, no gap
 * interference (Born & Wolf, Principles of Optics, 7th ed., §1.5.4 and ch. 15; Shurcliff, Polarized Light, 1962,
 * ch. 5). Built on `uniaxial.ts` `plateWaves`: at each face the tangential wave-vector component is conserved, and a
 * wave in a uniaxial crystal takes the normal component its index surface allows.
 *
 * Frame: the beam enters along +z through a face normal to z; x is in the plane of incidence of the internal face.
 * The internal face (Glan hypotenuse, splitter interface) has its normal tilted by θ_h (Glan) or the wedge angle α
 * (splitters) from z toward −x, so a ray tilted toward +x meets it more steeply.
 *
 * Glan prisms: the optic axis is parallel to the entrance face, in the plane of incidence (Glan-Taylor: the e wave
 * is p-polarized at the gap, near Brewster's angle; Archard & Taylor 1948) or perpendicular to it (Glan-Foucault
 * with an air gap, Glan-Thompson with a cement). A ray entering at the external angle φ (in air, signed: φ > 0 steepens
 * the hypotenuse incidence) is polarized when its higher-index wave (o in a negative crystal such as calcite, e in a
 * positive one) is totally reflected (|k_t| ≥ n_gap) and the other is not (|k_t| < n_gap), k_t being the wave
 * vector's component along the hypotenuse. The window is the range of φ where both hold; its edges are where the
 * reflected wave starts to leak, the passed wave starts to be reflected, or the ray no longer reaches the hypotenuse
 * (grazing). With a cement index above n_e and the axis perpendicular to the plane, calcite's e wave cannot be
 * totally reflected, so only grazing limits that side. The prism length is L = A tan θ_h for aperture A.
 *
 * Splitters (normal incidence): Wollaston, axis along x in the first wedge and along y in the second; Rochon, along z
 * then y; Sénarmont, along z then x. A wave's polarization (s: E along y, p: E in the x–z plane) is kept across the
 * interface: in a crystal with its axis along y the s wave is extraordinary, with the axis in the x–z plane the s
 * wave is ordinary. The exit angle in air is ε = asin(k_x) after the interface. To first order the Wollaston splits
 * the two beams by 2|Δn| tan α (Rochon, Sénarmont: one beam undeviated, the other by |Δn| tan α).
 */

import { plateWaves, type PlateWave } from "./uniaxial";

type Vec = [number, number, number];

const PHI_MAX = Math.PI / 2 - 1e-6;
const BISECT_STEPS = 60;

export type GlanAxis = "in-plane" | "perpendicular";

export interface GlanPrism {
  no: number;
  ne: number;
  /** Angle of incidence of the axial ray on the hypotenuse (the angle between hypotenuse and entrance face), rad. */
  hypotenuse: number;
  /** Index of the gap: 1 for air (Glan-Taylor, Glan-Foucault), the cement's for Glan-Thompson. */
  gapIndex: number;
  axis: GlanAxis;
}

export interface HypotenuseWave {
  /** Wave-vector component along the hypotenuse (k₀ units). */
  kt: number;
  /** Angle of incidence of the wave normal on the hypotenuse, rad. */
  aoi: number;
  /** The ray (energy) travels toward the hypotenuse. */
  reaches: boolean;
}

const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

function atHypotenuse(w: PlateWave, theta: number): HypotenuseWave {
  const t: Vec = [Math.cos(theta), 0, Math.sin(theta)];
  const n: Vec = [-Math.sin(theta), 0, Math.cos(theta)];
  const k: Vec = [Math.sin(w.waveAngle) * w.index, 0, w.kz];
  const kt = dot(k, t), kn = dot(k, n);
  return { kt, aoi: Math.atan2(kt, kn), reaches: dot(w.ray, n) > 0 };
}

/** The o and e waves of a ray entering at external angle φ, as they meet the hypotenuse. */
export function glanWaves(p: GlanPrism, phi: number): { o: HypotenuseWave; e: HypotenuseWave } {
  const w = plateWaves(p.no, p.ne, {
    nIncident: 1, incidence: phi, axisPolar: Math.PI / 2, axisAzimuth: p.axis === "in-plane" ? 0 : Math.PI / 2,
  });
  return { o: atHypotenuse(w.o, p.hypotenuse), e: atHypotenuse(w.e, p.hypotenuse) };
}

/**
 * Why a ray is not polarized: the higher-index wave (o in a negative crystal, e in a positive one) is not totally
 * reflected ("leaks"), the lower-index wave is ("blocked"), or the ray misses the hypotenuse ("grazing").
 */
export type GlanFailure = "leaks" | "blocked" | "grazing";

/** The wave that should be totally reflected and the one that should pass: o and e in a negative crystal. */
function roles(p: GlanPrism, w: { o: HypotenuseWave; e: HypotenuseWave }) {
  return p.ne > p.no ? { reflect: w.e, pass: w.o } : { reflect: w.o, pass: w.e };
}

/** Whether a ray at φ is polarized, or the first reason it is not. */
export function glanState(p: GlanPrism, phi: number): GlanFailure | "polarized" {
  const { o, e } = glanWaves(p, phi);
  if (!o.reaches || !e.reaches || !Number.isFinite(o.kt) || !Number.isFinite(e.kt)) return "grazing";
  const { reflect, pass } = roles(p, { o, e });
  if (Math.abs(reflect.kt) < p.gapIndex) return "leaks";
  if (Math.abs(pass.kt) >= p.gapIndex) return "blocked";
  return "polarized";
}

export interface GlanWindow {
  /** Signed external angles bounding the polarizing range, rad; NaN when no ray is polarized. */
  lower: number;
  upper: number;
  /** What ends the window on each side ("grazing" also when the edge is ±90°). */
  lowerLimit: GlanFailure | null;
  upperLimit: GlanFailure | null;
  /** The axial ray (φ = 0) is polarized. */
  axialPolarized: boolean;
  /** Largest field symmetric about the axis, min(−lower, upper), rad; 0 when the axis is outside the window. */
  halfField: number;
}

function validPrism(p: GlanPrism): boolean {
  return p.no > 0 && p.ne > 0 && p.gapIndex > 0 && p.hypotenuse > 0 && p.hypotenuse < Math.PI / 2;
}

/** Largest x in [a, b] where pred holds, for pred true at a and false at b (one switch). */
function lastTrue(pred: (x: number) => boolean, a: number, b: number): number {
  for (let k = 0; k < BISECT_STEPS; k++) {
    const mid = 0.5 * (a + b);
    if (pred(mid)) a = mid;
    else b = mid;
  }
  return a;
}

/**
 * Polarizing range of external angles. Both waves reach the hypotenuse for every φ below some φ_reach (the angle of
 * incidence there grows with φ); below it k_t of each wave rises with φ, and |k_t| ≥ n_gap only for k_t > 0 (a wave
 * entering from air has |k_t| ≤ 1 on the far side of the normal). So each edge is one root, found by bisection.
 */
export function glanWindow(p: GlanPrism): GlanWindow {
  const none: GlanWindow = {
    lower: NaN, upper: NaN, lowerLimit: null, upperLimit: null, axialPolarized: false, halfField: 0,
  };
  if (!validPrism(p)) return none;
  const reaches = (phi: number) => {
    const { o, e } = glanWaves(p, phi);
    return o.reaches && e.reaches;
  };
  if (!reaches(-PHI_MAX)) return none;
  const reachMax = reaches(PHI_MAX) ? PHI_MAX : lastTrue(reaches, -PHI_MAX, PHI_MAX);
  const ktReflect = (phi: number) => roles(p, glanWaves(p, phi)).reflect.kt;
  const ktPass = (phi: number) => roles(p, glanWaves(p, phi)).pass.kt;

  // Lower edge: the higher-index wave is totally reflected for φ above it.
  if (!(ktReflect(reachMax) >= p.gapIndex)) return none;
  const leaks = (phi: number) => ktReflect(phi) < p.gapIndex;
  const lowerGrazing = !leaks(-PHI_MAX);
  const lower = lowerGrazing ? -PHI_MAX : lastTrue((phi) => !leaks(phi), reachMax, -PHI_MAX);
  // Upper edge: the lower-index wave is transmitted for φ below it.
  const passes = (phi: number) => ktPass(phi) < p.gapIndex;
  if (!passes(lower)) return none;
  const upperGrazing = passes(reachMax);
  const upper = upperGrazing ? reachMax : lastTrue(passes, lower, reachMax);
  return {
    lower,
    upper,
    lowerLimit: lowerGrazing ? "grazing" : "leaks",
    upperLimit: upperGrazing ? "grazing" : "blocked",
    axialPolarized: lower <= 0 && upper >= 0,
    halfField: Math.max(0, Math.min(-lower, upper)),
  };
}

/**
 * Hypotenuse angle that centres the window on the axis (lower = −upper, the largest symmetric field), searched in
 * [lo, hi]; NaN when no angle in the range does.
 */
export function glanBalancedHypotenuse(p: Omit<GlanPrism, "hypotenuse">, lo = 5 * (Math.PI / 180), hi = 85 * (Math.PI / 180)): number {
  // A steeper hypotenuse moves the whole window toward negative φ, so lower + upper falls as θ_h grows.
  const centre = (theta: number) => {
    const w = glanWindow({ ...p, hypotenuse: theta });
    return w.lower + w.upper;
  };
  // Bracket the sign change on a 0.5° grid (outside some range of θ_h no ray is polarized and the centre is NaN).
  const step = 0.5 * (Math.PI / 180);
  let a = NaN, b = NaN;
  let prev = centre(lo);
  for (let theta = lo + step; theta <= hi + 1e-12; theta += step) {
    const c = centre(theta);
    if (prev > 0 && c <= 0) {
      a = theta - step;
      b = theta;
      break;
    }
    prev = c;
  }
  if (Number.isNaN(a)) return NaN;
  for (let k = 0; k < BISECT_STEPS; k++) {
    const mid = 0.5 * (a + b);
    const c = centre(mid);
    if (Number.isNaN(c)) return NaN;
    if (c > 0) a = mid;
    else if (c < 0) b = mid;
    else return mid;
  }
  return 0.5 * (a + b);
}

export type SplitterType = "wollaston" | "rochon" | "senarmont";

const AXES: Record<SplitterType, [Vec, Vec]> = {
  wollaston: [[1, 0, 0], [0, 1, 0]],
  rochon: [[0, 0, 1], [0, 1, 0]],
  senarmont: [[0, 0, 1], [1, 0, 0]],
};

/** Index of an s or p wave travelling along z in a crystal with its optic axis along x, y or z. */
function normalIncidenceIndex(no: number, ne: number, axis: Vec, pol: "s" | "p"): number {
  if (axis[2] === 1) return no;
  const extraordinary = (pol === "s") === (axis[1] === 1);
  return extraordinary ? ne : no;
}

/**
 * Exit angle in air of the s or p beam of a two-wedge splitter with wedge angle α (0 < α < π/2) at normal incidence,
 * rad, signed toward +x. NaN when the beam is totally reflected at the interface or the exit face.
 */
export function splitterExitAngle(type: SplitterType, no: number, ne: number, wedge: number, pol: "s" | "p"): number {
  if (!(no > 0 && ne > 0 && wedge > 0 && wedge < Math.PI / 2)) return NaN;
  const [axis1, axis2] = AXES[type];
  const n1 = normalIncidenceIndex(no, ne, axis1, pol);
  const t: Vec = [Math.cos(wedge), 0, Math.sin(wedge)];
  const nrm: Vec = [-Math.sin(wedge), 0, Math.cos(wedge)];
  // Second wedge's axis in the interface frame (x' = t, y, z' = interface normal), turned to point into the wedge
  // (the axis is a line, so a and −a are the same crystal).
  const sign = dot(axis2, nrm) < 0 ? -1 : 1;
  const a: Vec = [sign * dot(axis2, t), sign * axis2[1], sign * dot(axis2, nrm)];
  const w = plateWaves(no, ne, {
    nIncident: n1, incidence: wedge, axisPolar: Math.acos(Math.min(1, a[2])), axisAzimuth: Math.atan2(a[1], a[0]),
  });
  const extraordinary = axis2[1] === 1 ? pol === "s" : pol === "p";
  const wave = extraordinary ? w.e : w.o;
  const kxPrime = n1 * Math.sin(wedge);
  const kx = kxPrime * Math.cos(wedge) - wave.kz * Math.sin(wedge);
  return Math.abs(kx) <= 1 ? Math.asin(kx) : NaN;
}

export interface SplitterAngles {
  s: number;
  p: number;
  /** Angle between the two exit beams, rad. */
  separation: number;
  /** First-order estimate: 2|Δn| tan α (Wollaston) or |Δn| tan α (Rochon, Sénarmont). */
  smallAngle: number;
}

export function splitterAngles(type: SplitterType, no: number, ne: number, wedge: number): SplitterAngles {
  const s = splitterExitAngle(type, no, ne, wedge, "s");
  const p = splitterExitAngle(type, no, ne, wedge, "p");
  const factor = type === "wollaston" ? 2 : 1;
  return { s, p, separation: Math.abs(s - p), smallAngle: factor * Math.abs(ne - no) * Math.tan(wedge) };
}
