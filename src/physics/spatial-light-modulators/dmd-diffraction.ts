/**
 * DMD diffraction and blaze. A digital micromirror device is a 2-D reflective grating of pitch d whose square mirrors
 * (side w = √F·d, F the fill factor) tilt by ±γ about the pixel diagonal. SI units in and out, angles in rad. Model
 * tier: textbook (scalar Kirchhoff diffraction from flat tilted mirrors, plane wave, infinite array with every mirror
 * in one state). The directions of the orders are exact.
 *
 * Frame: x, y along the pixel rows and columns, z the DMD normal, hinges along (x̂ + ŷ)/√2, so the mirrors tilt in the
 * plane of t̂ = (x̂ − ŷ)/√2 and ẑ. Vectors are (t, h, z), with ĥ = (x̂ + ŷ)/√2. The light arrives in the tilt plane at
 * θi from the normal, the source on the +t̂ side. Output angles θo are positive on the far side of the normal, as in the
 * law of reflection, so the flat (zero-order) reflection leaves at θo = θi. On-state mirror normals tilt by +γ towards
 * the source, off-state ones by −γ.
 *
 * Order (mx, my) leaves along b̂ with b̂ − â = (λ/d)(mx x̂ + my ŷ) in the device plane; the orders (n, −n) stay in the
 * tilt plane, where sin θi − sin θo = n√2 λ/d. A mirror reflects to θo = θi − 2γ: the blaze condition.
 * (P. T. Brown, R. Kruithoff, G. J. Seedorf, D. P. Shepherd, "Multicolor structured illumination microscopy and
 * quantitative control of polychromatic light with a digital micromirror device," Biomed. Opt. Express 12, 3700
 * (2021), doi:10.1364/BOE.422703, Eqs. 6–7.)
 *
 * Each order carries the single-mirror envelope sinc(kw/2 ê_u·(â − b̂)) sinc(kw/2 ê_v·(â − b̂)), with ê_u and ê_v
 * the edges of the tilted mirror (Brown et al. Eqs. 1–2). Along the tilt plane its square falls as sinc⁴ (TI DLPA037A
 * Sec. 2.5). An order's amplitude at the envelope peak is F (the array theorem for a flat array at normal incidence,
 * where all the orders together carry F of the power), so the fraction of the incident power in an order is F² times
 * the envelope squared. Off normal this normalisation is approximate: the order sum is 1.10 F at θi = 45° and 1.28 F
 * at 70° (no shadowing), and a footprint-projected Kirchhoff peak, F² cos²(θi − γ)/(cos θi cos θo), differs by
 * 5–7 % at the usual angles. Treat the absolute power as good to about ±10 %; the angles are exact.
 *
 * Blazed incidence: 2 sin γ cos(θi − γ) = n√2 λ/d, so θi = γ ± acos(nλ/(√2 d sin γ)), the output at −γ ± acos(…)
 * (TI DLPA037A, "Using Lasers with DLP DMD Technology," Eq. 7, written with θtilt = γ).
 */
import { sinc } from "../math";

export type MirrorState = "on" | "off";
/** A unit vector (t, h, z). */
type Vec = readonly [number, number, number];

export interface DmdSetup {
  /** Mirror pitch d, m. */
  pitch: number;
  /** Mirror tilt magnitude γ, rad (12° or 17° on TI DMDs). */
  tilt: number;
  /** Wavelength, m. */
  lambda: number;
  /** Incidence angle θi in the tilt plane, rad, from the DMD normal. */
  incidence: number;
  /** Fill factor F, the fraction of the array area that reflects, 0 < F ≤ 1. */
  fillFactor: number;
  /** Which mirror state the whole array shows. */
  state: MirrorState;
}

export interface DmdOrder {
  mx: number;
  my: number;
  /** Output angle in the tilt plane (projection onto it), rad, positive on the far side of the normal from the source. */
  outputAngle: number;
  /** Angle out of the tilt plane, rad; 0 for the orders (n, −n). */
  elevation: number;
  /** Angle between the order and the mirror reflection, rad. */
  deviation: number;
  /** Single-mirror envelope squared at the order: 1 when blazed. */
  envelope: number;
  /** Fraction of the incident power in the order, F² × envelope. */
  efficiency: number;
}

