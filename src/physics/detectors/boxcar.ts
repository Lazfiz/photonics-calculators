/**
 * Boxcar (gated) integrator: gate-averaged signal of a Gaussian pulse and the rms noise of the gate average. SI units.
 *
 * Gate average of a Gaussian pulse s(t) = S·exp(−t²/2σ²), σ = FWHM/(2√(2 ln 2)), over a gate of width T centred at t_g:
 * ⟨s⟩ = S·σ·√(π/2)/T·[erf((t_g + T/2)/(σ√2)) − erf((t_g − T/2)/(σ√2))].
 * Input noise: white density e_n behind a single-pole input bandwidth B (noise bandwidth), so variance σ_in² = e_n²·B and
 * autocorrelation σ_in²·exp(−|τ|/τ_c), τ_c = 1/(4B). The variance of its average over T (x = T/τ_c) is
 * σ_g² = σ_in²·(2/x)·[1 + (e^(−x) − 1)/x] → e_n²/(2T) = e_n²·NEB for T ≫ τ_c, with NEB = 1/(2T) the gate's noise
 * bandwidth (rectangular window), and → σ_in² for T ≪ τ_c. N averaged shots reduce the noise by √N.
 * Exact for that model: Var⟨n⟩_T = (2/T)·∫₀^T (1 − u/T)·R(u) du (time-average variance of a stationary process, e.g.
 * A. Papoulis, Probability, Random Variables and Stochastic Processes). Gate NEB: ∫ sinc²(fT) df = 1/(2T).
 */

import { erf } from "../math";

const FWHM_PER_SIGMA = 2 * Math.sqrt(2 * Math.LN2);

/** Gate-averaged value of a Gaussian pulse of peak S and FWHM w, gate width T centred at offset t_g from the peak. */
export function gaussianGateAverage(peak: number, fwhm: number, gateWidth: number, gateOffset: number): number {
  if (!(fwhm > 0) || !(gateWidth > 0) || !Number.isFinite(peak) || !Number.isFinite(gateOffset)) return NaN;
  const sigma = fwhm / FWHM_PER_SIGMA;
  const s2 = sigma * Math.SQRT2;
  const span = erf((gateOffset + gateWidth / 2) / s2) - erf((gateOffset - gateWidth / 2) / s2);
  return (peak * sigma * Math.sqrt(Math.PI / 2) * span) / gateWidth;
}

/** Gate noise-equivalent bandwidth NEB = 1/(2T) (Hz) of a rectangular gate of width T (s). */
export function gateNoiseBandwidth(gateWidth: number): number {
  return gateWidth > 0 ? 1 / (2 * gateWidth) : NaN;
}

/** Rms noise of one gate average for white density e_n (unit/√Hz) behind an input noise bandwidth B (Hz). */
export function gateNoiseRms(noiseDensity: number, inputBandwidth: number, gateWidth: number): number {
  if (!(noiseDensity >= 0) || !(inputBandwidth > 0) || !(gateWidth > 0)) return NaN;
  const x = 4 * inputBandwidth * gateWidth; // T/τ_c
  // 1 + (e^(−x) − 1)/x, with its series x/2 − x²/6 + x³/24 for small x to avoid cancellation
  const bracket = x < 1e-4 ? x / 2 - (x * x) / 6 + (x * x * x) / 24 : 1 + Math.expm1(-x) / x;
  return noiseDensity * Math.sqrt(inputBandwidth * (2 / x) * bracket);
}

/**
 * Gate width T/FWHM that maximises the white-noise SNR of a centred gate, ⟨s⟩·√T ∝ erf(u)/√u with u = T/(2√2σ).
 * The optimum solves erf(u) = (4u/√π)·e^(−u²) (golden-section search on [0.5, 2], 60 steps, |Δu| < 1e-12).
 */
export function optimalGateWidthRatio(): number {
  const f = (u: number) => -erf(u) / Math.sqrt(u);
  let a = 0.5;
  let b = 2;
  const g = (Math.sqrt(5) - 1) / 2;
  for (let i = 0; i < 60; i++) {
    const c = b - g * (b - a);
    const d = a + g * (b - a);
    if (f(c) < f(d)) b = d;
    else a = c;
  }
  const u = (a + b) / 2;
  return (2 * Math.SQRT2 * u) / FWHM_PER_SIGMA;
}
