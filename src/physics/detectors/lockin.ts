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

export interface LockinInputs {
  phase_rad: number;
  detuning_Hz: number;
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
  const h = lowPassMagnitude(p.detuning_Hz, p.tau, p.order, p.filter);
  return REFERENCE_GAIN[p.reference] * Math.abs(Math.cos(p.phase_rad)) * h * Math.sqrt(p.inputBandwidth_Hz / enbw);
}
