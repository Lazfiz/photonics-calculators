/**
 * Exposure limits (EL, the MPE) of the eye for a CW laser beam or a single pulse, and the longest exposure or the
 * largest power that stays within them. SI units: wavelength in m, time in s, power in W, diameters in m, angles in
 * rad, irradiance in W/m², radiant exposure in J/m² (the tables are indexed in nm, as published).
 * Model tier: exact, i.e. the tabulated limits; the beam is a round TEM₀₀ Gaussian centred on the averaging aperture.
 *
 * Source: ICNIRP, "Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm",
 * Health Phys. 105(3), 271–295 (2013): Table 2 (C_E, α_max), Table 3 (C_A, C_B, C_C), Table 4 (T₂), Table 5 (eye),
 * Table 7 (skin), Table 8 (apertures). Point source: α ≤ α_min = 1.5 mrad, so C_E = 1 and T₂ = 10 s. An extended
 * source (α > 1.5 mrad, optional argument) raises the retinal thermal limit by C_E(α, t) up to T₂(α), then holds the
 * irradiance at T₂'s value: 18 C_A C_C C_E T₂^−0.25 W/m². All limits run from 1 ns to 30 ks.
 * - 180–400 nm, cornea: 30 J/m² below 302 nm, then 1 nm steps from 40 J/m² (302–303 nm) to 6.3 kJ/m² (313–315 nm),
 *   all to 30 ks and "also not to exceed" 5.6×10³ t^0.25 J/m² below 10 s; 315–400 nm 5.6×10³ t^0.25 J/m² to 10 s,
 *   then 10⁴ J/m² to 30 ks. EU Directive 2006/25/EC Annex II Table 2.3 has the same values from 10 s. (The IEC
 *   60825-1 values used before session 23 had a continuous 10^(0.2(λ − 295)) J/m² and 10 W/m² after 10³ s.)
 * - 400–700 nm, retinal thermal: 2×10⁻³ J/m² to 5 µs, 18 t^0.75 J/m² to 10 s, then 10 W/m². 400–600 nm, retinal
 *   photochemical, from 10 s: 100 C_B J/m² to 100 s, then C_B W/m². Both apply (Table 5's "dual limits").
 * - 700–1050 nm: 2×10⁻³ C_A J/m² to 5 µs, 18 C_A t^0.75 J/m² to 10 s, then 10 C_A W/m². 1050–1400 nm:
 *   2×10⁻² C_C J/m² to 13 µs, 90 C_C t^0.75 J/m² to 10 s, then 10 C_A C_C W/m² (C_A = 5).
 * - 1150–1400 nm, anterior segment (cornea, lens): twice the skin limit for an eye-only exposure (Table 5 note d,
 *   Table 3 note a): skin 200 C_A J/m² to 100 ns, 1.1×10⁴ C_A t^0.25 J/m² to 10 s, then 2×10³ C_A W/m² (Table 7).
 * - 1400 nm – 1 mm, cornea: 10³ J/m² to 1 ms, then 5.6×10³ t^0.25 J/m² (1400–1500 and 1800–2600 nm); 10⁴ J/m²
 *   (1500–1800 nm); 100 J/m² to 100 ns, then 5.6×10³ t^0.25 J/m² (2600 nm – 1 mm); from 10 s, 10³ W/m².
 * - Averaging apertures (Table 8; Table 7 for the skin limit): 7 mm for the retinal limits; 3.5 mm for the anterior
 *   segment; 1 mm below 0.35 s, 1.5 t^0.375 mm to 10 s, then 3.5 mm for 180–400 nm and 1400 nm – 0.1 mm; 11 mm for
 *   0.1–1 mm. "No modifications of the exposure limits are permitted for reduced energy entering an assumed pupil
 *   size less than 7 mm" (ICNIRP 2013).
 *
 * Field of view: by default the exposure of a source larger than α_max is measured with γ = α_max and C_E stops at
 * α_max/α_min. With an open field of view (all of a homogeneous, circular source counted) C_E = α²/(α_min α_max)
 * above α_max (eqn 5), and between 625 µs and t_α the thermal limit goes as t^0.25 instead of t^1.25.
 *
 * Not modelled: repetitive pulses (a single pulse is an exposure of its own duration), the advice to use the actual
 * irradiance of beams narrower than 1 mm (ICNIRP Table 5 note c), and the photochemical field of view γ_ph: it sets
 * how an extended source's exposure is measured, not the limit, which C_E doesn't raise.
 */

