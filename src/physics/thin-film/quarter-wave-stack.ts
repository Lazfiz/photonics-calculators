/**
 * Closed forms for a periodic quarter-wave stack (HL)^N: the width of its high-reflectance zone (stop
 * band), the first-order shift of the zone with the angle of incidence, and the reflection group delay
 * at λ₀ of the semi-infinite stack. Also the band edges of an actual stack at a reflectance level.
 *
 * Model tier: Exact for the zone edges of a lossless, non-dispersive quarter-wave stack at normal
 * incidence in the limit of many periods, where the period's characteristic matrix has half-trace −1
 * (Born & Wolf §1.6.5). A finite stack's 50 % points lie a little outside these edges. Textbook (first
 * order) for the angle shift: the zone centre is put where the period's phase thickness is π.
 *
 * References: H. A. Macleod, Thin-Film Optical Filters, 4th ed. (CRC Press, 2010), ch. 6 (multilayer
 * high-reflectance coatings: Δg = (2/π) asin((n_H − n_L)/(n_H + n_L)) in g = λ₀/λ) and ch. 2 (phase
 * thickness 2πNd cos θ/λ). M. Born & E. Wolf, Principles of Optics, 7th ed. (Cambridge University
 * Press, 1999), §1.6.5 (periodically stratified media).
 */
import { c } from "../constants";
import { firstCrossing } from "../math";
import { stackResponse, type Stack } from "./transfer-matrix";

/**
 * Half-width Δg of the high-reflectance zone, in g = λ₀/λ: Δg = (2/π) asin(|n_H − n_L|/(n_H + n_L)).
 * The zone spans g = 1 ± Δg. NaN unless n_H, n_L > 0.
 */
export function stopBandHalfWidth(nH: number, nL: number): number {
  if (!(nH > 0 && nL > 0)) return NaN;
  return (2 / Math.PI) * Math.asin(Math.abs(nH - nL) / (nH + nL));
}

/** Edges of the zone around λ₀ (m): short = λ₀/(1 + Δg), long = λ₀/(1 − Δg). NaN unless λ₀ > 0. */
export function stopBandEdges(lambda0: number, nH: number, nL: number): { short: number; long: number } {
  const dg = stopBandHalfWidth(nH, nL);
  if (!(lambda0 > 0) || Number.isNaN(dg)) return { short: NaN, long: NaN };
  return { short: lambda0 / (1 + dg), long: lambda0 / (1 - dg) };
}

/**
 * Smallest ratio λ₂/λ₁ of the design wavelengths of two stacks (same n_H, n_L) whose zones don't
 * overlap: λ₁/(1 − Δg) ≤ λ₂/(1 + Δg), so λ₂/λ₁ ≥ (1 + Δg)/(1 − Δg).
 */
export function nonOverlappingRatio(nH: number, nL: number): number {
  const dg = stopBandHalfWidth(nH, nL);
  return (1 + dg) / (1 - dg);
}

/**
 * Zone centre (m) at angle of incidence θ₀ (rad) from an incident medium of index n₀, for layers that
 * are quarter waves at λ₀ at normal incidence. A layer's phase thickness is (π/2)(λ₀/λ) cos θᵢ with
 * cos θᵢ = √(1 − (n₀ sin θ₀/nᵢ)²) (Snell); the period's phase is π at λ_c = λ₀ (cos θ_H + cos θ_L)/2.
 * First order: the same for s and p. NaN unless λ₀, n₀, n_H, n_L > 0, 0 ≤ θ₀ < π/2 and the light
 * propagates in both layers (n₀ sin θ₀ < n_H, n_L).
 */
export function stopBandCentreAtAngle(lambda0: number, nH: number, nL: number, angle: number, incident = 1): number {
  if (!(lambda0 > 0 && nH > 0 && nL > 0 && incident > 0 && angle >= 0 && angle < Math.PI / 2)) return NaN;
  const s = incident * Math.sin(angle);
  if (!(s < nH && s < nL)) return NaN;
  const cosH = Math.sqrt(1 - (s / nH) ** 2);
  const cosL = Math.sqrt(1 - (s / nL) ** 2);
  return (lambda0 * (cosH + cosL)) / 2;
}

