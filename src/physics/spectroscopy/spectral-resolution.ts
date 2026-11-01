/**
 * Spectral resolution of grating, prism and Fabry-Pérot spectrometers. SI units in and out: wavelengths, slit and
 * beam widths, groove spacings and focal lengths in m, angles in rad, angular dispersion in rad/m. Model tier:
 * textbook approximation (the slit and diffraction limits are computed separately and the resolution is taken as
 * the larger of the two; aberrations and detector pixels are not modelled).
 *
 * Grating equation mλ = d(sin α + sin β), α the incidence and β the diffraction angle from the grating normal,
 * both positive on the same side. Angular dispersion dβ/dλ = m/(d cos β); on a focal plane normal to the
 * diffracted ray, camera focal length f, the reciprocal linear dispersion is d cos β/(m f). The grating widens the
 * beam by the anamorphic magnification r = cos α/cos β, so with equal collimator and camera focal lengths a slit of
 * width w is imaged r·w wide and covers δλ_slit = r w d cos β/(m f) = w d cos α/(m f). Diffraction by the
 * illuminated width W (N = W/d grooves) limits the resolving power to R = λ/δλ = mN (Rayleigh criterion). Order m
 * and order m + 1 overlap unless the band stays below λ_min (m + 1)/m (free spectral range λ_min/m).
 * C. Palmer, E. Loewen, Diffraction Grating Handbook, 6th ed. (Newport, 2005), ch. 2.
 *
 * Blaze: a facet tilted by the blaze angle φ reflects specularly into β = 2φ − α, so order m is blazed at
 * λ_b = d[sin α + sin(2φ − α)]/m, which in Littrow is 2d sin φ/m. Scalar efficiency envelope of a reflective
 * sawtooth with a right-angle apex (R. Casini, P. G. Nelson, J. Opt. Soc. Am. A 31, 2179 (2014),
 * doi:10.1364/JOSAA.31.002179, eqs. 18–25):
 *   I = k sinc²(π d ρ [sin(α − φ) + sin(β − φ)]/λ),   ρ = cos α/cos(α − φ) for α ≥ φ, else cos φ,
 *   k = min(1, ρ(β)/ρ(α)) (shadowing of the exit beam, ρ as above with α → β; 1 when β ≤ α).
 * The envelopes of all propagating orders are normalised to sum to 1 (energy conservation across orders, which
 * Casini & Nelson apply when they compare with vector theory; the paper gives no explicit formula) before the
 * shadowing loss k. Coating reflectance and polarization are not included (fair for λ/d ≲ 0.2, small blaze angles).
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

/** Reciprocal linear dispersion dλ/dx = d cos β/(m f) on a focal plane normal to the diffracted ray, m/m. */
export function gratingReciprocalLinearDispersion(grooveSpacing: number, order: number, beta: number, focalLength: number): number {
  return (grooveSpacing * Math.cos(beta)) / (order * focalLength);
}

/**
 * Reciprocal linear dispersion on a flat detector normal to the central ray β₀: x = f tan(β − β₀), so
 * dλ/dx = d cos β cos²(β − β₀)/(m f), m/m.
 */
export function flatDetectorReciprocalDispersion(
  grooveSpacing: number, order: number, beta: number, beta0: number, focalLength: number,
): number {
  return gratingReciprocalLinearDispersion(grooveSpacing, order, beta, focalLength) * Math.cos(beta - beta0) ** 2;
}

/** Anamorphic magnification r = cos α/cos β (beam width out/in). */
export function anamorphicMagnification(incidence: number, beta: number): number {
  return Math.cos(incidence) / Math.cos(beta);
}

/** Slit-limited bandpass δλ = w d cos α/(m f): the slit image r·w times d cos β/(m f), equal focal lengths, m. */
export function gratingSlitBandpass(
  slitWidth: number, grooveSpacing: number, order: number, incidence: number, focalLength: number,
): number {
  return (slitWidth * grooveSpacing * Math.cos(incidence)) / (order * focalLength);
}

