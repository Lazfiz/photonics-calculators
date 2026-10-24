/**
 * Lock-in amplifier output filter and SNR gain. SI units: s, Hz.
 *
 * Output low-pass filters of order N with time constant τ:
 * - "rc": N cascaded RC stages (6 dB/octave each, as on analog and DSP lock-ins), |H|² = (1 + (2πfτ)²)^(−N).
 *   ENBW = ∫₀^∞ |H|² df = (1/4τ)·(2N − 3)!!/(2N − 2)!! → 1/4τ, 1/8τ, 3/32τ, 5/64τ for N = 1…4.
 * - "butterworth": |H|² = 1/(1 + (f/f_c)^(2N)) with f_c = 1/(2πτ); ENBW = f_c·(π/2N)/sin(π/2N) = (1/4Nτ)/sin(π/2N).
 * J. H. Scofield, "Frequency-domain description of a lock-in amplifier", Am. J. Phys. 62, 129 (1994),
 * doi:10.1119/1.17629; Stanford Research Systems, SR830 DSP Lock-In Amplifier manual (1993), noise-measurement section (ENBW of the 6–24 dB/oct filters).
 *
 * SNR gain for white input noise of density e_n in a band B_in and a sinusoid of amplitude A at phase φ, reference
 * normalised to unit power (sine √2·cos, or a ±1 square wave): output signal g·(A/√2)·cos φ·|H(Δf)|, output noise
 * e_n·√ENBW, so SNR_out/SNR_in = g·|cos φ|·|H(Δf)|·√(B_in/ENBW) with g = 1 (sine) or 2√2/π (square: the odd harmonics
 * of the reference also demodulate noise).
 *
 * A ±1 square reference is (4/π) Σ_{k odd} sin(kω_r t)/k, so it also detects a signal near k·f_r with gain
 * g_k = 2√2/(kπ) and detuning Δf_k = |f_s − k·f_r|: f_s = 3f_r gives X = (A/√2)·2√2/(3π).
 * The output takes the harmonic with the largest g_k·|H(Δf_k)| (a harmonic within 1e-9 relative of f_s counts as matched
 * and wins), then applies cos φ to a matched one; the others beat at their own Δf_k and are suppressed by |H|, which is
 * the lock-in's working regime (2f_r ≫ 1/τ). Not modelled: when f_s is an even multiple of f_r the k and k + 2 beats share
 * one Δf and add coherently (between 0.6 and 1.2 times the reported envelope at f_s = 2f_r), far down the filter skirt.
 */

export type LockinFilter = "rc" | "butterworth";
export type LockinReference = "sine" | "square";

/** Reference gain g relative to a unit-power sine reference. */
export const REFERENCE_GAIN: Record<LockinReference, number> = { sine: 1, square: (2 * Math.SQRT2) / Math.PI };

function validOrder(order: number): boolean {
  return Number.isInteger(order) && order >= 1 && order <= 8;
}

/** Equivalent noise bandwidth (Hz) of an order-N output filter with time constant τ (s). */
export function lowPassEnbw(tau: number, order: number, filter: LockinFilter): number {
  if (!(tau > 0) || !validOrder(order)) return NaN;
  if (filter === "butterworth") return 1 / (4 * order * tau * Math.sin(Math.PI / (2 * order)));
  let ratio = 1; // (2N − 3)!!/(2N − 2)!!
  for (let n = 2; n <= order; n++) ratio *= (2 * n - 3) / (2 * n - 2);
  return ratio / (4 * tau);
}

/** Filter magnitude |H(f)| at frequency offset f (Hz) from the reference. */
export function lowPassMagnitude(f: number, tau: number, order: number, filter: LockinFilter): number {
  if (!(tau > 0) || !validOrder(order) || !Number.isFinite(f)) return NaN;
  const x = 2 * Math.PI * Math.abs(f) * tau;
  return filter === "butterworth" ? 1 / Math.sqrt(1 + Math.pow(x, 2 * order)) : Math.pow(1 + x * x, -order / 2);
}

export interface ReferenceMatch {
  /** Odd harmonic k of the reference that detects the signal (1 for a sine reference). */
  harmonic: number;
  /** |f_s − k·f_r| (Hz). */
  detuning_Hz: number;
  /** g_k·|H(Δf_k)|, times cos φ when matched (φ: signal phase against that harmonic; X < 0 past 90°). */
  gain: number;
}

/**
 * Highest odd harmonic scanned below f_s/f_r; the two harmonics around f_s/f_r are always checked. A lower harmonic beyond
 * this wins only when |H| is nearly flat over thousands of f_r (f_r·τ ≪ 1), outside lock-in operation.
 */
const MAX_SCANNED_HARMONIC = 2e4 + 1;

/** The reference harmonic that detects a signal at f_s, see the module comment. */
export function referenceMatch(
  signal_Hz: number, reference_Hz: number, phase_rad: number, tau: number, order: number, filter: LockinFilter,
  reference: LockinReference,
): ReferenceMatch {
  const nan = { harmonic: 1, detuning_Hz: NaN, gain: NaN };
  if (!(signal_Hz >= 0) || !(reference_Hz >= 0) || !Number.isFinite(signal_Hz + reference_Hz)) return nan;
  // Envelope g_k·|H(Δf_k)|, Infinity for a matched harmonic so that it wins.
  const term = (k: number) => {
    const raw = Math.abs(signal_Hz - k * reference_Hz);
    const matched = raw <= 1e-9 * Math.max(signal_Hz, k * reference_Hz);
    const detuning_Hz = matched ? 0 : raw;
    const g = k === 1 ? REFERENCE_GAIN[reference] : (2 * Math.SQRT2) / (k * Math.PI);
    const envelope = g * lowPassMagnitude(detuning_Hz, tau, order, filter);
    return { harmonic: k, detuning_Hz, envelope, rank: matched ? Infinity : envelope };
  };
  const result = (t: ReturnType<typeof term>): ReferenceMatch =>
    ({ harmonic: t.harmonic, detuning_Hz: t.detuning_Hz, gain: t.envelope * (t.detuning_Hz === 0 ? Math.cos(phase_rad) : 1) });
  let best = term(1);
  if (Number.isNaN(best.envelope) || reference !== "square" || reference_Hz === 0) return result(best);
  const kLo = Math.max(1, 2 * Math.floor((signal_Hz / reference_Hz - 1) / 2) + 1); // largest odd k ≤ f_s/f_r
  const candidates = [kLo, kLo + 2];
  for (let k = 3; k < Math.min(kLo, MAX_SCANNED_HARMONIC); k += 2) candidates.push(k);
  for (const k of candidates) {
    const t = term(k);
    if (t.rank > best.rank) best = t;
  }
  return result(best);
}

export interface LockinInputs {
  phase_rad: number;
  signal_Hz: number;
  reference_Hz: number;
  tau: number;
  order: number;
  filter: LockinFilter;
  reference: LockinReference;
  inputBandwidth_Hz: number;
}

/** SNR gain SNR_out/SNR_in (amplitude ratio) of the lock-in, see the module comment. */
export function lockinSnrGain(p: LockinInputs): number {
  const enbw = lowPassEnbw(p.tau, p.order, p.filter);
  if (!(p.inputBandwidth_Hz > 0) || !(enbw > 0)) return NaN;
  const m = referenceMatch(p.signal_Hz, p.reference_Hz, p.phase_rad, p.tau, p.order, p.filter, p.reference);
  return Math.abs(m.gain) * Math.sqrt(p.inputBandwidth_Hz / enbw);
}
