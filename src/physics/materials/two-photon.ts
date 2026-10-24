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
 *
 * Wide-gap solids: R. DeSalvo, A. A. Said, D. J. Hagan, E. W. Van Stryland, M. Sheik-Bahae, IEEE J. Quantum Electron.
 * 32, 1324 (1996), doi:10.1109/3.511545, Table I: β at 532, 355 and 266 nm (Z-scan, picosecond pulses) with the
 * effective direct gap E′_g they fit to the two-band model, and n from Table II. They find the two-band dispersion
 * diverges near the 2PA edge, so F₂ scaling of these rows away from the measured wavelength is order-of-magnitude
 * (BBO: 0.9 cm/GW at 266 nm scales to 0.076 at 355 nm, measured 0.010). Their E′_g lies above the linear absorption edge
 * E_g of Table I (KTP 3.8, LiNbO₃ 3.9 eV), so one-photon absorption is taken to start at min(E_g, E′_g).
 *
 * Indirect-gap silicon: A. D. Bristow, N. Rotenberg, H. M. van Driel, Appl. Phys. Lett. 90, 191104 (2007),
 * doi:10.1063/1.2737359: β = Σₙ β⁽ⁿ⁾, β⁽ⁿ⁾ = 2C F₂⁽ⁿ⁾(ħω/E_gi) for allowed-allowed, allowed-forbidden and
 * forbidden-forbidden phonon-assisted transitions (n = 0, 1, 2; Garcia & Kalyanaraman 2006),
 * F₂⁽ⁿ⁾(x) = [π(2n + 1)!!/(2ⁿ⁺²(n + 2)!)] (2x)⁻⁵ (2x − 1)ⁿ⁺², phonon energies ≪ E_gi = 1.12 eV; their fit to
 * 850–2200 nm gives C = 43 cm/GW (measured β = 2.1 ± 0.4 cm/GW at 1220 nm).
 */

import { c, h, q } from "../constants";

export type TpaMediumId = "gaas" | "cdte" | "cdse" | "znte" | "znse" | "cds" | "zno"
  | "silicon" | "fused-silica" | "sapphire" | "baf2" | "bbo" | "linbo3" | "ktp";

export interface TpaMedium {
  name: string;
  /** Linear index at `lambda`; null where the source gives none (only Eq. 1 uses it). */
  n: number | null;
  /** Band gap, eV: direct (Van Stryland), effective direct E′_g (DeSalvo) or indirect (silicon). */
  bandGap_eV: number;
  /**
   * "direct": β scales by F₂(2ħω/E_g); "effective": the same with DeSalvo's fitted E′_g (order-of-magnitude away from
   * the measured wavelength); "indirect": Bristow's phonon-assisted fit.
   */
  gap: "direct" | "effective" | "indirect";
  /** Linear absorption edge where it differs from `bandGap_eV` (DeSalvo Table I E_g), eV; else null. */
  absorptionEdge_eV: number | null;
  /** Kane energy E_p, eV, for the Eq. 1 prediction; null where it is not given. */
  Ep_eV: number | null;
  /** Measured 2PA coefficient, m/W. */
  beta: number;
  /** Wavelength of the measurement, m. */
  lambda: number;
  source: string;
}

/** Fitted scaling constant K of Eq. 1, cm/GW · eV^(5/2). */
export const TPA_SCALING_K = 3100;
const CM_PER_GW = 1e-11; // 1 cm/GW in m/W

const row = (name: string, lambda_um: number, n: number, bandGap_eV: number, Ep_eV: number, beta_cmGW: number): TpaMedium => ({
  name, n, bandGap_eV, gap: "direct", absorptionEdge_eV: null, Ep_eV, beta: beta_cmGW * CM_PER_GW, lambda: lambda_um === 1.06 ? 1064e-9 : 532e-9,
  source: "Van Stryland et al. 1985, Table 1",
});
const desalvo = (name: string, lambda_nm: number, n: number, edge_eV: number, effectiveGap_eV: number, beta_cmGW: number): TpaMedium => ({
  name, n, bandGap_eV: effectiveGap_eV, gap: "effective", absorptionEdge_eV: edge_eV, Ep_eV: null, beta: beta_cmGW * CM_PER_GW, lambda: lambda_nm * 1e-9,
  source: "DeSalvo et al. 1996, Tables I–II; E_g is their effective direct gap E′_g",
});

/** Silicon indirect gap E_gi, eV, and Bristow's fitted constant C, cm/GW. */
export const SI_INDIRECT_GAP_EV = 1.12;
export const SI_INDIRECT_C = 43;
/** Shortest wavelength of Bristow's measurements (and of the fit's use here), m. */
export const SI_FIT_MIN_LAMBDA = 850e-9;