/** Lowest and highest propagating orders, |m λ/d − sin α| ≤ 1 (order 0 always propagates). */
export function gratingOrderRange(lambda: number, grooveSpacing: number, incidence: number): { min: number; max: number } {
  const s = Math.sin(incidence);
  return { min: Math.ceil(((-1 + s) * grooveSpacing) / lambda), max: Math.floor(((1 + s) * grooveSpacing) / lambda) };
}

/** Upper end λ_min (m + 1)/m of the band free of overlap with order m + 1, m. */
export function overlapFreeLimit(lambdaMin: number, order: number): number {
  return (lambdaMin * (order + 1)) / order;
}

/** Blaze angle φ from the catalogue (first-order Littrow) blaze wavelength, sin φ = λ_B/(2d); NaN if λ_B > 2d. */
export function blazeAngleFromLittrow(lambdaBlaze: number, grooveSpacing: number): number {
  const s = lambdaBlaze / (2 * grooveSpacing);
  return s >= 0 && s <= 1 ? Math.asin(s) : NaN;
}

/** Blaze wavelength of order m at incidence α, λ_b = d[sin α + sin(2φ − α)]/m (Casini & Nelson eq. 19), m. */
export function blazeWavelength(grooveSpacing: number, order: number, blazeAngle: number, incidence: number): number {
  return (grooveSpacing * (Math.sin(incidence) + Math.sin(2 * blazeAngle - incidence))) / order;
}

/**
 * Unnormalised scalar envelope sinc²(π d ρ [sin(α − φ) + sin(β − φ)]/λ) of order m (Casini & Nelson eqs. 18, 21),
 * 0 to 1; 0 when the order does not propagate.
 */
export function blazeEnvelope(lambda: number, grooveSpacing: number, order: number, blazeAngle: number, incidence: number): number {
  const beta = gratingDiffractionAngle(lambda, grooveSpacing, order, incidence);
  if (!Number.isFinite(beta)) return 0;
  const rho = facetFraction(incidence, blazeAngle);
  const x = (Math.PI * grooveSpacing * rho * (Math.sin(incidence - blazeAngle) + Math.sin(beta - blazeAngle))) / lambda;
  return Math.abs(x) < 1e-8 ? 1 : (Math.sin(x) / x) ** 2;
}

/** Facet fraction ρ(x) = cos x/cos(x − φ) seen from direction x ≥ φ (the riser shadows the rest), else cos φ (whole facet). */
const facetFraction = (x: number, blazeAngle: number) =>
  x >= blazeAngle ? Math.cos(x) / Math.cos(x - blazeAngle) : Math.cos(blazeAngle);

/**
 * Shadowing factor k = min(1, ρ(β)/ρ(α)) (Casini & Nelson eq. 23): the part of the lit facet ρ(α) that the exit
 * direction still sees, ρ(β). For α, β ≥ φ this is cos β cos(α − φ)/(cos α cos(β − φ)); 1 when β ≤ α.
 */
export function blazeShadowFactor(beta: number, blazeAngle: number, incidence: number): number {
  return Math.min(1, facetFraction(beta, blazeAngle) / facetFraction(incidence, blazeAngle));
}

/**
 * Scalar efficiency of order m: its envelope divided by the sum of the envelopes of all propagating orders
 * (energy conservation across orders, as Casini & Nelson apply in their comparison with vector theory), times the
 * shadowing factor. 0 when the order does not propagate.
 */
export function scalarBlazeEfficiency(
  lambda: number, grooveSpacing: number, order: number, blazeAngle: number, incidence: number,
): number {
  const beta = gratingDiffractionAngle(lambda, grooveSpacing, order, incidence);
  if (!Number.isFinite(beta)) return 0;
  const { min, max } = gratingOrderRange(lambda, grooveSpacing, incidence);
  let total = 0;
  for (let m = min; m <= max; m++) total += blazeEnvelope(lambda, grooveSpacing, m, blazeAngle, incidence);
  const own = blazeEnvelope(lambda, grooveSpacing, order, blazeAngle, incidence);
  return total > 0 ? (blazeShadowFactor(beta, blazeAngle, incidence) * own) / total : 0;
}

