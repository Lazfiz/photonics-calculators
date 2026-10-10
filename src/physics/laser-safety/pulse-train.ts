/**
 * Eye exposure limits of a repetitively pulsed beam: ICNIRP 2013's three rules for repetitive pulses on the limits of
 * `eye-exposure-limits.ts`, extended below 1 ns with Table 5's ultrashort-pulse rows. SI units: wavelength in m, time
 * in s, frequency in Hz, energy in J, diameters in m, angles in rad, radiant exposure in J/m².
 * Model tier: exact, i.e. the rules as published; a regular train of identical pulses and a round TEM₀₀ Gaussian beam
 * centred on each averaging aperture.
 *
 * Source: ICNIRP, "Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm",
 * Health Phys. 105(3), 271–295 (2013): "Repetitive pulse exposures" (p. 287), Table 4 (T₂, T_i), Table 5.
 *
 * A train: pulses of energy Q and duration τ at the repetition rate f, for an exposure T from the start of the first
 * pulse to the end of the last, so N = ⌊(T − τ)f⌋ + 1 pulses. G(t) is the largest beam energy within a limit when
 * delivered in t: H(t) over the aperture's average, H(t)·(πD²/4) / (1 − exp(−2D²/d²)). Per limit, the energy per
 * pulse is the least of:
 * 1. Single pulse: G(τ), the limit for one pulse of that duration.
 * 2. Pulse groups: G(T_n)/n for every n = 2 … N consecutive pulses, spanning T_n = τ + (n − 1)/f. The full train is
 *    the average-power rule; groups inside T_i add their energies as IEC 60825-1 and ANSI Z136.1 do.
 * 3. Retinal thermal limit only: C_P·G(τ), with n the number of pulses within min(T, T₂):
 *    a. α ≤ 5 mrad, pulses longer than T_i: C_P = 1.
 *    b. α > 5 mrad, pulses longer than T_i: n^−0.25, but 0.4 for n > 40 if α ≤ α_max(τ), 0.2 for n > 625 if
 *       α_max(τ) < α < 100 mrad; 1 from 100 mrad. α is the full subtense, not cut at α_max.
 *    c. Pulses of T_i or shorter: 1 for T ≤ 0.25 s; beyond, 5 n^−0.25 for more than 600 pulses (here min(1, 5 n^−0.25)).
 *       ICNIRP applies this in the visible only to intentional viewing, i.e. a T chosen above 0.25 s. IEC 60825-1:2014
 *       floors it at 0.4 (Schulmeister 2017); ICNIRP states no floor, so none here.
 *    Pulses closer than T_i count as one (IEC 60825-1:2014 4.3 f; ANSI Z136.1 applies C_P to "pulses and pulse
 *    groups"): the k pulses that fit in T_i are one pulse of duration T_i and energy kQ, so the energy per pulse is
 *    C_P·G(T_i)/k with n the number of groups. For a regular point-source train rule 2 is lower whenever this applies;
 *    it binds for large sources, whose average limit C_E raises more than the single-pulse one.
 * T_i (Table 4) is 5 µs for 400–1050 nm and 13 µs for 1050–1400 nm, where Table 5's flat short-pulse piece ends.
 *
 * Below 1 ns (Table 5): the retinal thermal limit is 1.0 C_E mJ/m² (× C_C from 1050 nm, no C_A) from 100 fs to 10 ps
 * and its 1 ns value from 10 ps. Below 100 fs, and below 1 ns for the cornea and anterior segment, ICNIRP holds the
 * irradiance at its value at the shortest tabulated duration ("For exposure durations shorter than those defined in
 * Table 5"), so H ∝ t. Each aperture keeps its 1 ns size.
 *
 * Rule 1 uses the limit at τ alone, as written. (`limitMaxPower`·τ, the CW reading, also holds every shorter part of
 * the pulse to its limit; the two differ only by the tables' rounding at joints and on an extended source's t^1.25
 * piece.) Not modelled: irregular trains and bursts, scanned beams, skin, the advice to use the actual radiant exposure
 * of beams narrower than 1 mm (Table 5 note c).
 */

import {
  alphaMax, apertureIrradiance, correctionCC, correctionCE, eyeLimits, exposureLimit, limitingAperture, timeT2,
  T_MAX, T_MIN, type EyeLimit, type EyeLimitKind, type Piece, type TabulatedLimit,
} from "./eye-exposure-limits";

