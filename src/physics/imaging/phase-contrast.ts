/**
 * Image contrast of a weak phase object in Zernike phase contrast and in differential interference contrast (DIC).
 * SI units in and out, phases in rad. Model tier: textbook.
 *
 * Phase of the object relative to its surround: φ = 2π Δn t/λ.
 *
 * Zernike, ideal separation of the direct and the diffracted light: the object wave e^(iφ) splits into the direct
 * wave 1 and the diffracted wave e^(iφ) − 1 (≈ iφ, a quarter wave behind). The phase ring multiplies the direct wave
 * by a e^(iδ) (a = √(ring transmission)), so
 *   U = a e^(iδ) + e^(iφ) − 1, C = (|U|² − a²)/a² ≈ 2φ sin δ/a for |φ| ≪ a; at δ = ∓π/2 the contrast reverses
 *   (C = 0) where tan(|φ|/2) = a
 * (F. Zernike, Physica 9, 686 (1942), doi:10.1016/S0031-8914(42)80035-X; J. W. Goodman, Introduction to Fourier
 * Optics, 3rd ed. (2005), Zernike phase-contrast microscope). With the time factor e^(−iωt) a longer optical path
 * is a positive phase: δ = −π/2 advances the direct light (positive phase contrast, denser objects dark), δ = +π/2
 * retards it (negative phase contrast, denser objects bright).
 *
 * DIC with bias retardation Γ and stray light I_c (relative to the light through parallel polarisers), at a point
 * where the phase difference across the shear is Δφ:
 *   I/I_p = sin²((Γ + Δφ)/2) + I_c, C = [sin²((Γ + Δφ)/2) − sin²(Γ/2)]/[sin²(Γ/2) + I_c]
 * (E. D. Salmon, P. Tran, Methods Cell Biol. 81, 335 (2007), doi:10.1016/S0091-679X(06)81016-2). The opposite
 * edge has −Δφ, which gives the shadow-cast relief. Across a linear phase ramp of width w, Δφ = φ·min(s, w)/w.
 */

/** Phase difference 2π Δn t/λ of an object of thickness t and index step Δn, rad. */
export function objectPhase(deltaN: number, thickness: number, lambda: number): number {
  return Number.isFinite(deltaN) && thickness >= 0 && lambda > 0 ? (2 * Math.PI * deltaN * thickness) / lambda : NaN;
}

/** Zernike phase-contrast C = (|a e^(iδ) + e^(iφ) − 1|² − a²)/a², with ring intensity transmission 0 < t ≤ 1. */
export function zernikeContrast(phi: number, delta: number, ringTransmission = 1): number {
  if (!(Number.isFinite(phi) && Number.isFinite(delta) && ringTransmission > 0 && ringTransmission <= 1)) return NaN;
  const a = Math.sqrt(ringTransmission);
  const re = a * Math.cos(delta) + Math.cos(phi) - 1;
  const im = a * Math.sin(delta) + Math.sin(phi);
  return (re * re + im * im - a * a) / (a * a);
}

/** Small-phase limit 2φ sin δ/a of the Zernike contrast. */
export function zernikeContrastLinear(phi: number, delta: number, ringTransmission = 1): number {
  if (!(Number.isFinite(phi) && Number.isFinite(delta) && ringTransmission > 0 && ringTransmission <= 1)) return NaN;
  return (2 * phi * Math.sin(delta)) / Math.sqrt(ringTransmission);
}

/** Phase difference across a DIC shear s at the centre of a linear phase ramp φ of width w: φ·min(s, w)/w. */
export function dicShearPhase(phi: number, shear: number, edgeWidth: number): number {
  if (!(Number.isFinite(phi) && shear >= 0 && edgeWidth > 0)) return NaN;
  return (phi * Math.min(shear, edgeWidth)) / edgeWidth;
}

/** DIC intensity sin²((Γ + Δφ)/2) + I_c, relative to the light through parallel polarisers. */
export function dicIntensity(bias: number, dPhi: number, stray = 0): number {
  if (!(Number.isFinite(bias) && Number.isFinite(dPhi) && stray >= 0)) return NaN;
  return Math.sin((bias + dPhi) / 2) ** 2 + stray;
}

/** DIC contrast against the background: (I(Γ + Δφ) − I(Γ))/I(Γ); NaN when the background is dark (Γ = 0, I_c = 0). */
export function dicContrast(bias: number, dPhi: number, stray = 0): number {
  const bg = dicIntensity(bias, 0, stray);
  return bg > 0 ? (dicIntensity(bias, dPhi, stray) - bg) / bg : NaN;
}
