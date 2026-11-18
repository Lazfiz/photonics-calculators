/**
 * Responsivity calculator summary: ℛ = η·q·λ/(h·c) (Saleh & Teich, Fundamentals of Photonics, 2nd ed., §18.1), the η = 1
 * limit, photons per watt and the photocurrent at a 1 mW signal. SI (m, A/W, A). Kept apart from `responsivity.ts`, which
 * other pages import.
 */

import { photonsPerJoule, responsivity } from "./responsivity";

/** Signal power for the photocurrent figure, W. */
export const RESPONSIVITY_REFERENCE_POWER = 1e-3;

export interface ResponsivitySummary {
  /** A/W. */
  responsivity: number;
  /** A/W at η = 1. */
  idealResponsivity: number;
  /** Photons per second per watt. */
  photonsPerWatt: number;
  /** Photocurrent at the reference power, A. */
  photocurrent: number;
}

export function responsivitySummary(quantumEfficiency: number, wavelength: number): ResponsivitySummary {
  const r = responsivity(quantumEfficiency, wavelength);
  return {
    responsivity: r,
    idealResponsivity: responsivity(1, wavelength),
    photonsPerWatt: photonsPerJoule(wavelength),
    photocurrent: r * RESPONSIVITY_REFERENCE_POWER,
  };
}
