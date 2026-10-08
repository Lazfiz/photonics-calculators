/**
 * Spectral resolution of grating, prism and Fabry-Pérot spectrometers. SI units in and out: wavelengths, slit and
 * beam widths, groove spacings and focal lengths in m, angles in rad, angular dispersion in rad/m. Model tier:
 * textbook approximation (the slit and diffraction limits are computed separately and the resolution is taken as
 * the larger of the two; aberrations and detector pixels are not modelled).
 *
 * Grating equation mλ = d(sin α + sin β), α the incidence and β the diffraction angle from the grating normal,
 * both positive on the same side. Angular dispersion dβ/dλ = m/(d cos β). A slit of width w imaged at unit
 * magnification by optics of focal length f covers δλ_slit = w d cos β/(m f), the slit width times the
 * reciprocal linear dispersion. Diffraction by the illuminated width W (N = W/d grooves) limits the resolving
 * power to R = λ/δλ = mN (Rayleigh criterion). C. Palmer, E. Loewen, Diffraction Grating Handbook, 6th ed.
 * (Newport, 2005), ch. 2.
 *
 * Any disperser with angular dispersion dθ/dλ and an emerging beam of width D resolves δθ = λ/D, so
 * δλ_diff = λ/(D dθ/dλ). For a grating D = W cos β and this is λ/(mN) again. For a prism at minimum deviation,
 * dθ/dλ = 2 sin(A/2)/cos θ₁ · dn/dλ and D = L cos θ₁ (face length L), so D dθ/dλ = b dn/dλ with the base
 * b = 2L sin(A/2): Rayleigh's resolving power R = b |dn/dλ|. The slit term is δλ_slit = w/(f dθ/dλ).
 *
 * Fabry-Pérot: transmission T = 1/(1 + (2ℱ/π)² sin²(π Δλ/FSR)) near λ₀ (Airy function with the coefficient of
 * finesse 4R/(1 − R)² = (2ℱ/π)²), FWHM δλ ≈ FSR/ℱ (E. Hecht, Optics, 5th ed., §9.6.1).
 */

/** Diffraction angle β (rad) from the grating equation, or NaN if order m does not propagate. */
export function gratingDiffractionAngle(lambda: number, grooveSpacing: number, order: number, incidence: number): number {
  const s = (order * lambda) / grooveSpacing - Math.sin(incidence);
  return Math.abs(s) <= 1 ? Math.asin(s) : NaN;
}

/** Highest propagating positive order at this incidence: floor(d(1 + sin α)/λ). */
export function gratingMaxOrder(lambda: number, grooveSpacing: number, incidence: number): number {
  return Math.floor((grooveSpacing * (1 + Math.sin(incidence))) / lambda);
}

/** Angular dispersion dβ/dλ = m/(d cos β), rad/m. */
export function gratingAngularDispersion(grooveSpacing: number, order: number, beta: number): number {
  return order / (grooveSpacing * Math.cos(beta));
}

/** Slit-limited bandpass δλ = w d cos β/(m f), m. */
export function gratingSlitBandpass(
  slitWidth: number, grooveSpacing: number, order: number, beta: number, focalLength: number,
): number {
  return (slitWidth * grooveSpacing * Math.cos(beta)) / (order * focalLength);
}

/** Diffraction-limited δλ = λ/(mN) with N = W/d grooves illuminated, m. */
export function gratingDiffractionLimit(lambda: number, order: number, illuminatedWidth: number, grooveSpacing: number): number {
  return lambda / (order * (illuminatedWidth / grooveSpacing));
}

/** Slit-limited bandpass of any disperser, δλ = w/(f dθ/dλ), m. */
export function slitBandpass(slitWidth: number, focalLength: number, angularDispersion: number): number {
  return slitWidth / (focalLength * angularDispersion);
}

/** Diffraction-limited δλ = λ/(D dθ/dλ) for an emerging beam of width D, m. */
export function diffractionLimit(lambda: number, beamWidth: number, angularDispersion: number): number {
  return lambda / (beamWidth * angularDispersion);
}

/** Fabry-Pérot resolution δλ = FSR/ℱ, m. */
export function fabryPerotResolution(fsr: number, finesse: number): number {
  return fsr / finesse;
}

/** Fabry-Pérot (Airy) transmission at a detuning Δλ from a transmission peak, lossless mirrors. */
export function airyTransmission(detuning: number, fsr: number, finesse: number): number {
  const s = Math.sin((Math.PI * detuning) / fsr);
  return 1 / (1 + ((2 * finesse) / Math.PI) ** 2 * s * s);
}
