/**
 * Mean irradiance of a collimated round beam before and after an ideal (lossless) beam expander of magnification
 * M = D_out/D_in. SI units: power in W, diameters in m, irradiance in W/m².
 * Model tier: exact geometry, E = 4P/(πd²) over the beam's circular cross-section of diameter d.
 *
 * Source: area of a circle, A = πd²/4; the telescope magnifies the beam diameter by M and so its area by M², so the
 * irradiance falls by M² and (Lagrange invariant, D·θ = const) the divergence by M.
 * - For a Gaussian beam with 1/e irradiance diameter d (the ANSI Z136.1 / IEC 60825-1 beam diameter, which holds 63 %
 *   of the power), 4P/(πd²) is the peak irradiance: I₀ = 2P/(πw²) with the 1/e² radius w = d/√2
 *   (Saleh & Teich, Fundamentals of Photonics, ch. 3.1). With the 1/e² diameter D the peak is 8P/(πD²), twice this.
 * - The irradiance at the expander is the one here; far away the beam is also smaller than it would be without it
 *   (divergence θ/M), so the distance at which it drops to a given limit grows about M-fold.
 *
 * Not modelled: Gaussian-beam propagation (a diffraction-limited beam that is expanded and re-focused), clipping,
 * losses at the optics, non-Gaussian profiles.
 */

export interface BeamExpansion {
  /** Beam diameter after the expander, m. */
  readonly outputDiameter: number;
  /** Mean irradiance 4P/(πd²) of the input beam, W/m². */
  readonly meanIrradianceIn: number;
  /** Mean irradiance of the expanded beam, W/m². */
  readonly meanIrradianceOut: number;
  /** Factor by which the irradiance falls, M². */
  readonly reduction: number;
  /** Factor by which the divergence is multiplied, 1/M. */
  readonly divergenceFactor: number;
}

const INVALID: BeamExpansion = {
  outputDiameter: NaN, meanIrradianceIn: NaN, meanIrradianceOut: NaN, reduction: NaN, divergenceFactor: NaN,
};

/**
 * Beam of power P (W) and diameter d (m) through an expander of magnification M.
 * NaN for d ≤ 0, M ≤ 0, P < 0 or any non-finite input.
 */
export function expandBeam(power: number, diameter: number, magnification: number): BeamExpansion {
  if (!(Number.isFinite(power) && Number.isFinite(diameter) && Number.isFinite(magnification))) return INVALID;
  if (!(power >= 0 && diameter > 0 && magnification > 0)) return INVALID;
  const outputDiameter = diameter * magnification;
  return {
    outputDiameter,
    meanIrradianceIn: (4 * power) / (Math.PI * diameter * diameter),
    meanIrradianceOut: (4 * power) / (Math.PI * outputDiameter * outputDiameter),
    reduction: magnification * magnification,
    divergenceFactor: 1 / magnification,
  };
}