/** Van Stryland et al. 1985, Table 1 (single crystals; the 1.06 µm rows at 1064 nm, the 0.53 µm rows at 532 nm). */
export const TPA_MEDIA: Record<TpaMediumId, TpaMedium> = {
  gaas: row("GaAs", 1.06, 3.43, 1.42, 25.7, 23),
  cdte: row("CdTe", 1.06, 2.84, 1.44, 20.7, 22),
  cdse: row("CdSe", 1.06, 2.56, 1.74, 21, 18),
  znte: row("ZnTe", 1.06, 2.79, 2.26, 19.1, 4.5),
  znse: row("ZnSe", 0.53, 2.70, 2.67, 24.2, 5.5),
  cds: row("CdS", 0.53, 2.60, 2.42, 21, 5.5),
  zno: row("ZnO", 0.53, 2.05, 3.20, 21, 5.0),
  silicon: {
    name: "Silicon (indirect)", n: null, bandGap_eV: SI_INDIRECT_GAP_EV, gap: "indirect", absorptionEdge_eV: null, Ep_eV: null, beta: 2.1 * CM_PER_GW,
    lambda: 1220e-9, source: "Bristow et al. 2007: measured at 1220 nm, fit C = 43 cm/GW",
  },
  "fused-silica": desalvo("Fused silica", 266, 1.5, 7.8, 9.0, 0.05),
  sapphire: desalvo("Sapphire", 266, 1.82, 7.3, 8.7, 0.09),
  baf2: desalvo("BaF₂", 266, 1.5, 9.2, 9.0, 0.06),
  bbo: desalvo("β-BBO", 266, 1.66, 6.2, 6.8, 0.9),
  linbo3: desalvo("LiNbO₃ (E ∥ c)", 532, 2.23, 3.9, 4.4, 0.38),
  ktp: desalvo("KTP (E ∥ z)", 532, 1.78, 3.8, 4.6, 0.10),
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

/** (2n + 1)!! for n = 0, 1, 2. */
const DOUBLE_FACTORIAL = [1, 3, 15] as const;
const FACTORIAL_N_PLUS_2 = [2, 6, 24] as const;

/** F₂⁽ⁿ⁾(x) = [π(2n + 1)!!/(2ⁿ⁺²(n + 2)!)] (2x)⁻⁵ (2x − 1)ⁿ⁺², x = ħω/E_gi; 0 for 2x ≤ 1 (Bristow et al. 2007). */
export function indirectF2(n: 0 | 1 | 2, x: number): number {
  if (!Number.isFinite(x) || x < 0) return NaN;
  if (2 * x <= 1) return 0;
  return ((Math.PI * DOUBLE_FACTORIAL[n]) / (2 ** (n + 2) * FACTORIAL_N_PLUS_2[n])) * (2 * x) ** -5 * (2 * x - 1) ** (n + 2);
}

/** Indirect-gap 2PA β = Σₙ 2C F₂⁽ⁿ⁾(ħω/E_gi), n = 0, 1, 2, m/W (C in cm/GW; silicon defaults). */
export function indirectBeta(lambda: number, bandGap_eV = SI_INDIRECT_GAP_EV, C_cmGW = SI_INDIRECT_C): number {
  if (!(bandGap_eV > 0) || !(C_cmGW >= 0)) return NaN;
  const x = photonEnergy_eV(lambda) / bandGap_eV;
  const sum = indirectF2(0, x) + indirectF2(1, x) + indirectF2(2, x);
  return 2 * C_cmGW * sum * CM_PER_GW;
}

/**
 * β of a preset at λ, m/W: F₂ scaling from its measurement (direct or effective gap), or Bristow's fit for silicon
 * (NaN below 850 nm, outside the measured range).
 */
export function mediumBeta(m: TpaMedium, lambda: number): number {
  if (m.gap === "indirect") return lambda >= SI_FIT_MIN_LAMBDA ? indirectBeta(lambda, m.bandGap_eV) : NaN;
  if (mediumRegime(m, lambda) === "linear") return NaN;
  return scaledBeta(m.beta, m.lambda, lambda, m.bandGap_eV);
}

/** Photon energy at which one-photon absorption starts: min(E_g, E′_g) for DeSalvo rows, else the band gap, eV. */
export function linearEdge_eV(m: TpaMedium): number {
  return m.absorptionEdge_eV !== null ? Math.min(m.absorptionEdge_eV, m.bandGap_eV) : m.bandGap_eV;
}

export type MediumRegime = TpaRegime | "outside-fit";

/**
 * Regime of a preset at λ. DeSalvo rows: "linear" from ħω ≥ min(E_g, E′_g). Silicon: no 2PA for 2ħω ≤ E_gi, Bristow's
 * fit from 850 nm up (above E_gi phonon-assisted linear absorption adds to it, α = 5e2 cm⁻¹ at 850 nm per Bristow),
 * "outside-fit" below 850 nm.
 */
export function mediumRegime(m: TpaMedium, lambda: number): MediumRegime | null {
  if (m.gap !== "indirect") {
    const regime = tpaRegime(lambda, m.bandGap_eV);
    return regime === "two-photon" && photonEnergy_eV(lambda) >= linearEdge_eV(m) ? "linear" : regime;
  }
  const x = twoPhotonRatio(lambda, m.bandGap_eV);
  if (!Number.isFinite(x)) return null;
  return x <= 1 ? "transparent" : lambda >= SI_FIT_MIN_LAMBDA ? "two-photon" : "outside-fit";
}

/** Plane-wave 2PA transmission of a slab, T = 1/(1 + βI₀L) (no linear absorption or reflection). */
export function tpaTransmission(beta: number, intensity: number, length: number): number {
  if (!(beta >= 0) || !(intensity >= 0) || !(length >= 0)) return NaN;
  return 1 / (1 + beta * intensity * length);
}
