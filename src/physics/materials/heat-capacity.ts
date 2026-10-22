/**
 * Heat capacity of optical solids from the Debye model, scaled to a measured room-temperature value. SI units:
 * specific heat in J/(kg·K), temperatures in K, masses in kg, densities in kg/m³.
 *
 * Debye heat capacity per atom, with x = θ_D/T (C. Kittel, Introduction to Solid State Physics, 8th ed., Wiley 2005,
 * ch. 5; P. Debye, Ann. Phys. 344, 789 (1912), doi:10.1002/andp.19123441404):
 *   C_V/(3Nk_B) = D(x) = (3/x³) ∫₀ˣ t⁴eᵗ/(eᵗ − 1)² dt,   D → 1 for T ≫ θ_D,   D → (4π⁴/5)(T/θ_D)³ for T ≪ θ_D.
 * The page scales it to a measured value: c_p(T) = c_ref · D(θ_D/T)/D(θ_D/T_ref).
 * Model tier: textbook. One Debye temperature for all T (the real θ_D of Si dips by ~15 % near 40 K), and no
 * c_p − c_V or anharmonic term, so above room temperature the scaled curve runs low: Si at 1000 K gives 0.87 against
 * the measured 0.946 J/(g·K) (P. D. Desai, J. Phys. Chem. Ref. Data 15, 967 (1986), doi:10.1063/1.555761, Table 5).
 *
 * Diamond is left out: with its low-temperature θ_D = 2250 K the Debye value at 273 K is 266 J/(kg·K), about half of
 * the measured 502, so one θ_D cannot carry its steep rise through room temperature.
 *
 * Sources of the presets:
 * - θ_D: experimental values from Landolt–Börnstein (O. Madelung, U. Rössler, M. Schulz), as tabulated in
 *   M. Råsander, M. A. Moram, J. Chem. Phys. 143, 144104 (2015), doi:10.1063/1.4932334 (arXiv:1505.02379), Table VII.
 * - Si c_p: Desai 1986 Table 4, 20.007 J/(mol·K) at 298.15 K. The others and all densities: Crystran data sheets.
 */

import { R_gas } from "../constants";

/** ∫₀^∞ t⁴eᵗ/(eᵗ − 1)² dt = 4π⁴/15. */
const DEBYE_INTEGRAL_INF = (4 * Math.PI ** 4) / 15;

const debyeIntegrand = (t: number) => (t === 0 ? 0 : (t ** 4 * Math.exp(t)) / Math.expm1(t) ** 2);

/**
 * Debye function D(x) = C_V/(3Nk_B) at x = θ_D/T, by Simpson's rule (400 intervals, relative error < 1e-9);
 * beyond x = 50 the integral to x equals 4π⁴/15 to 1e-17, so D = 3(4π⁴/15)/x³. NaN for x < 0; 1 at x = 0.
 */
export function debyeFunction(x: number): number {
  if (!(x >= 0) || !Number.isFinite(x)) return NaN;
  if (x === 0) return 1;
  if (x > 50) return (3 * DEBYE_INTEGRAL_INF) / x ** 3;
  const n = 400;
  const dt = x / n;
  let sum = debyeIntegrand(0) + debyeIntegrand(x);
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * debyeIntegrand(i * dt);
  return (3 / x ** 3) * (sum * dt) / 3;
}

/** Debye molar heat capacity of a solid with `atoms` atoms per formula unit, J/(mol·K): 3·atoms·R·D(θ_D/T). */
export function debyeMolarHeatCapacity(thetaD: number, T: number, atoms = 1): number {
  if (!(thetaD > 0 && T > 0 && atoms > 0)) return NaN;
  return 3 * atoms * R_gas * debyeFunction(thetaD / T);
}

/** Specific heat c_ref · D(θ_D/T)/D(θ_D/T_ref), J/(kg·K); NaN unless every argument is positive. */
export function scaledHeatCapacity(cRef: number, tRef: number, thetaD: number, T: number): number {
  if (!(cRef > 0 && tRef > 0 && thetaD > 0 && T > 0)) return NaN;
  return (cRef * debyeFunction(thetaD / T)) / debyeFunction(thetaD / tRef);
}

/**
 * Heat to take a mass m (kg) from T₁ to T₂ (K): m ∫ c_p dT with the scaled Debye c_p, by Simpson's rule
 * (200 intervals), J. Negative when T₂ < T₁ (heat released).
 */
export function heatInput(cRef: number, tRef: number, thetaD: number, mass: number, T1: number, T2: number): number {
  if (!(mass >= 0 && T1 > 0 && T2 > 0)) return NaN;
  if (T1 === T2) return 0;
  const n = 200;
  const dT = (T2 - T1) / n;
  const f = (T: number) => scaledHeatCapacity(cRef, tRef, thetaD, T);
  let sum = f(T1) + f(T2);
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * f(T1 + i * dT);
  return (mass * sum * dT) / 3;
}

export type HeatCapacityMaterialId = "si" | "ge" | "caf2" | "lif";

export interface HeatCapacityMaterial {
  readonly name: string;
  /** Measured specific heat at tRef, J/(kg·K). */
  readonly cRef: number;
  /** Temperature of cRef, K (room temperature where the data sheet gives none: 298.15 K). */
  readonly tRef: number;
  /** Debye temperature, K. */
  readonly thetaD: number;
  /** Density, kg/m³. */
  readonly density: number;
}

export const HEAT_CAPACITY_MATERIALS: Record<HeatCapacityMaterialId, HeatCapacityMaterial> = {
  si: { name: "Silicon", cRef: 20.007 / 28.0855e-3, tRef: 298.15, thetaD: 645, density: 2330 },
  ge: { name: "Germanium", cRef: 310, tRef: 298.15, thetaD: 373, density: 5330 },
  caf2: { name: "CaF₂", cRef: 854, tRef: 298.15, thetaD: 510, density: 3180 },
  lif: { name: "LiF", cRef: 1562, tRef: 298.15, thetaD: 732, density: 2639 },
};