/** Shortest and longest exposure durations the limits are tabulated for, s. */
export const T_MIN = 1e-9;
export const T_MAX = 3e4;

/** λ (m) → nm, rounded to 1 fm so that 700e-9 m is 700 nm, not 700.0000000000001. */
const toNm = (lambda: number) => Math.round(lambda * 1e15) / 1e6;

/** On [t0, t1) the limit is H(t) = a·t^p J/m² (p = 1 is an irradiance limit of a W/m²). */
export interface Piece {
  readonly t0: number;
  readonly t1: number;
  readonly a: number;
  readonly p: number;
}

/** On [t0, t1) the averaging aperture has the diameter D(t) = d·t^q, m. */
export interface AperturePiece {
  readonly t0: number;
  readonly t1: number;
  readonly d: number;
  readonly q: number;
}

/** A limit in time pieces and the aperture it is averaged over (eye here, skin in `skin-exposure-limits.ts`). */
export interface TabulatedLimit {
  readonly pieces: readonly Piece[];
  readonly apertures: readonly AperturePiece[];
}

export type EyeLimitKind = "cornealUv" | "retinalThermal" | "retinalPhotochemical" | "anteriorSegment" | "cornealIr";

export interface EyeLimit extends TabulatedLimit {
  readonly kind: EyeLimitKind;
}

/** Pieces from the joints t₀ < t₁ < … and one [a, p] form per interval. */
function pieces(joints: readonly number[], forms: readonly (readonly [number, number])[]): Piece[] {
  return forms.map(([a, p], i) => ({ t0: joints[i], t1: joints[i + 1], a, p })).filter((s) => s.t1 > s.t0);
}

export const fixedAperture = (d: number): AperturePiece[] => [{ t0: T_MIN, t1: T_MAX, d, q: 0 }];
/** 1 mm below 0.35 s, 1.5 t^0.375 mm to 10 s, then 3.5 mm (ICNIRP 2013 Table 8). */
export const CORNEAL_APERTURE: AperturePiece[] = [
  { t0: T_MIN, t1: 0.35, d: 1e-3, q: 0 },
  { t0: 0.35, t1: 10, d: 1.5e-3, q: 0.375 },
  { t0: 10, t1: T_MAX, d: 3.5e-3, q: 0 },
];

/** ICNIRP 2013 Table 5, 302–315 nm: [lower edge (nm), J/m²]; each step runs to the next edge, the last to 315 nm. */
const UVB_STEPS: readonly (readonly [number, number])[] = [
  [302, 40], [303, 60], [304, 100], [305, 160], [306, 250], [307, 400], [308, 630], [309, 1.0e3], [310, 1.6e3],
  [311, 2.5e3], [312, 4.0e3], [313, 6.3e3],
];

/** C_A (C₄ in IEC 60825-1), 400–1400 nm: 1 below 700 nm, 10^(0.002(λ − 700)) to 1050 nm, then 5. */
export function correctionCA(lambda: number): number {
  const nm = toNm(lambda);
  return nm < 700 ? 1 : nm < 1050 ? Math.pow(10, 0.002 * (nm - 700)) : 5;
}

/** C_B (C₃ in IEC 60825-1), 400–600 nm: 1 below 450 nm, then 10^(0.02(λ − 450)). */
export function correctionCB(lambda: number): number {
  const nm = toNm(lambda);
  return nm < 450 ? 1 : Math.pow(10, 0.02 * (nm - 450));
}

