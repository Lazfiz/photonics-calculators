/**
 * Steady-state stimulated Raman gain of Raman crystals and fused silica: the Stokes wavelength, the peak gain at a pump
 * wavelength, the Lorentzian gain line, its dephasing time and the single-pass small-signal gain.
 * Model tier: textbook (steady state, i.e. pulses much longer than the dephasing time T₂; undepleted plane-wave pump;
 * homogeneous Lorentzian line; gains for pump and Stokes polarized along the measured axis).
 * SI units: λ in m, Raman shifts and linewidths as wavenumbers in 1/m (1 cm⁻¹ = 100 m⁻¹), gains in m/W
 * (1 cm/GW = 1e-11 m/W), intensities in W/m², lengths in m, times in s.
 *
 * - Stokes wavelength 1/λ_s = 1/λ_p − Ω̃: `stokesWavelength` in imaging/coherent-raman.ts.
 * - Raman frequency and FWHM linewidth of diamond, Ba(NO₃)₂ and KGd(WO₄)₂: T. T. Basiev, A. A. Sobol, P. G. Zverev,
 *   V. V. Osiko, R. C. Powell, Appl. Opt. 38, 594 (1999), doi:10.1364/AO.38.000594.
 * - Diamond gain at six pump wavelengths, 355–1280 nm, pump along <111>: V. G. Savitski, S. Reilly, A. J. Kemp,
 *   IEEE J. Quantum Electron. 49, 218 (2013), doi:10.1109/JQE.2012.2237505, Table 1. The gain grows linearly with the
 *   pump wavenumber, so between measured points it is interpolated linearly in 1/λ_p.
 * - Ba(NO₃)₂ 11 cm/GW and KGW 3.3 (901 cm⁻¹) and 4.4 cm/GW (768 cm⁻¹) at 1064 nm: EKSMA Optics KGW / Ba(NO₃)₂ data
 *   sheet; Ba(NO₃)₂ 47 cm/GW at 532 nm (steady state): Optogama, Raman crystals white paper (2023).
 * - Fused silica: peak near 13.2 THz (440 cm⁻¹) with g_R ≈ 1e-13 m/W at 1 µm, scaling as 1/λ_p (G. P. Agrawal,
 *   Nonlinear Fiber Optics, 6th ed., 2019; R. H. Stolen, E. P. Ippen, Appl. Phys. Lett. 22, 276 (1973),
 *   doi:10.1063/1.1654637). The glass line is broad and not Lorentzian, so it has no linewidth here.
 * Outside the measured pump range the gain is scaled as 1/λ_p from the nearest measured point, an estimate.
 */

import { c } from "../constants";
import { SILICA_RAMAN_GAIN_1UM, SILICA_RAMAN_SHIFT } from "../fiber-optics/fiber-nonlinear";

export type RamanLineId = "diamond" | "barium-nitrate" | "kgw-901" | "kgw-768" | "fused-silica";

export interface GainPoint {
  /** Pump wavelength, m. */
  lambda: number;
  /** Steady-state peak gain, m/W. */
  g: number;
}

export interface RamanLine {
  name: string;
  /** Raman shift Ω̃, 1/m. */
  shift: number;
  /** FWHM linewidth Δν̃, 1/m; NaN for a broad, non-Lorentzian glass line. */
  fwhm: number;
  /** Measured peak gains, sorted by increasing pump wavelength. */
  gains: GainPoint[];
  source: string;
}

const CM = 100; // 1 cm⁻¹ in 1/m
const CM_PER_GW = 1e-11; // 1 cm/GW in m/W
const at = (lambda_nm: number, g_cmGW: number): GainPoint => ({ lambda: lambda_nm * 1e-9, g: g_cmGW * CM_PER_GW });

export const RAMAN_LINES: Record<RamanLineId, RamanLine> = {
  diamond: {
    name: "Diamond", shift: 1332.9 * CM, fwhm: 2.7 * CM,
    gains: [at(355, 78), at(532, 42), at(670, 41), at(800, 26), at(1064, 17), at(1280, 7.6)],
    source: "Ω̃, Δν̃ Basiev 1999; g Savitski 2013 Table 1",
  },
  "barium-nitrate": {
    name: "Ba(NO₃)₂", shift: 1048.6 * CM, fwhm: 0.4 * CM, gains: [at(532, 47), at(1064, 11)],
    source: "Ω̃, Δν̃ Basiev 1999; g Optogama 2023 (532 nm), EKSMA (1064 nm)",
  },
  "kgw-901": {
    name: "KGW 901 cm⁻¹", shift: 901 * CM, fwhm: 5.4 * CM, gains: [at(1064, 3.3)],
    source: "Ω̃, Δν̃ Basiev 1999; g EKSMA",
  },
  "kgw-768": {
    name: "KGW 768 cm⁻¹", shift: 768 * CM, fwhm: 6.4 * CM, gains: [at(1064, 4.4)],
    source: "Ω̃, Δν̃ Basiev 1999; g EKSMA",
  },
  "fused-silica": {
    name: "Fused silica", shift: SILICA_RAMAN_SHIFT / c, fwhm: NaN, gains: [{ lambda: 1e-6, g: SILICA_RAMAN_GAIN_1UM }],
    source: "Agrawal, Nonlinear Fiber Optics",
  },
};

export type GainBasis = "measured" | "interpolated" | "scaled";

/** Relative tolerance on λ_p for calling a gain "measured". */
const SAME_LAMBDA = 1e-3;

/**
 * Peak gain at pump wavelength λ_p from the measured points: the point itself, linear interpolation in 1/λ_p between
 * neighbours, or 1/λ_p scaling from the nearest end point outside their range.
 */
export function ramanGainAtPump(line: RamanLine, lambdaPump: number): { g: number; basis: GainBasis } {
  const pts = line.gains;
  if (!(Number.isFinite(lambdaPump) && lambdaPump > 0) || pts.length === 0) return { g: NaN, basis: "scaled" };
  const hit = pts.find((p) => Math.abs(p.lambda - lambdaPump) <= SAME_LAMBDA * p.lambda);
  if (hit) return { g: hit.g, basis: "measured" };
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (lambdaPump < first.lambda) return { g: (first.g * first.lambda) / lambdaPump, basis: "scaled" };
  if (lambdaPump > last.lambda) return { g: (last.g * last.lambda) / lambdaPump, basis: "scaled" };
  const i = pts.findIndex((p) => p.lambda > lambdaPump);
  const a = pts[i - 1];
  const b = pts[i];
  const t = (1 / lambdaPump - 1 / a.lambda) / (1 / b.lambda - 1 / a.lambda);
  return { g: a.g + t * (b.g - a.g), basis: "interpolated" };
}

/** Lorentzian gain line g_peak/(1 + (2(Ω̃ − Ω̃₀)/Δν̃)²) at Raman shift Ω̃. NaN without a linewidth. */
export function lorentzianGain(gPeak: number, shift: number, centre: number, fwhm: number): number {
  if (!(fwhm > 0)) return NaN;
  const u = (2 * (shift - centre)) / fwhm;
  return gPeak / (1 + u * u);
}

/** Dephasing time T₂ = 1/(π c Δν̃) of a Lorentzian line of FWHM Δν̃ (1/m), s. */
export function dephasingTime(fwhm: number): number {
  return fwhm > 0 ? 1 / (Math.PI * c * fwhm) : NaN;
}

/** Small-signal single-pass gain exponent G = g I L: the Stokes wave grows by e^G. */
export function ramanGainExponent(g: number, intensity: number, length: number): number {
  return g >= 0 && intensity >= 0 && length >= 0 ? g * intensity * length : NaN;
}
