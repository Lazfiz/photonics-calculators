/**
 * Laser product classes of IEC 60825-1:2014 (Edition 3) and their accessible emission limits (AEL): the power or energy
 * a product may emit through a measurement stop. SI units: wavelength in m, time in s, power in W, energy in J, lengths
 * in m, angles in rad. An AEL is stored like an exposure limit (`eye-exposure-limits.ts`): a radiant exposure H(t), J/m²,
 * over a stop of diameter D(t), so as an energy it is H(t)·πD(t)²/4 and `limitMaxPower` gives the largest CW power.
 * Model tier: textbook. IEC tabulates the AELs to two figures; here they are rebuilt from the limits they come from, so
 * they differ by that rounding (Class 1 at 633 nm, 100 s: 0.385 mW here, 3.9×10⁻⁴ W in the table).
 *
 * - Classes 1 and 1M: the eye's exposure limit times the area of its averaging stop (the MPEs "are the direct basis for
 *   the AEL" of Classes 1, 1M, 2, 2M and 3R: Schulmeister 2017). From 400 nm IEC's MPEs are ICNIRP 2013's
 *   (`eye-exposure-limits.ts`). In the UV IEC keeps its own values, over a 1 mm stop at every duration (the 2001
 *   edition's Table 1 lists them as 7.9×10⁻⁷ m² times the MPE): 30 J/m² below 302.5 nm; at 302.5–315 nm
 *   C₁ = 5.6×10³ t^0.25 J/m² up to T₁ = 10^(0.8(λ − 295)) × 10⁻¹⁵ s, then C₂ = 10^(0.2(λ − 295)) J/m²; at 315–400 nm C₁ to
 *   10 s, 10⁴ J/m² to 10³ s, then 10 W/m². (ICNIRP 2013's 1 nm steps, constant 10⁴ J/m² from 10 s and 1 → 3.5 mm
 *   aperture are exposure limits, not class limits.)
 * - 1250–1400 nm: instead of ICNIRP's anterior-segment limit, Classes 1, 1M and 3R are capped at the Class 3B AEL through
 *   the same 7 mm stop (Schulmeister 2017); for a point source the cap binds from 1310 nm. EN 60825-1:2014/A11:2021 (EU
 *   only) adds the skin limit through the corneal stop (1 mm to 0.35 s, 1.5 t^0.375 mm to 10 s, then 3.5 mm): 0.1 W from
 *   0.35 s (Schulmeister 2022). Optional here.
 * - Class 2, 400–700 nm: the Class 1 AEL below 0.25 s, then C₆ × 1 mW (C₆ = C_E at 0.25 s), through 7 mm.
 * - Class 3R: 5 × Class 1 (5 × Class 2 at 400–700 nm); none below 302.5 nm. The 1250–1400 nm caps stay 1×.
 * - Class 3B, through 7 mm (IEC 60825-1:2014 Table 8; the same as the 2001 edition's Table 4, as Schulmeister 2017 notes
 *   the 3B values didn't change): 180–302.5 nm 3.8×10⁻⁴ J to 0.25 s, then 1.5 mW; 302.5–315 nm 1.25×10⁻⁵ C₂ J, then
 *   5×10⁻⁵ C₂ W; 315–400 nm and 1400 nm – 1 mm 0.125 J, then 0.5 W; 400–1050 nm 0.03 C₄ J up to 0.06 C₄ s (C₄ = C_A),
 *   then 0.5 W; 1050–1400 nm 0.15 J to 0.25 s, then 0.5 W.
 * - Time bases (4.3 e): 0.25 s for Classes 2, 2M and 3R at 400–700 nm; 100 s above 400 nm, or 30 000 s where intentional
 *   long-term viewing is inherent; 30 000 s at or below 400 nm. "Every possible emission duration within the time base
 *   must be considered", so a CW beam has to meet each AEL for every duration up to it. The one exception: IEC tabulates
 *   the CW Class 2 limit as C₆ × 1 mW, while the Class 1 AEL just below 0.25 s is 0.98 mW (0.99 mW with IEC's rounded
 *   7×10⁻⁴ t^0.75 J), so a CW beam is held to Classes 2 and 3R from 0.25 s on.
 * - Measurement (Table 10, simplified): Condition 3, the naked eye, uses each AEL's own stop, 100 mm from the beam waist
 *   at 302.5 nm – 4 µm and at the output elsewhere; Condition 1, a telescope, a 50 mm stop 2 m from the waist, modelled
 *   at 400–1400 nm only. The beam is a round TEM₀₀ beam with its waist at the output.
 *
 * Not modelled: repetitive pulses (C₅), Class 1C, the photochemical field of view γ_ph, Condition 1 outside 400–1400 nm
 * (the 2001 edition used a 25 mm stop there), sources larger than α_max = 100 mrad. The 2001 edition measured the UV and
 * IR power AELs through a 7 mm stop, more restrictive than each AEL's own stop for beams wider than it.
 *
 * Sources: IEC 60825-1:2014 (4.3 e, Tables 3–8 and 10); IEC 60825-1:1993+A1:1997+A2:2001, Tables 1–4 and 10 (the
 * values checked here); ICNIRP, Health Phys. 105(3), 271–295 (2013); K. Schulmeister, "The new edition of the
 * international laser product safety standard IEC 60825-1" (white paper, Seibersdorf Laboratories, 2017) and "The
 * European Amendment A11:2021 to EN 60825-1" (white paper, 2022).
 */
