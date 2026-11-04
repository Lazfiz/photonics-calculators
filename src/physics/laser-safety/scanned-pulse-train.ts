/**
 * Eye exposure limits of a pulsed beam scanned across the eye (a scanning lidar): each pass over an averaging aperture
 * is a group of pulses, and the passes repeat at the scan's rate. SI units: wavelength in m, time in s, energy in J,
 * power in W, lengths in m, angles in rad, frequency in Hz.
 * Model tier: textbook. The scanned-beam evaluation of `scanned-beam.ts` (stationary retinal image, eye on the centre
 * of the scan line, round TEM₀₀ Gaussian beam) with the beam's average power, plus the pulses inside each pass.
 *
 * Source: ICNIRP, Health Phys. 105(3), 271–295 (2013), "Repetitive pulse exposures" (p. 287): every pulse, and every
 * group of pulses, within its limit; on the retina each pulse within C_P times the single-pulse limit, n counting the
 * pulses within T₂. Scanning beams create repetitive-pulse exposures, so the passes are pulses too (IEC 60825-1:2014
 * 4.3 f and ANSI Z136.1 apply the rules to "pulses and pulse groups").
 *
 * Pulses of energy Q and duration τ at the rate f; the beam moves Δx = v/f between pulses. Per limit, Q is held to
 * the least of three:
 * 1. Pulses within one pass (`within`): the stationary train's rules (`trainLimit`) over the pass duration (`scanned-
 *    beam.ts`, the half-power width at that limit's aperture), each pulse taken centred on the aperture. The pulses
 *    inside the half-power points carry at least half the centred energy, so this is conservative by less than 2×,
 *    and it holds every single pulse to G(τ).
 * 2. Passes (`pass`): a pass delivers Q·Σₖη(x₀ + kΔx) through the aperture, η the offset-aperture fraction and x₀ the
 *    pulses' phase. η is log-concave (a disc convolved with a Gaussian; Prékopa), so unimodal, and for a unimodal η
 *    the sum is at most ∫η/Δx + η(0) = (L/v)·Qf·ρ, ρ = 1 + Δx·η(0)/L: the CW pass of the average power Qf, times ρ.
 *    So Q ≤ P_max/(fρ), P_max from `scannedBeamLimits`. ρ → 1 for dense pulses, and for Δx ≫ L the bound is one
 *    centred pulse. Under the actual-exposure rule (note c / note b) the profile is the beam's peak line,
 *    exp(−8x²/d²), with ∫ = d√(π/8) and peak 1: ρ = 1 + Δx/(d√(π/8)). ρ is taken at the pass aperture, the
 *    smallest the limit uses, where η(0)/L is largest (η(0)/L falls as D grows: the profile only widens).
 * 3. Retinal thermal limit, rule 3 across passes (`reduced`): C_P·G(τ) with n = the pulses within min(T, T₂) over
 *    all passes, each pass counted as the pulses whose 1/e² beam overlaps the 7 mm aperture, ⌈(D + d)/Δx⌉. ICNIRP sets
 *    no cut-off for weak pulses; this one stops at 6–10 % of the centred pulse's energy for wide beams (counting down
 *    to 1 % would lower C_P by a further 6–8 %). Pulses closer than T_i also count as one of T_i (IEC 60825-1:2014
 *    4.3 f), as in `trainLimit`; the lower reading is used.
 * The least of the three is then raised to the stationary beam's limit where that is higher: no window of scanned
 * pulses carries more energy through an aperture than the same window of the beam held centred, nor more pulses
 * within T₂, so the stationary limit is never too lax for the scanned beam; it can be higher than the three by a few
 * per cent where the pass duration (half-power width, with all of the pass's energy) is the stricter convention.
 * Brute force over every window of the actual pulse energies (tests) finds the result conservative by 1.0–1.6×;
 * by up to 2× within a pass, more for a narrow beam on the cornea (actual-exposure rule) with drifting phase.
 *
 * Not modelled (as in `scanned-beam.ts`): an eye off the scan line's centre, turning points, raster scans with several
 * lines per frame over the pupil, several beams (multi-channel lidars), a moving retinal image.
 */

