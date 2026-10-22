/**
 * Degenerate two-photon absorption (2PA) of direct-gap semiconductors: measured coefficients β, their band-gap scaling
 * to other wavelengths, and the transmission of a plane wave through a slab.
 * Model tier: textbook (two parabolic bands; plane-wave, single-beam 2PA with dI/dz = −βI²; no linear absorption,
 * free-carrier absorption or spatial and temporal pulse averaging).
 * SI units: λ in m, β in m/W (1 cm/GW = 1e-11 m/W), intensities in W/m², lengths in m; band gaps in eV (`_eV`).
 *
 * E. W. Van Stryland, M. A. Woodall, H. Vanherzeele, M. J. Soileau, Opt. Lett. 10, 490 (1985),
 * doi:10.1364/OL.10.000490:
 *   β = K √E_p F₂(2ħω/E_g) / (n² E_g³),   F₂(x) = (x − 1)^(3/2) / x⁵   (Eq. 1–2),
 * K = 3100 with E_p, E_g in eV and β in cm/GW, E_p ≈ 21 eV for most semiconductors; Table 1 lists n, E_g, E_p and the
 * measured β at 1.06 and 0.53 µm (picosecond pulses, error ≈ ±40% absolute, ±25% relative). 2PA needs
 * E_g/2 < ħω < E_g; below E_g/2 F₂ = 0, above E_g linear absorption takes over. M. Sheik-Bahae, D. J. Hagan,
 * E. W. Van Stryland, Phys. Rev. Lett. 65, 96 (1990), doi:10.1103/PhysRevLett.65.96, build the Kerr-index dispersion
 * on the same two-band 2PA scaling.
 * `scaledBeta` moves a measured β to another wavelength by the ratio of F₂, so K, E_p and n cancel (n taken constant).
 * Plane-wave slab transmission without linear loss: T = 1/(1 + βI₀L).
 */

import { c, h, q } from "../constants";

export type TpaMediumId = "gaas" | "cdte" | "cdse" | "znte" | "znse" | "cds" | "zno";

export interface TpaMedium {
  name: string;
  /** Linear index at `lambda`. */
  n: number;
  /** Direct band gap, eV. */
  bandGap_eV: number;
  /** Kane energy E_p, eV. */
  Ep_eV: number;
  /** Measured 2PA coefficient, m/W. */
  beta: number;
  /** Wavelength of the measurement, m. */
  lambda: number;
}

/** Fitted scaling constant K of Eq. 1, cm/GW · eV^(5/2). */
export const TPA_SCALING_K = 3100;
const CM_PER_GW = 1e-11; // 1 cm/GW in m/W

const row = (name: string, lambda_um: number, n: number, bandGap_eV: number, Ep_eV: number, beta_cmGW: number): TpaMedium => ({
  name, n, bandGap_eV, Ep_eV, beta: beta_cmGW * CM_PER_GW, lambda: lambda_um === 1.06 ? 1064e-9 : 532e-9,
});

/** Van Stryland et al. 1985, Table 1 (single crystals; the 1.06 µm rows at 1064 nm, the 0.53 µm rows at 532 nm). */
export const TPA_MEDIA: Record<TpaMediumId, TpaMedium> = {
  gaas: row("GaAs", 1.06, 3.43, 1.42, 25.7, 23),
  cdte: row("CdTe", 1.06, 2.84, 1.44, 20.7, 22),
  cdse: row("CdSe", 1.06, 2.56, 1.74, 21, 18),
  znte: row("ZnTe", 1.06, 2.79, 2.26, 19.1, 4.5),
  znse: row("ZnSe", 0.53, 2.70, 2.67, 24.2, 5.5),
  cds: row("CdS", 0.53, 2.60, 2.42, 21, 5.5),
  zno: row("ZnO", 0.53, 2.05, 3.20, 21, 5.0),
};

/** Photon energy ħω in eV at wavelength λ (m). */
export function photonEnergy_eV(lambda: number): number {
  return lambda > 0 ? (h * c) / (lambda * q) : NaN;
}

/** x = 2ħω/E_g. */
export function twoPhotonRatio(lambda: number, bandGap_eV: number): number {
  return bandGap_eV > 0 ? (2 * photonEnergy_eV(lambda)) / bandGap_eV : NaN;
}

export type TpaRegime = "transparent" | "two-photon" | "linear";

/** Below E_g/2 no 2PA, between E_g/2 and E_g 2PA, above E_g linear (one-photon) absorption. */
export function tpaRegime(lambda: number, bandGap_eV: number): TpaRegime | null {
  const x = twoPhotonRatio(lambda, bandGap_eV);
  if (!Number.isFinite(x)) return null;
  return x <= 1 ? "transparent" : x < 2 ? "two-photon" : "linear";
}

/** F₂(x) = (x − 1)^(3/2)/x⁵ for 1 < x < 2, 0 for x ≤ 1, NaN at or above the gap (x ≥ 2). */
export function tpaF2(x: number): number {
  if (!Number.isFinite(x) || x < 0) return NaN;
  if (x <= 1) return 0;
  if (x >= 2) return NaN;
  return (x - 1) ** 1.5 / x ** 5;
}

/** Eq. 1 prediction β = K√E_p F₂(2ħω/E_g)/(n²E_g³), m/W. */
export function scalingBeta(lambda: number, n: number, bandGap_eV: number, Ep_eV: number): number {
  if (!(n > 0) || !(bandGap_eV > 0) || !(Ep_eV > 0)) return NaN;
  const F = tpaF2(twoPhotonRatio(lambda, bandGap_eV));
  return ((TPA_SCALING_K * Math.sqrt(Ep_eV) * F) / (n * n * bandGap_eV ** 3)) * CM_PER_GW;
}

/** β at λ from a measured β_ref at λ_ref by the F₂ ratio (same medium, n taken constant), m/W. */
export function scaledBeta(betaRef: number, lambdaRef: number, lambda: number, bandGap_eV: number): number {
  const Fref = tpaF2(twoPhotonRatio(lambdaRef, bandGap_eV));
  if (!(betaRef >= 0) || !(Fref > 0)) return NaN;
  return (betaRef * tpaF2(twoPhotonRatio(lambda, bandGap_eV))) / Fref;
}

/** Plane-wave 2PA transmission of a slab, T = 1/(1 + βI₀L) (no linear absorption or reflection). */
export function tpaTransmission(beta: number, intensity: number, length: number): number {
  if (!(beta >= 0) || !(intensity >= 0) || !(length >= 0)) return NaN;
  return 1 / (1 + beta * intensity * length);
}
