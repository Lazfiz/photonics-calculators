/**
 * Laser-induced damage threshold (LIDT) of an optic for pulses: the rated fluence scaled to another pulse duration,
 * and the peak fluence of a Gaussian beam to compare with it. SI units: fluence in J/m², energy in J, durations in s,
 * radii in m.
 *
 *   F_th(τ) = F_ref (τ/τ_ref)^a,  a = 1/2         thermal (heat-diffusion) scaling, valid for τ ≳ 20 ps
 *   F_peak = 2E/(πw²)                              peak of a TEM₀₀ beam, w the 1/e² intensity radius
 * Model tier: textbook. The √τ law is empirical: B. C. Stuart et al., Phys. Rev. B 53, 1749 (1996),
 * doi:10.1103/PhysRevB.53.1749, find it for fused silica and CaF₂ above about 20 ps and a weaker dependence for shorter
 * pulses (avalanche and multiphoton ionisation); R. M. Wood, Laser-Induced Damage of Optical Materials, IOP 2003,
 * doi:10.1201/9781420034059, covers the scaling and its scatter. The ISO 21254-1:2011 effective area of a Gaussian
 * beam is πw²/2, so its peak fluence is 2E/(πw²), twice the mean over πw². Not modelled: wavelength, spot-size and
 * repetition-rate dependence, and the statistics of defect-driven damage.
 */

/** LIDT scaled from (τ_ref, F_ref) to τ with exponent a; NaN unless the fluence and durations are positive. */
export function scaleDamageThreshold(fRef: number, tauRef: number, tau: number, exponent = 0.5): number {
  if (!(fRef > 0 && tauRef > 0 && tau > 0 && Number.isFinite(exponent))) return NaN;
  return fRef * (tau / tauRef) ** exponent;
}

/** Peak fluence 2E/(πw²) of a Gaussian beam with 1/e² radius w, J/m². */
export function gaussianPeakFluence(energy: number, w: number): number {
  if (!(energy >= 0 && w > 0)) return NaN;
  return (2 * energy) / (Math.PI * w * w);
}

/** Pulse energy whose Gaussian peak fluence equals F, πw²F/2, J. */
export function energyAtFluence(fluence: number, w: number): number {
  if (!(fluence >= 0 && w > 0)) return NaN;
  return (Math.PI * w * w * fluence) / 2;
}

/** Below this pulse duration the √τ scaling no longer holds (Stuart et al. 1996), s. */
export const THERMAL_SCALING_MIN_TAU = 20e-12;
