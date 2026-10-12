/**
 * Wave propagation in a uniaxial crystal (ordinary index n_o, extraordinary n_e; Δn = n_e − n_o). Angles in
 * radians, wave vectors in units of k₀ = 2π/λ. Model tier: exact for a lossless, non-magnetic, non-optically-active
 * uniaxial medium and plane waves (Born & Wolf, Principles of Optics, 7th ed., ch. 15 "Optics of crystals";
 * Yariv & Yeh, Optical Waves in Crystals, ch. 4).
 *
 * - Extraordinary index for a wave normal at θ to the optic axis: 1/n(θ)² = cos²θ/n_o² + sin²θ/n_e²
 *   (n(0) = n_o, n(90°) = n_e).
 * - Walk-off: the extraordinary ray (Poynting vector) lies at θ_S with tan θ_S = (n_o²/n_e²) tan θ from the axis.
 *   ρ = θ_S − θ is positive (ray turned away from the axis) in a negative crystal (n_e < n_o). |ρ| peaks at
 *   tan θ = n_e/n_o with tan ρ_max = |n_o² − n_e²|/(2 n_o n_e) (calcite: 6.2°).
 * - Plate refraction: a plane wave in an isotropic medium (index n_i, angle of incidence θ_i in the x–z plane,
 *   z the inward surface normal) keeps k_x = n_i sin θ_i. The o wave has k_z = √(n_o² − k_x²). The e wave
 *   satisfies k_⊥²/n_e² + k_∥²/n_o² = 1 (k_∥ along the optic axis â), a quadratic in k_z; the root with energy flow
 *   into the plate is taken. Its ray is along ∇ of that surface: k/n_e² + (1/n_o² − 1/n_e²)(k·â) â.
 * - Plate retardance (e relative to o, same exit point): Γ = k₀ d (k_z,e − k_z,o) (Veiras, Perez, Garea,
 *   Appl. Opt. 49, 2769 (2010), doi:10.1364/AO.49.002769). Γ = 2πΔn d/λ at normal incidence on an axis
 *   parallel to the faces.
 */

/** Extraordinary index for a wave normal at θ to the optic axis. */
export function extraordinaryIndex(no: number, ne: number, theta: number): number {
  const c = Math.cos(theta), s = Math.sin(theta);
  return 1 / Math.sqrt((c * c) / (no * no) + (s * s) / (ne * ne));
}

/** Signed walk-off ρ = θ_S − θ between the e ray and its wave normal (θ from the optic axis). */
export function walkoffAngle(no: number, ne: number, theta: number): number {
  const thetaS = Math.atan2(Math.sin(theta) / (ne * ne), Math.cos(theta) / (no * no));
  return thetaS - theta;
}

/** Largest walk-off and the wave-normal angle θ (from the axis) where it occurs. */
export function maxWalkoff(no: number, ne: number): { theta: number; rho: number } {
  return { theta: Math.atan(ne / no), rho: Math.atan((no * no - ne * ne) / (2 * no * ne)) };
}

/**
 * Thin section at normal incidence with the optic axis at θc from the section normal: both waves travel along the
 * normal, so the retardance is R = |n(θc) − n_o|·d (m); 0 looking along the axis, |Δn|·d with the axis in the plane.
 */
export function sectionRetardance(no: number, ne: number, thetaC: number, d: number): number {
  return Math.abs(extraordinaryIndex(no, ne, thetaC) - no) * d;
}

/**
 * Slow-axis azimuth of a section whose e-wave vibrates at azimuth ρ (the trace of the optic axis): the e-wave is slow
 * in a positive crystal (n_e > n_o), the o-wave, at ρ + 90°, in a negative one.
 */
export function sectionSlowAxis(no: number, ne: number, rho: number): number {
  return ne > no ? rho : rho + Math.PI / 2;
}

export interface PlateGeometry {
  /** Index of the isotropic medium around the plate. */
  nIncident: number;
  /** Angle of incidence in the x–z plane, rad. */
  incidence: number;
  /** Optic axis angle from the surface normal, rad. */
  axisPolar: number;
  /** Azimuth of the optic axis from the plane of incidence, rad (0: the axis lies in the plane of incidence). */
  axisAzimuth: number;
}

