/**
 * Point-ahead angle of a laser link between moving terminals. SI units: m, m/s, rad. Model tier: textbook (first order
 * in v/c, straight-line propagation, no atmospheric refraction).
 *
 * Light from the far terminal shows where it was a time R/c ago, and the outgoing beam reaches it a time R/c later, so
 * the transmit direction must lead the received beacon by θ_PA = 2v⊥/c, v⊥ the relative transverse velocity in an
 * inertial frame: A. Carrasco-Casado, R. Mata-Calvo, "Space optical links for communication networks", Springer
 * Handbook of Optical Networks (2020), eq. (8.4). The range cancels; the lateral miss distance at the far end is
 * θ_PA·R.
 *
 * A geostationary satellite and a ground station co-rotate, so their relative velocity in the Earth-fixed frame is
 * zero, but in the inertial frame it is ω_E(r_GEO − R_E) for a station under the satellite: 2.61 km/s, θ_PA = 17.4 µrad
 * (the chapter quotes ≈ 18 µrad for GEO).
 */

import { c } from "../constants";

/** Earth rotation rate relative to the stars, rad/s (IERS Conventions 2010, Table 1.1). */
export const OMEGA_EARTH = 7.292115e-5;
/** WGS-84 equatorial radius, m. */
export const R_EARTH_EQ = 6378137;
/** Geocentric gravitational constant GM_E, m³/s² (IERS Conventions 2010, Table 1.1). */
export const GM_EARTH = 3.986004418e14;
/** Geostationary orbit radius (GM_E/ω_E²)^(1/3) ≈ 42 164 km. */
export const R_GEO = Math.cbrt(GM_EARTH / OMEGA_EARTH ** 2);

/** Inertial transverse velocity between a GEO satellite and a ground station directly beneath it, m/s. */
export const GEO_SUBSATELLITE_VPERP = OMEGA_EARTH * (R_GEO - R_EARTH_EQ);

/** Point-ahead angle 2v⊥/c, rad. */
export function pointAheadAngle(vPerp: number): number {
  return (2 * Math.abs(vPerp)) / c;
}

/** One-way light time R/c, s. */
export function lightTime(range: number): number {
  return range / c;
}

/** Diffraction half-angle to the first null of a uniformly filled circular aperture, 1.22 λ/D, rad. */
export function airyHalfAngle(lambda: number, apertureDiameter: number): number {
  return apertureDiameter > 0 ? (1.22 * lambda) / apertureDiameter : NaN;
}
