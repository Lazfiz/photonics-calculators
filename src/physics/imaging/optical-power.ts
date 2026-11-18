/**
 * Optical-power page summary: lens power P = 1/f and the two-element (Gullstrand) eye with its refraction.
 * SI in and out (m, dioptres = 1/m). Built on gaussian-optics.ts, which has importers on other pages, so this module
 * is separate. Equations: J. E. Greivenkamp, Field Guide to Geometrical Optics (SPIE 2004, doi:10.1117/3.547461),
 * "Two-lens systems": φ = φ₁ + φ₂ − (t/n)φ₁φ₂; eye refraction and spectacle correction K/(1 + dK): D. A. Atchison,
 * G. Smith, Optics of the Human Eye (Butterworth-Heinemann 2000), "Paraxial schematic eyes" pp. 39-47
 * (doi:10.1016/b978-0-7506-3775-6.50009-2) and "Refractive anomalies" pp. 57-66 (doi:10.1016/b978-0-7506-3775-6.50011-0).
 */

import { emmetropicAxialLength, ocularRefraction, opticalPower, spectacleCorrection, twoElementPower } from "./gaussian-optics";

/** Smallest |f| the page accepts as a lens, 0.1 mm. */
export const MIN_LENS_FOCAL_LENGTH = 1e-4;

/** |K| below this (dioptres) counts as emmetropic on the page. */
export const EMMETROPIC_LIMIT = 0.25;

export interface OpticalPowerSummary {
  /** Power of the single lens, 1/f, D; NaN for |f| below 0.1 mm. */
  lensPower: number;
  /** Eye power φ, D. */
  eyePower: number;
  /** Eye focal length in air 1/φ, m. */
  focalAir: number;
  /** Eye focal length in the eye n/φ, m. */
  focalEye: number;
  /** Axial length at which the eye is emmetropic, m. */
  emmetropicLength: number;
  /** Refraction at the cornea K (contact-lens correction), D. */
  refraction: number;
  /** Spectacle correction at the vertex distance, D. */
  spectacle: number;
  /** dK/dL, D per m of axial length. */
  dKdL: number;
  state: "" | "emmetropic" | "myopic" | "hyperopic";
}

/** Lens power and the two-element eye; powers in D, lengths in m. */
export function opticalPowerSummary(
  f: number, phi1: number, phi2: number, t: number, n: number, L: number, vertex: number,
): OpticalPowerSummary {
  const eyePower = twoElementPower(phi1, phi2, t, n);
  const K = ocularRefraction(phi1, phi2, t, n, L);
  // Analytic dK/dL of the trace-back K = V₁ − φ₁: dK/dV₂ = 1/(1 + (t/n)V₂)² and dV₂/dL = −n/(L − t)².
  const V2 = n / (L - t) - phi2;
  const dKdL = Number.isFinite(K) ? -n / ((L - t) ** 2 * (1 + (t / n) * V2) ** 2) : NaN;
  return {
    lensPower: Math.abs(f) < MIN_LENS_FOCAL_LENGTH ? NaN : opticalPower(f),
    eyePower,
    focalAir: 1 / eyePower,
    focalEye: n / eyePower,
    emmetropicLength: emmetropicAxialLength(phi1, phi2, t, n),
    refraction: K,
    spectacle: spectacleCorrection(K, vertex),
    dKdL,
    state: !Number.isFinite(K) ? "" : Math.abs(K) < EMMETROPIC_LIMIT ? "emmetropic" : K < 0 ? "myopic" : "hyperopic",
  };
}
