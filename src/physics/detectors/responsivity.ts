/**
 * Responsivity and quantum efficiency of a photodetector. SI units: m, A/W. Invalid inputs give NaN.
 *
 * ℛ = η·q·λ/(h·c): each absorbed photon of energy h·c/λ gives η electrons. E. L. Dereniak, G. D. Boreman, Infrared
 * Detectors and Systems (Wiley 1996), ch. 5; S. M. Sze, K. K. Ng, Physics of Semiconductor Devices, 3rd ed. (Wiley
 * 2007), ch. 13. Without internal gain η ≤ 1, so a responsivity above q·λ/(h·c) (1.2398 µm·A/W per µm) is unphysical.
 */

import { c, h, q } from "../constants";

/** Responsivity η·q·λ/(h·c) of a detector with quantum efficiency η at wavelength λ (m), A/W. */
export function responsivity(qe: number, wavelength: number): number {
  if (!(qe >= 0) || !(wavelength > 0)) return NaN;
  return (qe * q * wavelength) / (h * c);
}

/** Quantum efficiency ℛ·h·c/(q·λ) implied by a responsivity ℛ (A/W) at λ (m). Values above 1 need internal gain. */
export function quantumEfficiencyFromResponsivity(responsivityAW: number, wavelength: number): number {
  if (!(responsivityAW >= 0) || !(wavelength > 0)) return NaN;
  return (responsivityAW * h * c) / (q * wavelength);
}

/** Photon rate per watt λ/(h·c) at λ (m), photons/s per W. */
export function photonsPerJoule(wavelength: number): number {
  if (!(wavelength > 0)) return NaN;
  return wavelength / (h * c);
}