/** 100 fs, the shortest duration in ICNIRP 2013 Table 5 (retinal rows). */
export const T_ULTRASHORT = 1e-13;
/** 10 ps, where Table 5's second retinal row starts. */
const T_10PS = 1e-11;

/** λ (m) → nm, rounded to 1 fm (as in eye-exposure-limits.ts). */
const toNm = (lambda: number) => Math.round(lambda * 1e15) / 1e6;

/** T_i, s: 5 µs for 400–1050 nm, 13 µs for 1050–1400 nm (ICNIRP 2013 Table 4); NaN outside 400–1400 nm. */
export function timeTi(lambda: number): number {
  const nm = toNm(lambda);
  return nm >= 400 && nm < 1050 ? 5e-6 : nm >= 1050 && nm < 1400 ? 13e-6 : NaN;
}

/**
 * The eye limits at λ (m) for a source subtending α (rad), defined from t = 0: `eyeLimits` with Table 5's sub-ns rows
 * prepended (see the module comment). The photochemical limit starts at 10 s and is unchanged.
 */
export function pulseLimits(lambda: number, alpha = 0): EyeLimit[] {
  return eyeLimits(lambda, alpha).map((limit) => {
    const first = limit.pieces[0];
    if (first.t0 > T_MIN) return limit;
    const h1 = first.a * Math.pow(T_MIN, first.p);
    let short: Piece[];
    if (limit.kind === "retinalThermal") {
      const h = 1e-3 * correctionCE(alpha, T_MIN) * (toNm(lambda) >= 1050 ? correctionCC(lambda) : 1);
      short = [
        { t0: 0, t1: T_ULTRASHORT, a: h / T_ULTRASHORT, p: 1 },
        { t0: T_ULTRASHORT, t1: T_10PS, a: h, p: 0 },
        { t0: T_10PS, t1: T_MIN, a: h1, p: 0 },
      ];
    } else short = [{ t0: 0, t1: T_MIN, a: h1 / T_MIN, p: 1 }];
    const [ap, ...rest] = limit.apertures;
    return { ...limit, pieces: [...short, ...limit.pieces], apertures: [{ ...ap, t0: 0 }, ...rest] };
  });
}

/** G(t), J: the largest energy of a beam (1/e² diameter d, m) delivered in t (s) within the limit; Infinity where the limit doesn't apply. */
export function limitMaxEnergy(limit: TabulatedLimit, d: number, t: number): number {
  const H = exposureLimit(limit, t);
  return Number.isNaN(H) ? Infinity : H / apertureIrradiance(1, d, limitingAperture(limit, t));
}

/** A regular train of identical pulses. */
export interface PulseTrain {
  /** Pulse duration τ, s. */
  readonly duration: number;
  /** Pulse repetition frequency f, Hz; 0 for a single pulse. */
  readonly prf: number;
  /** Exposure duration T, s: from the start of the first pulse to the end of the last; at least τ. */
  readonly exposure: number;
}

const validTrain = ({ duration: tau, prf: f, exposure: T }: PulseTrain) =>
  tau > 0 && f >= 0 && f * tau <= 1 && T >= tau && T <= T_MAX;

/** Pulses fully inside a window of length w (s) that starts with a pulse: ⌊(w − τ)f⌋ + 1 (the 1e-9 absorbs rounding). */
const pulsesIn = (w: number, tau: number, f: number) => (w < tau ? 0 : Math.floor((w - tau) * f + 1e-9) + 1);

/** Number of pulses N in the exposure; NaN for an invalid train (τ ≤ 0, f < 0, f·τ > 1, T < τ or T > 30 ks). */
export function pulseCount(train: PulseTrain): number {
  if (!validTrain(train)) return NaN;
  return train.prf > 0 ? pulsesIn(train.exposure, train.duration, train.prf) : 1;
}

/**
 * C_P (ICNIRP 2013 rule 3, retinal thermal limit) for n pulses (or pulse groups) of duration τ (s) in an exposure of
 * T (s), at λ (m) from a source subtending α (rad). NaN outside 400–1400 nm.
 */
