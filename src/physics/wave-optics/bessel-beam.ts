/**
 * Ideal scalar Bessel beam E(r, z) = J_n(k_r r) e^(i k_z z) e^(inφ), the superposition of plane waves on a cone of
 * half-angle θ: k_r = k sin θ, k_z = k cos θ (Durnin 1987). SI units, λ the wavelength in the medium.
 * Model tier: exact for the ideal beam; the propagation range of a beam cut to radius R (an axicon or annular-slit
 * source of radius R, or the 1/e² radius of the Gaussian lighting it) is the geometric estimate z_max = R / tan θ.
 *   J₀ core: first dark ring at r₀ = j₀,₁ / k_r (j₀,₁ = 2.404826), intensity FWHM 2 x½ / k_r with J₀(x½)² = ½
 *   (x½ = 1.126364); a Gaussian with waist r₀ has z_R = π r₀²/λ.
 * J. Durnin, J. J. Miceli & J. H. Eberly, Phys. Rev. Lett. 58, 1499 (1987), doi 10.1103/PhysRevLett.58.1499;
 * D. McGloin & K. Dholakia, Contemp. Phys. 46, 15 (2005), doi 10.1080/0010751042000275259.
 */

import { besselJ } from "../math";

/** First zero of J₀ (A&S Table 9.5). */
export const J0_FIRST_ZERO = 2.404825557695773;
/** x where J₀(x)² = ½, from bisection on besselJ (tests/wave-optics-modes.test.ts). */
export const J0_HALF_INTENSITY = 1.1263642;

/** Radial wavenumber k_r = (2π/λ) sin θ, rad/m. */
export function radialWavenumber(lambda: number, theta: number): number {
  if (!(lambda > 0 && theta > 0 && theta < Math.PI / 2) || !Number.isFinite(lambda)) return NaN;
  return ((2 * Math.PI) / lambda) * Math.sin(theta);
}

/** Radius of the first dark ring of a J₀ beam, j₀,₁ / k_r, m. */
export function coreRadius(kr: number): number {
  return kr > 0 && Number.isFinite(kr) ? J0_FIRST_ZERO / kr : NaN;
}

/** Full width at half maximum of the J₀² core, 2 x½ / k_r, m. */
export function coreFwhm(kr: number): number {
  return kr > 0 && Number.isFinite(kr) ? (2 * J0_HALF_INTENSITY) / kr : NaN;
}

/** Geometric range z_max = R / tan θ of a Bessel beam made from an input of radius R, m. */
export function maxPropagationDistance(R: number, theta: number): number {
  if (!(R > 0 && theta > 0 && theta < Math.PI / 2) || !Number.isFinite(R)) return NaN;
  return R / Math.tan(theta);
}

/** Intensity J_n(k_r r)² of an order-n Bessel beam, relative to the J₀ peak. */
export function besselBeamIntensity(n: number, kr: number, r: number): number {
  const j = besselJ(n, kr * r);
  return j * j;
}
