/**
 * Eye exposure limits of a CW beam scanned across the eye: each pass over an averaging aperture is one pulse, and the
 * passes form a pulse train under ICNIRP 2013's repetitive-pulse rules (`pulse-train.ts`). SI units: wavelength in m,
 * time in s, power in W, lengths in m, angles in rad, frequency in Hz.
 * Model tier: textbook. The evaluation with a small, stationary retinal image, which IEC 60825-1:2014 allows as the
 * default for scanned emission (5.4.2) and which is the most restrictive way to account for the scan; a round TEM₀₀
 * Gaussian beam whose axis crosses the centre of the aperture at constant speed.
 *
 * Sources: ICNIRP, Health Phys. 105(3), 271–295 (2013), "Repetitive pulse exposures" (p. 287): "Scanning beams create
 * repetitive-pulse exposures of the eye", and the same three rules apply. K. Schulmeister, "Extended source AEL analysis
 * of scanned laser emission for IEC 60825-1", White Paper Ed. 2, Seibersdorf Laboratories (2025): one pass across the
 * 7 mm aperture stop is one pulse (ch. 1); its duration is the pass duration across the centre of the aperture stop
 * (6.2.3), i.e. between the half-peak-power points (IEC 60825-1:2014 3.69), while the energy is all of the pass, also
 * outside those points (4.2.5); with the eye accommodated to the scan's pivot point the retinal image doesn't move
 * (3.4.5), so every pass lands on the same retinal spot.
 *
 * Pass: with the beam axis a distance x from the centre of an aperture of diameter D, the aperture passes the fraction
 * η(x) of the power. At speed v the aperture sees P·η(vt): a pulse of duration W/v (W: full width of η at half its
 * peak) and energy P·L/v, L = ∫η(x)dx = ∫ over the aperture of the beam's profile integrated along the scan, which
 * is D for a beam much narrower than the aperture. Each limit uses its own aperture (7 mm for the retina; 1 mm for the
 * cornea up to 0.35 s, growing to 3.5 mm at 10 s), so the pass duration differs per limit; a group of passes spanning
 * t is held to H(t) over the aperture at t. In units of beam power, G(t) = H(t)·(πD²/4)·v/L is the largest power for
 * one pass delivered within t, and the rules of `trainLimit` apply to it.
 *
 * Not modelled: an eye off the centre of the scan line (passes come in unevenly spaced pairs near the turning points,
 * where the beam also slows), sinusoidal (resonant) scans, raster scans (several lines per frame cross the pupil),
 * pulsed lasers (each pass a group of pulses), a moving retinal image (accommodation to infinity: less restrictive),
 * and IEC 60825-1's angle-of-acceptance analysis of extended images.
 */

import { normalCdf } from "../math";
import {
  eyeLimits, exposureLimit, limitingAperture, limitMaxPower, T_MAX, T_MIN, type EyeLimitKind,
} from "./eye-exposure-limits";
import { pulseCount, pulseLimits, trainLimit, type PulseRule, type TrainLimit } from "./pulse-train";

/** Simpson intervals across the aperture (even); 64 agree with 200 to 2e-14 for d/D = 0.0014 – 14. */
const SIMPSON = 64;

/**
 * ∫ φ_σ(y)·h(c(y)) dy over the aperture's chord positions y ∈ [−R, R], c = √(R² − y²), with φ_σ the beam's
 * profile across the scan (normal, σ = d/4 for a 1/e² diameter d). Substituting y = R sin θ keeps the integrand smooth
 * at the aperture's edge; |y| > 9σ (φ below 1e-17 of its peak) is left out. Composite Simpson.
 */
function acrossAperture(sigma: number, R: number, h: (c: number) => number): number {
  const thetaMax = sigma * 9 >= R ? Math.PI / 2 : Math.asin((sigma * 9) / R);
  const step = (2 * thetaMax) / SIMPSON;
  let sum = 0;
  for (let i = 0; i <= SIMPSON; i++) {
    const theta = -thetaMax + i * step;
    const y = R * Math.sin(theta);
    const c = R * Math.cos(theta);
    const phi = Math.exp(-(y * y) / (2 * sigma * sigma)) / (Math.sqrt(2 * Math.PI) * sigma);
    const w = i === 0 || i === SIMPSON ? 1 : i % 2 === 1 ? 4 : 2;
    sum += w * phi * h(c) * c; // dy = c dθ
  }
  return (sum * step) / 3;
}