import { timeT2, type EyeLimitKind } from "./eye-exposure-limits";
import { effectiveDiameterAt, type BeamGeometry } from "./hazard-distance";
import {
  correctionCP, limitMaxEnergy, pulseLimits, pulsesIn, pulseTrainLimits, timeTi, trainLimit, type TrainLimit,
} from "./pulse-train";
import { offsetApertureFraction, passLength, scannedBeamLimits, type Scan, type ScannedLimit, type ScanStatus } from "./scanned-beam";

/** A lidar's pulses, before the scan. */
export interface LidarPulses {
  /** Pulse duration τ, s. */
  readonly duration: number;
  /** Pulse repetition frequency f, Hz (> 0). */
  readonly prf: number;
}

export type ScannedPulseLevel = "pulse" | "pass" | "reduced" | "stationary";

/** One eye limit; energies in J per pulse. */
export interface ScannedPulseLimit {
  readonly kind: EyeLimitKind;
  /** The pulses within one pass, as a stationary train over the pass duration. */
  readonly within: TrainLimit;
  /** The passes at the average power (W), from `scannedBeamLimits`. */
  readonly pass: ScannedLimit;
  /** ρ ≥ 1: the most a pass can carry over the average-power pass, for the pulses' worst phase. */
  readonly ripple: number;
  /** Pulse energy at which the passes reach their limit: P_max/(fρ), J. */
  readonly passPerPulse: number;
  /** Pulses each pass puts through the aperture, counted for C_P (0 except for the retinal thermal limit). */
  readonly pulsesPerPass: number;
  /** n for rule 3 across passes: pulses (or T_i groups) within min(T, T₂). */
  readonly cpCount: number;
  readonly cp: number;
  /** Rule 3 across passes, J; Infinity except for the retinal thermal limit. */
  readonly reduced: number;
  /** The same pulses from a beam held centred on the eye for the exposure, J: a floor for qMax. */
  readonly stationary: number;
  readonly qMax: number;
  readonly level: ScannedPulseLevel;
}

export interface ScannedPulseLimits {
  /** As `scannedBeamLimits`; also "invalid" for f ≤ 0, τ ≤ 0 or fτ > 1. */
  readonly status: ScanStatus;
  readonly limits: readonly ScannedPulseLimit[];
  /** Largest energy per pulse within every limit, J; NaN unless status is "ok" and some limit applies. */
  readonly qMax: number;
  readonly limiting: EyeLimitKind | null;
  readonly level: ScannedPulseLevel | null;
}

/**
 * Every eye limit at λ (m) for pulses `pulses` in a beam of 1/e² diameter d (m) at the eye, scanned as `scan`, from a
 * source subtending α (rad; default a point source): the largest energy per pulse at each level, and the one that binds.
 */
export function scannedPulseLimits(lambda: number, d: number, pulses: LidarPulses, scan: Scan, alpha = 0): ScannedPulseLimits {
  const { duration: tau, prf: f } = pulses;
  const invalid: ScannedPulseLimits = { status: "invalid", limits: [], qMax: NaN, limiting: null, level: null };
  if (!(tau > 0 && f > 0 && f * tau <= 1 && scan.exposure >= tau)) return invalid;
  const cw = scannedBeamLimits(lambda, d, scan, alpha);
  if (cw.status !== "ok") return { ...invalid, status: cw.status };
  const T = scan.exposure;
  const dx = scan.speed / f;
  const limits: ScannedPulseLimit[] = [];
  for (const limit of pulseLimits(lambda, alpha)) {
    const pass = cw.limits.find((l) => l.kind === limit.kind);
    if (!pass) continue;
    const G = (t: number) => limitMaxEnergy(limit, d, t);
    const within = trainLimit(lambda, limit, { duration: tau, prf: f, exposure: Math.max(tau, Math.min(T, pass.passDuration)) }, G, alpha);
    const D = pass.aperture;
    const ripple = pass.actual
      ? 1 + dx / (d * Math.sqrt(Math.PI / 8))
      : 1 + (dx * offsetApertureFraction(d, D, 0)) / passLength(d, D);
    // A point beam under the actual-exposure rule: P_max is 0 and ρ infinite; the limit is 0.
    const passPerPulse = pass.qMax === 0 ? 0 : pass.qMax / (f * ripple);
    let rule3 = { reduced: Infinity, cp: 1, cpCount: 0, pulsesPerPass: 0 };
    if (limit.kind === "retinalThermal") {
      const perPass = Math.max(1, Math.ceil((D + d) / dx));
      const window = Math.min(T, timeT2(alpha));
      const passes = Math.min(pass.passes, Math.floor(window * scan.rate + 1e-9) + 1);
      const n = passes * perPass;
      const cp = correctionCP(lambda, alpha, n, tau, T);
      rule3 = { reduced: cp * G(tau), cp, cpCount: n, pulsesPerPass: perPass };
      const Ti = timeTi(lambda);
      const k = tau < Ti ? Math.min(perPass, pulsesIn(Ti, tau, f)) : 1;
      if (k > 1) {
        const groups = passes * Math.ceil(perPass / k);
        const cpGroups = correctionCP(lambda, alpha, groups, Ti, T);
        const reduced = (cpGroups * G(Ti)) / k;
        if (reduced < rule3.reduced) rule3 = { reduced, cp: cpGroups, cpCount: groups, pulsesPerPass: perPass };
      }
    }
    const values = [within.qMax, passPerPulse, rule3.reduced];
    const i = values.reduce((best, x, j) => (x < values[best] ? j : best), 0);
    const stationary = trainLimit(lambda, limit, { duration: tau, prf: f, exposure: T }, G, alpha).qMax;
    const [qMax, level] = stationary > values[i] ? [stationary, "stationary" as const] : [values[i], (["pulse", "pass", "reduced"] as const)[i]];
    limits.push({ kind: limit.kind, within, pass, ripple, passPerPulse, ...rule3, stationary, qMax, level });
  }
  if (limits.length === 0) return invalid;
  const worst = limits.reduce((a, b) => (b.qMax < a.qMax ? b : a));
  return { status: "ok", limits, qMax: worst.qMax, limiting: worst.kind, level: worst.level };
}

