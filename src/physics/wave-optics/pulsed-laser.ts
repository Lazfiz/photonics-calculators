/**
 * Pulsed laser output: Q-switching (rate equations), cavity dumping and mode locking.
 * SI units: lengths in m, times in s, cross-sections in m², power in W, energy in J, frequencies in Hz.
 * Model tier: textbook.
 *
 * Q-switching (Wagner & Lengyel 1963; Degnan 1989; Svelto, Principles of Lasers, ch. 8): a four-level medium with an
 * empty lower level, switched instantly from zero to full Q. With x = N/N_t the inversion over its threshold value and
 * Φ the photon number scaled to N_t V, in units of the photon lifetime τ_c = L_e/(cγ):
 *   dx/dt = −xΦ/τ_c,   dΦ/dt = (x − 1)Φ/τ_c   (spontaneous emission only seeds the pulse).
 * Their exact integral Φ = r − x + ln(x/r) gives the peak Φ_p = r − 1 − ln r at x = 1 and the final inversion
 * x_f = r(1 − η), with the extraction efficiency η solving rη = −ln(1 − η). The output coupler takes γ₂/(2γ) of the
 * photons, γ₂ = −ln R and γ the single-pass loss, so with N_t V = γA/σ:
 *   E = (γ₂/2)(hνA/σ) rη = (hνA/2σ) ln(1/R) ln(x_i/x_f),   P_p = (γ₂/2)(hνA/σ) Φ_p/τ_c.
 * Not modelled: a finite switching time, a slow lower-level decay (Degnan's inversion reduction factor 1–2) and
 * transverse variation of the gain.
 *
 * Cavity dumping: a full dump empties the energy P_circ τ_RT stored by the one-way circulating power P_circ in a
 * linear cavity of round-trip time τ_RT = 2L_e/c, so the pulse lasts one round trip; at most one dump per round trip.
 *
 * Mode locking: N phase-locked modes f_rep apart; a transform-limited pulse of intensity FWHM τ has spectral FWHM
 * Δν = K/τ, K = 2 ln2/π = 0.4413 (Gaussian) or 4 ln²(1 + √2)/π² = 0.3148 (sech²) (Diels & Rudolph, Ultrashort Laser
 * Pulse Phenomena, 2nd ed., ch. 1); about Δν/f_rep modes lie inside the FWHM.
 */

import { c } from "../constants";

/** Single-pass logarithmic loss γ = γ_i + (γ₁ + γ₂)/2, with γ_i = −ln(1 − internal fraction) and γ_j = −ln R_j. */
export function singlePassLoss(R1: number, R2: number, internalFraction = 0): number {
  if (!(R1 > 0 && R1 <= 1 && R2 > 0 && R2 <= 1 && internalFraction >= 0 && internalFraction < 1)) return NaN;
  return Math.log(1 / (1 - internalFraction)) + (Math.log(1 / R1) + Math.log(1 / R2)) / 2;
}

/** Photon lifetime τ_c = L_e/(cγ), s, for optical length L_e (m) and single-pass loss γ. NaN for γ ≤ 0. */
export function photonLifetime(opticalLength: number, loss: number): number {
  if (!(opticalLength > 0 && loss > 0)) return NaN;
  return opticalLength / (c * loss);
}

