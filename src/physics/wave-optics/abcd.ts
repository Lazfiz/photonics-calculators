/**
 * Paraxial ray-transfer (ABCD) matrices. SI units: ray height y in m, ray angle θ in rad (real angle, not the
 * reduced angle nθ), so a flat interface has det = n₁/n₂ and a system has det = n_in/n_out. Mirrors are unfolded
 * (the axis is reflected with the ray), and a concave mirror has R > 0, focal length R/2. Model tier: exact
 * within the paraxial approximation. H. Kogelnik & T. Li, Appl. Opt. 5, 1550 (1966), doi 10.1364/AO.5.001550,
 * table I; A. Gerrard & J. M. Burch, Introduction to Matrix Methods in Optics (Wiley, 1975).
 */

export interface Abcd {
  A: number;
  B: number;
  C: number;
  D: number;
}

export type AbcdElement =
  | { kind: "space"; d: number }
  | { kind: "lens"; f: number }
  | { kind: "flat-mirror" }
  | { kind: "curved-mirror"; R: number }
  | { kind: "interface"; n1: number; n2: number };

export const IDENTITY: Abcd = { A: 1, B: 0, C: 0, D: 1 };

/** Matrix of one element; NaN entries for a non-physical parameter (d < 0, f = 0, R = 0, n ≤ 0). */
export function elementMatrix(el: AbcdElement): Abcd {
  const bad = { A: NaN, B: NaN, C: NaN, D: NaN };
  switch (el.kind) {
    case "space":
      return el.d >= 0 && Number.isFinite(el.d) ? { A: 1, B: el.d, C: 0, D: 1 } : bad;
    case "lens":
      return el.f !== 0 && !Number.isNaN(el.f) ? { A: 1, B: 0, C: -1 / el.f, D: 1 } : bad;
    case "flat-mirror":
      return IDENTITY;
    case "curved-mirror":
      return el.R !== 0 && !Number.isNaN(el.R) ? { A: 1, B: 0, C: -2 / el.R, D: 1 } : bad;
    case "interface":
      return el.n1 > 0 && el.n2 > 0 && Number.isFinite(el.n1 / el.n2) ? { A: 1, B: 0, C: 0, D: el.n1 / el.n2 } : bad;
  }
}

/** Product m₂·m₁ (m₁ acts first). */
export function multiply(m2: Abcd, m1: Abcd): Abcd {
  return {
    A: m2.A * m1.A + m2.B * m1.C,
    B: m2.A * m1.B + m2.B * m1.D,
    C: m2.C * m1.A + m2.D * m1.C,
    D: m2.C * m1.B + m2.D * m1.D,
  };
}

/** System matrix M = Mₙ ⋯ M₂ M₁ for elements listed in the order the ray meets them. */
export function systemMatrix(elements: readonly AbcdElement[]): Abcd {
  return elements.reduce((M, el) => multiply(elementMatrix(el), M), IDENTITY);
}

/** Expected determinant: the product of n₁/n₂ over the interfaces (1 without any). */
export function expectedDeterminant(elements: readonly AbcdElement[]): number {
  return elements.reduce((p, el) => (el.kind === "interface" ? (p * el.n1) / el.n2 : p), 1);
}

export const determinant = (M: Abcd) => M.A * M.D - M.B * M.C;

/** Output ray (y, θ) = M · (y₀, θ₀). */
export function traceRay(M: Abcd, y0: number, theta0: number): { y: number; theta: number } {
  return { y: M.A * y0 + M.B * theta0, theta: M.C * y0 + M.D * theta0 };
}