import {
  CORNEAL_APERTURE, correctionCA, correctionCE, eyeLimits, exposureLimit, fixedAperture, limitingAperture,
  limitMaxPower, T_MAX, T_MIN, type EyeLimitKind, type Piece, type TabulatedLimit,
} from "./eye-exposure-limits";
import { axisDiameterAt } from "./hazard-distance";
import { skinLimit } from "./skin-exposure-limits";

/** λ (m) → nm, rounded to 1 fm, as in `eye-exposure-limits.ts`. */
const toNm = (lambda: number) => Math.round(lambda * 1e15) / 1e6;
const area = (D: number) => (Math.PI * D * D) / 4;

/** Diameter, m, of the stop of the retinal and Class 2 / 3B AELs. */
export const STOP_7MM = 7e-3;
/** Diameter, m, of IEC's UV stop. */
export const STOP_UV = 1e-3;
/** Condition 1 (telescope): a 50 mm stop 2 m from the beam waist. */
export const CONDITION1_STOP = 50e-3;
export const CONDITION1_DISTANCE = 2;

/** Time bases, s (IEC 60825-1:2014 4.3 e). */
export const TIME_BASE_SHORT = 0.25;
export const TIME_BASE_DEFAULT = 100;
export const TIME_BASE_LONG = 3e4;

export type LaserClass = "1" | "1M" | "2" | "2M" | "3R" | "3B" | "4";
/** Classes with AELs of their own; 1M and 2M use those of 1 and 2. */
export type AelClass = "1" | "2" | "3R" | "3B";
export type AelKind = Exclude<EyeLimitKind, "anteriorSegment"> | "ultraviolet" | "class2" | "class3B" | "skinA11";

export interface Ael extends TabulatedLimit {
  readonly kind: AelKind;
}

export interface ClassOptions {
  /** Angular subtense of the apparent source, rad (default 0, a point source): C₆ = C_E. */
  readonly alpha?: number;
  /** Intentional long-term viewing is inherent in the design: a 30 000 s time base above 400 nm. */
  readonly longTermViewing?: boolean;
  /** Apply the EN 60825-1:2014/A11:2021 (EU) skin AEL at 1250–1400 nm. */
  readonly euA11?: boolean;
}

/** Pieces from the joints t₀ < t₁ < … and one [a, p] form per interval (as in `eye-exposure-limits.ts`). */
function pieces(joints: readonly number[], forms: readonly (readonly [number, number])[]): Piece[] {
  return forms.map(([a, p], i) => ({ t0: joints[i], t1: joints[i + 1], a, p })).filter((s) => s.t1 > s.t0);
}

const clampT = (t: number) => Math.min(Math.max(t, T_MIN), T_MAX);
const scaled = (ael: Ael, k: number): Ael => ({ ...ael, pieces: ael.pieces.map((s) => ({ ...s, a: s.a * k })) });
const isVisible = (nm: number) => nm >= 400 && nm <= 700;

