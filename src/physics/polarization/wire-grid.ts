/**
 * Wire-grid polarizer as a free-standing grating of thin metal strips (period p, strip width w, thickness h) at normal
 * incidence, in the quasi-static limit p ≪ λ. SI units (m, S/m, Ω). Model tier: textbook approximation (equivalent
 * circuit; Marcuvitz, Waveguide Handbook, 1951, ch. 5; Ulrich, Infrared Phys. 7, 37 (1967)).
 *
 * The grid is a shunt impedance Z across free space (Z₀ on both sides): t = 2Z/(2Z + Z₀), r = −Z₀/(2Z + Z₀),
 * T = |t|², R = |r|², and the strips absorb A = 1 − T − R = 4Z₀ Re Z/|2Z + Z₀|² ≥ 0 (e^{iωt}: inductance +iωL).
 * - E along the strips (inductive): Z_∥ = iZ₀ (p/λ) ln csc(πw/2p) + Z_strip p/w, where Z_strip is the impedance
 *   per square of a strip conducting on both faces, ((1 + i)/(2σδ)) coth((1 + i)h/2δ), δ = √(2/(ωμ₀σ)): 1/(σh) for a
 *   strip thinner than δ, (1 + i)/(2σδ) for a thick one. This loss term uses the DC conductivity and ignores current
 *   crowding at the strip edges, so it is indicative only, best in the far infrared.
 * - E across the strips (capacitive): the complementary screen (Babinet, Z_ind·Z_cap = Z₀²/4) gives the shunt
 *   admittance Y_⊥ = i(4/Z₀)(p/λ) ln csc(πs/2p) for gaps s = p − w; lossless.
 * Valid for p ≪ λ (the formulas are first order in p/λ); at p ≥ λ a diffraction order propagates and they don't
 * apply. The strip height only enters the loss: tall strips (waveguides below cut-off) extinguish more than this
 * thin-sheet model predicts. Extinction ratio T_⊥/T_∥.
 */

import { add, complex, div, mul, scale, abs2, type Complex } from "../complex";
import { c, mu_0, Z_0 } from "../constants";

export interface WireGrid {
  /** Period, m. */
  period: number;
  /** Strip (wire) width, m; 0 < w < p. */
  width: number;
  /** Strip thickness, m (> 0). */
  thickness: number;
  /** DC conductivity of the metal, S/m (Infinity for a perfect conductor). */
  conductivity: number;
}

export interface SheetResponse {
  /** Shunt impedance of the grid, Ω. */
  Z: Complex;
  t: Complex;
  r: Complex;
  T: number;
  R: number;
  A: number;
}

export interface WireGridResponse {
  /** E along the strips (reflected). */
  parallel: SheetResponse;
  /** E across the strips (transmitted). */
  perpendicular: SheetResponse;
  /** T_⊥/T_∥. */
  extinction: number;
  /** p/λ: the model needs p ≪ λ. */
  periodRatio: number;
  /** Skin depth of the metal at λ, m. */
  skinDepth: number;
}

const NAN_C = complex(NaN, NaN);
const NAN_SHEET: SheetResponse = { Z: NAN_C, t: NAN_C, r: NAN_C, T: NaN, R: NaN, A: NaN };

/** t, r, T, R, A of a shunt impedance Z (Ω) across free space. A perfectly open sheet is Z = ∞. */
export function shuntSheet(Z: Complex): SheetResponse {
  if (!Number.isFinite(Z.re) || !Number.isFinite(Z.im)) {
    return { Z, t: complex(1), r: complex(0), T: 1, R: 0, A: 0 };
  }
  const den = add(scale(Z, 2), complex(Z_0));
  const t = div(scale(Z, 2), den);
  const r = div(complex(-Z_0), den);
  const T = abs2(t), R = abs2(r);
  return { Z, t, r, T, R, A: (4 * Z_0 * Z.re) / abs2(den) };
}

/** coth z for complex z (|z| not huge: the caller caps the argument). */
function coth(z: Complex): Complex {
  // coth z = (e^{2z} + 1)/(e^{2z} − 1)
  const e2 = Math.exp(2 * z.re);
  const ez = complex(e2 * Math.cos(2 * z.im), e2 * Math.sin(2 * z.im));
  return div(add(ez, complex(1)), add(ez, complex(-1)));
}

/** Impedance per square of a metal strip conducting on both faces, Ω. */
export function stripSurfaceImpedance(conductivity: number, thickness: number, skinDepth: number): Complex {
  if (conductivity === Infinity) return complex(0);
  const pre = complex(1 / (2 * conductivity * skinDepth), 1 / (2 * conductivity * skinDepth));
  const x = Math.min(thickness / (2 * skinDepth), 40); // coth → 1 beyond a few skin depths
  return mul(pre, coth(complex(x, x)));
}

/** Response of the grid at vacuum wavelength λ (m). NaN everywhere for invalid geometry or p ≥ λ. */
export function wireGridResponse(g: WireGrid, lambda: number): WireGridResponse {
  const valid = g.period > 0 && g.width > 0 && g.width < g.period && g.thickness > 0 && g.conductivity > 0 &&
    lambda > 0 && g.period < lambda;
  const periodRatio = g.period / lambda;
  const omega = (2 * Math.PI * c) / lambda;
  const skinDepth = g.conductivity === Infinity ? 0 : Math.sqrt(2 / (omega * mu_0 * g.conductivity));
  if (!valid) {
    return { parallel: NAN_SHEET, perpendicular: NAN_SHEET, extinction: NaN, periodRatio, skinDepth };
  }
  const gap = g.period - g.width;
  const lnCsc = (a: number) => -Math.log(Math.sin((Math.PI * a) / (2 * g.period)));
  const strip = stripSurfaceImpedance(g.conductivity, g.thickness, skinDepth);
  const Zpar = add(complex(0, Z_0 * periodRatio * lnCsc(g.width)), scale(strip, g.period / g.width));
  const B = (4 / Z_0) * periodRatio * lnCsc(gap);
  const Zperp = complex(0, -1 / B); // 1/(iB)
  const parallel = shuntSheet(Zpar);
  const perpendicular = shuntSheet(Zperp);
  return { parallel, perpendicular, extinction: perpendicular.T / parallel.T, periodRatio, skinDepth };
}