/** C_C (C₇ in IEC 60825-1), 700–1400 nm: 1 below 1150 nm, 10^(0.018(λ − 1150)) to 1200 nm, then 8 + 10^(0.04(λ − 1250)). */
export function correctionCC(lambda: number): number {
  const nm = toNm(lambda);
  return nm < 1150 ? 1 : nm < 1200 ? Math.pow(10, 0.018 * (nm - 1150)) : 8 + Math.pow(10, 0.04 * (nm - 1250));
}

/** α_min, rad: a source subtending less is a point source (ICNIRP 2013 Table 2). */
export const ALPHA_MIN = 1.5e-3;

/** α_max, rad, at exposure duration t (s): 5 mrad below 625 µs, 200 t^0.5 mrad to 0.25 s, then 100 mrad (Table 2). */
export function alphaMax(t: number): number {
  return t < 625e-6 ? 5e-3 : t <= 0.25 ? 0.2 * Math.sqrt(t) : 0.1;
}

/**
 * How an extended source's exposure is measured: a field of view γ = α_max ("limited", ICNIRP 2013 Table 2) or all of
 * a homogeneous, circular source ("open", eqn 5).
 */
export type FieldOfView = "limited" | "open";

/**
 * C_E for an apparent source subtending α (rad), duration t (s): 1 up to α_min, α/α_min up to α_max, then α_max/α_min
 * with the field of view γ = α_max, or α²/(α_min α_max) with an open field of view (ICNIRP 2013 Table 2, eqn 5).
 */
export function correctionCE(alpha: number, t: number, fieldOfView: FieldOfView = "limited"): number {
  const aMax = alphaMax(t);
  if (fieldOfView === "open" && alpha > aMax) return (alpha * alpha) / (ALPHA_MIN * aMax);
  return Math.max(Math.min(alpha, aMax), ALPHA_MIN) / ALPHA_MIN;
}

/** T₂, s: 10 s up to α_min, 10·10^((α − 1.5 mrad)/98.5 mrad) to 100 mrad, then 100 s (ICNIRP 2013 Table 4). */
export function timeT2(alpha: number): number {
  if (alpha <= ALPHA_MIN) return 10;
  return alpha <= 0.1 ? 10 * Math.pow(10, (alpha - ALPHA_MIN) / 0.0985) : 100;
}

/**
 * Retinal thermal limit, 400–1400 nm (ICNIRP 2013 Table 5). Below the short-pulse joint t_s (5 µs; 13 µs above
 * 1050 nm) a constant h_s C_E, then k C_E t^0.75 with k = 18 C_A (90 C_C above 1050 nm), and from T₂ the irradiance
 * k C_E T₂^−0.25. A point source keeps Table 5's rounded 10 C_A C_C W/m² from 10 s (18·10^−0.25 = 10.1). C_E grows
 * with α_max(t), so an extended source has up to two more joints: 625 µs, and t_α = (α / 200 mrad)², where α_max
 * reaches α (between them C_E = 200 t^0.5 / 1.5, so H ∝ t^1.25; with an open field of view C_E = α²/(1.5 · 200 t^0.5),
 * so H ∝ t^0.25).
 */
function retinalThermalPieces(nm: number, ca: number, cc: number, alpha: number, fieldOfView: FieldOfView): Piece[] {
  const [ts, hs, k] = nm < 1050 ? [5e-6, 2e-3 * ca, 18 * ca] : [13e-6, 2e-2 * cc, 90 * cc];
  if (!(alpha > ALPHA_MIN)) return pieces([T_MIN, ts, 10, T_MAX], [[hs, 0], [k, 0.75], [10 * ca * cc, 1]]);
  const T2 = timeT2(alpha);
  const tAlpha = Math.min(Math.max(Math.pow(alpha / 0.2, 2), 625e-6), 0.25);
  const ce = (t: number) => correctionCE(alpha, t, fieldOfView);
  const growing: [number, number] = fieldOfView === "open" ? [(k * alpha * alpha) / (0.2 * ALPHA_MIN), 0.25] : [(k * 0.2) / ALPHA_MIN, 1.25];
  return pieces(
    [T_MIN, ts, 625e-6, tAlpha, T2, T_MAX],
    [[hs * ce(T_MIN), 0], [k * ce(ts), 0.75], growing, [k * ce(T2), 0.75], [k * ce(T2) * Math.pow(T2, -0.25), 1]],
  );
}