/** Φ(x) for x ≤ 0, taken as 0 below −9 (Φ(−9) = 1.1e-19, far below the quadrature's accuracy). */
const lowerTail = (x: number) => (x < -9 ? 0 : normalCdf(x));

/** Φ(a) − Φ(b) for a ≥ b, from the nearer tail. */
function normalBand(a: number, b: number): number {
  if (b >= 0) return lowerTail(-b) - lowerTail(-a);
  if (a <= 0) return lowerTail(a) - lowerTail(b);
  return 1 - lowerTail(-a) - lowerTail(b);
}

/**
 * Fraction of a round Gaussian beam's power (1/e² diameter d, m) that passes a circular aperture of diameter D (m)
 * whose centre is x (m) from the beam axis. At x = 0 it is 1 − exp(−2D²/d²); d = 0 gives 1 inside, ½ on the edge,
 * 0 outside. NaN for d < 0 or D ≤ 0.
 */
export function offsetApertureFraction(d: number, D: number, x: number): number {
  if (!(d >= 0 && D > 0)) return NaN;
  const R = D / 2;
  const ax = Math.abs(x);
  if (d === 0) return ax < R ? 1 : ax === R ? 0.5 : 0;
  const sigma = d / 4;
  // Across the scan the aperture spans x − c … x + c at chord position y.
  return acrossAperture(sigma, R, (c) => normalBand((ax + c) / sigma, (ax - c) / sigma));
}

/** L = ∫ η(x) dx over the whole pass, m: the beam's profile integrated along the scan, over the aperture. D for d = 0. */
export function passLength(d: number, D: number): number {
  if (!(d >= 0 && D > 0)) return NaN;
  if (d === 0) return D;
  return acrossAperture(d / 4, D / 2, (c) => 2 * c);
}

/**
 * W, m: the full width of η(x) at half its peak (η is largest at x = 0 and falls with |x|). D for d = 0; 0.589·d
 * (√(2 ln 2)·d/2) for d ≫ D. The half point is bracketed in [0, D/2 + 10σ] and found by the Illinois method, until
 * a step moves it by less than a relative 1e-10 (at most 100 steps).
 */
export function passWidth(d: number, D: number): number {
  if (!(d >= 0 && D > 0)) return NaN;
  if (d === 0) return D;
  const half = offsetApertureFraction(d, D, 0) / 2;
  const f = (x: number) => offsetApertureFraction(d, D, x) - half;
  // Bracket [a, b] with f(a) > 0 > f(b); a side kept twice in a row has its value halved (Illinois).
  let a = 0;
  let b = D / 2 + 10 * (d / 4);
  let fa = f(a);
  let fb = f(b);
  let kept = 0;
  let x = NaN;
  for (let i = 0; i < 100; i++) {
    const c = b - (fb * (b - a)) / (fb - fa);
    const fc = f(c);
    if (fc === 0 || Math.abs(c - x) <= 1e-10 * c) return 2 * c;
    x = c;
    if (fc > 0) {
      [a, fa] = [c, fc];
      if (kept === 1) fb /= 2;
      kept = 1;
    } else {
      [b, fb] = [c, fc];
      if (kept === -1) fa /= 2;
      kept = -1;
    }
  }
  return 2 * x;
}

/** A beam sweeping across the eye. */
export interface Scan {
  /** Speed of the beam across the eye, m/s. */
  readonly speed: number;
  /** Passes over the eye per second, Hz. */
  readonly rate: number;
  /** Length of one sweep at the eye, m: the beam has to clear each aperture between passes. */
  readonly sweep: number;
  /** Exposure duration T, s, from the start of the first pass to the end of the last. */
  readonly exposure: number;
}

/**
 * An angular scan of full angle Θ (rad) repeated f (Hz) times a second, seen at r (m) from its pivot point, on the
 * centre of the scan line: the angular speed is Θf for a scan in one direction (sawtooth or polygon, flyback blanked)
 * and 2Θf for a scan in both directions (triangle), so the speed is ωr, the passes come f or 2f times a second and
 * evenly spaced, and a sweep is rΘ long (along the arc).
 */
export function angularScan(theta: number, f: number, r: number, bidirectional: boolean, exposure: number): Scan {
  const passes = bidirectional ? 2 : 1;
  return { speed: passes * theta * f * r, rate: passes * f, sweep: r * theta, exposure };
}

