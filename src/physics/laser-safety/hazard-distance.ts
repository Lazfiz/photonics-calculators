/**
 * Hazard distances and protective-eyewear optical density for a laser beam on the ICNIRP 2013 eye limits
 * (`eye-exposure-limits.ts`). SI units: wavelength and lengths in m, angles in rad, power in W, irradiance in W/m².
 * Model tier: exact for the limits and the Gaussian aperture average; the beam geometry is the standards' model.
 *
 * Direct beam (intrabeam viewing): a TEM₀₀ beam of power P leaves the output aperture with 1/e² diameters a_x, a_y and
 * 1/e² full-angle divergences φ_x, φ_y. At range r each axis is a + rφ (linear, as in the NOHD formula of ANSI Z136.1
 * and IEC TR 60825-14) or √(a² + (rφ)²) (a Gaussian beam with its waist at the aperture). An elliptical beam counts as
 * the round beam of the same peak irradiance, diameter √(d_x d_y), also for the 1 mm test of Table 5 note c (ICNIRP
 * doesn't say which diameter of an elliptical beam counts; a 1.2 × 2 mm beam is averaged though its narrow axis is
 * under 1 mm at 1/e). The beam is safe once the irradiance averaged over
 * each limit's aperture D, P(1 − exp(−2D²/d²))/(πD²/4), stays within the limit for every exposure up to t (as in
 * `limitMaxPower`); a beam of 1/e diameter below 1 mm is held to its peak on the cornea below 0.35 s (ICNIRP 2013
 * Table 5 note c). NOHD is the range where the diameter reaches the smallest safe one. For d ≫ D this is the
 * standards' NOHD = (1/φ)(√(4P/(πE)) − a) with 1/e values (E the limit as an irradiance).
 *
 * Diffuse reflection: a Lambertian spot reflecting ρP gives the irradiance ρP/(πr²) at range r on its normal (r ≫ the
 * spot; nearer, the Gaussian spot's exact on-axis form, which tends to its peak exitance). The retinal limits are assessed
 * no nearer than 10 cm, the eye's near point. The spot is an extended source of α = d₆₃/r, d₆₃ = d/√2 the diameter holding 63 % of
 * the power (IEC 60825-1:2014 3.10), which raises the retinal thermal limit through C_E. All of the spot counts (an open
 * field of view), so above α_max C_E = α²/(α_min α_max) (ICNIRP 2013 eqn 5, for a homogeneous circular source; for a
 * Gaussian spot it errs high, as counting the tails outside γ = α_max does). The photochemical limit's field of view
 * γ_ph isn't modelled either: the whole spot counts, which overstates spots larger than γ_ph (11 mrad to 100 s).
 *
 * Not modelled: repetitive pulses, atmospheric attenuation, collecting optics, specular reflections, beams that
 * converge after the aperture.
 */
import {
  ALPHA_MIN, eyeLimits, limitMaxPower, T_MAX, T_MIN, type EyeLimitKind, type TabulatedLimit,
} from "./eye-exposure-limits";
import { expE1Scaled } from "../math";

/** How a beam widens with range: a + rφ (the standards' formula) or √(a² + (rφ)²) (Gaussian, waist at the aperture). */
export type BeamGrowth = "linear" | "gaussian";

/** A beam leaving its output aperture: 1/e² diameters (m) and 1/e² full-angle divergences (rad) along its two axes. */
export interface BeamGeometry {
  readonly d: readonly [number, number];
  readonly phi: readonly [number, number];
  readonly growth: BeamGrowth;
}

export const roundBeam = (d: number, phi: number, growth: BeamGrowth = "linear"): BeamGeometry => ({ d: [d, d], phi: [phi, phi], growth });

/** 1/e² diameter, m, of one axis at range r (m). */
export function axisDiameterAt(a: number, phi: number, r: number, growth: BeamGrowth): number {
  return growth === "linear" ? a + r * phi : Math.hypot(a, r * phi);
}

