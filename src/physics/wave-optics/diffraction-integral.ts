/**
 * Fresnel (paraxial) diffraction of a unit plane wave by a circular aperture of radius a or a slit of half-width a,
 * observed at distance z. SI units; intensities are relative to the incident intensity I₀. Both depend only on the
 * Fresnel number N_F = a²/(λz) and the scaled position ρ/a (or x/a).
 * Model tier: textbook. Scalar Fresnel integral, valid when z ≫ a and the observation angle stays paraxial.
 *   Circular, Fresnel: I/I₀ = (2π N_F)² |∫₀¹ e^(iπ N_F t²) J₀(v t) t dt|², v = 2π N_F ρ/a = k a ρ/z;
 *     on axis 4 sin²(π N_F/2), the Fresnel-zone result (bright for odd N_F, dark for even).
 *   Circular, Fraunhofer (N_F ≪ 1): I/I₀ = (π N_F)² [2 J₁(v)/v]², first dark ring at ρ = j₁,₁ λz/(2π a) = 1.21967 λz/(2a).
 *   Slit, Fresnel: I/I₀ = ½ [(C(ξ₂) − C(ξ₁))² + (S(ξ₂) − S(ξ₁))²], ξ₁,₂ = √(2 N_F)(∓1 − x/a), C and S the Fresnel
 *     integrals; Fraunhofer: I/I₀ = 4 N_F sinc²(2π N_F x/a), first zero at x = λz/(2a).
 * J. W. Goodman, Introduction to Fourier Optics, 3rd ed. (Roberts, 2005), ch. 4; M. Born & E. Wolf, Principles of
 * Optics, 7th ed. (Cambridge, 1999), ch. 8, doi 10.1017/CBO9781139644181.
 */

import { besselJ, besselJ0Fast, fresnelIntegrals, sinc } from "../math";

/** First zero of J₁ (A&S Table 9.5). */
const J1_FIRST_ZERO = 3.831705970207512;
/** Largest Fresnel number for the circular-aperture quadrature: its cost grows as N_F and the pattern nears the shadow. */
export const MAX_CIRCULAR_FRESNEL_NUMBER = 20;

/** Fresnel number N_F = a²/(λz). */
export function fresnelNumber(a: number, lambda: number, z: number): number {
  if (!(a > 0 && lambda > 0 && z > 0) || !Number.isFinite(a * lambda * z)) return NaN;
  return (a * a) / (lambda * z);
}

/** On-axis intensity behind a circular aperture, 4 sin²(π N_F/2), relative to the incident intensity. */
export function circularOnAxisIntensity(NF: number): number {
  if (!(NF > 0) || !Number.isFinite(NF)) return NaN;
  const s = Math.sin((Math.PI * NF) / 2);
  return 4 * s * s;
}

/**
 * Fresnel intensity behind a circular aperture at scaled radius ρ/a, relative to the incident intensity. Complex
 * Simpson rule over t ∈ [0, 1] with 16 + 16 (2 N_F + v/π) panels (16 per half period of the integrand), error ≲ 1e-5
 * of the incident intensity; J₀ from besselJ0Fast (|error| < 1e-7). NaN above MAX_CIRCULAR_FRESNEL_NUMBER.
 */
export function circularFresnelIntensity(NF: number, rhoOverA: number): number {
  if (!(NF > 0 && NF <= MAX_CIRCULAR_FRESNEL_NUMBER) || !(rhoOverA >= 0) || !Number.isFinite(rhoOverA)) return NaN;
  const v = 2 * Math.PI * NF * rhoOverA;
  const m = 2 * Math.ceil((16 + 16 * (2 * NF + v / Math.PI)) / 2);
  const h = 1 / m;
  const phase = Math.PI * NF;
  let re = 0;
  let im = 0;
  for (let i = 1; i <= m; i++) {
    // The t = 0 end contributes 0 (factor t).
    const t = i * h;
    const weight = i === m ? 1 : i % 2 ? 4 : 2;
    const g = weight * besselJ0Fast(v * t) * t;
    re += g * Math.cos(phase * t * t);
    im += g * Math.sin(phase * t * t);
  }
  const scale = (2 * Math.PI * NF * h) / 3;
  return scale * scale * (re * re + im * im);
}

/** Fraunhofer (far-field) intensity of a circular aperture, (π N_F)² [2 J₁(v)/v]², relative to the incident intensity. */
export function circularFraunhoferIntensity(NF: number, rhoOverA: number): number {
  if (!(NF > 0) || !Number.isFinite(NF) || !(rhoOverA >= 0) || !Number.isFinite(rhoOverA)) return NaN;
  const v = 2 * Math.PI * NF * rhoOverA;
  const airy = v === 0 ? 1 : (2 * besselJ(1, v)) / v;
  return (Math.PI * NF) ** 2 * airy * airy;
}

/** Radius of the first dark ring of the far-field (Airy) pattern, j₁,₁ λz/(2π a), m. */
export function airyFirstZeroRadius(a: number, lambda: number, z: number): number {
  if (!(a > 0 && lambda > 0 && z > 0)) return NaN;
  return (J1_FIRST_ZERO * lambda * z) / (2 * Math.PI * a);
}

/** Fresnel intensity behind a slit of half-width a at scaled position x/a, relative to the incident intensity. */
export function slitFresnelIntensity(NF: number, xOverA: number): number {
  if (!(NF > 0) || !Number.isFinite(NF) || !Number.isFinite(xOverA)) return NaN;
  const s = Math.sqrt(2 * NF);
  const [c1, s1] = fresnelIntegrals(s * (-1 - xOverA));
  const [c2, s2] = fresnelIntegrals(s * (1 - xOverA));
  return 0.5 * ((c2 - c1) ** 2 + (s2 - s1) ** 2);
}

/** Fraunhofer intensity of a slit, 4 N_F sinc²(2π N_F x/a), relative to the incident intensity. */
export function slitFraunhoferIntensity(NF: number, xOverA: number): number {
  if (!(NF > 0) || !Number.isFinite(NF) || !Number.isFinite(xOverA)) return NaN;
  const sc = sinc(2 * Math.PI * NF * xOverA);
  return 4 * NF * sc * sc;
}

/** First zero of the far-field slit pattern, λz/(2a), m. */
export function slitFirstZero(a: number, lambda: number, z: number): number {
  if (!(a > 0 && lambda > 0 && z > 0)) return NaN;
  return (lambda * z) / (2 * a);
}