/** Time base, s, of a class at λ (m). */
export function timeBase(cls: AelClass, lambda: number, opts: ClassOptions = {}): number {
  const nm = toNm(lambda);
  if ((cls === "2" || cls === "3R") && isVisible(nm)) return TIME_BASE_SHORT;
  if (nm <= 400 || opts.longTermViewing) return TIME_BASE_LONG;
  return TIME_BASE_DEFAULT;
}

/** IEC's Class 1 UV AEL as the MPE over a 1 mm stop (see the header). */
function ultravioletClass1(nm: number): Ael {
  let joints: number[];
  let forms: [number, number][];
  if (nm < 302.5) {
    joints = [T_MIN, T_MAX];
    forms = [[30, 0]];
  } else if (nm < 315) {
    const T1 = Math.pow(10, 0.8 * (nm - 295)) * 1e-15;
    joints = [T_MIN, clampT(T1), T_MAX];
    forms = [[5.6e3, 0.25], [Math.pow(10, 0.2 * (nm - 295)), 0]];
  } else {
    joints = [T_MIN, 10, 1e3, T_MAX];
    forms = [[5.6e3, 0.25], [1e4, 0], [10, 1]];
  }
  return { kind: "ultraviolet", pieces: pieces(joints, forms), apertures: fixedAperture(STOP_UV) };
}

/** Class 3B AEL (Table 8) as a radiant exposure over the 7 mm stop. */
function class3B(nm: number, ca: number): Ael {
  const A = area(STOP_7MM);
  let joint = 0.25;
  let pulse: number; // J, up to the joint
  let cw: number; // W, from the joint
  if (nm < 302.5) [pulse, cw] = [3.8e-4, 1.5e-3];
  else if (nm < 315) {
    const c2 = Math.pow(10, 0.2 * (nm - 295));
    [pulse, cw] = [1.25e-5 * c2, 5e-5 * c2];
  } else if (nm < 400 || nm >= 1400) [pulse, cw] = [0.125, 0.5];
  else if (nm < 1050) {
    // 0.03 C₄ J for t < 0.06 C₄ s, then 0.5 W; past 1000 nm 0.06 C₄ s runs beyond 0.25 s, where 0.5 W takes over.
    joint = Math.min(0.06 * ca, 0.25);
    [pulse, cw] = [0.03 * ca, 0.5];
  } else [pulse, cw] = [0.15, 0.5];
  return { kind: "class3B", pieces: pieces([T_MIN, joint, T_MAX], [[pulse / A, 0], [cw / A, 1]]), apertures: fixedAperture(STOP_7MM) };
}

function class1(lambda: number, nm: number, opts: ClassOptions): Ael[] {
  if (nm < 400) return [ultravioletClass1(nm)];
  const aels: Ael[] = eyeLimits(lambda, opts.alpha ?? 0).flatMap((l) => (l.kind === "anteriorSegment" ? [] : [{ ...l, kind: l.kind }]));
  if (nm >= 1250 && nm < 1400) {
    aels.push(class3B(nm, correctionCA(lambda)));
    const skin = opts.euA11 ? skinLimit(lambda) : null;
    if (skin) aels.push({ kind: "skinA11", pieces: skin.pieces, apertures: CORNEAL_APERTURE });
  }
  return aels;
}

function class2(lambda: number, alpha: number): Ael {
  const thermal = eyeLimits(lambda, alpha).find((l) => l.kind === "retinalThermal");
  const below = (thermal?.pieces ?? []).filter((s) => s.t0 < TIME_BASE_SHORT).map((s) => ({ ...s, t1: Math.min(s.t1, TIME_BASE_SHORT) }));
  const cw: Piece = { t0: TIME_BASE_SHORT, t1: T_MAX, a: (1e-3 * correctionCE(alpha, TIME_BASE_SHORT)) / area(STOP_7MM), p: 1 };
  return { kind: "class2", pieces: [...below, cw], apertures: fixedAperture(STOP_7MM) };
}

/**
 * The AELs of a class at λ (m), 180 nm – 1 mm, each of which applies (dual limits): empty where the class doesn't exist
 * (Class 2 outside 400–700 nm, Class 3R below 302.5 nm) or outside 180 nm – 1 mm.
 */