/** Q-switch extraction efficiency η: the root in (0, 1) of rη = −ln(1 − η), r = N_i/N_t. NaN for r ≤ 1. */
export function qSwitchExtraction(r: number): number {
  if (!(r > 1 && Number.isFinite(r))) return NaN;
  // f(η) = rη + ln(1 − η) is positive just above 0 and → −∞ at 1: bisect.
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 200 && hi - lo > 1e-15; i++) {
    const mid = (lo + hi) / 2;
    if (r * mid + Math.log1p(-mid) > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Peak scaled photon number Φ_p = r − 1 − ln r (in units of N_t V). NaN for r ≤ 1. */
export function qSwitchPeakPhotons(r: number): number {
  if (!(r > 1 && Number.isFinite(r))) return NaN;
  return r - 1 - Math.log(r);
}

export interface QSwitchPulse {
  /** Output energy, J. */
  readonly energy: number;
  /** Peak output power, W. */
  readonly peak: number;
  /** Energy/peak, s: Svelto's estimate τ_c rη/(r − 1 − ln r) of the FWHM. */
  readonly widthEstimate: number;
  /** Extraction efficiency η. */
  readonly extraction: number;
}

/**
 * Q-switched pulse of a four-level laser: initial inversion ratio r, photon energy hν (J), mode area A (m²), stimulated
 * emission cross-section σ (m²), output-coupler loss γ₂ = −ln R and photon lifetime τ_c (s). NaN outside the domain.
 */
export function qSwitchPulse(r: number, photonEnergy: number, area: number, sigma: number, couplerLoss: number, tauC: number): QSwitchPulse {
  const eta = qSwitchExtraction(r);
  if (!(photonEnergy > 0 && area > 0 && sigma > 0 && couplerLoss >= 0 && tauC > 0) || !Number.isFinite(eta)) {
    return { energy: NaN, peak: NaN, widthEstimate: NaN, extraction: NaN };
  }
  const scale = ((couplerLoss / 2) * photonEnergy * area) / sigma; // J per unit Φ
  const energy = scale * r * eta;
  const peak = (scale * qSwitchPeakPhotons(r)) / tauC;
  return { energy, peak, widthEstimate: energy / peak, extraction: eta };
}

export interface QSwitchWaveform {
  /** Time from the peak in units of τ_c. */
  readonly t: number[];
  /** Φ(t)/Φ_p. */
  readonly shape: number[];
  /** Intensity FWHM in units of τ_c, interpolated between steps. */
  readonly fwhm: number;
  /** ∫Φ dt/τ_c over the computed pulse (→ rη). */
  readonly extracted: number;
}

/**
 * Pulse shape from the scaled rate equations, RK4 from x = r and Φ = seed until Φ falls to 1e-4 of its peak, aligned at
 * the peak and thinned to about `points` samples. Empty arrays and NaN for r ≤ 1.
 */
export function qSwitchWaveform(r: number, points = 400, seed = 1e-9): QSwitchWaveform {
  const phiP = qSwitchPeakPhotons(r);
  if (!Number.isFinite(phiP) || !(seed > 0 && seed < phiP)) return { t: [], shape: [], fwhm: NaN, extracted: NaN };
  const width = (r * qSwitchExtraction(r)) / phiP;
  const dt = Math.min(width, 1 / (r - 1)) / 200;
  const f = (x: number, p: number): [number, number] => [-x * p, (x - 1) * p];
  let x = r;
  let p = seed;
  let time = 0;
  let extracted = 0;
  const ts: number[] = [0];
  const ps: number[] = [p];
  let peakSeen = false;
  for (let i = 0; i < 5e6; i++) {
    const [k1x, k1p] = f(x, p);
    const [k2x, k2p] = f(x + (dt / 2) * k1x, p + (dt / 2) * k1p);
    const [k3x, k3p] = f(x + (dt / 2) * k2x, p + (dt / 2) * k2p);
    const [k4x, k4p] = f(x + dt * k3x, p + dt * k3p);
    const pNext = p + (dt / 6) * (k1p + 2 * k2p + 2 * k3p + k4p);
    extracted += (dt / 2) * (p + pNext);
    x += (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
    p = pNext;
    time += dt;
    ts.push(time);
    ps.push(p);
    if (x < 1) peakSeen = true;
    if (peakSeen && p < 1e-4 * phiP) break;
  }
  let iPeak = 0;
  for (let i = 1; i < ps.length; i++) if (ps[i] > ps[iPeak]) iPeak = i;
  const half = ps[iPeak] / 2;
  let lead = NaN;
  let trail = NaN;
  for (let i = iPeak; i > 0; i--) {
    if (ps[i - 1] < half) { lead = ts[i - 1] + ((half - ps[i - 1]) / (ps[i] - ps[i - 1])) * (ts[i] - ts[i - 1]); break; }
  }
  for (let i = iPeak; i < ps.length - 1; i++) {
    if (ps[i + 1] < half) { trail = ts[i] + ((ps[i] - half) / (ps[i] - ps[i + 1])) * (ts[i + 1] - ts[i]); break; }
  }
  const fwhm = trail - lead;
  // Keep the samples within 4 FWHM before and 6 after the peak.
  const t0 = ts[iPeak];
  const keep: number[] = [];
  for (let i = 0; i < ts.length; i++) if (ts[i] - t0 >= -4 * fwhm && ts[i] - t0 <= 6 * fwhm) keep.push(i);
  const stride = Math.max(1, Math.floor(keep.length / points));
  const t: number[] = [];
  const shape: number[] = [];
  for (let k = 0; k < keep.length; k += stride) {
    t.push(ts[keep[k]] - t0);
    shape.push(ps[keep[k]] / ps[iPeak]);
  }
  return { t, shape, fwhm, extracted };
}

/** Round-trip time 2L_e/c, s, of a linear cavity of optical length L_e (m). NaN for L_e ≤ 0. */
export function roundTripTime(opticalLength: number): number {
  if (!(opticalLength > 0 && Number.isFinite(opticalLength))) return NaN;
  return (2 * opticalLength) / c;
}

export type PulseShapeTL = "gaussian" | "sech2";

/** Time-bandwidth product Δν·τ (intensity FWHMs) of a transform-limited pulse. */
export const TIME_BANDWIDTH: Readonly<Record<PulseShapeTL, number>> = {
  gaussian: (2 * Math.LN2) / Math.PI,
  sech2: (4 * Math.log(1 + Math.SQRT2) ** 2) / Math.PI ** 2,
};

/** Transform-limited spectral FWHM Δν = K/τ, Hz, for intensity FWHM τ (s). NaN for τ ≤ 0. */
export function transformLimitedBandwidth(fwhm: number, shape: PulseShapeTL): number {
  if (!(fwhm > 0 && Number.isFinite(fwhm))) return NaN;
  return TIME_BANDWIDTH[shape] / fwhm;
}

/**
 * Wavelength width of a band Δν wide centred in frequency on c/λ₀: Δλ = λ₀ ρ/(1 − ρ²/4), ρ = Δν λ₀/c (→ λ₀²Δν/c for a
 * narrow band). ∞ once the band reaches zero frequency (ρ ≥ 2), NaN for λ₀ ≤ 0 or Δν < 0.
 */
export function wavelengthWidth(dnu: number, lambda0: number): number {
  if (!(lambda0 > 0 && dnu >= 0)) return NaN;
  const rho = (dnu * lambda0) / c;
  return rho < 2 ? (lambda0 * rho) / (1 - (rho / 2) ** 2) : Infinity;
}

/**
 * Frequency width of the band whose wavelength width is Δλ, the inverse of `wavelengthWidth` (band centred in frequency on
 * c/λ₀): ρ = Δν λ₀/c = 2x/(1 + √(1 + x²)), x = Δλ/λ₀ (→ cΔλ/λ₀² for a narrow band). NaN for λ₀ ≤ 0 or Δλ < 0.
 */
export function frequencyWidth(dlambda: number, lambda0: number): number {
  if (!(lambda0 > 0 && dlambda >= 0 && Number.isFinite(lambda0) && Number.isFinite(dlambda))) return NaN;
  const x = dlambda / lambda0;
  return ((2 * x) / (1 + Math.sqrt(1 + x * x)) * c) / lambda0;
}

/** Cavity length for repetition rate f (Hz), m: c/(2f) for a linear (standing-wave) cavity, c/f for a ring. */
export function cavityLengthForRepRate(repRate: number, ring = false): number {
  if (!(repRate > 0 && Number.isFinite(repRate))) return NaN;
  return ring ? c / repRate : c / (2 * repRate);
}
