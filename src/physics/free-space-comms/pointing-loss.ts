/**
 * Power collected by a circular receiver from a Gaussian beam with a static pointing offset and random jitter.
 * SI units: lengths in m, angles in rad. Model tier: exact for a Gaussian beam in vacuum (no turbulence, beam
 * wander or atmospheric loss), averaged over isotropic Gaussian jitter.
 *
 * The 1/e² radius at range z of a beam with its waist w₀ at the transmitter is w(z) = w₀ √(1 + (z/z_R)²),
 * z_R = π w₀²/λ. The intensity is a 2-D Gaussian with variance w²/4 per axis, so an aperture of radius a whose
 * centre is r from the beam axis collects η(r) = 1 − Q₁(2r/w, 2a/w) (Q₁ the Marcum Q-function). If the pointing
 * error is θ_b (static) plus jitter of σ_θ per axis, the beam centre at the receiver is Gaussian with mean b = θ_b z
 * and variance s² = (σ_θ z)² per axis; the mean collected fraction is then that of a single Gaussian of variance
 * σ_t² = w²/4 + s² offset by b: ⟨η⟩ = 1 − Q₁(b/σ_t, a/σ_t). Without offset, ⟨η⟩ = 1 − exp(−2a²/(w² + 4s²)). For
 * a ≪ w it reduces to η₀ · w²/(w² + 4s²) · exp(−2b²/(w² + 4s²)), η₀ = 2a²/w², the small-aperture jitter result of
 * A. A. Farid, S. Hranilovic, J. Lightwave Technol. 25, 1702 (2007).
 *
 * Q₁ is evaluated as P(|X| ≤ a) for X ~ N((b, 0), σ_t²): ∫ φ((x − b)/σ_t)/σ_t · erf(√(a² − x²)/(√2 σ_t)) dx over
 * |x| ≤ a, with x = a sin u to remove the square-root endpoints, by Simpson's rule on the part of the disc within
 * 12 σ_t of b (relative error < 1e-9 for 2000 intervals in the tests).
 */

import { erf } from "../math";

/** Beam 1/e² radius w(z) = w₀ √(1 + (z/z_R)²), m. */
export function beamRadius(waist: number, lambda: number, range: number): number {
  const zR = (Math.PI * waist * waist) / lambda;
  return waist * Math.sqrt(1 + (range / zR) ** 2);
}

/**
 * Fraction of a 2-D isotropic Gaussian (standard deviation σ per axis, centre offset b from the aperture centre)
 * that falls inside a circle of radius a: 1 − Q₁(b/σ, a/σ).
 */
export function gaussianDiscFraction(offset: number, sigma: number, radius: number, intervals = 2000): number {
  const b = Math.abs(offset);
  if (radius <= 0) return 0;
  const lo = Math.max(-radius, b - 12 * sigma);
  const hi = Math.min(radius, b + 12 * sigma);
  if (lo >= hi) return 0;
  const u0 = Math.asin(lo / radius), u1 = Math.asin(hi / radius);
  const n = intervals % 2 === 0 ? intervals : intervals + 1;
  const h = (u1 - u0) / n;
  const f = (u: number) => {
    const x = radius * Math.sin(u), c = radius * Math.cos(u);
    const z = (x - b) / sigma;
    return ((c / sigma) * Math.exp(-0.5 * z * z) * erf(c / (Math.SQRT2 * sigma))) / Math.sqrt(2 * Math.PI);
  };
  let sum = f(u0) + f(u1);
  for (let i = 1; i < n; i++) sum += (i % 2 === 1 ? 4 : 2) * f(u0 + i * h);
  return Math.min(1, Math.max(0, (sum * h) / 3));
}

export interface PointingResult {
  /** Beam 1/e² radius at the receiver, m. */
  beamRadius: number;
  /** Static offset b at the receiver, m. */
  offset: number;
  /** Jitter s per axis at the receiver, m. */
  jitter: number;
  /** Fraction collected with perfect pointing, 1 − exp(−2a²/w²). */
  alignedFraction: number;
  /** Mean fraction collected with the offset and jitter. */
  meanFraction: number;
}

/** Received fraction of a Gaussian beam (waist w₀ at the transmitter) by an aperture of diameter D at range z. */
export function pointingCapture(
  lambda: number, waist: number, range: number, apertureDiameter: number, staticError: number, jitterPerAxis: number,
): PointingResult {
  const w = beamRadius(waist, lambda, range);
  const a = apertureDiameter / 2;
  const offset = staticError * range;
  const jitter = jitterPerAxis * range;
  const sigmaT = Math.sqrt((w * w) / 4 + jitter * jitter);
  return {
    beamRadius: w,
    offset,
    jitter,
    alignedFraction: -Math.expm1((-2 * a * a) / (w * w)),
    meanFraction: gaussianDiscFraction(offset, sigmaT, a),
  };
}
