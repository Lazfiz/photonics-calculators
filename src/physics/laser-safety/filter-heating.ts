/**
 * Heating of a protective filter or a lens by the laser power it absorbs: the temperature rise at the beam centre on
 * the front face. SI units: power in W, lengths in m, time in s, temperature rise in K.
 * Model tier: textbook. Linear heat conduction with constant properties (Carslaw & Jaeger, "Conduction of Heat in
 * Solids", 2nd ed., 1959): a round Gaussian beam (1/e² radius w) deposits the absorbed power P either at the front
 * face (an absorbing filter, whose absorption length is much shorter than w) or evenly through the thickness L (a
 * weakly absorbing optic). The plate is laterally infinite and its faces are insulated (no convection or radiation),
 * so the result errs high for long exposures.
 * - Even through the thickness: a 2-D Gaussian source, ΔT(t) = P/(4πKL) · ln(1 + 8κt/w²).
 * - At the face of a half-space: ΔT(t) = √2 P/(π^1.5 K w) · arctan(√(8κt)/w), which tends to P/(√(2π) K w)
 *   (Lax, J. Appl. Phys. 48, 3919, 1977, with the 1/e radius a = w/√2: P/(2√π K a)). The insulated back face at L adds
 *   image sources at 2nL, n ≠ 0: P/(ρc) ∫₀ᵗ 2 Σₙ≥₁ exp(−n²L²/(κτ)) / (√(πκτ) · 2π(w²/4 + 2κτ)) dτ, integrated
 *   numerically; for κt ≫ L² the face case grows like the even case.
 * κ = K/(ρc). Not modelled: the lens edge (heat sinks there once √(8κt) reaches the lens radius), thermal stress
 * (glass can crack at a far smaller rise than its transition temperature), dye bleaching, saturable absorption.
 */

export interface FilterMaterial {
  readonly label: string;
  /** Thermal conductivity, W/(m·K). */
  readonly K: number;
  /** Density, kg/m³. */
  readonly rho: number;
  /** Specific heat, J/(kg·K). */
  readonly cp: number;
  /** Glass transition temperature, °C: above it the filter softens and deforms. */
  readonly tg: number;
}

/**
 * Typical room-temperature values. Polymers: J. E. Mark (ed.), "Physical Properties of Polymers Handbook", 2nd ed.,
 * Springer 2007 (PC, PMMA). Glass: SCHOTT N-BK7 data sheet (K 1.114 W/(m·K), ρ 2.51 g/cm³, c_p 0.858 J/(g·K),
 * T_g 557 °C); absorbing filter glasses are close to it.
 */
export const FILTER_MATERIALS = {
  polycarbonate: { label: "Polycarbonate", K: 0.2, rho: 1200, cp: 1200, tg: 145 },
  pmma: { label: "PMMA (acrylic)", K: 0.19, rho: 1190, cp: 1420, tg: 105 },
  glass: { label: "Filter glass (N-BK7 values)", K: 1.114, rho: 2510, cp: 858, tg: 557 },
} as const satisfies Record<string, FilterMaterial>;

export type FilterMaterialKey = keyof typeof FILTER_MATERIALS;

/** Where the absorbed power is deposited: at the front face or evenly through the thickness. */
export type HeatDeposition = "surface" | "volume";

/** Thermal diffusivity κ = K/(ρc), m²/s. */
export const thermalDiffusivity = (m: FilterMaterial) => m.K / (m.rho * m.cp);

/** Σₙ≥₁ 2·exp(−n²a), a > 0; by the Jacobi theta identity √(π/a)(1 + 2Σₘ≥₁ exp(−π²m²/a)) − 1 for a < 1. */
function imageSum(a: number): number {
  let s = 0;
  if (a >= 1) {
    for (let n = 1; n < 50; n++) {
      const term = Math.exp(-n * n * a);
      s += 2 * term;
      if (term < 1e-17) break;
    }
    return s;
  }
  for (let m = 1; m < 50; m++) {
    const term = Math.exp((-Math.PI * Math.PI * m * m) / a);
    s += 2 * term;
    if (term < 1e-17) break;
  }
  return Math.sqrt(Math.PI / a) * (1 + s) - 1;
}

/**
 * Temperature rise, K, at the beam centre on the front face after t (s) of absorbed power P (W) from a Gaussian beam
 * of 1/e² diameter d (m), in a plate of thickness L (m). NaN for P < 0, d ≤ 0, L ≤ 0 or t < 0.
 */
export function filterTemperatureRise(
  P: number, d: number, L: number, t: number, material: FilterMaterial, deposition: HeatDeposition,
): number {
  if (!(P >= 0 && d > 0 && L > 0 && t >= 0)) return NaN;
  const { K } = material;
  const kappa = thermalDiffusivity(material);
  const w = d / 2;
  if (deposition === "volume") return (P / (4 * Math.PI * K * L)) * Math.log1p((8 * kappa * t) / (w * w));
  const halfSpace = ((Math.SQRT2 * P) / (Math.pow(Math.PI, 1.5) * K * w)) * Math.atan(Math.sqrt(8 * kappa * t) / w);
  // Images: integrand in u = ln τ; below τ₀ = L²/(40κ) every image term is < exp(−40).
  const tau0 = (L * L) / (40 * kappa);
  if (!(t > tau0)) return halfSpace;
  const f = (tau: number) =>
    (tau * imageSum((L * L) / (kappa * tau))) / (Math.sqrt(Math.PI * kappa * tau) * 2 * Math.PI * ((w * w) / 4 + 2 * kappa * tau));
  const n = 600; // Simpson intervals in ln τ; the integrand is smooth there (relative error < 1e-9 in the tests)
  const u0 = Math.log(tau0);
  const h = (Math.log(t) - u0) / n;
  let sum = f(tau0) + f(t);
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * f(Math.exp(u0 + i * h));
  return halfSpace + (P / (material.rho * material.cp)) * (sum * h) / 3;
}

/**
 * Exposure time, s, at which the rise reaches ΔT (K): bisection in log t (relative 1e-10) on 1 ns – 30 ks, as the rise
 * grows with t. Infinity if it stays below ΔT for 30 ks; NaN for ΔT ≤ 0 or invalid input.
 */
export function timeToTemperatureRise(
  dT: number, P: number, d: number, L: number, material: FilterMaterial, deposition: HeatDeposition,
): number {
  const rise = (t: number) => filterTemperatureRise(P, d, L, t, material, deposition);
  if (!(dT > 0) || Number.isNaN(rise(1))) return NaN;
  let lo = 1e-9;
  let hi = 3e4;
  if (rise(hi) < dT) return Infinity;
  if (rise(lo) >= dT) return lo;
  for (let i = 0; i < 200 && hi / lo - 1 > 1e-10; i++) {
    const mid = Math.sqrt(lo * hi);
    if (rise(mid) >= dT) hi = mid;
    else lo = mid;
  }
  return hi;
}
