/**
 * Physical constants, SI units. The only place a fundamental constant may be written as a literal.
 *
 * Exact: the 2019 SI defining constants (c, h, e, k_B, N_A; identical in CODATA 2018 and 2022)
 * and constants derived from them alone.
 * Measured: CODATA 2022, P. J. Mohr, D. B. Newell, B. N. Taylor & E. Tiesinga,
 * Rev. Mod. Phys. 97, 025002 (2025), https://physics.nist.gov/cuu/Constants/ .
 * The standard uncertainty in the last digits is given in parentheses.
 */

// ── Exact: SI defining constants ────────────────────────────────────────────────────────────

/** Speed of light in vacuum, m/s. */
export const c = 299792458;
/** Planck constant, J·s. */
export const h = 6.62607015e-34;
/** Elementary charge e, C. Named q so it can't be confused with Euler's number. */
export const q = 1.602176634e-19;
/** Boltzmann constant, J/K. */
export const k_B = 1.380649e-23;
/** Avogadro constant, 1/mol. */
export const N_A = 6.02214076e23;

// ── Exact: derived from the defining constants ──────────────────────────────────────────────

/** Reduced Planck constant ħ = h/2π, J·s. */
export const hbar = h / (2 * Math.PI);
/** One electronvolt, J. */
export const eV = q;
/** Molar gas constant R = N_A k_B, J/(mol·K). */
export const R_gas = N_A * k_B;
/** Faraday constant F = N_A e, C/mol. */
export const F_faraday = N_A * q;
/** Stefan–Boltzmann constant σ = 2π⁵k_B⁴ / (15 h³ c²), W/(m²·K⁴). */
export const sigma_SB = (2 * Math.PI ** 5 * k_B ** 4) / (15 * h ** 3 * c ** 2);
/** First radiation constant c₁ = 2πhc², W·m² (Planck's law M_λ = c₁ λ⁻⁵ / (e^(c₂/λT) − 1)). */
export const c1_radiation = 2 * Math.PI * h * c ** 2;
/** Second radiation constant c₂ = hc/k_B, m·K. */
export const c2_radiation = (h * c) / k_B;
/** Root of x = 5(1 − e^(−x)), which locates the peak of Planck's law in wavelength. */
export const WIEN_X = 4.965114231744276;
/** Wien wavelength displacement constant b = c₂ / x, m·K (λ_max T = b). */
export const b_Wien = c2_radiation / WIEN_X;

// ── Exact: unit-scaled, for pages that work in nm and eV ────────────────────────────────────
// Other scaled forms are converted where they are used: c * 100 (cm/s), b_Wien * 1e9 (nm·K), ….

/** hc in eV·nm: photon energy E[eV] = hc_eV_nm / λ[nm] (≈ 1239.84, often rounded to 1240). */
export const hc_eV_nm = ((h * c) / q) * 1e9;
/** Boltzmann constant in eV/K (≈ 8.617e-5), so k_B_eV·T is the thermal energy in eV. */
export const k_B_eV = k_B / q;

// ── Measured: CODATA 2022 ───────────────────────────────────────────────────────────────────

/** Fine-structure constant α (dimensionless), (11)e-13. */
export const alpha = 7.2973525643e-3;
/** Vacuum magnetic permeability μ₀, N/A², (20)e-17. */
export const mu_0 = 1.25663706127e-6;
/** Vacuum electric permittivity ε₀, F/m, (14)e-22. */
export const epsilon_0 = 8.8541878188e-12;
/** Characteristic impedance of vacuum Z₀ = μ₀c, Ω, (59)e-9. */
export const Z_0 = 376.730313412;
/** Electron mass, kg, (28)e-40. */
export const m_e = 9.1093837139e-31;
/** Proton mass, kg, (52)e-37. */
export const m_p = 1.67262192595e-27;
/** Atomic mass constant m_u = 1 Da, kg, (52)e-37. */
export const m_u = 1.66053906892e-27;
/** Bohr radius, m, (82)e-21. */
export const a_0 = 5.29177210544e-11;
/** Newtonian constant of gravitation, m³/(kg·s²), (15)e-15. */
export const G = 6.6743e-11;