export function correctionCP(lambda: number, alpha: number, n: number, tau: number, T: number): number {
  const Ti = timeTi(lambda);
  if (Number.isNaN(Ti)) return NaN;
  if (!(n > 1)) return 1;
  if (tau > Ti) {
    if (alpha <= 5e-3 || alpha >= 0.1) return 1;
    if (alpha <= alphaMax(tau)) return n <= 40 ? Math.pow(n, -0.25) : 0.4;
    return n <= 625 ? Math.pow(n, -0.25) : 0.2;
  }
  return T <= 0.25 ? 1 : Math.min(1, 5 * Math.pow(n, -0.25));
}

/**
 * Rule 2: the least G(T_n)/n over n = 2 … N, T_n = τ + (n − 1)/f, and the n that sets it (Infinity and 0 for N = 1).
 * On a piece with a fixed aperture G = c·t^p, and g(t) = G(t)/(f(t − τ) + 1) has d ln g / d ln t = p − ft/(ft + 1 − fτ),
 * which falls with t (fτ ≤ 1): g rises, then falls, so its least value over the T_n on the piece is at the first or the
 * last. Those n are taken around every joint, with 2 and N. While the corneal aperture grows (0.35–10 s), g can dip
 * inside a piece, so it is scanned there (64 points in log t, then golden-section search) and the n beside the dip
 * are added.
 */
function groupRule(limit: TabulatedLimit, d: number, tau: number, f: number, N: number): { q: number; n: number } {
  if (!(N >= 2)) return { q: Infinity, n: 0 };
  const tPair = tau + 1 / f;
  const TN = tau + (N - 1) / f;
  const nAt = (t: number) => Math.min(N, Math.max(2, pulsesIn(t, tau, f)));
  const candidates = new Set<number>([2, N]);
  const add = (n: number) => {
    for (const m of [n - 1, n, n + 1]) if (m >= 2 && m <= N) candidates.add(m);
  };
  const g = (t: number) => limitMaxEnergy(limit, d, t) / (f * (t - tau) + 1);
  for (const s of [...limit.pieces, ...limit.apertures]) for (const t of [s.t0, s.t1]) if (t > tPair && t < TN) add(nAt(t));
  for (const ap of limit.apertures) {
    if (ap.q === 0) continue;
    const a = Math.max(ap.t0, tPair);
    const b = Math.min(ap.t1, TN);
    if (!(b > a)) continue;
    const k = 64;
    const ts = Array.from({ length: k + 1 }, (_, i) => a * Math.pow(b / a, i / k));
    let best = 0;
    for (let i = 1; i <= k; i++) if (g(ts[i]) < g(ts[best])) best = i;
    let lo = Math.log(ts[Math.max(best - 1, 0)]);
    let hi = Math.log(ts[Math.min(best + 1, k)]);
    const phi = (Math.sqrt(5) - 1) / 2;
    for (let i = 0; i < 60; i++) {
      const m1 = hi - phi * (hi - lo);
      const m2 = lo + phi * (hi - lo);
      if (g(Math.exp(m1)) <= g(Math.exp(m2))) hi = m2;
      else lo = m1;
    }
    add(nAt(Math.exp((lo + hi) / 2)));
  }
  let q = Infinity;
  let nBest = 0;
  for (const n of candidates) {
    const v = limitMaxEnergy(limit, d, tau + (n - 1) / f) / n;
    if (v < q) [q, nBest] = [v, n];
  }
  return { q, n: nBest };
}

export type PulseRule = 1 | 2 | 3;

export interface TrainLimit {
  readonly kind: EyeLimitKind;
  /** Rule 1: largest energy of one pulse, J (Infinity where the limit doesn't apply at τ). */
  readonly singlePulse: number;
  /** Rule 2: largest energy per pulse from every group of 2 … N pulses, J (Infinity for one pulse). */
  readonly group: number;
  /** Number of pulses in the group that sets `group` (0 for one pulse). */
  readonly groupPulses: number;
  /** Rule 3: C_P times the single-pulse (or T_i-group) limit, per pulse, J; Infinity except for the retinal thermal limit. */
  readonly reduced: number;
  /** C_P (1 except for the retinal thermal limit). */
  readonly cp: number;
  /** n that C_P is taken at: pulses, or T_i groups, within min(T, T₂). */
  readonly cpCount: number;
  /** Pulses per T_i group (1: no grouping). */
  readonly perGroup: number;
  /** The least of the three, J per pulse. */
  readonly qMax: number;
  /** The rule that sets qMax (the lower rule on a tie). */
  readonly rule: PulseRule;
}

