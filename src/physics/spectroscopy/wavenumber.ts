/**
 * Photon wavelength, wavenumber, frequency and energy. SI units: vacuum wavelength in m, wavenumber in 1/m
 * (1 cm⁻¹ = 100 m⁻¹), frequency in Hz, energy in J. Model tier: exact (ν̃ = 1/λ, f = c/λ, E = hc/λ; c and h are exact
 * in the 2019 SI). A wavelength measured in air is shorter by the refractive index of air: convert it to vacuum first.
 */
import { c, h } from "../constants";

export interface PhotonQuantities {
  wavelength: number;
  wavenumber: number;
  frequency: number;
  energy: number;
}

/** All four quantities from a vacuum wavelength (m). NaN fields unless λ > 0 and finite. */
export function photonFromWavelength(wavelength: number): PhotonQuantities {
  if (!(wavelength > 0 && Number.isFinite(wavelength))) return { wavelength: NaN, wavenumber: NaN, frequency: NaN, energy: NaN };
  return { wavelength, wavenumber: 1 / wavelength, frequency: c / wavelength, energy: (h * c) / wavelength };
}

/**
 * Wavelength width Δλ = λ²Δν/c of a narrow band Δν (Hz) centred on vacuum wavelength λ (m), from |dλ/dν| = λ²/c;
 * first order in Δν/ν, m. NaN unless λ > 0 and both are finite.
 */
export function wavelengthWidth(wavelength: number, dNu: number): number {
  if (!(wavelength > 0 && Number.isFinite(wavelength * dNu))) return NaN;
  return (wavelength * wavelength * dNu) / c;
}

/** Frequency width Δν = cΔλ/λ² of a narrow band Δλ (m) at vacuum wavelength λ (m), Hz: the inverse of the above. */
export function frequencyWidth(wavelength: number, dLambda: number): number {
  if (!(wavelength > 0 && Number.isFinite(wavelength * dLambda))) return NaN;
  return (c * dLambda) / (wavelength * wavelength);
}

/** All four quantities from a wavenumber (1/m). NaN fields unless ν̃ > 0 and finite. */
export function photonFromWavenumber(wavenumber: number): PhotonQuantities {
  if (!(wavenumber > 0 && Number.isFinite(wavenumber))) return photonFromWavelength(NaN);
  return { wavelength: 1 / wavenumber, wavenumber, frequency: c * wavenumber, energy: h * c * wavenumber };
}