/** One eye limit of the scanned beam; the rules' values (`singlePulse`, `group`, `reduced`, `qMax`) are beam powers, W. */
export interface ScannedLimit extends TrainLimit {
  /** Averaging aperture at the pass duration, m. */
  readonly aperture: number;
  /** Pass duration W/v, s. */
  readonly passDuration: number;
  /** Energy through that aperture per pass, per watt of beam power: L/v, J/W. */
  readonly passEnergy: number;
  /** Passes in the exposure. */
  readonly passes: number;
}

export type ScanStatus = "ok" | "noClearance" | "invalid";

export interface ScannedLimits {
  /** "noClearance": the sweep is shorter than aperture plus beam, so the beam never leaves the eye; treat it as stationary. */
  readonly status: ScanStatus;
  readonly limits: readonly ScannedLimit[];
  /** Largest beam power within every limit, W; NaN unless status is "ok" and some limit applies. */
  readonly pMax: number;
  readonly limiting: EyeLimitKind | null;
  readonly rule: PulseRule | null;
}

/**
 * Every eye limit at λ (m) for a CW beam of 1/e² diameter d (m) at the eye, scanned as `scan`, from a source subtending
 * α (rad; default a point source): the pass each limit sees, the largest beam power under each rule, and the one
 * that binds. Invalid (NaN) for d < 0, a speed or rate ≤ 0, or an exposure shorter than a pass or over 30 ks.
 */
export function scannedBeamLimits(lambda: number, d: number, scan: Scan, alpha = 0): ScannedLimits {
  const { speed: v, rate: f, sweep, exposure: T } = scan;
  const invalid: ScannedLimits = { status: "invalid", limits: [], pMax: NaN, limiting: null, rule: null };
  if (!(d >= 0 && v > 0 && f > 0 && sweep >= 0 && T > 0 && T <= T_MAX)) return invalid;
  const memo = <T>(fn: (D: number) => T) => {
    const cache = new Map<number, T>();
    return (D: number) => {
      if (!cache.has(D)) cache.set(D, fn(D));
      return cache.get(D) as T;
    };
  };
  const lengthAt = memo((D) => passLength(d, D));
  const widthAt = memo((D) => passWidth(d, D));
  const limits: ScannedLimit[] = [];
  for (const limit of pulseLimits(lambda, alpha)) {
    // The pass duration sets the aperture and the aperture the pass duration: iterate (the aperture grows as t^0.375).
    // Apertures are looked up within 1 ns – 30 ks (the photochemical limit's table starts at 1 ns).
    const apertureAt = (t: number) => limitingAperture(limit, Math.min(Math.max(t, T_MIN), T_MAX));
    let D = apertureAt(T_MIN);
    let tau = widthAt(D) / v;
    for (let i = 0; i < 100; i++) {
      const next = apertureAt(tau);
      if (next === D) break;
      D = next;
      tau = widthAt(D) / v;
    }
    if (sweep < apertureAt(T) + d) return { ...invalid, status: "noClearance" };
    const train = { duration: tau, prf: f, exposure: T };
    const passes = pulseCount(train);
    if (Number.isNaN(passes)) return invalid;
    const G = (t: number) => {
      const H = exposureLimit(limit, t);
      const Dt = limitingAperture(limit, t);
      return Number.isNaN(H) ? Infinity : (H * (Math.PI * Dt * Dt) / 4) * (v / lengthAt(Dt));
    };
    const rules = trainLimit(lambda, limit, train, G, alpha);
    limits.push({ ...rules, aperture: D, passDuration: tau, passEnergy: lengthAt(D) / v, passes });
  }
  if (limits.length === 0) return invalid;
  const worst = limits.reduce((a, b) => (b.qMax < a.qMax ? b : a));
  return { status: "ok", limits, pMax: worst.qMax, limiting: worst.kind, rule: worst.rule };
}

/**
 * Largest CW power, W, of the same beam held still on the eye for T (s): the least `limitMaxPower` over the eye limits
 * at λ (m), α (rad). NaN outside 180 nm – 1 mm or 1 ns – 30 ks.
 */
export function stationaryMaxPower(lambda: number, d: number, T: number, alpha = 0): number {
  const limits = eyeLimits(lambda, alpha);
  if (limits.length === 0) return NaN;
  return Math.min(...limits.map((limit) => limitMaxPower(limit, d, T)));
}