/** Diameter, m, of the round beam with the same peak irradiance at range r (m): √(d_x d_y). */
export function effectiveDiameterAt(beam: BeamGeometry, r: number): number {
  return Math.sqrt(axisDiameterAt(beam.d[0], beam.phi[0], r, beam.growth) * axisDiameterAt(beam.d[1], beam.phi[1], r, beam.growth));
}

/**
 * Least range r ≥ 0, m, at which √(d_x(r) d_y(r)) reaches D (m): 0 if it already does at the aperture, Infinity if the
 * beam doesn't spread enough. Linear: (a_x + rφ_x)(a_y + rφ_y) = D², a quadratic in r; Gaussian: the same in r² with
 * squared terms. The root is −2c/(b + √(b² − 4ac)), which has no cancellation for c < 0 and holds for a = 0.
 */
export function rangeToDiameter(beam: BeamGeometry, D: number): number {
  const [ax, ay] = beam.d;
  const [px, py] = beam.phi;
  if (!(ax >= 0 && ay >= 0 && px >= 0 && py >= 0 && D >= 0)) return NaN;
  if (Math.sqrt(ax * ay) >= D) return 0;
  const sq = beam.growth === "gaussian";
  const [A, B, C] = sq
    ? [px * px * py * py, ax * ax * py * py + ay * ay * px * px, ax * ax * ay * ay - D ** 4]
    : [px * py, ax * py + ay * px, ax * ay - D * D];
  const denominator = B + Math.sqrt(B * B - 4 * A * C);
  if (!(denominator > 0)) return Infinity;
  const root = (-2 * C) / denominator;
  return sq ? Math.sqrt(root) : root;
}

/**
 * Smallest 1/e² diameter, m, at which a round beam of power P (W) stays within the limit for every exposure up to t
 * (s); 0 if even all of P inside the aperture does. The inverse of `limitMaxPower` in d: at each piece end x ≤ t (the
 * points limitMaxPower checks) the beam is within the limit while 1 − exp(−2D²/d²) ≤ q = H(x)·πD²/(4Px), i.e.
 * d ≥ D·√(2 / −ln(1 − q)) when q < 1. Where the actual-exposure rule applies (d/√2 below `actualBelow`, ICNIRP 2013
 * Table 5 note c) the peak 8P/(πd²) is compared instead, safe from d_pk = √(8Px/(πH)). The peak exceeds the average,
 * so the beam is safe from d_pk if that is below the rule's edge √2·actualBelow, and otherwise from the larger of the
 * edge and the averaged diameter. NaN for P < 0 or t outside 1 ns – 30 ks.
 */
export function limitSafeDiameter(limit: TabulatedLimit, P: number, t: number): number {
  if (!(P >= 0 && t >= T_MIN && t <= T_MAX)) return NaN;
  let dSafe = 0;
  for (const s of limit.pieces) {
    for (const ap of limit.apertures) {
      const t0 = Math.max(s.t0, ap.t0);
      const end = Math.min(s.t1, ap.t1);
      if (!(end > t0 && t0 <= t)) continue;
      for (const x of [t0, Math.min(end, t)]) {
        const D = ap.d * Math.pow(x, ap.q);
        const H = s.a * Math.pow(x, s.p);
        const q = (H * Math.PI * D * D) / (4 * P * x);
        const averaged = q < 1 ? D * Math.sqrt(-2 / Math.log1p(-q)) : 0;
        if (ap.actualBelow === undefined) dSafe = Math.max(dSafe, averaged);
        else {
          const edge = ap.actualBelow * Math.SQRT2;
          const peak = Math.sqrt((8 * P * x) / (Math.PI * H));
          dSafe = Math.max(dSafe, peak < edge ? peak : Math.max(edge, averaged));
        }
      }
    }
  }
  return dSafe;
}

/**
 * Largest uniform irradiance, W/m², at the cornea within the limit for every exposure up to t (s): the least H(x)/x
 * over the piece ends x ≤ t (H/x is monotonic on each piece). Uniform over the aperture, so its size doesn't matter.
 * NaN for t outside 1 ns – 30 ks.
 */
