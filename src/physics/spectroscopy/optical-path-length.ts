/**
 * Optical path length and delays through a plane-parallel slab crossed N times. SI units (m, s), angles in rad.
 * Model tier: exact (geometric ray through a homogeneous, lossless, isotropic slab; incidence from air, n₀ = 1).
 *
 * Inside the slab the ray travels at θ_t, n₀ sin θ = n sin θ_t (Snell), so one pass covers L₁ = d/cos θ_t and N passes
 * L = N d/cos θ_t. The optical path length is OPL = nL and the phase delay τ_φ = OPL/c. A pulse travels at the group
 * velocity c/n_g with n_g = n − λ dn/dλ, so its transit time is τ_g = n_g L/c, and the extra delay compared with the
 * same geometric path in vacuum is (n_g − 1)L/c (E. Hecht, Optics, 5th ed., Pearson 2017, ch. 4 and 7;
 * B. E. A. Saleh, M. C. Teich, Fundamentals of Photonics, 2nd ed., Wiley 2007, ch. 5).
 */
import { c } from "../constants";

export interface SlabPath {
  /** Internal ray angle θ_t, rad. */
  thetaT: number;
  /** Geometric path N d/cos θ_t, m. */
  geometric: number;
  /** Optical path length nL, m. */
  opl: number;
  /** Optical path difference (n − 1)L against vacuum over the same path, m. */
  opdVacuum: number;
  /** Phase delay OPL/c, s. */
  phaseDelay: number;
  /** Group delay n_g L/c, s. */
  groupDelay: number;
  /** Group delay minus the vacuum transit time, (n_g − 1)L/c, s. */
  extraGroupDelay: number;
}

/** Path and delays through a slab of thickness d (m), index n, group index n_g, N passes, external incidence θ. */
export function slabPath(d: number, n: number, nGroup: number, passes: number, theta: number, n0 = 1): SlabPath {
  const sinT = (n0 * Math.sin(theta)) / n;
  const valid = d >= 0 && n > 0 && nGroup > 0 && passes >= 0 && n0 > 0 && theta >= 0 && theta < Math.PI / 2 && sinT < 1;
  const thetaT = valid ? Math.asin(sinT) : NaN;
  const geometric = (passes * d) / Math.cos(thetaT);
  return {
    thetaT,
    geometric,
    opl: n * geometric,
    opdVacuum: (n - 1) * geometric,
    phaseDelay: (n * geometric) / c,
    groupDelay: (nGroup * geometric) / c,
    extraGroupDelay: ((nGroup - 1) * geometric) / c,
  };
}