/** Littrow angle θ of order m, sin θ = mλ/(2d); NaN beyond the cutoff mλ > 2d. */
export function littrowAngle(lambda: number, grooveSpacing: number, order: number): number {
  const s = (order * lambda) / (2 * grooveSpacing);
  return s <= 1 ? Math.asin(s) : NaN;
}

/** Scalar efficiency in Littrow (α = β = θ at each wavelength); 0 beyond the cutoff. */
export function littrowBlazeEfficiency(lambda: number, grooveSpacing: number, order: number, blazeAngle: number): number {
  const theta = littrowAngle(lambda, grooveSpacing, order);
  return Number.isFinite(theta) ? scalarBlazeEfficiency(lambda, grooveSpacing, order, blazeAngle, theta) : 0;
}

/**
 * Littrow wavelengths where another order m' grazes the grating (Rayleigh anomalies), |m'λ/d − mλ/(2d)| = 1, i.e.
 * λ = d/|m' − m/2|, longest first, down to lambdaMin. In first order, above the first one (2d/3) only orders 0 and 1 propagate.
 */
export function littrowRayleighWavelengths(grooveSpacing: number, order: number, lambdaMin: number): number[] {
  const out: number[] = [];
  for (let k = 1; k < 1000; k++) {
    // |m' − m/2| takes the values (k − ½) for odd m, k for even m. Offsets up to m/2 (orders 0 … m) graze only
    // beyond the cutoff 2d/m, where order m itself has gone.
    const offset = order % 2 === 1 ? k - 0.5 : k;
    if (offset <= order / 2) continue;
    const l = grooveSpacing / offset;
    if (l < lambdaMin) break;
    out.push(l);
  }
  return out;
}

/**
 * Wavelengths at the edges and centre of a flat detector of width W, normal to the central ray, in a
 * spectrometer with deviation angle D_v = α − β fixed: the grating turns to ψ with mλ_c = 2d cos(D_v/2) sin ψ,
 * α = ψ + D_v/2, β₀ = ψ − D_v/2, and the detector edges see β₀ ± atan(W/2f) (Palmer & Loewen ch. 2). λ is NaN
 * where sin α + sin β < 0 (beyond the zero order), and everything is NaN when the centre wavelength cannot be
 * reached with α < 90°.
 */
export function detectorCoverage(
  lambdaCentre: number, grooveSpacing: number, order: number, deviation: number, detectorWidth: number, focalLength: number,
): { incidence: number; beta0: number; lambdaLow: number; lambdaHigh: number } {
  // α = ψ + D_v/2 < 90° needs sin ψ < cos(D_v/2), i.e. mλ_c < 2d cos²(D_v/2) = d(1 + cos D_v).
  const s = (order * lambdaCentre) / (2 * grooveSpacing * Math.cos(deviation / 2));
  if (!(Math.abs(s) < Math.cos(deviation / 2))) return { incidence: NaN, beta0: NaN, lambdaLow: NaN, lambdaHigh: NaN };
  const psi = Math.asin(s);
  const incidence = psi + deviation / 2;
  const beta0 = psi - deviation / 2;
  const at = (x: number) => detectorWavelength(x, grooveSpacing, order, incidence, beta0, focalLength);
  return { incidence, beta0, lambdaLow: at(-detectorWidth / 2), lambdaHigh: at(detectorWidth / 2) };
}

/**
 * Wavelength at position x on a flat detector normal to the central ray β₀ (x positive towards larger β):
 * β = β₀ + atan(x/f), λ = d(sin α + sin β)/m; NaN past grazing or beyond the zero order, m.
 */
export function detectorWavelength(
  x: number, grooveSpacing: number, order: number, incidence: number, beta0: number, focalLength: number,
): number {
  const beta = beta0 + Math.atan(x / focalLength);
  if (Math.abs(beta) >= Math.PI / 2 || Math.abs(incidence) >= Math.PI / 2) return NaN;
  const l = (grooveSpacing * (Math.sin(incidence) + Math.sin(beta))) / order;
  return l > 0 ? l : NaN;
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
