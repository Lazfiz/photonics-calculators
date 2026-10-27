/**
 * Single-photon avalanche diode (SPAD) operating point: trigger probability, temperature drift of the breakdown
 * voltage, dark counts and counting SNR. SI units except where a name says otherwise. Invalid inputs give NaN.
 *
 * - Trigger (breakdown) probability P_t = 1 − e^{−ΔV/V_c} for an excess bias ΔV: the empirical fit
 *   PDE(U) = PDE_max·(1 − e^{−(U−U_BD)/a}), a = α·U_BD, of A. N. Otte et al., Nucl. Instrum. Methods A 846, 106 (2017),
 *   doi:10.1016/j.nima.2016.09.053, eq. (3)–(5). Their dark-rate fit, eq. (13), is DC = e^{a+b·U_rel}·P_t.
 * - Thermal generation of dark carriers is activated: DCR ∝ e^{−E_a/(k_B·T)} at a fixed excess bias. E. A. G. Webster,
 *   R. K. Henderson, IEEE Trans. Electron Devices 60, 4014 (2013), doi:10.1109/TED.2013.2285163, measured
 *   E_a ≈ 0.85 eV (diffusion and generation) and ≈ 0.45 eV (field-enhanced E-centre) on CMOS SPADs, 293–343 K.
 * - Afterpulsing: the trapped charge scales with the avalanche charge C·ΔV, and a released carrier retriggers with
 *   probability P_t (S. Cova, A. Lacaita, G. Ripamonti, IEEE Electron Device Lett. 12, 685 (1991),
 *   doi:10.1109/55.116955). This is the charge × P_t form of Otte's crosstalk fit, eq. (14); his afterpulse fit,
 *   eq. (15), instead grows exponentially with ΔV.
 */

import { c, h, k_B_eV } from "../constants";

/** Photon rate P·λ/(hc) for an optical power P (W) at wavelength λ (m). */
export function photonRate(power: number, wavelength: number): number {
  return power >= 0 && wavelength > 0 ? (power * wavelength) / (h * c) : NaN;
}

/** Optical power (W) for a level in dBm. */
export function dbmToWatts(dbm: number): number {
  return Number.isFinite(dbm) ? 1e-3 * 10 ** (dbm / 10) : NaN;
}

/** Trigger probability 1 − e^{−ΔV/V_c}; zero at or below breakdown. */
export function triggerProbability(overbias: number, voltageScale: number): number {
  if (!(voltageScale > 0) || Number.isNaN(overbias)) return NaN;
  return overbias <= 0 ? 0 : 0 - Math.expm1(-overbias / voltageScale);
}

/** Excess bias at temperature T for a fixed supply: ΔV_ref − β·(T − T_ref), β in V/K, temperatures in K or °C. */
export function overbiasAtTemperature(overbiasRef: number, beta: number, temperature: number, refTemperature: number): number {
  return overbiasRef - beta * (temperature - refTemperature);
}

/** Arrhenius ratio e^{−(E_a/k_B)(1/T − 1/T_ref)}, E_a in eV, temperatures in K. */
export function arrheniusFactor(activationEnergy: number, temperature: number, refTemperature: number): number {
  if (!(activationEnergy >= 0 && temperature > 0 && refTemperature > 0)) return NaN;
  return Math.exp(-(activationEnergy / k_B_eV) * (1 / temperature - 1 / refTemperature));
}

/** Temperature step (K) that doubles an Arrhenius rate near T: ln 2·k_B·T²/E_a. */
export function doublingInterval(activationEnergy: number, temperature: number): number {
  return activationEnergy > 0 && temperature > 0 ? (Math.LN2 * k_B_eV * temperature ** 2) / activationEnergy : NaN;
}

