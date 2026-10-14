/**
 * Background light at a free-space optical receiver and the noise it adds. SI units: wavelengths and bandwidths in m,
 * radiance in W m⁻² sr⁻¹ m⁻¹, angles in rad, currents in A.
 *
 * Model tier: textbook. The collected background power is
 *   P_bg = L_λ · A · Ω · Δλ · T_f · η_opt
 * (Giggenbach 2022, eq. 22, with the filter's in-band transmission T_f and the optics' efficiency η_opt added), where
 * Ω = π sin²θ is the projected solid angle of an on-axis cone of half-angle θ (A·Ω is the étendue; for θ ≪ 1 it equals
 * the solid angle 2π(1 − cos θ) to O(θ⁴)). A disc source smaller than the field of view (the Sun) fills only its own Ω.
 * Out-of-band light is assumed fully blocked: the filter passband Δλ sets the collected band.
 *
 * - Sky and cloud radiances: typical values at 850, 1064 and 1550 nm with the Sun far above the horizon, Giggenbach D.
 *   (2022), Free-space optical data receivers with avalanche detectors for satellite downlinks regarding background
 *   light, Sensors 22(18), 6773, Table 1 (https://doi.org/10.3390/s22186773). Interpolated linearly in log L against
 *   log λ between the tabulated wavelengths; NaN outside 850–1550 nm. The table's Moon-disc row is left out: at 850
 *   and 1064 nm it is ≈ 10× the solar irradiance × lunar albedo / π estimate.
 * - Solar disc: blackbody at the IAU 2015 nominal effective temperature T_eff = 5772 K, L_λ = M_λ/π, seen from
 *   1 au with the nominal solar radius R = 6.957e8 m (Prša et al. 2016, AJ 152, 41,
 *   https://doi.org/10.3847/0004-6256/152/2/41). Above the atmosphere, disc-averaged: the real disc is within about
 *   ±20 % (limb darkening, departures from a blackbody), and the atmosphere lowers it at the ground (Giggenbach's
 *   Table 1 gives 0.6× this at 1550 nm). Between the table wavelengths the log-log interpolation ignores the
 *   1.13 and 1.38 µm water-vapour bands, where the sky is much darker.
 * - Receiver noise (PIN, or APD with McIntyre excess noise F = kM + (1 − k)(2 − 1/M)): photocurrent shot noise
 *   2qM²F(I_s + I_bg + I_d)B plus an input-referred amplifier noise i_n²B; SNR = (M I_s)²/σ² (Agrawal G. P., Fiber-Optic
 *   Communication Systems, 4th ed., Wiley 2010, §4.4; McIntyre R. J. (1966), IEEE Trans. Electron Devices 13, 164,
 *   https://doi.org/10.1109/T-ED.1966.15651). I_d is the dark current that is multiplied.
 */
import { planckExitance } from "../blackbody";
import { c, h, q } from "../constants";

/** IAU 2015 nominal solar effective temperature, K. */
export const SUN_TEMPERATURE = 5772;
/** IAU 2015 nominal solar radius, m. */
export const SUN_RADIUS = 6.957e8;
/** Astronomical unit, m (IAU 2012 Resolution B2, exact). */
export const ASTRONOMICAL_UNIT = 1.495978707e11;

/** Projected solid angle π sin²θ of an on-axis cone of half-angle θ ∈ [0, π/2], sr. */
export function projectedSolidAngle(halfAngle: number): number {
  if (!(halfAngle >= 0 && halfAngle <= Math.PI / 2)) return NaN;
  return Math.PI * Math.sin(halfAngle) ** 2;
}

/** Half-angle of the on-axis cone with projected solid angle Ω ∈ [0, π] sr; NaN if no cone is that wide. */
export function halfAngleForSolidAngle(solidAngle: number): number {
  if (!(solidAngle >= 0 && solidAngle <= Math.PI)) return NaN;
  return Math.asin(Math.sqrt(solidAngle / Math.PI));
}

/** Projected solid angle of the solar disc seen from 1 au, ≈ 6.794e-5 sr. */
export const SUN_SOLID_ANGLE = projectedSolidAngle(Math.asin(SUN_RADIUS / ASTRONOMICAL_UNIT));

/** Mean spectral radiance of the solar disc above the atmosphere (5772 K blackbody), W m⁻² sr⁻¹ m⁻¹. */
export function solarDiscRadiance(lambda: number): number {
  return planckExitance(lambda, SUN_TEMPERATURE) / Math.PI;
}

