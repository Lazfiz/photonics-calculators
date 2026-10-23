/**
 * Polarizer types compared on vendor specifications, with the principal-transmittance algebra of an ideal
 * diattenuator. Model tier: exact algebra on catalogue minima; the specs are one vendor's product families.
 *
 * Specs: Thorlabs product-family pages (Specs, Overview and Damage Thresholds tabs), read 2026-10-23. Each row is one
 * representative family; the ER is the catalogue minimum ("> N:1") unless `erNote` says it is typical. Fields keep
 * the catalogue units, named with their unit (nm, mm, J/cm², W/cm).
 *
 * Algebra (Shurcliff, Polarized Light, 1962, ch. 3; `sheet-polarizer.ts`): k₁ and k₂ are the transmittances along the
 * pass and block axes, ER = k₁/k₂. Linear light aligned with the pass axis passes k₁, rotated 90° it passes k₂;
 * unpolarized light passes (k₁ + k₂)/2 with degree of polarization (k₁ − k₂)/(k₁ + k₂) = (ER − 1)/(ER + 1), the
 * diattenuation (Goldstein, Polarized Light, 3rd ed., ch. Mueller Matrices for Polarizing Components).
 */

export type PolarizerId =
  | "glan-taylor"
  | "glan-thompson"
  | "wollaston"
  | "rochon"
  | "wire-grid"
  | "film"
  | "plate"
  | "pbs-cube";

/** Pulsed laser-induced damage threshold and its test conditions. */
export interface PulsedLidt {
  fluence_J_cm2: number;
  lambda_nm: number;
  pulse_ns: number;
  rate_Hz: number;
}

/** CW damage threshold as a linear power density (power ÷ beam diameter) and its test wavelength. */
export interface CwLidt {
  linear_W_cm: number;
  lambda_nm: number;
}

export interface PolarizerSpec {
  name: string;
  /** Representative item and the product-family page it comes from. */
  item: string;
  url: string;
  material: string;
  lambdaMin_nm: number;
  lambdaMax_nm: number;
  /** Extinction ratio k₁/k₂ (linear). */
  er: number;
  erNote?: string;
  /** Clear aperture: side of a square or diameter of a circle, mm. */
  aperture_mm: number;
  apertureShape: "square" | "round";
  /** Pass-axis transmittance k₁ when the vendor states one (Tp for beamsplitters). */
  tPass?: number;
  /** Unpolarized transmittance (k₁ + k₂)/2 when that is what the vendor states (film polarizers). */
  tUnpolarized?: number;
  /** Polarized output beams: 2 for beamsplitting prisms and PBS. */
  outputs: 1 | 2;
  pulsed?: PulsedLidt;
  cw?: CwLidt;
}

