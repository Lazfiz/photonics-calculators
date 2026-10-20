/**
 * Fabry-Pérot etalon: order, free spectral range, finesse and the Airy transmission fringe. Lengths in m,
 * frequencies in Hz, angles in rad.
 * Model tier: exact for a lossless, non-dispersive gap between identical mirrors with no reflection phase, in a
 * plane wave (T = 1/(1 + F sin²(δ/2)), δ = 4πnd cos θ/λ; M. Born & E. Wolf, Principles of Optics, 7th ed., §7.6.1;
 * E. Hecht, Optics, 5th ed., §9.6.1). The frequency FSR c/(2nd cos θ) is exact; the wavelength FSR λ²/(2nd cos θ) is
 * its first-order form. θ is the angle inside the gap, from Snell's law sin θ = sin θ₀/n for incidence from air.
 * Mirror dispersion, absorption, surface figure and beam divergence (which all lower the finesse) are not modelled.
 */
import { c } from "../constants";
import { airyPeakWidth } from "../thin-film/interference";

/** Angle inside a gap of index n for incidence θ₀ from air, asin(sin θ₀/n), rad. NaN unless n ≥ 1 and 0 ≤ θ₀ < π/2. */
export function gapAngle(incidence: number, n: number): number {
  if (!(n >= 1 && incidence >= 0 && incidence < Math.PI / 2)) return NaN;
  return Math.asin(Math.sin(incidence) / n);
}

/** Interference order 2nd cos θ/λ (not rounded). NaN unless n, d, λ > 0. */
export function etalonOrder(n: number, d: number, cosTheta: number, lambda: number): number {
  if (!(n > 0 && d > 0 && lambda > 0 && cosTheta > 0)) return NaN;
  return (2 * n * d * cosTheta) / lambda;
}

/** Free spectral range in frequency, c/(2nd cos θ), Hz. */
export function fsrFrequency(n: number, d: number, cosTheta: number): number {
  if (!(n > 0 && d > 0 && cosTheta > 0)) return NaN;
  return c / (2 * n * d * cosTheta);
}

/** Free spectral range in wavelength at λ, λ²/(2nd cos θ), m. */
export function fsrWavelength(lambda: number, n: number, d: number, cosTheta: number): number {
  if (!(lambda > 0 && n > 0 && d > 0 && cosTheta > 0)) return NaN;
  return (lambda * lambda) / (2 * n * d * cosTheta);
}

/** Exact Airy FWHM in frequency, FSR_ν · 4 asin(1/√F)/(2π), Hz; NaN for F < 1 (fringes never fall to half). */
export function fwhmFrequency(fsrHz: number, F: number): number {
  return (fsrHz * airyPeakWidth(F)) / (2 * Math.PI);
}

/**
 * Airy transmission over the orders m₀ − k … m₀ + k around λ₀ (orders ≥ 1), sampled in ψ with
 * tan(δ/2) = tan(ψ/2)/√(1 + F): uniform ψ puts the points where T changes, so even F ~ 10⁶ fringes are resolved
 * with a few hundred points per order. Returns wavelengths (ascending) and T.
 */
export function airyFringe(
  opticalThicknessCos: number, lambda0: number, F: number, ordersEachSide = 1, pointsPerOrder = 240,
): { lambda: number[]; T: number[] } {
  const lambda: number[] = [];
  const T: number[] = [];
  if (!(opticalThicknessCos > 0 && lambda0 > 0 && F >= 0)) return { lambda, T };
  const m0 = Math.round((2 * opticalThicknessCos) / lambda0);
  const s = Math.sqrt(1 + F);
  // Descending δ gives ascending λ = 4π nd cos θ/δ; each order spans δ ∈ [2πm − π, 2πm + π], δ > 0.
  for (let m = m0 + ordersEachSide; m >= Math.max(1, m0 - ordersEachSide); m--) {
    for (let i = pointsPerOrder; i >= 0; i--) {
      const psi = -Math.PI + (2 * Math.PI * i) / pointsPerOrder;
      const half = Math.atan(Math.tan(psi / 2) / s); // δ/2 − πm ∈ [−π/2, π/2]
      const delta = 2 * Math.PI * m + 2 * half;
      if (!(delta > 0) || (i === 0 && m > Math.max(1, m0 - ordersEachSide))) continue; // drop shared order edges
      const sn = Math.sin(half);
      lambda.push((4 * Math.PI * opticalThicknessCos) / delta);
      T.push(1 / (1 + F * sn * sn));
    }
  }
  return { lambda, T };
}