export interface DmdDiffraction {
  /** Mirror (specular) reflection angle in the tilt plane, θi ∓ 2γ, rad; NaN when the geometry fails. */
  onAngle: number;
  /** Order number of the mirror reflection, (sin θi − sin θ_on)·d/(√2 λ): blazed when whole, anti-blazed at n + ½. */
  blazeOrder: number;
  /** The propagating order with the largest envelope, next to the mirror reflection. */
  nearest: DmdOrder | null;
  /** Why the results are missing. */
  reason?: string;
}

export interface BlazedIncidence {
  /** Order n of the blazed order (n, −n): positive for on-state mirrors, negative for off-state. */
  order: number;
  incidence: number;
  output: number;
}

const R = Math.SQRT1_2;
const X_HAT: Vec = [R, R, 0];
const Y_HAT: Vec = [-R, R, 0];
const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const positive = (x: number) => Number.isFinite(x) && x > 0;

export const GEOMETRY_REASON =
  "At this incidence the light grazes or misses the face of the tilted mirrors, or their reflection points into the device (|θi ∓ γ| and |θi ∓ 2γ| must stay below 90°).";

function validSetup({ pitch, tilt, lambda, incidence, fillFactor }: DmdSetup): boolean {
  return positive(pitch) && positive(lambda) && positive(tilt) && tilt < Math.PI / 4
    && Number.isFinite(incidence) && Math.abs(incidence) < Math.PI / 2 && fillFactor > 0 && fillFactor <= 1;
}

/** Signed tilt: +γ for on-state mirrors, −γ for off-state. */
const signedTilt = (tilt: number, state: MirrorState) => (state === "off" ? -tilt : tilt);

/** The tilted mirror: normal and edge directions ê_u, ê_v (x̂ and ŷ turned by γ about ĥ). */
function mirror(gamma: number) {
  const c = Math.cos(gamma), s = Math.sin(gamma);
  return { normal: [s, 0, c] as Vec, u: [c * R, R, -s * R] as Vec, v: [-c * R, R, s * R] as Vec };
}

function geometry(p: DmdSetup) {
  const gamma = signedTilt(p.tilt, p.state);
  const m = mirror(gamma);
  const a: Vec = [-Math.sin(p.incidence), 0, -Math.cos(p.incidence)];
  const an = dot(a, m.normal);
  const on: Vec = [a[0] - 2 * an * m.normal[0], a[1] - 2 * an * m.normal[1], a[2] - 2 * an * m.normal[2]];
  // The source must face the mirror (â·n̂ < 0) and the reflection must leave the device (b_z > 0).
  const ok = an < 0 && on[2] > 1e-9;
  return { gamma, m, a, on, ok };
}

function orderAt(p: DmdSetup, g: ReturnType<typeof geometry>, mx: number, my: number): DmdOrder | null {
  const step = p.lambda / p.pitch;
  const bt = g.a[0] + (mx - my) * step * R;
  const bh = (mx + my) * step * R;
  const bz2 = 1 - bt * bt - bh * bh;
  if (!(bz2 > 1e-12)) return null;
  const b: Vec = [bt, bh, Math.sqrt(bz2)];
  const q: Vec = [g.a[0] - b[0], g.a[1] - b[1], g.a[2] - b[2]];
  const half = (Math.PI * Math.sqrt(p.fillFactor) * p.pitch) / p.lambda; // kw/2
  const envelope = (sinc(half * dot(g.m.u, q)) * sinc(half * dot(g.m.v, q))) ** 2;
  return {
    mx, my,
    outputAngle: -Math.atan2(b[0], b[2]),
    elevation: Math.asin(b[1]),
    deviation: Math.acos(Math.min(1, Math.max(-1, dot(b, g.on)))),
    envelope,
    efficiency: p.fillFactor * p.fillFactor * envelope,
  };
}

