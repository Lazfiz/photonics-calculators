/**
 * High-harmonic generation in a gas and the attosecond pulses it supports (three-step model).
 * SI units: intensity in W/m², wavelength in m, energies in J, times in s. Model tier: textbook.
 *
 * - Ponderomotive energy U_p = e²E₀²/(4mω²) = e²I/(2ε₀ c m ω²) for linear polarization, I = ε₀cE₀²/2.
 * - Cutoff photon energy E_c = I_p + 3.17 U_p (Krause, Schafer & Kulander 1992, Phys. Rev. Lett. 68, 3535; Corkum 1993,
 *   Phys. Rev. Lett. 71, 1994). Quantum corrections raise I_p's weight to about 1.32 (Lewenstein et al. 1994).
 * - A multi-cycle driver emits a burst every half cycle T₀/2, so the spectrum holds odd harmonics q ħω, 2ħω apart.
 * - Barrier-suppression intensity I_BS = ε₀c F²/2 with F = πε₀I_p²/(Z e³) (Augst et al. 1989, Phys. Rev. Lett. 63, 2212):
 *   above it the atom ionizes within a cycle and the cutoff formula overstates what is reached.
 * - Fourier limit of a Gaussian spectrum of FWHM ΔE: τ = (2 ln2/π) h/ΔE. The attochirp makes real pulses longer.
 */

import { c, epsilon_0, h, m_e, q } from "../constants";

/** Cutoff law coefficient, E_c = I_p + 3.17 U_p (Corkum 1993). */
export const CUTOFF_UP = 3.17;

/** First ionization energies, eV (NIST Atomic Spectra Database, Ionization Energies). */
export const IONIZATION_ENERGY_EV = {
  xenon: 12.1298,
  krypton: 13.9996,
  hydrogen: 13.5984,
  argon: 15.7596,
  neon: 21.5645,
  helium: 24.5874,
} as const;

export type HhgGas = keyof typeof IONIZATION_ENERGY_EV;

/** Ponderomotive energy U_p, J, at intensity I (W/m²) and wavelength λ (m). NaN for I < 0 or λ ≤ 0. */
export function ponderomotiveEnergy(intensity: number, lambda: number): number {
  if (!(intensity >= 0 && lambda > 0 && Number.isFinite(intensity) && Number.isFinite(lambda))) return NaN;
  const omega = (2 * Math.PI * c) / lambda;
  return (q ** 2 * intensity) / (2 * epsilon_0 * c * m_e * omega ** 2);
}

/** Cutoff photon energy E_c = I_p + 3.17 U_p, J. */
export function hhgCutoff(ionization: number, up: number): number {
  return ionization + CUTOFF_UP * up;
}

/** Highest odd harmonic order q with q ħω ≤ E_c; 0 when not even the first harmonic fits. */
export function highestOddHarmonic(cutoff: number, photonEnergy: number): number {
  if (!(cutoff > 0 && photonEnergy > 0)) return 0;
  const qMax = Math.floor(cutoff / photonEnergy + 1e-9);
  return qMax < 1 ? 0 : qMax % 2 === 1 ? qMax : qMax - 1;
}

/** Barrier-suppression intensity, W/m², for ionization energy I_p (J) and ion charge Z (1 for neutral atoms). */
export function barrierSuppressionIntensity(ionization: number, Z = 1): number {
  if (!(ionization > 0 && Z > 0)) return NaN;
  const field = (Math.PI * epsilon_0 * ionization ** 2) / (Z * q ** 3);
  return 0.5 * epsilon_0 * c * field ** 2;
}

/** Fourier-limited intensity FWHM, s, of a Gaussian spectrum of photon-energy FWHM ΔE (J). NaN for ΔE ≤ 0. */
export function fourierLimitDuration(bandwidth: number): number {
  if (!(bandwidth > 0 && Number.isFinite(bandwidth))) return NaN;
  return ((2 * Math.LN2) / Math.PI) * (h / bandwidth);
}
