/**
 * Slow light: group delay and velocity from a group index, the signal bandwidth in frequency, and the delay of a
 * Lorentzian resonance (stimulated Brillouin gain, an EIT transparency window, or, with negative gain, an absorption
 * line giving fast light).
 *
 * Model tier: Exact definitions τ = n_g L/c, v_g = c/n_g, Δν = c/(λ − Δλ/2) − c/(λ + Δλ/2). Textbook for the
 * resonance: a Lorentzian line of power gain G (natural log, power transmission e^G at the centre) and FWHM Δν has the
 * causal (Kramers–Kronig) transfer ln H = (G/2)·γ/(γ − iΔ), γ = πΔν (HWHM, rad/s), Δ = 2π(ν − ν₀). Its phase
 * φ = (G/2)γΔ/(γ² + Δ²) gives the excess group delay
 *   τ(Δ) = dφ/dΔ = (G/2)·γ(γ² − Δ²)/(γ² + Δ²)²,   τ(0) = G/(2γ) = G/Γ (Γ = 2πΔν, rad/s),
 * so τ(0)·Δν = G/(2π): more delay at a given bandwidth needs more gain (or transparency depth).
 *
 * References: Y. Okawachi et al., "Tunable all-optical delays via Brillouin slow light in an optical fiber",
 * Phys. Rev. Lett. 94, 153902 (2005), doi:10.1103/PhysRevLett.94.153902 (ΔT_d = G/Γ_B). R. S. Tucker, P.-C. Ku,
 * C. J. Chang-Hasnain, "Slow-light optical buffers: capabilities and fundamental limitations", J. Lightwave Technol.
 * 23, 4046 (2005), doi:10.1109/JLT.2005.853125. L. V. Hau et al., Nature 397, 594 (1999), doi:10.1038/17561.
 * T. Baba, Nat. Photonics 2, 465 (2008), doi:10.1038/nphoton.2008.146.
 */
import { c } from "../constants";

/** Group delay n_g L/c (s) over a length L (m). NaN unless n_g > 0, L ≥ 0. */
export function groupDelay(nGroup: number, length: number): number {
  if (!(nGroup > 0 && length >= 0)) return NaN;
  return (nGroup * length) / c;
}

/** Group velocity c/n_g (m/s). NaN unless n_g > 0. */
export function groupVelocity(nGroup: number): number {
  return nGroup > 0 ? c / nGroup : NaN;
}

/** Group index that gives an excess delay τ over a background index n₀ in a length L: n₀ + cτ/L. NaN unless L > 0. */
export function groupIndexFromDelay(n0: number, excessDelay: number, length: number): number {
  if (!(length > 0 && n0 > 0)) return NaN;
  return n0 + (c * excessDelay) / length;
}

/** Frequency width (Hz) of a band Δλ centred on λ (both m): c/(λ − Δλ/2) − c/(λ + Δλ/2). NaN unless 0 ≤ Δλ < 2λ. */
export function bandwidthHz(lambda: number, dLambda: number): number {
  if (!(lambda > 0 && dLambda >= 0 && dLambda < 2 * lambda)) return NaN;
  return c / (lambda - dLambda / 2) - c / (lambda + dLambda / 2);
}

/** Excess group delay (s) of a Lorentzian resonance of power gain G (Np) and FWHM Δν (Hz) at detuning ν − ν₀ (Hz). */
export function lorentzianDelay(gain: number, fwhm: number, detuning: number): number {
  if (!(fwhm > 0) || !Number.isFinite(gain) || !Number.isFinite(detuning)) return NaN;
  const g = Math.PI * fwhm;
  const d = 2 * Math.PI * detuning;
  const s = g * g + d * d;
  return ((gain / 2) * g * (g * g - d * d)) / (s * s);
}

/** Power gain (Np) of the Lorentzian resonance at detuning ν − ν₀: G·γ²/(γ² + Δ²). */
export function lorentzianGain(gain: number, fwhm: number, detuning: number): number {
  if (!(fwhm > 0) || !Number.isFinite(gain) || !Number.isFinite(detuning)) return NaN;
  const x = (2 * detuning) / fwhm;
  return gain / (1 + x * x);
}

/** Power gain G in nepers from dB: G (Np) = G (dB)·ln 10/10. */
export const NP_PER_DB = Math.LN10 / 10;

export interface SlowLightInput {
  /** true: the group index follows from a Lorentzian resonance; false: it is given. */
  resonance: boolean;
  /** Given group index (used when resonance is false). */
  nGroup: number;
  /** Background group index n₀. */
  n0: number;
  /** Centre wavelength, m. */
  lambda: number;
  /** Signal bandwidth Δλ, m (index model). */
  dLambda: number;
  /** Structure length, m. */
  length: number;
  /** Power gain at line centre, Np (resonance model). */
  gainNp: number;
  /** Resonance FWHM, Hz. */
  fwhmHz: number;
  /** Signal bandwidth Δν, Hz (resonance model). */
  signalHz: number;
}

export interface SlowLightResult {
  /** Resonance delay at line centre G/Γ, s. */
  tauRes: number;
  nGroup: number;
  /** Total group delay, s. */
  tau: number;
  /** Delay of the background medium n₀ L/c, s. */
  tau0: number;
  /** tau − tau0, s. */
  excess: number;
  /** m/s; NaN for n_g ≤ 0 (fast light). */
  vg: number;
  /** Signal bandwidth, Hz. */
  dnu: number;
}

/** The page's model dispatch: given group index or resonance-derived one, with delay, velocity and bandwidth. */
export function slowLightModel(p: SlowLightInput): SlowLightResult {
  const tauRes = lorentzianDelay(p.gainNp, p.fwhmHz, 0);
  const ng = p.resonance ? groupIndexFromDelay(p.n0, tauRes, p.length) : p.nGroup;
  const tau0 = groupDelay(p.n0, p.length);
  const tau = p.resonance ? tau0 + tauRes : groupDelay(ng, p.length);
  const dnu = p.resonance ? p.signalHz : bandwidthHz(p.lambda, Math.min(p.dLambda, 1.99 * p.lambda));
  return { tauRes, nGroup: ng, tau, tau0, excess: tau - tau0, vg: groupVelocity(ng), dnu };
}