export function classAels(cls: AelClass, lambda: number, opts: ClassOptions = {}): Ael[] {
  const nm = toNm(lambda);
  if (!(nm >= 180 && nm <= 1e6)) return [];
  switch (cls) {
    case "1":
      return class1(lambda, nm, opts);
    case "2":
      return isVisible(nm) ? [class2(lambda, opts.alpha ?? 0)] : [];
    case "3R":
      if (nm < 302.5) return [];
      if (isVisible(nm)) return [scaled(class2(lambda, opts.alpha ?? 0), 5)];
      return class1(lambda, nm, opts).map((l) => (l.kind === "class3B" || l.kind === "skinA11" ? l : scaled(l, 5)));
    case "3B":
      return [class3B(nm, correctionCA(lambda))];
  }
}

export interface AelEnergy {
  /** The lowest AEL of the class for one emission of duration t, as energy through its stop, J (NaN: none defined). */
  readonly energy: number;
  readonly kind: AelKind | null;
  /** Diameter of that AEL's stop at t, m. */
  readonly stop: number;
}

/**
 * The AEL of a class for one emission (a single pulse, or CW switched on for t) of duration t (s), 1 ns – 30 ks, as the
 * energy through the stop: the least over the class's AELs defined at t (a beam inside every stop).
 */
export function aelEnergy(cls: AelClass, lambda: number, t: number, opts: ClassOptions = {}): AelEnergy {
  let best: AelEnergy = { energy: NaN, kind: null, stop: NaN };
  for (const ael of classAels(cls, lambda, opts)) {
    const stop = limitingAperture(ael, t);
    const energy = exposureLimit(ael, t) * area(stop);
    if (Number.isFinite(energy) && !(energy >= best.energy)) best = { energy, kind: ael.kind, stop };
  }
  return best;
}

export interface LimitEnergy {
  /** The least ICNIRP eye limit at t as energy through its averaging aperture, J (NaN: none defined). */
  readonly energy: number;
  readonly kind: EyeLimitKind | null;
  /** Diameter of that aperture at t, m. */
  readonly aperture: number;
}

/**
 * The exposure limit (MPE) that the Class 1 AEL is compared with: the least ICNIRP 2013 eye limit at λ (m) for an
 * exposure of t (s), with its anterior-segment limit, as the energy through its averaging aperture.
 */
export function exposureLimitEnergy(lambda: number, t: number, alpha = 0): LimitEnergy {
  let best: LimitEnergy = { energy: NaN, kind: null, aperture: NaN };
  for (const limit of eyeLimits(lambda, alpha)) {
    const aperture = limitingAperture(limit, t);
    const energy = exposureLimit(limit, t) * area(aperture);
    if (Number.isFinite(energy) && !(energy >= best.energy)) best = { energy, kind: limit.kind, aperture };
  }
  return best;
}

export interface CwClassLimit {
  /** Largest CW power of the beam within every AEL of the class, W; NaN where the class doesn't exist. */
  readonly power: number;
  /** The AEL that sets it; null where the class doesn't exist. */
  readonly limiting: AelKind | null;
  /** Time base, s. */
  readonly timeBase: number;
}

/**
 * Largest CW power (W) of a round Gaussian beam of 1/e² diameter d (m) at the stop within every AEL of the class, for
 * every emission duration up to its time base (`limitMaxPower`); d = 0 puts all of the beam inside each stop, which
 * gives the AEL as a power. The visible Classes 2 and 3R from 0.25 s only (see the header).
 */
export function cwClassLimit(cls: AelClass, lambda: number, d: number, opts: ClassOptions = {}): CwClassLimit {
  const T = timeBase(cls, lambda, opts);
  const fromShort = (cls === "2" || cls === "3R") && isVisible(toNm(lambda));
  let best: CwClassLimit = { power: NaN, limiting: null, timeBase: T };
  for (const ael of classAels(cls, lambda, opts)) {
    const used = fromShort ? { ...ael, pieces: ael.pieces.filter((s) => s.t0 >= TIME_BASE_SHORT) } : ael;
    const power = limitMaxPower(used, d, T);
    if (!Number.isNaN(power) && !(power >= best.power)) best = { power, limiting: ael.kind, timeBase: T };
  }
  return best;
}