export type SkyScene = "zenith" | "elevation30" | "horizon" | "sunlitCloud" | "overcast";
export type BackgroundScene = SkyScene | "sun";

export const BACKGROUND_SCENES: readonly { id: BackgroundScene; label: string }[] = [
  { id: "horizon", label: "Clear sky near the horizon" },
  { id: "elevation30", label: "Clear sky, 30° elevation" },
  { id: "zenith", label: "Clear sky, zenith" },
  { id: "sunlitCloud", label: "Sunlit cloud" },
  { id: "overcast", label: "Overcast cloud" },
  { id: "sun", label: "Sun disc in the field of view" },
];

/** A scene id from a URL string; the horizon sky for anything unknown. */
export function parseScene(s: string): BackgroundScene {
  return BACKGROUND_SCENES.find((x) => x.id === s)?.id ?? "horizon";
}

/** Wavelengths of Giggenbach (2022) Table 1, m. */
export const SKY_TABLE_WAVELENGTHS = [850e-9, 1064e-9, 1550e-9] as const;

/** Giggenbach (2022) Table 1, W m⁻² sr⁻¹ nm⁻¹ at 850, 1064 and 1550 nm. */
const SKY_TABLE_PER_NM: Record<SkyScene, readonly [number, number, number]> = {
  zenith: [2.0e-3, 2.3e-3, 1.2e-3],
  elevation30: [3.5e-3, 4.0e-3, 2.0e-3],
  horizon: [30e-3, 30e-3, 25e-3],
  sunlitCloud: [200e-3, 80e-3, 20e-3],
  overcast: [20e-3, 8e-3, 2e-3],
};

/** Typical sky or cloud spectral radiance, W m⁻² sr⁻¹ m⁻¹; log-log interpolation, NaN outside 850–1550 nm. */
export function skyRadiance(scene: SkyScene, lambda: number): number {
  const [l0, l1, l2] = SKY_TABLE_WAVELENGTHS;
  // Relative slack so that 850e-9 and 1550e-9 computed from nm inputs stay inside the table.
  if (!(lambda >= l0 * (1 - 1e-12) && lambda <= l2 * (1 + 1e-12))) return NaN;
  const v = SKY_TABLE_PER_NM[scene];
  const [a, b, la, lb] = lambda <= l1 ? [v[0], v[1], l0, l1] : [v[1], v[2], l1, l2];
  const t = Math.log(lambda / la) / Math.log(lb / la);
  return 1e9 * Math.exp(Math.log(a) + t * Math.log(b / a));
}

/** Spectral radiance of a scene, W m⁻² sr⁻¹ m⁻¹. */
export function sceneRadiance(scene: BackgroundScene, lambda: number): number {
  return scene === "sun" ? solarDiscRadiance(lambda) : skyRadiance(scene, lambda);
}

/** Projected solid angle a scene can fill, sr: the solar disc, or Infinity for an extended sky. */
export function sceneSolidAngle(scene: BackgroundScene): number {
  return scene === "sun" ? SUN_SOLID_ANGLE : Infinity;
}

export interface BackgroundInput {
  /** Spectral radiance, W m⁻² sr⁻¹ m⁻¹. */
  radiance: number;
  /** Receiver collecting area, m². */
  area: number;
  /** Field-of-view half-angle, rad. */
  fovHalfAngle: number;
  /** Projected solid angle of the source (Infinity for an extended sky), sr. */
  sourceSolidAngle: number;
  /** Filter passband, m. */
  bandwidth: number;
  /** Filter in-band transmission, 0–1. */
  filterTransmission: number;
  /** Transmission of the other receive optics, 0–1. */
  opticalEfficiency: number;
}

/** Background power reaching the detector, W, and the projected solid angle used, sr. */
export function backgroundPower(p: BackgroundInput): { power: number; solidAngle: number } {
  const fov = projectedSolidAngle(p.fovHalfAngle);
  const ok = p.radiance >= 0 && p.area >= 0 && p.bandwidth >= 0 && p.sourceSolidAngle >= 0
    && p.filterTransmission >= 0 && p.filterTransmission <= 1 && p.opticalEfficiency >= 0 && p.opticalEfficiency <= 1;
  if (!ok || Number.isNaN(fov)) return { power: NaN, solidAngle: NaN };
  const solidAngle = Math.min(fov, p.sourceSolidAngle);
  return { power: p.radiance * p.area * solidAngle * p.bandwidth * p.filterTransmission * p.opticalEfficiency, solidAngle };
}

