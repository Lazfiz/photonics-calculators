/**
 * Optics and wetting of condensation on a coated window. SI units: wavelengths in m, angles in rad, temperatures
 * in K, surface tensions in N/m.
 *
 * 1. A continuous water film (what a hydrophilic anti-fog coating aims for) is several µm thick and not uniform,
 *    so its interference fringes wash out: it is added incoherently. With a lossless film between a single
 *    air/water interface (R₁, T₁ = 1 − R₁, the same from both sides) and the coherent coating stack seen from the
 *    water (R₂, T₂):  R = R₁ + T₁² R₂ / (1 − R₁R₂),  T = T₁T₂ / (1 − R₁R₂)
 *    (Macleod, Thin-Film Optical Filters, 4th ed., ch. 2, thick incoherent layers). Model tier: exact for those
 *    assumptions.
 *
 * 2. Droplets (what fog on an untreated surface forms) are spherical caps with contact angle θ. Light crossing
 *    the window along the normal enters a cap through its flat base and meets the curved surface at an incidence
 *    angle α with sin α = ρ/r (ρ: distance from the cap's axis, r: sphere radius; the base radius is r sin θ).
 *    It is totally reflected where n_w sin α > n_out, so the fraction of the cap's base area that sends light back
 *    by total internal reflection is
 *        f_TIR = 1 − (n_out / (n_w sin θ))²   if n_w sin θ > n_out,  else 0,
 *    zero below θ = asin(n_out/n_w) = 48.6° for water in air. The rest leaves the drop refracted at the curved surface, which
 *    is what blurs the view. Geometric optics (droplets ≫ λ), one pass, θ ≤ 90°, no
 *    coverage statistics. Model tier: textbook approximation.
 *
 * 3. Wetting (Young–Dupré): adhesion tension γ cos θ and work of adhesion W = γ(1 + cos θ). Surface tension of
 *    water: IAPWS R1-76(2014), γ = B τ^μ (1 − bτ), τ = 1 − T/T_c, B = 235.8 mN/m, b = 0.625, μ = 1.256,
 *    T_c = 647.096 K (N. B. Vargaftik, B. N. Volkov, L. D. Voljak, J. Phys. Chem.
 *    Ref. Data 12, 817 (1983)).
 */
import { stackResponse, type Layer } from "./transfer-matrix";

/** Refractive index of water at 589 nm and 20 °C, held constant over the visible here. */
export const N_WATER = 1.333;

/** R and T of a coated substrate under a thick, incoherent, lossless water film (index nWater) in air. */
export function waterFilmResponse(
  coating: readonly Layer[],
  substrate: number,
  wavelength: number,
  nWater = N_WATER,
): { R: number; T: number } {
  if (!(nWater > 0)) return { R: NaN, T: NaN };
  const R1 = ((nWater - 1) / (nWater + 1)) ** 2;
  const T1 = 1 - R1;
  const back = stackResponse({ incident: nWater, layers: coating, substrate: { n: substrate } }, wavelength);
  const den = 1 - R1 * back.R;
  return { R: R1 + (T1 * T1 * back.R) / den, T: (T1 * back.T) / den };
}

/**
 * Fraction of a spherical cap's base area that totally reflects normally incident light (see header), for
 * 0 ≤ θ ≤ π/2. NaN above: a drop beyond a hemisphere overhangs its footprint, which this model doesn't cover.
 */
export function dropletTirFraction(contactAngle: number, nDrop = N_WATER, nOut = 1): number {
  if (!(contactAngle >= 0 && contactAngle <= Math.PI / 2 + 1e-12 && nDrop > 0 && nOut > 0)) return NaN;
  const s = nDrop * Math.sin(contactAngle);
  return s > nOut ? 1 - (nOut / s) ** 2 : 0;
}

/** Contact angle above which part of a droplet totally reflects normal light: asin(n_out/n_drop), rad. */
export function tirOnsetAngle(nDrop = N_WATER, nOut = 1): number {
  if (!(nDrop > nOut && nOut > 0)) return NaN;
  return Math.asin(nOut / nDrop);
}

/**
 * Surface tension of water against its vapour (IAPWS R1-76(2014)), N/m, for 248.15 K ≤ T < 647.096 K (valid from the
 * triple point; the release says it stays reasonably accurate in supercooled water down to −25 °C).
 */
export function waterSurfaceTension(temperature: number): number {
  const Tc = 647.096;
  if (!(temperature >= 248.15 && temperature < Tc)) return NaN;
  const tau = 1 - temperature / Tc;
  return 235.8e-3 * tau ** 1.256 * (1 - 0.625 * tau);
}

/** Young–Dupré: adhesion tension γ cos θ and work of adhesion γ(1 + cos θ), N/m. */
export function wetting(surfaceTension: number, contactAngle: number): { adhesionTension: number; workOfAdhesion: number } {
  if (!(surfaceTension > 0 && contactAngle >= 0 && contactAngle <= Math.PI)) return { adhesionTension: NaN, workOfAdhesion: NaN };
  const c = Math.cos(contactAngle);
  return { adhesionTension: surfaceTension * c, workOfAdhesion: surfaceTension * (1 + c) };
}
