/**
 * Shannon capacity and the net rate of uncoded modulations with hard-decision FEC on an AWGN channel. SNR is E_s/N₀
 * with Nyquist signalling at symbol rate = bandwidth B, so a constellation with k bits per symbol carries k b/s/Hz.
 *
 * Model tier: exact for ideal coherent detection in complex AWGN (Gray mapping, perfect carrier and timing recovery).
 * - Capacity C = B log₂(1 + SNR) (Shannon 1948).
 * - Bit error rates, γ = E_s/N₀: BPSK Q(√2γ); Gray QPSK Q(√γ); on-off keying with coherent detection, points
 *   {0, √(2E_s)}, Q(√γ); Gray 16-QAM ¼[3Q(√(γ/5)) + 2Q(3√(γ/5)) − Q(5√(γ/5))] (Cho K., Yoon D. (2002), IEEE Trans.
 *   Commun. 50(7), 1074, https://doi.org/10.1109/TCOMM.2002.800818); Gray 8-PSK from the probability of each decision
 *   sector weighted by its average Hamming distance, with the exact phase-error tail
 *   P(ψ < θ ≤ π) = (1/2π) ∫₀^(π−ψ) exp(−γ sin²ψ / sin²φ) dφ (Craig J. W. (1991), MILCOM '91, 571,
 *   https://doi.org/10.1109/MILCOM.1991.258319).
 * - Net rate R = B k/(1 + OH) when the uncoded BER is at or below the FEC's input-BER limit, else 0. A hard-decision
 *   code sees a binary symmetric channel, so it needs a code rate ≤ 1 − H₂(p): OH ≥ 1/(1 − H₂(p)) − 1.
 * Not modelled: intensity modulation with direct detection (a real, non-negative, power-limited channel with no
 * closed-form capacity) and photon counting (Poisson channel); see the photon-counting BER page for the latter.
 */
import { integrateTanhSinh, qFunction } from "../math";

export type Modulation = "OOK" | "BPSK" | "QPSK" | "8PSK" | "16QAM";
export const MODULATIONS: readonly Modulation[] = ["OOK", "BPSK", "QPSK", "8PSK", "16QAM"];
export const BITS_PER_SYMBOL: Record<Modulation, number> = { OOK: 1, BPSK: 1, QPSK: 2, "8PSK": 3, "16QAM": 4 };

/** Shannon capacity B log₂(1 + SNR), b/s, for B > 0 and linear SNR ≥ 0. */
export function shannonCapacity(bandwidth: number, snr: number): number {
  if (!(bandwidth > 0 && snr >= 0)) return NaN;
  return (bandwidth * Math.log1p(snr)) / Math.LN2;
}

/** P(ψ < θ ≤ π) for the phase error θ of a PSK symbol at E_s/N₀ = γ, ψ ∈ [0, π] (Craig 1991). */
export function phaseTail(psi: number, esN0: number): number {
  if (!(psi >= 0 && psi <= Math.PI && esN0 >= 0)) return NaN;
  if (psi === Math.PI) return 0;
  const s2 = Math.sin(psi) ** 2;
  return integrateTanhSinh((phi) => Math.exp((-esN0 * s2) / Math.sin(phi) ** 2), 0, Math.PI - psi) / (2 * Math.PI);
}

const popcount = (x: number) => { let n = 0; for (; x; x &= x - 1) n++; return n; };

/** Bit error rate of Gray-coded M-PSK (M = 2^k ≥ 2) at E_s/N₀ = γ, from the decision-sector probabilities. */
export function mpskGrayBer(m: number, esN0: number): number {
  const k = Math.log2(m);
  if (!(Number.isInteger(k) && k >= 1 && esN0 >= 0)) return NaN;
  const gray = (i: number) => i ^ (i >> 1);
  // edges[j] = P(θ > (2j − 1)π/M), j = 1 … M/2.
  const edges = Array.from({ length: m / 2 + 1 }, (_, j) => (j === 0 ? NaN : phaseTail(((2 * j - 1) * Math.PI) / m, esN0)));
  let ber = 0;
  for (let j = 1; j < m; j++) {
    const d = Math.min(j, m - j);
    // Sector d away from the sent symbol on one side: (2d−1)π/M < θ ≤ (2d+1)π/M; at d = M/2 both sides meet at ±π.
    const p = d === m / 2 ? 2 * edges[d] : edges[d] - edges[d + 1];
    let w = 0;
    for (let i = 0; i < m; i++) w += popcount(gray(i) ^ gray((i + j) % m));
    ber += (w / m) * p;
  }
  return ber / k;
}

/** Bit error rate of a modulation at linear E_s/N₀ ≥ 0. */
export function bitErrorRate(mod: Modulation, esN0: number): number {
  if (!(esN0 >= 0)) return NaN;
  switch (mod) {
    case "OOK": return qFunction(Math.sqrt(esN0));
    case "BPSK": return qFunction(Math.sqrt(2 * esN0));
    case "QPSK": return qFunction(Math.sqrt(esN0));
    case "8PSK": return mpskGrayBer(8, esN0);
    case "16QAM": {
      const x = Math.sqrt(esN0 / 5);
      return 0.25 * (3 * qFunction(x) + 2 * qFunction(3 * x) - qFunction(5 * x));
    }
  }
}

/**
 * E_s/N₀ in dB at which the BER falls to the limit, by bisection on [−20, 40] dB (60 halvings). NaN outside (0, BER(0))
 * or when the limit is already met at −20 dB; Infinity if 40 dB is not enough.
 */
export function requiredSnrDb(mod: Modulation, berLimit: number): number {
  if (!(berLimit > 0 && berLimit < bitErrorRate(mod, 0))) return NaN;
  let lo = -20;
  let hi = 40;
  if (bitErrorRate(mod, 10 ** (lo / 10)) <= berLimit) return NaN;
  if (bitErrorRate(mod, 10 ** (hi / 10)) > berLimit) return Infinity;
  for (let i = 0; i < 60; i++) {
    const mid = 0.5 * (lo + hi);
    if (bitErrorRate(mod, 10 ** (mid / 10)) > berLimit) lo = mid;
    else hi = mid;
  }
  return 0.5 * (lo + hi);
}

/** Binary entropy H₂(p), bits. */
export function binaryEntropy(p: number): number {
  if (!(p >= 0 && p <= 1)) return NaN;
  if (p === 0 || p === 1) return 0;
  return -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
}

/** Smallest overhead 1/(1 − H₂(p)) − 1 of a hard-decision code that corrects input BER p < 0.5. */
export function minimumHardDecisionOverhead(p: number): number {
  if (!(p >= 0 && p < 0.5)) return NaN;
  return 1 / (1 - binaryEntropy(p)) - 1;
}

/** Net information rate B k/(1 + OH), b/s, if the uncoded BER at this SNR meets the FEC limit, else 0. */
export function netRate(mod: Modulation, bandwidth: number, esN0: number, overhead: number, berLimit: number): number {
  if (!(bandwidth > 0 && esN0 >= 0 && overhead >= 0 && berLimit > 0)) return NaN;
  return bitErrorRate(mod, esN0) <= berLimit ? (bandwidth * BITS_PER_SYMBOL[mod]) / (1 + overhead) : 0;
}

/** Shannon limit on E_b/N₀ at spectral efficiency η b/s/Hz: (2^η − 1)/η, linear (ln 2 as η → 0). */
export function shannonEbN0(eta: number): number {
  if (!(eta >= 0)) return NaN;
  return eta === 0 ? Math.LN2 : Math.expm1(eta * Math.LN2) / eta;
}