export interface TrainLimits {
  /** Pulses in the exposure, N; NaN for invalid input. */
  readonly pulses: number;
  readonly limits: readonly TrainLimit[];
  /** Largest energy per pulse within every limit, J; NaN for invalid input or no limit. */
  readonly qMax: number;
  readonly limiting: EyeLimitKind | null;
  readonly rule: PulseRule | null;
}

/** Index of the least value; ties go to the earlier one. */
const argMin = (xs: readonly number[]) => xs.reduce((best, x, i) => (x < xs[best] ? i : best), 0);

/**
 * Every eye limit at λ (m) for a pulse train in a beam of 1/e² diameter d (m) at the eye, from a source subtending α
 * (rad; default a point source): the largest energy per pulse under each rule, and the one that binds.
 */
export function pulseTrainLimits(lambda: number, d: number, train: PulseTrain, alpha = 0): TrainLimits {
  const N = pulseCount(train);
  const invalid: TrainLimits = { pulses: NaN, limits: [], qMax: NaN, limiting: null, rule: null };
  if (Number.isNaN(N) || !(d >= 0)) return invalid;
  const { duration: tau, prf: f, exposure: T } = train;
  const limits = pulseLimits(lambda, alpha).map((limit): TrainLimit => {
    const singlePulse = limitMaxEnergy(limit, d, tau);
    const { q: group, n: groupPulses } = groupRule(limit, d, tau, f, N);
    let reduced = Infinity;
    let cp = 1;
    let cpCount = 0;
    let perGroup = 1;
    if (limit.kind === "retinalThermal" && N >= 2) {
      const Ti = timeTi(lambda);
      const inT2 = Math.min(N, pulsesIn(Math.min(T, timeT2(alpha)), tau, f));
      perGroup = tau < Ti ? Math.min(N, pulsesIn(Ti, tau, f)) : 1;
      const tEff = perGroup > 1 ? Ti : tau;
      cpCount = Math.ceil(inT2 / perGroup);
      cp = correctionCP(lambda, alpha, cpCount, tEff, T);
      reduced = (cp * limitMaxEnergy(limit, d, tEff)) / perGroup;
    }
    const values = [singlePulse, group, reduced];
    const i = argMin(values);
    return { kind: limit.kind, singlePulse, group, groupPulses, reduced, cp, cpCount, perGroup, qMax: values[i], rule: (i + 1) as PulseRule };
  });
  if (limits.length === 0) return { ...invalid, pulses: N };
  const worst = limits[argMin(limits.map((l) => l.qMax))];
  return { pulses: N, limits, qMax: worst.qMax, limiting: worst.kind, rule: worst.rule };
}

/**
 * Smallest 1/e² diameter, m, at which pulses of energy Q (J) in this train stay within every eye limit at λ (m); 0 if
 * they do with all the energy inside each aperture. Each rule's energy is G ∝ 1/(1 − exp(−2D²/d²)), which grows with
 * d, so Q/qMax falls with d: the diameter is bracketed by doubling and found by bisection in log d (relative 1e-10).
 * NaN for Q < 0 or an invalid train.
 */
export function pulseTrainSafeDiameter(lambda: number, Q: number, train: PulseTrain, alpha = 0): number {
  const within = (d: number) => Q <= pulseTrainLimits(lambda, d, train, alpha).qMax;
  if (!(Q >= 0) || Number.isNaN(pulseTrainLimits(lambda, 0, train, alpha).qMax)) return NaN;
  if (within(0)) return 0;
  let hi = 1e-3;
  for (let i = 0; i < 200 && !within(hi); i++) hi *= 2;
  let lo = hi / 2;
  while (lo > 1e-12 && within(lo)) lo /= 2;
  for (let i = 0; i < 200 && hi / lo - 1 > 1e-10; i++) {
    const mid = Math.sqrt(lo * hi);
    if (within(mid)) hi = mid;
    else lo = mid;
  }
  return hi;
}
