/**
 * Clear-air and aerosol extinction of a horizontal beam near sea level, from the meteorological visibility. SI units:
 * wavelengths and visibilities in m, extinction coefficients in 1/m (natural-log, "Np/m"). Model tier: textbook
 * approximation (empirical aerosol law; molecular absorption lines are not modelled).
 *
 * Rayleigh scattering of standard air (15 °C, 101 325 Pa):
 *   β_R = 24π³ (n² − 1)² F_K / (λ⁴ N_s (n² + 2)²)
 * with the Peck & Reeder index (n − 1)·10⁸ = 8060.51 + 2 480 990/(132.274 − σ²) + 17 455.7/(39.32957 − σ²), σ = 1/λ
 * in µm⁻¹ (JOSA 62, 958 (1972); fitted 0.23–1.69 µm, smooth beyond), N_s = p/(k_B T), and the King factor of air
 * F_K ≈ 1.048 (Bates 1984; 1.05 at 400 nm, 1.047 in the IR). This is A. Bucholtz, Appl. Opt. 34, 2765 (1995),
 * eqs. (2)–(4); at 550 nm it gives 1.15e-5 m⁻¹ (0.0115 km⁻¹).
 *
 * Visibility (Koschmieder, 2 % contrast threshold) fixes the total extinction at 550 nm: β(550 nm) = −ln(0.02)/V =
 * 3.912/V. The aerosol part, β(550 nm) − β_R(550 nm), scales as (λ/550 nm)^(−q) with Kim's exponent
 * q = 1.6 (V > 50 km), 1.3 (6–50 km), 0.16V + 0.34 (1–6 km), V − 0.5 (0.5–1 km), 0 (V < 0.5 km, fog), V in km
 * (I. I. Kim, B. McArthur, E. Korevaar, Proc. SPIE 4214, 26 (2001)). The law was fitted in the visible and near IR
 * (to 1.55 µm); it is a rough guide beyond.
 *
 * Attenuation in dB is 10 log₁₀(e) ≈ 4.343 times the extinction in nepers.
 */

import { k_B } from "../constants";

/** −ln(0.02): Koschmieder's constant for a 2 % contrast threshold. */
export const KOSCHMIEDER = -Math.log(0.02);
/** Reference wavelength of the visibility definition, m. */
export const VISIBILITY_WAVELENGTH = 550e-9;
/** dB per neper of power: 10 log₁₀(e). */
export const DB_PER_NEPER = 10 / Math.LN10;

const STANDARD_PRESSURE = 101325; // Pa
const STANDARD_TEMPERATURE = 288.15; // K
const KING_FACTOR_AIR = 1.048;

/** Refractive index of standard air (Peck & Reeder 1972), λ in m. */
export function standardAirIndex(lambda: number): number {
  const s2 = (1e-6 / lambda) ** 2; // σ² in µm⁻²
  return 1 + (8060.51 + 2480990 / (132.274 - s2) + 17455.7 / (39.32957 - s2)) * 1e-8;
}

/** Rayleigh scattering coefficient of standard sea-level air, 1/m. */
export function rayleighExtinction(lambda: number): number {
  const n2 = standardAirIndex(lambda) ** 2;
  const Ns = STANDARD_PRESSURE / (k_B * STANDARD_TEMPERATURE);
  return (24 * Math.PI ** 3 * ((n2 - 1) / (n2 + 2)) ** 2 * KING_FACTOR_AIR) / (lambda ** 4 * Ns);
}

/** Kim's size-distribution exponent q for a visibility V (m). */
export function kimExponent(visibility: number): number {
  const V = visibility / 1000; // km
  if (V > 50) return 1.6;
  if (V > 6) return 1.3;
  if (V > 1) return 0.16 * V + 0.34;
  if (V > 0.5) return V - 0.5;
  return 0;
}

/** Aerosol extinction (3.912/V − β_R(550 nm)) (λ/550 nm)^(−q), 1/m; zero above the Rayleigh visibility limit. */
export function aerosolExtinction(lambda: number, visibility: number): number {
  const at550 = Math.max(0, KOSCHMIEDER / visibility - rayleighExtinction(VISIBILITY_WAVELENGTH));
  return at550 * (lambda / VISIBILITY_WAVELENGTH) ** -kimExponent(visibility);
}

/** Total extinction (Rayleigh + aerosol), 1/m. */
export function totalExtinction(lambda: number, visibility: number): number {
  return rayleighExtinction(lambda) + aerosolExtinction(lambda, visibility);
}