/** Fractional order coordinates (mx, my) of the mirror reflection. */
function fractionalOrder(p: DmdSetup, g: ReturnType<typeof geometry>): [number, number] {
  const d: Vec = [g.on[0] - g.a[0], g.on[1] - g.a[1], g.on[2] - g.a[2]];
  const k = p.pitch / p.lambda;
  return [dot(d, X_HAT) * k, dot(d, Y_HAT) * k];
}

/** Beyond this angle (incidence or output) the scalar power estimate is unreliable and the order search may miss a stronger order. */
export const STEEP_ANGLE = (60 * Math.PI) / 180;
export const STEEP_WARNING = "The incidence or the order is steeper than 60°: the scalar power estimate is unreliable there (shadowing, obliquity), and a stronger order may lie further from the mirror reflection.";

/** Mirror reflection, its order number and the order nearest it: the largest envelope among the 3 × 3 lattice
 * neighbours of the mirror reflection (near grazing a stronger order can lie further out; see STEEP_WARNING). */
export function dmdDiffraction(p: DmdSetup): DmdDiffraction {
  if (!validSetup(p)) return { onAngle: NaN, blazeOrder: NaN, nearest: null, reason: "Enter a positive pitch, wavelength and tilt, |θi| < 90° and 0 < F ≤ 1." };
  const g = geometry(p);
  if (!g.ok) return { onAngle: NaN, blazeOrder: NaN, nearest: null, reason: GEOMETRY_REASON };
  const [fx, fy] = fractionalOrder(p, g);
  let nearest: DmdOrder | null = null;
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      const o = orderAt(p, g, Math.round(fx) + i, Math.round(fy) + j);
      if (o && (!nearest || o.envelope > nearest.envelope)) nearest = o;
    }
  }
  return {
    onAngle: -Math.atan2(g.on[0], g.on[2]),
    blazeOrder: fx,
    nearest,
    reason: nearest ? undefined : "No order next to the mirror reflection propagates: it is too close to grazing for this λ/d.",
  };
}

/** Propagating orders within `reach` lattice steps of the mirror reflection, for the order map. */
export function ordersNearBlaze(p: DmdSetup, reach = 4): DmdOrder[] {
  if (!validSetup(p)) return [];
  const g = geometry(p);
  if (!g.ok) return [];
  const [fx, fy] = fractionalOrder(p, g);
  const out: DmdOrder[] = [];
  for (let i = -reach; i <= reach; i++) {
    for (let j = -reach; j <= reach; j++) {
      const o = orderAt(p, g, Math.round(fx) + i, Math.round(fy) + j);
      if (o) out.push(o);
    }
  }
  return out;
}

/**
 * Incidence angles that blaze an order exactly, with both beams inside ±90°: cos(θi − γ) = nλ/(√2 d sin γ) needs that
 * ratio between sin γ and 1 (TI DLPA037A Eq. 7). Sorted by incidence.
 */
export function blazedIncidences(lambda: number, pitch: number, tilt: number, state: MirrorState): BlazedIncidence[] {
  if (!(positive(lambda) && positive(pitch) && positive(tilt) && tilt < Math.PI / 4)) return [];
  const gamma = signedTilt(tilt, state);
  const sign = Math.sign(gamma);
  const out: BlazedIncidence[] = [];
  for (let n = 1; n < 10_000; n++) {
    const u = (n * lambda) / (Math.SQRT2 * pitch * Math.sin(tilt));
    if (u > 1) break;
    const a = Math.acos(u);
    for (const s of [1, -1]) {
      if (s === -1 && a === 0) continue; // Littrow (u = 1): one incidence, not two
      const incidence = gamma + s * a, output = s * a - gamma;
      if (Math.abs(incidence) < Math.PI / 2 && Math.abs(output) < Math.PI / 2) out.push({ order: sign * n, incidence, output });
    }
  }
  return out.sort((x, y) => x.incidence - y.incidence);
}

/** The blazed incidence closest to the current one, or null when no order can be blazed. */
export function nearestBlazedIncidence(list: readonly BlazedIncidence[], incidence: number): BlazedIncidence | null {
  let best: BlazedIncidence | null = null;
  for (const b of list) if (!best || Math.abs(b.incidence - incidence) < Math.abs(best.incidence - incidence)) best = b;
  return best;
}
