/**
 * Thermal evaporation of a metal from a small planar (surface) source: vapour pressure, Hertz–Knudsen
 * evaporation flux, film growth rate on a substrate facing the source, thickness profile across a
 * parallel substrate, residual-gas mean free path and the Movchan–Demchishin structure zone.
 *
 * Model tier: Textbook. The vapour pressures are the Alcock et al. fits (±5 % over 10⁻¹⁵–10⁻³ atm).
 * The flux is the free-evaporation upper limit (evaporation coefficient α ≤ 1, no vapour cloud over the
 * source); the growth rate assumes a cosine (surface) source, a sticking coefficient of 1 and a film at
 * bulk density.
 *
 * References: C. B. Alcock, V. P. Itkin, M. K. Horrigan, Can. Metall. Q. 23, 309 (1984),
 * doi:10.1179/cmq.1984.23.3.309, log₁₀(p/atm) = A + B/T + C log₁₀ T. M. Ohring, Materials Science of
 * Thin Films, 2nd ed. (Academic Press, 2002), ch. 2 (λ = 5×10⁻³/P cm, P in torr, air at room
 * temperature), ch. 3 (Hertz–Knudsen flux, surface-source distribution, thickness uniformity) and ch. 9
 * (structure zones). J. A. Thornton, Annu. Rev. Mater. Sci. 7, 239 (1977), Movchan–Demchishin zones.
 */
import { ATM, R_gas, TORR } from "../constants";

/** log₁₀(p/atm) = A + B/T + C log₁₀ T, T in K. */
type VapourFit = readonly [A: number, B: number, C: number];

export interface Evaporant {
  name: string;
  /** Molar mass (kg/mol), IUPAC standard atomic weight. */
  M: number;
  /** Bulk density at room temperature (kg/m³), CRC Handbook. */
  rho: number;
  /** Melting point (K), as tabulated by Alcock et al. */
  Tm: number;
  solid: VapourFit;
  liquid: VapourFit;
}

/**
 * Alcock, Itkin & Horrigan (1984) coefficients (the D T⁻³ term is zero for these elements), as
 * reproduced in the CRC Handbook. Au(s) A = 9.152: a reproduction that prints 9.52 is 2.3× off and
 * leaves a jump at the melting point; 9.152 meets the liquid line there.
 */
export const EVAPORANTS = {
  Al: { name: "Aluminium", M: 26.982e-3, rho: 2700, Tm: 933, solid: [9.459, -17342, -0.7927], liquid: [5.911, -16211, 0] },
  Ag: { name: "Silver", M: 107.868e-3, rho: 10490, Tm: 1234, solid: [9.127, -14999, -0.7845], liquid: [5.752, -13827, 0] },
  Au: { name: "Gold", M: 196.967e-3, rho: 19300, Tm: 1337, solid: [9.152, -19343, -0.7479], liquid: [5.832, -18024, 0] },
  Cu: { name: "Copper", M: 63.546e-3, rho: 8960, Tm: 1358, solid: [9.123, -17748, -0.7317], liquid: [5.849, -16415, 0] },
  Ni: { name: "Nickel", M: 58.693e-3, rho: 8908, Tm: 1726, solid: [10.557, -22606, -0.8717], liquid: [6.666, -20765, 0] },
  Ti: { name: "Titanium", M: 47.867e-3, rho: 4506, Tm: 1930, solid: [11.925, -24991, -1.3376], liquid: [6.358, -22747, 0] },
  Pd: { name: "Palladium", M: 106.42e-3, rho: 12023, Tm: 1825, solid: [9.502, -19813, -0.9258], liquid: [5.426, -17899, 0] },
  In: { name: "Indium", M: 114.818e-3, rho: 7310, Tm: 429, solid: [5.991, -12548, 0], liquid: [5.374, -12276, 0] },
} as const satisfies Record<string, Evaporant>;

export type EvaporantId = keyof typeof EVAPORANTS;

/** Range of the fits: 10⁻¹⁵–10⁻³ atm, 298–2500 K (Alcock et al. 1984). */
export const FIT_P_MIN = 1e-15 * ATM;
export const FIT_P_MAX = 1e-3 * ATM;
export const FIT_T_MIN = 298;
export const FIT_T_MAX = 2500;

