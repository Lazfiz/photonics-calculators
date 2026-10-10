/**
 * Metal-containing coatings in the thermal picture: a coated pane's luminous and solar transmittance and
 * reflectance, and the normal thermal emittance of a coated, opaque surface. SI units: wavelengths in m,
 * temperatures in K.
 *
 * Layers are metals or dielectrics with a constant, real index. Metals: Ag from Yang et al. (2015) data with a Drude
 * continuation beyond 24.92 µm (../materials/silver.ts); Al and Cr from the Rakić et al. (1998) Lorentz–Drude model
 * (../materials/lorentz-drude.ts). Each wavelength gets its own transfer-matrix stack (./transfer-matrix.ts).
 *
 * Pane (glazing): the coated face and the bare back face of a lossless glass sheet of index n_g, added
 * incoherently (the sheet is mm thick). With the coating's R_f, T_f from the air side, R_f′ from the glass side
 * (T_f′ = T_f by reciprocity), and the back face's R_b = ((n_g − 1)/(n_g + 1))², T_b = 1 − R_b:
 *   T = T_f T_b / (1 − R_f′ R_b),   R = R_f + T_f² R_b / (1 − R_f′ R_b)
 * (Macleod, Thin-Film Optical Filters, 4th ed., ch. 2, incoherent substrate). Luminous values weight with
 * D65 × V(λ) over 380–780 nm (../cie-photometry.ts, as ISO 9050 and EN 410 define τ_v, ρ_v), solar ones with the
 * ASTM G173 global tilt spectrum over 280–4000 nm (../astm-g173.ts; the standards use other AM1.5 tables).
 *
 * Emittance (Kirchhoff): at each wavelength and direction, emittance equals absorptance. For an opaque substrate
 * (one that absorbs whatever the coating transmits into it, as window glass does in the thermal IR and any thick metal does) the
 * absorptance of coating plus substrate is 1 − R, so ε(λ) = 1 − R(λ) at normal incidence, and the total normal
 * emittance at temperature T is the Planck-weighted mean of ε(λ) over a band (../blackbody.ts). The substrate is
 * treated as semi-infinite: valid only if it is opaque. Hemispherical emittance (what heat-loss figures use) differs:
 * EN 12898 converts normal to hemispherical emittance with a correction factor; this module doesn't.
 * Model tier: textbook approximation (constant dielectric indices, no glass absorption, metal data for bulk-like
 * films).
 */
import { solarWeightedMean } from "../astm-g173";
import { planckWeightedMean } from "../blackbody";
import { luminousWeightedMean } from "../cie-photometry";
import { rakicIndex } from "../materials/lorentz-drude";
import { silverIndex } from "../materials/silver";
import { stackResponse, type Layer, type Medium, type StackResponse } from "./transfer-matrix";

export type Metal = "Ag" | "Al" | "Cr";
export type CoatingMaterial = Metal | "dielectric";

/** n + iκ of a metal at a vacuum wavelength (m): Ag tabulated (NaN below 0.27 µm), Al and Cr Lorentz–Drude. */
export function metalIndex(metal: Metal, wavelength: number): { n: number; k: number } {
  return metal === "Ag" ? silverIndex(wavelength) : rakicIndex(metal, wavelength);
}

export interface CoatingLayer {
  material: CoatingMaterial;
  /** Index of a dielectric layer (ignored for metals). */
  n?: number;
  /** Physical thickness, m. */
  thickness: number;
}

export type Substrate = { material: "dielectric"; n: number; k?: number } | { material: Metal };

function mediumAt(material: CoatingMaterial, n: number | undefined, k: number | undefined, wavelength: number): Medium {
  return material === "dielectric" ? { n: n ?? NaN, k: k ?? 0 } : metalIndex(material, wavelength);
}

/** The coating's layers at one wavelength. */
export function layersAt(coating: readonly CoatingLayer[], wavelength: number): Layer[] {
  return coating.map((l) => ({ ...mediumAt(l.material, l.n, 0, wavelength), thickness: l.thickness }));
}

function substrateAt(s: Substrate, wavelength: number): Medium {
  return s.material === "dielectric" ? { n: s.n, k: s.k ?? 0 } : metalIndex(s.material, wavelength);
}

/** R, T, A of the coating on a semi-infinite substrate, light from a lossless incident medium (default air). */
export function coatingResponse(coating: readonly CoatingLayer[], substrate: Substrate, wavelength: number, incident = 1): StackResponse {
  return stackResponse({ incident, layers: layersAt(coating, wavelength), substrate: substrateAt(substrate, wavelength) }, wavelength);
}

/** Normal spectral emittance 1 − R of a coated opaque substrate. */
export function opaqueEmittance(coating: readonly CoatingLayer[], substrate: Substrate, wavelength: number): number {
  return 1 - coatingResponse(coating, substrate, wavelength).R;
}

/** Total normal emittance: Planck-weighted mean of 1 − R over [λ₁, λ₂] at temperature T. */
export function totalNormalEmittance(
  coating: readonly CoatingLayer[],
  substrate: Substrate,
  temperature: number,
  lambda1: number,
  lambda2: number,
  intervals = 300,
): number {
  return planckWeightedMean((lam) => opaqueEmittance(coating, substrate, lam), temperature, lambda1, lambda2, intervals);
}

/** R and T of a lossless glass sheet (index nGlass) coated on the front face, light incident on the coating. */
export function paneResponse(coating: readonly CoatingLayer[], nGlass: number, wavelength: number): { R: number; T: number } {
  if (!(nGlass > 0)) return { R: NaN, T: NaN };
  const layers = layersAt(coating, wavelength);
  const front = stackResponse({ incident: 1, layers, substrate: { n: nGlass } }, wavelength);
  const fromGlass = stackResponse({ incident: nGlass, layers: layers.slice().reverse(), substrate: { n: 1 } }, wavelength);
  const Rb = ((nGlass - 1) / (nGlass + 1)) ** 2;
  const den = 1 - fromGlass.R * Rb;
  return { R: front.R + (front.T * front.T * Rb) / den, T: (front.T * (1 - Rb)) / den };
}

export interface GlazingPerformance {
  /** Luminous transmittance and reflectance (D65, photopic), coated side facing the light. */
  Tvis: number;
  Rvis: number;
  /** Solar transmittance and reflectance (ASTM G173 global tilt, 280–4000 nm). */
  Tsol: number;
  Rsol: number;
  /** Total normal emittance of the coated face (glass taken as opaque), Planck-weighted at `temperature`. */
  emittance: number;
}

export function glazingPerformance(
  coating: readonly CoatingLayer[],
  nGlass: number,
  temperature = 300,
  band: readonly [number, number] = [2.5e-6, 50e-6],
): GlazingPerformance {
  const pane = (lam: number) => paneResponse(coating, nGlass, lam);
  return {
    Tvis: luminousWeightedMean((lam) => pane(lam).T),
    Rvis: luminousWeightedMean((lam) => pane(lam).R),
    Tsol: solarWeightedMean((lam) => pane(lam).T),
    Rsol: solarWeightedMean((lam) => pane(lam).R),
    emittance: totalNormalEmittance(coating, { material: "dielectric", n: nGlass }, temperature, band[0], band[1]),
  };
}
