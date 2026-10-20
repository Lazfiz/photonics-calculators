/**
 * Optical frequency comb and carrier-envelope phase.
 * SI units: frequencies in Hz, times in s, phases in rad. Model tier: exact (comb equation).
 *
 * A mode-locked pulse train of repetition rate f_rep whose carrier slips by Δφ_CE against the envelope from one pulse to
 * the next has the spectrum ν_n = n f_rep + f_ceo with f_ceo = (Δφ_CE/2π) f_rep, taken in [0, f_rep)
 * (Telle et al. 1999, Appl. Phys. B 69, 327; Jones et al. 2000, Science 288, 635; Udem, Holzwarth & Hänsch 2002,
 * Nature 416, 233). The carrier-envelope phase returns to its start every f_rep/f_ceo pulses when that is an integer.
 * An f-to-2f interferometer measures f_ceo = 2ν_n − ν_2n.
 */

import type { Comb } from "../spectroscopy/dual-comb-spectroscopy";

export { nearestTooth, type Comb } from "../spectroscopy/dual-comb-spectroscopy";

/** f wrapped into [0, f_rep), Hz. NaN for f_rep ≤ 0. */
export function wrapOffset(fceo: number, frep: number): number {
  if (!(frep > 0 && Number.isFinite(frep) && Number.isFinite(fceo))) return NaN;
  const r = fceo - frep * Math.floor(fceo / frep);
  return r < frep ? r : 0;
}

/** Frequency of tooth n, ν_n = n f_rep + f_ceo, Hz. */
export function combTooth(comb: Comb, n: number): number {
  return n * comb.frep + comb.fceo;
}

/** Carrier-envelope phase slip per pulse, Δφ_CE = 2π f_ceo/f_rep in [0, 2π), rad. */
export function cePhaseSlip(fceo: number, frep: number): number {
  return (2 * Math.PI * wrapOffset(fceo, frep)) / frep;
}
