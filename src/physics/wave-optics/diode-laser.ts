/**
 * Fabry–Pérot diode laser below and above threshold: mirror loss, threshold modal gain, threshold carrier density from a
 * logarithmic gain law, threshold current from ABC recombination, differential efficiency, facet split and the
 * Gaussian far field. SI units: lengths in m, gains and losses in 1/m, carrier densities in 1/m³.
 * Model tier: textbook. Uniform carrier density in the active volume (no lateral spreading or leakage current), gain
 * clamped above threshold, Gaussian near field of the guided mode. L. A. Coldren, S. W. Corzine, M. L. Mašanović,
 * Diode Lasers and Photonic Integrated Circuits, 2nd ed. (Wiley, 2012), doi 10.1002/9781118148167, ch. 2 and 4.
 *
 *   α_m = ln(1/(R₁R₂))/(2L)                     mirror loss
 *   Γ g_th = α_i + α_m                           threshold modal gain
 *   g = g₀ ln(N/N_tr)  →  N_th = N_tr e^{g_th/g₀}
 *   I_th = q V (A N_th + B N_th² + C N_th³)/η_i,  V = w d L
 *   η_d = η_i α_m/(α_i + α_m),  dP/dI = η_d h c/(q λ) (both facets)
 *   front-facet share F₂ = (1 − R₂)√R₁/((1 − R₂)√R₁ + (1 − R₁)√R₂)
 */
import { c, h, q } from "../constants";

/** Distributed mirror loss ln(1/(R₁R₂))/(2L), 1/m; NaN outside 0 < R ≤ 1 or L ≤ 0. */
export function mirrorLoss(L: number, R1: number, R2: number): number {
  if (!(L > 0 && R1 > 0 && R1 <= 1 && R2 > 0 && R2 <= 1)) return NaN;
  return Math.log(1 / (R1 * R2)) / (2 * L);
}

/** Threshold modal gain Γg_th = α_i + α_m, 1/m. */
export function thresholdModalGain(alphaI: number, L: number, R1: number, R2: number): number {
  return alphaI >= 0 ? alphaI + mirrorLoss(L, R1, R2) : NaN;
}

/** External differential quantum efficiency η_i α_m/(α_i + α_m) (both facets). */
export function differentialEfficiency(etaI: number, alphaI: number, alphaM: number): number {
  if (!(etaI > 0 && etaI <= 1 && alphaI >= 0 && alphaM >= 0 && alphaI + alphaM > 0)) return NaN;
  return (etaI * alphaM) / (alphaI + alphaM);
}

/**
 * Carrier density N_tr e^{g/g₀} at which the logarithmic gain g₀ ln(N/N_tr) reaches the material gain g, 1/m³.
 * NaN when g/g₀ > 20: far outside the range where the logarithmic fit holds.
 */
export function logGainCarrierDensity(gain: number, g0: number, nTr: number): number {
  if (!(g0 > 0 && nTr > 0 && Number.isFinite(gain)) || gain / g0 > 20) return NaN;
  return nTr * Math.exp(gain / g0);
}

/** Total recombination rate A N + B N² + C N³, 1/(m³ s). */
export function recombinationRate(N: number, A: number, B: number, C: number): number {
  if (!(N >= 0 && A >= 0 && B >= 0 && C >= 0)) return NaN;
  return N * (A + N * (B + N * C));
}

/**
 * Radiative share BN²/(AN + BN² + CN³) of the recombination at carrier density N; NaN when nothing recombines.
 * Tsvid et al. measured 40–54 % of the injected current as spontaneous emission in 0.98 µm InGaAs/GaAs QW lasers
 * (IEEE J. Quantum Electron. 44, 732 (2008), doi 10.1109/JQE.2008.924242); compare η_i times this share with that.
 */
export function radiativeShare(N: number, A: number, B: number, C: number): number {
  const total = recombinationRate(N, A, B, C);
  return total > 0 ? (B * N * N) / total : NaN;
}

/** Threshold current q V R(N_th)/η_i, A, for an active volume V (m³). */
export function thresholdCurrent(volume: number, nTh: number, A: number, B: number, C: number, etaI: number): number {
  if (!(volume > 0 && etaI > 0 && etaI <= 1)) return NaN;
  return (q * volume * recombinationRate(nTh, A, B, C)) / etaI;
}

/** Slope efficiency η_d h c/(q λ), W/A, summed over both facets. */
export function slopeEfficiency(etaD: number, lambda: number): number {
  return etaD >= 0 && lambda > 0 ? (etaD * h * c) / (q * lambda) : NaN;
}

/** Share of the output leaving facet 2: (1 − R₂)√R₁/((1 − R₂)√R₁ + (1 − R₁)√R₂). */
export function facetShare(R1: number, R2: number): number {
  if (!(R1 > 0 && R1 <= 1 && R2 > 0 && R2 <= 1) || (R1 === 1 && R2 === 1)) return NaN;
  const a = (1 - R2) * Math.sqrt(R1);
  return a / (a + (1 - R1) * Math.sqrt(R2));
}

/**
 * Far field of a Gaussian near field of 1/e² intensity radius w: 1/e² half-angle θ₀ = atan(λ/(πw)) and full width at
 * half maximum √(2 ln 2) θ₀ (paraxial; it underestimates the divergence when w approaches λ).
 */
export function gaussianFarField(lambda: number, w: number): { halfAngle: number; fwhm: number } {
  if (!(lambda > 0 && w > 0)) return { halfAngle: NaN, fwhm: NaN };
  const halfAngle = Math.atan(lambda / (Math.PI * w));
  return { halfAngle, fwhm: Math.sqrt(2 * Math.LN2) * halfAngle };
}

/** Longitudinal mode spacing λ²/(2 n_g L), m. */
export function modeSpacing(lambda: number, nGroup: number, L: number): number {
  return lambda > 0 && nGroup > 0 && L > 0 ? (lambda * lambda) / (2 * nGroup * L) : NaN;
}
