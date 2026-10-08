/**
 * Chromatic dispersion of a fibre span, its compensation with a dispersion-compensating fibre (DCF), and the
 * resulting bit-rate limit and power penalty for a broad-spectrum source. SI units in and out: D in s/m²
 * (1 ps/(nm·km) = 1e-6 s/m²), dispersion slope S = dD/dλ in s/m³ (1 ps/(nm²·km) = 1e3 s/m³), lengths and
 * wavelengths in m, accumulated dispersion D·L in s/m (1 ps/nm = 1e-3 s/m), times in s, bit rates in 1/s.
 * Model tier: textbook approximation.
 *
 * Linear dispersion model about a reference wavelength λ₀: D(λ) = D + S(λ − λ₀). The group delay per unit
 * length is then τ(λ) = τ₀ + D δλ + ½ S δλ² with δλ = λ − λ₀.
 *
 * Broadening: a source whose power spectrum is Gaussian with rms width σ_λ, much wider than the modulation
 * bandwidth (σ_λ ≫ λ²B/c), spreads each bit by the rms of the group delay over its spectrum. With δλ ~ N(0, σ_λ²)
 * about the channel wavelength, Var(D δλ + ½ S δλ²) = (D σ_λ)² + ½ (S σ_λ²)², so for a span with accumulated
 * dispersion D_acc = Σ DᵢLᵢ and slope S_acc = Σ SᵢLᵢ
 *   σ_D = √((D_acc σ_λ)² + ½ (S_acc σ_λ²)²).
 * This is Agrawal's result for V_ω ≫ 1 (G. P. Agrawal, Fiber-Optic Communication Systems, §2.4.3; at the
 * zero-dispersion wavelength σ_D = |S|Lσ_λ²/√2, giving BL|S|σ_λ² ≤ 1/√8).
 *
 * Bit-rate limit: the rms width of the dispersive spread stays below a quarter of the bit slot, 4Bσ_D ≤ 1
 * (Agrawal §2.4.3: BL|D|σ_λ ≤ 1/4).
 * Power penalty: if the received pulse has rms width 1/(4B), the transmitted pulse can only be
 * σ₀ = √(1/(4B)² − σ_D²) wide, and the peak power drops by σ/σ₀:
 *   δ_d = −5 log₁₀(1 − (4Bσ_D)²) dB  (Agrawal §5.4.4; tabulated in NPTEL Optical Communication, Module 12:
 *   0.378 dB at BL|D|σ_λ = 0.1, 2.22 dB at 0.2).
 *
 * Compensation: a DCF of dispersion D_c < 0 (for D > 0) and length L_c = −D L / D_c nulls the accumulated
 * dispersion at λ₀. What is left is the slope mismatch S_res = S L + S_c L_c, so D_acc(λ) = S_res (λ − λ₀).
 * S_res = 0 when the relative dispersion slopes RDS = S/D of the two fibres are equal (Agrawal, dispersion
 * management chapter: S₁/D₁ = S₂/D₂ for broadband compensation).
 *
 * Not included: the narrow-source (transform-limited) regime, where the limit is B√(|β₂|L) ≤ 1/4; dispersion
 * curvature dS/dλ (DCFs have a strongly curved D(λ) far from their design band); PMD; nonlinear effects;
 * DCF loss.
 */

/** Power penalty used for the dispersion tolerance and usable band, dB. */
export const TOLERANCE_PENALTY_DB = 1;

/** Dispersion and dispersion slope of one fibre at the reference wavelength λ₀. */
export interface FiberDispersion {
  /** D, s/m². */
  D: number;
  /** S = dD/dλ, s/m³. */
  S: number;
}

/** Accumulated dispersion (D + S δλ)·L at detuning δλ = λ − λ₀ from the reference, s/m. */
export function accumulatedDispersion(fiber: FiberDispersion, L: number, detuning = 0): number {
  return (fiber.D + fiber.S * detuning) * L;
}

/** RMS spread of the group delay over a Gaussian source spectrum of rms width σ_λ, s. */
export function rmsBroadening(Dacc: number, Sacc: number, sigmaLambda: number): number {
  return Math.hypot(Dacc * sigmaLambda, (Sacc * sigmaLambda ** 2) / Math.SQRT2);
}

/** Largest bit rate with 4Bσ_D ≤ 1, 1/s (∞ when σ_D = 0). */
export function dispersionLimitedBitRate(sigmaD: number): number {
  return 1 / (4 * sigmaD);
}

/** Dispersion power penalty −5 log₁₀(1 − (4Bσ_D)²), dB; ∞ once 4Bσ_D ≥ 1 (the eye is closed). */
export function dispersionPenaltyDb(bitRate: number, sigmaD: number): number {
  const x2 = (4 * bitRate * sigmaD) ** 2;
  if (!(x2 < 1)) return Number.isNaN(x2) ? NaN : Infinity;
  return (-5 * Math.log1p(-x2)) / Math.LN10;
}

/** The rms broadening σ_D at which the penalty reaches `penaltyDb`, s. */
export function toleratedBroadening(bitRate: number, penaltyDb = TOLERANCE_PENALTY_DB): number {
  return Math.sqrt(-Math.expm1((-penaltyDb * Math.LN10) / 5)) / (4 * bitRate);
}

/**
 * DCF length L_c = −D L / D_c that nulls the accumulated dispersion at λ₀, m. 0 when D = 0;
 * NaN when D_c is 0 or has the same sign as D (it would add dispersion).
 */
export function dcfLength(span: FiberDispersion, L: number, dcf: FiberDispersion): number {
  if (span.D === 0) return 0;
  if (!(span.D * dcf.D < 0)) return NaN;
  return (-span.D * L) / dcf.D;
}

/** Residual dispersion slope S L + S_c L_c of the compensated link, s/m². */
export function residualSlope(span: FiberDispersion, L: number, dcf: FiberDispersion, Lc: number): number {
  return span.S * L + dcf.S * Lc;
}

/**
 * Half-width |λ − λ₀| of the band in which the compensated link (D_acc = S_res (λ − λ₀)) stays within the
 * tolerated broadening σ_tol, m. ∞ when S_res = 0 (within this linear model); 0 when even λ₀ exceeds σ_tol.
 */
export function usableHalfBandwidth(Sres: number, sigmaLambda: number, sigmaTol: number): number {
  const slopeTerm2 = (Sres * sigmaLambda ** 2) ** 2 / 2;
  const room2 = sigmaTol ** 2 - slopeTerm2;
  if (room2 <= 0) return 0;
  return Math.sqrt(room2) / Math.abs(Sres * sigmaLambda);
}