/**
 * The limits that apply to the eye at λ (m), 180 nm ≤ λ ≤ 1 mm; empty outside. α (rad) is the angular subtense of the
 * apparent source; it only changes the retinal thermal limit, and up to α_min (the default) it is a point source. The
 * field of view matters only above α_max (see correctionCE).
 */
export function eyeLimits(lambda: number, alpha = 0, fieldOfView: FieldOfView = "limited"): EyeLimit[] {
  const nm = toNm(lambda);
  if (!(nm >= 180 && nm <= 1e6)) return [];
  if (nm < 400) {
    let uv: Piece[];
    if (nm < 315) {
      // min(5.6×10³ t^0.25, H): the two meet at (H/5.6×10³)⁴, below 1 ns for 30 J/m², 1.6 s for 6.3 kJ/m².
      let H = 30;
      for (const [edge, value] of UVB_STEPS) if (nm >= edge) H = value;
      uv = pieces([T_MIN, Math.max(T_MIN, Math.pow(H / 5.6e3, 4)), T_MAX], [[5.6e3, 0.25], [H, 0]]);
    } else uv = pieces([T_MIN, 10, T_MAX], [[5.6e3, 0.25], [1e4, 0]]);
    return [{ kind: "cornealUv", pieces: uv, apertures: CORNEAL_APERTURE }];
  }
  if (nm < 1400) {
    const ca = correctionCA(lambda);
    const cc = correctionCC(lambda);
    const thermal = retinalThermalPieces(nm, ca, cc, alpha, fieldOfView);
    const limits: EyeLimit[] = [{ kind: "retinalThermal", pieces: thermal, apertures: fixedAperture(7e-3) }];
    if (nm < 600) {
      const cb = correctionCB(lambda);
      limits.push({
        kind: "retinalPhotochemical",
        pieces: pieces([10, 100, T_MAX], [[100 * cb, 0], [cb, 1]]),
        apertures: fixedAperture(7e-3),
      });
    }
    if (nm >= 1150) {
      limits.push({
        kind: "anteriorSegment",
        pieces: pieces([T_MIN, 1e-7, 10, T_MAX], [[2 * 200 * ca, 0], [2 * 1.1e4 * ca, 0.25], [2 * 2e3 * ca, 1]]),
        apertures: fixedAperture(3.5e-3),
      });
    }
    return limits;
  }
  const ir =
    nm >= 1500 && nm < 1800
      ? pieces([T_MIN, 10, T_MAX], [[1e4, 0], [1e3, 1]])
      : nm < 2600
        ? pieces([T_MIN, 1e-3, 10, T_MAX], [[1e3, 0], [5.6e3, 0.25], [1e3, 1]])
        : pieces([T_MIN, 1e-7, 10, T_MAX], [[100, 0], [5.6e3, 0.25], [1e3, 1]]);
  return [{ kind: "cornealIr", pieces: ir, apertures: nm < 1e5 ? CORNEAL_APERTURE : fixedAperture(11e-3) }];
}

const findPiece = <T extends { t0: number; t1: number }>(list: readonly T[], t: number): T | undefined =>
  list.find((s) => t >= s.t0 && (t < s.t1 || (t === T_MAX && s.t1 === T_MAX)));

/** The limit as radiant exposure, J/m², at exposure duration t (s); NaN where it isn't defined. */
export function exposureLimit(limit: TabulatedLimit, t: number): number {
  const s = findPiece(limit.pieces, t);
  return s ? s.a * Math.pow(t, s.p) : NaN;
}