/**
 * Wavelengths (m) where the reflectance first falls to `level` going out from λ₀ on either side: the
 * edges of the reflection band that contains λ₀, side lobes ignored. For a lossless stack of whole
 * quarter waves at λ₀, at normal incidence, R(g) = R(2 − g) in g = λ₀/λ: a quarter-wave layer's cos δ
 * changes sign and its sin δ doesn't, a half-wave layer's the reverse, so Y(2 − g) = conj Y(g).
 * One side is scanned, g from 1 to 1 + span (span ≤ 0.9; 400 intervals, then bisection by
 * `firstCrossing`), and the other edge is its mirror 2 − g. NaN if R(λ₀) ≤ level or R stays above
 * level to the end of the span.
 */
export function reflectionBandEdges(
  stack: Stack,
  lambda0: number,
  level: number,
  span: number,
): { short: number; long: number } {
  const none = { short: NaN, long: NaN };
  if (!(lambda0 > 0 && span > 0)) return none;
  const R = (g: number) => stackResponse(stack, lambda0 / g).R;
  if (!(R(1) > level)) return none;
  const g = firstCrossing(R, 1, 1 + Math.min(span, 0.9), level, 400);
  return Number.isFinite(g) ? { short: lambda0 / g, long: lambda0 / (2 - g) } : none;
}

/**
 * Group delay on reflection at λ₀ (s) of a semi-infinite lossless quarter-wave stack at normal
 * incidence, from an incident medium of index n₀ (front face as reference plane):
 *   high-index layer outermost ((HL)ᴺH, r → −1):  τ = λ₀ n₀ / (2c (n_H − n_L))
 *   low-index layer outermost  ((LH)ᴺ,  r → +1):  τ = λ₀ n_H n_L / (2c n₀ (n_H − n_L)).
 * Derivation: at g = 1 + ε a quarter-wave layer of admittance η maps a real Y to η²/Y·(1 + i s(η/Y − Y/η))
 * to first order in s = πε/2 (e^(−iωt)). Summed through the stack, the phase terms grow as (n_H/n_L)^(2k);
 * their limit gives arg r = πε n₀/(n_H − n_L) (high outermost, arg r measured from π) or
 * πε n_H n_L/(n₀(n_H − n_L)), and τ = d(arg r)/dω = (1/ω₀) d(arg r)/dε. A stack of N periods approaches
 * it as (n_L/n_H)^(2N). The delay of quarter-wave mirrors is treated in Babic & Corzine, IEEE J. Quantum
 * Electron. 28, 514 (1992). NaN unless n_H > n_L > 0, n₀ > 0 and λ₀ > 0.
 */
export function quarterWaveMirrorDelay(
  lambda0: number,
  nH: number,
  nL: number,
  incident: number,
  outer: "high" | "low",
): number {
  if (!(lambda0 > 0 && nH > nL && nL > 0 && incident > 0)) return NaN;
  const base = lambda0 / (2 * c * (nH - nL));
  return outer === "high" ? base * incident : (base * nH * nL) / incident;
}

/**
 * Fewest pairs N for which the quarter-wave stack (HL)^N (H facing the incident medium n₀, L on the
 * substrate n_s) reflects at least R at λ₀. Its admittance is Y = (n_H/n_L)^(2N) n_s, so
 * R = ((n₀ − Y)/(n₀ + Y))² = tanh²(N ln(n_H/n_L) + ½ ln(n_s/n₀)) (Macleod ch. 2, Y → n²/Y), and
 * N = ⌈(atanh √R − ½ ln(n_s/n₀)) / ln(n_H/n_L)⌉, at least 0. NaN unless n_H > n_L > 0, n₀, n_s > 0 and 0 ≤ R < 1.
 */
export function quarterWavePairsForReflectance(R: number, nH: number, nL: number, incident: number, substrate: number): number {
  if (!(R >= 0 && R < 1 && nH > nL && nL > 0 && incident > 0 && substrate > 0)) return NaN;
  const n = (Math.atanh(Math.sqrt(R)) - 0.5 * Math.log(substrate / incident)) / Math.log(nH / nL);
  return Math.max(0, Math.ceil(n));
}
