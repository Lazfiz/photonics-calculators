/**
 * Image-distance page summary: thin-lens conjugates from the object distance or from the magnification, with
 * the page's problem messages. SI in and out (m). Built on gaussian-optics.ts, which has importers on other pages,
 * so this module is separate. Equations: J. E. Greivenkamp, Field Guide to Geometrical Optics (SPIE 2004,
 * doi:10.1117/3.547461), "Gaussian imaging equation" and "Newtonian equations": 1/o + 1/i = 1/f, M = −i/o,
 * o = f(1 − 1/M), i = f(1 − M), x·x′ = f² (Greivenkamp's directed form zz′ = −f_E², z = −x) with x = o − f, x′ = i − f.
 */

import { conjugatesFromMag, thinLensImage } from "./gaussian-optics";

/** Smallest |f| the page accepts as a lens, 0.1 mm. */
export const MIN_FOCAL_LENGTH = 1e-4;

const MM = 1e-3;

export interface ImageDistanceSummary {
  /** Object distance (given, or solved from M), m. */
  o: number;
  /** Image distance, m; NaN when there is a problem. */
  i: number;
  /** Magnification M = −i/o; NaN when there is a problem. */
  M: number;
  /** |i/o|. */
  conjugateRatio: number;
  /** |o + i|, m. */
  objectToImage: number;
  /** Newtonian x = o − f, m. */
  newtonX: number;
  /** Newtonian x′ = i − f, m. */
  newtonXPrime: number;
  /** Why there is no result, or "". */
  problem: string;
}

/** Conjugates of a thin lens of focal length f given o (`solve` "object") or M (`solve` "mag"); SI. */
export function imageDistanceSummary(f: number, solve: string, objectDistance: number, mag: number): ImageDistanceSummary {
  let o = objectDistance;
  let i = NaN;
  let M = NaN;
  let problem = "";
  if (Math.abs(f) < MIN_FOCAL_LENGTH) problem = "|f| must be at least 0.1 mm.";
  else if (solve === "mag") {
    if (mag === 0) problem = "M = 0 puts the object at infinity: use the focal length as the image distance.";
    else {
      ({ o, i } = conjugatesFromMag(f, mag));
      M = mag;
      if (Math.abs(mag - 1) < 1e-9) {
        problem = "M = +1: object and image both sit at the lens (o = i = 0).";
      } else if (!(o > 0)) {
        problem = `M = ${mag} with f = ${Number((f / MM).toPrecision(12))} mm needs o = ${(o / MM).toFixed(2)} mm, a virtual object (light converging onto the lens). ${
          f > 0 ? "A converging lens forms M < 0 (real) or M > 1 (virtual) from a real object." : "A diverging lens forms only 0 < M < 1 from a real object."
        }`;
      }
    }
  } else if (Math.abs(o - f) < 1e-9 * Math.abs(f)) problem = "The object is at the front focal point: the image is at infinity (collimated light).";
  else ({ i, M } = thinLensImage(f, o));
  return {
    o, i, M,
    conjugateRatio: Math.abs(i / o),
    objectToImage: Math.abs(o + i),
    newtonX: o - f,
    newtonXPrime: i - f,
    problem,
  };
}