export const POLARIZERS: Record<PolarizerId, PolarizerSpec> = {
  "glan-taylor": {
    name: "Glan-Taylor",
    item: "GT10 (uncoated)",
    url: "https://www.thorlabs.com/glan-taylor-calcite-polarizers",
    material: "Calcite, air-spaced",
    lambdaMin_nm: 350,
    lambdaMax_nm: 2300,
    er: 100_000,
    aperture_mm: 10,
    apertureShape: "square",
    outputs: 1,
    pulsed: { fluence_J_cm2: 20, lambda_nm: 1064, pulse_ns: 10, rate_Hz: 10 },
  },
  "glan-thompson": {
    name: "Glan-Thompson",
    item: "GTH10",
    url: "https://www.thorlabs.com/glan-thompson-polarizers",
    material: "Calcite, cemented",
    lambdaMin_nm: 350,
    lambdaMax_nm: 2300,
    er: 100_000,
    aperture_mm: 10,
    apertureShape: "square",
    outputs: 1,
    pulsed: { fluence_J_cm2: 2, lambda_nm: 1064, pulse_ns: 10, rate_Hz: 10 },
    cw: { linear_W_cm: 2000, lambda_nm: 1064 },
  },
  wollaston: {
    name: "Wollaston",
    item: "WP10 (uncoated)",
    url: "https://www.thorlabs.com/wollaston-prisms",
    material: "Calcite, cemented",
    lambdaMin_nm: 350,
    lambdaMax_nm: 2300,
    er: 100_000,
    aperture_mm: 10,
    apertureShape: "round",
    outputs: 2,
    pulsed: { fluence_J_cm2: 5, lambda_nm: 1064, pulse_ns: 10, rate_Hz: 10 },
    cw: { linear_W_cm: 100, lambda_nm: 1064 },
  },
  rochon: {
    name: "Rochon",
    item: "RPM10",
    url: "https://www.thorlabs.com/rochon-prisms",
    material: "MgF₂",
    lambdaMin_nm: 200,
    lambdaMax_nm: 6000,
    er: 10_000,
    aperture_mm: 10,
    apertureShape: "square",
    outputs: 2,
  },
  "wire-grid": {
    name: "Wire grid (holographic)",
    item: "WP25H-K",
    url: "https://www.thorlabs.com/holographic-wire-grid-polarizers",
    material: "Al grid on KRS-5",
    lambdaMin_nm: 2500,
    lambdaMax_nm: 30_000,
    er: 150,
    erNote: "typical: >150:1 at 3 µm, 300:1 at 15 µm",
    aperture_mm: 18,
    apertureShape: "round",
    outputs: 1,
  },
  film: {
    name: "Film (dichroic)",
    item: "LPVISE2X2",
    url: "https://www.thorlabs.com/economy-film-polarizers",
    material: "Dichroic triacetate film",
    lambdaMin_nm: 400,
    lambdaMax_nm: 700,
    er: 1000,
    erNote: ">1000:1 for 500–700 nm, >100:1 for 400–500 nm",
    aperture_mm: 50.8,
    apertureShape: "square",
    tUnpolarized: 0.38,
    outputs: 1,
  },
  plate: {
    name: "Thin-film plate",
    item: "PBSW-1064",
    url: "https://www.thorlabs.com/polarizing-plate-beamsplitters",
    material: "Dielectric coating on glass, 45°",
    lambdaMin_nm: 1064,
    lambdaMax_nm: 1064,
    er: 10_000,
    aperture_mm: 21.6,
    apertureShape: "round",
    tPass: 0.95,
    outputs: 2,
    pulsed: { fluence_J_cm2: 2, lambda_nm: 1054, pulse_ns: 10, rate_Hz: 10 },
    cw: { linear_W_cm: 1000, lambda_nm: 1070 },
  },
  "pbs-cube": {
    name: "PBS cube (broadband)",
    item: "PBS253",
    url: "https://www.thorlabs.com/broadband-polarizing-beamsplitter-cubes",
    material: "N-SF1, dielectric coating",
    lambdaMin_nm: 900,
    lambdaMax_nm: 1300,
    er: 1000,
    aperture_mm: 20.32,
    apertureShape: "square",
    tPass: 0.9,
    outputs: 2,
    pulsed: { fluence_J_cm2: 2, lambda_nm: 1064, pulse_ns: 10, rate_Hz: 10 },
    cw: { linear_W_cm: 1000, lambda_nm: 1070 },
  },
};

export const POLARIZER_IDS = Object.keys(POLARIZERS) as PolarizerId[];

export interface PolarizerFigures {
  /** 10 log₁₀ ER. */
  erDb: number;
  /** Degree of polarization of the light passed from an unpolarized input, (ER − 1)/(ER + 1). */
  dop: number;
  /** Pass- and block-axis transmittances; NaN when the vendor states no transmission. */
  k1: number;
  k2: number;
  /** Unpolarized transmittance (k₁ + k₂)/2; NaN when unknown. */
  tUnpolarized: number;
}

/** Figures of one spec. A stated unpolarized transmittance T gives k₁ = 2T/(1 + 1/ER). */
export function polarizerFigures(spec: PolarizerSpec): PolarizerFigures {
  const { er } = spec;
  if (!(er >= 1)) return { erDb: NaN, dop: NaN, k1: NaN, k2: NaN, tUnpolarized: NaN };
  const k1 =
    spec.tPass !== undefined ? spec.tPass : spec.tUnpolarized !== undefined ? (2 * spec.tUnpolarized) / (1 + 1 / er) : NaN;
  const k2 = k1 / er;
  return {
    erDb: 10 * Math.log10(er),
    dop: (er - 1) / (er + 1),
    k1,
    k2,
    tUnpolarized: (k1 + k2) / 2,
  };
}

/** Whether the catalogue wavelength range holds λ (m). A single-wavelength design holds it within ±1 %. */
export function coversWavelength(spec: PolarizerSpec, lambda: number): boolean {
  if (!(lambda > 0)) return false;
  const lambda_nm = lambda * 1e9;
  const lo = spec.lambdaMin_nm === spec.lambdaMax_nm ? spec.lambdaMin_nm * 0.99 : spec.lambdaMin_nm;
  const hi = spec.lambdaMin_nm === spec.lambdaMax_nm ? spec.lambdaMax_nm * 1.01 : spec.lambdaMax_nm;
  return lambda_nm >= lo && lambda_nm <= hi;
}