/**
 * FOV half-angle, rad, at which background shot noise 2qM²F·R·P_bg·B equals the amplifier noise i_n²B, i.e. P_bg =
 * i_n²/(2qM²F·R), for a source of radiance L filling at most `sourceSolidAngle`. NaN if no FOV collects that much.
 */
export function equalNoiseHalfAngle(p: Omit<BackgroundInput, "fovHalfAngle"> & {
  responsivity: number; amplifierNoise: number; gain: number; ionisationRatio: number;
}): number {
  const F = excessNoiseFactor(p.gain, p.ionisationRatio);
  const perSr = p.radiance * p.area * p.bandwidth * p.filterTransmission * p.opticalEfficiency; // W/sr
  if (!(perSr > 0 && p.responsivity > 0 && p.amplifierNoise >= 0) || Number.isNaN(F)) return NaN;
  const omega = p.amplifierNoise ** 2 / (2 * q * p.gain ** 2 * F * p.responsivity) / perSr;
  return omega <= p.sourceSolidAngle ? halfAngleForSolidAngle(omega) : NaN;
}

/** Photon energy hc/λ, J. */
export function photonEnergy(lambda: number): number {
  return lambda > 0 ? (h * c) / lambda : NaN;
}

/** Unity-gain responsivity η q λ/(hc), A/W, for quantum efficiency η ∈ [0, 1]. */
export function responsivity(quantumEfficiency: number, lambda: number): number {
  if (!(quantumEfficiency >= 0 && quantumEfficiency <= 1)) return NaN;
  return (quantumEfficiency * q) / photonEnergy(lambda);
}

/** McIntyre excess noise factor F = kM + (1 − k)(2 − 1/M) for gain M ≥ 1 and ionisation ratio k ∈ [0, 1]. */
export function excessNoiseFactor(gain: number, k: number): number {
  if (!(gain >= 1 && k >= 0 && k <= 1)) return NaN;
  return k * gain + (1 - k) * (2 - 1 / gain);
}

export interface ReceiverNoiseInput {
  /** Primary signal photocurrent (before gain), A. */
  signalCurrent: number;
  /** Primary background photocurrent, A. */
  backgroundCurrent: number;
  /** Primary dark current that is multiplied, A. */
  darkCurrent: number;
  /** Noise bandwidth, Hz. */
  bandwidth: number;
  /** Input-referred amplifier noise current density, A/√Hz. */
  amplifierNoise: number;
  /** Avalanche gain M ≥ 1 (1 for a PIN). */
  gain: number;
  /** Ionisation ratio k (ignored at M = 1). */
  ionisationRatio: number;
}

export interface ReceiverNoise {
  /** Noise variances, A²: signal, background and dark shot noise, and amplifier noise. */
  signalShot: number;
  backgroundShot: number;
  darkShot: number;
  amplifier: number;
  /** Electrical SNR (M I_s)²/σ², linear. */
  snr: number;
}

/** Shot- and amplifier-noise variances and the electrical SNR of a PIN or APD receiver. */
export function receiverNoise(p: ReceiverNoiseInput): ReceiverNoise {
  const F = excessNoiseFactor(p.gain, p.ionisationRatio);
  const ok = p.signalCurrent >= 0 && p.backgroundCurrent >= 0 && p.darkCurrent >= 0 && p.bandwidth > 0 && p.amplifierNoise >= 0;
  if (!ok || Number.isNaN(F)) return { signalShot: NaN, backgroundShot: NaN, darkShot: NaN, amplifier: NaN, snr: NaN };
  const shot = (i: number) => 2 * q * p.gain ** 2 * F * i * p.bandwidth;
  const signalShot = shot(p.signalCurrent);
  const backgroundShot = shot(p.backgroundCurrent);
  const darkShot = shot(p.darkCurrent);
  const amplifier = p.amplifierNoise ** 2 * p.bandwidth;
  const variance = signalShot + backgroundShot + darkShot + amplifier;
  const signal = p.gain * p.signalCurrent;
  // 0/0 (no signal, no noise) is no signal: SNR 0.
  const snr = signal === 0 ? 0 : (signal * signal) / variance;
  return { signalShot, backgroundShot, darkShot, amplifier, snr };
}