export interface PlateWave {
  /** Normal component of the wave vector, units of k₀ (NaN: evanescent). */
  kz: number;
  /** Refractive index seen by the wave, |k|. */
  index: number;
  /** Wave-normal angle from the surface normal, rad, signed toward +x. */
  waveAngle: number;
  /** Unit ray (Poynting) direction [x, y, z]. */
  ray: [number, number, number];
}

export interface PlateWaves {
  o: PlateWave;
  /** e wave, plus the angle between its wave normal and the optic axis. */
  e: PlateWave & { axisAngle: number };
}

const NAN_WAVE: PlateWave = { kz: NaN, index: NaN, waveAngle: NaN, ray: [NaN, NaN, NaN] };

function unit(v: [number, number, number]): [number, number, number] {
  const m = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / m, v[1] / m, v[2] / m];
}

/** The o and e waves refracted into a uniaxial plate. NaN fields where the wave is evanescent. */
export function plateWaves(no: number, ne: number, g: PlateGeometry): PlateWaves {
  const kx = g.nIncident * Math.sin(g.incidence);
  const a: [number, number, number] = [
    Math.sin(g.axisPolar) * Math.cos(g.axisAzimuth),
    Math.sin(g.axisPolar) * Math.sin(g.axisAzimuth),
    Math.cos(g.axisPolar),
  ];

  const kzo2 = no * no - kx * kx;
  const o: PlateWave = kzo2 > 0
    ? { kz: Math.sqrt(kzo2), index: no, waveAngle: Math.atan2(kx, Math.sqrt(kzo2)), ray: unit([kx, 0, Math.sqrt(kzo2)]) }
    : NAN_WAVE;

  // k_⊥²/n_e² + k_∥²/n_o² = 1 with |k|² = kx² + kz², k_∥ = kx·a_x + kz·a_z: A kz² + B kz + C = 0.
  const ie = 1 / (ne * ne), d = 1 / (no * no) - ie;
  const A = ie + d * a[2] * a[2];
  const B = 2 * d * kx * a[0] * a[2];
  const C = kx * kx * (ie + d * a[0] * a[0]) - 1;
  const disc = B * B - 4 * A * C;
  if (!(disc > 0)) return { o, e: { ...NAN_WAVE, axisAngle: NaN } };
  // Energy flow along z is ½∂F/∂kz = A kz + B/2 = √disc/2 > 0 for this root.
  const kz = (-B + Math.sqrt(disc)) / (2 * A);
  const kpar = kx * a[0] + kz * a[2];
  const ray = unit([kx * ie + d * kpar * a[0], d * kpar * a[1], kz * ie + d * kpar * a[2]]);
  const index = Math.hypot(kx, kz);
  const axisAngle = Math.acos(Math.min(1, Math.abs(kpar) / index));
  return { o, e: { kz, index, waveAngle: Math.atan2(kx, kz), ray, axisAngle } };
}

/** Exit-face offsets [x, y] of the o and e rays from the entry point, for a plate of thickness d (m). */
export function exitOffsets(w: PlateWaves, d: number): { o: [number, number]; e: [number, number] } {
  return {
    o: [(d * w.o.ray[0]) / w.o.ray[2], 0],
    e: [(d * w.e.ray[0]) / w.e.ray[2], (d * w.e.ray[1]) / w.e.ray[2]],
  };
}

/**
 * Distance between the two parallel beams after the plate (both leave along the incident direction), m:
 * √(Δx² cos²θ_i + Δy²) for exit-point offset (Δx, Δy).
 */
export function beamSeparation(w: PlateWaves, d: number, incidence: number): number {
  const { o, e } = exitOffsets(w, d);
  const dx = e[0] - o[0], dy = e[1] - o[1];
  return Math.sqrt(dx * dx * Math.cos(incidence) ** 2 + dy * dy);
}

/** Retardance of the e wave relative to the o wave after a plate of thickness d at wavelength λ, rad. */
export function plateRetardance(w: PlateWaves, d: number, lambda: number): number {
  return ((2 * Math.PI * d) / lambda) * (w.e.kz - w.o.kz);
}
