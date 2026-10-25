/**
 * Fundamental (TEM₀₀) Gaussian beam in a uniform medium, paraxial, and the embedded-Gaussian model of a real beam of
 * quality M². SI units: λ is the wavelength in the medium, w the 1/e² intensity radius, z measured from the waist.
 * Model tier: exact within the paraxial wave equation (kw₀ ≫ 1).
 *   z_R = π w₀² / (M² λ),  w(z) = w₀ √(1 + (z/z_R)²),  R(z) = z (1 + (z_R/z)²),  ψ(z) = arctan(z/z_R),
 *   θ = M² λ / (π w₀) (far-field half angle),  BPP = w₀ θ = M² λ/π.
 * The Gouy phase runs from −π/2 to +π/2 through the focus, a total of π; a Hermite–Gaussian TEMmn mode picks up
 * (m + n + 1) ψ. H. Kogelnik & T. Li, Appl. Opt. 5, 1550 (1966), doi 10.1364/AO.5.001550; S. Feng & H. G. Winful,
 * Opt. Lett. 26, 485 (2001), doi 10.1364/OL.26.000485; A. E. Siegman, Proc. SPIE 1224, 2 (1990),
 * doi 10.1117/12.18425 (M², embedded Gaussian).
 */

export interface GaussianBeam {
  /** Wavelength in the medium, m, > 0. */
  lambda: number;
  /** Waist radius (1/e² intensity), m, > 0. */
  w0: number;
  /** Beam quality factor, ≥ 1 for a real beam; 1 for TEM₀₀. Defaults to 1. */
  m2?: number;
}

const valid = ({ lambda, w0, m2 = 1 }: GaussianBeam) => lambda > 0 && w0 > 0 && m2 > 0 && Number.isFinite(lambda * w0 * m2);

/** Rayleigh range z_R = π w₀² / (M² λ), m. */
export function rayleighRange(b: GaussianBeam): number {
  if (!valid(b)) return NaN;
  return (Math.PI * b.w0 * b.w0) / ((b.m2 ?? 1) * b.lambda);
}

/** Far-field divergence half angle θ = M² λ / (π w₀), rad. */
export function divergenceHalfAngle(b: GaussianBeam): number {
  if (!valid(b)) return NaN;
  return ((b.m2 ?? 1) * b.lambda) / (Math.PI * b.w0);
}

/** Waist radius w₀ = M² λ / (π θ) of a beam with far-field divergence half angle θ (rad), m: the inverse of the above. */
export function waistFromDivergence(lambda: number, halfAngle: number, m2 = 1): number {
  if (!(lambda > 0 && halfAngle > 0 && m2 > 0) || !Number.isFinite(lambda * halfAngle * m2)) return NaN;
  return (m2 * lambda) / (Math.PI * halfAngle);
}

/** Beam parameter product w₀ θ = M² λ / π, m·rad. */
export function beamParameterProduct(b: GaussianBeam): number {
  if (!valid(b)) return NaN;
  return ((b.m2 ?? 1) * b.lambda) / Math.PI;
}

/** Beam radius w(z) = w₀ √(1 + (z/z_R)²), m. */
export function beamRadius(b: GaussianBeam, z: number): number {
  const zR = rayleighRange(b);
  if (!Number.isFinite(z)) return NaN;
  return b.w0 * Math.hypot(1, z / zR);
}

/** Wavefront radius of curvature R(z) = z + z_R²/z, m; ±∞ at the waist (flat wavefront), sign of z. */
export function wavefrontRadius(b: GaussianBeam, z: number): number {
  const zR = rayleighRange(b);
  if (!Number.isFinite(z) || !Number.isFinite(zR)) return NaN;
  if (z === 0) return Infinity;
  return z + (zR * zR) / z;
}

/** Gouy phase ψ(z) = arctan(z/z_R) of the fundamental mode, rad, in (−π/2, π/2). */
export function gouyPhase(b: GaussianBeam, z: number): number {
  const zR = rayleighRange(b);
  if (!Number.isFinite(z) || !Number.isFinite(zR)) return NaN;
  return Math.atan(z / zR);
}

/**
 * M² of a beam from its second-moment waist radius and far-field half angle: M² = π w₀ θ / λ (ISO 11146-1).
 * Returns the raw ratio: a value below 1 means inconsistent inputs, since no beam beats a TEM₀₀ Gaussian.
 */
export function m2FromWaistDivergence(lambda: number, w0: number, halfAngle: number): number {
  if (!(lambda > 0 && w0 > 0 && halfAngle > 0) || !Number.isFinite(lambda * w0 * halfAngle)) return NaN;
  return (Math.PI * w0 * halfAngle) / lambda;
}