/** Diameter, m, of the aperture the exposure is averaged over at duration t (s); NaN outside 1 ns – 30 ks. */
export function limitingAperture(limit: TabulatedLimit, t: number): number {
  const s = findPiece(limit.apertures, t);
  return s ? s.d * Math.pow(t, s.q) : NaN;
}

/**
 * Irradiance, W/m², of a round Gaussian beam (power P in W, 1/e² diameter d in m) averaged over a centred aperture of
 * diameter D (m): P(1 − exp(−2D²/d²)) / (πD²/4). d = 0 puts all the power inside; d ≫ D gives the peak 8P/(πd²).
 */
export function apertureIrradiance(P: number, d: number, D: number): number {
  if (!(P >= 0 && d >= 0 && D > 0)) return NaN;
  return (P * -Math.expm1((-2 * D * D) / (d * d))) / ((Math.PI * D * D) / 4);
}

/**
 * Longest exposure, s, before a CW beam (P in W, 1/e² diameter d in m) first exceeds the limit: the first t with
 * E(t)·t > H(t). Infinity if it stays within the limit for 30 ks; NaN if it already exceeds it at 1 ns, or for
 * P < 0 or d < 0.
 *
 * Each piece has H = a t^p and either a fixed aperture or D ∝ t^0.375 with p ≤ 0.25. On it, E(t)·t / H(t) is
 * monotonic: with a fixed aperture it goes as t^(1−p) (falling only on an extended source's t^1.25 piece), and with
 * the growing aperture it doesn't decrease (E·D² is the power inside D and grows with D). So the first crossing is
 * found by bisection in log t to a relative 1e-12, and a falling piece, checked at its start, has none inside. A
 * limit can drop at a joint, so the start of every piece is checked first.
 */
export function limitMaxDuration(limit: TabulatedLimit, P: number, d: number): number {
  if (!(P >= 0 && d >= 0)) return NaN;
  if (P === 0) return Infinity;
  for (const s of limit.pieces) {
    for (const ap of limit.apertures) {
      const t0 = Math.max(s.t0, ap.t0);
      const t1 = Math.min(s.t1, ap.t1);
      if (!(t1 > t0)) continue;
      const ratio = (t: number) => (apertureIrradiance(P, d, ap.d * Math.pow(t, ap.q)) * t) / (s.a * Math.pow(t, s.p));
      if (ratio(t0) > 1) return t0 === T_MIN ? NaN : t0;
      if (ratio(t1) <= 1) continue;
      let lo = t0;
      let hi = t1;
      for (let i = 0; i < 200 && hi / lo - 1 > 1e-12; i++) {
        const mid = Math.sqrt(lo * hi);
        if (ratio(mid) > 1) hi = mid;
        else lo = mid;
      }
      return hi;
    }
  }
  return Infinity;
}

/**
 * Largest CW power, W, of a beam (1/e² diameter d, m) that stays within the limit for an exposure of t (s): the least
 * H(t′) / (t′·E₁(t′)) over 1 ns ≤ t′ ≤ t, with E₁ the irradiance per watt over the aperture at t′. limitMaxDuration
 * of that power is t. The ratio is monotonic on each piece (see limitMaxDuration), so only the ends of every piece,
 * cut at t, are evaluated, each with its own piece's formula (the value just before a joint counts too).
 * For a single pulse of duration t the largest energy is t times this. NaN for d < 0 or t outside 1 ns – 30 ks.
 */
export function limitMaxPower(limit: TabulatedLimit, d: number, t: number): number {
  if (!(d >= 0 && t >= T_MIN && t <= T_MAX)) return NaN;
  let pMax = Infinity;
  for (const s of limit.pieces) {
    for (const ap of limit.apertures) {
      const t0 = Math.max(s.t0, ap.t0);
      const end = Math.min(s.t1, ap.t1);
      if (!(end > t0 && t0 <= t)) continue;
      for (const x of [t0, Math.min(end, t)]) {
        pMax = Math.min(pMax, (s.a * Math.pow(x, s.p)) / (x * apertureIrradiance(1, d, ap.d * Math.pow(x, ap.q))));
      }
    }
  }
  return pMax;
}