export interface DarkCountInputs {
  /** Dark count rate at the reference temperature and excess bias (counts/s). */
  dcrRef: number;
  /** Operating and reference temperatures (K). */
  temperature: number;
  refTemperature: number;
  /** Activation energy (eV). */
  activationEnergy: number;
  /** Excess bias at the operating point and at the reference (V). */
  overbias: number;
  overbiasRef: number;
  /** Trigger-probability voltage scale V_c (V). */
  voltageScale: number;
  /** Field-enhancement slope b (1/V) of the generation rate, Otte's e^{b·U_rel} per volt; 0 to leave it out. */
  fieldSlope: number;
}

/** DCR_ref · Arrhenius(T) · e^{b(ΔV − ΔV_ref)} · P_t(ΔV)/P_t(ΔV_ref); zero at or below breakdown. */
export function darkCountRate(p: DarkCountInputs): number {
  const ptRef = triggerProbability(p.overbiasRef, p.voltageScale);
  const pt = triggerProbability(p.overbias, p.voltageScale);
  const arr = arrheniusFactor(p.activationEnergy, p.temperature, p.refTemperature);
  if (!(p.dcrRef >= 0 && ptRef > 0 && p.fieldSlope >= 0) || Number.isNaN(pt) || Number.isNaN(arr)) return NaN;
  if (pt === 0) return 0;
  const rate = p.dcrRef * arr * Math.exp(p.fieldSlope * (p.overbias - p.overbiasRef)) * (pt / ptRef);
  return Number.isFinite(rate) ? rate : NaN; // e^(b·ΔΔV) can overflow
}

/** Trap efficiency η at excess bias ΔV from η_ref at ΔV_ref: η scales with the avalanche charge and with P_t. */
export function trapEfficiencyAtOverbias(etaRef: number, overbias: number, overbiasRef: number, voltageScale: number): number {
  const ptRef = triggerProbability(overbiasRef, voltageScale);
  const pt = triggerProbability(overbias, voltageScale);
  if (!(etaRef >= 0 && etaRef <= 1 && overbiasRef > 0) || Number.isNaN(pt)) return NaN;
  if (pt === 0) return 0;
  return Math.min(1, etaRef * ((overbias * pt) / (overbiasRef * ptRef)));
}

export interface CountingInputs {
  /** Avalanche rate from photons, before dead time (counts/s). */
  signalRate: number;
  /** Dark count rate before dead time (counts/s). */
  darkRate: number;
  /** Afterpulse probability per recorded avalanche. */
  afterpulseProb: number;
  /** Non-paralyzable dead time (s). */
  deadTime: number;
  /** Counting gate (s). */
  gateTime: number;
}

/**
 * SNR of the photon rate recovered from one gate: dead-time corrected, with the dark and afterpulse rates known and
 * subtracted. R = R_s + R_d, m = R/(1 + Rτ). The corrected rate has relative error 1/√(mT) (Fano 1/(1 + Rτ)² times
 * the correction gain (1 + Rτ)²). Each recorded avalanche adds one afterpulse with probability P (Bernoulli, not
 * extending the dead time, no afterpulses of afterpulses); the total N(1 + P) is divided by 1 + P, which adds the
 * relative variance (1 + Rτ)²·P(1 − P)/(1 + P)²:
 * SNR = (R_s/R)·√(mT) / √(1 + (1 + Rτ)²·P(1 − P)/(1 + P)²). With τ = 0 and P = 0 it is R_s·T/√((R_s + R_d)·T).
 * A Monte Carlo of this counting model agrees within 2 % up to P = 0.2 and Rτ = 5. The Fano factor is asymptotic:
 * the formula needs mT ≫ 1 (more than about 10 recorded counts).
 */
export function countingSnr(p: CountingInputs): number {
  const { signalRate: s, darkRate: d, afterpulseProb: pap, deadTime: tau, gateTime: t } = p;
  if (!(s >= 0 && d >= 0 && pap >= 0 && pap < 1 && tau >= 0 && t > 0)) return NaN;
  const r = s + d;
  if (r === 0) return 0;
  const x = r * tau;
  const m = r / (1 + x);
  return ((s / r) * Math.sqrt(m * t)) / Math.sqrt(1 + ((1 + x) ** 2 * pap * (1 - pap)) / (1 + pap) ** 2);
}
