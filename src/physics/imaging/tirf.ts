/**
 * Total internal reflection fluorescence (TIRF): critical angle, evanescent penetration depth and the intensity at
 * the interface. SI units in and out, angles in rad. Model tier: exact (plane-wave Fresnel optics at a single
 * planar interface); a real objective illuminates with a cone of angles and some scattered light.
 *
 * Light in glass of index n₁ at incidence θ > θ_c = arcsin(n₂/n₁) is totally reflected; in the sample (n₂) the
 * field decays as exp(−γz) with γ = (2π/λ)√(n₁² sin²θ − n₂²), so the intensity decays as exp(−z/d) with
 *   d = λ/(4π √(n₁² sin²θ − n₂²)) = 1/(2γ)
 * (D. Axelrod, Traffic 2, 764 (2001), eq. 2, doi:10.1034/j.1600-0854.2001.21104.x). The intensity at z = 0,
 * relative to the incident intensity in the glass, with n = n₂/n₁ (Axelrod 2001, eqs. 4–5):
 *   s (⊥): 4 cos²θ/(1 − n²);  p (∥): 4 cos²θ (2 sin²θ − n²)/(n⁴ cos²θ + sin²θ − n²).
 * Both follow from the Fresnel transmission coefficients with cos θ₂ imaginary.
 */
import { evanescentDecay } from "../fiber-optics/fiber-sensors";

const positive = (x: number) => Number.isFinite(x) && x > 0;

/** Critical angle arcsin(n₂/n₁), rad; NaN unless n₁ > n₂ > 0. */
export function tirfCriticalAngle(n1: number, n2: number): number {
  return positive(n1) && positive(n2) && n2 < n1 ? Math.asin(n2 / n1) : NaN;
}

/** Largest incidence angle an objective of numerical aperture NA reaches in glass of index n₁, arcsin(NA/n₁), rad. */
export function tirfMaxAngle(NA: number, n1: number): number {
  return positive(NA) && positive(n1) && NA <= n1 ? Math.asin(NA / n1) : NaN;
}

/** Intensity penetration depth d = 1/(2γ) = λ/(4π √(n₁² sin²θ − n₂²)), m; NaN at or below the critical angle. */
export function tirfPenetrationDepth(lambda: number, n1: number, n2: number, theta: number): number {
  if (!(positive(n1) && positive(n2) && theta > 0 && theta < Math.PI / 2)) return NaN;
  return 1 / (2 * evanescentDecay(lambda, n1 * Math.sin(theta), n2));
}

/** Evanescent intensity at the interface relative to the incident intensity, for s and p polarisation (Axelrod 2001). */
export function tirfInterfaceIntensity(n1: number, n2: number, theta: number): { s: number; p: number } {
  const thetaC = tirfCriticalAngle(n1, n2);
  if (!(theta >= thetaC && theta < Math.PI / 2)) return { s: NaN, p: NaN };
  const n = n2 / n1;
  const s2 = Math.sin(theta) ** 2;
  const c2 = Math.cos(theta) ** 2;
  return {
    s: (4 * c2) / (1 - n * n),
    p: (4 * c2 * (2 * s2 - n * n)) / (n ** 4 * c2 + s2 - n * n),
  };
}