/** Distance, m, of the Condition 3 stop from the beam waist: 100 mm at 302.5 nm – 4 µm, else at the output (0). */
export function condition3Distance(lambda: number): number {
  const nm = toNm(lambda);
  return nm >= 302.5 && nm <= 4000 ? 0.1 : 0;
}

/** Condition 1 is modelled at 400–1400 nm. */
export function condition1Modelled(lambda: number): boolean {
  const nm = toNm(lambda);
  return nm >= 400 && nm <= 1400;
}

export interface ClassCheck {
  readonly cls: AelClass;
  /** Largest CW power within the class under Condition 3 (naked eye). */
  readonly condition3: CwClassLimit;
  /** The same under Condition 1 (telescope, 50 mm stop at 2 m); null where it isn't applied. */
  readonly condition1: CwClassLimit | null;
}

export interface Classification {
  /** The class; null for P < 0 or outside 180 nm – 1 mm. */
  readonly laserClass: LaserClass | null;
  readonly checks: readonly ClassCheck[];
  /** 1/e² beam diameters, m, at the Condition 3 stop and at the Condition 1 stop (null: not applied). */
  readonly diameter3: number;
  readonly diameter1: number | null;
}

export interface CwBeam {
  /** 1/e² diameter at the output (the waist), m. */
  readonly d: number;
  /** 1/e² full-angle divergence, rad. */
  readonly phi: number;
}

/**
 * IEC 60825-1:2014 class of a CW laser of power P (W) at λ (m) with a round Gaussian beam: the lowest class whose AELs
 * hold under both measurement conditions (Condition 1 only where modelled and `condition1` is true, i.e. telescopic
 * viewing is foreseeable); 1M and 2M when Condition 3 meets Class 1 or 2 and Condition 1 doesn't, but stays within
 * Class 3B. Under Condition 1 the 50 mm stop collects P(1 − exp(−2D²/d²)), compared with each AEL as a power. A beam
 * within a relative 1e-9 of a limit counts as within it.
 */
export function classifyCw(lambda: number, P: number, beam: CwBeam, opts: ClassOptions & { condition1?: boolean } = {}): Classification {
  const nm = toNm(lambda);
  const d3 = axisDiameterAt(beam.d, beam.phi, condition3Distance(lambda), "gaussian");
  const useC1 = (opts.condition1 ?? true) && condition1Modelled(lambda);
  const d1 = useC1 ? axisDiameterAt(beam.d, beam.phi, CONDITION1_DISTANCE, "gaussian") : null;
  const checks: ClassCheck[] = (["1", "2", "3R", "3B"] as const).map((cls) => {
    const condition3 = cwClassLimit(cls, lambda, d3, opts);
    if (d1 === null) return { cls, condition3, condition1: null };
    const asPower = cwClassLimit(cls, lambda, 0, opts);
    const collected = -Math.expm1((-2 * CONDITION1_STOP * CONDITION1_STOP) / (d1 * d1));
    return { cls, condition3, condition1: { ...asPower, power: asPower.power / collected } };
  });
  if (!(P >= 0 && nm >= 180 && nm <= 1e6)) return { laserClass: null, checks, diameter3: d3, diameter1: d1 };
  const [c1, c2, c3R, c3B] = checks;
  // A relative 1e-9 absorbs rounding, so that 5 mW is within 5 × 1 mW.
  const fits = (limit: CwClassLimit) => P <= limit.power * (1 + 1e-9);
  const within = (c: ClassCheck) => fits(c.condition3) && (c.condition1 === null || fits(c.condition1));
  const magnified = (c: ClassCheck) =>
    c.condition1 !== null && fits(c.condition3) && !fits(c.condition1) && c3B.condition1 !== null && fits(c3B.condition1);
  const laserClass: LaserClass = within(c1)
    ? "1"
    : magnified(c1)
      ? "1M"
      : within(c2)
        ? "2"
        : magnified(c2)
          ? "2M"
          : within(c3R)
            ? "3R"
            : within(c3B)
              ? "3B"
              : "4";
  return { laserClass, checks, diameter3: d3, diameter1: d1 };
}