export function limitMaxIrradiance(limit: TabulatedLimit, t: number): number {
  if (!(t >= T_MIN && t <= T_MAX)) return NaN;
  let eMax = Infinity;
  for (const s of limit.pieces) {
    if (!(s.t0 <= t)) continue;
    for (const x of [s.t0, Math.min(s.t1, t)]) eMax = Math.min(eMax, s.a * Math.pow(x, s.p - 1));
  }
  return eMax;
}

export interface LimitHazardDistance {
  readonly kind: EyeLimitKind;
  /** Range, m, beyond which the exposure stays within this limit (0: nowhere above it; Infinity: everywhere). */
  readonly distance: number;
}

export interface HazardDistance {
  /** Largest of the per-limit ranges, m; NaN outside 180 nm – 1 mm or for invalid input. */
  readonly distance: number;
  /** The limit that sets it; null if no limit is exceeded at any range. */
  readonly limiting: EyeLimitKind | null;
  readonly limits: readonly LimitHazardDistance[];
}

function summarize(limits: LimitHazardDistance[]): HazardDistance {
  if (limits.length === 0 || limits.some((l) => Number.isNaN(l.distance))) return { distance: NaN, limiting: null, limits };
  const worst = limits.reduce((w, l) => (l.distance > w.distance ? l : w));
  return { distance: worst.distance, limiting: worst.distance > 0 ? worst.kind : null, limits };
}

/**
 * Nominal ocular hazard distance (NOHD) of a direct beam of power P (W) at λ (m), for exposures up to t (s): for each
 * eye limit, the range where the beam's diameter reaches `limitSafeDiameter`; the NOHD is the largest.
 */
export function nominalOcularHazardDistance(lambda: number, P: number, beam: BeamGeometry, t: number): HazardDistance {
  return summarize(
    eyeLimits(lambda).map((limit) => ({ kind: limit.kind, distance: rangeToDiameter(beam, limitSafeDiameter(limit, P, t)) })),
  );
}

export interface LimitOpticalDensity {
  readonly kind: EyeLimitKind;
  /** Largest power within this limit for this beam, W. */
  readonly pMax: number;
  /** log10(P / pMax), at least 0. */
  readonly od: number;
}

export interface OpticalDensity {
  /** OD that brings the beam within every limit: the largest per-limit OD; NaN outside 180 nm – 1 mm. */
  readonly od: number;
  /** The limit that sets it; null when no filter is needed. */
  readonly limiting: EyeLimitKind | null;
  readonly limits: readonly LimitOpticalDensity[];
}

/**
 * Optical density a filter needs for a beam of power P (W) and 1/e² diameter d (m) at λ (m) to stay within every eye
 * limit for exposures up to t (s): log10(P/P_max) with P_max from `limitMaxPower` (a filter scales the power, not the
 * profile). OD = log10(H/EL) as in ANSI Z136.1 and EN 207; the filter also has to survive the beam. A beam of 1/e
 * diameter d/√2 < 1 mm is held to its peak on the cornea below 0.35 s (ICNIRP 2013 Table 5 note c, in `limitMaxPower`):
 * P_max shrinks by the peak-to-average ratio 2(D/d)²/(1 − exp(−2D²/d²)), D = 1 mm, where that duration binds.
 */
export function requiredOpticalDensity(lambda: number, P: number, d: number, t: number): OpticalDensity {
  const limits = eyeLimits(lambda).map((limit): LimitOpticalDensity => {
    const pMax = limitMaxPower(limit, d, t);
    return { kind: limit.kind, pMax, od: Math.max(0, Math.log10(P / pMax)) };
  });
  if (limits.length === 0 || limits.some((l) => Number.isNaN(l.od))) return { od: NaN, limiting: null, limits };
  const worst = limits.reduce((w, l) => (l.od > w.od ? l : w));
  return { od: worst.od, limiting: worst.od > 0 ? worst.kind : null, limits };
}

