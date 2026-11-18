/**
 * Summary of the fibre nonlinear-effects page: SPM, XPM, FWM and the SBS/SRS thresholds of one span. It sits beside
 * fiber-nonlinear.ts (which has the formulas and sources) so that the page and its API schema share the dispatch
 * without adding exports to a module that other pages import. SI in (length m, area m², attenuation dB/km, n₂ m²/W,
 * wavelength m, D s/m², S s/m³, frequencies Hz); powers in dBm. Model tier: textbook approximation, as fiber-nonlinear.ts.
 */
import { beta2FromD, beta3FromDS } from "./chromatic-dispersion";
import {
  SBS_POLARIZATION_FACTOR, SILICA_BRILLOUIN_GAIN, SRS_POLARIZATION_FACTOR, alphaFromDbPerKm, effectiveLength, fwmEfficiency,
  fwmPhaseMismatch, fwmProductRatio, nonlinearCoefficient, nonlinearPhase, ramanGainAt, sbsThreshold, spmRmsBroadening,
  srsThreshold, xpmPhaseMax,
} from "./fiber-nonlinear";

/** Polarization factors K (threshold × K) for SBS and SRS; sources in fiber-nonlinear.ts. */
export const NONLINEAR_POLARIZATIONS = {
  copolarized: { sbs: SBS_POLARIZATION_FACTOR.copolarized, srs: SRS_POLARIZATION_FACTOR.copolarized },
  standard: { sbs: SBS_POLARIZATION_FACTOR.randomBirefringence, srs: SRS_POLARIZATION_FACTOR.standard },
  scrambled: { sbs: SBS_POLARIZATION_FACTOR.scrambled, srs: SRS_POLARIZATION_FACTOR.standard },
} as const;
export type NonlinearPolarization = keyof typeof NONLINEAR_POLARIZATIONS;

/** 10·log10(x), or null when that is not a finite number. */
export const toDb = (x: number) => {
  const v = 10 * Math.log10(x);
  return Number.isFinite(v) ? v : null;
};

export interface NonlinearSummaryInput {
  powerDbm: number;
  length: number;
  effectiveArea: number;
  alphaDbPerKm: number;
  n2: number;
  wavelength: number;
  /** D in s/m² (1 ps/(nm·km) = 1e-6). */
  dispersion: number;
  /** S in s/m³ (1 ps/(nm²·km) = 1e3). */
  slope: number;
  numChannels: number;
  spacing: number;
  polarization: NonlinearPolarization;
  sourceLinewidth: number;
  brillouinLinewidth: number;
}

export interface NonlinearSummary {
  P: number; L: number; Aeff: number; a: number; N: number; df: number;
  gamma: number; Leff: number; phiSPM: number; phiXPM: number; broadening: number;
  /** FWM efficiency of the nearest product (larger of the two), and the degenerate-product / channel power ratio. */
  eta: number; fwmRatio: number;
  sbsDbm: number; srsDbm: number;
  /** Degenerate-product / channel power ratio at another channel spacing (Hz). */
  fwmRatioAt: (spacing: number) => number;
}

export function nonlinearSummary(i: NonlinearSummaryInput): NonlinearSummary {
  const pol = NONLINEAR_POLARIZATIONS[i.polarization];
  const P = 10 ** (i.powerDbm / 10) * 1e-3; // W
  const L = Math.max(i.length, 1);
  const Aeff = Math.max(i.effectiveArea, 1e-12);
  const a = alphaFromDbPerKm(Math.max(i.alphaDbPerKm, 0));
  const lambda = Math.max(i.wavelength, 1e-9);
  const N = Math.max(1, Math.round(i.numChannels));
  const df = Math.max(i.spacing, 0.1e9);

  const gamma = nonlinearCoefficient(Math.max(i.n2, 0), lambda, Aeff);
  const Leff = effectiveLength(a, L);
  const phiSPM = nonlinearPhase(gamma, P, Leff);
  const phiXPM = xpmPhaseMax(gamma, P, Leff, N - 1);

  // Nearest degenerate FWM products 2f₁ − f₂ and 2f₂ − f₁ (Δf_ik = Δf_jk = ∓Δf about f_k); β₃ makes them differ,
  // so take the larger efficiency. β₂, β₃ from D and S at λ.
  const beta2 = beta2FromD(i.dispersion, lambda);
  const beta3 = beta3FromDS(i.dispersion, i.slope, lambda);
  const etaAt = (spacing: number) => Math.max(
    fwmEfficiency(a, L, fwmPhaseMismatch(beta2, spacing, spacing, beta3)),
    fwmEfficiency(a, L, fwmPhaseMismatch(beta2, -spacing, -spacing, beta3)),
  );
  const fwmRatioAt = (spacing: number) => fwmProductRatio(etaAt(spacing), phiSPM, true);

  // Polarization factor K and a Lorentzian source linewidth (SBS only; the 13 THz Raman band is far wider).
  const sbs = sbsThreshold({
    Aeff, gB: SILICA_BRILLOUIN_GAIN, Leff, K: pol.sbs,
    sourceLinewidth: Math.max(i.sourceLinewidth, 0), brillouinLinewidth: Math.max(i.brillouinLinewidth, 1e6),
  });
  const srs = srsThreshold(Aeff, ramanGainAt(lambda), Leff, pol.srs);

  return {
    P, L, Aeff, a, N, df, gamma, Leff, phiSPM, phiXPM, broadening: spmRmsBroadening(phiSPM),
    eta: etaAt(df), fwmRatio: fwmRatioAt(df),
    sbsDbm: 10 * Math.log10(sbs * 1e3), srsDbm: 10 * Math.log10(srs * 1e3),
    fwmRatioAt,
  };
}
