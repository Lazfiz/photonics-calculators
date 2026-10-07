/**
 * Coherent BPSK / QPSK / OQPSK in additive white Gaussian noise.
 *
 * Model tier: Exact for ideal coherent detection (perfect carrier and timing recovery, AWGN only).
 * Reference: Proakis & Salehi, Digital Communications, 5th ed. (McGraw-Hill, 2008), binary
 * antipodal signalling and Gray-coded QPSK: P_b = Q(√(2E_b/N₀)) for BPSK, and the same per-bit
 * error rate for Gray-coded QPSK and OQPSK (two independent BPSK rails). The QPSK symbol error rate is
 * P_s = 1 − (1 − P_b)².
 */

import { qFunction } from "../math";

/** Bit error rate of BPSK, and of Gray-coded QPSK/OQPSK, at linear E_b/N₀ ≥ 0. */
export function bpskBer(ebN0: number): number {
  if (!(ebN0 >= 0)) return NaN;
  return qFunction(Math.sqrt(2 * ebN0));
}

/** QPSK/OQPSK symbol error rate P_s = 1 − (1 − P_b)² = P_b(2 − P_b). */
export function qpskSer(ebN0: number): number {
  const pb = bpskBer(ebN0);
  return pb * (2 - pb);
}

/**
 * E_b/N₀ in dB needed for the target BER, found by bisection on [−10, 30] dB with 60 halvings
 * (tolerance < 1e-16 dB). Returns NaN for targets outside (0, 0.5) and Infinity if 30 dB is not enough.
 */
export function requiredEbN0dB(targetBer: number): number {
  if (!(targetBer > 0 && targetBer < 0.5)) return NaN;
  let lo = -10;
  let hi = 30;
  if (bpskBer(10 ** (hi / 10)) > targetBer) return Infinity;
  for (let i = 0; i < 60; i++) {
    const mid = 0.5 * (lo + hi);
    if (bpskBer(10 ** (mid / 10)) > targetBer) lo = mid;
    else hi = mid;
  }
  return hi;
}
