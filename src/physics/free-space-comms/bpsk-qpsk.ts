/**
 * Coherent BPSK / QPSK / OQPSK in additive white Gaussian noise.
 *
 * Model tier: Exact for ideal coherent detection (perfect carrier and timing recovery, AWGN only).
 * Reference: Proakis & Salehi, Digital Communications, 5th ed. (McGraw-Hill, 2008), binary
 * antipodal signalling and Gray-coded QPSK: P_b = Q(√(2E_b/N₀)) for BPSK, and the same per-bit
 * error rate for Gray-coded QPSK and OQPSK (two independent BPSK rails). The QPSK symbol error rate is
 * P_s = 1 − (1 − P_b)².
 *
 * Optical receive power: LO-shot-noise-limited coherent detection. Ip, Lau, Barros & Kahn, "Coherent detection in
 * optical fiber systems," Opt. Express 16, 753 (2008), doi:10.1364/OE.16.000753, Table 1: the SNR per symbol of a
 * heterodyne or two-quadrature (intradyne) receiver is the number of detected photons per symbol ηn̄_s, so
 * N₀ = hν/η referred to the received optical power; a single-quadrature homodyne receiver doubles it (N₀ = hν/2η),
 * which only BPSK can use.
 */

import { c, h } from "../constants";
import { qFunction } from "../math";

export type CoherentReceiver = "heterodyne" | "homodyne";

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

/**
 * Noise spectral density N₀ (W/Hz, referred to the received optical power) of an LO-shot-noise-limited coherent
 * receiver: hν/η for heterodyne or two-quadrature intradyne detection, hν/(2η) for single-quadrature homodyne (BPSK).
 */
export function shotNoiseN0(lambda: number, eta: number, receiver: CoherentReceiver = "heterodyne"): number {
  if (!(lambda > 0) || !(eta > 0 && eta <= 1)) return NaN;
  return (h * c) / lambda / eta / (receiver === "homodyne" ? 2 : 1);
}

/** Received optical power (W) that gives E_b/N₀ (dB) at bit rate R (bit/s): P = (E_b/N₀)·N₀·R. */
export function requiredRxPower(
  ebN0dB: number, bitRate: number, lambda: number, eta: number, receiver: CoherentReceiver = "heterodyne",
): number {
  if (!Number.isFinite(ebN0dB) || !(bitRate > 0)) return NaN;
  return 10 ** (ebN0dB / 10) * shotNoiseN0(lambda, eta, receiver) * bitRate;
}