/**
 * Equilibrium vapour pressure (Pa) at T (K), solid fit below the melting point, liquid fit above.
 * NaN unless T > 0. The fit range (FIT_*) isn't enforced; check it with `inFitRange`.
 */
export function vapourPressure(ev: Evaporant, T: number): number {
  if (!(T > 0)) return NaN;
  const [A, B, C] = T < ev.Tm ? ev.solid : ev.liquid;
  return ATM * 10 ** (A + B / T + C * Math.log10(T));
}

/** True when T and p lie inside the range the fits were made for. */
export function inFitRange(T: number, p: number): boolean {
  return T >= FIT_T_MIN && T <= FIT_T_MAX && p >= FIT_P_MIN && p <= FIT_P_MAX;
}

/**
 * Hertz–Knudsen–Langmuir mass flux leaving the source (kg m⁻² s⁻¹) into vacuum:
 * Γ = α p √(M / (2π R T)) (Ohring ch. 3). NaN unless p ≥ 0, M, T > 0 and 0 < α ≤ 1.
 */
export function evaporationMassFlux(p: number, M: number, T: number, alpha = 1): number {
  if (!(p >= 0 && M > 0 && T > 0 && alpha > 0 && alpha <= 1)) return NaN;
  return alpha * p * Math.sqrt(M / (2 * Math.PI * R_gas * T));
}

/**
 * Growth rate (m/s) at the point of a parallel substrate straight above a small surface source of area
 * A_e at height h: the source emits Ṁ = Γ A_e with a cosine distribution, so the mass per area is
 * Ṁ cos φ cos θ / (π r²) = Ṁ / (π h²) there (Ohring ch. 3), and the thickness rate is Ṁ / (π ρ h²).
 * Sticking coefficient 1, film at bulk density ρ. NaN unless Γ ≥ 0 and A_e, ρ, h > 0.
 */
export function surfaceSourceRate(massFlux: number, sourceArea: number, rho: number, h: number): number {
  if (!(massFlux >= 0 && sourceArea > 0 && rho > 0 && h > 0)) return NaN;
  return (massFlux * sourceArea) / (Math.PI * rho * h * h);
}

/**
 * Thickness at radial offset l relative to the centre, surface source facing a parallel substrate at
 * height h: d/d₀ = 1 / (1 + (l/h)²)² (Ohring ch. 3). NaN unless l ≥ 0 and h > 0.
 */
export function surfaceSourceProfile(l: number, h: number): number {
  if (!(l >= 0 && h > 0)) return NaN;
  return 1 / (1 + (l / h) ** 2) ** 2;
}

/** Mean free path of air at room temperature, λ·P (m·Pa): 5×10⁻³ cm·torr (Ohring ch. 2). */
export const AIR_MFP_TIMES_P = 5e-3 * 1e-2 * TORR;

/** Mean free path (m) of the residual gas (air, room temperature) at pressure P (Pa). NaN unless P > 0. */
export function airMeanFreePath(P: number): number {
  if (!(P > 0)) return NaN;
  return AIR_MFP_TIMES_P / P;
}

/** Mean speed √(8RT / (πM)) (m/s) of the vapour molecules. NaN unless M, T > 0. */
export function meanSpeed(M: number, T: number): number {
  if (!(M > 0 && T > 0)) return NaN;
  return Math.sqrt((8 * R_gas * T) / (Math.PI * M));
}

/**
 * Movchan–Demchishin zone of a thick evaporated metal film from the homologous temperature T_s/T_m:
 * 1 below 0.3 (tapered columns, voided), 2 from 0.3 to 0.45 (dense columns), 3 above 0.45
 * (recrystallised, equiaxed grains) (Thornton 1977; Ohring ch. 9). Oxides switch lower (≈ 0.26).
 * NaN unless T_m > 0 and 0 ≤ T_s < T_m (no solid film at or above the melting point).
 */
export function structureZone(Ts: number, Tm: number): number {
  if (!(Ts >= 0 && Tm > 0)) return NaN;
  const x = Ts / Tm;
  if (x >= 1) return NaN;
  return x < 0.3 ? 1 : x < 0.45 ? 2 : 3;
}