/** Irradiance, W/m², at range r (m) on the normal of a Lambertian spot reflecting the power ρP (W): ρP/(πr²), r ≫ spot. */
export function lambertianIrradiance(reflectedPower: number, r: number): number {
  return r > 0 && reflectedPower >= 0 ? reflectedPower / (Math.PI * r * r) : NaN;
}

/**
 * Irradiance, W/m², at range r (m) on the normal of a Lambertian Gaussian spot of 1/e² diameter d (m) reflecting ρP (W).
 * The exitance M(s) = M₀ exp(−8s²/d²), M₀ = 8ρP/(πd²), has radiance M/π, so E = ∫ M(s) r² 2s ds/(r² + s²)²
 * = ρP/(πr²) · F(x), x = 8r²/d², F(x) = x(1 − x eˣE₁(x)) = x eˣE₂(x) (A&S 5.1.14). F → 1 − 2/x far off (the point
 * source; 0.25 % high at r = 10 d) and E → M₀ in contact. Above x = 50 F is the asymptotic series Σ (−1)^k (k+1)!/x^k
 * (A&S 5.1.51), which avoids the cancellation in 1 − x eˣE₁; its smallest term there is < 1e-18.
 */
export function lambertianSpotIrradiance(reflectedPower: number, d: number, r: number): number {
  if (!(reflectedPower >= 0 && d >= 0 && r >= 0) || (d === 0 && r === 0)) return NaN;
  if (r === 0) return (8 * reflectedPower) / (Math.PI * d * d);
  if (d === 0) return lambertianIrradiance(reflectedPower, r);
  const x = (8 * r * r) / (d * d);
  let f: number;
  if (x > 50) {
    f = 0;
    let term = 1;
    for (let k = 0; k < 60 && Math.abs(term) > 1e-18; k++) {
      f += term;
      term *= -(k + 2) / x;
    }
  } else {
    f = x * (1 - x * expE1Scaled(x));
  }
  return lambertianIrradiance(reflectedPower, r) * f;
}

/** Nearest range, m, at which the retinal limits are assessed: the eye accommodates from 10 cm (ICNIRP 2013 p. 275). */
export const NEAR_POINT = 0.1;

const RETINAL: ReadonlySet<EyeLimitKind> = new Set(["retinalThermal", "retinalPhotochemical"]);

/** Angular subtense, rad, of a diffuse spot of 1/e² diameter d (m) seen from r (m): d₆₃ / r with d₆₃ = d/√2. */
export function diffuseSpotSubtense(d: number, r: number): number {
  return d >= 0 && r > 0 ? d / Math.SQRT2 / r : NaN;
}

export interface DiffuseLimitExposure {
  readonly kind: EyeLimitKind;
  /** Largest irradiance within this limit, W/m². */
  readonly eMax: number;
  /** Irradiance this limit compares, W/m²: at the viewer, or at `NEAR_POINT` for a retinal limit viewed closer. */
  readonly irradiance: number;
  /** Irradiance / eMax: above 1 the reflection exceeds the limit. */
  readonly ratio: number;
}

/**
 * Each eye limit for viewing a Lambertian spot (reflected power ρP in W, 1/e² diameter d in m) from r (m), exposures up
 * to t. The corneal and anterior-segment limits take the spot's on-axis irradiance at r (`lambertianSpotIrradiance`).
 * The retinal limits take ρP/(πr²) and α at r_ret = max(r, `NEAR_POINT`): nearer, the eye can't focus the spot, so its
 * retinal image is no sharper than from 10 cm. ρP/(πr²) keeps irradiance / limit monotone in r (with the spot's E and
 * C_E ∝ α² it would fall again close up) and errs high by ≈ d²/(4r²), 1 % for a 20 mm spot at 10 cm.
 * Returns `irradiance` at r, the retinal `alpha` at r_ret, and r_ret.
 */
