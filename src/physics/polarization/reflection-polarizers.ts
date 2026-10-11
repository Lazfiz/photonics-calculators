/**
 * Polarizers that work by reflection at oblique incidence: a pile of plates near Brewster's angle and the MacNeille
 * thin-film polarizing beamsplitter cube. SI units (m), angles in radians.
 *
 * Pile of plates (model tier: exact for lossless, plane-parallel plates in air, light incoherent between surfaces):
 * one surface reflects a fraction r (r_s or r_p from `fresnel.ts`; glass → air reflects the same at the refracted
 * angle). Summing the multiple reflections incoherently, m plates (2m surfaces) transmit
 *   T_m = (1 − r)/(1 + (2m − 1) r)
 * (Stokes 1862; Shurcliff, Polarized Light, 1962, ch. 6; Goldstein, Polarized Light, 3rd ed., ch. Mueller Matrices for
 * Dielectric Plates). At Brewster's angle r_p = 0 and r_s = ((n² − 1)/(n² + 1))², so unpolarized light leaves with a
 * degree of polarization P = (T_p − T_s)/(T_p + T_s) = m/(m + (2n/(n² − 1))²). Ignoring the multiple reflections,
 * T = (1 − r)^{2m} instead, which overstates P.
 *
 * MacNeille cube (MacNeille, US patent 2,403,731, 1946; Macleod, Thin-Film Optical Filters, 4th ed., ch. 9 Tilted
 * coatings): a stack of quarter-wave high (n_H) and low (n_L) index layers on the hypotenuse of a glass cube. The
 * H/L interfaces are at Brewster's angle when tan θ_H = n_L/n_H, i.e. when the glass index and the angle in the glass
 * satisfy n_g² sin²θ_g = n_H² n_L²/(n_H² + n_L²). Then p passes the H/L interfaces without reflection while s meets a
 * high-reflector stack. Layers are a quarter wave thick at the angle of use, d = λ₀/(4 n cos θ_layer). The stack is
 * computed exactly with `thin-film/transfer-matrix.ts` (coherent, lossless layers; glass on both sides).
 */

import type { Layer, Polarization, Stack } from "../thin-film/transfer-matrix";
import { stackResponse } from "../thin-film/transfer-matrix";
import { fresnel } from "./fresnel";

/** Transmittance of m lossless plates whose every surface reflects r, incoherent multiple reflections. */
export function plateStackTransmittance(r: number, m: number): number {
  if (!(r >= 0 && r <= 1) || !(m >= 0)) return NaN;
  if (r === 1) return m === 0 ? 1 : 0;
  return (1 - r) / (1 + (2 * m - 1) * r);
}

export interface PileOfPlates {
  /** Single-surface reflectances. */
  rs: number;
  rp: number;
  /** Transmittances of the pile (multiple reflections included). */
  Ts: number;
  Tp: number;
  /** Same, with the multiple reflections ignored: (1 − r)^{2m}. */
  TsSinglePass: number;
  TpSinglePass: number;
  /** Degree of polarization of the transmitted light for unpolarized input, (T_p − T_s)/(T_p + T_s). */
  dop: number;
  /** T_p/T_s. */
  extinction: number;
}

/** m plates of index n in air, light at angle θ. NaN fields for invalid input (see `fresnel`). */
export function pileOfPlates(n: number, theta: number, m: number): PileOfPlates {
  const f = fresnel(1, n, theta);
  const Ts = plateStackTransmittance(f.Rs, m), Tp = plateStackTransmittance(f.Rp, m);
  return {
    rs: f.Rs,
    rp: f.Rp,
    Ts,
    Tp,
    TsSinglePass: (1 - f.Rs) ** (2 * m),
    TpSinglePass: (1 - f.Rp) ** (2 * m),
    dop: (Tp - Ts) / (Tp + Ts),
    extinction: Tp / Ts,
  };
}

/** Degree of polarization after m plates of index n at Brewster's angle: m/(m + (2n/(n² − 1))²). */
export function pileDopAtBrewster(n: number, m: number): number {
  if (!(n > 1) || !(m >= 0)) return NaN;
  const a = (2 * n) / (n * n - 1);
  return m / (m + a * a);
}

/** Glass index that puts the H/L interfaces at Brewster's angle for light at θ_g in the glass (45° in a cube). */
export function macNeilleGlassIndex(nH: number, nL: number, thetaGlass = Math.PI / 4): number {
  if (!(nH > 0 && nL > 0) || !(thetaGlass > 0 && thetaGlass < Math.PI / 2)) return NaN;
  return (nH * nL) / (Math.sin(thetaGlass) * Math.hypot(nH, nL));
}

/** Angle in the glass where the H/L interfaces are at Brewster's angle; NaN when n_g is too low to reach it. */
export function macNeilleAngle(nH: number, nL: number, nGlass: number): number {
  const s = (nH * nL) / (nGlass * Math.hypot(nH, nL));
  return nGlass > 0 && s > 0 && s < 1 ? Math.asin(s) : NaN;
}

export interface MacNeilleDesign {
  nH: number;
  nL: number;
  nGlass: number;
  /** Number of H/L pairs; the stack is (HL)^pairs H. */
  pairs: number;
  /** Design wavelength, m. */
  lambda0: number;
  /** Angle of incidence in the glass, rad. */
  thetaGlass: number;
}

/** The (HL)^N H stack between two glass prisms, quarter-wave at λ₀ and the design angle. Empty when invalid. */
export function macNeilleStack(d: MacNeilleDesign): Stack {
  const beta = d.nGlass * Math.sin(d.thetaGlass);
  const quarter = (n: number) => d.lambda0 / (4 * Math.sqrt(n * n - beta * beta));
  const ok = d.nGlass > 0 && d.lambda0 > 0 && Number.isInteger(d.pairs) && d.pairs >= 0 && d.nH > beta && d.nL > beta;
  const layers: Layer[] = [];
  if (ok) {
    for (let i = 0; i < d.pairs; i++) {
      layers.push({ n: d.nH, thickness: quarter(d.nH) }, { n: d.nL, thickness: quarter(d.nL) });
    }
    layers.push({ n: d.nH, thickness: quarter(d.nH) });
  }
  return { incident: d.nGlass, layers, substrate: { n: d.nGlass } };
}

export interface CubeResponse {
  Rs: number;
  Rp: number;
  Ts: number;
  Tp: number;
}

/**
 * Reflectance and transmittance of the cube's coating at wavelength λ and angle θ in the glass (the design angle by
 * default). NaN when a layer would be evanescent at the design angle (n_layer ≤ n_g sin θ_g).
 */
export function macNeilleResponse(d: MacNeilleDesign, lambda: number, thetaGlass = d.thetaGlass): CubeResponse {
  const stack = macNeilleStack(d);
  if (stack.layers.length === 0) return { Rs: NaN, Rp: NaN, Ts: NaN, Tp: NaN };
  const at = (p: Polarization) => stackResponse(stack, lambda, thetaGlass, p);
  const s = at("s"), p = at("p");
  return { Rs: s.R, Rp: p.R, Ts: s.T, Tp: p.T };
}
