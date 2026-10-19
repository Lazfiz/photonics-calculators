/**
 * Stray light in a dispersive spectrophotometer and grating order overlap. Dimensionless ratios; wavelengths in m.
 * Model tier: textbook approximation (the stray light is a fixed fraction of the reference signal with a single
 * effective sample transmittance; its spectrum, the slit function and real Rowland/Lyman ghosts are not modelled).
 *
 * Photometric error. The stray radiant power ratio s is the stray power divided by the total power detected in the
 * reference (blank) measurement (ASTM E387, opaque-filter method). In the sample measurement the in-band light is
 * attenuated by T = 10^−A and the stray light by T_s (T_s = 1 when the sample is transparent where the stray light
 * lies, the usual worst case), so
 *   T_m = (1 − s) T + s T_s,   A_m = −log₁₀ T_m,
 *   ΔA = A_m − A = −log₁₀(1 − s + s T_s 10^A)   (evaluated with log1p, accurate for small s).
 * As A → ∞ the reading saturates at A_max = −log₁₀(s T_s). Written with the stray power relative to the in-band
 * reference power, S = P_s/P₀, the same model reads T_m = (T + S T_s)/(1 + S) (Skoog, Holler & Crouch, Principles
 * of Instrumental Analysis, ch. 13, stray radiation); the two agree for s = S/(1 + S). The largest s that keeps
 * |ΔA| ≤ δ at absorbance A solves (1 − s)T + s T_s = T 10^δ: s = T (10^δ − 1)/(T_s − T).
 *
 * Order overlap. At a fixed grating angle, order n of wavelength λ′ leaves along the same direction as order m of λ
 * whenever nλ′ = mλ (grating equation mλ = d(sin α + sin β); C. Palmer, E. Loewen, Diffraction Grating Handbook,
 * 6th ed., Newport 2005, ch. 2). These are not grating ghosts (those come from periodic ruling errors). An
 * order-sorting band-pass filter must block mλ/(m + 1) and, for m ≥ 2, mλ/(m − 1).
 */

const LN10 = Math.LN10;

/** Measured transmittance T_m = (1 − s)T + s T_s; NaN outside 0 ≤ T, T_s ≤ 1, 0 ≤ s < 1. */
export function measuredTransmittance(T: number, s: number, Ts = 1): number {
  if (!(T >= 0 && T <= 1 && Ts >= 0 && Ts <= 1 && s >= 0 && s < 1)) return NaN;
  return (1 - s) * T + s * Ts;
}

/** Absorbance error ΔA = A_m − A = −log₁₀(1 − s + s T_s 10^A) (≤ 0 for T_s ≥ T), AU; NaN for A < 0 or A > 300. */
export function absorbanceError(A: number, s: number, Ts = 1): number {
  if (!(A >= 0 && A <= 300 && Ts >= 0 && Ts <= 1 && s >= 0 && s < 1)) return NaN;
  return 0 - Math.log1p(s * (Ts * 10 ** A - 1)) / LN10; // 0 − x avoids −0 at s = 0
}

/** Measured absorbance A_m = A + ΔA, AU. */
export function measuredAbsorbance(A: number, s: number, Ts = 1): number {
  return A + absorbanceError(A, s, Ts);
}

/** Saturation absorbance A_max = −log₁₀(s T_s) reached as the true absorbance → ∞, AU (∞ when s T_s = 0). */
export function apparentAbsorbanceLimit(s: number, Ts = 1): number {
  if (!(s >= 0 && s < 1 && Ts >= 0 && Ts <= 1)) return NaN;
  return -Math.log10(s * Ts);
}

/** Largest stray ratio with |ΔA| ≤ δ at absorbance A: s = T(10^δ − 1)/(T_s − T), T = 10^−A; NaN if T_s ≤ T. */
export function maxStrayRatio(A: number, tolerance: number, Ts = 1): number {
  if (!(A >= 0 && tolerance > 0 && Ts >= 0 && Ts <= 1)) return NaN;
  const T = 10 ** -A;
  if (!(Ts > T)) return NaN;
  return Math.min(1, (T * Math.expm1(tolerance * LN10)) / (Ts - T));
}

/** Stray ratio of the total detected power, s = S/(1 + S), from S = P_s/P₀ (stray over in-band reference power). */
export function strayRatioFromPowerRatio(S: number): number {
  return S >= 0 ? S / (1 + S) : NaN;
}

/** Order n ≥ 1, n ≠ m, wavelengths λ′ = mλ/n that land where order m has λ and lie in [λ_min, λ_max]. */
export function overlappingOrders(
  lambda: number, order: number, lambdaMin: number, lambdaMax: number,
): { order: number; wavelength: number }[] {
  if (!(lambda > 0 && order >= 1 && lambdaMin > 0 && lambdaMax >= lambdaMin)) return [];
  const out: { order: number; wavelength: number }[] = [];
  const nMax = Math.min(1000, Math.floor((order * lambda) / lambdaMin));
  for (let n = 1; n <= nMax; n++) {
    const w = (order * lambda) / n;
    if (n !== order && w >= lambdaMin && w <= lambdaMax) out.push({ order: n, wavelength: w });
  }
  return out;
}

/** Pass band (mλ/(m + 1), mλ/(m − 1)) an order-sorting filter must stay inside; upper = ∞ for m = 1, m. */
export function orderSortingWindow(lambda: number, order: number): { low: number; high: number } {
  if (!(lambda > 0 && order >= 1)) return { low: NaN, high: NaN };
  return { low: (order * lambda) / (order + 1), high: order > 1 ? (order * lambda) / (order - 1) : Infinity };
}