export function diffuseExposure(lambda: number, reflectedPower: number, d: number, r: number, t: number) {
  const retinalRange = Math.max(r, NEAR_POINT);
  const alpha = diffuseSpotSubtense(d, retinalRange);
  const irradiance = lambertianSpotIrradiance(reflectedPower, d, r);
  const retinalIrradiance = lambertianIrradiance(reflectedPower, retinalRange);
  const limits = eyeLimits(lambda, alpha, "open").map((limit): DiffuseLimitExposure => {
    const eMax = limitMaxIrradiance(limit, t);
    const e = RETINAL.has(limit.kind) ? retinalIrradiance : irradiance;
    return { kind: limit.kind, eMax, irradiance: e, ratio: e / eMax };
  });
  return { alpha, irradiance, retinalRange, limits };
}

/**
 * Range, m, beyond which viewing the Lambertian spot stays within every eye limit (the diffuse NOHD); 0 if it never
 * exceeds one. Without α the per-limit range is √(ρP/(πE_max)) for a point source. The spot's irradiance falls
 * monotonically from M₀ = 8ρP/(πd²) and stays below ρP/(πr²), so a corneal limit is never exceeded if M₀ ≤ E_max and
 * otherwise crosses below the point range (bisection in r, relative 1e-12, ≤ 200 steps). A retinal limit is assessed
 * from `NEAR_POINT`, so a crossing nearer than that is none. The retinal thermal limit grows with α ∝ 1/r: as α (with
 * T₂(α)) up to α_max, more slowly than the irradiance's r⁻², and as α² beyond, like it. So irradiance / limit doesn't
 * rise with r, and bisection in log r finds the crossing below the point-source range; if the ratio is ≤ 1 even at 10⁻¹²
 * of that range (that is, at 10 cm), it never exceeds the limit.
 */
export function diffuseHazardDistance(lambda: number, reflectedPower: number, d: number, t: number): HazardDistance {
  if (!(reflectedPower >= 0 && d >= 0 && t >= T_MIN && t <= T_MAX)) return summarize([]);
  const kinds = eyeLimits(lambda).map((l) => l.kind);
  const ratioAt = (kind: EyeLimitKind, r: number) =>
    diffuseExposure(lambda, reflectedPower, d, r, t).limits.find((l) => l.kind === kind)?.ratio ?? NaN;
  return summarize(
    kinds.map((kind) => {
      if (reflectedPower === 0) return { kind, distance: 0 };
      // At the point-source range the spot subtends less or has a limit at least as high, so the ratio is ≤ 1 there.
      const pointLimit = eyeLimits(lambda).find((l) => l.kind === kind)!;
      const eMax = limitMaxIrradiance(pointLimit, t);
      const rPoint = Math.sqrt(reflectedPower / (Math.PI * eMax));
      if (!RETINAL.has(kind)) {
        if (d === 0) return { kind, distance: rPoint };
        if (lambertianSpotIrradiance(reflectedPower, d, 0) <= eMax) return { kind, distance: 0 };
        let a = 0;
        let b = rPoint;
        for (let i = 0; i < 200 && b - a > 1e-12 * b; i++) {
          const mid = (a + b) / 2;
          if (lambertianSpotIrradiance(reflectedPower, d, mid) > eMax) a = mid;
          else b = mid;
        }
        return { kind, distance: b };
      }
      if (!(rPoint > NEAR_POINT)) return { kind, distance: 0 };
      if (!(diffuseSpotSubtense(d, rPoint) > ALPHA_MIN) || kind !== "retinalThermal") return { kind, distance: rPoint };
      let lo = rPoint * 1e-12;
      let hi = rPoint;
      if (!(ratioAt(kind, lo) > 1)) return { kind, distance: 0 };
      for (let i = 0; i < 200 && hi / lo - 1 > 1e-12; i++) {
        const mid = Math.sqrt(lo * hi);
        if (ratioAt(kind, mid) > 1) lo = mid;
        else hi = mid;
      }
      return { kind, distance: hi };
    }),
  );
}
