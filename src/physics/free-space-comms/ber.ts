/**
 * Bit-error rate of a photon-counting optical receiver: equiprobable bits, Poisson signal and
 * noise counts.
 *
 * Model tier: Exact for the idealised receiver (photon-number-resolving detectors, no dead time,
 * ISI, timing jitter or interferometer phase error). All counts are detected counts, i.e. after
 * quantum efficiency.
 * Reference: D. O. Caplan, "Laser communication transmitter and receiver design", in Majumdar &
 * Ricklin (eds.), Free-Space Laser Communications (Springer, 2008), doi:10.1007/978-0-387-28677-8_4.
 * Quantum limits ½e^(−2n̄) for OOK and ½e^(−n̄) for DPSK, i.e. 10 and 20 photons/bit at BER 1e-9.
 *
 * Inputs: photonsPerBit n̄ = mean signal photons per bit, averaged over 0s and 1s;
 *         noisePerSlot n_b = mean dark + background counts per detector per bit slot.
 * Results below ~1e-300 underflow and are returned as 0.
 */

import { poissonCdf, poissonPmf, poissonSf } from "../math";

export type PhotonCountingScheme = "OOK" | "DPSK";

/** UI bounds; the functions accept any finite input but get slow for noise ≫ 1e4 counts. */
export const MAX_PHOTONS_PER_BIT = 1e5;
export const MAX_NOISE_PER_SLOT = 1e4;

export interface OokBer {
  ber: number;
  /** Decide "1" when the count is ≥ threshold. */
  threshold: number;
}

function validInputs(photonsPerBit: number, noisePerSlot: number): boolean {
  return Number.isFinite(photonsPerBit) && Number.isFinite(noisePerSlot) && photonsPerBit >= 0 && noisePerSlot >= 0;
}

/**
 * OOK: a "1" pulse carries n_s = 2n̄ photons and a "0" none. The maximum-likelihood decision
 * (likelihood ratio of Poisson(n_s + n_b) to Poisson(n_b)) is "1" when k > n_s / ln(1 + n_s/n_b), so
 *   BER = ½[P(K ≥ k_T | n_b) + P(K < k_T | n_s + n_b)].
 * With n_b = 0 the threshold is one count and BER = ½e^(−2n̄).
 */
export function ookPhotonCountingBer(photonsPerBit: number, noisePerSlot: number): OokBer {
  if (!validInputs(photonsPerBit, noisePerSlot)) return { ber: NaN, threshold: NaN };
  const ns = 2 * photonsPerBit;
  if (ns === 0) return { ber: 0.5, threshold: NaN };
  const threshold = noisePerSlot === 0 ? 1 : Math.floor(ns / Math.log1p(ns / noisePerSlot)) + 1;
  const falseAlarm = poissonSf(threshold - 1, noisePerSlot);
  const miss = poissonCdf(threshold - 1, ns + noisePerSlot);
  return { ber: 0.5 * (falseAlarm + miss), threshold };
}

// Chernoff bound P(K_d ≥ K_c) ≤ exp(−(√μ_c − √μ_d)²); beyond e^(−690) ≈ 3e-300 report 0.
const UNDERFLOW_EXPONENT = 690;

/**
 * DPSK with a one-bit delay-line interferometer and one photon counter per output port. The
 * constructive port receives n̄ + n_b counts and the destructive port n_b. The receiver picks the
 * port with more counts and breaks ties at random:
 *   BER = Σ_j P(K_c = j)·[P(K_d > j) + ½P(K_d = j)].
 * With n_b = 0 this is ½e^(−n̄).
 */
export function dpskPhotonCountingBer(photonsPerBit: number, noisePerSlot: number): number {
  if (!validInputs(photonsPerBit, noisePerSlot)) return NaN;
  if (photonsPerBit === 0) return 0.5;
  if (noisePerSlot === 0) return 0.5 * Math.exp(-photonsPerBit);
  const muC = photonsPerBit + noisePerSlot;
  const muD = noisePerSlot;
  const gap = Math.sqrt(muC) - Math.sqrt(muD);
  if (gap * gap > UNDERFLOW_EXPONENT) return 0;

  // Sum downward from well above the bulk of K_c, so that S(j) = P(K_d > j) + ½P(K_d = j) only
  // grows by additions: S(j−1) = S(j) + ½P_d(j) + ½P_d(j−1). Stop once below both means and the
  // terms (now shrinking at least geometrically) fall under 1e-22 of the sum.
  const jTop = Math.ceil(muC + 15 * Math.sqrt(muC) + 40);
  let pdAbove = poissonPmf(jTop, muD);
  let s = poissonSf(jTop, muD) + 0.5 * pdAbove;
  let sum = poissonPmf(jTop, muC) * s;
  for (let j = jTop - 1; j >= 0; j--) {
    const pd = poissonPmf(j, muD);
    s += 0.5 * (pdAbove + pd);
    pdAbove = pd;
    const term = poissonPmf(j, muC) * s;
    sum += term;
    if (j < muD && term <= 1e-22 * sum) break;
  }
  return sum;
}

export function photonCountingBer(scheme: PhotonCountingScheme, photonsPerBit: number, noisePerSlot: number): number {
  return scheme === "OOK"
    ? ookPhotonCountingBer(photonsPerBit, noisePerSlot).ber
    : dpskPhotonCountingBer(photonsPerBit, noisePerSlot);
}

/**
 * Mean photons per bit needed for targetBer. BER falls monotonically with n̄, so bisect ln n̄ on
 * [1e-3, 1e7] with 50 halvings (relative tolerance ≈ 2e-14). Returns Infinity if 1e7 photons/bit
 * is not enough and NaN for targets outside (0, 0.5) or invalid noise.
 */
export function requiredPhotonsPerBit(scheme: PhotonCountingScheme, targetBer: number, noisePerSlot: number): number {
  if (!(targetBer > 0 && targetBer < 0.5) || !validInputs(0, noisePerSlot)) return NaN;
  let lo = Math.log(1e-3);
  let hi = Math.log(1e7);
  if (photonCountingBer(scheme, Math.exp(hi), noisePerSlot) > targetBer) return Infinity;
  for (let i = 0; i < 50; i++) {
    const mid = 0.5 * (lo + hi);
    if (photonCountingBer(scheme, Math.exp(mid), noisePerSlot) > targetBer) lo = mid;
    else hi = mid;
  }
  return Math.exp(hi);
}
