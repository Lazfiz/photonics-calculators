/**
 * Asymptotic secure key rate of decoy-state BB84 with a weak coherent (Poissonian) source, threshold detectors and
 * the GLLP formula. SI units are dimensionless here: rates are per pulse unless named otherwise. Model tier: textbook
 * (infinite decoy states, infinite key, no finite-size or intensity-fluctuation corrections).
 *
 * Channel model of X. Ma, B. Qi, Y. Zhao, H.-K. Lo, Phys. Rev. A 72, 012326 (2005), §2, eqs. (5)–(11): overall
 * transmittance η = η_ch·η_Bob; i-photon yield Y_i = Y₀ + η_i − Y₀η_i with η_i = 1 − (1 − η)^i (their eq. (7)). Summed
 * over the Poisson photon number this gives Q_μ = 1 − (1 − Y₀)e^(−ημ) = Y₀ + 1 − e^(−ημ) − Y₀(1 − e^(−ημ)); their eq. (10)
 * drops the last term, which matters only when Y₀ is not ≪ 1. Errors, kept exact in Y₀ the same way: a background click
 * alone gives a random bit (e₀ = ½), a photon click an error e_d, so E_μQ_μ = e₀Y₀e^(−ημ) + e_d(1 − e^(−ημ)) and
 * e₁Y₁ = e₀Y₀(1 − η) + e_dη (their eqs. (9), (11) have e₀Y₀ in place of e₀Y₀e^(−ημ) and e₀Y₀(1 − η)); single photons
 * Q₁ = Y₁μe^(−μ). The GYS cutoff below moves by 0.0006 km. Key rate, their eq. (1) (GLLP, D. Gottesman et al., Quantum Inf. Comput. 4, 325 (2004)):
 *   R = q·{−Q_μ f(E_μ) H₂(E_μ) + Q₁[1 − H₂(e₁)]},  q = ½ for standard BB84.
 * With the GYS parameters of their Table 1 (α = 0.21 dB/km, e_d = 3.3 %, Y₀ = 1.7×10⁻⁶, η_Bob = 0.045), μ = 0.48 and
 * f = 1.22, the key vanishes at 142.015 km; their text on Fig. 2 prints 142.05 km, and their eqs. (10)–(11) give 142.0145 km,
 * so the 0.035 km gap is theirs (rounded inputs, presumably).
 *
 * The repeaterless bound −log₂(1 − η) (S. Pirandola, R. Laurenza, C. Ottaviani, L. Banchi, Nat. Commun. 8, 15043
 * (2017)) caps the secret bits per channel use of any point-to-point protocol over a pure-loss channel.
 */

import { binaryEntropy } from "./channel-capacity";

export interface DecoyBb84Params {
  /** Mean photon number of the signal state μ. */
  mu: number;
  /** Overall transmittance η = η_channel · η_Bob (detector efficiency included). */
  eta: number;
  /** Background (dark count) probability per pulse Y₀. */
  y0: number;
  /** Probability that a photon hits the wrong detector e_d. */
  eDetector: number;
  /** Error-correction inefficiency f(E) ≥ 1. */
  fEc: number;
  /** Sifting factor q (½ for BB84). */
  q?: number;
}

export interface DecoyBb84Result {
  /** Overall gain Q_μ per pulse. */
  gain: number;
  /** Overall QBER E_μ. */
  qber: number;
  /** Single-photon yield Y₁. */
  y1: number;
  /** Single-photon gain Q₁. */
  q1: number;
  /** Single-photon error rate e₁. */
  e1: number;
  /** Rate R before clipping; negative when the errors outweigh the single-photon key. */
  rawRate: number;
  /** Secure key per pulse, max(0, R). */
  keyPerPulse: number;
}

/** Decoy-state BB84 key rate per pulse (Ma et al. 2005 eq. (1), infinite decoys). */
export function decoyBb84(p: DecoyBb84Params): DecoyBb84Result {
  const { mu, eta, y0, eDetector, fEc } = p;
  const q = p.q ?? 0.5;
  const detected = -Math.expm1(-eta * mu);
  const gain = y0 + detected - y0 * detected;
  const qber = gain > 0 ? (0.5 * y0 * (1 - detected) + eDetector * detected) / gain : 0.5;
  const y1 = y0 + eta - y0 * eta;
  const q1 = y1 * mu * Math.exp(-mu);
  const e1 = y1 > 0 ? Math.min(0.5, (0.5 * y0 * (1 - eta) + eDetector * eta) / y1) : 0.5;
  const r = q * (-gain * fEc * binaryEntropy(Math.min(0.5, qber)) + q1 * (1 - binaryEntropy(e1)));
  return { gain, qber, y1, q1, e1, rawRate: r, keyPerPulse: Math.max(0, r) };
}

/** PLOB repeaterless bound −log₂(1 − η), secret bits per channel use for transmittance η. */
export function plobBound(eta: number): number {
  if (!(eta > 0)) return 0;
  if (eta >= 1) return Infinity;
  return -Math.log1p(-eta) / Math.LN2;
}

/**
 * Largest channel loss (dB) with a positive key, by bisection on [0, maxDb]. η = η_Bob·10^(−loss/10).
 * Returns 0 if there is no key even without channel loss, and Infinity if there is still a key at maxDb.
 */
export function maxChannelLossDb(p: Omit<DecoyBb84Params, "eta">, etaBob: number, maxDb = 200): number {
  return lossCutoff((lossDb) => decoyBb84({ ...p, eta: etaBob * 10 ** (-lossDb / 10) }).keyPerPulse, maxDb);
}

/** As `maxChannelLossDb`, with μ re-optimised (`optimalMu`) at each loss: the longest reach of any μ in [0.01, 1]. */
export function maxChannelLossDbOptimalMu(p: Omit<DecoyBb84Params, "eta" | "mu">, etaBob: number, maxDb = 200): number {
  return lossCutoff((lossDb) => {
    const eta = etaBob * 10 ** (-lossDb / 10);
    return decoyBb84({ ...p, eta, mu: optimalMu({ ...p, eta }) }).keyPerPulse;
  }, maxDb);
}

/** Bisection (60 steps) for the edge of key(loss) > 0 on [0, maxDb]; 0 if no key at 0 dB, Infinity if still a key at maxDb. */
function lossCutoff(key: (lossDb: number) => number, maxDb: number): number {
  if (!(key(0) > 0)) return 0;
  if (key(maxDb) > 0) return Infinity;
  let lo = 0, hi = maxDb;
  for (let i = 0; i < 60; i++) {
    const mid = 0.5 * (lo + hi);
    if (key(mid) > 0) lo = mid; else hi = mid;
  }
  return lo;
}

/**
 * μ in [0.01, 1] that maximises the key rate per pulse (golden-section search; the rate is unimodal in μ). It searches
 * the unclipped rate R: near the cutoff max(0, R) is flat (zero) over part of the interval and misleads the search.
 */
export function optimalMu(p: Omit<DecoyBb84Params, "mu">): number {
  const f = (mu: number) => decoyBb84({ ...p, mu }).rawRate;
  const g = (Math.sqrt(5) - 1) / 2;
  let a = 0.01, b = 1;
  let x1 = b - g * (b - a), x2 = a + g * (b - a);
  let f1 = f(x1), f2 = f(x2);
  for (let i = 0; i < 60; i++) {
    if (f1 >= f2) { b = x2; x2 = x1; f2 = f1; x1 = b - g * (b - a); f1 = f(x1); }
    else { a = x1; x1 = x2; f1 = f2; x2 = a + g * (b - a); f2 = f(x2); }
  }
  return 0.5 * (a + b);
}