/**
 * Largest energy per pulse, J, for an eye r (m) from a scanning lidar: the scanned limits of the beam there (1/e²
 * diameter from `beam`, scan from `scanAt(r)`), or the stationary train's over the exposure wherever the scanned
 * evaluation doesn't apply: the sweep doesn't clear the aperture (the beam never leaves the eye; r = 0), or the exposure
 * is shorter than one pass. NaN for invalid pulses.
 */
export function lidarMaxEnergyAt(lambda: number, beam: BeamGeometry, pulses: LidarPulses, scanAt: (r: number) => Scan, r: number, alpha = 0): number {
  const d = effectiveDiameterAt(beam, r);
  const scan = scanAt(r);
  const scanned = scannedPulseLimits(lambda, d, pulses, scan, alpha);
  if (scanned.status === "ok") return scanned.qMax;
  return pulseTrainLimits(lambda, d, { ...pulses, exposure: scan.exposure }, alpha).qMax;
}

/**
 * Hazard distance, m, of a scanning lidar with pulses of energy Q (J): the farthest r in (0, rMax] where Q exceeds
 * `lidarMaxEnergyAt`. Q/qMax isn't monotonic in r (C_P counts and the ripple change with the speed), so the ratio is
 * sampled on 96 log-spaced ranges from rMax·1e-6 and the last crossing refined by bisection (relative 1e-6). 0 if
 * within at every sample; rMax if still over there; NaN for invalid input. Grid-limited: a hazard narrower than a
 * sample step (15 %) can be missed; `rMax` should be a few times the stationary NOHD, which bounds it. A NaN limit
 * counts as over.
 */
export function lidarHazardDistance(lambda: number, Q: number, beam: BeamGeometry, pulses: LidarPulses, scanAt: (r: number) => Scan, rMax: number, alpha = 0): number {
  if (!(Q >= 0 && rMax > 0)) return NaN;
  const over = (r: number) => !(Q <= lidarMaxEnergyAt(lambda, beam, pulses, scanAt, r, alpha));
  if (Number.isNaN(lidarMaxEnergyAt(lambda, beam, pulses, scanAt, rMax, alpha))) return NaN;
  if (over(rMax)) return rMax;
  const STEPS = 96;
  const rMin = rMax * 1e-6;
  const at = (i: number) => rMin * Math.pow(rMax / rMin, i / STEPS);
  let i = STEPS - 1;
  while (i >= 0 && !over(at(i))) i--;
  if (i < 0) return 0;
  let lo = at(i);
  let hi = at(i + 1);
  for (let k = 0; k < 60 && hi / lo - 1 > 1e-6; k++) {
    const mid = Math.sqrt(lo * hi);
    if (over(mid)) lo = mid;
    else hi = mid;
  }
  return hi;
}