/**
 * Exposure duration, s, from which the retinal photochemical limit is at or below the thermal one, 400–600 nm, for a
 * source subtending α (rad); NaN if the thermal limit stays lower to 30 ks, or outside 400–600 nm. Once lower, the
 * photochemical limit stays lower (it is constant to 100 s and ∝ t after; the thermal one grows as t^0.75 to T₂ ≤ 100 s
 * and ∝ t after), so a log-spaced scan and bisection (relative 1e-12) find the joint. For a point source this is
 * ICNIRP 2013 Table 4's T₁ up to 500 nm: 10 s below 450 nm, then 10·C_B s. Above 500 nm Table 4 gives T₁ = 100 s, but
 * a point source's thermal limit (10 W/m²) stays below the photochemical one (C_B > 10 W/m²); only a larger α reaches it.
 */
export function photochemicalCrossover(lambda: number, alpha = 0): number {
  const limits = eyeLimits(lambda, alpha);
  const thermal = limits.find((l) => l.kind === "retinalThermal");
  const photo = limits.find((l) => l.kind === "retinalPhotochemical");
  if (!thermal || !photo) return NaN;
  const lower = (t: number) => exposureLimit(photo, t) <= exposureLimit(thermal, t);
  const t0 = photo.pieces[0].t0;
  if (lower(t0)) return t0;
  const n = 400;
  let lo = t0;
  for (let i = 1; i <= n; i++) {
    const hi = t0 * Math.pow(T_MAX / t0, i / n);
    if (!lower(hi)) {
      lo = hi;
      continue;
    }
    let a = lo;
    let b = hi;
    for (let k = 0; k < 200 && b / a - 1 > 1e-12; k++) {
      const mid = Math.sqrt(a * b);
      if (lower(mid)) b = mid;
      else a = mid;
    }
    return b;
  }
  return NaN;
}

export interface LimitDuration {
  readonly kind: EyeLimitKind;
  /** Longest exposure within this limit, s (Infinity: within it for 30 ks; NaN: exceeded at 1 ns). */
  readonly tMax: number;
  /** Duration the next three are evaluated at: tMax clamped to 1 ns – 30 ks, s. */
  readonly tEval: number;
  /** Averaging aperture diameter at tEval, m. */
  readonly aperture: number;
  /** Beam irradiance averaged over that aperture, W/m². */
  readonly irradiance: number;
  /** The limit at tEval, J/m². */
  readonly limit: number;
}

export interface ExposureDuration {
  /** Shortest tMax over the limits, s; NaN if any is exceeded at 1 ns, or outside 180 nm – 1 mm. */
  readonly tMax: number;
  /** The limit that sets tMax; null if none is reached within 30 ks (or none applies). */
  readonly limiting: EyeLimitKind | null;
  readonly limits: readonly LimitDuration[];
}

/**
 * Every eye limit at λ (m) for a CW beam of power P (W) and 1/e² diameter d (m), and the one reached first; α (rad)
 * is the apparent source's angular subtense (default: a point source).
 */
export function exposureDuration(lambda: number, P: number, d: number, alpha = 0): ExposureDuration {
  const limits = eyeLimits(lambda, alpha).map((limit): LimitDuration => {
    const tMax = limitMaxDuration(limit, P, d);
    const tEval = Number.isNaN(tMax) ? T_MIN : Math.min(Math.max(tMax, limit.pieces[0].t0), T_MAX);
    const aperture = limitingAperture(limit, tEval);
    return { kind: limit.kind, tMax, tEval, aperture, irradiance: apertureIrradiance(P, d, aperture), limit: exposureLimit(limit, tEval) };
  });
  if (limits.length === 0) return { tMax: NaN, limiting: null, limits };
  let first = limits[0];
  for (const l of limits) if (Number.isNaN(l.tMax) || (!Number.isNaN(first.tMax) && l.tMax < first.tMax)) first = l;
  return { tMax: first.tMax, limiting: first.tMax === Infinity ? null : first.kind, limits };
}
