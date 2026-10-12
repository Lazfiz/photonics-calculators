/**
 * Sagnac interferometers in fibre: the interferometric fibre-optic gyroscope (I-FOG) and the fibre loop mirror.
 * SI units: lengths and wavelengths in m, rates in rad/s, powers in W.
 * Model tier: textbook (ideal reciprocal I-FOG at the ±π/2 bias point, shot-noise limit; lossless or uniformly lossy
 * 2×2 coupler; maximum-contrast birefringent loop).
 *
 * Sources:
 * - Sagnac phase Δφ = 2πLDΩ/(λc) for a coil of fibre length L wound on diameter D. It doesn't depend on the fibre
 *   index (H. J. Arditty, H. C. Lefèvre, Opt. Lett. 6, 401 (1981), doi:10.1364/OL.6.000401). Transit time n_g·L/c
 *   and proper frequency f_p = c/(2n_g·L) (H. C. Lefèvre, The Fiber-Optic Gyroscope, 2nd ed., Artech House 2014,
 *   §2.1, §3.2).
 * - Photon-noise limit at the ±π/2 bias point: σ_φ = √(2hν/(η·P_d)) rad/√Hz in a 1 Hz (one-sided) bandwidth, P_d the
 *   mean detected power (Lefèvre §3.1). Counting photons over τ gives the same: σ_φ(τ) = 1/√n = √(hν/(η·P_d·τ)).
 * - Angle random walk N is defined by the Allan variance σ²(τ) = N²/τ, i.e. N² is the two-sided rate PSD (IEEE Std
 *   952-1997, Annex C, doi:10.1109/IEEESTD.1998.86153). From a one-sided ASD: N = ASD/√2; in °/√h, (°/h)/√Hz ÷ 60.
 * - Loop mirror with a lossless coupler of power coupling k: R = 4k(1 − k), T = (1 − 2k)² (D. B. Mortimore,
 *   J. Lightwave Technol. 6, 1217 (1988), doi:10.1109/50.4119).
 * - Birefringent loop: when the counter-propagating waves cross a section of birefringence B and length L on opposite
 *   axes, they differ in phase by Δφ = 2πBL/λ and T = (1 − 2k)² + 4k(1 − k) sin²(Δφ/2) for either input polarization.
 *   With k = ½ this is the polarization-independent comb T = sin²(πBL/λ) of X. Fang, R. O. Claus, Opt. Lett. 20, 2146
 *   (1995), doi:10.1364/OL.20.002146.
 */
import { c, h } from "../constants";

/** Earth's sidereal rotation rate, rad/s (IERS Conventions 2010, nominal ω = 7.292115e-5). */
export const EARTH_ROTATION_RATE = 7.292115e-5;
/** rad/s → °/h. */
export const RAD_PER_S_TO_DEG_PER_H = (180 / Math.PI) * 3600;

/** Sagnac scale factor S = Δφ/Ω = 2πLD/(λc), in s (rad of phase per rad/s). NaN outside L, D, λ > 0. */
export function sagnacScaleFactor(fiberLength: number, coilDiameter: number, lambda: number): number {
  return fiberLength > 0 && coilDiameter > 0 && lambda > 0
    ? (2 * Math.PI * fiberLength * coilDiameter) / (lambda * c)
    : NaN;
}

/** Light transit time through the coil, n_g·L/c, s. */
export function transitTime(fiberLength: number, groupIndex: number): number {
  return fiberLength > 0 && groupIndex >= 1 ? (groupIndex * fiberLength) / c : NaN;
}

/** Proper (eigen) frequency of the coil, 1/(2τ), Hz: the usual bias-modulation frequency (Lefèvre §3.2). */
export function properFrequency(fiberLength: number, groupIndex: number): number {
  return 1 / (2 * transitTime(fiberLength, groupIndex));
}

/** Shot-noise phase noise √(2hν/(η·P_d)) at the ±π/2 bias point, rad/√Hz (1 Hz one-sided bandwidth). */
export function shotNoisePhase(detectedPower: number, lambda: number, quantumEfficiency = 1): number {
  return detectedPower > 0 && lambda > 0 && quantumEfficiency > 0 && quantumEfficiency <= 1
    ? Math.sqrt((2 * h * c) / (lambda * quantumEfficiency * detectedPower))
    : NaN;
}

/** Noise-equivalent rotation rate σ_φ/S, (rad/s)/√Hz. */
export function noiseEquivalentRate(phaseNoise: number, scaleFactor: number): number {
  return phaseNoise / scaleFactor;
}

/**
 * Angle random walk N in °/√h (IEEE Std 952 Allan definition) from a one-sided rate ASD in (rad/s)/√Hz:
 * ASD/√2 in (°/h)/√Hz, ÷ 60. Datasheets that divide the one-sided ASD by 60 alone quote √2 more.
 */
export function angleRandomWalkDegPerRootHour(rateNoise: number): number {
  return (rateNoise * RAD_PER_S_TO_DEG_PER_H) / (60 * Math.SQRT2);
}

/** Fibre-loop-mirror reflectance 4k(1 − k)·τ for an isotropic loop; τ is the lumped power transmission (coupler, loop). */
export function loopMirrorReflectance(k: number, transmission = 1): number {
  return k >= 0 && k <= 1 && transmission >= 0 && transmission <= 1 ? 4 * k * (1 - k) * transmission : NaN;
}

/**
 * Fibre-loop-mirror transmittance τ·[(1 − 2k)² + 4k(1 − k) sin²(Δφ/2)], Δφ the phase between the counter-propagating
 * waves (0 for an isotropic loop). R = τ − T.
 */
export function loopMirrorTransmittance(k: number, deltaPhi = 0, transmission = 1): number {
  if (!(k >= 0 && k <= 1 && transmission >= 0 && transmission <= 1)) return NaN;
  const s = Math.sin(deltaPhi / 2);
  return transmission * ((1 - 2 * k) ** 2 + 4 * k * (1 - k) * s * s);
}

/** Phase 2πBL/λ between waves that cross a birefringent section (B, length L) on opposite axes. */
export function birefringentPhase(birefringence: number, length: number, lambda: number): number {
  return lambda > 0 ? (2 * Math.PI * birefringence * length) / lambda : NaN;
}

/** Comb period λ²/(B·L) of a birefringent loop mirror, m (phase birefringence, no birefringence dispersion). */
export function loopCombPeriod(birefringence: number, length: number, lambda: number): number {
  return birefringence > 0 && length > 0 ? (lambda * lambda) / (birefringence * length) : NaN;
}
