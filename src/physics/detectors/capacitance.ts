/**
 * Capacitance page: depletion capacitance of a photodiode junction vs reverse bias and its RC bandwidth. SI units: F, V,
 * Ω, Hz, s. Invalid inputs give NaN.
 *
 * C_j = C_j0/(1 + V_R/V_bi)^m with m = 1/2 (abrupt) or 1/3 (linearly graded), f_3dB = 1/(2π·(R_L + R_s)·C_j): S. M. Sze,
 * K. K. Ng, Physics of Semiconductor Devices, 3rd ed. (Wiley 2007), ch. 2, doi:10.1002/0470068329. The primitives are in
 * `photodiode-rc.ts`.
 */

import { GRADING_EXPONENT, junctionCapacitance, rcBandwidth } from "./photodiode-rc";

export type DopingProfile = "abrupt" | "graded" | "custom";

/** The doping profiles of the page, in display order. */
export const DOPING_PROFILES: readonly DopingProfile[] = ["abrupt", "graded", "custom"];

/** Grading exponent m of a profile; "custom" takes `customM`. */
export function gradingM(profile: DopingProfile, customM: number): number {
  return profile === "custom" ? customM : GRADING_EXPONENT[profile];
}

export interface CapacitanceInputs {
  /** Zero-bias junction capacitance C_j0, F. */
  zeroBiasCap: number;
  /** Built-in voltage V_bi, V. */
  builtInVoltage: number;
  /** Reverse bias V_R, V. */
  reverseBias: number;
  profile: DopingProfile;
  /** Grading exponent for the "custom" profile. */
  customM: number;
  loadResistance: number;
  seriesResistance: number;
}

export interface CapacitanceSummary {
  /** Junction capacitance at V_R, F. */
  capacitance: number;
  /** −3 dB frequency of (R_L + R_s) with C_j, Hz. */
  rcBw: number;
  /** (R_L + R_s)·C_j, s. */
  rcTime: number;
}

export function capacitanceSummary(p: CapacitanceInputs): CapacitanceSummary {
  const m = gradingM(p.profile, p.customM);
  const capacitance = junctionCapacitance(p.zeroBiasCap, p.reverseBias, p.builtInVoltage, m);
  const totalResistance = p.loadResistance + p.seriesResistance;
  return { capacitance, rcBw: rcBandwidth(totalResistance, capacitance), rcTime: totalResistance * capacitance };
}
